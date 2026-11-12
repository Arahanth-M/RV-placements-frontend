const STORAGE_PREFIX = "rv.platformEnhanceDone.v2";

export const PLATFORM_ENHANCE_COMPLETION_FIELDS = Object.freeze([
  "question",
  "intuition",
  "explanation",
  "cpp",
  "java",
  "python",
]);

export const PLATFORM_ENHANCE_FIELD_SHORT_LABELS = Object.freeze({
  question: "Q",
  intuition: "Intuition",
  explanation: "Expl",
  cpp: "C++",
  java: "Java",
  python: "Py",
  all: "All",
});

function storageKey(companyId, scope) {
  return `${STORAGE_PREFIX}:${String(companyId || "").trim()}:${String(scope || "").trim()}`;
}

function normalizeFailedIndexes(value) {
  if (!Array.isArray(value)) return [];
  const out = [];
  const seen = new Set();
  for (const raw of value) {
    const index = Number(raw);
    if (!Number.isInteger(index) || index < 0 || seen.has(index)) continue;
    seen.add(index);
    out.push(index);
  }
  return out;
}

function asProgress(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const passed = Math.max(0, Number(value.passed) || 0);
  const remaining = Math.max(0, Number(value.remaining) || 0);
  const total = Math.max(0, Number(value.total) || 0) || passed + remaining;
  // Explicit complete:false must win — otherwise Everything with remaining=0 looked done.
  const complete =
    value.complete === true
      ? true
      : value.complete === false
        ? false
        : total > 0 && remaining === 0;
  const failedIndexes = normalizeFailedIndexes(value.failedIndexes);
  return { passed, remaining, total, complete, failedIndexes };
}

function progressFromStats(stats) {
  const attempted = Math.max(0, Number(stats?.attempted) || 0);
  const passed = Math.max(0, Number(stats?.successCount) || 0);
  const remaining = Math.max(0, Number(stats?.failureCount) || 0);
  const failedIndexes = normalizeFailedIndexes(stats?.failedIndexes);
  // Skip-only / zero-attempt with no failures still counts as complete for that category.
  if (attempted < 1 && remaining < 1) {
    return { passed: 0, remaining: 0, total: 0, complete: true, failedIndexes: [] };
  }
  return {
    passed,
    remaining,
    total: attempted,
    complete: remaining === 0,
    failedIndexes,
  };
}

function mergeFieldProgressAfterRetry(prevProgress, stats, attemptedIndexes) {
  const prev = asProgress(prevProgress) || {
    passed: 0,
    remaining: 0,
    total: 0,
    complete: false,
    failedIndexes: [],
  };
  const newlyFailed = normalizeFailedIndexes(stats?.failedIndexes);
  const attempted = normalizeFailedIndexes(attemptedIndexes);
  const newlySucceededCount = attempted.filter((index) => !newlyFailed.includes(index)).length;
  const passed = prev.passed + newlySucceededCount;
  const total = Math.max(prev.total, passed + newlyFailed.length);
  return {
    passed,
    remaining: newlyFailed.length,
    total,
    complete: newlyFailed.length === 0,
    failedIndexes: newlyFailed,
  };
}

function recomputeEverythingProgress(state) {
  let completeCount = 0;
  let trackedCount = 0;
  let itemPassed = 0;
  let itemTotal = 0;
  for (const field of PLATFORM_ENHANCE_COMPLETION_FIELDS) {
    const progress = asProgress(state?.[field]);
    if (!progress) continue;
    trackedCount += 1;
    itemPassed += progress.passed;
    itemTotal += progress.total;
    if (progress.complete) completeCount += 1;
  }
  const fieldCount = PLATFORM_ENHANCE_COMPLETION_FIELDS.length;
  const allFieldsPresent = PLATFORM_ENHANCE_COMPLETION_FIELDS.every((field) =>
    Boolean(asProgress(state?.[field]))
  );
  const complete = allFieldsPresent && completeCount === fieldCount;
  if (complete) {
    return {
      passed: itemPassed,
      remaining: 0,
      total: itemTotal,
      complete: true,
      failedIndexes: [],
    };
  }
  if (trackedCount < 1) return null;
  // Everything partial progress is counted in categories, not individual questions.
  return {
    passed: completeCount,
    remaining: fieldCount - completeCount,
    total: fieldCount,
    complete: false,
    failedIndexes: [],
  };
}

