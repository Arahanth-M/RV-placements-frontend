import { companyAPI } from "./api";

const dataUrls = new Map();
const waiters = new Map();
let queue = [];
let flushScheduled = false;
let batchUnsupported = false;

/** Small groups so a slow logo does not hold the rest of the page. */
const BATCH_CHUNK = 8;

function scheduleFlush() {
  if (flushScheduled) return;
  flushScheduled = true;
  queueMicrotask(() => {
    flushScheduled = false;
    const pending = queue;
    queue = [];
    if (!pending.length) return;
    void flushQueue(pending);
  });
}

function settle(cacheKey, value) {
  const resolvers = waiters.get(cacheKey) || [];
  waiters.delete(cacheKey);
  resolvers.forEach((resolve) => resolve(value));
}

async function flushQueue(pending) {
  const bySize = new Map();
  for (const item of pending) {
    const group = bySize.get(item.size) || [];
    group.push(item);
    bySize.set(item.size, group);
  }

  await Promise.all(
    [...bySize.entries()].map(async ([size, items]) => {
      const chunks = [];
      for (let offset = 0; offset < items.length; offset += BATCH_CHUNK) {
        chunks.push(items.slice(offset, offset + BATCH_CHUNK));
      }
      await Promise.all(chunks.map((chunk) => loadChunk(size, chunk)));
    })
  );
}

async function loadChunk(size, chunk) {
  if (batchUnsupported) {
    chunk.forEach((item) => settle(item.cacheKey, undefined));
    return;
  }
  try {
    const response = await companyAPI.getLogoBatch(
      chunk.map((item) => item.domain),
      size
    );
    const logos =
      response?.data?.logos && typeof response.data.logos === "object"
        ? response.data.logos
        : {};
    chunk.forEach((item) => {
      const dataUrl = typeof logos[item.domain] === "string" ? logos[item.domain] : "";
      if (dataUrl) {
        dataUrls.set(item.cacheKey, dataUrl);
        settle(item.cacheKey, dataUrl);
      } else {
        settle(item.cacheKey, undefined);
      }
    });
  } catch (error) {
    if (error?.response?.status === 404) batchUnsupported = true;
    chunk.forEach((item) => settle(item.cacheKey, undefined));
  }
}

export function peekCompanyLogo(cacheKey) {
  if (!cacheKey) return null;
  return dataUrls.get(cacheKey) || null;
}

/**
 * Join the in-flight logo batch for this domain/size.
 * Resolves to a data URL, null when there is no domain, or undefined when the
 * caller should fall back to the single-logo URL.
 * @param {{ cacheKey: string, domain: string, size: number }} target
 */
export function requestCompanyLogo(target) {
  const cacheKey = target?.cacheKey || "";
  const domain = target?.domain || "";
  const size = target?.size;
  if (!cacheKey || !domain) return Promise.resolve(null);
  const cached = dataUrls.get(cacheKey);
  if (cached) return Promise.resolve(cached);

  return new Promise((resolve) => {
    const existing = waiters.get(cacheKey);
    if (existing) {
      existing.push(resolve);
      return;
    }
    waiters.set(cacheKey, [resolve]);
    queue.push({ cacheKey, domain, size });
    scheduleFlush();
  });
}

/** Test helper. */
export function resetCompanyLogoBatchState() {
  dataUrls.clear();
  waiters.clear();
  queue = [];
  flushScheduled = false;
  batchUnsupported = false;
}
