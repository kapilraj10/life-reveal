import React, { createContext, useState, ReactNode } from "react";
import { AuthUser } from "../types/auth";

type AuthContextType = {
    user: AuthUser | null;
    loginUser: (user: AuthUser) => void;
    logout: () => void;
};

export const AuthContext = createContext<AuthContextType>({
    user: null,
    loginUser: () => { },
    logout: () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);

    const loginUser = (user: AuthUser) => setUser(user);
    const logout = () => setUser(null);

    return (
        <AuthContext.Provider value={{ user, loginUser, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export default AuthProvider;
