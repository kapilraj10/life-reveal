import React, { useContext } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { AuthContext } from '../../src/context/auth';
import { router } from 'expo-router';

export default function SettingsScreen() {
    const { user, logout } = useContext(AuthContext);

    const handleLogout = () => {
        logout();
        router.replace('/(auth)/login');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Settings</Text>
            {user && (
                <View style={styles.userInfo}>
                    <Text>Name: {user.name}</Text>
                    <Text>Email: {user.email}</Text>
                </View>
            )}
            <Button title="Logout" onPress={handleLogout} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    userInfo: {
        marginBottom: 20,
    },
});
