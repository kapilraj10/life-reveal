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
    HEALTH: `${API_URL}/api/health`,
};

export default API_URL;
