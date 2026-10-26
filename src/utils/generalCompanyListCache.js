const MEMORY_KEY = "general";
const SESSION_KEY = "general_companies_v1";
const SESSION_TTL_MS = 10 * 60 * 1000;

/** Survives leaving a company card and coming back, within this page session. */
const memory = new Map();

function readSession() {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.list)) return null;
    if (typeof parsed.cachedAt !== "number") return null;
    if (Date.now() - parsed.cachedAt > SESSION_TTL_MS) return null;
    return parsed.list.length ? parsed.list : null;
  } catch {
    return null;
  }
}

export function clearGeneralCompanyListCache() {
  memory.delete(MEMORY_KEY);
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

export function readGeneralCompanyList() {
  const cached = memory.get(MEMORY_KEY);
  if (Array.isArray(cached) && cached.length) return cached;
  const fromSession = readSession();
  if (fromSession) memory.set(MEMORY_KEY, fromSession);
  return fromSession;
}

export function writeGeneralCompanyList(list) {
  if (!Array.isArray(list) || list.length === 0) return;
  memory.set(MEMORY_KEY, list);
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ cachedAt: Date.now(), list })
    );
  } catch {
    // Quota or private mode — memory cache still covers back navigation.
  }
}
