/**
 * Placement cycles for company cards / detail (?year=). Must match backend
 * `RV-placements-backend/utils/placementYears.js` → COMPANY_DETAIL_VISIT_YEARS.
 */
export const PLACEMENT_DETAIL_VISIT_YEARS = Object.freeze([2026, 2027, 2028]);

/** Default ?year= when omitted (aligned with backend COMPANY_VISIT_DEFAULT_YEAR). */
export const DEFAULT_PLACEMENT_DETAIL_YEAR = 2026;

export function isPlacementDetailVisitYear(year) {
  const n = Number(year);
  return Number.isFinite(n) && PLACEMENT_DETAIL_VISIT_YEARS.includes(n);
}
