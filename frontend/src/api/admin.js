import api from './axios';

export const getUsersApi = (params) => api.get('/api/admin/users', { params }).then((res) => res.data);
export const createUserApi = (payload) => api.post('/api/admin/users', payload).then((res) => res.data);
export const updateUserApi = (userId, payload) =>
  api.put(`/api/admin/users/${userId}`, payload).then((res) => res.data);
export const unlockUserApi = (userId) =>
  api.put(`/api/admin/users/${userId}/unlock`).then((res) => res.data);
export const deleteUserApi = (userId) =>
  api.delete(`/api/admin/users/${userId}`).then((res) => res.data);
export const getAuditApi = (params) => api.get('/api/admin/audit', { params }).then((res) => res.data);
