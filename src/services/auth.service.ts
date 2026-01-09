import { LoginPayload, RegisterPayload, AuthUser } from "../types/auth";
import { API_ENDPOINTS } from "../config/api";

export async function login(payload: LoginPayload): Promise<AuthUser> {
    try {
        const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Login failed');
        }

        const data = await response.json();

        // Return user data in the expected format
        return {
            userId: data.userId || "1",
            name: data.name || payload.email.split('@')[0],
            email: payload.email,
            token: data.token
        };
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

export async function register(payload: RegisterPayload): Promise<AuthUser> {
    try {
        const response = await fetch(API_ENDPOINTS.AUTH.REGISTER, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Registration failed');
        }

        // After successful registration, login automatically
        return await login({ email: payload.email, password: payload.password });
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
}