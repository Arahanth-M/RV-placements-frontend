import axios from 'axios';
import { BASE_URL } from './constants';

const API = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

export const authAPI = {
  getCurrentUser: () => API.get('/api/auth/current_user'),
  logout: () => API.get('/api/auth/logout'),
};

export const companyAPI = {
  getAllCompanies: () => API.get('/api/companies'),
  getCompany: (id) => API.get(`/api/companies/${id}`),
  createCompany: (data) => API.post('/api/companies', data),
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
  getSubmissions: () => API.get('/api/admin/submissions'),
  getUserCount: () => API.get('/api/admin/stats/users'),
  approveSubmission: (id) => API.post(`/api/admin/submissions/${id}/approve`),
};

export default API;