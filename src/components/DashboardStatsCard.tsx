import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { reflectionService } from '../services/reflection.service';
import { goalService } from '../services/goal.service';

interface Stats {
    reflectionCount: number;
    goalCount: number;
    completedGoals: number;
    weeklyReflections: number[];
    weeklyGoals: number[];
}

/**
 * Dashboard Statistics Card
 * Shows visual charts for reflections and goals over the past 7 days
 */
export const DashboardStatsCard: React.FC = () => {
    const [stats, setStats] = useState<Stats>({
        reflectionCount: 0,
        goalCount: 0,
        completedGoals: 0,
        weeklyReflections: [0, 0, 0, 0, 0, 0, 0],
        weeklyGoals: [0, 0, 0, 0, 0, 0, 0],
    });
    const [loading, setLoading] = useState(true);

    const loadStats = useCallback(async () => {
        try {
            setLoading(true);

            // Get all reflections and goals (with high limit to get all data)
            const reflectionsResponse = await reflectionService.getAllReflections({ limit: 1000 });
            const goalsResponse = await goalService.getAllGoals({ limit: 1000 });

            const reflections = reflectionsResponse.reflections || [];
            const goals = goalsResponse.goals || [];

            console.log('📊 Loaded data:', {
                totalReflections: reflections.length,
                totalGoals: goals.length
            });

            // Calculate stats for last 7 days
            const last7Days = getLast7Days();
            const weeklyReflections = new Array(7).fill(0);
            const weeklyGoals = new Array(7).fill(0);

            // Count reflections in last 7 days
            reflections.forEach((reflection) => {
                const reflectionDate = new Date(reflection.date).toDateString();
                const index = last7Days.findIndex(d => d.toDateString() === reflectionDate);
                if (index !== -1) {
                    weeklyReflections[index]++;
                }
            });

            // Count goals in last 7 days
            goals.forEach((goal) => {
                const goalDate = new Date(goal.date).toDateString();
                const index = last7Days.findIndex(d => d.toDateString() === goalDate);
                if (index !== -1) {
                    weeklyGoals[index]++;
                }
            });

            // Calculate totals (ALL time, not just last 7 days)
            const totalReflections = reflections.length;
            const totalGoals = goals.length;
            const completedGoals = goals.filter(g => g.completed).length;

            console.log('📊 Stats calculated:', {
                totalReflections,
                totalGoals,
                completedGoals,
                weeklyReflections,
                weeklyGoals
            });

            setStats({
                reflectionCount: totalReflections,
                goalCount: totalGoals,
                completedGoals,
                weeklyReflections,
                weeklyGoals,
            });
        } catch (error) {
            console.error('📊 Error loading stats:', error);
            // Set empty stats on error
            setStats({
                reflectionCount: 0,
                goalCount: 0,
                completedGoals: 0,
                weeklyReflections: [0, 0, 0, 0, 0, 0, 0],
                weeklyGoals: [0, 0, 0, 0, 0, 0, 0],
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadStats();
    }, [loadStats]);

    const getLast7Days = (): Date[] => {
        const days: Date[] = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            days.push(date);
        }
        return days;
    };

    const getDayLabels = (): string[] => {
        const days = getLast7Days();
        return days.map(d => {
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            return dayNames[d.getDay()];
        });
    };

    const renderBarChart = (data: number[], color: string, maxValue: number) => {
        const chartHeight = 120;
        const barWidth = 32;

        return (
            <View style={styles.chartContainer}>
                <View style={styles.barsContainer}>
                    {data.map((value, index) => {
                        const heightPercentage = maxValue > 0 ? (value / maxValue) : 0;
                        const barHeight = heightPercentage * chartHeight;

                        return (
                            <View key={index} style={styles.barWrapper}>
                                <View style={styles.barColumn}>
                                    <View style={{ height: chartHeight - barHeight }} />
                                    <View
                                        style={[
                                            styles.bar,
                                            {
                                                height: barHeight || 4,
                                                backgroundColor: barHeight > 0 ? color : '#E9ECEF',
                                                width: barWidth,
                                            },
                                        ]}
                                    >
                                        {value > 0 && (
                                            <Text style={styles.barValue}>{value}</Text>
                                        )}
                                    </View>
                                </View>
                                <Text style={styles.dayLabel}>
                                    {getDayLabels()[index]}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            </View>
        );
    };

    const maxReflections = Math.max(...stats.weeklyReflections, 1);
    const maxGoals = Math.max(...stats.weeklyGoals, 1);
    const completionRate = stats.goalCount > 0
        ? Math.round((stats.completedGoals / stats.goalCount) * 100)
        : 0;

    // Get date range for subtitle
    const last7Days = getLast7Days();
    const startDate = last7Days[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endDate = last7Days[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    if (loading) {
        return (
            <View style={styles.card}>
                <Text style={styles.loadingText}>Loading stats...</Text>
            </View>
        );
    }

    return (
        <View style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>📊 Your Activity</Text>
                <Text style={styles.subtitle}>Chart: {startDate} - {endDate}</Text>
                <Text style={styles.subtitleNote}>Stats: All time totals</Text>
            </View>

            {/* Summary Stats */}
            <View style={styles.summaryRow}>
                <View style={styles.statBox}>
                    <Text style={styles.statValue}>{stats.reflectionCount}</Text>
                    <Text style={styles.statLabel}>Total</Text>
                    <Text style={styles.statLabel}>Reflections</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statValue}>{stats.completedGoals}</Text>
                    <Text style={styles.statLabel}>Goals</Text>
                    <Text style={styles.statLabel}>Completed</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statValue}>{completionRate}%</Text>
                    <Text style={styles.statLabel}>Success</Text>
                    <Text style={styles.statLabel}>Rate</Text>
                </View>
            </View>

            {/* Reflections Chart */}
            <View style={styles.chartSection}>
                <View style={styles.chartHeader}>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#6C63FF' }]} />
                        <Text style={styles.chartTitle}>Daily Reflections</Text>
                    </View>
                </View>
                {renderBarChart(stats.weeklyReflections, '#6C63FF', maxReflections)}
            </View>

            {/* Goals Chart */}
            <View style={styles.chartSection}>
                <View style={styles.chartHeader}>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                        <Text style={styles.chartTitle}>Daily Goals</Text>
                    </View>
                </View>
                {renderBarChart(stats.weeklyGoals, '#10B981', maxGoals)}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 16,
        marginTop: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },
    header: {
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#6C757D',
    },
    subtitleNote: {
        fontSize: 12,
        color: '#6C757D',
        fontStyle: 'italic',
        marginTop: 2,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    statBox: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#6C757D',
        fontWeight: '500',
    },
    chartSection: {
        marginBottom: 24,
    },
    chartHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 8,
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#495057',
    },
    chartContainer: {
        height: 160,
    },
    barsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 140,
    },
    barWrapper: {
        alignItems: 'center',
        flex: 1,
    },
    barColumn: {
        height: 120,
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginBottom: 8,
    },
    bar: {
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 4,
    },
    barValue: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    dayLabel: {
        fontSize: 11,
        color: '#6C757D',
        fontWeight: '500',
        marginTop: 4,
    },
    loadingText: {
        textAlign: 'center',
        color: '#6C757D',
        fontSize: 14,
        paddingVertical: 20,
    },
});
