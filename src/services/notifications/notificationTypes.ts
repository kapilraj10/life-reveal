export enum NotificationType {
    HOURLY_MICRO_LOG = 'HOURLY_MICRO_LOG',
    MORNING_MICRO_LOG = 'MORNING_MICRO_LOG',
    EVENING_MICRO_LOG = 'EVENING_MICRO_LOG',
    REMINDER = 'REMINDER',
    WEEKLY_SUMMARY = 'WEEKLY_SUMMARY',
    MONTHLY_REVIEW = 'MONTHLY_REVIEW',
}

export interface NotificationConfig {
    id: string;
    type: NotificationType;
    title: string;
    body: string;
    enabled: boolean;
    time: string; // HH:mm format
    days?: number[]; // 0-6 (Sunday-Saturday)
}

export interface QuietHours {
    enabled: boolean;
    startTime: string; // HH:mm format
    endTime: string; // HH:mm format
}

export interface NotificationSettings {
    // Hourly notifications
    hourlyNotificationsEnabled: boolean;
    quietHours: QuietHours;

    // Legacy morning/evening
    morningLogEnabled: boolean;
    morningLogTime: string;
    eveningLogEnabled: boolean;
    eveningLogTime: string;

    // Reviews
    weeklyReviewEnabled: boolean;
    weeklyReviewDay: number;
    weeklyReviewTime: string;

    // General
    remindersEnabled: boolean;
    allowSnooze: boolean;
    snoozeDuration: number; // minutes
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
    hourlyNotificationsEnabled: true,
    quietHours: {
        enabled: true,
        startTime: '22:00',
        endTime: '08:00',
    },
    morningLogEnabled: false, // Disabled when hourly is on
    morningLogTime: '09:00',
    eveningLogEnabled: false,
    eveningLogTime: '21:00',
    weeklyReviewEnabled: true,
    weeklyReviewDay: 0, // Sunday
    weeklyReviewTime: '19:00',
    remindersEnabled: true,
    allowSnooze: true,
    snoozeDuration: 15,
};
