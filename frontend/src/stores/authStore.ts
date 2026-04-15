import { create } from "zustand";
import api from "../api/axios";

export type UserRole = "admin" | "doctor" | "technician";
export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  department: string | null;
  approval_status: ApprovalStatus;
  is_active: boolean;
}

interface LoginPayload {
  identifier: string;
  password: string;
}

interface RegisterPayload {
  full_name: string;
  username: string;
  email: string;
  password: string;
  role: Exclude<UserRole, "admin">;
  department?: string | null;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  login: (credentials: LoginPayload) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<{ message: string; user: User }>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isBootstrapping: true,
  login: async (credentials) => {
    const response = await api.post("/api/auth/login", credentials);
    const { access_token, refresh_token, user } = response.data;
    localStorage.setItem("access_token", access_token);
    localStorage.setItem("refresh_token", refresh_token);
    set({ user, isAuthenticated: true });
    return user;
  },
  register: async (payload) => {
    const response = await api.post("/api/auth/register", payload);
    return response.data;
  },
  logout: async () => {
    try {
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        await api.post("/api/auth/logout", { refresh_token: refreshToken });
      }
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      set({ user: null, isAuthenticated: false, isBootstrapping: false });
    }
  },
  loadUser: async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      set({ user: null, isAuthenticated: false, isBootstrapping: false });
      return;
    }
    try {
      const response = await api.get("/api/auth/me");
      set({ user: response.data, isAuthenticated: true, isBootstrapping: false });
    } catch {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      set({ user: null, isAuthenticated: false, isBootstrapping: false });
    }
  },
}));