function normalizeCompletionMap(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out = {};
  for (const [key, value] of Object.entries(raw)) {
    if (value === true) {
      out[key] = {
        passed: 0,
        remaining: 0,
        total: 0,
        complete: true,
        failedIndexes: [],
      };
      continue;
    }
    if (value === false) continue;
    const progress = asProgress(value);
    if (progress) out[key] = progress;
  }
  // Repair older bad saves where Everything was marked complete after one field.
  const repairedAll = recomputeEverythingProgress(out);
  if (repairedAll) out.all = repairedAll;
  else delete out.all;
  return out;
}

/**
 * Prefer server-backed completion from company detail/list; fall back to local cache.
 * @returns {Record<string, { passed: number, remaining: number, total: number, complete: boolean, failedIndexes?: number[] }>}
 */
export function loadPlatformEnhanceCompletion(companyId, scope, serverCompletion = null) {
  const fromServer = normalizeCompletionMap(
    serverCompletion && typeof serverCompletion === "object"
      ? serverCompletion[scope]
      : null
  );
  if (Object.keys(fromServer).length > 0) return fromServer;

  if (typeof window === "undefined" || !companyId || !scope) return {};
  try {
    const raw = window.localStorage.getItem(storageKey(companyId, scope));
    if (!raw) return {};
    return normalizeCompletionMap(JSON.parse(raw));
  } catch {
    return {};
  }
}

/** Compact OA / Interview summary for company cards. */
export function summarizeEnhanceScope(completionMap) {
  const map = normalizeCompletionMap(completionMap);
  const fields = PLATFORM_ENHANCE_COMPLETION_FIELDS;
  let completeCount = 0;
  let partialCount = 0;
  let passed = 0;
  let remaining = 0;
  for (const field of fields) {
    const progress = asProgress(map[field]);
    if (!progress) continue;
    passed += progress.passed;
    remaining += progress.remaining;
    if (progress.complete) completeCount += 1;
    else if (progress.remaining > 0) partialCount += 1;
  }
  const all = asProgress(map.all);
  const tracked = fields.filter((field) => asProgress(map[field])).length;
  if (tracked < 1 && !all) return null;
  const complete =
    (all?.complete === true && tracked === fields.length) ||
    completeCount === fields.length;
  return {
    complete,
    partial: !complete && (partialCount > 0 || tracked > 0 || (all && all.remaining > 0)),
    completeCount,
    fieldCount: fields.length,
    passed: all?.passed ?? passed,
    remaining: all?.remaining ?? remaining,
  };
}

/**
 * Per-field marks for company cards (only fields that have been run).
 * @returns {{ field: string, label: string, complete: boolean, passed: number, remaining: number }[]}
 */
export function listEnhanceFieldMarks(completionMap) {
  const map = normalizeCompletionMap(completionMap);
  const marks = [];
  for (const field of PLATFORM_ENHANCE_COMPLETION_FIELDS) {
    const progress = asProgress(map[field]);
    if (!progress) continue;
    marks.push({
      field,
      label: PLATFORM_ENHANCE_FIELD_SHORT_LABELS[field] || field,
      complete: progress.complete === true,
      passed: progress.passed,
      remaining: progress.remaining,
    });
  }
  return marks;
}

/** @param {Record<string, object>} next */
export function savePlatformEnhanceCompletion(companyId, scope, next) {
  if (typeof window === "undefined" || !companyId || !scope) return;
  try {
    window.localStorage.setItem(storageKey(companyId, scope), JSON.stringify(next || {}));
  } catch {
    // ignore quota / private mode
  }
}

export function isEnhanceCategoryComplete(entry) {
  if (entry === true) return true;
  const progress = asProgress(entry);
  return Boolean(progress?.complete);
}

export function getEnhanceCategoryProgress(entry) {
  if (entry === true) {
    return { passed: 0, remaining: 0, total: 0, complete: true, failedIndexes: [] };
  }
  return asProgress(entry);
}

/** Failed question indexes still open for a field, if any. */
export function getFailedIndexesForField(completion, field) {
  const progress = getEnhanceCategoryProgress(completion?.[field]);
  if (!progress || progress.complete) return [];
  return normalizeFailedIndexes(progress.failedIndexes);
}

/**
 * Pick indexes for the next enhance run.
 * If the field (or Everything) has recorded failures, retry only those.
 */
