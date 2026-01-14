import { useEffect, useContext } from 'react';
import { router } from 'expo-router';
import { AuthContext } from '../src/context/auth';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';

export default function Index() {
    const { user, isLoading } = useContext(AuthContext);

    useEffect(() => {
        // Wait for auth state to load before navigating
        if (isLoading) {
            console.log('⏳ Loading auth state...');
            return;
        }

        // Navigate based on auth state
        if (user) {
            console.log('✅ User authenticated, redirecting to home');
            router.replace('/home' as any);
        } else {
            console.log('🔓 No user found, redirecting to login');
            router.replace('/(auth)/login');
        }
    }, [user, isLoading]);

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#6C63FF" />
            <Text style={styles.loadingText}>Loading...</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F7FAFC',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#718096',
        fontWeight: '500',
    },
});
