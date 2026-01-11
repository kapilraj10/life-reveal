import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { DashboardHeader } from '../components/DashboardHeader';
import { DailyReflectionChat } from '../components/DailyReflectionChat';
import { GoalsAchievementsSection } from '../components/GoalsAchievementsSection';

/**
 * Main Dashboard Screen (First Page)
 * 
 * Features:
 * - App header with logout
 * - Daily reflection chat UI
 * - Goals & Achievements section
 * - All data saved locally
 * - Dynamic, no hard-coded values
 * - Clean, minimal design
 */
export const DashboardScreen: React.FC = () => {
    return (
        <View style={styles.container}>
            {/* Header with App Name and Logout */}
            <DashboardHeader />

            {/* Scrollable Content */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Daily Reflection Section */}
                <DailyReflectionChat
                    onReflectionSaved={(reflection) => {
                        console.log('Reflection saved:', reflection);
                    }}
                />

                {/* Goals & Achievements Section */}
                <GoalsAchievementsSection
                    onGoalCompleted={(goal) => {
                        console.log('Goal completed:', goal);
                    }}
                    onAchievementUnlocked={(achievement) => {
                        console.log('Achievement unlocked:', achievement);
                    }}
                />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 32,
    },
});
