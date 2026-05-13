import axios from 'axios';
import { BASE_URL } from './constants';
import { DEFAULT_PLACEMENT_DETAIL_YEAR } from '../constants/placementYears.js';

const API = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// In-flight promise deduplication: only one network request for companies list at a time
let companiesListPromise = null;
const companyDetailsPromises = new Map();
const previewLogosPromises = new Map();

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
  async getAllCompanies(options = {}) {
    let year = options.year != null ? Number(options.year) : null;
    if (year != null && !Number.isFinite(year)) year = null;
    const clusterRaw =
      typeof options.cluster === "string" ? options.cluster.trim().toLowerCase() : "";
    const cluster =
      clusterRaw === "cs" || clusterRaw === "cse"
        ? "cs"
        : clusterRaw === "ec" || clusterRaw === "ece"
          ? "ec"
          : clusterRaw === "me"
            ? "me"
            : clusterRaw === "chem" || clusterRaw === "ch" || clusterRaw === "bt"
              ? "chem"
              : "";
    const key = `${year == null ? "all" : `y${year}`}:c${cluster || "_"}`;
    if (!companiesListPromise) companiesListPromise = new Map();
    if (!companiesListPromise.has(key)) {
      companiesListPromise.set(
        key,
        (async () => {
        try {
          const res = await API.get('/api/companies', {
            params:
              year == null && !cluster
                ? undefined
                : {
                    ...(year == null ? {} : { year }),
                    ...(cluster ? { cluster } : {}),
                  },
          });
          const list = Array.isArray(res.data) ? res.data : [];
          return { data: list };
        } finally {
          companiesListPromise.delete(key);
          if (companiesListPromise.size === 0) {
            companiesListPromise = null;
          }
        }
      })()
      );
    }
    return companiesListPromise.get(key);
  },

  /** Year-aware category tiles: small counts + 5 logo rows per bucket. */
  getPreviewLogos: (options = {}) => {
    let year = options.year != null ? Number(options.year) : null;
    if (year != null && !Number.isFinite(year)) year = null;
    const clusterRaw =
      typeof options.cluster === "string" ? options.cluster.trim().toLowerCase() : "";
    const cluster =
      clusterRaw === "cs" || clusterRaw === "cse"
        ? "cs"
        : clusterRaw === "ec" || clusterRaw === "ece"
          ? "ec"
          : clusterRaw === "me"
            ? "me"
            : "";
    const key = `${year == null ? "all" : `y${year}`}:c${cluster || "_"}`;
    if (!previewLogosPromises.has(key)) {
      previewLogosPromises.set(
        key,
        API.get('/api/companies/preview-logos', {
          params: {
            ...(year == null ? {} : { year }),
            ...(cluster ? { cluster } : {}),
          },
        }).finally(() => {
          previewLogosPromises.delete(key);
        })
      );
    }
    return previewLogosPromises.get(key);
  },

  /**
   * @param {string} id
   * @param {{ year?: number, placementContext?: string, placementCompanyVisitId?: string, placementCluster?: string }} [options] placement visit year; optional list context + exact visit id + hub cluster for multi-slot years
   */
  async getCompany(id, options = {}) {
    if (!id) return Promise.reject(new Error('Company id is required'));

    let year = options.year != null ? Number(options.year) : DEFAULT_PLACEMENT_DETAIL_YEAR;
    if (!Number.isFinite(year)) year = DEFAULT_PLACEMENT_DETAIL_YEAR;
    const ctxRaw =
      typeof options.placementContext === 'string' ? options.placementContext.trim() : '';
    const visitIdRaw =
      typeof options.placementCompanyVisitId === 'string'
        ? options.placementCompanyVisitId.trim()
        : '';
    const clusterRaw =
      typeof options.placementCluster === 'string' ? options.placementCluster.trim() : '';
    const dedupeKey = `${id}:y${year}:pc:${ctxRaw || '_'}:v:${visitIdRaw || '_'}:cl:${clusterRaw || '_'}`;

    if (!companyDetailsPromises.has(dedupeKey)) {
      companyDetailsPromises.set(
        dedupeKey,
        API.get(`/api/companies/${id}`, {
          params: {
            year,
            ...(ctxRaw ? { placementContext: ctxRaw } : {}),
            ...(visitIdRaw ? { placementCompanyVisitId: visitIdRaw } : {}),
            ...(clusterRaw ? { placementCluster: clusterRaw } : {}),
          },
        }).finally(() => {
          companyDetailsPromises.delete(dedupeKey);
        })
      );
    }
    return companyDetailsPromises.get(dedupeKey);
  },

  /**
   * @param {string} id
   * @param {{ year?: number }} [options] optional placement year to warm cache for category deep links
   */
  async prefetchCompany(id, options = {}) {
    if (!id) return;
    try {
      await companyAPI.getCompany(id, options);
    } catch {
      // Best-effort prefetch; navigation path handles errors.
    }
  },

  /**
   * @param {string} id
   * @param {{ year?: number, placementContext?: string, placementCompanyVisitId?: string, placementCluster?: string }} [options] placement visit year (must match selected year on detail page)
   */
  async refreshCompany(id, options = {}) {
    if (!id) return Promise.reject(new Error('Company id is required'));
    let year = options.year != null ? Number(options.year) : DEFAULT_PLACEMENT_DETAIL_YEAR;
    if (!Number.isFinite(year)) year = DEFAULT_PLACEMENT_DETAIL_YEAR;
    const ctxRaw =
      typeof options.placementContext === 'string' ? options.placementContext.trim() : '';
    const visitIdRaw =
      typeof options.placementCompanyVisitId === 'string'
        ? options.placementCompanyVisitId.trim()
        : '';
    const clusterRaw =
      typeof options.placementCluster === 'string' ? options.placementCluster.trim() : '';
    return API.get(`/api/companies/${id}`, {
      params: {
        year,
        ...(ctxRaw ? { placementContext: ctxRaw } : {}),
        ...(visitIdRaw ? { placementCompanyVisitId: visitIdRaw } : {}),
        ...(clusterRaw ? { placementCluster: clusterRaw } : {}),
      },
    });
  },

  createCompany: (data) =>
    API.post('/api/companies', data).then((res) => {
      companiesListPromise = null;
      return res;
    }),

  incrementHelpfulCount: (id) => API.post(`/api/companies/${id}/helpful`),

  getHelpfulStatus: (id) => API.get(`/api/companies/${id}/helpful/status`),

  getHelpfulStatusBatch: (companyIds) =>
    API.post('/api/companies/helpful/status/batch', { companyIds }),
};

