/**
 * Placement tier helpers — mirrors backend `utils/ctcCategory.js` for year-stats filtering.
 * All money is normalized to annual rupees; threshold 10 LPA == 1_000_000 INR.
 */

export const RUPEES_PER_LPA = 100_000;
export const OPEN_DREAM_MIN_RUPEES = 1_000_000; // 10 LPA

const ROLE_CTC_TOTAL_KEYS = ["CTC", "Ctc", "ctc", "total"];
const ROLE_BASE_TOTAL_KEYS = ["Base", "base"];

/**
 * @param {string} raw
 * @returns {number|null}
 */
export function parseCtcStringToRupees(raw) {
  const str = String(raw).trim().toLowerCase();
  if (!str) return null;

  const numMatches = str.match(/[\d][\d,]*(?:\.[\d]+)?/g);
  if (!numMatches) return null;
  const numbers = numMatches.map((s) => parseFloat(s.replace(/,/g, ""))).filter((n) => Number.isFinite(n));
  if (numbers.length === 0) return null;

  const isRange =
    str.includes("-") ||
    /\bto\b/.test(str) ||
    (/\bbetween\b/.test(str) && /\band\b/.test(str));

  const total = isRange
    ? numbers.reduce((a, b) => a + b, 0) / numbers.length
    : numbers.reduce((a, b) => a + b, 0);

  const hasCrore = /\bcrore\b|\bcr\b/.test(str);
  const hasLakhUnit = /\blakh\b|\blakhs\b|\blpa\b/.test(str);

  if (hasCrore) return total * 1_00_00_000;
  if (hasLakhUnit) return total * RUPEES_PER_LPA;

  if (numbers.length === 1 && total >= 100_000) return total;

  return total * RUPEES_PER_LPA;
}

/**
 * @param {unknown} value
 * @returns {number|null}
 */
export function normalizeCtcComponentToRupees(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" && Number.isFinite(value)) {
    if (value <= 0) return null;
    if (value >= RUPEES_PER_LPA) return value;
    return value * RUPEES_PER_LPA;
  }
  if (typeof value === "string") {
    return parseCtcStringToRupees(value);
  }
  return null;
}

/**
 * @param {Record<string, unknown>|Map|undefined|null} ctc
 * @returns {number}
 */
export function sumCtcObjectToRupees(ctc) {
  const obj =
    ctc instanceof Map
      ? Object.fromEntries(ctc)
      : ctc && typeof ctc === "object"
        ? ctc
        : {};

  const readFirstPositive = (keys) => {
    for (const key of keys) {
      if (!(key in obj)) continue;
      const rupees = normalizeCtcComponentToRupees(obj[key]);
      if (rupees !== null && Number.isFinite(rupees) && rupees > 0) {
        return rupees;
      }
    }
    return null;
  };

  return readFirstPositive(ROLE_CTC_TOTAL_KEYS) ?? readFirstPositive(ROLE_BASE_TOTAL_KEYS) ?? 0;
}

/**
 * @param {number} totalRupees
 * @param {number} [openDreamMinRupees]
 * @returns {"dream"|"open_dream"}
 */
export function categorizeTotalRupees(totalRupees, openDreamMinRupees = OPEN_DREAM_MIN_RUPEES) {
  const threshold =
    Number.isFinite(openDreamMinRupees) && openDreamMinRupees >= 0
      ? openDreamMinRupees
      : OPEN_DREAM_MIN_RUPEES;
  if (!Number.isFinite(totalRupees) || totalRupees < threshold) {
    return "dream";
  }
  return "open_dream";
}
