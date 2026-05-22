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
/** Chemical sciences hub: Chemical (CH), Civil, Biotechnology (BT). */
export const PLACEMENT_CLUSTER_CHEM = "chem";

/** Hub keys for per-cluster Open dream LPA threshold (matches backend `PLACEMENT_HUB_CLUSTER_KEYS`). */
export const PLACEMENT_HUB_CLUSTER_KEYS = [
  PLACEMENT_CLUSTER_CS,
  PLACEMENT_CLUSTER_EC,
  PLACEMENT_CLUSTER_ME,
  PLACEMENT_CLUSTER_CHEM,
];

export const PLACEMENT_HUB_CLUSTER_LABELS = {
  [PLACEMENT_CLUSTER_CS]: "Computer Science & Engineering",
  [PLACEMENT_CLUSTER_EC]: "Electronics & Communication",
  [PLACEMENT_CLUSTER_ME]: "Mechanical Engineering",
  [PLACEMENT_CLUSTER_CHEM]: "Chemical Sciences (CH / Civil / BT)",
};

export const DEFAULT_OPEN_DREAM_MIN_LPA = 10;

/**
 * Admin / company visit `cluster` field. Values must match backend
 * `COMPANY_VISIT_CLUSTER_CANONICAL` (+ empty string for legacy default slot).
 */
export const COMPANY_VISIT_CLUSTER_FORM_OPTIONS = [
  { value: "", label: "Default / legacy (CSE hub)" },
  { value: "Computer Science and Engineering", label: "Computer Science & Engineering" },
  { value: "Electronics and Communication", label: "Electronics & Communication" },
  { value: "Mechanical Engineering", label: "Mechanical Engineering" },
  { value: "Chemical Engineering", label: "Chemical Engineering (CH)" },
  { value: "Civil Engineering", label: "Civil Engineering" },
  { value: "Biotechnology", label: "Biotechnology (BT)" },
];

export function normalizeClusterParam(raw) {
  const v = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (v === "cs" || v === "cse") return PLACEMENT_CLUSTER_CS;
  if (v === "ec" || v === "ece") return PLACEMENT_CLUSTER_EC;
  if (v === "me") return PLACEMENT_CLUSTER_ME;
  if (v === "chem" || v === "chemical" || v === "chemical_sciences") return PLACEMENT_CLUSTER_CHEM;
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

/** Tier/year hub cards, detail subtitle, empty panel — no qualifying visit for that category. */
export const PLACEMENT_CATEGORY_NO_VISIT_COPY =
  "No visit yet for this category. Check in different category";

/** Compact label next to a year in the placement-year dropdown when that year has no visit. */
export const PLACEMENT_YEAR_DROPDOWN_NO_VISIT_COPY = "no visit";
