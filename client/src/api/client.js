import axios from 'axios';

// In dev VITE_API_URL is blank → "/api" is proxied to the Express server.
const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const api = axios.create({ baseURL: `${base}/api` });

// Attach auth token from localStorage if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('feasy_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalise errors so callers get a clean message string.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !window.location.pathname.startsWith('/login')) {
      localStorage.removeItem('feasy_token');
    }
    return Promise.reject(
      new Error(err.response?.data?.message || err.message || 'Request failed')
    );
  }
);

export default api;
