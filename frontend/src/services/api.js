import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const meetingsApi = {
  list: (params) => api.get('/meetings', { params }),
  get: (id) => api.get(`/meetings/${id}`),
  upload: (formData, onProgress) => api.post('/meetings/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress,
  }),
  delete: (id) => api.delete(`/meetings/${id}`),
};

export const actionItemsApi = {
  list: (params) => api.get('/action-items', { params }),
  update: (id, data) => api.put(`/action-items/${id}`, data),
  delete: (id) => api.delete(`/action-items/${id}`),
};

export const chatApi = {
  ask: (message, meetingId = null) => api.post('/chat', { message, meeting_id: meetingId }),
};

export const analyticsApi = {
  get: () => api.get('/analytics'),
};

export const settingsApi = {
  get: () => api.get('/settings'),
  update: (data) => api.post('/settings', data),
  testKey: (apiKey) => api.post('/settings/test-key', { api_key: apiKey }),
  seedDemo: (force = false) => api.post('/settings/seed-demo', null, { params: { force } }),
};

export default api;
