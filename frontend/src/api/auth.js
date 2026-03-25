import api from './axios';

export const loginApi = (payload) => api.post('/api/auth/login', payload).then((res) => res.data);
export const registerApi = (payload) => api.post('/api/auth/register', payload).then((res) => res.data);
export const logoutApi = (refreshToken) =>
  api.post('/api/auth/logout', { refresh_token: refreshToken }).then((res) => res.data);
export const meApi = () => api.get('/api/auth/me').then((res) => res.data);
export const changePasswordApi = (payload) =>
  api.put('/api/auth/me/password', payload).then((res) => res.data);
