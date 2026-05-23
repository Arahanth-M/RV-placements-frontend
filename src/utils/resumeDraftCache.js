const CACHE_PREFIX = "resume_builder_draft:";

export function getResumeDraftCacheKey(email) {
  const normalized = String(email || "").trim().toLowerCase();
  return normalized ? `${CACHE_PREFIX}${normalized}` : null;
}

export function readResumeDraftCache(email) {
  const key = getResumeDraftCacheKey(email);
  if (!key) return null;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeResumeDraftCache(email, data) {
  const key = getResumeDraftCacheKey(email);
  if (!key) return;
  try {
    sessionStorage.setItem(
      key,
      JSON.stringify({
        ...data,
        cachedAt: new Date().toISOString(),
      })
    );
  } catch {
    // sessionStorage full or unavailable
  }
}

export function clearResumeDraftCache(email) {
  const key = getResumeDraftCacheKey(email);
  if (key) sessionStorage.removeItem(key);
}

export function clearAllResumeDraftCaches() {
  Object.keys(sessionStorage).forEach((key) => {
    if (key.startsWith(CACHE_PREFIX)) sessionStorage.removeItem(key);
  });
}
