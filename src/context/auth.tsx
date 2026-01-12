import React, { createContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthUser } from "../types/auth";

type AuthContextType = {
    user: AuthUser | null;
    isLoading: boolean;
    loginUser: (user: AuthUser) => Promise<void>;
    logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: true,
    loginUser: async () => { },
    logout: async () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Clean up old local storage data from previous localStorage-based implementation
    const cleanupOldLocalData = async () => {
        try {
            const oldKeys = [
                'reflections',
                'goals',
                'achievements',
                'dailyReflections',
                'todayGoals',
                'userAchievements'
            ];

            // Remove old storage keys silently
            await AsyncStorage.multiRemove(oldKeys);
        } catch {
            // Silently fail - this is just cleanup
        }
    };

    const loadStoredUser = async () => {
        try {
            // Clean up old local storage data from previous implementation
            await cleanupOldLocalData();

            const [storedUser, storedToken] = await Promise.all([
                AsyncStorage.getItem('user'),
                AsyncStorage.getItem('token')
            ]);

            if (storedUser && storedToken) {
                const parsedUser = JSON.parse(storedUser);
                setUser({ ...parsedUser, token: storedToken });
            }
        } catch (error) {
            console.error('Error loading stored user:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Load user from storage on mount
    useEffect(() => {
        loadStoredUser();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loginUser = async (user: AuthUser) => {
        try {
            // Store user and token
            await AsyncStorage.setItem('user', JSON.stringify({
                userId: user.userId,
                name: user.name,
                email: user.email
            }));
            await AsyncStorage.setItem('token', user.token);

            setUser(user);
        } catch (error) {
            console.error('Error storing user:', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            // Clear only auth data, keep reflections/goals/achievements
            await AsyncStorage.multiRemove(['user', 'token']);
            setUser(null);
        } catch (error) {
            console.error('Error logging out:', error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, loginUser, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export default AuthProvider;
