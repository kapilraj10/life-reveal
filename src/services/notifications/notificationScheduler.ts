import notificationService from './notificationService';
import {
    NotificationConfig,
    NotificationType,
    NotificationSettings,
    QuietHours,
} from './notificationTypes';
import { getNotificationSettings } from '../../storage/localSettings';
import * as Notifications from 'expo-notifications';

class NotificationScheduler {
    private scheduledNotificationIds: Map<string, string> = new Map();
    private hourlyNotificationIds: string[] = [];

    /**
     * Initialize and schedule all notifications based on settings
     */
    async initializeNotifications(): Promise<void> {
        try {
            // Request permissions first
            const hasPermission = await notificationService.requestPermissions();
            if (!hasPermission) {
                console.log('Notification permissions not granted');
                return;
            }

            // Load settings
            const settings = await getNotificationSettings();

            // Schedule notifications based on settings
            await this.scheduleAllNotifications(settings);

            // Set up notification response handler
            this.setupNotificationHandlers();
        } catch (error) {
            console.error('Error initializing notifications:', error);
        }
    }

    /**
     * Check if current time is within quiet hours
     */
    private isQuietHours(quietHours: QuietHours): boolean {
        if (!quietHours.enabled) return false;

        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        const [startHour, startMin] = quietHours.startTime.split(':').map(Number);
        const [endHour, endMin] = quietHours.endTime.split(':').map(Number);

        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;

        // Handle quiet hours spanning midnight
        if (startMinutes > endMinutes) {
            return currentMinutes >= startMinutes || currentMinutes < endMinutes;
        }

        return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    }

    /**
     * Schedule hourly notifications (every hour on the hour)
     * FR-2.1: Hourly Trigger with battery optimization and reboot persistence
     */
    async scheduleHourlyNotifications(settings: NotificationSettings): Promise<void> {
        // Cancel existing hourly notifications
        await this.cancelHourlyNotifications();

        if (!settings.hourlyNotificationsEnabled) {
            return;
        }

        // Schedule notifications for each hour (0-23)
        const notificationPromises = [];

        for (let hour = 0; hour < 24; hour++) {
            // Skip if within quiet hours
            const testDate = new Date();
            testDate.setHours(hour, 0, 0, 0);

            if (this.isQuietHours(settings.quietHours)) {
                const quietStart = parseInt(settings.quietHours.startTime.split(':')[0]);
                const quietEnd = parseInt(settings.quietHours.endTime.split(':')[0]);

                // Skip hours within quiet period
                if (quietStart > quietEnd) {
                    // Quiet hours span midnight
                    if (hour >= quietStart || hour < quietEnd) {
                        continue;
                    }
                } else {
                    if (hour >= quietStart && hour < quietEnd) {
                        continue;
                    }
                }
            }

            const config: NotificationConfig = {
                id: `hourly-log-${hour}`,
                type: NotificationType.HOURLY_MICRO_LOG,
                title: this.getHourlyNotificationTitle(hour),
                body: this.getHourlyNotificationBody(hour),
                enabled: true,
                time: `${hour.toString().padStart(2, '0')}:00`,
            };

            notificationPromises.push(this.scheduleHourlyNotification(config, hour));
        }

        await Promise.all(notificationPromises);
        console.log(`Scheduled ${this.hourlyNotificationIds.length} hourly notifications`);
    }

    /**
     * Get contextual notification title based on time
     */
    private getHourlyNotificationTitle(hour: number): string {
        if (hour >= 5 && hour < 12) return '🌅 Morning Check-in';
        if (hour >= 12 && hour < 17) return '☀️ Afternoon Pulse';
        if (hour >= 17 && hour < 21) return '🌆 Evening Reflection';
        if (hour >= 21 || hour < 5) return '🌙 Night Review';
        return '⏰ Hourly Check-in';
    }

    /**
     * Get contextual notification body based on time
     */
    private getHourlyNotificationBody(hour: number): string {
        const bodies = [
            'How are you feeling right now?',
            'Take a moment to check in with yourself',
            'Log this hour in your journey',
            'Quick reflection: How\'s this hour going?',
            'Capture this moment in your life reveal',
        ];
        return bodies[hour % bodies.length];
    }

    /**
     * Schedule a single hourly notification
     */
    private async scheduleHourlyNotification(
        config: NotificationConfig,
        hour: number
    ): Promise<void> {
        const trigger = {
            hour,
            minute: 0,
            repeats: true,
        } as Notifications.CalendarTriggerInput;

        try {
            const notificationId = await Notifications.scheduleNotificationAsync({
                content: {
                    title: config.title,
                    body: config.body,
                    sound: true,
                    priority: Notifications.AndroidNotificationPriority.HIGH,
                    data: {
                        type: config.type,
                        hour,
                        timestamp: new Date().toISOString(),
                    },
                    categoryIdentifier: 'MICRO_LOG',
                },
                trigger,
            });

            this.hourlyNotificationIds.push(notificationId);
            console.log(`Scheduled hourly notification for ${hour}:00`);
        } catch (error) {
            console.error(`Error scheduling hourly notification for ${hour}:00:`, error);
        }
    }

    /**
     * Cancel all hourly notifications
     */
    private async cancelHourlyNotifications(): Promise<void> {
        for (const id of this.hourlyNotificationIds) {
            try {
                await Notifications.cancelScheduledNotificationAsync(id);
            } catch (error) {
                console.error('Error cancelling notification:', error);
            }
        }
        this.hourlyNotificationIds = [];
    }

