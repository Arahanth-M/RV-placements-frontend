import axios from 'axios';
import { BASE_URL } from './constants';
import {
  getCachedCompaniesList,
  setCachedCompaniesList,
  getCachedCompanyDetails,
  setCachedCompanyDetails,
  getCachedYearStats,
  setCachedYearStats,
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
const companyDetailsPromises = new Map();

// Cache TTL for company list/details: after this many ms, cached data is treated as stale
// and refetched from the server. Set to 2 minutes.
const CACHE_TTL_MS = 2 * 60 * 1000;

export const authAPI = {
  getCurrentUser: () => API.get('/api/auth/current_user'),
  logout: () => API.get('/api/auth/logout'),
  isAdmin: () => API.get('/api/auth/is_admin'),
};

// Cache-first company API: always prefer IndexedDB; hit backend only on cache miss
export const companyAPI = {
  async getAllCompanies() {
    // If offline, always try to use cached list without TTL
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      try {
        const cached = await getCachedCompaniesList(undefined);
        if (Array.isArray(cached)) {
          return { data: cached };
        }
      } catch (e) {
        console.warn('IndexedDB get companies list (offline) failed', e);
      }
      // No cached data available while offline
      return Promise.reject(new Error('Offline and no cached companies available'));
    }

    // 1. Try IndexedDB first – if we have a cached list within TTL, return it (no network call)
    try {
      const cached = await getCachedCompaniesList(CACHE_TTL_MS);
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

    // If offline, always try to use cached details without TTL
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      try {
        const cached = await getCachedCompanyDetails(id, undefined);
        if (cached != null && typeof cached === 'object' && (cached._id || cached.name)) {
          return { data: cached };
        }
      } catch (e) {
        console.warn('IndexedDB get company details (offline) failed', e);
      }
      return Promise.reject(new Error('Offline and no cached company available'));
    }

    // 1. Try IndexedDB first (within TTL) – but only use cache if it has full detail shape (e.g. onlineQuestions)
    try {
      const cached = await getCachedCompanyDetails(id, CACHE_TTL_MS);
      if (cached != null && typeof cached === 'object' && (cached._id || cached.name)) {
        // If cache looks like a list item (has focusTags but no onlineQuestions), it's incomplete – refetch
        const hasListShape = 'focusTags' in cached && !Array.isArray(cached.onlineQuestions);
        if (!hasListShape) {
          return { data: cached };
        }
      }
    } catch (e) {
      console.warn('IndexedDB get company details failed, falling back to API', e);
    }

    // 2. Cache miss or incomplete: fetch and store (deduped)
    if (!companyDetailsPromises.has(id)) {
      companyDetailsPromises.set(
        id,
        (async () => {
          try {
            const res = await API.get(`/api/companies/${id}`);
            try {
              await setCachedCompanyDetails(id, res.data);
            } catch (e) {
              console.warn('IndexedDB set company details failed', e);
            }
            return res;
          } finally {
            companyDetailsPromises.delete(id);
          }
        })()
      );
    }
    return companyDetailsPromises.get(id);
  },

  /** Warm detail cache ahead of navigation to reduce first-open latency. */
  async prefetchCompany(id) {
    if (!id) return;
    try {
      const cached = await getCachedCompanyDetails(id, CACHE_TTL_MS);
      if (cached != null && typeof cached === 'object' && (cached._id || cached.name)) {
        const hasListShape = 'focusTags' in cached && !Array.isArray(cached.onlineQuestions);
        if (!hasListShape) return;
      }
    } catch {
      // Ignore cache read errors and continue with a best-effort prefetch.
    }

    try {
      await companyAPI.getCompany(id);
    } catch {
      // Best-effort prefetch; navigation path handles errors.
    }
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
  updateOAQuestion: (companyId, index, data) => API.put(`/api/admin/companies/${companyId}/oa-questions/${index}`, data),
  deleteOAQuestion: (companyId, index) => API.delete(`/api/admin/companies/${companyId}/oa-questions/${index}`),
  updateInterviewQuestion: (companyId, index, data) => API.put(`/api/admin/companies/${companyId}/interview-questions/${index}`, data),
  deleteInterviewQuestion: (companyId, index) => API.delete(`/api/admin/companies/${companyId}/interview-questions/${index}`),
  updateInterviewProcess: (companyId, index, data) => API.put(`/api/admin/companies/${companyId}/interview-process/${index}`, data),
  deleteInterviewProcess: (companyId, index) => API.delete(`/api/admin/companies/${companyId}/interview-process/${index}`),
  updateCompanyStats: (companyId, data) => API.put(`/api/admin/companies/${companyId}/stats`, data),
  updateCompanyRoles: (companyId, roles) => API.put(`/api/admin/companies/${companyId}/roles`, { roles }),
};

export const eventAPI = {
  getAllEvents: () => API.get('/api/events'),
  getEvent: (id) => API.get(`/api/events/${id}`),
  createEvent: (data) => API.post('/api/events', data),
  updateEvent: (id, data) => API.put(`/api/events/${id}`, data),
  deleteEvent: (id) => API.delete(`/api/events/${id}`),
};

export const yearStatsAPI = {
  async getYearStats(year) {
    // 1. Try IndexedDB first – year stats are effectively static, so no TTL is used.
    try {
      const cached = await getCachedYearStats(year);
      if (cached != null) {
        return { data: cached };
      }
    } catch (e) {
      console.warn('IndexedDB get year stats failed, falling back to API', e);
    }

    // 2. Cache miss: fetch from API and store once
    const res = await API.get(`/api/year-stats/${year}`);
    try {
      await setCachedYearStats(year, res.data);
    } catch (e) {
      console.warn('IndexedDB set year stats failed', e);
    }
    return res;
  },
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

export const leaderboardAPI = {
  getLeaderboard: () => API.get('/api/leaderboard'),
};

export const interviewAPI = {
  previewInterviewPlan: (companyId) =>
    API.get(`/api/interview/preview-plan/${companyId}`),
  startInterview: ({ userId, companyId }) =>
    API.post('/api/interview/start-interview', { userId, companyId }),
  submitAnswer: ({ sessionId, answer }) =>
    API.post('/api/interview/submit-answer', { sessionId, answer }),
  moveToNextRound: ({ sessionId }) =>
    API.post('/api/interview/move-to-next-round', { sessionId }),
  discardInterview: (sessionId) =>
    API.delete(`/api/interview/discard/${encodeURIComponent(sessionId)}`),
  getResumableInterview: ({ userId, companyId }) =>
    API.get('/api/interview/resume-interview', { params: { userId, companyId } }),
  getUserInterviewSessions: (userId) =>
    API.get(`/api/interview/sessions/${encodeURIComponent(userId)}`),
};

export default API;