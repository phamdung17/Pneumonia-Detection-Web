import { create } from "zustand";
import api from "../api/axios";

interface User {
  id: number;
  username: string;
  email: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  full_name: string;
  role: "admin" | "client";
  is_active: boolean;
  created_at: string;
  last_login?: string | null;
}

interface LoginCredentials {
  username: string;
  password: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  hasInitialized: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isInitializing: true,
  hasInitialized: false,
  login: async (credentials) => {
    const response = await api.post("/api/auth/login", credentials);
    const { access_token, refresh_token, user } = response.data;
    localStorage.setItem("access_token", access_token);
    localStorage.setItem("refresh_token", refresh_token);
    set({ user, isAuthenticated: true, isInitializing: false, hasInitialized: true });
    return user;
  },
  logout: async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    try {
      if (refreshToken) {
        await api.post("/api/auth/logout", { refresh_token: refreshToken });
      }
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      set({ user: null, isAuthenticated: false, isInitializing: false, hasInitialized: true });
    }
  },
  loadUser: async () => {
    const token = localStorage.getItem("access_token");
    const refreshToken = localStorage.getItem("refresh_token");
    if (!token && !refreshToken) {
      set({ user: null, isAuthenticated: false, isInitializing: false, hasInitialized: true });
      return;
    }

    set({ isInitializing: true });
    try {
      if (!token && refreshToken) {
        const refreshResponse = await api.post("/api/auth/refresh", { refresh_token: refreshToken });
        const { access_token, refresh_token } = refreshResponse.data;
        localStorage.setItem("access_token", access_token);
        if (refresh_token) {
          localStorage.setItem("refresh_token", refresh_token);
        }
      }
      const response = await api.get("/api/auth/me");
      set({ user: response.data, isAuthenticated: true, isInitializing: false, hasInitialized: true });
    } catch {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      set({ user: null, isAuthenticated: false, isInitializing: false, hasInitialized: true });
    }
  },
  setUser: (user) => {
    set({ user, isAuthenticated: Boolean(user), isInitializing: false, hasInitialized: true });
  },
}));
