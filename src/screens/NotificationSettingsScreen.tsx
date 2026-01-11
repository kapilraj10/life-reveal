import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Switch,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Alert,
} from 'react-native';
import {
    getNotificationSettings,
    saveNotificationSettings,
} from '../storage/localSettings';
import { NotificationSettings } from '../services/notifications/notificationTypes';
import notificationScheduler from '../services/notifications/notificationScheduler';
import notificationService from '../services/notifications/notificationService';

/**
 * FR-2.3: Notification Controls Screen
 * Enable/disable hourly notifications, set quiet hours, configure snooze
 */
export default function NotificationSettingsScreen() {
    const [settings, setSettings] = useState<NotificationSettings | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const loadedSettings = await getNotificationSettings();
        setSettings(loadedSettings);
    };

    const updateSetting = async <K extends keyof NotificationSettings>(
        key: K,
        value: NotificationSettings[K]
    ) => {
        if (!settings) return;

        const updatedSettings = { ...settings, [key]: value };
        setSettings(updatedSettings);
        await saveAndReschedule(updatedSettings);
    };

    const updateQuietHours = async (field: 'enabled' | 'startTime' | 'endTime', value: any) => {
        if (!settings) return;

        const updatedSettings = {
            ...settings,
            quietHours: {
                ...settings.quietHours,
                [field]: value,
            },
        };
        setSettings(updatedSettings);
        await saveAndReschedule(updatedSettings);
    };

    const saveAndReschedule = async (updatedSettings: NotificationSettings) => {
        setIsSaving(true);
        try {
            await saveNotificationSettings(updatedSettings);
            await notificationScheduler.scheduleAllNotifications(updatedSettings);
            Alert.alert('Success', 'Notification settings updated');
        } catch (error) {
            console.error('Error saving settings:', error);
            Alert.alert('Error', 'Failed to update settings');
        } finally {
            setIsSaving(false);
        }
    };

    const testNotification = async () => {
        try {
            await notificationService.sendImmediateNotification(
                '⏰ Test Notification',
                'This is a test of your hourly check-in notification!'
            );
            Alert.alert('Success', 'Test notification sent!');
        } catch {
            Alert.alert('Error', 'Failed to send test notification');
        }
    };

    if (!settings) {
        return (
            <View style={styles.container}>
                <Text style={styles.loading}>Loading settings...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>⏰ Hourly Notifications</Text>
                <Text style={styles.sectionDescription}>
                    Get reminded every hour to log your micro-entry
                </Text>

                <View style={styles.settingRow}>
                    <View style={styles.settingText}>
                        <Text style={styles.settingLabel}>Enable Hourly Notifications</Text>
                        <Text style={styles.settingHint}>
                            Receive notifications every hour on the hour
                        </Text>
                    </View>
                    <Switch
                        value={settings.hourlyNotificationsEnabled}
                        onValueChange={(value) =>
                            updateSetting('hourlyNotificationsEnabled', value)
                        }
                        disabled={isSaving}
                    />
                </View>
            </View>

            {/* Quiet Hours */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>🌙 Quiet Hours</Text>
                <Text style={styles.sectionDescription}>
                    Pause notifications during sleep time
                </Text>

                <View style={styles.settingRow}>
                    <View style={styles.settingText}>
                        <Text style={styles.settingLabel}>Enable Quiet Hours</Text>
                        <Text style={styles.settingHint}>
                            No notifications during this period
                        </Text>
                    </View>
                    <Switch
                        value={settings.quietHours.enabled}
                        onValueChange={(value) => updateQuietHours('enabled', value)}
                        disabled={isSaving}
                    />
                </View>

                {settings.quietHours.enabled && (
                    <View style={styles.timePickerContainer}>
                        <View style={styles.timePicker}>
                            <Text style={styles.timeLabel}>Start Time</Text>
                            <TouchableOpacity
                                style={styles.timeButton}
                                onPress={() => {
                                    // Time picker would go here
                                    Alert.alert('Time Picker', 'Time picker not yet implemented');
                                }}
                            >
                                <Text style={styles.timeText}>{settings.quietHours.startTime}</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.timePicker}>
                            <Text style={styles.timeLabel}>End Time</Text>
                            <TouchableOpacity
                                style={styles.timeButton}
                                onPress={() => {
                                    Alert.alert('Time Picker', 'Time picker not yet implemented');
                                }}
                            >
                                <Text style={styles.timeText}>{settings.quietHours.endTime}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>

            {/* Snooze Settings */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>⏸️ Snooze Settings</Text>

                <View style={styles.settingRow}>
                    <View style={styles.settingText}>
                        <Text style={styles.settingLabel}>Allow Snooze</Text>
                        <Text style={styles.settingHint}>
                            Enable snooze button in notifications
                        </Text>
                    </View>
                    <Switch
                        value={settings.allowSnooze}
                        onValueChange={(value) => updateSetting('allowSnooze', value)}
                        disabled={isSaving}
                    />
                </View>

                {settings.allowSnooze && (
                    <View style={styles.snoozeOptions}>
                        {[5, 10, 15, 30, 60].map((minutes) => (
                            <TouchableOpacity
                                key={minutes}
                                style={[
                                    styles.snoozeChip,
                                    settings.snoozeDuration === minutes && styles.snoozeChipSelected,
                                ]}
                                onPress={() => updateSetting('snoozeDuration', minutes)}
                            >
                                <Text
                                    style={[
                                        styles.snoozeChipText,
                                        settings.snoozeDuration === minutes &&
                                        styles.snoozeChipTextSelected,
                                    ]}
                                >
                                    {minutes} min
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>

            {/* Weekly Review */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>📊 Weekly Review</Text>

                <View style={styles.settingRow}>
                    <View style={styles.settingText}>
                        <Text style={styles.settingLabel}>Weekly Review Reminder</Text>
                        <Text style={styles.settingHint}>
                            Get a summary of your week
                        </Text>
                    </View>
                    <Switch
                        value={settings.weeklyReviewEnabled}
                        onValueChange={(value) => updateSetting('weeklyReviewEnabled', value)}
                        disabled={isSaving}
                    />
                </View>
            </View>

            {/* Test Notification */}
            <View style={styles.section}>
                <TouchableOpacity
                    style={styles.testButton}
                    onPress={testNotification}
                    disabled={isSaving}
                >
                    <Text style={styles.testButtonText}>🔔 Send Test Notification</Text>
                </TouchableOpacity>
            </View>

            {/* Info */}
            <View style={styles.infoSection}>
                <Text style={styles.infoText}>
                    💡 Notifications help you build a consistent logging habit. You can always
                    adjust these settings or disable notifications entirely.
                </Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    loading: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
        color: '#666',
    },
    section: {
        backgroundColor: '#fff',
        marginTop: 20,
        marginHorizontal: 16,
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    sectionDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    settingText: {
        flex: 1,
        marginRight: 16,
    },
    settingLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    settingHint: {
        fontSize: 13,
        color: '#999',
    },
    timePickerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
    },
    timePicker: {
        flex: 1,
        marginHorizontal: 4,
    },
    timeLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    timeButton: {
        backgroundColor: '#f0f0f0',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    timeText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    snoozeOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 12,
    },
    snoozeChip: {
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    snoozeChipSelected: {
        backgroundColor: '#e3f2fd',
        borderColor: '#2196f3',
    },
    snoozeChipText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    snoozeChipTextSelected: {
        color: '#2196f3',
        fontWeight: '600',
    },
    testButton: {
        backgroundColor: '#2196f3',
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    testButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    infoSection: {
        margin: 16,
        padding: 16,
        backgroundColor: '#fff3cd',
        borderRadius: 10,
        borderLeftWidth: 4,
        borderLeftColor: '#ffc107',
    },
    infoText: {
        fontSize: 14,
        color: '#856404',
        lineHeight: 20,
    },
});
