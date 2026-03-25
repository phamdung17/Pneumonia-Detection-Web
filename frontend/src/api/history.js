import api from './axios';

export const getHistoryApi = (params) => api.get('/api/history/', { params }).then((res) => res.data);
export const getHistoryDetailApi = (predictionId) =>
  api.get(`/api/history/${predictionId}`).then((res) => res.data);
