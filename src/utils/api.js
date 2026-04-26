import axios from 'axios';
import { BASE_URL } from './constants';

const API = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// In-flight promise deduplication: only one network request for companies list at a time
let companiesListPromise = null;
const companyDetailsPromises = new Map();

const INTERVIEW_SUMMARY_CACHE_TTL_MS = 30 * 1000;
const INTERVIEW_DETAIL_CACHE_TTL_MS = 120 * 1000;

const interviewSummaryCache = new Map();
const interviewDetailCache = new Map();
const interviewSummaryPromises = new Map();
const interviewDetailPromises = new Map();

function getInterviewSummaryCacheKey(userId, page, limit) {
  return `${encodeURIComponent(String(userId || ''))}|${Number(page) || 1}|${Number(limit) || 10}`;
}

function getFreshCachedEntry(cacheMap, key, ttlMs) {
  const cached = cacheMap.get(key);
  if (!cached) return null;
  if (Date.now() - cached.at > ttlMs) {
    cacheMap.delete(key);
    return null;
  }
  return cached.value;
}

function setCachedEntry(cacheMap, key, value) {
  cacheMap.set(key, { value, at: Date.now() });
}

function clearInterviewSummaryCacheForUser(userId) {
  const needle = `${encodeURIComponent(String(userId || ''))}|`;
  for (const key of interviewSummaryCache.keys()) {
    if (key.startsWith(needle)) {
      interviewSummaryCache.delete(key);
    }
  }
  for (const key of interviewSummaryPromises.keys()) {
    if (key.startsWith(needle)) {
      interviewSummaryPromises.delete(key);
    }
  }
}

export const authAPI = {
  getCurrentUser: () => API.get('/api/auth/current_user'),
  logout: () => API.get('/api/auth/logout'),
  isAdmin: () => API.get('/api/auth/is_admin'),
};

