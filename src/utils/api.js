import axios from 'axios';
import { BASE_URL } from './constants';

const API = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

export const authAPI = {
  getCurrentUser: () => API.get('/api/auth/current_user'),
  logout: () => API.get('/api/auth/logout'),
  isAdmin: () => API.get('/api/auth/is_admin'),
};

export const companyAPI = {
  getAllCompanies: () => API.get('/api/companies'),
  getCompany: (id) => API.get(`/api/companies/${id}`),
  createCompany: (data) => API.post('/api/companies', data),
  incrementHelpfulCount: (id) => API.post(`/api/companies/${id}/helpful`),
  getHelpfulStatus: (id) => API.get(`/api/companies/${id}/helpful/status`),
};

export const experienceAPI = {
  getExperiences: () => API.get('/api/experiences'),
};

export const leetcodeAPI = {
  getAllQuestions: (params) => API.get('/api/leetcode', { params }),
  getQuestion: (id) => API.get(`/api/leetcode/${id}`),
};

export const adminAPI = {
  getStats: () => API.get('/api/admin/stats'),
  getSubmissions: (config) => API.get('/api/admin/submissions', config),
  getUserCount: () => API.get('/api/admin/stats/users'),
  approveSubmission: (id) => API.post(`/api/admin/submissions/${id}/approve`),
  rejectSubmission: (id) => API.delete(`/api/admin/submissions/${id}/reject`),
  getCompanies: (config) => API.get('/api/admin/companies', config),
  approveCompany: (id) => API.post(`/api/admin/companies/${id}/approve`),
  rejectCompany: (id) => API.delete(`/api/admin/companies/${id}/reject`),
};

export const eventAPI = {
  getAllEvents: () => API.get('/api/events'),
  getEvent: (id) => API.get(`/api/events/${id}`),
  createEvent: (data) => API.post('/api/events', data),
  updateEvent: (id, data) => API.put(`/api/events/${id}`, data),
  deleteEvent: (id) => API.delete(`/api/events/${id}`),
};

export const yearStatsAPI = {
  getYearStats: (year) => API.get(`/api/year-stats/${year}`),
};

export const commentAPI = {
  getComments: (companyId, page = 1, limit = 20) => 
    API.get(`/api/companies/${companyId}/comments`, { params: { page, limit } }),
  createComment: (companyId, comment) => API.post(`/api/companies/${companyId}/comments`, { comment }),
  deleteComment: (commentId) => API.delete(`/api/comments/${commentId}`),
};

export const notificationAPI = {
  getNotifications: () => API.get('/api/notifications'),
  getUnreadCount: () => API.get('/api/notifications/unread/count'),
  markAsSeen: (id) => API.put(`/api/notifications/${id}/seen`),
  markAllAsSeen: () => API.put('/api/notifications/mark-all-seen'),
  deleteNotification: (id) => API.delete(`/api/notifications/${id}`),
  clearAllNotifications: () => API.delete('/api/notifications'),
};

export default API;