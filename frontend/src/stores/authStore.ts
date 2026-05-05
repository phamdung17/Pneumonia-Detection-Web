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
  login: (credentials: LoginCredentials) => Promise<User>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: async (credentials) => {
    const response = await api.post("/api/auth/login", credentials);
    const { access_token, refresh_token, user } = response.data;
    localStorage.setItem("access_token", access_token);
    localStorage.setItem("refresh_token", refresh_token);
    set({ user, isAuthenticated: true });
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
      set({ user: null, isAuthenticated: false });
    }
  },
  loadUser: async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    try {
      const response = await api.get("/api/auth/me");
      set({ user: response.data, isAuthenticated: true });
    } catch {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      set({ user: null, isAuthenticated: false });
    }
  },
  setUser: (user) => {
    set({ user, isAuthenticated: Boolean(user) });
  },
}));
