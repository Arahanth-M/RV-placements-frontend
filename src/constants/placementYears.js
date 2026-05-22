/**
 * Placement cycles for company cards / detail (?year=). Must match backend
 * `RV-placements-backend/utils/placementYears.js` → COMPANY_DETAIL_VISIT_YEARS.
 */
export const PLACEMENT_DETAIL_VISIT_YEARS = Object.freeze([2026, 2027, 2028]);

/** Years with admin-configurable Open dream LPA (legacy stats + hub). */
export const PLACEMENT_OPEN_DREAM_SETTING_YEARS = Object.freeze([
  2024,
  2025,
  ...PLACEMENT_DETAIL_VISIT_YEARS,
]);

/** Default ?year= when omitted (aligned with backend COMPANY_VISIT_DEFAULT_YEAR). */
export const DEFAULT_PLACEMENT_DETAIL_YEAR = 2026;

export function isPlacementDetailVisitYear(year) {
  const n = Number(year);
  return Number.isFinite(n) && PLACEMENT_DETAIL_VISIT_YEARS.includes(n);
}

/** Merge API `totalGotInByYear` with legacy `totalGotIn` on `fallbackYear` when the map is absent. */
export function normalizeTotalGotInByYear(
  company,
  fallbackYear = DEFAULT_PLACEMENT_DETAIL_YEAR
) {
  const zeros = Object.fromEntries(
    PLACEMENT_DETAIL_VISIT_YEARS.map((y) => [y, 0])
  );
  const d = company?.totalGotInByYear;
  if (d && typeof d === "object") {
    const out = { ...zeros };
    for (const y of PLACEMENT_DETAIL_VISIT_YEARS) {
      out[y] = Number(d[y]) || 0;
    }
    return out;
  }
  const legacy = Number(company?.totalGotIn) || 0;
  const out = { ...zeros };
  if (isPlacementDetailVisitYear(fallbackYear)) {
    out[fallbackYear] = legacy;
  }
  return out;
}
