import toast from 'react-hot-toast';
import { create } from 'zustand';
import { changePasswordApi, loginApi, logoutApi, meApi, registerApi } from '../api/auth';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: Boolean(localStorage.getItem('access_token')),
  isBootstrapping: true,
  async login(credentials) {
    const data = await loginApi(credentials);
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    if (credentials.rememberMe) localStorage.setItem('remember_me', '1');
    set({ user: data.user, isAuthenticated: true });
    return data;
  },
  async register(payload) {
    const data = await registerApi(payload);
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    localStorage.setItem('remember_me', '1');
    set({ user: data.user, isAuthenticated: true });
    return data;
  },
  async logout() {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) await logoutApi(refreshToken);
    } catch {
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('remember_me');
      set({ user: null, isAuthenticated: false });
    }
  },
  async refreshToken() {
    return localStorage.getItem('access_token');
  },
  async loadUser() {
    const token = localStorage.getItem('access_token');
    if (!token) {
      set({ isBootstrapping: false, isAuthenticated: false, user: null });
      return null;
    }
    try {
      const user = await meApi();
      set({ user, isAuthenticated: true, isBootstrapping: false });
      return user;
    } catch {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      set({ user: null, isAuthenticated: false, isBootstrapping: false });
      return null;
    }
  },
  async changePassword(payload) {
    const response = await changePasswordApi(payload);
    toast.success('Doi mat khau thanh cong');
    return response;
  },
}));
