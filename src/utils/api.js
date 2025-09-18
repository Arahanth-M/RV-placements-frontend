import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:7779',
  withCredentials: true,
});

export const authAPI = {
  getCurrentUser: () => API.get('/auth/current_user'),
  logout: () => API.get('/auth/logout'),
};

export const companyAPI = {
  getAllCompanies: () => API.get('/api/companies'),
  getCompany: (id) => API.get(`/api/companies/${id}`),
  createCompany: (data) => API.post('/api/companies', data),
};

export const experienceAPI = {
  getExperiences: () => API.get('/api/experiences'),
};

export default API; 