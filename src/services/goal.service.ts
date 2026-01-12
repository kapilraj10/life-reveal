import { API_ENDPOINTS } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DailyGoal {
    id: number;
    title: string;
    completed: boolean;
    date: string; // YYYY-MM-DD
    createdAt: string;
    updatedAt: string;
}

export interface GoalStats {
    total: number;
    completed: number;
    percentage: number;
    pending: number;
}

class GoalService {
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
     * Get today's goals
     */
    async getTodayGoals(): Promise<DailyGoal[]> {
        try {
            const response = await this.request(API_ENDPOINTS.GOALS.TODAY);
            return response.data;
        } catch (error) {
            console.error('Get today goals error:', error);
            throw error;
        }
    }

    /**
     * Get goals by date
     */
    async getGoalsByDate(date: string): Promise<DailyGoal[]> {
        try {
            const response = await this.request(API_ENDPOINTS.GOALS.GET_BY_DATE(date));
            return response.data;
        } catch (error) {
            console.error('Get goals by date error:', error);
            throw error;
        }
    }

    /**
     * Get all goals
     */
    async getAllGoals(params?: {
        limit?: number;
        offset?: number;
        startDate?: string;
        endDate?: string;
    }): Promise<{ goals: DailyGoal[]; pagination: any }> {
        try {
            const queryParams = new URLSearchParams();
            if (params?.limit) queryParams.append('limit', params.limit.toString());
            if (params?.offset) queryParams.append('offset', params.offset.toString());
            if (params?.startDate) queryParams.append('startDate', params.startDate);
            if (params?.endDate) queryParams.append('endDate', params.endDate);

            const url = `${API_ENDPOINTS.GOALS.LIST}?${queryParams.toString()}`;
            const response = await this.request(url);
            return response.data;
        } catch (error) {
            console.error('Get all goals error:', error);
            throw error;
        }
    }

    /**
     * Create a new goal
     */
    async createGoal(title: string, date?: string): Promise<DailyGoal> {
        try {
            const response = await this.request(API_ENDPOINTS.GOALS.CREATE, {
                method: 'POST',
                body: JSON.stringify({
                    title,
                    date: date || new Date().toISOString().split('T')[0]
                }),
            });
            return response.data;
        } catch (error) {
            console.error('Create goal error:', error);
            throw error;
        }
    }

    /**
     * Update goal (toggle completion or edit title)
     */
    async updateGoal(id: number, updates: { completed?: boolean; title?: string }): Promise<DailyGoal> {
        try {
            const response = await this.request(API_ENDPOINTS.GOALS.UPDATE(id), {
                method: 'PUT',
                body: JSON.stringify(updates),
            });
            return response.data;
        } catch (error) {
            console.error('Update goal error:', error);
            throw error;
        }
    }

    /**
     * Delete a goal
     */
    async deleteGoal(id: number): Promise<void> {
        try {
            await this.request(API_ENDPOINTS.GOALS.DELETE(id), {
                method: 'DELETE',
            });
        } catch (error) {
            console.error('Delete goal error:', error);
            throw error;
        }
    }

    /**
     * Get goal statistics
     */
    async getGoalStats(): Promise<GoalStats> {
        try {
            const response = await this.request(API_ENDPOINTS.GOALS.STATS);
            return response.data;
        } catch (error) {
            console.error('Get goal stats error:', error);
            throw error;
        }
    }
}

export const goalService = new GoalService();
export default goalService;
