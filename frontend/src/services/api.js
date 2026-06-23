import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/admin/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  register: (data) => api.post('/auth/register', data),
};

// Menu
export const menuAPI = {
  getAll: (params) => api.get('/menu', { params }),
  getOne: (id) => api.get(`/menu/${id}`),
  getPopular: () => api.get('/menu/popular'),
  create: (data) => api.post('/menu', data),
  update: (id, data) => api.put(`/menu/${id}`, data),
  delete: (id) => api.delete(`/menu/${id}`),
};

// Orders
export const orderAPI = {
  create: (data) => api.post('/orders', data),
  getAll: (params) => api.get('/orders', { params }),
  getOne: (id) => api.get(`/orders/${id}`),
  getById: (id) => api.get(`/orders/${id}`),
  getByTable: (tableNumber) => api.get(`/orders/table/${tableNumber}`),
  updateStatus: (id, data) => api.put(`/orders/${id}/status`, data),
  callWaiter: (data) => api.post('/orders/call-waiter', data),
};

// Tables
export const tableAPI = {
  getAll: () => api.get('/tables'),
  getByNumber: (number) => api.get(`/tables/${number}`),
  create: (data) => api.post('/tables', data),
  generateQR: (number) => api.get(`/tables/${number}/qr`),
  updateStatus: (id, data) => api.put(`/tables/${id}/status`, data),
};

// Payments
export const paymentAPI = {
  cash: (data) => api.post('/payments/cash', data),
  cashPayment: (data) => api.post('/payments/cash', data),
};

// Analytics
export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
};

// Config
export const configAPI = {
  get: () => api.get('/config'),
  update: (data) => api.put('/config', data),
};

// Recommendations
export const recommendationAPI = {
  get: (data) => api.post('/recommendations', data),
};

export default api;
