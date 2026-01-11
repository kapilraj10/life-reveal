import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { clearAllData } from '../storage/localData';

interface DashboardHeaderProps {
    onLogout?: () => void;
}

/**
 * Dashboard Header Component
 * - Displays app name
 * - Right-aligned logout button
 * - Handles logout with confirmation
 */
export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onLogout }) => {
    const router = useRouter();

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout? Your data will remain safe.',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // Clear session (keep local data safe)
                            await clearAllData();

                            // Call custom logout handler if provided
                            if (onLogout) {
                                onLogout();
                            }

                            // Navigate to login
                            router.replace('/(auth)/login');
                        } catch (error) {
                            console.error('Logout error:', error);
                            Alert.alert('Error', 'Failed to logout. Please try again.');
                        }
                    },
                },
            ]
        );
    };

    return (
        <View style={styles.header}>
            <View style={styles.headerContent}>
                <Text style={styles.appName}>LifeReveal</Text>
                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleLogout}
                    activeOpacity={0.7}
                >
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        backgroundColor: '#FFFFFF',
        paddingTop: 50, // Account for status bar
        paddingBottom: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 3,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    appName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1A1A1A',
        letterSpacing: 0.5,
    },
    logoutButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#FF4444',
        borderRadius: 8,
    },
    logoutText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
