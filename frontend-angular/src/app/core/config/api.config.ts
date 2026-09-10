export const API_BASE_URL = 'http://localhost:3000/api';

export const API_ENDPOINTS = {
  alerts: `${API_BASE_URL}/alerts`,
  facilities: `${API_BASE_URL}/facilities`,
  users: `${API_BASE_URL}/users`,
  dashboardStats: `${API_BASE_URL}/dashboard/stats`,
} as const;

export const API_DEFAULTS = {
  alertsPage: 1,
  alertsPageSize: 100,
} as const;