// import axios from 'axios';
// import { BASE_URL } from './constants';

// const API = axios.create({
//   baseURL: BASE_URL,
//   withCredentials: true,
// });

// export const authAPI = {
//   getCurrentUser: () => API.get('/auth/current_user'),
//   logout: () => API.get('/auth/logout'),
// };

// export const companyAPI = {
//   getAllCompanies: () => API.get('/api/companies'),
//   getCompany: (id) => API.get(`/api/companies/${id}`),
//   createCompany: (data) => API.post('/api/companies', data),
// };

// export const experienceAPI = {
//   getExperiences: () => API.get('/api/experiences'),
// };

// export default API; 

import axios from 'axios';
import { BASE_URL } from './constants';

const API = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

export const authAPI = {
  // ✅ These now correctly point to /api/auth/* routes
  getCurrentUser: () => API.get('/auth/current_user'),
  logout: () => API.get('/auth/logout'),
};

export const companyAPI = {
  // ✅ These correctly point to /api/companies/* routes  
  getAllCompanies: () => API.get('/companies'),
  getCompany: (id) => API.get(`/companies/${id}`),
  createCompany: (data) => API.post('/companies', data),
};

export const experienceAPI = {
  // ✅ This correctly points to /api/experiences route
  getExperiences: () => API.get('/experiences'),
};

export default API;