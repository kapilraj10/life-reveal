// API Configuration
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: `${API_URL}/api/auth/login`,
        REGISTER: `${API_URL}/api/auth/register`,
    },
    HEALTH: `${API_URL}/api/health`,
};

export default API_URL;
