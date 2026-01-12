import { useEffect, useContext } from 'react';
import { router } from 'expo-router';
import { AuthContext } from '../src/context/auth';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function Index() {
    const { user, isLoading } = useContext(AuthContext);

    useEffect(() => {
        // Wait for auth state to load before navigating
        if (isLoading) {
            return;
        }

        // Navigate based on auth state
        if (user) {
            router.replace('/home' as any);
        } else {
            router.replace('/(auth)/login');
        }
    }, [user, isLoading]);

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#007AFF" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
});
