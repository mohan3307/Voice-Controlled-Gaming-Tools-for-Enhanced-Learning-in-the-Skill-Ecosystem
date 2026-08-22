// Centralized API Base URL config for deployment
// In development: Uses Vite proxy (relative /api)
// In production (GitHub Pages): Uses Render backend URL from env var

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const getApiUrl = (path: string): string => {
  return `${API_BASE_URL}${path}`;
};

export const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || '/';
