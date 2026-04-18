// Environment URLs
export const LOCALHOST_HOSTNAME = "localhost";
export const LOCALHOST_PORT = 7779;
export const PRODUCTION_DOMAIN = "lastminuteplacementprep.in";

// Base URL for backend API, prefers environment variable
export const BASE_URL = (() => {
  const envUrl = process.env.REACT_APP_API_URL;
  if (envUrl && typeof envUrl === 'string') {
    return envUrl;
  }

  const hostname = window.location.hostname;

  // Check for localhost or development environment
  if (hostname === LOCALHOST_HOSTNAME || hostname === '127.0.0.1' || hostname.includes('localhost')) {
    return `http://${LOCALHOST_HOSTNAME}:${LOCALHOST_PORT}`;
  }
  
  // Production environment - use the actual hostname to handle www subdomain
  return `https://${hostname}`;
})();

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
  BACKEND_PORT_ERROR: (port) => `❌ Error: ${createError()}\n\nPlease check if the backend server is running on port ${port}.`,
  SUBMISSION_SUCCESS: "Submission received and pending approval.",
  SUBMISSION_ERROR: "Something went wrong. Try again.",
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
  "https://docs.google.com/forms/d/e/1FAIpQLScRXllJ4WmuiIPicffKS4y3amX-6gjOMu31yGMu4XZeKaMukg/viewform?usp=dialog";

// Configuration
const FRONTEND_PORT = 5173;
export const CONFIG = {
  FRONTEND_PORT,
  BACKEND_PORT: LOCALHOST_PORT,
  PRODUCTION_URL: `https://${PRODUCTION_DOMAIN}`,
  LOCAL_URL: `http://${LOCALHOST_HOSTNAME}:${FRONTEND_PORT}`,
};

// Utility function to create error messages
const createError = () => `Backend server connection failed`;