    /**
     * FR-2.3: Snooze notification
     */
    async snoozeNotification(minutes: number = 15): Promise<void> {
        const config: NotificationConfig = {
            id: 'snoozed-log',
            type: NotificationType.HOURLY_MICRO_LOG,
            title: '⏰ Snoozed Reminder',
            body: 'Time to log your micro-entry!',
            enabled: true,
            time: new Date(Date.now() + minutes * 60 * 1000).toISOString(),
        };

        const trigger = {
            seconds: minutes * 60,
        } as Notifications.TimeIntervalTriggerInput;

        try {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: config.title,
                    body: config.body,
                    sound: true,
                    data: { type: config.type, snoozed: true },
                },
                trigger,
            });
            console.log(`Snoozed notification for ${minutes} minutes`);
        } catch (error) {
            console.error('Error snoozing notification:', error);
        }
    }

    /**
     * Setup notification interaction handlers
     * FR-2.2: Notification Interaction - tap to open modal
     */
    private setupNotificationHandlers(): void {
        // Handle notification tap
        Notifications.addNotificationResponseReceivedListener((response) => {
            const data = response.notification.request.content.data;

            if (data.type === NotificationType.HOURLY_MICRO_LOG) {
                // This will be handled by the app's navigation
                console.log('Hourly notification tapped:', data);
                // Navigation to modal should be handled in App.tsx or _layout.tsx
            }
        });
    }

    /**
     * Schedule all notifications based on settings
     */
    async scheduleAllNotifications(settings: NotificationSettings): Promise<void> {
        // Cancel existing notifications first
        await this.cancelAllScheduled();

        // Schedule hourly notifications if enabled
        if (settings.hourlyNotificationsEnabled) {
            await this.scheduleHourlyNotifications(settings);
        } else {
            // Schedule morning micro-log
            if (settings.morningLogEnabled) {
                await this.scheduleMorningLog(settings.morningLogTime);
            }

            // Schedule evening micro-log
            if (settings.eveningLogEnabled) {
                await this.scheduleEveningLog(settings.eveningLogTime);
            }
        }

        // Schedule weekly review
        if (settings.weeklyReviewEnabled) {
            await this.scheduleWeeklyReview(
                settings.weeklyReviewDay,
                settings.weeklyReviewTime
            );
        }
    }

    /**
     * Schedule morning micro-log notification
     */
    async scheduleMorningLog(time: string): Promise<void> {
        const config: NotificationConfig = {
            id: 'morning-log',
            type: NotificationType.MORNING_MICRO_LOG,
            title: '🌅 Good Morning!',
            body: 'How are you feeling today? Take a moment to log your morning thoughts.',
            enabled: true,
            time,
        };

        const notificationId = await notificationService.scheduleNotification(config);
        if (notificationId) {
            this.scheduledNotificationIds.set('morning-log', notificationId);
        }
    }

    /**
     * Schedule evening micro-log notification
     */
    async scheduleEveningLog(time: string): Promise<void> {
        const config: NotificationConfig = {
            id: 'evening-log',
            type: NotificationType.EVENING_MICRO_LOG,
            title: '🌙 Evening Reflection',
            body: 'Take a moment to reflect on your day. How did it go?',
            enabled: true,
            time,
        };

        const notificationId = await notificationService.scheduleNotification(config);
        if (notificationId) {
            this.scheduledNotificationIds.set('evening-log', notificationId);
        }
    }

    /**
     * Schedule weekly review notification
     */
    async scheduleWeeklyReview(day: number, time: string): Promise<void> {
        const config: NotificationConfig = {
            id: 'weekly-review',
            type: NotificationType.WEEKLY_SUMMARY,
            title: '📊 Weekly Review',
            body: 'Time to review your week! See your patterns and insights.',
            enabled: true,
            time,
            days: [day], // Specific day of week
        };

        const notificationId = await notificationService.scheduleNotification(config);
        if (notificationId) {
            this.scheduledNotificationIds.set('weekly-review', notificationId);
        }
    }

    /**
     * Update notification schedule when settings change
     */
    async updateNotificationSchedule(settings: NotificationSettings): Promise<void> {
        await this.scheduleAllNotifications(settings);
    }

    /**
     * Cancel all scheduled notifications
     */
    async cancelAllScheduled(): Promise<void> {
        for (const [, notificationId] of this.scheduledNotificationIds.entries()) {
            await notificationService.cancelNotification(notificationId);
        }
        this.scheduledNotificationIds.clear();
    }

    /**
     * Get all currently scheduled notifications
     */
    async getScheduledNotifications() {
        return await notificationService.getAllScheduledNotifications();
    }

    /**
     * Test notification (send immediately)
     */
    async sendTestNotification(type: NotificationType): Promise<void> {
        const messages: Record<NotificationType, { title: string; body: string }> = {
            [NotificationType.HOURLY_MICRO_LOG]: {
                title: '⏰ Hourly Check-in (Test)',
                body: 'This is a test of your hourly notification.',
            },
            [NotificationType.MORNING_MICRO_LOG]: {
                title: '🌅 Good Morning! (Test)',
                body: 'This is a test of your morning notification.',
            },
            [NotificationType.EVENING_MICRO_LOG]: {
                title: '🌙 Evening Reflection (Test)',
                body: 'This is a test of your evening notification.',
            },
            [NotificationType.WEEKLY_SUMMARY]: {
                title: '📊 Weekly Review (Test)',
                body: 'This is a test of your weekly review notification.',
            },
            [NotificationType.REMINDER]: {
                title: '🔔 Reminder (Test)',
                body: 'This is a test reminder notification.',
            },
            [NotificationType.MONTHLY_REVIEW]: {
                title: '📅 Monthly Review (Test)',
                body: 'This is a test of your monthly review notification.',
            },
        };

        const message = messages[type];
        await notificationService.sendImmediateNotification(message.title, message.body);
    }
}

export default new NotificationScheduler();
