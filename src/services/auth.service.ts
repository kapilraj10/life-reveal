import { LoginPayload, RegisterPayload } from "../types/auth";

// const API_URL = "";

export async function login(payload: LoginPayload){
    return {
        userId: "1",
        name:"john doe",
        email: payload.email,
        token: "demo-jwt-token"
    };
}


export async function register(payload: RegisterPayload){
    return {
        userId: "1",
        name: payload.name,
        email: payload.email,
        token: "demo-jwt-token"
    }
}