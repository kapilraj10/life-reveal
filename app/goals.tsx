import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Modal,
} from 'react-native';
import { router } from 'expo-router';

interface Goal {
    id: string;
    title: string;
    description: string;
    progress: number;
    completed: boolean;
}

export default function GoalsScreen() {
    const [goals, setGoals] = useState<Goal[]>([
        {
            id: '1',
            title: 'Improve Physical Fitness',
            description: 'Exercise 3 times per week',
            progress: 60,
            completed: false,
        },
        {
            id: '2',
            title: 'Learn New Skill',
            description: 'Complete online course',
            progress: 30,
            completed: false,
        },
    ]);
    const [modalVisible, setModalVisible] = useState(false);
    const [newGoalTitle, setNewGoalTitle] = useState('');
    const [newGoalDescription, setNewGoalDescription] = useState('');

    const handleAddGoal = () => {
        if (newGoalTitle.trim()) {
            const newGoal: Goal = {
                id: Date.now().toString(),
                title: newGoalTitle,
                description: newGoalDescription,
                progress: 0,
                completed: false,
            };
            setGoals([...goals, newGoal]);
            setNewGoalTitle('');
            setNewGoalDescription('');
            setModalVisible(false);
        }
    };

    const handleToggleComplete = (goalId: string) => {
        setGoals(
            goals.map((goal) =>
                goal.id === goalId
                    ? { ...goal, completed: !goal.completed, progress: goal.completed ? 0 : 100 }
                    : goal
            )
        );
    };

    const handleDeleteGoal = (goalId: string) => {
        setGoals(goals.filter((goal) => goal.id !== goalId));
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Goals & Achievements</Text>
                <Text style={styles.headerSubtitle}>Track your progress</Text>
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.statsCard}>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{goals.length}</Text>
                        <Text style={styles.statLabel}>Total Goals</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>
                            {goals.filter((g) => g.completed).length}
                        </Text>
                        <Text style={styles.statLabel}>Completed</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>
                            {goals.filter((g) => !g.completed).length}
                        </Text>
                        <Text style={styles.statLabel}>In Progress</Text>
                    </View>
                </View>

                {goals.map((goal) => (
                    <View key={goal.id} style={styles.goalCard}>
                        <View style={styles.goalHeader}>
                            <Text style={[styles.goalTitle, goal.completed && styles.completedText]}>
                                {goal.title}
                            </Text>
                            <TouchableOpacity onPress={() => handleDeleteGoal(goal.id)}>
                                <Text style={styles.deleteButton}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.goalDescription}>{goal.description}</Text>

                        <View style={styles.progressContainer}>
                            <View style={styles.progressBar}>
                                <View
                                    style={[styles.progressFill, { width: `${goal.progress}%` }]}
                                />
                            </View>
                            <Text style={styles.progressText}>{goal.progress}%</Text>
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.completeButton,
                                goal.completed && styles.completeButtonActive,
                            ]}
                            onPress={() => handleToggleComplete(goal.id)}
                        >
                            <Text
                                style={[
                                    styles.completeButtonText,
                                    goal.completed && styles.completeButtonTextActive,
                                ]}
                            >
                                {goal.completed ? '✓ Completed' : 'Mark Complete'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                ))}

                {goals.length === 0 && (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateEmoji}>🎯</Text>
                        <Text style={styles.emptyStateText}>No goals yet</Text>
                        <Text style={styles.emptyStateSubtext}>
                            Start setting meaningful goals to track your progress
                        </Text>
                    </View>
                )}
            </ScrollView>

            <TouchableOpacity
                style={styles.addButton}
                onPress={() => setModalVisible(true)}
            >
                <Text style={styles.addButtonText}>+ Add New Goal</Text>
            </TouchableOpacity>

            {/* Add Goal Modal */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Create New Goal</Text>

                        <Text style={styles.inputLabel}>Goal Title</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., Learn Spanish"
                            value={newGoalTitle}
                            onChangeText={setNewGoalTitle}
                            placeholderTextColor="#999"
                        />

                        <Text style={styles.inputLabel}>Description</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="What do you want to achieve?"
                            value={newGoalDescription}
                            onChangeText={setNewGoalDescription}
                            multiline
                            numberOfLines={4}
                            placeholderTextColor="#999"
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.saveModalButton]}
                                onPress={handleAddGoal}
                            >
                                <Text style={styles.saveModalButtonText}>Create Goal</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        backgroundColor: '#007AFF',
        padding: 24,
        paddingTop: 60,
        paddingBottom: 30,
    },
    backButton: {
        marginBottom: 12,
    },
    backButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    statsCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-around',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#007AFF',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
    },
    goalCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    goalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    goalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a1a1a',
        flex: 1,
    },
    completedText: {
        textDecorationLine: 'line-through',
        color: '#999',
    },
    deleteButton: {
        fontSize: 20,
        color: '#ff3b30',
        padding: 4,
    },
    goalDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    progressBar: {
        flex: 1,
        height: 8,
        backgroundColor: '#e0e0e0',
        borderRadius: 4,
        marginRight: 12,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#34c759',
        borderRadius: 4,
    },
    progressText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        width: 45,
    },
    completeButton: {
        borderWidth: 1,
        borderColor: '#007AFF',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
    },
    completeButtonActive: {
        backgroundColor: '#34c759',
        borderColor: '#34c759',
    },
    completeButtonText: {
        color: '#007AFF',
        fontSize: 14,
        fontWeight: '600',
    },
    completeButtonTextActive: {
        color: '#fff',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyStateEmoji: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyStateText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    addButton: {
        backgroundColor: '#007AFF',
        margin: 20,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    addButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 24,
        paddingBottom: 40,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 24,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        marginBottom: 16,
        backgroundColor: '#f8f9fa',
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    modalButton: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#f8f9fa',
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600',
    },
    saveModalButton: {
        backgroundColor: '#007AFF',
    },
    saveModalButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