export const companyAPI = {
  async getAllCompanies() {
    if (!companiesListPromise) {
      companiesListPromise = (async () => {
        try {
          const res = await API.get('/api/companies');
          const list = Array.isArray(res.data) ? res.data : [];
          return { data: list };
        } finally {
          companiesListPromise = null;
        }
      })();
    }
    return companiesListPromise;
  },

  /** 2026 category tiles: small counts + 5 logo rows per bucket (does not block on full /api/companies) */
  getPreviewLogos: () => API.get('/api/companies/preview-logos'),

  /**
   * @param {string} id
   * @param {{ year?: number }} [options] placement visit year (2026 / 2027); defaults to 2026
   */
  async getCompany(id, options = {}) {
    if (!id) return Promise.reject(new Error('Company id is required'));

    let year = options.year != null ? Number(options.year) : 2026;
    if (!Number.isFinite(year)) year = 2026;
    const dedupeKey = `${id}:y${year}`;

    if (!companyDetailsPromises.has(dedupeKey)) {
      companyDetailsPromises.set(
        dedupeKey,
        API.get(`/api/companies/${id}`, { params: { year } }).finally(() => {
          companyDetailsPromises.delete(dedupeKey);
        })
      );
    }
    return companyDetailsPromises.get(dedupeKey);
  },

  async prefetchCompany(id) {
    if (!id) return;
    try {
      await companyAPI.getCompany(id);
    } catch {
      // Best-effort prefetch; navigation path handles errors.
    }
  },

  /**
   * @param {string} id
   * @param {{ year?: number }} [options] placement visit year (must match selected year on detail page)
   */
  async refreshCompany(id, options = {}) {
    if (!id) return Promise.reject(new Error('Company id is required'));
    let year = options.year != null ? Number(options.year) : 2026;
    if (!Number.isFinite(year)) year = 2026;
    return API.get(`/api/companies/${id}`, { params: { year } });
  },

  createCompany: (data) =>
    API.post('/api/companies', data).then((res) => {
      companiesListPromise = null;
      return res;
    }),

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

export const getAdminStats = () => API.get('/api/admin/stats');

function adminPlacementYearParams(opts = {}) {
  let year = opts.year != null ? Number(opts.year) : 2026;
  if (!Number.isFinite(year)) year = 2026;
  return { year };
}

export const adminAPI = {
  getStats: () => getAdminStats(),
  getSubmissions: (config) => API.get('/api/admin/submissions', config),
  getSubmission: (id) => API.get(`/api/admin/submissions/${id}`),
  getUserCount: () => API.get('/api/admin/stats/users'),
  approveSubmission: (id) => API.post(`/api/admin/submissions/${id}/approve`),
  rejectSubmission: (id) => API.delete(`/api/admin/submissions/${id}/reject`),
  deleteApprovedSubmission: (id) => API.delete(`/api/admin/submissions/${id}/delete`),
  getCompanies: (config) => API.get('/api/admin/companies', config),
  approveCompany: (id, opts = {}) =>
    API.post(`/api/admin/companies/${id}/approve`, null, { params: adminPlacementYearParams(opts) }),
  rejectCompany: (id) => API.delete(`/api/admin/companies/${id}/reject`),
  deleteApprovedCompany: (id) => API.delete(`/api/admin/companies/${id}/delete`),
  updateOAQuestion: (companyId, index, data, opts = {}) =>
    API.put(`/api/admin/companies/${companyId}/oa-questions/${index}`, data, {
      params: adminPlacementYearParams(opts),
    }),
  deleteOAQuestion: (companyId, index, opts = {}) =>
    API.delete(`/api/admin/companies/${companyId}/oa-questions/${index}`, {
      params: adminPlacementYearParams(opts),
    }),
  updateInterviewQuestion: (companyId, index, data, opts = {}) =>
    API.put(`/api/admin/companies/${companyId}/interview-questions/${index}`, data, {
      params: adminPlacementYearParams(opts),
    }),
  deleteInterviewQuestion: (companyId, index, opts = {}) =>
    API.delete(`/api/admin/companies/${companyId}/interview-questions/${index}`, {
      params: adminPlacementYearParams(opts),
    }),
  updateInterviewProcess: (companyId, index, data, opts = {}) =>
    API.put(`/api/admin/companies/${companyId}/interview-process/${index}`, data, {
      params: adminPlacementYearParams(opts),
    }),
  deleteInterviewProcess: (companyId, index, opts = {}) =>
    API.delete(`/api/admin/companies/${companyId}/interview-process/${index}`, {
      params: adminPlacementYearParams(opts),
    }),
  updateCompanyStats: (companyId, data, opts = {}) =>
    API.put(`/api/admin/companies/${companyId}/stats`, data, { params: adminPlacementYearParams(opts) }),
  adjustCompanyTotalGotIn: (companyId, delta, opts = {}) =>
    API.patch(`/api/admin/companies/${companyId}/total-got-in`, { delta }, {
      params: adminPlacementYearParams(opts),
    }),
  updateCompanyRoles: (companyId, roles, opts = {}) =>
    API.put(`/api/admin/companies/${companyId}/roles`, { roles }, { params: adminPlacementYearParams(opts) }),
  updateCompanyGeneralInfo: (companyId, data, opts = {}) =>
    API.put(`/api/admin/companies/${companyId}/general`, data, { params: adminPlacementYearParams(opts) }),
  getMissingCompanies: () => API.get('/api/admin/missing-companies'),
  updateMissingCompanyStatus: (id, status) => API.patch(`/api/admin/missing-companies/${id}/status`, { status }),
  deleteMissingCompany: (id) => API.delete(`/api/admin/missing-companies/${id}`),
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
    return API.get(`/api/year-stats/${year}`);
  },
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
  getProfile: () => API.get("/api/students/profile"),
};

export const resumeAPI = {
  getDraft: () => API.get("/api/resume/draft"),
  saveDraft: ({ payload, version }) => API.put("/api/resume/draft", { payload, version }),
  exportPdf: (payload) =>
    API.post("/api/resume/export", { payload }, { responseType: "blob" }),
};

export const submitMissingCompany = (data) => {
  return API.post("/api/missing-companies", data);
};

