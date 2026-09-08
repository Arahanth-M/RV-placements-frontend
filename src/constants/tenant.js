/** First live institution slug. Page URLs only — APIs stay under /api. */
export const TENANT_SLUG = "rvce";
export const TENANT_BASE = `/${TENANT_SLUG}`;

/** Shared product shell for students whose college is not yet fully onboarded. */
export const GENERAL_SLUG = "general";
export const GENERAL_BASE = `/${GENERAL_SLUG}`;

/**
 * Prefix an in-app path with a shell base (`/rvce` or `/general`). Idempotent.
 */
export function pathUnderBase(base, path = "/") {
  const shell = String(base || TENANT_BASE).replace(/\/$/, "") || TENANT_BASE;
  if (path == null || path === "") return shell;
  const raw = String(path);
  if (/^https?:\/\//i.test(raw)) return raw;

  let hash = "";
  let rest = raw;
  const hashIdx = rest.indexOf("#");
  if (hashIdx >= 0) {
    hash = rest.slice(hashIdx);
    rest = rest.slice(0, hashIdx);
  }
  let search = "";
  const qIdx = rest.indexOf("?");
  if (qIdx >= 0) {
    search = rest.slice(qIdx);
    rest = rest.slice(0, qIdx);
  }

  let p = rest.startsWith("/") ? rest : `/${rest}`;
  if (p === shell || p.startsWith(`${shell}/`)) {
    return `${p}${search}${hash}`;
  }
  if (p === "/") return `${shell}${search}${hash}`;
  return `${shell}${p}${search}${hash}`;
}

/**
 * Prefix an in-app path with /rvce. Idempotent. Keeps query and hash.
 * "/" becomes "/rvce" (dashboard home, not the platform landing page).
 */
export function tenantPath(path = "/") {
  return pathUnderBase(TENANT_BASE, path);
}

export function generalPath(path = "/") {
  return pathUnderBase(GENERAL_BASE, path);
}

export function isTenantAppPath(pathname) {
  const p = String(pathname || "");
  return p === TENANT_BASE || p.startsWith(`${TENANT_BASE}/`);
}

export function isGeneralAppPath(pathname) {
  const p = String(pathname || "");
  return p === GENERAL_BASE || p.startsWith(`${GENERAL_BASE}/`);
}

/** True for either campus tenant or general product shell. */
export function isAppShellPath(pathname) {
  return isTenantAppPath(pathname) || isGeneralAppPath(pathname);
}

/** True when pathname is the app path or a nested path (e.g. /admin → /rvce/admin/...). */
export function isTenantPrefixPath(pathname, appPath) {
  const base = tenantPath(appPath).split("?")[0];
  const p = String(pathname || "");
  return p === base || p.startsWith(`${base}/`);
}

export function isPrefixUnderBase(pathname, base, appPath) {
  const full = pathUnderBase(base, appPath).split("?")[0];
  const p = String(pathname || "");
  return p === full || p.startsWith(`${full}/`);
}

/** Map a stored or legacy in-app path onto /rvce. Bare "/" is dashboard home. */
export function toTenantAppPath(storedPath) {
  if (!storedPath || storedPath === "/") return TENANT_BASE;
  const raw = String(storedPath);
  if (!raw.startsWith("/")) return TENANT_BASE;
  if (isGeneralAppPath(raw.split("?")[0])) {
    return generalPath(raw.slice(GENERAL_BASE.length) || "/");
  }
  const prefixed = tenantPath(raw);
  const pathname = prefixed.split("?")[0];
  if (
    pathname === tenantPath("/login") ||
    pathname === tenantPath("/auth/callback")
  ) {
    return TENANT_BASE;
  }
  return prefixed;
}

/**
 * After login, send RVCE users to /rvce and everyone else to /general.
 * Honors a stored redirect when it already matches the correct shell.
 */
export function toPostLoginAppPath(storedPath, { useGeneral = false } = {}) {
  const home = useGeneral ? GENERAL_BASE : TENANT_BASE;
  if (!storedPath || storedPath === "/") return home;
  const raw = String(storedPath);
  if (!raw.startsWith("/")) return home;

  let hash = "";
  let pathname = raw;
  const hashIdx = pathname.indexOf("#");
  if (hashIdx >= 0) {
    hash = pathname.slice(hashIdx);
    pathname = pathname.slice(0, hashIdx);
  }
  let search = "";
  const qIdx = pathname.indexOf("?");
  if (qIdx >= 0) {
    search = pathname.slice(qIdx);
    pathname = pathname.slice(0, qIdx);
  }

  if (
    pathname === "/login" ||
    pathname.endsWith("/login") ||
    pathname.includes("/auth/callback")
  ) {
    return home;
  }

  if (useGeneral) {
    if (isGeneralAppPath(pathname)) return `${pathname}${search}${hash}`;
    if (isTenantAppPath(pathname)) {
      const rest = pathname === TENANT_BASE ? "/" : pathname.slice(TENANT_BASE.length);
      return `${pathUnderBase(GENERAL_BASE, rest)}${search}${hash}`;
    }
    return `${pathUnderBase(GENERAL_BASE, pathname)}${search}${hash}`;
  }

  if (isGeneralAppPath(pathname)) return home;
  return toTenantAppPath(`${pathname}${search}${hash}`);
}
