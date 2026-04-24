export const PLACEMENT_TIER_DREAM = "dream";
export const PLACEMENT_TIER_OPEN_DREAM = "open_dream";
export const PLACEMENT_TIER_INTERNSHIP_ONLY = "internship_only";
export const PLACEMENT_TIER_SUMMER_INTERNSHIP = "summer_internship";
export const PLACEMENT_TIER_OFF_CAMPUS = "off_campus";

export const PATH_COMPANY_CATEGORY = "/category";
export const PATH_COMPANY_STATS = "/companystats";

/** 2026 hub: department cluster before category (Dream / Open dream / …). */
export const PLACEMENT_CLUSTER_CS = "cs";
export const PLACEMENT_CLUSTER_EC = "ec";
export const PLACEMENT_CLUSTER_ME = "me";

export function normalizeClusterParam(raw) {
  const v = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (v === "cs" || v === "cse") return PLACEMENT_CLUSTER_CS;
  if (v === "ec") return PLACEMENT_CLUSTER_EC;
  if (v === "me") return PLACEMENT_CLUSTER_ME;
  return null;
}

export function companystatsClusterCategoryUrl(cluster) {
  return `${PATH_COMPANY_CATEGORY}?cluster=${encodeURIComponent(cluster)}`;
}

export function companystatsTierListUrl(tier) {
  return `${PATH_COMPANY_STATS}?tier=${encodeURIComponent(tier)}`;
}

export function isPlacementTierParam(value) {
  return (
    value === PLACEMENT_TIER_DREAM ||
    value === PLACEMENT_TIER_OPEN_DREAM ||
    value === PLACEMENT_TIER_INTERNSHIP_ONLY ||
    value === PLACEMENT_TIER_SUMMER_INTERNSHIP ||
    value === PLACEMENT_TIER_OFF_CAMPUS
  );
}
