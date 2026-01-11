import AsyncStorage from '@react-native-async-storage/async-storage';
import { MicroLog } from '../services/microlog.service';

/**
 * FR-4: Offline-First Local Storage for Micro-Logs
 * Uses AsyncStorage as a SQLite-like local database
 */

const STORAGE_KEYS = {
    MICRO_LOGS: '@life_reveal:micro_logs',
    TAGS_HISTORY: '@life_reveal:tags_history',
    ACTIVITY_HISTORY: '@life_reveal:activity_history',
    SYNC_QUEUE: '@life_reveal:sync_queue',
};

export interface StoredMicroLog extends MicroLog {
    localId: string; // Local UUID for offline management
    synced: boolean; // Synced with backend
    modifiedAt: string; // Last modification timestamp
}

export interface TagSuggestion {
    tag: string;
    count: number;
    lastUsed: string;
}

export interface ActivitySuggestion {
    activity: string;
    count: number;
    lastUsed: string;
}

class MicroLogStorage {
    /**
     * Generate a unique local ID
     */
    private generateLocalId(): string {
        return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get the hour key for a timestamp (prevents duplicates per hour)
     * FR-4.2: Data Integrity - prevent duplicate logs for same hour
     */
    private getHourKey(timestamp: string): string {
        const date = new Date(timestamp);
        return `${date.getFullYear()}-${(date.getMonth() + 1)
            .toString()
            .padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}-${date
                .getHours()
                .toString()
                .padStart(2, '0')}`;
    }

    /**
     * FR-4.1: Store a micro-log locally
     * Ensures persistence across app restarts and device reboots
     */
    async saveMicroLog(log: MicroLog): Promise<StoredMicroLog> {
        try {
            const logs = await this.getAllMicroLogs();
            const hourKey = this.getHourKey(log.timestamp);

            // Check for duplicate in same hour
            const existingIndex = logs.findIndex(
                (l) => this.getHourKey(l.timestamp) === hourKey
            );

            const storedLog: StoredMicroLog = {
                ...log,
                localId: log.id?.toString() || this.generateLocalId(),
                synced: false,
                modifiedAt: new Date().toISOString(),
            };

            if (existingIndex >= 0) {
                // Update existing log for this hour
                logs[existingIndex] = storedLog;
            } else {
                // Add new log
                logs.push(storedLog);
            }

            // Sort by timestamp descending
            logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

            await AsyncStorage.setItem(STORAGE_KEYS.MICRO_LOGS, JSON.stringify(logs));

            // Update tag and activity histories
            if (log.tags) {
                await this.updateTagHistory(log.tags);
            }
            if (log.activity) {
                await this.updateActivityHistory(log.activity);
            }

            return storedLog;
        } catch (error) {
            console.error('Error saving micro-log locally:', error);
            throw error;
        }
    }

    /**
     * Get all locally stored micro-logs
     */
    async getAllMicroLogs(): Promise<StoredMicroLog[]> {
        try {
            const data = await AsyncStorage.getItem(STORAGE_KEYS.MICRO_LOGS);
            if (!data) return [];
            return JSON.parse(data);
        } catch (error) {
            console.error('Error getting micro-logs:', error);
            return [];
        }
    }

    /**
     * Get micro-log by timestamp hour
     */
    async getMicroLogByHour(timestamp: string): Promise<StoredMicroLog | null> {
        try {
            const logs = await this.getAllMicroLogs();
            const hourKey = this.getHourKey(timestamp);
            return logs.find((log) => this.getHourKey(log.timestamp) === hourKey) || null;
        } catch (error) {
            console.error('Error getting micro-log by hour:', error);
            return null;
        }
    }

    /**
     * FR-5.1: Get logs with filters
     */
    async getFilteredMicroLogs(filters: {
        startDate?: string;
        endDate?: string;
        rating?: number;
        mood?: string;
        tags?: string[];
    }): Promise<StoredMicroLog[]> {
        try {
            let logs = await this.getAllMicroLogs();

            // Filter by date range
            if (filters.startDate) {
                const start = new Date(filters.startDate).getTime();
                logs = logs.filter((log) => new Date(log.timestamp).getTime() >= start);
            }
            if (filters.endDate) {
                const end = new Date(filters.endDate).getTime();
                logs = logs.filter((log) => new Date(log.timestamp).getTime() <= end);
            }

            // Filter by rating
            if (filters.rating !== undefined) {
                logs = logs.filter((log) => log.rating === filters.rating);
            }

            // Filter by mood
            if (filters.mood) {
                logs = logs.filter((log) => log.mood === filters.mood);
            }

            // Filter by tags
            if (filters.tags && filters.tags.length > 0) {
                logs = logs.filter((log) =>
                    log.tags?.some((tag) => filters.tags!.includes(tag))
                );
            }

            return logs;
        } catch (error) {
            console.error('Error filtering micro-logs:', error);
            return [];
        }
    }

    /**
     * Delete a micro-log
     */
    async deleteMicroLog(localId: string): Promise<void> {
        try {
            const logs = await this.getAllMicroLogs();
            const filtered = logs.filter((log) => log.localId !== localId);
            await AsyncStorage.setItem(STORAGE_KEYS.MICRO_LOGS, JSON.stringify(filtered));
        } catch (error) {
            console.error('Error deleting micro-log:', error);
            throw error;
        }
    }

    /**
     * Mark logs as synced with backend
     */
    async markAsSynced(localIds: string[]): Promise<void> {
        try {
            const logs = await this.getAllMicroLogs();
            logs.forEach((log) => {
                if (localIds.includes(log.localId)) {
                    log.synced = true;
                }
            });
            await AsyncStorage.setItem(STORAGE_KEYS.MICRO_LOGS, JSON.stringify(logs));
        } catch (error) {
            console.error('Error marking logs as synced:', error);
        }
    }

    /**
     * Get unsynced logs for backend sync
     */
    async getUnsyncedLogs(): Promise<StoredMicroLog[]> {
        try {
            const logs = await this.getAllMicroLogs();
            return logs.filter((log) => !log.synced);
        } catch (error) {
            console.error('Error getting unsynced logs:', error);
            return [];
        }
    }

    /**
     * FR-3.5: Update tag history for auto-suggestions
     */
    private async updateTagHistory(tags: string[]): Promise<void> {
        try {
            const data = await AsyncStorage.getItem(STORAGE_KEYS.TAGS_HISTORY);
            const history: TagSuggestion[] = data ? JSON.parse(data) : [];

            tags.forEach((tag) => {
                const existing = history.find((h) => h.tag === tag);
                if (existing) {
                    existing.count++;
                    existing.lastUsed = new Date().toISOString();
                } else {
                    history.push({
                        tag,
                        count: 1,
                        lastUsed: new Date().toISOString(),
                    });
                }
            });

            // Sort by count and recency
            history.sort((a, b) => {
                if (b.count !== a.count) return b.count - a.count;
                return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime();
            });

            // Keep top 50 tags
            const trimmed = history.slice(0, 50);
            await AsyncStorage.setItem(STORAGE_KEYS.TAGS_HISTORY, JSON.stringify(trimmed));
        } catch (error) {
            console.error('Error updating tag history:', error);
        }
    }

    /**
     * Get tag suggestions
     */
    async getTagSuggestions(limit: number = 10): Promise<string[]> {
        try {
            const data = await AsyncStorage.getItem(STORAGE_KEYS.TAGS_HISTORY);
            const history: TagSuggestion[] = data ? JSON.parse(data) : [];
            return history.slice(0, limit).map((h) => h.tag);
        } catch (error) {
            console.error('Error getting tag suggestions:', error);
            return [];
        }
    }

    /**
     * Update activity history for suggestions
     */
    private async updateActivityHistory(activity: string): Promise<void> {
        try {
            const data = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVITY_HISTORY);
            const history: ActivitySuggestion[] = data ? JSON.parse(data) : [];

            const existing = history.find((h) => h.activity === activity);
            if (existing) {
                existing.count++;
                existing.lastUsed = new Date().toISOString();
            } else {
                history.push({
                    activity,
                    count: 1,
                    lastUsed: new Date().toISOString(),
                });
            }

            // Sort by count and recency
            history.sort((a, b) => {
                if (b.count !== a.count) return b.count - a.count;
                return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime();
            });

            // Keep top 50 activities
            const trimmed = history.slice(0, 50);
            await AsyncStorage.setItem(STORAGE_KEYS.ACTIVITY_HISTORY, JSON.stringify(trimmed));
        } catch (error) {
            console.error('Error updating activity history:', error);
        }
    }

    /**
     * Get activity suggestions
     */
    async getActivitySuggestions(limit: number = 10): Promise<string[]> {
        try {
            const data = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVITY_HISTORY);
            const history: ActivitySuggestion[] = data ? JSON.parse(data) : [];
            return history.slice(0, limit).map((h) => h.activity);
        } catch (error) {
            console.error('Error getting activity suggestions:', error);
            return [];
        }
    }

    /**
     * Clear all local data
     */
    async clearAll(): Promise<void> {
        try {
            await AsyncStorage.multiRemove([
                STORAGE_KEYS.MICRO_LOGS,
                STORAGE_KEYS.TAGS_HISTORY,
                STORAGE_KEYS.ACTIVITY_HISTORY,
                STORAGE_KEYS.SYNC_QUEUE,
            ]);
        } catch (error) {
            console.error('Error clearing storage:', error);
        }
    }
}

export default new MicroLogStorage();
