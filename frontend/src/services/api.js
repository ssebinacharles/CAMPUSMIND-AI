import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refresh = localStorage.getItem('refresh_token');
        const res = await axios.post(`${API_BASE}/token/refresh/`, { refresh });
        localStorage.setItem('access_token', res.data.access);
        originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
        return api(originalRequest);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const register = (username, email, password) => api.post('/register/', { username, email, password });
export const login = async (username, password) => {
  const res = await api.post('/token/', { username, password });
  localStorage.setItem('access_token', res.data.access);
  localStorage.setItem('refresh_token', res.data.refresh);
  return res.data;
};
export const logout = () => localStorage.clear();
export const getCurrentUser = () => api.get('/me/');

export const sendMessage = (message, conversationId = null) => 
  api.post('/chat/', { message, conversation_id: conversationId });
export const listConversations = () => api.get('/conversations/');
export const getConversation = (id) => api.get(`/conversations/${id}/`);
export const deleteConversation = (id) => api.delete(`/conversations/${id}/delete/`);

export const logMood = (score, note = '') => api.post('/mood/log/', { score, note });
export const getMoodTrends = (days = 30) => api.get(`/mood/trends/?days=${days}`);
export const getMoodStats = () => api.get('/mood/stats/');

export default api;