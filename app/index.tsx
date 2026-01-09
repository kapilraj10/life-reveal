import { useEffect, useContext } from 'react';
import { router } from 'expo-router';
import { AuthContext } from '../src/context/auth';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function Index() {
    const { user } = useContext(AuthContext);

    useEffect(() => {
        // Small delay to ensure context is ready
        const timeout = setTimeout(() => {
            if (user) {
                router.replace('/home' as any);
            } else {
                router.replace('/(auth)/login');
            }
        }, 100);

        return () => clearTimeout(timeout);
    }, [user]);

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