export const experienceAPI = {
  getExperiences: () => API.get('/api/experiences'),
};

export const getAdminStats = () => API.get('/api/admin/stats');

function adminPlacementYearParams(opts = {}) {
  let year = opts.year != null ? Number(opts.year) : DEFAULT_PLACEMENT_DETAIL_YEAR;
  if (!Number.isFinite(year)) year = DEFAULT_PLACEMENT_DETAIL_YEAR;
  const params = { year };
  const vid =
    opts.companyVisitId != null && String(opts.companyVisitId).trim() !== ''
      ? String(opts.companyVisitId).trim()
      : '';
  if (vid) params.companyVisitId = vid;
  const ctx =
    opts.placementContext != null && String(opts.placementContext).trim() !== ''
      ? String(opts.placementContext).trim()
      : '';
  if (ctx) params.placementContext = ctx;
  return params;
}

export const adminAPI = {
  getStats: () => getAdminStats(),
  getSubmissions: (config) => API.get('/api/admin/submissions', config),
  getSubmission: (id) => API.get(`/api/admin/submissions/${id}`),
  getUserCount: () => API.get('/api/admin/stats/users'),
  assignSpc: (data) => API.post('/api/admin/assign-spc', data),
  getSpcs: () => API.get('/api/admin/spcs'),
  revokeSpc: (id) => API.patch(`/api/admin/spcs/${id}/revoke`),
  approveSubmission: (id) => API.post(`/api/admin/submissions/${id}/approve`),
  rejectSubmission: (id) => API.delete(`/api/admin/submissions/${id}/reject`),
  deleteApprovedSubmission: (id) => API.delete(`/api/admin/submissions/${id}/delete`),
  getCompanies: (config) => API.get('/api/admin/companies', config),
  approveCompany: (id, opts = {}) =>
    API.post(`/api/admin/companies/${id}/approve`, null, { params: adminPlacementYearParams(opts) }),
  rejectCompany: (id, opts = {}) =>
    API.delete(`/api/admin/companies/${id}/reject`, { params: adminPlacementYearParams(opts) }),
  deleteApprovedCompany: (id, opts = {}) =>
    API.delete(`/api/admin/companies/${id}/delete`, { params: adminPlacementYearParams(opts) }),
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
  updateMustDoTopic: (companyId, index, data, opts = {}) =>
    API.put(`/api/admin/companies/${companyId}/must-do-topics/${index}`, data, {
      params: adminPlacementYearParams(opts),
    }),
  deleteMustDoTopic: (companyId, index, opts = {}) =>
    API.delete(`/api/admin/companies/${companyId}/must-do-topics/${index}`, {
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
  getStudentBatchColumnGuide: () => API.get('/api/admin/students/batch-import/column-guide'),
  getStudentPlacementStats: (year) =>
    API.get('/api/admin/students/placement-stats', {
      params: year == null ? undefined : { year },
    }),
  exportStudentPlacementStats: (year) =>
    API.get('/api/admin/students/placement-stats/export', {
      params: year == null ? undefined : { year },
      responseType: 'blob',
    }),
  importStudentsBatch: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return API.post('/api/admin/students/batch-import', formData);
  },
};

export const eventAPI = {
  getAllEvents: () => API.get('/api/events'),
  getEvent: (id) => API.get(`/api/events/${id}`),
  /** Student session: ids of events marked registered on the portal. */
  getMyRegistrations: () => API.get('/api/events/me/registrations'),
  /** Student session: append `event_id` to the student’s `registeredEventIds`. */
  registerForEvent: (eventId) => API.post(`/api/events/${eventId}/register`),
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

export const submissionAPI = {
  getMine: () => API.get("/api/submissions/mine"),
  updateMine: (id, data) => API.put(`/api/submissions/${encodeURIComponent(String(id))}`, data),
  deleteMine: (id) => API.delete(`/api/submissions/${encodeURIComponent(String(id))}`),
};

export const resumeAPI = {
  getDraft: () => API.get("/api/resume/draft"),
  saveDraft: ({ payload, version }) => API.put("/api/resume/draft", { payload, version }),
  exportPdf: (payload) =>
    API.post("/api/resume/export", { payload }, { responseType: "blob" }),
};

export const placementAPI = {
  submitPlacementData: (companyId, data) => API.post(`/api/placement/${companyId}/placement-data`, data),
};

export const spcAPI = {
  submitPlacement: (data) => API.post('/api/placement/spc/submit', data),
  getPlacementStatus: () => API.get('/api/placement/student/status'),
  companySuggest: (q, limit) =>
    API.get('/api/placement/spc/company-suggest', {
      params: { q, ...(limit != null ? { limit } : {}) },
    }),
  submitConversionDetails: (data) => API.post('/api/placement/spc/conversion-details', data),
  /** Company contribution submissions + placement/conversion rows filed by this SPC. */
  getMySubmissions: () => API.get('/api/placement/spc/my-submissions'),
  updatePlacementRecord: (placementId, data) =>
    API.put(`/api/placement/spc/placements/${encodeURIComponent(String(placementId || ""))}`, data),
};

export const leaderboardAPI = {
  getLeaderboard: () => API.get('/api/leaderboard'),
  getPreviousDayTopContributor: () => API.get('/api/leaderboard/previous-day-top'),
};

export const interviewAPI = {
  getInterviewVisitOptions: (companyId) =>
    API.get(`/api/interview/visit-options/${encodeURIComponent(companyId)}`),
  previewInterviewPlan: (
    companyId,
    { visitType = "", cluster = "", placementYear, mergePlacementByType } = {}
  ) =>
    API.get(`/api/interview/preview-plan/${encodeURIComponent(companyId)}`, {
      params: {
        placementVisitType: visitType,
        placementCluster: cluster,
        placementYear,
        mergePlacementByType,
      },
    }),
  async startInterview({
    userId,
    companyId,
    placementVisitType = "",
    placementCluster = "",
    placementYear,
    mergePlacementByType,
    interviewPlanMode = "custom",
    customRounds,
  }) {
    const res = await API.post('/api/interview/start-interview', {
      userId,
      companyId,
      placementVisitType,
      placementCluster,
      placementYear,
      mergePlacementByType,
      interviewPlanMode,
      customRounds,
    });
    clearInterviewSummaryCacheForUser(userId);
    if (res?.data?.sessionId) {
      interviewDetailCache.delete(String(res.data.sessionId));
      interviewDetailPromises.delete(String(res.data.sessionId));
    }
    return res;
  },
  async submitAnswer({ sessionId, answer, language }) {
    const body = { sessionId, answer };
    if (language) body.language = language;
    const res = await API.post('/api/interview/submit-answer', body, { timeout: 30000 });
    interviewDetailCache.delete(String(sessionId));
    interviewDetailPromises.delete(String(sessionId));
    return res;
  },
  runPreview: ({ sessionId, code, language }) =>
    API.post('/api/interview/run-preview', { sessionId, code, language }, { timeout: 30000 }),
  async beginQuestionReattempt({ sessionId }) {
    const res = await API.post('/api/interview/begin-question-reattempt', { sessionId });
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
  getResumableInterview: ({
    userId,
    companyId,
    placementVisitType = "",
    placementCluster = "",
    placementYear,
    mergePlacementByType,
  }) =>
    API.get('/api/interview/resume-interview', {
      params: {
        userId,
        companyId,
        placementVisitType,
        placementCluster,
        placementYear,
        mergePlacementByType,
      },
    }),
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
