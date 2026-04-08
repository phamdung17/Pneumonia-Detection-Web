import { create } from "zustand";
import api from "../api/axios";

interface User {
  id: string;
  username: string;
  full_name: string;
  role: "admin" | "doctor" | "technician";
  department: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: any) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
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
  },
  logout: async () => {
    try {
      await api.post("/api/auth/logout");
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
    } catch (error) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      set({ user: null, isAuthenticated: false });
    }
  },
}));
