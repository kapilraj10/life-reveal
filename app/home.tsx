import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { AuthContext } from '../src/context/auth';
import { router } from 'expo-router';

export default function HomeScreen() {
    const { user, logout } = useContext(AuthContext);

    const handleLogout = () => {
        logout();
        router.replace('/(auth)/login');
    };

    const handleDailyReflection = () => {
        // Navigate to daily reflection (we'll create this screen)
        router.push('/daily-reflection' as any);
    };

    const handleGoals = () => {
        // Navigate to goals (we'll create this screen)
        router.push('/goals' as any);
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Life Reveal</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.welcomeCard}>
                    <Text style={styles.welcomeText}>Welcome back!</Text>
                    <Text style={styles.userName}>{user?.name || 'User'}</Text>
                    <Text style={styles.userEmail}>{user?.email}</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Your Journey</Text>
                    <Text style={styles.cardDescription}>
                        Start your personal journey with Life Reveal. Track your progress,
                        set goals, and discover insights about yourself.
                    </Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Daily Reflection</Text>
                    <Text style={styles.cardDescription}>
                        Take a moment to reflect on your day. What made you happy?
                        What challenges did you face?
                    </Text>
                    <TouchableOpacity
                        style={styles.cardButton}
                        onPress={handleDailyReflection}
                    >
                        <Text style={styles.cardButtonText}>Start Reflecting</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Goals & Achievements</Text>
                    <Text style={styles.cardDescription}>
                        Set meaningful goals and track your progress toward achieving them.
                    </Text>
                    <TouchableOpacity
                        style={styles.cardButton}
                        onPress={handleGoals}
                    >
                        <Text style={styles.cardButtonText}>View Goals</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleLogout}
                >
                    <Text style={styles.logoutButtonText}>Sign Out</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
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
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    content: {
        padding: 20,
    },
    welcomeCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    welcomeText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 8,
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: '#999',
    },
    card: {
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
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    cardDescription: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginBottom: 12,
    },
    cardButton: {
        backgroundColor: '#007AFF',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
    },
    cardButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    footer: {
        padding: 20,
        paddingBottom: 40,
    },
    logoutButton: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ff3b30',
    },
    logoutButtonText: {
        color: '#ff3b30',
        fontSize: 16,
        fontWeight: '600',
    },
});
