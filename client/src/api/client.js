import axios from 'axios';

// In dev VITE_API_URL is blank → "/api" is proxied to the Express server.
const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const api = axios.create({ baseURL: `${base}/api` });

// Normalise errors so callers get a clean message string.
api.interceptors.response.use(
  (res) => res,
  (err) =>
    Promise.reject(
      new Error(err.response?.data?.message || err.message || 'Request failed')
    )
);

export default api;
