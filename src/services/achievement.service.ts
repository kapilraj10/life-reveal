import { API_ENDPOINTS } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Achievement {
    id: number;
    title: string;
    description: string;
    date: string; // YYYY-MM-DD
    type: 'goal_completed' | 'streak' | 'milestone';
    createdAt: string;
}

export interface AchievementStats {
    total: number;
    byType: {
        goal_completed?: number;
        streak?: number;
        milestone?: number;
    };
}

class AchievementService {
    private async getAuthToken(): Promise<string | null> {
        try {
            return await AsyncStorage.getItem('token');
        } catch (error) {
            console.error('Error getting auth token:', error);
            return null;
        }
    }

    private async request(url: string, options: RequestInit = {}) {
        const token = await this.getAuthToken();

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers,
        };

        const response = await fetch(url, {
            ...options,
            headers,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Request failed');
        }

        return data;
    }

    /**
     * Get all achievements
     */
    async getAllAchievements(params?: {
        limit?: number;
        offset?: number;
        type?: string;
    }): Promise<{ achievements: Achievement[]; pagination: any }> {
        try {
            const queryParams = new URLSearchParams();
            if (params?.limit) queryParams.append('limit', params.limit.toString());
            if (params?.offset) queryParams.append('offset', params.offset.toString());
            if (params?.type) queryParams.append('type', params.type);

            const url = `${API_ENDPOINTS.ACHIEVEMENTS.LIST}?${queryParams.toString()}`;
            const response = await this.request(url);
            return response.data;
        } catch (error) {
            console.error('Get all achievements error:', error);
            throw error;
        }
    }

    /**
     * Get recent achievements
     */
    async getRecentAchievements(limit: number = 5): Promise<Achievement[]> {
        try {
            const url = `${API_ENDPOINTS.ACHIEVEMENTS.RECENT}?limit=${limit}`;
            const response = await this.request(url);
            return response.data;
        } catch (error) {
            console.error('Get recent achievements error:', error);
            throw error;
        }
    }

    /**
     * Create a manual achievement
     */
    async createAchievement(achievement: {
        title: string;
        description: string;
        type: 'goal_completed' | 'streak' | 'milestone';
    }): Promise<Achievement> {
        try {
            const response = await this.request(API_ENDPOINTS.ACHIEVEMENTS.CREATE, {
                method: 'POST',
                body: JSON.stringify(achievement),
            });
            return response.data;
        } catch (error) {
            console.error('Create achievement error:', error);
            throw error;
        }
    }

    /**
     * Delete an achievement
     */
    async deleteAchievement(id: number): Promise<void> {
        try {
            await this.request(API_ENDPOINTS.ACHIEVEMENTS.DELETE(id), {
                method: 'DELETE',
            });
        } catch (error) {
            console.error('Delete achievement error:', error);
            throw error;
        }
    }

    /**
     * Get achievement statistics
     */
    async getAchievementStats(): Promise<AchievementStats> {
        try {
            const response = await this.request(API_ENDPOINTS.ACHIEVEMENTS.STATS);
            return response.data;
        } catch (error) {
            console.error('Get achievement stats error:', error);
            throw error;
        }
    }
}

export const achievementService = new AchievementService();
export default achievementService;
