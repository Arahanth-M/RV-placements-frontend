import { parseCtcStringToRupees, RUPEES_PER_LPA } from "./ctcCategory.js";

export const OFFER_SUMMARY_KEYS = {
  fte: "fte",
  internshipFte: "internshipFte",
  internshipOnly: "internshipOnly",
  other: "other",
};

export const OFFER_SUMMARY_LABELS = {
  fte: "FTE",
  internshipFte: "Internship + FTE",
  internshipOnly: "Internship only",
  other: "Other / unspecified",
};

/**
 * @param {unknown} typeOfOffer
 * @returns {'fte'|'internshipFte'|'internshipOnly'|'other'}
 */
export function categorizeTypeOfOffer(typeOfOffer) {
  const t = String(typeOfOffer || "").trim();
  if (t === "FTE") return OFFER_SUMMARY_KEYS.fte;
  if (t === "Internship+FTE" || t === "Internship + FTE (PBC)") {
    return OFFER_SUMMARY_KEYS.internshipFte;
  }
  if (t === "Internship(PPO)" || t === "Only internship(6 months)") {
    return OFFER_SUMMARY_KEYS.internshipOnly;
  }
  return OFFER_SUMMARY_KEYS.other;
}

/**
 * @param {unknown} rawCtc
 * @returns {boolean}
 */
export function isUnparseableOrMissingCtc(rawCtc) {
  const s = String(rawCtc ?? "").trim();
  if (!s) return true;
  if (/^tbd$/i.test(s) || /^n\/a$/i.test(s)) return true;
  return parseCtcStringToRupees(s) === null;
}

/**
 * @param {unknown} thresholdLpaRaw
 * @returns {number|null}
 */
export function parseCtcThresholdLpa(thresholdLpaRaw) {
  const s = String(thresholdLpaRaw ?? "").trim();
  if (!s) return null;
  const n = Number.parseFloat(s.replace(/,/g, ""));
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

/**
 * @param {unknown} rawCtc
 * @param {number} thresholdLpa
 * @returns {'above'|'below'|'unknown'}
 */
export function bucketStudentCtc(rawCtc, thresholdLpa) {
  if (isUnparseableOrMissingCtc(rawCtc)) return "unknown";
  const rupees = parseCtcStringToRupees(String(rawCtc).trim());
  if (rupees === null) return "unknown";
  const thresholdRupees = thresholdLpa * RUPEES_PER_LPA;
  return rupees >= thresholdRupees ? "above" : "below";
}

/**
 * @param {Array<{ branchCode?: string, students?: object[] }>} branches
 * @param {string} branchFilter — "all" or branch code
 * @returns {object[]}
 */
export function studentsForBranchFilter(branches, branchFilter) {
  const list = Array.isArray(branches) ? branches : [];
  if (!branchFilter || branchFilter === "all") {
    return list.flatMap((b) => (Array.isArray(b.students) ? b.students : []));
  }
  const hit = list.find((b) => String(b.branchCode) === String(branchFilter));
  return Array.isArray(hit?.students) ? hit.students : [];
}

/**
 * @param {object[]} students
 * @param {number|null} thresholdLpa
 * @returns {{
 *   total: number,
 *   offer: Record<string, number>,
 *   ctc: { above: number, below: number, unknown: number } | null,
 *   thresholdLpa: number|null
 * }}
 */
export function computePlacementStatsSummary(students, thresholdLpa) {
  const rows = Array.isArray(students) ? students : [];
  /** @type {Record<string, number>} */
  const offer = {
    [OFFER_SUMMARY_KEYS.fte]: 0,
    [OFFER_SUMMARY_KEYS.internshipFte]: 0,
    [OFFER_SUMMARY_KEYS.internshipOnly]: 0,
    [OFFER_SUMMARY_KEYS.other]: 0,
  };

  for (const row of rows) {
    const key = categorizeTypeOfOffer(row?.typeOfOffer);
    offer[key] = (offer[key] || 0) + 1;
  }

  let ctc = null;
  if (thresholdLpa != null) {
    ctc = { above: 0, below: 0, unknown: 0 };
    for (const row of rows) {
      const bucket = bucketStudentCtc(row?.ctc, thresholdLpa);
      ctc[bucket] += 1;
    }
  }

  return {
    total: rows.length,
    offer,
    ctc,
    thresholdLpa,
  };
}

/**
 * Per-branch offer breakdown for the "all branches" view.
 * @param {Array<{ branchCode?: string, students?: object[] }>} branches
 */
export function computeOfferSummaryByBranch(branches) {
  const list = Array.isArray(branches) ? branches : [];
  return list
    .map((branch) => {
      const students = Array.isArray(branch.students) ? branch.students : [];
      const summary = computePlacementStatsSummary(students, null);
      return {
        branchCode: String(branch.branchCode || "unknown"),
        ...summary,
      };
    })
    .sort((a, b) => a.branchCode.localeCompare(b.branchCode));
}

/**
 * @param {number} count
 * @param {number} total
 */
export function placementStatPercent(count, total) {
  if (!total || total <= 0) return 0;
  return Math.round((count / total) * 100);
}
