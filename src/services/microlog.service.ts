import { API_ENDPOINTS } from '../config/api';

export interface MicroLog {
    id?: number;
    timestamp: string;
    rating: number; // 1-5
    mood: string;
    activity?: string;
    note?: string;
    tags?: string[];
}

export interface MicroLogListResponse {
    success: boolean;
    data: {
        logs: MicroLog[];
        pagination: {
            total: number;
            limit: number;
            offset: number;
            hasMore: boolean;
        };
    };
}

export interface AnalyticsResponse {
    success: boolean;
    data: {
        summary: {
            totalLogs: number;
            averageRating: number;
            dateRange: {
                start: string | null;
                end: string | null;
            };
        };
        moodDistribution: Record<string, number>;
        ratingDistribution: { rating: number; count: number }[];
        activityFrequency: { activity: string; count: number }[];
        hourlyAverages: { hour: number; average: number; count: number }[];
        bestHours: { hour: number; average: number; count: number }[];
        worstHours: { hour: number; average: number; count: number }[];
    };
}

class MicroLogService {
    private getAuthToken(): string | null {
        // This will be replaced with proper auth context
        return localStorage.getItem('token');
    }

    private async request(url: string, options: RequestInit = {}) {
        const token = this.getAuthToken();

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
     * Create a new micro-log
     */
    async createMicroLog(log: MicroLog): Promise<MicroLog> {
        const response = await this.request(API_ENDPOINTS.MICROLOGS.CREATE, {
            method: 'POST',
            body: JSON.stringify(log),
        });
        return response.data;
    }

    /**
     * Get list of micro-logs with optional filters
     */
    async getMicroLogs(params?: {
        startDate?: string;
        endDate?: string;
        limit?: number;
        offset?: number;
    }): Promise<MicroLogListResponse> {
        const queryParams = new URLSearchParams();
        if (params?.startDate) queryParams.append('startDate', params.startDate);
        if (params?.endDate) queryParams.append('endDate', params.endDate);
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.offset) queryParams.append('offset', params.offset.toString());

        const url = `${API_ENDPOINTS.MICROLOGS.LIST}?${queryParams.toString()}`;
        return await this.request(url);
    }

    /**
     * Get a single micro-log by ID
     */
    async getMicroLogById(id: number): Promise<MicroLog> {
        const url = API_ENDPOINTS.MICROLOGS.GET_BY_ID(id);
        const response = await this.request(url);
        return response.data;
    }

    /**
     * Update an existing micro-log
     */
    async updateMicroLog(id: number, log: Partial<MicroLog>): Promise<MicroLog> {
        const url = API_ENDPOINTS.MICROLOGS.UPDATE(id);
        const response = await this.request(url, {
            method: 'PUT',
            body: JSON.stringify(log),
        });
        return response.data;
    }

    /**
     * Delete a micro-log
     */
    async deleteMicroLog(id: number): Promise<void> {
        const url = API_ENDPOINTS.MICROLOGS.DELETE(id);
        await this.request(url, {
            method: 'DELETE',
        });
    }

    /**
     * Get analytics data
     */
    async getAnalytics(params?: {
        startDate?: string;
        endDate?: string;
        groupBy?: 'day' | 'week' | 'month';
    }): Promise<AnalyticsResponse> {
        const queryParams = new URLSearchParams();
        if (params?.startDate) queryParams.append('startDate', params.startDate);
        if (params?.endDate) queryParams.append('endDate', params.endDate);
        if (params?.groupBy) queryParams.append('groupBy', params.groupBy);

        const url = `${API_ENDPOINTS.MICROLOGS.ANALYTICS}?${queryParams.toString()}`;
        return await this.request(url);
    }
}

export default new MicroLogService();
