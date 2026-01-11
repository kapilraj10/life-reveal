import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { NotificationConfig } from './notificationTypes';

// Configure notification behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

class NotificationService {
    /**
     * Request notification permissions
     */
    async requestPermissions(): Promise<boolean> {
        try {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                console.log('Notification permissions not granted');
                return false;
            }

            // Android specific channel setup
            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('default', {
                    name: 'Life Reveal Notifications',
                    importance: Notifications.AndroidImportance.HIGH,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#FF6B6B',
                });
            }

            return true;
        } catch (error) {
            console.error('Error requesting notification permissions:', error);
            return false;
        }
    }

    /**
     * Schedule a notification
     */
    async scheduleNotification(config: NotificationConfig): Promise<string | null> {
        try {
            const hasPermission = await this.requestPermissions();
            if (!hasPermission) {
                return null;
            }

            const [hours, minutes] = config.time.split(':').map(Number);

            const trigger: any = {
                hour: hours,
                minute: minutes,
                repeats: true,
            };

            // Add specific days if provided
            if (config.days && config.days.length > 0) {
                trigger.weekday = config.days;
            }

            const notificationId = await Notifications.scheduleNotificationAsync({
                content: {
                    title: config.title,
                    body: config.body,
                    sound: true,
                    priority: Notifications.AndroidNotificationPriority.HIGH,
                    data: { type: config.type },
                },
                trigger,
            });

            console.log(`Notification scheduled: ${notificationId}`);
            return notificationId;
        } catch (error) {
            console.error('Error scheduling notification:', error);
            return null;
        }
    }

    /**
     * Cancel a specific notification
     */
    async cancelNotification(notificationId: string): Promise<void> {
        try {
            await Notifications.cancelScheduledNotificationAsync(notificationId);
            console.log(`Notification cancelled: ${notificationId}`);
        } catch (error) {
            console.error('Error cancelling notification:', error);
        }
    }

    /**
     * Cancel all notifications
     */
    async cancelAllNotifications(): Promise<void> {
        try {
            await Notifications.cancelAllScheduledNotificationsAsync();
            console.log('All notifications cancelled');
        } catch (error) {
            console.error('Error cancelling all notifications:', error);
        }
    }

    /**
     * Get all scheduled notifications
     */
    async getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
        try {
            return await Notifications.getAllScheduledNotificationsAsync();
        } catch (error) {
            console.error('Error getting scheduled notifications:', error);
            return [];
        }
    }

    /**
     * Send an immediate notification (for testing)
     */
    async sendImmediateNotification(title: string, body: string): Promise<void> {
        try {
            const hasPermission = await this.requestPermissions();
            if (!hasPermission) {
                return;
            }

            await Notifications.scheduleNotificationAsync({
                content: {
                    title,
                    body,
                    sound: true,
                },
                trigger: null, // Send immediately
            });
        } catch (error) {
            console.error('Error sending immediate notification:', error);
        }
    }

    /**
     * Setup notification listeners
     */
    setupNotificationListeners(
        onNotificationReceived?: (notification: Notifications.Notification) => void,
        onNotificationResponse?: (response: Notifications.NotificationResponse) => void
    ) {
        // Listener for when a notification is received while app is foregrounded
        const receivedListener = Notifications.addNotificationReceivedListener((notification) => {
            console.log('Notification received:', notification);
            onNotificationReceived?.(notification);
        });

        // Listener for when user taps on notification
        const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
            console.log('Notification response:', response);
            onNotificationResponse?.(response);
        });

        return {
            remove: () => {
                receivedListener.remove();
                responseListener.remove();
            },
        };
    }
}

export default new NotificationService();