export function resolveEnhanceRunIndexes({
  allIndexes,
  completion,
  fields,
}) {
  const list = Array.isArray(allIndexes) ? allIndexes.filter((i) => Number.isInteger(i) && i >= 0) : [];
  const fieldList = Array.isArray(fields) ? fields : [];
  const allowed = new Set(list);

  if (fieldList.length === 1) {
    const failed = getFailedIndexesForField(completion, fieldList[0]).filter((i) =>
      allowed.has(i)
    );
    if (failed.length > 0) {
      return { indexes: failed, retryFailedOnly: true };
    }
    return { indexes: list, retryFailedOnly: false };
  }

  // Everything: retry if any tracked field still has failures.
  const failedUnion = [];
  const seen = new Set();
  let hasFailures = false;
  for (const field of fieldList) {
    const failed = getFailedIndexesForField(completion, field).filter((i) => allowed.has(i));
    if (failed.length > 0) {
      hasFailures = true;
      for (const index of failed) {
        if (seen.has(index)) continue;
        seen.add(index);
        failedUnion.push(index);
      }
    }
  }
  if (hasFailures) {
    // Include all indexes so never-run fields can still be filled; per-field
    // shouldEnhance restricts already-partial fields to failedIndexes only.
    return { indexes: list, retryFailedOnly: true };
  }
  return { indexes: list, retryFailedOnly: false };
}

/**
 * For Everything retries: skip complete fields; for partial fields only retry failures.
 */
export function shouldEnhanceIndexForRetry(completion, index, field, { codingOnlyCheck } = {}) {
  if (typeof codingOnlyCheck === "function" && !codingOnlyCheck(index, field)) {
    return false;
  }
  const progress = getEnhanceCategoryProgress(completion?.[field]);
  if (!progress) return true; // never run
  if (progress.complete) return false;
  const failed = normalizeFailedIndexes(progress.failedIndexes);
  if (failed.length > 0) return failed.includes(index);
  return true;
}

/**
 * Merge completion progress after a company enhance run.
 * Stores passed/remaining/failedIndexes per field.
 */
export function mergePlatformEnhanceCompletion(
  prev,
  { fields, fieldStats, indexes = null, retryFailedOnly = false }
) {
  const next = { ...(prev && typeof prev === "object" ? prev : {}) };
  const fieldList = Array.isArray(fields) ? fields : [];
  const attemptedIndexes = Array.isArray(indexes) ? indexes : null;

  for (const field of fieldList) {
    const stats = fieldStats?.[field];
    if (
      retryFailedOnly &&
      fieldList.length === 1 &&
      attemptedIndexes &&
      getFailedIndexesForField(prev, field).length > 0
    ) {
      next[field] = mergeFieldProgressAfterRetry(prev?.[field], stats, attemptedIndexes);
      continue;
    }
    if (retryFailedOnly && fieldList.length > 1) {
      const prevFailed = getFailedIndexesForField(prev, field);
      if (prevFailed.length > 0) {
        next[field] = mergeFieldProgressAfterRetry(prev?.[field], stats, prevFailed);
        continue;
      }
      // Field was never run or had no failures — use full stats if attempted.
      if (Number(stats?.attempted || 0) > 0 || Number(stats?.skippedCount || 0) > 0) {
        next[field] = progressFromStats(stats);
      }
      continue;
    }
    next[field] = progressFromStats(stats);
  }

  const everything = recomputeEverythingProgress(next);
  if (everything) next.all = everything;
  else delete next.all;

  return next;
}

/** Key for one in-flight per-question enhance job. */
export function platformEnhanceBusyKey(index, field) {
  return `${Number(index)}:${String(field || "")}`;
}

/** Fields currently enhancing for a question index. */
export function platformEnhanceBusyFieldsForIndex(busyKeys, index) {
  const prefix = `${Number(index)}:`;
  const keys = busyKeys instanceof Set ? busyKeys : new Set(busyKeys || []);
  const fields = [];
  for (const key of keys) {
    if (!String(key).startsWith(prefix)) continue;
    fields.push(String(key).slice(prefix.length));
  }
  return fields;
}

export function addPlatformEnhanceBusyKey(busyKeys, index, field) {
  const next = new Set(busyKeys instanceof Set ? busyKeys : []);
  next.add(platformEnhanceBusyKey(index, field));
  return next;
}

export function removePlatformEnhanceBusyKey(busyKeys, index, field) {
  const next = new Set(busyKeys instanceof Set ? busyKeys : []);
  next.delete(platformEnhanceBusyKey(index, field));
  return next;
}
