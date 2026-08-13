// Environment URLs
export const LOCALHOST_HOSTNAME = "localhost";
/** Legacy monolith local port (rollback default). */
export const LOCALHOST_PORT = 7779;
/** Split stack: backend-main (compose.main.yml). */
export const LOCALHOST_MAIN_PORT = 7778;
/** Split stack: backend-interview (compose.interview.yml). */
export const LOCALHOST_INTERVIEW_PORT = 7777;
export const PRODUCTION_DOMAIN = "lastminuteplacementprep.in";

function trimApiBase(value) {
  if (value == null || typeof value !== "string") return "";
  return value.trim().replace(/\/+$/, "");
}

const envMainApi = trimApiBase(
  typeof process !== "undefined" ? process.env.REACT_APP_MAIN_API_URL : ""
);
const envInterviewApi = trimApiBase(
  typeof process !== "undefined" ? process.env.REACT_APP_INTERVIEW_API_URL : ""
);
const envLegacyApi = trimApiBase(
  typeof process !== "undefined" ? process.env.REACT_APP_API_URL : ""
);

/**
 * Local split-backend mode: set BOTH in `.env.development.local` (Vite):
 *   REACT_APP_MAIN_API_URL=http://localhost:7778
 *   REACT_APP_INTERVIEW_API_URL=http://localhost:7777
 * Rollback: remove both — app uses REACT_APP_API_URL or localhost:7779.
 */
export const IS_SPLIT_BACKEND_LOCAL =
  Boolean(envMainApi && envInterviewApi);

/** UI on :5173 with split compose — use even if build-time env vars were missing. */
function isBrowserLocalSplitDev() {
  if (typeof window === "undefined" || !window.location) return false;
  const host = window.location.hostname;
  const port = window.location.port;
  const onLocalHost =
    host === LOCALHOST_HOSTNAME || host === "127.0.0.1" || host.includes("localhost");
  const onDevUiPort = port === "5173" || port === "" || port === "80";
  return onLocalHost && onDevUiPort;
}

function resolveLegacyMonolithBaseUrl() {
  if (envLegacyApi) {
    return envLegacyApi;
  }

  const hostname =
    typeof window !== "undefined" && window.location ? window.location.hostname : "";

  if (hostname === LOCALHOST_HOSTNAME || hostname === "127.0.0.1" || hostname.includes("localhost")) {
    return `http://${LOCALHOST_HOSTNAME}:${LOCALHOST_PORT}`;
  }

  return `https://${hostname}`;
}

/** Main REST API (auth, companies, placement, …). In split local dev → :7778. */
export const BASE_URL = (() => {
  if (envMainApi) {
    return envMainApi;
  }
  if (isBrowserLocalSplitDev()) {
    return `http://${LOCALHOST_HOSTNAME}:${LOCALHOST_MAIN_PORT}`;
  }
  return resolveLegacyMonolithBaseUrl();
})();

/** Interview-only API. In split local dev → :7777; otherwise same as {@link BASE_URL}. */
export const INTERVIEW_API_BASE_URL = (() => {
  if (envInterviewApi) {
    return envInterviewApi;
  }
  if (isBrowserLocalSplitDev()) {
    return `http://${LOCALHOST_HOSTNAME}:${LOCALHOST_INTERVIEW_PORT}`;
  }
  return BASE_URL;
})();

function backendPortForMessages() {
  try {
    const u = new URL(BASE_URL);
    if (u.port) return u.port;
    return u.protocol === "https:" ? "443" : "80";
  } catch {
    return String(LOCALHOST_PORT);
  }
}

// API Endpoints
export const API_ENDPOINTS = {
  SUBMISSIONS: `${BASE_URL}/api/submissions`,
  AUTH_CURRENT_USER: `${BASE_URL}/api/auth/current_user`,
  AUTH_LOGOUT: `${BASE_URL}/api/auth/logout`,
  COMPANIES: `${BASE_URL}/api/companies`,
  EXPERIENCES: `${BASE_URL}/api/experiences`,
};

