import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import api, { formatApiError } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);

    const refreshMe = useCallback(async () => {
        try {
            const { data } = await api.get("/auth/me");
            setUser(data);
            return data;
        } catch {
            setUser(false);
            return null;
        }
    }, []);

    useEffect(() => { refreshMe(); }, [refreshMe]);

    const login = async (username, password) => {
        try {
            const { data } = await api.post("/auth/login", { username, password });
            if (data?.token) localStorage.setItem("auth_token", data.token);
            setUser(data);
            return { ok: true };
        } catch (e) {
            return { ok: false, error: formatApiError(e.response?.data?.detail) };
        }
    };

    const register = async (payload) => {
        try {
            const { data } = await api.post("/auth/register", payload);
            if (data?.token) localStorage.setItem("auth_token", data.token);
            setUser(data);
            return { ok: true };
        } catch (e) {
            return { ok: false, error: formatApiError(e.response?.data?.detail) };
        }
    };

    const logout = async () => {
        try { await api.post("/auth/logout"); } catch {}
        localStorage.removeItem("auth_token");
        setUser(false);
    };

    return (
        <AuthContext.Provider value={{ user, setUser, login, register, logout, refreshMe }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() { return useContext(AuthContext); }
