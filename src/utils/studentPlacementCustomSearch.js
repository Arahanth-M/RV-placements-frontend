import { parseCtcStringToRupees, RUPEES_PER_LPA } from "./ctcCategory.js";
import { parseCtcThresholdLpa } from "./studentPlacementStatsSummary.js";

export const CUSTOM_SEARCH_BRANCH_ALL = "all";
export const CUSTOM_SEARCH_OFFER_ALL = "all";

export const PLACEMENT_OFFER_TYPE_OPTIONS = [
  "Internship(PPO)",
  "FTE",
  "Internship+FTE",
  "Internship + FTE (PBC)",
  "Only internship(6 months)",
];

/**
 * @param {Array<{ branchCode?: string, students?: object[] }>} branches
 * @returns {Array<object & { branchCode: string }>}
 */
export function flattenStudentsWithBranch(branches) {
  const list = Array.isArray(branches) ? branches : [];
  return list.flatMap((branch) => {
    const branchCode = String(branch?.branchCode || "unknown").trim() || "unknown";
    const students = Array.isArray(branch?.students) ? branch.students : [];
    return students.map((student) => ({ ...student, branchCode }));
  });
}

/**
 * @param {unknown} rawCtc
 * @param {number|null} minCtcLpa
 * @param {number|null} maxCtcLpa
 * @returns {boolean}
 */
export function studentMeetsCtcRangeFilter(rawCtc, minCtcLpa, maxCtcLpa) {
  if (minCtcLpa == null && maxCtcLpa == null) return true;
  const rupees = parseCtcStringToRupees(String(rawCtc ?? "").trim());
  if (rupees === null) return false;
  if (minCtcLpa != null && maxCtcLpa != null && minCtcLpa > maxCtcLpa) return false;
  if (minCtcLpa != null && rupees < minCtcLpa * RUPEES_PER_LPA) return false;
  if (maxCtcLpa != null && rupees > maxCtcLpa * RUPEES_PER_LPA) return false;
  return true;
}

export function studentMeetsCompanyFilter(companyPlaced, companyQuery) {
  const q = String(companyQuery ?? "").trim();
  if (!q) return true;
  return String(companyPlaced ?? "").toLowerCase().includes(q.toLowerCase());
}

export function studentMeetsStudentQueryFilter(student, studentQuery) {
  const q = String(studentQuery ?? "").trim().toLowerCase();
  if (!q) return false;
  const fields = [student?.name, student?.usn, student?.email].map((value) =>
    String(value ?? "").trim().toLowerCase()
  );
  return fields.some((value) => value && value.includes(q));
}

/**
 * @param {Array<{ branchCode?: string, students?: object[] }>} branches
 * @param {unknown} query
 * @param {number} [limit]
 * @returns {Array<object & { branchCode: string, suggestLabel: string }>}
 */
export function suggestPlacementStudentsForCustomSearch(branches, query, limit = 8) {
  const q = String(query ?? "").trim();
  if (q.length < 2) return [];

  return flattenStudentsWithBranch(branches)
    .filter((student) => studentMeetsStudentQueryFilter(student, q))
    .slice(0, Math.max(1, limit));
}

/**
 * @param {object} student
 * @param {{ branch?: string, offerType?: string, companyQuery?: string, minCtcLpa?: number|null, maxCtcLpa?: number|null }} filters
 * @returns {boolean}
 */
export function studentMatchesCustomSearchFilters(student, filters) {
  const branch = filters?.branch ?? CUSTOM_SEARCH_BRANCH_ALL;
  const offerType = filters?.offerType ?? CUSTOM_SEARCH_OFFER_ALL;
  const companyQuery = filters?.companyQuery ?? "";
  const minCtcLpa = filters?.minCtcLpa ?? null;
  const maxCtcLpa = filters?.maxCtcLpa ?? null;

  if (branch !== CUSTOM_SEARCH_BRANCH_ALL) {
    if (String(student?.branchCode || "") !== String(branch)) return false;
  }

  if (offerType !== CUSTOM_SEARCH_OFFER_ALL) {
    if (String(student?.typeOfOffer || "").trim() !== String(offerType).trim()) return false;
  }

  if (!studentMeetsCompanyFilter(student?.companyPlaced, companyQuery)) return false;

  if (!studentMeetsCtcRangeFilter(student?.ctc, minCtcLpa, maxCtcLpa)) return false;

  return true;
}

/**
 * @param {Array<{ branchCode?: string, students?: object[] }>} branches
 * @param {{ branch?: string, offerType?: string, companyQueryInput?: unknown, ctcMinInput?: unknown, ctcMaxInput?: unknown }} draftFilters
 * @returns {Array<object & { branchCode: string }>}
 */
export function filterPlacementStudentsForCustomSearch(branches, draftFilters) {
  const companyQuery = String(draftFilters?.companyQueryInput ?? "").trim();
  const filters = {
    branch: draftFilters?.branch ?? CUSTOM_SEARCH_BRANCH_ALL,
    offerType: draftFilters?.offerType ?? CUSTOM_SEARCH_OFFER_ALL,
    companyQuery,
    minCtcLpa: parseCtcThresholdLpa(draftFilters?.ctcMinInput),
    maxCtcLpa: parseCtcThresholdLpa(draftFilters?.ctcMaxInput),
  };

  return flattenStudentsWithBranch(branches).filter((student) =>
    studentMatchesCustomSearchFilters(student, filters)
  );
}

/**
 * @param {Array<{ branchCode?: string, students?: object[] }>} branches
 * @param {{ studentQueryInput?: unknown }} draftFilters
 * @returns {Array<object & { branchCode: string }>}
 */
export function searchPlacementStudentsByStudentQuery(branches, draftFilters) {
  const studentQuery = String(draftFilters?.studentQueryInput ?? "").trim();
  if (!studentQuery) return [];

  return flattenStudentsWithBranch(branches).filter((student) =>
    studentMeetsStudentQueryFilter(student, studentQuery)
  );
}

/**
 * @param {object} student
 * @returns {Record<string, string>}
 */
export function customSearchStudentToExportRow(student) {
  return {
    Branch: String(student?.branchCode || "").toUpperCase(),
    Name: student?.name || "",
    USN: student?.usn || "",
    "Email ID": student?.email || "",
    "Company Placed": student?.companyPlaced || "",
    "Type of Offer": student?.typeOfOffer || "",
    Stipend: student?.stipend || "",
    "6 Months Internship Stipend": student?.sixMonthsInternshipStipend || "",
    CTC: student?.ctc || "",
    Role: student?.role || "",
    "PPO Conversion Type": student?.ppoConversionType || "",
    "Added By Name": student?.addedByName || "",
    "Added By USN": student?.addedByUsn || "",
    "Added By Email": student?.addedByEmail || "",
    "Last Updated": student?.updatedAt || student?.createdAt || "",
  };
}

/**
 * @param {unknown} year
 * @returns {string}
 */
export function customSearchExportFileName(year) {
  const yearLabel = year != null && String(year).trim() !== "" ? String(year) : "all";
  return `placement-custom-search-${yearLabel}.xlsx`;
}
