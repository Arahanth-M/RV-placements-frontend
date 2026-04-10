export const PLACEMENT_TIER_DREAM = "dream";
export const PLACEMENT_TIER_OPEN_DREAM = "open_dream";
export const PLACEMENT_TIER_INTERNSHIP_ONLY = "internship_only";

export const PATH_COMPANY_CATEGORY = "/category";
export const PATH_COMPANY_STATS = "/companystats";

export function companystatsTierListUrl(tier) {
  return `${PATH_COMPANY_STATS}?tier=${encodeURIComponent(tier)}`;
}

export function isPlacementTierParam(value) {
  return (
    value === PLACEMENT_TIER_DREAM ||
    value === PLACEMENT_TIER_OPEN_DREAM ||
    value === PLACEMENT_TIER_INTERNSHIP_ONLY
  );
}
