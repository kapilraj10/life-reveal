import { API_ENDPOINTS } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DailyReflection {
    id?: number;
    date: string; // YYYY-MM-DD
    reflectionText: string;
    createdAt?: string;
    updatedAt?: string;
}

class ReflectionService {
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
     * Get today's reflection
     */
    async getTodayReflection(): Promise<DailyReflection | null> {
        try {
            const response = await this.request(API_ENDPOINTS.REFLECTIONS.TODAY);
            return response.data;
        } catch (error) {
            console.error('Get today reflection error:', error);
            throw error;
        }
    }

    /**
     * Get reflection by date
     */
    async getReflectionByDate(date: string): Promise<DailyReflection | null> {
        try {
            const response = await this.request(API_ENDPOINTS.REFLECTIONS.GET_BY_DATE(date));
            return response.data;
        } catch (error) {
            console.error('Get reflection by date error:', error);
            throw error;
        }
    }

    /**
     * Get all reflections
     */
    async getAllReflections(params?: {
        limit?: number;
        offset?: number;
    }): Promise<{ reflections: DailyReflection[]; pagination: any }> {
        try {
            const queryParams = new URLSearchParams();
            if (params?.limit) queryParams.append('limit', params.limit.toString());
            if (params?.offset) queryParams.append('offset', params.offset.toString());

            const url = `${API_ENDPOINTS.REFLECTIONS.LIST}?${queryParams.toString()}`;
            const response = await this.request(url);
            return response.data;
        } catch (error) {
            console.error('Get all reflections error:', error);
            throw error;
        }
    }

    /**
     * Save or update reflection
     */
    async saveReflection(reflectionText: string, date?: string): Promise<DailyReflection> {
        try {
            const response = await this.request(API_ENDPOINTS.REFLECTIONS.SAVE, {
                method: 'POST',
                body: JSON.stringify({
                    reflectionText,
                    date: date || new Date().toISOString().split('T')[0]
                }),
            });
            return response.data;
        } catch (error) {
            console.error('Save reflection error:', error);
            throw error;
        }
    }

    /**
     * Delete reflection
     */
    async deleteReflection(date: string): Promise<void> {
        try {
            await this.request(API_ENDPOINTS.REFLECTIONS.DELETE(date), {
                method: 'DELETE',
            });
        } catch (error) {
            console.error('Delete reflection error:', error);
            throw error;
        }
    }
}

export const reflectionService = new ReflectionService();
export default reflectionService;
