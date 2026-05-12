const companyCache = {};
const companyPreviewCache = {};

const COMPANY_SESSION_PREFIX = "companies_";
const COMPANY_PREVIEW_SESSION_PREFIX = "companies_preview_";

/** Short TTL so hub cards pick up visit-row changes quickly (session + in-memory). */
const COMPANY_LIST_CACHE_TTL_MS = 3 * 60 * 1000;

function readSessionCache(prefix, key) {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`${prefix}${key}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeSessionCache(prefix, key, data) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(`${prefix}${key}`, JSON.stringify(data));
  } catch {
    // Best-effort cache only.
  }
}

function unwrapTimedArray(raw) {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) return null;
  if (typeof raw.cachedAt !== "number") return null;
  if (Date.now() - raw.cachedAt > COMPANY_LIST_CACHE_TTL_MS) return null;
  return Array.isArray(raw.list) ? raw.list : null;
}

function unwrapTimedPayload(raw) {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) return null;
  if (typeof raw.cachedAt !== "number") return null;
  if (Date.now() - raw.cachedAt > COMPANY_LIST_CACHE_TTL_MS) return null;
  return raw.payload ?? null;
}

export function getCachedCompanies(year, clusterScope = "") {
  const key = String(year ?? "");
  if (!key) return null;
  const scope = String(clusterScope ?? "").trim().toLowerCase();
  const scopedKey = `${key}::${scope || "all"}`;
  const raw =
    companyCache[scopedKey] ?? readSessionCache(COMPANY_SESSION_PREFIX, scopedKey);
  return unwrapTimedArray(raw);
}

export function setCachedCompanies(year, data, clusterScope = "") {
  const key = String(year ?? "");
  if (!key) return;
  const scope = String(clusterScope ?? "").trim().toLowerCase();
  const scopedKey = `${key}::${scope || "all"}`;
  const wrapped = { list: data, cachedAt: Date.now() };
  companyCache[scopedKey] = wrapped;
  writeSessionCache(COMPANY_SESSION_PREFIX, scopedKey, wrapped);
}

function previewCacheKey(year, clusterScope = "") {
  const y = String(year ?? "");
  const c = String(clusterScope ?? "").trim().toLowerCase() || "all";
  return `${y}::${c}`;
}

export function getCachedCompanyPreview(year, clusterScope = "") {
  const key = previewCacheKey(year, clusterScope);
  if (!String(year ?? "")) return null;
  const raw =
    companyPreviewCache[key] ?? readSessionCache(COMPANY_PREVIEW_SESSION_PREFIX, key);
  return unwrapTimedPayload(raw);
}

export function setCachedCompanyPreview(year, data, clusterScope = "") {
  const key = previewCacheKey(year, clusterScope);
  if (!String(year ?? "")) return;
  const wrapped = { payload: data, cachedAt: Date.now() };
  companyPreviewCache[key] = wrapped;
  writeSessionCache(COMPANY_PREVIEW_SESSION_PREFIX, key, wrapped);
}
