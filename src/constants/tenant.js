/** First live institution slug. Page URLs only — APIs stay under /api. */
export const TENANT_SLUG = "rvce";
export const TENANT_BASE = `/${TENANT_SLUG}`;

/**
 * Prefix an in-app path with /rvce. Idempotent. Keeps query and hash.
 * "/" becomes "/rvce" (dashboard home, not the platform landing page).
 */
export function tenantPath(path = "/") {
  if (path == null || path === "") return TENANT_BASE;
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
  if (p === TENANT_BASE || p.startsWith(`${TENANT_BASE}/`)) {
    return `${p}${search}${hash}`;
  }
  if (p === "/") return `${TENANT_BASE}${search}${hash}`;
  return `${TENANT_BASE}${p}${search}${hash}`;
}

export function isTenantAppPath(pathname) {
  const p = String(pathname || "");
  return p === TENANT_BASE || p.startsWith(`${TENANT_BASE}/`);
}

/** True when pathname is the app path or a nested path (e.g. /admin → /rvce/admin/...). */
export function isTenantPrefixPath(pathname, appPath) {
  const base = tenantPath(appPath).split("?")[0];
  const p = String(pathname || "");
  return p === base || p.startsWith(`${base}/`);
}

/** Map a stored or legacy in-app path onto /rvce. Bare "/" is dashboard home. */
export function toTenantAppPath(storedPath) {
  if (!storedPath || storedPath === "/") return TENANT_BASE;
  const raw = String(storedPath);
  if (!raw.startsWith("/")) return TENANT_BASE;
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
