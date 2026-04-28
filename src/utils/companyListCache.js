const companyCache = {};
const companyPreviewCache = {};

const COMPANY_SESSION_PREFIX = "companies_";
const COMPANY_PREVIEW_SESSION_PREFIX = "companies_preview_";

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

export function getCachedCompanies(year) {
  const key = String(year ?? "");
  if (!key) return null;
  return companyCache[key] ?? readSessionCache(COMPANY_SESSION_PREFIX, key);
}

export function setCachedCompanies(year, data) {
  const key = String(year ?? "");
  if (!key) return;
  companyCache[key] = data;
  writeSessionCache(COMPANY_SESSION_PREFIX, key, data);
}

export function getCachedCompanyPreview(year) {
  const key = String(year ?? "");
  if (!key) return null;
  return companyPreviewCache[key] ?? readSessionCache(COMPANY_PREVIEW_SESSION_PREFIX, key);
}

export function setCachedCompanyPreview(year, data) {
  const key = String(year ?? "");
  if (!key) return;
  companyPreviewCache[key] = data;
  writeSessionCache(COMPANY_PREVIEW_SESSION_PREFIX, key, data);
}
