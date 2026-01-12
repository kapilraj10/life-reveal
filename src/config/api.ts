// API Configuration
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: `${API_URL}/api/auth/login`,
        REGISTER: `${API_URL}/api/auth/register`,
    },
    MICROLOGS: {
        CREATE: `${API_URL}/api/micrologs`,
        LIST: `${API_URL}/api/micrologs`,
        GET_BY_ID: (id: number) => `${API_URL}/api/micrologs/${id}`,
        UPDATE: (id: number) => `${API_URL}/api/micrologs/${id}`,
        DELETE: (id: number) => `${API_URL}/api/micrologs/${id}`,
        ANALYTICS: `${API_URL}/api/micrologs/analytics`,
    },
    REFLECTIONS: {
        TODAY: `${API_URL}/api/reflections/today`,
        LIST: `${API_URL}/api/reflections`,
        GET_BY_DATE: (date: string) => `${API_URL}/api/reflections/${date}`,
        SAVE: `${API_URL}/api/reflections`,
        DELETE: (date: string) => `${API_URL}/api/reflections/${date}`,
    },
    GOALS: {
        TODAY: `${API_URL}/api/goals/today`,
        LIST: `${API_URL}/api/goals`,
        GET_BY_DATE: (date: string) => `${API_URL}/api/goals/${date}`,
        CREATE: `${API_URL}/api/goals`,
        UPDATE: (id: number) => `${API_URL}/api/goals/${id}`,
        DELETE: (id: number) => `${API_URL}/api/goals/${id}`,
        STATS: `${API_URL}/api/goals/stats`,
    },
    ACHIEVEMENTS: {
        LIST: `${API_URL}/api/achievements`,
        RECENT: `${API_URL}/api/achievements/recent`,
        CREATE: `${API_URL}/api/achievements`,
        DELETE: (id: number) => `${API_URL}/api/achievements/${id}`,
        STATS: `${API_URL}/api/achievements/stats`,
    },
    HEALTH: `${API_URL}/api/health`,
};

export default API_URL;
