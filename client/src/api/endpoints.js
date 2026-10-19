import api from './client.js';

export const StudentsAPI = {
  list: (params) => api.get('/students', { params }).then((r) => r.data),
  get: (id) => api.get(`/students/${id}`).then((r) => r.data),
  create: (body) => api.post('/students', body).then((r) => r.data),
  update: (id, body) => api.put(`/students/${id}`, body).then((r) => r.data),
  remove: (id) => api.delete(`/students/${id}`).then((r) => r.data),
  payments: (id) => api.get(`/students/${id}/payments`).then((r) => r.data),
};

export const ClassesAPI = {
  list: () => api.get('/classes').then((r) => r.data),
  create: (body) => api.post('/classes', body).then((r) => r.data),
  update: (id, body) => api.put(`/classes/${id}`, body).then((r) => r.data),
  remove: (id) => api.delete(`/classes/${id}`).then((r) => r.data),
};

export const SubjectsAPI = {
  list: (params) => api.get('/subjects', { params }).then((r) => r.data),
  create: (body) => api.post('/subjects', body).then((r) => r.data),
  update: (id, body) => api.put(`/subjects/${id}`, body).then((r) => r.data),
  remove: (id) => api.delete(`/subjects/${id}`).then((r) => r.data),
};

export const PaymentsAPI = {
  list: (params) => api.get('/payments', { params }).then((r) => r.data),
  create: (body) => api.post('/payments', body).then((r) => r.data),
  remove: (id) => api.delete(`/payments/${id}`).then((r) => r.data),
};

export const DashboardAPI = {
  summary: () => api.get('/dashboard/summary').then((r) => r.data),
  charts: () => api.get('/dashboard/charts').then((r) => r.data),
  expiring: (params) => api.get('/dashboard/expiring', { params }).then((r) => r.data),
};

export const RemindersAPI = {
  list: (params) => api.get('/reminders', { params }).then((r) => r.data),
  send: (body) => api.post('/reminders/send', body).then((r) => r.data),
};

export const SettingsAPI = {
  get: () => api.get('/settings').then((r) => r.data),
  update: (body) => api.put('/settings', body).then((r) => r.data),
};

export const AuthAPI = {
  login: (data) => api.post('/auth/login', data).then((r) => r.data),
  register: (data) => api.post('/auth/register', data).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
};

export const WorkspacesAPI = {
  list: () => api.get('/workspaces').then((r) => r.data),
  create: (data) => api.post('/auth/register', data).then((r) => r.data),
  remove: (id) => api.delete(`/workspaces/${id}`).then((r) => r.data),
};

export const UsersAPI = {
  list: () => api.get('/users').then((r) => r.data),
  create: (data) => api.post('/users', data).then((r) => r.data),
  update: (id, data) => api.put(`/users/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/users/${id}`).then((r) => r.data),
};

export const AuditLogsAPI = {
  list: (params) => api.get('/audit-logs', { params }).then((r) => r.data),
};
