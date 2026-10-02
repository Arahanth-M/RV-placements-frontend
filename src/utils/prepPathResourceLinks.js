import { PREP_PATH_RESOURCE_CATALOG } from "../config/prepPathResourceCatalog.js";

const BY_ID = new Map(PREP_PATH_RESOURCE_CATALOG.map((entry) => [entry.id, entry]));

function normalizeResourceId(value) {
  const id = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return BY_ID.has(id) ? id : "";
}

export function resolvePrepResourceById(resourceId) {
  const id = normalizeResourceId(resourceId);
  if (!id) return null;
  const entry = BY_ID.get(id);
  if (!entry) return null;
  return {
    resourceId: entry.id,
    title: entry.title,
    url: entry.url,
    why: entry.why,
  };
}

function pickResourceFromBlob(blob) {
  const text = String(blob || "").toLowerCase().trim();
  if (!text) return null;

  const segments = text
    .split(/[+/,;&|]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  for (const segment of segments.length ? segments : [text]) {
    for (const entry of PREP_PATH_RESOURCE_CATALOG) {
      if (entry.keys.some((key) => segment.includes(key))) {
        return entry;
      }
    }
  }

  for (const entry of PREP_PATH_RESOURCE_CATALOG) {
    if (entry.keys.some((key) => text.includes(key))) {
      return entry;
    }
  }
  return null;
}

/**
 * Resolve a curated resource link for a subtopic/task pair.
 * Prefers validated resourceId; falls back to keyword match. Returns null if nothing fits.
 */
export function resolvePrepResourceLink({
  resourceId,
  title,
  topicTitle,
  taskTitle,
  notes,
} = {}) {
  const fromId = resolvePrepResourceById(resourceId);
  if (fromId) return fromId;

  const chunks = [title, notes, taskTitle, topicTitle]
    .map((part) => String(part || "").trim())
    .filter(Boolean);

  for (const chunk of chunks) {
    const hit = pickResourceFromBlob(chunk);
    if (hit) {
      return {
        resourceId: hit.id,
        title: hit.title,
        url: hit.url,
        why: hit.why,
      };
    }
  }
  return null;
}
