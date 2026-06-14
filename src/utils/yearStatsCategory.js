import {
  RUPEES_PER_LPA,
  categorizeTotalRupees,
  normalizeCtcComponentToRupees,
  sumCtcObjectToRupees,
} from "./ctcCategory.js";

const CTC_FIELD_NAMES = new Set(
  [
    "ctc",
    "package",
    "salary",
    "annual_ctc",
    "lpa",
    "ctc_lpa",
    "total",
  ].map((name) => name.toLowerCase())
);

const BASE_FIELD_NAMES = new Set(["base"]);

const EXPLICIT_TIER_FIELD_NAMES = new Set(
  ["category", "type", "tier", "placement_category", "placement_type", "placement type"].map((name) =>
    name.toLowerCase().replace(/[\s_-]+/g, "")
  )
);

function normalizeFieldKey(key) {
  return String(key || "")
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

function isNamedField(key, allowedNames) {
  const normalized = normalizeFieldKey(key);
  if (allowedNames.has(normalized)) return true;
  return Array.from(allowedNames).some(
    (name) => normalized === name || normalized.endsWith(name) || normalized.startsWith(name)
  );
}

/**
 * @param {unknown} value
 * @returns {number}
 */
function valueToRupees(value) {
  if (value && typeof value === "object" && !(value instanceof Date)) {
    return sumCtcObjectToRupees(value);
  }
  return normalizeCtcComponentToRupees(value) ?? 0;
}

/**
 * @param {Record<string, unknown>} row
 * @param {Set<string>} allowedNames
 * @returns {{ found: boolean, maxRupees: number }}
 */
function readMaxRupeesFromNamedFields(row, allowedNames) {
  let maxRupees = 0;
  let found = false;

  for (const [key, value] of Object.entries(row || {})) {
    if (key === "_id" || key === "__v") continue;
    if (!isNamedField(key, allowedNames)) continue;
    if (value === null || value === undefined || value === "") continue;

    const rupees = valueToRupees(value);
    if (rupees > 0) {
      found = true;
      if (rupees > maxRupees) maxRupees = rupees;
    }
  }

  return { found, maxRupees };
}

/**
 * @param {Record<string, unknown>} row
 * @returns {"dream"|"open_dream"|null}
 */
function readExplicitTierFromRow(row) {
  for (const [key, value] of Object.entries(row || {})) {
    if (key === "_id" || key === "__v") continue;
    if (!isNamedField(key, EXPLICIT_TIER_FIELD_NAMES)) continue;
    if (value === null || value === undefined || value === "") continue;

    const norm = String(value).toLowerCase().replace(/[\s_-]+/g, " ").trim();
    if (!norm) continue;
    if (/\bopen\s*dream\b|\bopendream\b/.test(norm)) return "open_dream";
    if (norm === "dream" || (norm.includes("dream") && !norm.includes("open"))) return "dream";
  }
  return null;
}

/**
 * Best-effort CTC rupees for a year-stats row (max across CTC columns, then Base fallback).
 * @param {Record<string, unknown>} row
 * @returns {number}
 */
export function resolveYearStatsRowCtcRupees(row) {
  if (!row || typeof row !== "object") return 0;

  const ctcRead = readMaxRupeesFromNamedFields(row, CTC_FIELD_NAMES);
  if (ctcRead.found && ctcRead.maxRupees > 0) return ctcRead.maxRupees;

  const baseRead = readMaxRupeesFromNamedFields(row, BASE_FIELD_NAMES);
  return baseRead.maxRupees;
}

/**
 * @param {Record<string, unknown>} row
 * @param {number} [openDreamMinLpa]
 * @returns {"dream"|"open_dream"|"other"}
 */
export function resolveYearStatsRowCategory(row, openDreamMinLpa = 10) {
  const thresholdLpa =
    Number.isFinite(Number(openDreamMinLpa)) && Number(openDreamMinLpa) >= 0
      ? Number(openDreamMinLpa)
      : 10;
  const thresholdRupees = thresholdLpa * RUPEES_PER_LPA;
  const totalRupees = resolveYearStatsRowCtcRupees(row);
  const explicitTier = readExplicitTierFromRow(row);

  if (totalRupees > 0) {
    const fromCtc = categorizeTotalRupees(totalRupees, thresholdRupees);
    if (explicitTier === "open_dream" && fromCtc === "dream") {
      return "open_dream";
    }
    return fromCtc;
  }

  return explicitTier ?? "other";
}
