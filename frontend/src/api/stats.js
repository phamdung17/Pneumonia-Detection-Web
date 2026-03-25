import api from './axios';

export const getMyStatsApi = () => api.get('/api/stats/me').then((res) => res.data);
export const getAllStatsApi = () => api.get('/api/stats/all').then((res) => res.data);
export const getWeeklyStatsApi = () => api.get('/api/stats/weekly').then((res) => res.data);
