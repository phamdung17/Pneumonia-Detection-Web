import api from './axios';

export const submitPredictApi = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/api/predict/', formData).then((res) => res.data);
};

export const getPredictResultApi = (taskId) => api.get(`/api/predict/${taskId}`).then((res) => res.data);
export const updateNoteApi = (predictionId, note) =>
  api.put(`/api/predict/${predictionId}/note`, { note }).then((res) => res.data);
export const updateConfirmApi = (predictionId, confirmed) =>
  api.put(`/api/predict/${predictionId}/confirm`, { confirmed }).then((res) => res.data);
export const exportPredictionApi = (predictionId) =>
  api.get(`/api/predict/${predictionId}/export`, { responseType: 'blob' }).then((res) => res.data);

export const submitBatchApi = (files) => {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  return api.post('/api/predict/batch', formData).then((res) => res.data);
};

export const getBatchApi = (batchId) => api.get(`/api/predict/batch/${batchId}`).then((res) => res.data);
