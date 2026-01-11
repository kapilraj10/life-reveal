import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    NotificationSettings,
    DEFAULT_NOTIFICATION_SETTINGS,
} from '../services/notifications/notificationTypes';

const STORAGE_KEYS = {
    NOTIFICATION_SETTINGS: '@life_reveal:notification_settings',
    USER_PREFERENCES: '@life_reveal:user_preferences',
    MICRO_LOGS: '@life_reveal:micro_logs',
};

/**
 * Get notification settings from local storage
 */
export async function getNotificationSettings(): Promise<NotificationSettings> {
    try {
        const settings = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_SETTINGS);
        if (settings) {
            return JSON.parse(settings);
        }
        return DEFAULT_NOTIFICATION_SETTINGS;
    } catch (error) {
        console.error('Error getting notification settings:', error);
        return DEFAULT_NOTIFICATION_SETTINGS;
    }
}

/**
 * Save notification settings to local storage
 */
export async function saveNotificationSettings(
    settings: NotificationSettings
): Promise<void> {
    try {
        await AsyncStorage.setItem(
            STORAGE_KEYS.NOTIFICATION_SETTINGS,
            JSON.stringify(settings)
        );
    } catch (error) {
        console.error('Error saving notification settings:', error);
    }
}

/**
 * Clear all local storage
 */
export async function clearAllStorage(): Promise<void> {
    try {
        await AsyncStorage.clear();
    } catch (error) {
        console.error('Error clearing storage:', error);
    }
}

/**
 * Get a specific item from storage
 */
export async function getStorageItem(key: string): Promise<string | null> {
    try {
        return await AsyncStorage.getItem(key);
    } catch (error) {
        console.error(`Error getting storage item ${key}:`, error);
        return null;
    }
}

/**
 * Set a specific item in storage
 */
export async function setStorageItem(key: string, value: string): Promise<void> {
    try {
        await AsyncStorage.setItem(key, value);
    } catch (error) {
        console.error(`Error setting storage item ${key}:`, error);
    }
}

/**
 * Remove a specific item from storage
 */
export async function removeStorageItem(key: string): Promise<void> {
    try {
        await AsyncStorage.removeItem(key);
    } catch (error) {
        console.error(`Error removing storage item ${key}:`, error);
    }
}

export { STORAGE_KEYS };
