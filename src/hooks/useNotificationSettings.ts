import { useState, useEffect, useCallback } from 'react';
import {
    NotificationSettings,
    DEFAULT_NOTIFICATION_SETTINGS,
} from '../services/notifications/notificationTypes';
import {
    getNotificationSettings,
    saveNotificationSettings,
} from '../storage/localSettings';
import notificationScheduler from '../services/notifications/notificationScheduler';

interface UseNotificationSettingsReturn {
    settings: NotificationSettings;
    isLoading: boolean;
    updateSettings: (newSettings: Partial<NotificationSettings>) => Promise<void>;
    resetSettings: () => Promise<void>;
    refreshSettings: () => Promise<void>;
}

/**
 * Custom hook to manage notification settings
 */
export function useNotificationSettings(): UseNotificationSettingsReturn {
    const [settings, setSettings] = useState<NotificationSettings>(
        DEFAULT_NOTIFICATION_SETTINGS
    );
    const [isLoading, setIsLoading] = useState(true);

    /**
     * Load settings from storage
     */
    const loadSettings = useCallback(async () => {
        try {
            setIsLoading(true);
            const storedSettings = await getNotificationSettings();
            setSettings(storedSettings);
        } catch (error) {
            console.error('Error loading notification settings:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Update settings
     */
    const updateSettings = useCallback(
        async (newSettings: Partial<NotificationSettings>) => {
            try {
                const updatedSettings = { ...settings, ...newSettings };
                setSettings(updatedSettings);
                await saveNotificationSettings(updatedSettings);

                // Update notification schedule
                await notificationScheduler.updateNotificationSchedule(updatedSettings);
            } catch (error) {
                console.error('Error updating notification settings:', error);
            }
        },
        [settings]
    );

    /**
     * Reset settings to default
     */
    const resetSettings = useCallback(async () => {
        try {
            setSettings(DEFAULT_NOTIFICATION_SETTINGS);
            await saveNotificationSettings(DEFAULT_NOTIFICATION_SETTINGS);

            // Update notification schedule
            await notificationScheduler.updateNotificationSchedule(
                DEFAULT_NOTIFICATION_SETTINGS
            );
        } catch (error) {
            console.error('Error resetting notification settings:', error);
        }
    }, []);

    /**
     * Refresh settings from storage
     */
    const refreshSettings = useCallback(async () => {
        await loadSettings();
    }, [loadSettings]);

    // Load settings on mount
    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    return {
        settings,
        isLoading,
        updateSettings,
        resetSettings,
        refreshSettings,
    };
}
