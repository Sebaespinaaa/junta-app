import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Token en memoria — funciona siempre, incluso en navegador privado
let _memoryToken = null;

export function setMemoryToken(token) {
    _memoryToken = token;
}

const api = axios.create({
    baseURL: API,
    withCredentials: true,
});

api.interceptors.request.use((config) => {
    // Primero usa el token en memoria, si no hay intenta localStorage
    let token = _memoryToken;
    if (!token) {
        try { token = localStorage.getItem("auth_token"); } catch {}
    }
    if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export function formatApiError(detail) {
    if (detail == null) return "Algo salió mal. Intenta de nuevo.";
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) return detail.map((e) => e.msg || JSON.stringify(e)).join(" ");
    return String(detail);
}

export default api;