// Messages
export const MESSAGES = {
  BACKEND_PORT_ERROR: (port) =>
    `❌ Error: ${createError()}\n\nPlease check if the backend server is running on port ${port}.`,
  SUBMISSION_SUCCESS: "Submission received and pending approval.",
  /** Shown in the submission success dialog alongside the server status message. */
  SUBMISSION_CONTRIBUTION_NOTE:
    "Your contribution is highly valued. Thousands of RVians will benefit from your response.",
  SUBMISSION_ERROR: "Something went wrong. Try again.",
  INTERVIEW_LIMIT_REACHED:
    "You can take one AI mock interview every 7 days. Please try again later.",
  INTERVIEW_LIMIT_REQUEST_SUBMITTED:
    "Your request was sent to the admin team. You will be notified when it is reviewed.",
  INTERVIEW_LIMIT_REQUEST_PENDING:
    "You already have a pending request. Please wait for admin review or try again after your weekly limit resets.",
  VALIDATION_ERRORS: {
    COMPANY_NAME: "Invalid company name. Use 2–50 letters/numbers only.",
    POSITIVE_COUNT: "Count must be a positive integer.",
    EMPTY_FIELD: "cannot be empty.",
    MALICIOUS_SCRIPT: "Malicious script detected in",
  },
  AUTH_ERRORS: {
    NOT_LOGGED_IN: "⚠️ You must be logged in to add a company.",
    PLEASE_LOGIN: "Please login to view experiences.",
  },
};

/** Beta access request (Google Form). Set `REACT_APP_BETA_JOIN_FORM_URL` in `.env` for production. */
export const BETA_JOIN_FORM_URL =
  (typeof process !== "undefined" &&
    process.env.REACT_APP_BETA_JOIN_FORM_URL &&
    String(process.env.REACT_APP_BETA_JOIN_FORM_URL).trim()) ||
  "https://docs.google.com/forms/d/e/1FAIpQLSc0i2msKF5OqypG5lnYjnU_CppSQpfYZfZNqDAjCxQPKiyDPw/viewform";

/** Student feedback (Google Form). Set `REACT_APP_FEEDBACK_FORM_URL` in `.env` to override. */
export const FEEDBACK_FORM_URL =
  (typeof process !== "undefined" &&
    process.env.REACT_APP_FEEDBACK_FORM_URL &&
    String(process.env.REACT_APP_FEEDBACK_FORM_URL).trim()) ||
  "https://docs.google.com/forms/d/e/1FAIpQLSfiUSw6yFFy-id7_jRv-GKGS3cBcvYPKY-zN7NalR7TqZxvIQ/viewform?usp=publish-editor";

/** Hostnames where resume builder is on without rebuild (matches gradual rollout / prod domain). */
function isResumeBuilderAllowedHostname(hostname) {
  const h = String(hostname || "").trim().toLowerCase();
  if (!h) return false;
  if (h === "localhost" || h === "127.0.0.1") return true;
  const domain = String(PRODUCTION_DOMAIN || "").trim().toLowerCase();
  if (!domain) return false;
  return h === domain || h === `www.${domain}`;
}

/** Feature flag: env `REACT_APP_ENABLE_RESUME_BUILDER=1`, localhost, or production domain at runtime. */
export const RESUME_BUILDER_ENABLED =
  (typeof process !== "undefined" &&
    String(process.env.REACT_APP_ENABLE_RESUME_BUILDER || "").trim() === "1") ||
  (typeof window !== "undefined" && isResumeBuilderAllowedHostname(window.location.hostname));

// Configuration
const FRONTEND_PORT = 5173;
export const CONFIG = {
  FRONTEND_PORT,
  /** Port derived from {@link BASE_URL} for dev messages (7778 / 7779 / …). */
  BACKEND_PORT: backendPortForMessages(),
  PRODUCTION_URL: `https://${PRODUCTION_DOMAIN}`,
  LOCAL_URL: `http://${LOCALHOST_HOSTNAME}:${FRONTEND_PORT}`,
};

// Utility function to create error messages
const createError = () => `Backend server connection failed`;
