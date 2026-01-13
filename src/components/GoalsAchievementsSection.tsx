import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { goalService, DailyGoal, GoalStats } from '../services/goal.service';
import { achievementService, Achievement } from '../services/achievement.service';

interface GoalsAchievementsSectionProps {
    onGoalCompleted?: (goal: DailyGoal) => void;
    onAchievementUnlocked?: (achievement: Achievement) => void;
}

/**
 * Goals & Achievements Section
 * - Daily goals with completion tracking
 * - Auto-generated achievements
 * - Goals reset daily, past goals read-only
 */
export const GoalsAchievementsSection: React.FC<GoalsAchievementsSectionProps> = ({
    onGoalCompleted,
    onAchievementUnlocked,
}) => {
    const [goals, setGoals] = useState<DailyGoal[]>([]);
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [newGoalText, setNewGoalText] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState<GoalStats>({ total: 0, completed: 0, percentage: 0, pending: 0 });

    const today = new Date().toISOString().split('T')[0];
    const isToday = (date: string) => date === today;

    /**
     * Load goals and achievements on mount
     */
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [todayGoals, recentAchievements, goalStats] = await Promise.all([
                goalService.getTodayGoals(),
                achievementService.getRecentAchievements(5),
                goalService.getGoalStats(),
            ]);

            setGoals(todayGoals);
            setAchievements(recentAchievements);
            setStats(goalStats);
        } catch (error) {
            console.error('Error loading data:', error);
            Alert.alert('Error', 'Failed to load data. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Add a new goal
     */
    const handleAddGoal = async () => {
        const trimmed = newGoalText.trim();
        if (!trimmed) {
            Alert.alert('Empty Goal', 'Please enter a goal title.');
            return;
        }

        if (trimmed.length > 100) {
            Alert.alert('Too Long', 'Goal title must be 100 characters or less.');
            return;
        }

        try {
            const newGoal = await goalService.createGoal(trimmed);
            setGoals([...goals, newGoal]);
            setNewGoalText('');

            // Update stats
            const updatedStats = await goalService.getGoalStats();
            setStats(updatedStats);
        } catch (error) {
            console.error('Error adding goal:', error);
            Alert.alert('Error', 'Failed to add goal. Please try again.');
        }
    };

    /**
     * Toggle goal completion
     */
    const handleToggleGoal = async (goalId: number) => {
        const goal = goals.find((g) => g.id === goalId);
        if (!goal || !isToday(goal.date)) {
            Alert.alert('Read-Only', 'You can only edit today\'s goals.');
            return;
        }

        try {
            const updated = await goalService.updateGoal(goalId, { completed: !goal.completed });
            if (updated) {
                const updatedGoals = goals.map((g) => (g.id === goalId ? updated : g));
                setGoals(updatedGoals);

                // Update stats
                const updatedStats = await goalService.getGoalStats();
                setStats(updatedStats);

                // If goal was completed, reload achievements
                if (updated.completed) {
                    const recentAchievements = await achievementService.getRecentAchievements(5);
                    setAchievements(recentAchievements);

                    if (onGoalCompleted) {
                        onGoalCompleted(updated);
                    }

                    // Show celebration
                    Alert.alert('🎉 Goal Completed!', `Great job on "${updated.title}"!`);
                }
            }
        } catch (error) {
            console.error('Error toggling goal:', error);
            Alert.alert('Error', 'Failed to update goal. Please try again.');
        }
    };

    /**
     * Delete a goal (only completed goals can be deleted)
     */
    const handleDeleteGoal = (goalId: number) => {
        const goal = goals.find((g) => g.id === goalId);
        if (!goal) {
            return;
        }

        if (!isToday(goal.date)) {
            Alert.alert('Read-Only', 'You can only delete today\'s goals.');
            return;
        }

        if (!goal.completed) {
            Alert.alert('Cannot Delete', 'Only completed goals can be deleted. Please complete the goal first.');
            return;
        }

        Alert.alert(
            'Delete Goal',
            'Are you sure you want to delete this completed goal?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await goalService.deleteGoal(goalId);
                            setGoals(goals.filter((g) => g.id !== goalId));

                            // Update stats
                            const updatedStats = await goalService.getGoalStats();
                            setStats(updatedStats);

                            Alert.alert('Success', 'Goal deleted successfully!');
                        } catch (error: any) {
                            console.error('Error deleting goal:', error);
                            const errorMessage = error?.message || 'Failed to delete goal. Please try again.';
                            Alert.alert('Error', errorMessage);
                        }
                    },
                },
            ]
        );
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6C63FF" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Goals Card */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>🎯 Goals</Text>
                    {stats.total > 0 && (
                        <View style={styles.statsBadge}>
                            <Text style={styles.statsText}>
                                {stats.completed}/{stats.total} ({stats.percentage}%)
                            </Text>
                        </View>
                    )}
                </View>

                {/* Add Goal Input */}
                <View style={styles.addGoalContainer}>
                    <TextInput
                        style={styles.goalInput}
                        value={newGoalText}
                        onChangeText={setNewGoalText}
                        placeholder="Add a goal for today..."
                        placeholderTextColor="#999"
                        maxLength={100}
                        onSubmitEditing={handleAddGoal}
                        returnKeyType="done"
                    />
                    <TouchableOpacity
                        style={[styles.addButton, !newGoalText.trim() && styles.addButtonDisabled]}
                        onPress={handleAddGoal}
                        disabled={!newGoalText.trim()}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.addButtonText}>+</Text>
                    </TouchableOpacity>
                </View>

                {/* Goals List */}
                {goals.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No goals yet. Add one above! ✨</Text>
                    </View>
                ) : (
                    <FlatList
                        data={goals}
                        keyExtractor={(item) => item.id.toString()}
                        scrollEnabled={false}
                        renderItem={({ item }) => (
                            <View style={styles.goalItem}>
                                <TouchableOpacity
                                    style={styles.checkbox}
                                    onPress={() => handleToggleGoal(item.id)}
                                    activeOpacity={0.7}
                                >
                                    {item.completed ? (
                                        <View style={styles.checkboxChecked}>
                                            <Text style={styles.checkmark}>✓</Text>
                                        </View>
                                    ) : (
                                        <View style={styles.checkboxUnchecked} />
                                    )}
                                </TouchableOpacity>

                                <Text
                                    style={[styles.goalText, item.completed && styles.goalTextCompleted]}
                                    numberOfLines={2}
                                >
                                    {item.title}
                                </Text>

                                {/* Only show delete button for completed goals */}
                                {item.completed && isToday(item.date) && (
                                    <TouchableOpacity
                                        style={styles.deleteButton}
                                        onPress={() => handleDeleteGoal(item.id)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.deleteButtonText}>×</Text>
                                    </TouchableOpacity>
                                )}

                                {/* Show empty space for incomplete goals to maintain layout */}
                                {!item.completed && (
                                    <View style={styles.deleteButtonPlaceholder} />
                                )}
                            </View>
                        )}
                    />
                )}

                {/* Progress Bar */}
                {stats.total > 0 && (
                    <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${stats.percentage}%` }]} />
                        </View>
                    </View>
                )}
            </View>

            {/* Achievements Card */}
            <View style={[styles.card, styles.achievementsCard]}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>🏆 Achievements</Text>
                    {achievements.length > 0 && (
                        <View style={styles.achievementBadge}>
                            <Text style={styles.achievementBadgeText}>{achievements.length}</Text>
                        </View>
                    )}
                </View>

                {achievements.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>
                            Complete goals to unlock achievements! 🌟
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={achievements}
                        keyExtractor={(item) => item.id.toString()}
                        scrollEnabled={false}
                        renderItem={({ item }) => (
                            <View style={styles.achievementItem}>
                                <View style={styles.achievementIcon}>
                                    <Text style={styles.achievementEmoji}>
                                        {getAchievementEmoji(item.type)}
                                    </Text>
                                </View>
                                <View style={styles.achievementContent}>
                                    <Text style={styles.achievementTitle}>{item.title}</Text>
                                    <Text style={styles.achievementDescription} numberOfLines={2}>
                                        {item.description}
                                    </Text>
                                    <Text style={styles.achievementDate}>
                                        {formatDate(item.date)}
                                    </Text>
                                </View>
                            </View>
                        )}
                    />
                )}
            </View>
        </View>
    );
};

/**
 * Get emoji for achievement type
 */
const getAchievementEmoji = (type: Achievement['type']): string => {
    switch (type) {
        case 'goal_completed':
            return '✅';
        case 'streak':
            return '🔥';
        case 'milestone':
            return '🏆';
        default:
            return '⭐';
    }
};

/**
 * Format date to readable string
 */
const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateStr === today.toISOString().split('T')[0]) {
        return 'Today';
    } else if (dateStr === yesterday.toISOString().split('T')[0]) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });
    }
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16,
        marginVertical: 8,
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },
    achievementsCard: {
        backgroundColor: '#FFF9F0',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    statsBadge: {
        backgroundColor: '#E8F4FD',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statsText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2C5F8D',
    },
    achievementBadge: {
        backgroundColor: '#FFE5CC',
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    achievementBadgeText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#CC6600',
    },
    addGoalContainer: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    goalInput: {
        flex: 1,
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 15,
        color: '#1A1A1A',
        borderWidth: 1,
        borderColor: '#E9ECEF',
    },
    addButton: {
        backgroundColor: '#6C63FF',
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    addButtonDisabled: {
        backgroundColor: '#CED4DA',
    },
    addButtonText: {
        fontSize: 28,
        fontWeight: '300',
        color: '#FFFFFF',
    },
    emptyState: {
        paddingVertical: 24,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 15,
        color: '#6C757D',
        textAlign: 'center',
    },
    goalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F3F5',
    },
    checkbox: {
        marginRight: 12,
    },
    checkboxUnchecked: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#CED4DA',
    },
    checkboxChecked: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#28A745',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkmark: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    goalText: {
        flex: 1,
        fontSize: 16,
        color: '#1A1A1A',
        lineHeight: 22,
    },
    goalTextCompleted: {
        color: '#6C757D',
        textDecorationLine: 'line-through',
    },
    deleteButton: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    deleteButtonText: {
        fontSize: 28,
        fontWeight: '300',
        color: '#DC3545',
    },
    deleteButtonPlaceholder: {
        width: 32,
        height: 32,
        marginLeft: 8,
    },
    progressContainer: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F1F3F5',
    },
    progressBar: {
        height: 8,
        backgroundColor: '#E9ECEF',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#28A745',
        borderRadius: 4,
    },
    achievementItem: {
        flexDirection: 'row',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#FFE5CC',
    },
    achievementIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    achievementEmoji: {
        fontSize: 24,
    },
    achievementContent: {
        flex: 1,
    },
    achievementTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 4,
    },
    achievementDescription: {
        fontSize: 14,
        color: '#6C757D',
        lineHeight: 20,
        marginBottom: 4,
    },
    achievementDate: {
        fontSize: 12,
        fontWeight: '500',
        color: '#CC6600',
    },
});
