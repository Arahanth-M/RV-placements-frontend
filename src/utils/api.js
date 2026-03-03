import axios from 'axios';
import { BASE_URL } from './constants';
import {
  getCachedCompaniesList,
  setCachedCompaniesList,
  getCachedCompanyDetails,
  setCachedCompanyDetails,
  updateCachedHelpfulCount,
  clearCompaniesListCache,
  clearCompanyDetailsCache,
} from './companyCacheDB';

const API = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// In-flight promise deduplication: only one network request for companies list at a time
let companiesListPromise = null;

export const authAPI = {
  getCurrentUser: () => API.get('/api/auth/current_user'),
  logout: () => API.get('/api/auth/logout'),
  isAdmin: () => API.get('/api/auth/is_admin'),
};

// Cache-first company API: always prefer IndexedDB; hit backend only on cache miss
export const companyAPI = {
  async getAllCompanies() {
    // 1. Try IndexedDB first – if we have a cached list, return it (no network call)
    try {
      const cached = await getCachedCompaniesList();
      if (Array.isArray(cached)) {
        return { data: cached };
      }
    } catch (e) {
      console.warn('IndexedDB get companies list failed, falling back to API', e);
    }

    // 2. No cache: dedupe concurrent calls so we only hit the API once
    if (!companiesListPromise) {
      companiesListPromise = (async () => {
        try {
          const res = await API.get('/api/companies');
          const list = Array.isArray(res.data) ? res.data : [];
          try {
            await setCachedCompaniesList(list);
          } catch (e) {
            console.warn('IndexedDB set companies list failed', e);
          }
          return { data: list };
        } finally {
          companiesListPromise = null;
        }
      })();
    }
    return companiesListPromise;
  },

  async getCompany(id) {
    if (!id) return Promise.reject(new Error('Company id is required'));

    // 1. Try IndexedDB first
    try {
      const cached = await getCachedCompanyDetails(id);
      if (cached != null && typeof cached === 'object' && (cached._id || cached.name)) {
        return { data: cached };
      }
    } catch (e) {
      console.warn('IndexedDB get company details failed, falling back to API', e);
    }

    // 2. Cache miss: fetch and store
    const res = await API.get(`/api/companies/${id}`);
    try {
      await setCachedCompanyDetails(id, res.data);
    } catch (e) {
      console.warn('IndexedDB set company details failed', e);
    }
    return res;
  },

  /** Force refetch company from API (clears cache for this company). Use to see network request or get latest data. */
  async refreshCompany(id) {
    if (!id) return Promise.reject(new Error('Company id is required'));
    try {
      await clearCompanyDetailsCache(id);
    } catch (e) {
      console.warn('IndexedDB clear company details failed', e);
    }
    const res = await API.get(`/api/companies/${id}`);
    try {
      await setCachedCompanyDetails(id, res.data);
    } catch (e) {
      console.warn('IndexedDB set company details failed', e);
    }
    return res;
  },

  createCompany: (data) =>
    API.post('/api/companies', data).then((res) => {
      clearCompaniesListCache().catch(() => {});
      companiesListPromise = null; // force next getAllCompanies to refetch
      return res;
    }),

  async incrementHelpfulCount(id) {
    const res = await API.post(`/api/companies/${id}/helpful`);
    const newCount = res.data?.helpfulCount;
    if (typeof newCount === 'number') {
      try {
        await updateCachedHelpfulCount(id, newCount);
      } catch (e) {
        console.warn('IndexedDB update helpful count failed', e);
      }
    }
    return res;
  },

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
  deleteApprovedSubmission: (id) => API.delete(`/api/admin/submissions/${id}/delete`),
  getCompanies: (config) => API.get('/api/admin/companies', config),
  approveCompany: (id) => API.post(`/api/admin/companies/${id}/approve`),
  rejectCompany: (id) => API.delete(`/api/admin/companies/${id}/reject`),
  deleteApprovedCompany: (id) => API.delete(`/api/admin/companies/${id}/delete`),
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

export const studentAPI = {
  getStudentByUSN: (usn) => API.get(`/api/students/student-data/${usn}`),
  getStudentByName: (username) => API.get(`/api/students/student-data-by-name/${encodeURIComponent(username)}`),
};

export const placementAPI = {
  submitPlacementData: (companyId, data) => API.post(`/api/placement/${companyId}/placement-data`, data),
};

export default API;