export const placementAPI = {
  submitPlacementData: (companyId, data) => API.post(`/api/placement/${companyId}/placement-data`, data),
};

export const leaderboardAPI = {
  getLeaderboard: () => API.get('/api/leaderboard'),
  getPreviousDayTopContributor: () => API.get('/api/leaderboard/previous-day-top'),
};

export const interviewAPI = {
  previewInterviewPlan: (companyId) =>
    API.get(`/api/interview/preview-plan/${companyId}`),
  async startInterview({ userId, companyId }) {
    const res = await API.post('/api/interview/start-interview', { userId, companyId });
    clearInterviewSummaryCacheForUser(userId);
    if (res?.data?.sessionId) {
      interviewDetailCache.delete(String(res.data.sessionId));
      interviewDetailPromises.delete(String(res.data.sessionId));
    }
    return res;
  },
  async submitAnswer({ sessionId, answer }) {
    const res = await API.post('/api/interview/submit-answer', { sessionId, answer }, { timeout: 30000 });
    interviewDetailCache.delete(String(sessionId));
    interviewDetailPromises.delete(String(sessionId));
    return res;
  },
  async moveToNextRound({ sessionId }) {
    const res = await API.post('/api/interview/move-to-next-round', { sessionId });
    interviewDetailCache.delete(String(sessionId));
    interviewDetailPromises.delete(String(sessionId));
    return res;
  },
  async discardInterview(sessionId) {
    const res = await API.delete(`/api/interview/discard/${encodeURIComponent(sessionId)}`);
    interviewDetailCache.delete(String(sessionId));
    interviewDetailPromises.delete(String(sessionId));
    return res;
  },
  getResumableInterview: ({ userId, companyId }) =>
    API.get('/api/interview/resume-interview', { params: { userId, companyId } }),
  getInterviewStatus: (sessionId) =>
    API.get(`/api/interview/interview-status/${encodeURIComponent(sessionId)}`, {
      timeout: 15000,
    }),
  async getUserInterviewSessions(userId, options = {}) {
    const page = Number(options.page) || 1;
    const limit = Number(options.limit) || 10;
    const key = getInterviewSummaryCacheKey(userId, page, limit);
    const cached = getFreshCachedEntry(
      interviewSummaryCache,
      key,
      INTERVIEW_SUMMARY_CACHE_TTL_MS
    );
    if (cached) {
      return { data: cached };
    }

    if (!interviewSummaryPromises.has(key)) {
      interviewSummaryPromises.set(
        key,
        API.get(`/api/interview/sessions/${encodeURIComponent(userId)}`, {
          params: { page, limit },
        })
          .then((res) => {
            setCachedEntry(interviewSummaryCache, key, res.data);
            return res;
          })
          .finally(() => {
            interviewSummaryPromises.delete(key);
          })
      );
    }
    return interviewSummaryPromises.get(key);
  },
  async getInterviewSessionDetail(sessionId) {
    const key = String(sessionId);
    const cached = getFreshCachedEntry(
      interviewDetailCache,
      key,
      INTERVIEW_DETAIL_CACHE_TTL_MS
    );
    if (cached) {
      return { data: cached };
    }

    if (!interviewDetailPromises.has(key)) {
      interviewDetailPromises.set(
        key,
        API.get(`/api/interview/session/${encodeURIComponent(sessionId)}`)
          .then((res) => {
            setCachedEntry(interviewDetailCache, key, res.data);
            return res;
          })
          .finally(() => {
            interviewDetailPromises.delete(key);
          })
      );
    }
    return interviewDetailPromises.get(key);
  },
  invalidateUserInterviewSummaryCache: (userId) => clearInterviewSummaryCacheForUser(userId),
  invalidateInterviewSessionDetailCache: (sessionId) => {
    interviewDetailCache.delete(String(sessionId));
    interviewDetailPromises.delete(String(sessionId));
  },
  getUserAnalytics: (userId) =>
    API.get(`/api/interview/analytics/${encodeURIComponent(userId)}`),
};

export default API;
