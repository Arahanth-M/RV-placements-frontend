export const LOGIN_INTENT_KEY = "loginIntent";
export const LOGIN_INTENT_SPC = "spc";
export const LOGIN_INTENT_GENERAL = "general";
export const LOGIN_INTENT_CAMPUS = "campus";
export const LOGIN_INTENT_PLATFORM_ADMIN = "platform_admin";

/** Where to send the user after OAuth (e.g. /general/challenges). */
export const LOGIN_REDIRECT_PATH_KEY = "loginRedirectPath";

/**
 * Set while the tab is on Google OAuth. If the user hits Back without finishing,
 * the app sees this flag and keeps them logged out.
 */
export const OAUTH_IN_PROGRESS_KEY = "oauthInProgress";

const STORED_INTENTS = new Set([
  LOGIN_INTENT_SPC,
  LOGIN_INTENT_GENERAL,
  LOGIN_INTENT_CAMPUS,
  LOGIN_INTENT_PLATFORM_ADMIN,
]);

export function persistLoginIntent(intent) {
  if (STORED_INTENTS.has(intent)) {
    sessionStorage.setItem(LOGIN_INTENT_KEY, intent);
    return;
  }
  sessionStorage.removeItem(LOGIN_INTENT_KEY);
}

function isLoginOrCallbackPath(path) {
  const pathname = String(path || "").split("?")[0].split("#")[0];
  return (
    pathname === "/login" ||
    pathname.endsWith("/login") ||
    pathname.includes("/auth/callback")
  );
}

/** Store the in-app route to restore after Google sign-in. Skips /login itself. */
export function persistLoginRedirectPath(path) {
  const raw = String(path || "");
  if (!raw.startsWith("/") || isLoginOrCallbackPath(raw)) return;
  sessionStorage.setItem(LOGIN_REDIRECT_PATH_KEY, raw);
}

export function readLoginRedirectPath() {
  return sessionStorage.getItem(LOGIN_REDIRECT_PATH_KEY);
}

export function clearLoginRedirectPath() {
  sessionStorage.removeItem(LOGIN_REDIRECT_PATH_KEY);
}

/** Read and clear the stored post-login route. */
export function consumeLoginRedirectPath() {
  const value = readLoginRedirectPath();
  clearLoginRedirectPath();
  return value;
}

/**
 * Before leaving for Google OAuth, swap the `/login` history entry for the
 * page the user came from. Otherwise browser Back from Google reopens login.
 */
export function replaceLoginHistoryBeforeOAuth(fallbackPath = "/") {
  if (typeof window === "undefined" || !window.history?.replaceState) return;
  const currentPath = window.location.pathname || "";
  if (!isLoginOrCallbackPath(currentPath)) return;

  const stored = readLoginRedirectPath();
  let next = fallbackPath;
  if (stored && stored.startsWith("/") && !isLoginOrCallbackPath(stored)) {
    next = stored;
  } else if (!String(next).startsWith("/") || isLoginOrCallbackPath(next)) {
    next = "/";
  }
  window.history.replaceState(window.history.state, "", next);
}

export function markOAuthInProgress() {
  sessionStorage.setItem(OAUTH_IN_PROGRESS_KEY, "1");
}

export function clearOAuthInProgress() {
  sessionStorage.removeItem(OAUTH_IN_PROGRESS_KEY);
}

export function isOAuthInProgress() {
  return sessionStorage.getItem(OAUTH_IN_PROGRESS_KEY) === "1";
}

/** True when OAuth started but this load is not a successful auth callback. */
export function isAbandonedOAuthReturn() {
  if (!isOAuthInProgress()) return false;
  if (typeof window === "undefined") return true;
  const path = String(window.location.pathname || "");
  if (!path.includes("/auth/callback")) return true;
  const params = new URLSearchParams(window.location.search || "");
  const ok =
    params.get("login") === "success" || params.get("signup") === "success";
  return !ok;
}
