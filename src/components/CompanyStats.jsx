import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import CompanyCard from "../components/CompanyCard";
import CompanyLogo from "../components/CompanyLogo";
import AnimatedLogoGrid from "../components/AnimatedLogoGrid";
import YearStatsTable from "../components/YearStatsTable";
import {
  CategoryTilesGridShimmer,
  CompanyCardGridShimmer,
  YearStatsTableShimmer,
} from "../components/StatsLoadingShimmer";
import {
  PageBackButton,
  PageBackNavRow,
  PageHeroFontStyles,
  PageHeroHeader,
  pageShellInnerClass,
  pageShellOuterClass,
} from "./PageBackNav.jsx";
import {
  FaFilter,
  FaCalendarAlt,
  FaRegStar,
  FaMedal,
  FaChevronRight,
  FaLaptopCode,
  FaBolt,
  FaCogs,
  FaSearch,
  FaFlask,
} from "react-icons/fa";
import { useAuth } from "../utils/AuthContext";
import { companyAPI, yearStatsAPI, getPlacementHubSettings } from "../utils/api";
import {
  getCachedCompanies,
  getCachedCompanyPreview,
  setCachedCompanies,
  setCachedCompanyPreview,
} from "../utils/companyListCache";
import {
  DEFAULT_OPEN_DREAM_MIN_LPA,
  PLACEMENT_TIER_DREAM,
  PLACEMENT_TIER_INTERNSHIP_ONLY,
  PLACEMENT_TIER_OFF_CAMPUS,
  PLACEMENT_TIER_OPEN_DREAM,
  PLACEMENT_TIER_SUMMER_INTERNSHIP,
  PATH_COMPANY_CATEGORY,
  PATH_COMPANY_STATS,
  PLACEMENT_CLUSTER_CS,
  PLACEMENT_CLUSTER_CHEM,
  PLACEMENT_CLUSTER_EC,
  PLACEMENT_CLUSTER_ME,
  companystatsClusterCategoryUrl,
  companystatsTierListUrl,
  isPlacementTierParam,
  normalizeClusterParam,
  PLACEMENT_CATEGORY_NO_VISIT_COPY,
} from "../constants/placementTiers.js";
import {
  DEFAULT_PLACEMENT_DETAIL_YEAR,
  PLACEMENT_DETAIL_VISIT_YEARS,
  isPlacementDetailVisitYear,
} from "../constants/placementYears.js";
import { sortCompaniesByVisitDate } from "../utils/visitDateSort.js";
import { TOUR_PREPARE_EVENT } from "../utils/productTourEvents";

/** Category hub tiles: fewer logos + smaller fetches = faster first paint. */
const CATEGORY_TILE_LOGO_GRID = 4;

function normalizeType(type) {
  return String(type || "")
    .trim()
    .replace(/\s+/g, "")
    .toLowerCase();
}

function isPlacementHubCluster(cluster) {
  return (
    cluster === PLACEMENT_CLUSTER_CS ||
    cluster === PLACEMENT_CLUSTER_EC ||
    cluster === PLACEMENT_CLUSTER_ME ||
    cluster === PLACEMENT_CLUSTER_CHEM
  );
}

/** EC / ME / Chemical sciences: stricter tier heuristics (no cross-cluster placement flags). */
function isNonCsStrictHubCluster(cluster) {
  return (
    cluster === PLACEMENT_CLUSTER_EC ||
    cluster === PLACEMENT_CLUSTER_ME ||
    cluster === PLACEMENT_CLUSTER_CHEM
  );
}

function normalizeCompanyCluster(raw) {
  const v = String(raw || "").trim().toLowerCase();
  if (!v) return null;

  if (
    v === "ec" ||
    v === "ece" ||
    v.includes("electronics") ||
    v.includes("electrical")
  ) {
    return PLACEMENT_CLUSTER_EC;
  }

  if (v === "me" || v === "mechanical" || v.includes("mechanical engineering")) {
    return PLACEMENT_CLUSTER_ME;
  }

  if (
    v === "chem" ||
    v === "ch" ||
    v === "bt" ||
    v.includes("chemical") ||
    v.includes("civil") ||
    v.includes("biotech") ||
    v.includes("bio tech")
  ) {
    return PLACEMENT_CLUSTER_CHEM;
  }

  if (
    v === "cs" ||
    v === "cse" ||
    v.includes("computer science") ||
    v.includes("information science")
  ) {
    return PLACEMENT_CLUSTER_CS;
  }

  return null;
}

function getCompanyClusterKey(company) {
  return normalizeCompanyCluster(company?.cluster) || PLACEMENT_CLUSTER_CS;
}

function isCompanyMarkedOffCampus(company) {
  return company?.offCampus === true;
}

function isInternshipFtePbcType(company) {
  const type = normalizeType(company?.type);
  return type.includes("internship") && type.includes("fte") && type.includes("pbc");
}

function isInternshipFteNonPbcType(company) {
  const type = normalizeType(company?.type);
  return type.includes("internship") && type.includes("fte") && !type.includes("pbc");
}

const PLACEMENT_TYPE_FILTER_CATEGORIES = Object.freeze([
  "all",
  "fte",
  "internship + fte",
  "internship + fte (pbc)",
]);

function normalizeTierCategory(tier, rawCategory) {
  const category =
    rawCategory === "only internship(6 months)"
      ? "all"
      : String(rawCategory || "all");

  if (tier === PLACEMENT_TIER_DREAM || tier === PLACEMENT_TIER_OPEN_DREAM) {
    return PLACEMENT_TYPE_FILTER_CATEGORIES.includes(category) ? category : "all";
  }

  return "all";
}

/** Parse user CGPA input; null means filter is off / invalid. */
function parseCgpaFilterInput(raw) {
  if (raw == null || String(raw).trim() === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || n > 10) return null;
  return Math.round(n * 100) / 100;
}

/** Keep CGPA filter field at most 10 (and non-negative). Empty string stays empty. */
function clampCgpaFilterInput(raw) {
  const s = String(raw ?? "");
  if (s.trim() === "") return "";
  const n = Number(s);
  if (!Number.isFinite(n)) return s;
  if (n > 10) return "10";
  if (n < 0) return "0";
  return s;
}

/**
 * Resolve minCgpa for the current hub tier + optional type category.
 * Prefers the visit matching that cluster's placement context / type.
 * @param {object} company
 * @param {string|null|undefined} placementTier
 * @param {string|null|undefined} activeCategory
 */
function resolveMinCgpaForFilter(company, placementTier, activeCategory) {
  const byTier =
    company?.minCgpaByTier && typeof company.minCgpaByTier === "object"
      ? company.minCgpaByTier
      : null;
  // Prefer the cutoff for the active hub tier. When the map has an entry (even null),
  // do not fall back to card-level minCgpa — that is often the Dream/FTE visit (e.g. IBM 7)
  // while Summer/PPO lives on another year with a higher cutoff (e.g. 8).
  if (placementTier && byTier && Object.prototype.hasOwnProperty.call(byTier, placementTier)) {
    return byTier[placementTier];
  }

  const byType =
    company?.minCgpaByVisitType && typeof company.minCgpaByVisitType === "object"
      ? company.minCgpaByVisitType
      : null;
  const category = String(activeCategory || "")
    .trim()
    .toLowerCase();
  if (byType && category && category !== "all") {
    if (Object.prototype.hasOwnProperty.call(byType, category)) {
      return byType[category];
    }
    // Loose match for labels like "Internship + FTE"
    const hit = Object.keys(byType).find(
      (k) => k.toLowerCase() === category || k.toLowerCase().includes(category)
    );
    if (hit) return byType[hit];
  }

  // Without a tier map, avoid using Dream card minCgpa on Summer / internship-only hubs.
  if (
    placementTier === PLACEMENT_TIER_SUMMER_INTERNSHIP ||
    placementTier === PLACEMENT_TIER_INTERNSHIP_ONLY ||
    placementTier === PLACEMENT_TIER_OFF_CAMPUS
  ) {
    return null;
  }

  return company?.minCgpa;
}

/**
 * Keep companies with unknown cutoff, or cutoff ≤ student CGPA.
 * Uses the minCgpa for the active placement tier / visit type when available.
 * @param {object} company
 * @param {number|null} studentCgpa
 * @param {string|null|undefined} [placementTier]
 * @param {string|null|undefined} [activeCategory]
 */
function companyPassesCgpaFilter(
  company,
  studentCgpa,
  placementTier = null,
  activeCategory = null
) {
  if (studentCgpa == null) return true;
  const min = resolveMinCgpaForFilter(company, placementTier, activeCategory);
  if (min == null || min === "") return true;
  const n = Number(min);
  if (!Number.isFinite(n)) return true;
  return n <= studentCgpa;
}

function CompanyStats() {
  // Year selection state
  const [selectedYear, setSelectedYear] = useState(null);
  const [yearStatsData, setYearStatsData] = useState([]);
  const [loadingYearStats, setLoadingYearStats] = useState(false);
  const [openDreamMinLpaByYear, setOpenDreamMinLpaByYear] = useState(null);

  // Company cards state (for 2026)
  const [companies, setCompanies] = useState([]);
  /** Until full GET /api/companies resolves, category tiles can use GET /api/companies/preview-logos */
  const [categoryPreview, setCategoryPreview] = useState(null);
  /** False until the first placement-card year list fetch finishes (success or error). Drives tier-list skeletons. */
  const [companiesFetchDone, setCompaniesFetchDone] = useState(false);
  const isPlacementCardsYear = isPlacementDetailVisitYear(selectedYear);
  const [search, setSearch] = useState("");
  /** Empty string = filter off. When set, keep companies with no cutoff or minCgpa ≤ this value. */
  const [cgpaFilter, setCgpaFilter] = useState("");
  const [tierCategories, setTierCategories] = useState({
    [PLACEMENT_TIER_DREAM]: "all",
    [PLACEMENT_TIER_OPEN_DREAM]: "all",
    [PLACEMENT_TIER_OFF_CAMPUS]: "all",
  });
  const [showFilter, setShowFilter] = useState(false);
  const [helpfulStatusByCompanyId, setHelpfulStatusByCompanyId] = useState({});
  /** 2026: null = pick Dream vs Open dream; otherwise which list to show */
  const [placementTier, setPlacementTier] = useState(null);

  const companiesPerPage = 9;
  const [dreamPage, setDreamPage] = useState(1);
  const [openDreamPage, setOpenDreamPage] = useState(1);
  const [internshipOnlyPage, setInternshipOnlyPage] = useState(1);
  const [summerInternshipPage, setSummerInternshipPage] = useState(1);
  const [offCampusPage, setOffCampusPage] = useState(1);
  const [clusterBranchPage, setClusterBranchPage] = useState(1);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const tierQuery = searchParams.get("tier");
  const clusterParam = normalizeClusterParam(searchParams.get("cluster"));
  const companyCacheScope = isPlacementHubCluster(clusterParam) ? clusterParam : "all";
  const effectiveClusterParam =
    isPlacementCardsYear && placementTier
      ? clusterParam || PLACEMENT_CLUSTER_CS
      : clusterParam;
  const { user, isAdmin } = useAuth();

  const getPersistedPlacementCardsYear = () => {
    const fromSession = user?.userId
      ? sessionStorage.getItem(`companystats_selectedYear_${user.userId}`)
      : null;
    const fromSessionFallback = sessionStorage.getItem("companystats_selectedYear");
    const fromLocal = localStorage.getItem("companystats_selectedYear");
    const raw = fromSession ?? fromSessionFallback ?? fromLocal;
    const parsed = parseInt(String(raw || ""), 10);
    if (Number.isFinite(parsed) && isPlacementDetailVisitYear(parsed)) return parsed;
    return DEFAULT_PLACEMENT_DETAIL_YEAR;
  };

  const activeCategory = useMemo(
    () => normalizeTierCategory(placementTier, tierCategories[placementTier]),
    [placementTier, tierCategories]
  );

  const setTierCategory = (tier, valueOrUpdater) => {
    if (
      tier !== PLACEMENT_TIER_DREAM &&
      tier !== PLACEMENT_TIER_OPEN_DREAM &&
      tier !== PLACEMENT_TIER_OFF_CAMPUS
    ) {
      return;
    }

    setTierCategories((prev) => {
      const prevValue = normalizeTierCategory(tier, prev[tier]);
      const nextRawValue =
        typeof valueOrUpdater === "function" ? valueOrUpdater(prevValue) : valueOrUpdater;
      const nextValue = normalizeTierCategory(tier, nextRawValue);
      if (prevValue === nextValue) return prev;
      return {
        ...prev,
        [tier]: nextValue,
      };
    });
  };

  const setActiveCategory = (valueOrUpdater) => {
    setTierCategory(placementTier, valueOrUpdater);
  };

  const handleBack = () => {
    navigate('/');
  };  

  const openPlacementTierList = useCallback((tier) => {
    const resolvedCardsYear = getPersistedPlacementCardsYear();
    setSelectedYear(resolvedCardsYear);
    setPlacementTier(tier);
    const baseUrl = companystatsTierListUrl(tier);
    const nextCluster = isPlacementHubCluster(clusterParam) ? clusterParam : PLACEMENT_CLUSTER_CS;
    navigate(`${baseUrl}&cluster=${encodeURIComponent(nextCluster)}`);
  }, [navigate, user?.userId, clusterParam]);

  const visitSortYear =
    isPlacementDetailVisitYear(selectedYear) ? selectedYear : DEFAULT_PLACEMENT_DETAIL_YEAR;

  const visitSortHub = useMemo(() => {
    if (placementTier === PLACEMENT_TIER_SUMMER_INTERNSHIP) {
      return PLACEMENT_TIER_SUMMER_INTERNSHIP;
    }
    if (placementTier === PLACEMENT_TIER_INTERNSHIP_ONLY) {
      return PLACEMENT_TIER_INTERNSHIP_ONLY;
    }
    if (placementTier === PLACEMENT_TIER_OFF_CAMPUS) {
      return PLACEMENT_TIER_OFF_CAMPUS;
    }
    if (placementTier === PLACEMENT_TIER_OPEN_DREAM) {
      return PLACEMENT_TIER_OPEN_DREAM;
    }
    return PLACEMENT_TIER_DREAM;
  }, [placementTier]);

  const orderedCompanies = useMemo(() => {
    return sortCompaniesByVisitDate(companies, {
      defaultYear: visitSortYear,
      hub: visitSortHub,
    });
  }, [companies, visitSortYear, visitSortHub]);

  const sortPoolForTier = (pool, hub) =>
    sortCompaniesByVisitDate(pool, { defaultYear: visitSortYear, hub });

  const clusterScopedCompanies = useMemo(() => {
    if (isPlacementHubCluster(effectiveClusterParam)) {
      return orderedCompanies.filter(
        (company) => getCompanyClusterKey(company) === effectiveClusterParam
      );
    }
    return orderedCompanies;
  }, [orderedCompanies, effectiveClusterParam]);

  const ecCompanies = useMemo(
    () => orderedCompanies.filter((company) => getCompanyClusterKey(company) === PLACEMENT_CLUSTER_EC),
    [orderedCompanies]
  );
  const meCompanies = useMemo(
    () => orderedCompanies.filter((company) => getCompanyClusterKey(company) === PLACEMENT_CLUSTER_ME),
    [orderedCompanies]
  );
  const csCompanies = useMemo(
    () => orderedCompanies.filter((company) => getCompanyClusterKey(company) === PLACEMENT_CLUSTER_CS),
    [orderedCompanies]
  );
  const chemCompanies = useMemo(
    () => orderedCompanies.filter((company) => getCompanyClusterKey(company) === PLACEMENT_CLUSTER_CHEM),
    [orderedCompanies]
  );
  const ecMeClusterCompanies = useMemo(() => {
    if (clusterParam === PLACEMENT_CLUSTER_EC) return ecCompanies;
    if (clusterParam === PLACEMENT_CLUSTER_ME) return meCompanies;
    return [];
  }, [clusterParam, ecCompanies, meCompanies]);
  const parsedCgpaFilter = useMemo(() => parseCgpaFilterInput(cgpaFilter), [cgpaFilter]);

  const ecMeFilteredCompanies = useMemo(
    () =>
      ecMeClusterCompanies
        .filter((c) =>
          String(c?.name || "")
            .toLowerCase()
            .includes(search.toLowerCase())
        )
        .filter((c) =>
          companyPassesCgpaFilter(c, parsedCgpaFilter, placementTier, activeCategory)
        ),
    [ecMeClusterCompanies, search, parsedCgpaFilter, placementTier, activeCategory]
  );
  const ecMeTotalPages = Math.max(1, Math.ceil(ecMeFilteredCompanies.length / companiesPerPage));
  const ecMeSlice = ecMeFilteredCompanies.slice(
    (clusterBranchPage - 1) * companiesPerPage,
    clusterBranchPage * companiesPerPage
  );

  // Helper function to get user-specific storage keys
  const getStorageKey = (key) => {
    if (!user || !user.userId) return key;
    return `${key}_${user.userId}`;
  };

  const getStoredValue = (key) => {
    const userScopedValue = sessionStorage.getItem(getStorageKey(key));
    if (userScopedValue !== null) return userScopedValue;
    return sessionStorage.getItem(key);
  };

  useEffect(() => {
    const persistPlacementCardsYear = (year) => {
      const yearStr = String(year);
      if (user?.userId) {
        sessionStorage.setItem(getStorageKey("companystats_selectedYear"), yearStr);
      }
      sessionStorage.setItem("companystats_selectedYear", yearStr);
      localStorage.setItem("companystats_selectedYear", yearStr);
    };

    const onTourPrepare = (event) => {
      const stepId = event.detail?.stepId;
      if (stepId === "company-stats-years") {
        setSelectedYear(null);
        setPlacementTier(null);
        if (user?.userId) {
          sessionStorage.setItem(getStorageKey("companystats_selectedYear"), "");
        }
        sessionStorage.setItem("companystats_selectedYear", "");
        localStorage.removeItem("companystats_selectedYear");
        navigate(PATH_COMPANY_STATS, { replace: true });
        return;
      }
      if (stepId === "company-stats-2025" || stepId.startsWith("company-stats-2025-")) {
        setPlacementTier(null);
        setSelectedYear(2025);
        if (user?.userId) {
          sessionStorage.setItem(getStorageKey("companystats_selectedYear"), "2025");
        }
        sessionStorage.setItem("companystats_selectedYear", "2025");
        localStorage.setItem("companystats_selectedYear", "2025");
        navigate(PATH_COMPANY_STATS, { replace: true });
        return;
      }
      if (stepId === "company-stats-2026-cluster") {
        setPlacementTier(null);
        setSelectedYear(DEFAULT_PLACEMENT_DETAIL_YEAR);
        persistPlacementCardsYear(DEFAULT_PLACEMENT_DETAIL_YEAR);
        navigate(PATH_COMPANY_CATEGORY, { replace: true });
        return;
      }
      if (stepId === "company-stats-categories") {
        setPlacementTier(null);
        setSelectedYear(DEFAULT_PLACEMENT_DETAIL_YEAR);
        persistPlacementCardsYear(DEFAULT_PLACEMENT_DETAIL_YEAR);
        navigate(companystatsClusterCategoryUrl(PLACEMENT_CLUSTER_CS), { replace: true });
        return;
      }
      if (
        stepId === "company-stats-cards" ||
        stepId === "company-stats-2026-search" ||
        stepId === "company-stats-2026-filter" ||
        stepId === "company-stats-2026-filter-fte" ||
        stepId === "company-stats-2026-filter-internship-fte" ||
        stepId === "company-card-business-model" ||
        stepId === "company-card-focus-areas" ||
        stepId === "company-card-helpful"
      ) {
        setSelectedYear(DEFAULT_PLACEMENT_DETAIL_YEAR);
        persistPlacementCardsYear(DEFAULT_PLACEMENT_DETAIL_YEAR);
        setPlacementTier(PLACEMENT_TIER_DREAM);
        if (user?.userId) {
          sessionStorage.setItem(getStorageKey("companystats_placement_tier"), PLACEMENT_TIER_DREAM);
        }
        sessionStorage.setItem("companystats_placement_tier", PLACEMENT_TIER_DREAM);
        navigate(
          `${companystatsTierListUrl(PLACEMENT_TIER_DREAM)}&cluster=${encodeURIComponent(PLACEMENT_CLUSTER_CS)}`,
          { replace: true }
        );
      }
      if (
        stepId === "company-stats-2026-filter-fte" ||
        stepId === "company-stats-2026-filter-internship-fte"
      ) {
        setShowFilter(true);
      }
      if (stepId === "company-stats-2026-filter") {
        setShowFilter(false);
      }
    };

    window.addEventListener(TOUR_PREPARE_EVENT, onTourPrepare);
    return () => window.removeEventListener(TOUR_PREPARE_EVENT, onTourPrepare);
  }, [navigate, user?.userId]);

  // Clear old sessionStorage items when user changes
  useEffect(() => {
    if (user && user.userId) {
      // Clear any old sessionStorage items that don't belong to current user
      const keysToCheck = [
        'companystats_selectedYear',
        'companystats_search',
        'companystats_cgpa_filter',
        'companystats_category',
        'companystats_dream_category',
        'companystats_open_dream_category',
        'companystats_off_campus_category',
        'companystats_dream_page',
        'companystats_open_dream_page',
        'companystats_internship_only_page',
        'companystats_summer_internship_page',
        'companystats_off_campus_page',
        'companystats_dream_list_count',
        'companystats_open_dream_list_count',
        'companystats_internship_only_list_count',
        'companystats_summer_internship_list_count',
        'companystats_off_campus_list_count',
        'companystats_placement_tier',
        'companystats_page',
        'fromCompanyCards'
      ];
      
      keysToCheck.forEach(key => {
        // Remove old non-user-specific keys
        if (sessionStorage.getItem(key) && !key.includes('_')) {
          sessionStorage.removeItem(key);
        }
      });
    } else {
      // Clear all company stats related sessionStorage when user logs out
      const keysToRemove = [
        'companystats_selectedYear',
        'companystats_search',
        'companystats_cgpa_filter',
        'companystats_category',
        'companystats_dream_category',
        'companystats_open_dream_category',
        'companystats_off_campus_category',
        'companystats_dream_page',
        'companystats_open_dream_page',
        'companystats_internship_only_page',
        'companystats_summer_internship_page',
        'companystats_off_campus_page',
        'companystats_dream_list_count',
        'companystats_open_dream_list_count',
        'companystats_internship_only_list_count',
        'companystats_summer_internship_list_count',
        'companystats_off_campus_list_count',
        'companystats_placement_tier',
        'companystats_page',
        'fromCompanyCards'
      ];
      keysToRemove.forEach(key => {
        // Remove all user-specific and non-user-specific keys
        Object.keys(sessionStorage).forEach(storageKey => {
          if (storageKey.startsWith(key)) {
            sessionStorage.removeItem(storageKey);
          }
        });
      });
    }
  }, [user]);

  // URL is source of truth for placement-card flow: /category (picker) vs /companystats?tier=… (list)
  useEffect(() => {
    const resolvedCardsYear = getPersistedPlacementCardsYear();
    if (location.pathname === PATH_COMPANY_CATEGORY) {
      setSelectedYear(resolvedCardsYear);
      setPlacementTier(null);
      return;
    }
    if (location.pathname === PATH_COMPANY_STATS && isPlacementTierParam(tierQuery)) {
      setSelectedYear(resolvedCardsYear);
      setPlacementTier(tierQuery);
    }
  }, [location.pathname, tierQuery, user?.userId]);

  // Year/cluster/tier often change query only (/category → /category?cluster=… or ?tier= swaps on /companystats),
  // so App ScrollToTop (pathname-only) does not run — scroll here instead.
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [selectedYear, clusterParam, tierQuery]);

  // Check for navigation state or sessionStorage to restore selectedYear (non-2026 only on hub)
  useEffect(() => {
    if (location.pathname !== PATH_COMPANY_STATS || isPlacementTierParam(tierQuery)) return;

    if (location.state?.selectedYear !== undefined) {
      const yearToSet = location.state.selectedYear;
      if (yearToSet === DEFAULT_PLACEMENT_DETAIL_YEAR) {
        navigate(PATH_COMPANY_CATEGORY, { replace: true });
        return;
      }
      if (!user) return;
      setSelectedYear(yearToSet);
      if (yearToSet !== null) {
        sessionStorage.setItem(getStorageKey("companystats_selectedYear"), String(yearToSet));
      } else {
        sessionStorage.setItem(getStorageKey("companystats_selectedYear"), "");
      }
      return;
    }

    if (!user) return;
    if (!sessionStorage.getItem(getStorageKey("companystats_selectedYear"))) return;

    const storedYear = sessionStorage.getItem(getStorageKey("companystats_selectedYear"));
    if (storedYear === "") {
      setSelectedYear(null);
    } else {
      const parsedYear = parseInt(storedYear, 10);
      if (!Number.isNaN(parsedYear)) {
        if (parsedYear === DEFAULT_PLACEMENT_DETAIL_YEAR) {
          navigate(PATH_COMPANY_CATEGORY, { replace: true });
        } else {
          setSelectedYear(parsedYear);
        }
      }
    }
  }, [location.state, location.pathname, tierQuery, user, navigate]);

  // Persist hub year (2024/2025 only). Placement-card years use /category and ?tier= URLs.
  useEffect(() => {
    if (!user?.userId) return;
    if (selectedYear === null || selectedYear === DEFAULT_PLACEMENT_DETAIL_YEAR) {
      sessionStorage.setItem(getStorageKey("companystats_selectedYear"), "");
    } else {
      sessionStorage.setItem(getStorageKey("companystats_selectedYear"), String(selectedYear));
    }
  }, [selectedYear, user]);

  useEffect(() => {
    if (!isPlacementCardsYear || !placementTier) return;
    if (location.pathname !== PATH_COMPANY_STATS) return;
    const expectedUrl = `${companystatsTierListUrl(placementTier)}&cluster=${encodeURIComponent(
      effectiveClusterParam || PLACEMENT_CLUSTER_CS
    )}`;
    const currentUrl = `${location.pathname}${location.search}`;
    if (tierQuery !== placementTier || currentUrl !== expectedUrl) {
      navigate(expectedUrl, { replace: true });
    }
  }, [
    isPlacementCardsYear,
    placementTier,
    location.pathname,
    location.search,
    tierQuery,
    navigate,
    effectiveClusterParam,
  ]);

  useEffect(() => {
    if (location.pathname !== PATH_COMPANY_STATS) return;
    if (isPlacementTierParam(tierQuery)) return;
    if (isPlacementCardsYear && placementTier === null) {
      navigate(PATH_COMPANY_CATEGORY, { replace: true });
    }
  }, [location.pathname, tierQuery, isPlacementCardsYear, placementTier, navigate]);

  useEffect(() => {
    if (location.pathname !== PATH_COMPANY_STATS) return;
    if (!isPlacementCardsYear) return;
    if (!isNonCsStrictHubCluster(clusterParam)) {
      return;
    }
    const tierAllowedForEcMe =
      tierQuery === PLACEMENT_TIER_DREAM ||
      tierQuery === PLACEMENT_TIER_OPEN_DREAM ||
      tierQuery === PLACEMENT_TIER_SUMMER_INTERNSHIP ||
      tierQuery === PLACEMENT_TIER_INTERNSHIP_ONLY ||
      tierQuery === PLACEMENT_TIER_OFF_CAMPUS;
    if (!tierAllowedForEcMe) {
      navigate(companystatsClusterCategoryUrl(clusterParam), { replace: true });
    }
  }, [location.pathname, isPlacementCardsYear, clusterParam, tierQuery, navigate]);

  // Only clear tier when leaving placement-card years for a concrete other year.
  // (otherwise this runs before URL sync and wipes tier after /companystats?tier= navigation → infinite "Loading…").
  useEffect(() => {
    if (selectedYear == null) return;
    if (!isPlacementDetailVisitYear(selectedYear)) setPlacementTier(null);
  }, [selectedYear]);

  // Close the floating filter menu whenever the user changes tiers.
  useEffect(() => {
    setShowFilter(false);
  }, [placementTier]);

  useEffect(() => {
    const key = getStorageKey("companystats_placement_tier");
    if (isPlacementCardsYear) {
      const v =
        placementTier === PLACEMENT_TIER_DREAM ||
        placementTier === PLACEMENT_TIER_OPEN_DREAM ||
        placementTier === PLACEMENT_TIER_INTERNSHIP_ONLY ||
        placementTier === PLACEMENT_TIER_SUMMER_INTERNSHIP ||
        placementTier === PLACEMENT_TIER_OFF_CAMPUS
          ? placementTier
          : "";
      sessionStorage.setItem(key, v);
    } else {
      sessionStorage.removeItem(key);
    }
  }, [isPlacementCardsYear, selectedYear, placementTier, user]);

  // Restore company cards state if coming back from company details
  useEffect(() => {
    if (!user) return;
    
    if (isPlacementCardsYear && getStoredValue('fromCompanyCards') === 'true') {
      const storedSearch = getStoredValue('companystats_search');
      const storedDreamCategory = getStoredValue('companystats_dream_category');
      const storedOpenDreamCategory = getStoredValue('companystats_open_dream_category');
      const storedOffCampusCategory = getStoredValue('companystats_off_campus_category');
      const legacyStoredCategory = getStoredValue('companystats_category');
      const storedDreamPage = getStoredValue("companystats_dream_page");
      const storedOpenDreamPage = getStoredValue("companystats_open_dream_page");
      const storedInternshipOnlyPage = getStoredValue("companystats_internship_only_page");
      const storedSummerInternshipPage = getStoredValue("companystats_summer_internship_page");
      const storedOffCampusPage = getStoredValue("companystats_off_campus_page");
      const storedDreamListCount = getStoredValue("companystats_dream_list_count");
      const storedOpenDreamListCount = getStoredValue("companystats_open_dream_list_count");
      const storedInternListCount = getStoredValue("companystats_internship_only_list_count");
      const storedSummerListCount = getStoredValue("companystats_summer_internship_list_count");
      const storedOffListCount = getStoredValue("companystats_off_campus_list_count");
      const legacyPage = getStoredValue("companystats_page");
      const parsedLegacy = legacyPage != null ? parseInt(legacyPage, 10) : NaN;
      const fallbackPage = Number.isFinite(parsedLegacy) && parsedLegacy > 0 ? parsedLegacy : 1;
      /** @param {string|null|undefined} pageRaw @param {string|null|undefined} listCountRaw */
      const pageFromSession = (pageRaw, listCountRaw) => {
        if (pageRaw != null) {
          const p = parseInt(String(pageRaw), 10);
          if (Number.isFinite(p) && p > 0) return p;
        }
        if (listCountRaw != null) {
          const n = parseInt(String(listCountRaw), 10);
          if (Number.isFinite(n) && n > 0) {
            return Math.max(1, Math.ceil(n / companiesPerPage));
          }
        }
        return fallbackPage;
      };

      const storedTierRaw = getStoredValue("companystats_placement_tier");
      const storedTier =
        storedTierRaw === PLACEMENT_TIER_DREAM ||
        storedTierRaw === PLACEMENT_TIER_OPEN_DREAM ||
        storedTierRaw === PLACEMENT_TIER_INTERNSHIP_ONLY ||
        storedTierRaw === PLACEMENT_TIER_SUMMER_INTERNSHIP ||
        storedTierRaw === PLACEMENT_TIER_OFF_CAMPUS
          ? storedTierRaw
          : null;

      if (storedSearch !== null) setSearch(storedSearch);
      const storedCgpa = getStoredValue("companystats_cgpa_filter");
      if (storedCgpa !== null) setCgpaFilter(clampCgpaFilterInput(storedCgpa));
      setTierCategories({
        [PLACEMENT_TIER_DREAM]: normalizeTierCategory(
          PLACEMENT_TIER_DREAM,
          storedDreamCategory ??
            (storedTier === PLACEMENT_TIER_DREAM ? legacyStoredCategory : "all")
        ),
        [PLACEMENT_TIER_OPEN_DREAM]: normalizeTierCategory(
          PLACEMENT_TIER_OPEN_DREAM,
          storedOpenDreamCategory ??
            (storedTier === PLACEMENT_TIER_OPEN_DREAM ? legacyStoredCategory : "all")
        ),
        [PLACEMENT_TIER_OFF_CAMPUS]: normalizeTierCategory(
          PLACEMENT_TIER_OFF_CAMPUS,
          storedOffCampusCategory ??
            (storedTier === PLACEMENT_TIER_OFF_CAMPUS ? legacyStoredCategory : "all")
        ),
      });
      setDreamPage(pageFromSession(storedDreamPage, storedDreamListCount));
      setOpenDreamPage(pageFromSession(storedOpenDreamPage, storedOpenDreamListCount));
      setInternshipOnlyPage(pageFromSession(storedInternshipOnlyPage, storedInternListCount));
      setSummerInternshipPage(pageFromSession(storedSummerInternshipPage, storedSummerListCount));
      setOffCampusPage(pageFromSession(storedOffCampusPage, storedOffListCount));

      if (storedTier) {
        setPlacementTier(storedTier);
      }
      
      // Clear the flag after restoring
      sessionStorage.removeItem(getStorageKey('fromCompanyCards'));
    }
  }, [isPlacementCardsYear, selectedYear, user]);

  // Store company cards state whenever it changes (for restoring after navigation)
  useEffect(() => {
    if (isPlacementCardsYear && user && user.userId) {
      sessionStorage.setItem(getStorageKey('companystats_search'), search);
      sessionStorage.setItem(getStorageKey('companystats_cgpa_filter'), cgpaFilter);
      sessionStorage.setItem(
        getStorageKey('companystats_dream_category'),
        normalizeTierCategory(PLACEMENT_TIER_DREAM, tierCategories[PLACEMENT_TIER_DREAM])
      );
      sessionStorage.setItem(
        getStorageKey('companystats_open_dream_category'),
        normalizeTierCategory(PLACEMENT_TIER_OPEN_DREAM, tierCategories[PLACEMENT_TIER_OPEN_DREAM])
      );
      sessionStorage.setItem(
        getStorageKey('companystats_off_campus_category'),
        normalizeTierCategory(PLACEMENT_TIER_OFF_CAMPUS, tierCategories[PLACEMENT_TIER_OFF_CAMPUS])
      );
      sessionStorage.removeItem(getStorageKey('companystats_category'));
      sessionStorage.setItem(getStorageKey('companystats_dream_page'), String(dreamPage));
      sessionStorage.setItem(getStorageKey('companystats_open_dream_page'), String(openDreamPage));
      sessionStorage.setItem(getStorageKey('companystats_internship_only_page'), String(internshipOnlyPage));
      sessionStorage.setItem(getStorageKey('companystats_summer_internship_page'), String(summerInternshipPage));
      sessionStorage.setItem(getStorageKey('companystats_off_campus_page'), String(offCampusPage));
    }
  }, [
    isPlacementCardsYear,
    selectedYear,
    search,
    cgpaFilter,
    tierCategories,
    dreamPage,
    openDreamPage,
    internshipOnlyPage,
    summerInternshipPage,
    offCampusPage,
    user,
  ]);

  // Fetch companies for year-based cards (currently 2026/2027); preview-logos in parallel.
  useEffect(() => {
    let cancelled = false;
    if (isPlacementDetailVisitYear(selectedYear)) {
      localStorage.setItem('companystats_selectedYear', String(selectedYear));
      const cachedCompanies = getCachedCompanies(selectedYear, companyCacheScope);
      if (cachedCompanies) {
        setCompanies(cachedCompanies);
        setCompaniesFetchDone(true);
      } else {
        setCompaniesFetchDone(false);
      }
      const shouldFetchCategoryPreview =
        location.pathname === PATH_COMPANY_CATEGORY &&
        placementTier === null &&
        (clusterParam === PLACEMENT_CLUSTER_CS ||
          clusterParam === PLACEMENT_CLUSTER_EC ||
          clusterParam === PLACEMENT_CLUSTER_ME);
      if (shouldFetchCategoryPreview) {
        const previewClusterKey = clusterParam;
        const cachedPreview = getCachedCompanyPreview(selectedYear, previewClusterKey);
        if (cachedPreview) {
          setCategoryPreview(cachedPreview);
        } else {
          setCategoryPreview(null);
        }
        (async () => {
          try {
            const res = await companyAPI.getPreviewLogos({
              year: selectedYear,
              cluster: previewClusterKey,
            });
            if (!cancelled) {
              const nextPreview = res.data || null;
              setCategoryPreview(nextPreview);
              if (nextPreview) setCachedCompanyPreview(selectedYear, nextPreview, previewClusterKey);
            }
          } catch (err) {
            console.error("❌ Error fetching category preview:", err);
          }
        })();
      } else {
        setCategoryPreview(null);
      }
      (async () => {
        try {
          const apiClusterParam = isPlacementHubCluster(clusterParam) ? clusterParam : undefined;
          const res = await companyAPI.getAllCompanies({
            year: selectedYear,
            cluster: apiClusterParam,
          });
          if (!cancelled) {
            const nextCompanies = res.data || [];
            setCompanies(nextCompanies);
            setCachedCompanies(selectedYear, nextCompanies, companyCacheScope);
          }
        } catch (err) {
          console.error("❌ Error fetching companies:", err);
        } finally {
          if (!cancelled) setCompaniesFetchDone(true);
        }
      })();
    } else {
      localStorage.setItem('companystats_selectedYear', selectedYear ? String(selectedYear) : '');
      setCategoryPreview(null);
      setHelpfulStatusByCompanyId({});
      setCompaniesFetchDone(false);
    }

    return () => {
      cancelled = true;
      if (!isPlacementDetailVisitYear(selectedYear)) {
        localStorage.removeItem('companystats_selectedYear');
      }
    };
  }, [selectedYear, location.pathname, placementTier, clusterParam, companyCacheScope]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getPlacementHubSettings();
        if (!cancelled && res.data?.openDreamMinLpaByYear) {
          setOpenDreamMinLpaByYear(res.data.openDreamMinLpaByYear);
        }
      } catch {
        /* keep defaults */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const yearStatsOpenDreamMinLpa = useMemo(() => {
    const clusterKey = effectiveClusterParam || PLACEMENT_CLUSTER_CS;
    const yearKey = selectedYear != null ? String(selectedYear) : null;
    const fromSettings =
      yearKey != null ? openDreamMinLpaByYear?.[yearKey]?.[clusterKey] : undefined;
    const n = Number(fromSettings);
    return Number.isFinite(n) && n >= 0 ? n : DEFAULT_OPEN_DREAM_MIN_LPA;
  }, [openDreamMinLpaByYear, effectiveClusterParam, selectedYear]);

  const openDreamThresholdLpaLabel = useMemo(() => {
    const n = yearStatsOpenDreamMinLpa;
    return Number.isFinite(n) ? String(n) : String(DEFAULT_OPEN_DREAM_MIN_LPA);
  }, [yearStatsOpenDreamMinLpa]);

  // Fetch year stats when 2024 or 2025 is selected
  useEffect(() => {
    if (selectedYear === 2024 || selectedYear === 2025) {
      // Check if user is logged in before fetching
      if (!user) {
        alert("You must be logged in to view 2024 and 2025 statistics.");
        setSelectedYear(null);
        return;
      }

      const fetchYearStats = async () => {
        setLoadingYearStats(true);
        try {
          const res = await yearStatsAPI.getYearStats(selectedYear);
          setYearStatsData(res.data || []);
        } catch (err) {
          console.error(`❌ Error fetching ${selectedYear} stats:`, err);
          if (err.response?.status === 401) {
            alert("You must be logged in to view this year's statistics.");
            setSelectedYear(null);
          } else {
            setYearStatsData([]);
          }
        } finally {
          setLoadingYearStats(false);
        }
      };
      fetchYearStats();
    }
  }, [selectedYear, user]);

  // Filter companies (only for 2026)
  const filteredCompanies = clusterScopedCompanies
    .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    .filter((c) =>
      companyPassesCgpaFilter(c, parsedCgpaFilter, placementTier, activeCategory)
    )
    .filter((c) => {
      const showPlacementTypeFilter =
        placementTier === PLACEMENT_TIER_DREAM ||
        placementTier === PLACEMENT_TIER_OPEN_DREAM;
      if (!showPlacementTypeFilter || activeCategory === "all") return true;

      const typeLower = normalizeType(c.type);

      if (activeCategory === "internship + fte") {
        return isInternshipFteNonPbcType(c);
      }
      if (activeCategory === "internship + fte (pbc)") {
        return isInternshipFtePbcType(c);
      }

      return typeLower === activeCategory.toLowerCase();
    });


  const ctcObjectFromRole = (ctc) => {
    if (ctc == null) return null;
    if (typeof ctc !== "object" || Array.isArray(ctc)) return null;
    if (typeof ctc.get === "function" && typeof ctc.entries === "function") {
      try {
        return Object.fromEntries(ctc);
      } catch {
        return null;
      }
    }
    return ctc;
  };

  const isCtcValueVacuous = (value) => {
    if (value === null || value === undefined) return true;
    if (typeof value === "string") {
      const normalized = value.trim();
      return normalized === "" || normalized === "0";
    }
    if (typeof value === "number") return !Number.isFinite(value) || value === 0;
    return false;
  };

  /** True when there are no CTC keys or every value is vacuous (no usable package text/amount). */
  const isCtcObjectEmpty = (ctc) => {
    const obj = ctcObjectFromRole(ctc);
    if (!obj) return true;
    const keys = Object.keys(obj);
    if (keys.length === 0) return true;
    return keys.every((k) => isCtcValueVacuous(obj[k]));
  };

  /** Any non-empty string in any role's ctc → belongs with Dream / Open dream, not internship-only. */
  const hasNonEmptyCtcStringInCompany = (company) => {
    if (!Array.isArray(company?.roles)) return false;
    for (const role of company.roles) {
      const obj = ctcObjectFromRole(role?.ctc);
      if (!obj) continue;
      for (const v of Object.values(obj)) {
        if (typeof v !== "string") continue;
        const normalized = v.trim();
        if (normalized !== "" && normalized !== "0") return true;
      }
    }
    return false;
  };

  const isFtePlacementType = (typeRaw) => {
    const norm = normalizeType(typeRaw);
    if (norm === "fte") return true;
    return norm.includes("internship") && norm.includes("fte");
  };

  const isInternshipOnlyCompany = (company) => {
    if (isFtePlacementType(company?.type)) return false;
    if (!Array.isArray(company?.roles) || company.roles.length === 0) return false;
    if (hasNonEmptyCtcStringInCompany(company)) return false;
    if (!company.roles.every((role) => isCtcObjectEmpty(role?.ctc))) return false;
    return company.roles.some((role) => Number(role?.internshipStipend) > 0);
  };

  const isPpoCompany = (company) => {
    const typeLower = normalizeType(company?.type);
    return typeLower.includes("ppo");
  };

  const isOffCampusCompany = (company) => {
    return isCompanyMarkedOffCampus(company);
  };

  const isStrictClusterTiering = isNonCsStrictHubCluster(effectiveClusterParam);

  /** Same rule as category-preview summer tiles: trust cluster-scoped flags, then merged type. */
  const qualifiesSummerInternshipTile = (company) => {
    if (company.placementSummerInternshipForListingYear === true) return true;
    if (!isStrictClusterTiering) {
      if (company.placementAnyYearPpoOnCampus === true) return true;
      if (company.placementAnyYearPpoOnCampus === false) return false;
    }
    return isPpoCompany(company) && !isOffCampusCompany(company);
  };

  /**
   * Dream / Open dream list membership: any year can supply a non-PPO on-campus FTE-style visit,
   * even when the hub’s primary row is a different year’s PPO.
   */
  const dreamTierListBase = (company) => {
    if (isOffCampusCompany(company) || isPpoCompany(company) || isInternshipOnlyCompany(company)) {
      return false;
    }
    if (!isStrictClusterTiering && company.placementHasDreamTierVisit === true) {
      return true;
    }
    // Do not hide the card for non-visit listing years (e.g. 2026 with first visit in 2027).
    // Card subtitle/empty-state handles the "no visit yet" messaging.
    return true;
  };

  const summerInternshipCompanies = sortPoolForTier(
    filteredCompanies.filter((company) => qualifiesSummerInternshipTile(company)),
    PLACEMENT_TIER_SUMMER_INTERNSHIP
  );
  const offCampusCompanies = sortPoolForTier(
    filteredCompanies.filter(isOffCampusCompany),
    PLACEMENT_TIER_OFF_CAMPUS
  );
  /** Trust per-year flags when hub year is set; otherwise fall back to merged visit shape. */
  const qualifiesInternshipOnlyTile = (company) => {
    if (isOffCampusCompany(company) || isPpoCompany(company)) return false;
    if (isPlacementDetailVisitYear(selectedYear)) {
      if (company.placementInternshipOnlyForListingYear === true) return true;
      if (company.placementInternshipOnlyForListingYear === false) return false;
    }
    return isInternshipOnlyCompany(company);
  };
  const internshipOnlyCompanies = sortPoolForTier(
    filteredCompanies.filter(qualifiesInternshipOnlyTile),
    PLACEMENT_TIER_INTERNSHIP_ONLY
  );
  const dreamCompanies = sortPoolForTier(
    filteredCompanies.filter(
      (company) => dreamTierListBase(company) && company.category !== "open dream"
    ),
    PLACEMENT_TIER_DREAM
  );
  const openDreamCompanies = sortPoolForTier(
    filteredCompanies.filter(
      (company) => dreamTierListBase(company) && company.category === "open dream"
    ),
    PLACEMENT_TIER_OPEN_DREAM
  );
  // Category cards must always represent full 2026 data, independent of list search/filter state.
  const allSummerInternshipCompanies = sortPoolForTier(
    clusterScopedCompanies.filter((company) => qualifiesSummerInternshipTile(company)),
    PLACEMENT_TIER_SUMMER_INTERNSHIP
  );
  const allOffCampusCompanies = sortPoolForTier(
    clusterScopedCompanies.filter(isOffCampusCompany),
    PLACEMENT_TIER_OFF_CAMPUS
  );
  const allInternshipOnlyCompanies = sortPoolForTier(
    clusterScopedCompanies.filter(qualifiesInternshipOnlyTile),
    PLACEMENT_TIER_INTERNSHIP_ONLY
  );
  const allDreamCompanies = sortPoolForTier(
    clusterScopedCompanies.filter(
      (company) => dreamTierListBase(company) && company.category !== "open dream"
    ),
    PLACEMENT_TIER_DREAM
  );
  const allOpenDreamCompanies = sortPoolForTier(
    clusterScopedCompanies.filter(
      (company) => dreamTierListBase(company) && company.category === "open dream"
    ),
    PLACEMENT_TIER_OPEN_DREAM
  );

  const dreamSlice = dreamCompanies.slice(
    (dreamPage - 1) * companiesPerPage,
    dreamPage * companiesPerPage
  );
  const openDreamSlice = openDreamCompanies.slice(
    (openDreamPage - 1) * companiesPerPage,
    openDreamPage * companiesPerPage
  );
  const internshipOnlySlice = internshipOnlyCompanies.slice(
    (internshipOnlyPage - 1) * companiesPerPage,
    internshipOnlyPage * companiesPerPage
  );
  const summerInternshipSlice = summerInternshipCompanies.slice(
    (summerInternshipPage - 1) * companiesPerPage,
    summerInternshipPage * companiesPerPage
  );
  const offCampusSlice = offCampusCompanies.slice(
    (offCampusPage - 1) * companiesPerPage,
    offCampusPage * companiesPerPage
  );

  const tierListConfig = useMemo(() => {
    if (placementTier === PLACEMENT_TIER_DREAM) {
      return {
        slice: dreamSlice,
        pool: dreamCompanies,
        page: dreamPage,
        setPage: setDreamPage,
      };
    }
    if (placementTier === PLACEMENT_TIER_OPEN_DREAM) {
      return {
        slice: openDreamSlice,
        pool: openDreamCompanies,
        page: openDreamPage,
        setPage: setOpenDreamPage,
      };
    }
    if (placementTier === PLACEMENT_TIER_INTERNSHIP_ONLY) {
      return {
        slice: internshipOnlySlice,
        pool: internshipOnlyCompanies,
        page: internshipOnlyPage,
        setPage: setInternshipOnlyPage,
      };
    }
    if (placementTier === PLACEMENT_TIER_OFF_CAMPUS) {
      return {
        slice: offCampusSlice,
        pool: offCampusCompanies,
        page: offCampusPage,
        setPage: setOffCampusPage,
      };
    }
    return {
      slice: summerInternshipSlice,
      pool: summerInternshipCompanies,
      page: summerInternshipPage,
      setPage: setSummerInternshipPage,
    };
  }, [
    placementTier,
    dreamSlice,
    dreamCompanies,
    dreamPage,
    openDreamSlice,
    openDreamCompanies,
    openDreamPage,
    internshipOnlySlice,
    internshipOnlyCompanies,
    internshipOnlyPage,
    offCampusSlice,
    offCampusCompanies,
    offCampusPage,
    summerInternshipSlice,
    summerInternshipCompanies,
    summerInternshipPage,
  ]);

  useEffect(() => {
    if (!companiesFetchDone || !isPlacementCardsYear || !placementTier) return;
    if (location.pathname !== PATH_COMPANY_STATS) return;
    if (String(search || "").trim()) return;
    if (tierListConfig.pool.length > 0) return;
    const cluster =
      effectiveClusterParam ||
      (isNonCsStrictHubCluster(clusterParam) ? clusterParam : PLACEMENT_CLUSTER_CS);
    setPlacementTier(null);
    navigate(companystatsClusterCategoryUrl(cluster), { replace: true });
  }, [
    companiesFetchDone,
    isPlacementCardsYear,
    placementTier,
    location.pathname,
    search,
    tierListConfig.pool.length,
    navigate,
    effectiveClusterParam,
    clusterParam,
  ]);

  const visibleCompanyIds = useMemo(
    () => tierListConfig.slice.map((company) => company?._id).filter(Boolean),
    [tierListConfig]
  );
  const visibleCompanyIdsKey = useMemo(
    () => visibleCompanyIds.join("|"),
    [visibleCompanyIds]
  );

  useEffect(() => {
    let cancelled = false;

    if (
      !user ||
      !isPlacementCardsYear ||
      !placementTier ||
      visibleCompanyIds.length === 0
    ) {
      setHelpfulStatusByCompanyId({});
      return () => {
        cancelled = true;
      };
    }

    (async () => {
      try {
        const response = await companyAPI.getHelpfulStatusBatch(visibleCompanyIds);
        if (!cancelled) {
          setHelpfulStatusByCompanyId(response.data?.statuses || {});
        }
      } catch (err) {
        if (!cancelled) {
          console.error("❌ Error fetching helpful status batch:", err);
          setHelpfulStatusByCompanyId({});
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.userId, isPlacementCardsYear, placementTier, visibleCompanyIds, visibleCompanyIdsKey]);

  const scrollToCompanyListTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const renderTierPagination = (totalItems, page, setPage) => {
    if (totalItems <= 0) return null;
    const totalPages = Math.max(1, Math.ceil(totalItems / companiesPerPage));
    return (
      <div className="pagination relative z-10 flex items-center justify-center gap-1 sm:gap-2 mt-6 sm:mt-8 mb-2 flex-wrap px-2 py-2">
        <button
          type="button"
          onClick={() => {
            setPage((prev) => Math.max(prev - 1, 1));
            scrollToCompanyListTop();
          }}
          disabled={page === 1}
          className="px-3 sm:px-4 py-2 rounded-lg disabled:opacity-50 transition duration-200 text-sm sm:text-base bg-theme-card border border-theme text-theme-secondary"
        >
          Prev
        </button>
        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
            const shouldShow =
              pageNum === 1 ||
              pageNum === totalPages ||
              Math.abs(pageNum - page) <= 1 ||
              (page <= 3 && pageNum <= 4) ||
              (page >= totalPages - 2 && pageNum >= totalPages - 3);

            if (!shouldShow) {
              if (pageNum === 2 && page > 4) {
                return <span key={`ellipsis-${pageNum}`} className="px-2 text-theme-muted">...</span>;
              }
              if (pageNum === totalPages - 1 && page < totalPages - 3) {
                return <span key={`ellipsis-2-${pageNum}`} className="px-2 text-theme-muted">...</span>;
              }
              return null;
            }

            return (
              <button
                type="button"
                key={pageNum}
                onClick={() => {
                  setPage(pageNum);
                  scrollToCompanyListTop();
                }}
                data-active={pageNum === page ? "true" : undefined}
                className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition duration-200 text-sm sm:text-base ${pageNum === page ? "active bg-theme-accent text-white" : "bg-theme-card border border-theme text-theme-secondary hover:bg-theme-nav"}`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => {
            setPage((prev) => Math.min(prev + 1, totalPages));
            scrollToCompanyListTop();
          }}
          disabled={page === totalPages}
          className="px-3 sm:px-4 py-2 rounded-lg disabled:opacity-50 transition duration-200 text-sm sm:text-base bg-theme-card border border-theme text-theme-secondary"
        >
          Next
        </button>
      </div>
    );
  };

  useEffect(() => {
    const cap = (p, len) => {
      if (len === 0) return 1;
      const totalPages = Math.max(1, Math.ceil(len / companiesPerPage));
      return Math.min(Math.max(1, p), totalPages);
    };
    setDreamPage((p) => cap(p, dreamCompanies.length));
    setOpenDreamPage((p) => cap(p, openDreamCompanies.length));
    setInternshipOnlyPage((p) => cap(p, internshipOnlyCompanies.length));
    setSummerInternshipPage((p) => cap(p, summerInternshipCompanies.length));
    setOffCampusPage((p) => cap(p, offCampusCompanies.length));
    setClusterBranchPage((p) => cap(p, ecMeFilteredCompanies.length));
  }, [
    companiesPerPage,
    dreamCompanies.length,
    openDreamCompanies.length,
    internshipOnlyCompanies.length,
    summerInternshipCompanies.length,
    offCampusCompanies.length,
    ecMeFilteredCompanies.length,
  ]);

  const resetListPages = () => {
    setDreamPage(1);
    setOpenDreamPage(1);
    setInternshipOnlyPage(1);
    setSummerInternshipPage(1);
    setOffCampusPage(1);
    setClusterBranchPage(1);
  };

  const handleCompanyCardUpdated = useCallback((companyId, updates = {}) => {
    if (!companyId || !updates || typeof updates !== "object") return;
    setCompanies((prevCompanies) => {
      const nextCompanies = prevCompanies.map((company) =>
        company._id === companyId ? { ...company, ...updates } : company
      );
      if (isPlacementDetailVisitYear(selectedYear)) {
        setCachedCompanies(selectedYear, nextCompanies, companyCacheScope);
      }
      return nextCompanies;
    });
    setHelpfulStatusByCompanyId((prev) => {
      const current = prev[companyId];
      if (!current && updates.helpfulCount === undefined) return prev;
      return {
        ...prev,
        [companyId]: {
          hasUpvoted: current?.hasUpvoted === true,
          helpfulCount:
            updates.helpfulCount !== undefined
              ? updates.helpfulCount
              : current?.helpfulCount ?? 0,
        },
      };
    });
  }, [selectedYear, companyCacheScope]);

  const yearStatsHubBullets = {
    2024: [
      "Year stats table with placement outcomes.",
      "Scan companies and packages at a glance.",
      "Sort / browse rows for quick comparison.",
      "Filter by dream and open-dream and view program-wise analytics.",
    ],
    2025: [
      "Year stats table with placement outcomes.",
      "Same layout as 2024 for easy comparison.",
      "Sort / browse rows for quick comparison.",
      "Filter by dream and open-dream and view program-wise analytics.",
    ],
    2026: [
      "OA questions and interview Q&A with solutions.",
      "Company-wise AI mock interviews.",
      "Past coding questions per company, with intuition.",
      "Must-do topics tailored per company.",
      "CTC split by role and more in each profile.",
      "Companies sorted by the date they arrived on campus.",
    ],
  };

  // Year selection view (hub only, not ?tier= and not /category)
  if (
    selectedYear === null &&
    location.pathname === PATH_COMPANY_STATS &&
    !isPlacementTierParam(tierQuery)
  ) {
    return (
      <div className={`min-h-screen overflow-x-hidden ${pageShellOuterClass}`}>
        <PageHeroFontStyles />
        <div className={pageShellInnerClass}>
          <PageBackNavRow>
            <PageBackButton onClick={handleBack} label="Back" />
          </PageBackNavRow>
        <div className="mx-auto w-full max-w-6xl min-w-0">
          {/* Year Selection Cards */}
          <div className="mb-8" data-tour="company-stats-years-hero">
            <PageHeroHeader
              subtitle="Pick a batch to open placement stats or the company hub."
              subtitleClassName="text-slate-400"
              subtitleMaxWidth="520px"
            >
              Select <em style={{ color: '#818CF8', fontStyle: 'italic' }}>Year</em>
            </PageHeroHeader>
          <div
            className="mt-2 grid w-full min-w-0 grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-6"
            data-tour="company-stats-years"
          >
            {[2024, 2025, DEFAULT_PLACEMENT_DETAIL_YEAR].map((year) => {
              const requiresAuth = year === 2024 || year === 2025;
              const isDisabled = requiresAuth && !user;
              const isPlacementHubPick = isPlacementDetailVisitYear(year);
              const bullets =
                yearStatsHubBullets[year] ||
                (isPlacementHubPick ? yearStatsHubBullets[DEFAULT_PLACEMENT_DETAIL_YEAR] : []);

              return (
                <button
                  key={year}
                  onClick={() => {
                    if (requiresAuth && !user) {
                      alert("You must be logged in to view 2024 and 2025 statistics.");
                      return;
                    }
                    if (isPlacementHubPick) {
                      setSelectedYear(year);
                      if (user?.userId) {
                        sessionStorage.setItem(
                          getStorageKey("companystats_selectedYear"),
                          String(year)
                        );
                      } else {
                        sessionStorage.setItem("companystats_selectedYear", String(year));
                      }
                      localStorage.setItem("companystats_selectedYear", String(year));
                      sessionStorage.setItem(getStorageKey("companystats_placement_tier"), "");
                      navigate(PATH_COMPANY_CATEGORY);
                      return;
                    }
                    setSelectedYear(year);
                  }}
                  disabled={isDisabled}
                  className={`company-card group flex min-h-0 w-full min-w-0 flex-col rounded-2xl border-2 bg-theme-card p-6 text-left shadow-lg transition-[box-shadow,border-color] duration-300 sm:p-7 motion-reduce:transition-none ${
                    isDisabled
                      ? "cursor-not-allowed border-theme opacity-50"
                      : "border-theme hover:border-theme-accent hover:shadow-2xl"
                  }`}
                >
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="mb-4 flex justify-center">
                      <div
                        className={`rounded-2xl border p-4 sm:p-5 ${
                          isDisabled
                            ? "border-theme bg-theme-nav text-theme-muted"
                            : "border-theme-accent/35 bg-theme-accent/10 text-theme-accent"
                        }`}
                      >
                        <FaCalendarAlt className="text-3xl sm:text-4xl" aria-hidden />
                      </div>
                    </div>
                    <h3 className="text-center text-xl font-bold text-theme-primary sm:text-2xl">
                      {isPlacementHubPick && year === DEFAULT_PLACEMENT_DETAIL_YEAR
                        ? "2026 Onwards"
                        : isPlacementHubPick
                          ? `${year} placement`
                          : `${year} Stats`}
                    </h3>
                    <p className="mb-4 text-center text-sm text-theme-secondary sm:text-base">
                      {isPlacementHubPick ? "View company cards" : "View statistics table"}
                    </p>
                    <ul className="w-full min-w-0 flex-1 list-outside list-disc space-y-2 pl-5 text-left text-sm leading-relaxed text-theme-secondary sm:pl-6 sm:text-base [&>li]:pl-1 marker:text-theme-accent">
                      {bullets.map((line, i) => (
                        <li key={`${year}-${i}`}>
                          {line}
                        </li>
                      ))}
                    </ul>
                    {!isDisabled && (
                      <div className="mt-5 flex items-center justify-center gap-1 text-xs font-semibold uppercase tracking-wide text-theme-accent opacity-90 group-hover:opacity-100 sm:text-sm">
                        <span>Open</span>
                        <FaChevronRight className="h-3 w-3" aria-hidden />
                      </div>
                    )}
                    {isDisabled && (
                      <p className="mt-4 text-center text-xs font-medium text-red-500 sm:text-sm">
                        Login required
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
            </div>
          </div>
        </div>
        </div>
      </div>
    );
  }

  // Year stats table view (2024 or 2025)
  if (selectedYear === 2024 || selectedYear === 2025) {
    return (
      <div className={`min-h-screen ${pageShellOuterClass}`} data-tour="company-stats-year-2025">
        <div className={pageShellInnerClass}>
          {loadingYearStats ? (
            <YearStatsTableShimmer yearLabel={String(selectedYear)} />
          ) : (
            <YearStatsTable
              year={selectedYear}
              data={yearStatsData}
              openDreamMinLpa={yearStatsOpenDreamMinLpa}
              onBack={() => {
                navigate(PATH_COMPANY_STATS, { replace: true });
                setSelectedYear(null);
                setYearStatsData([]);
              }}
            />
          )}
        </div>
      </div>
    );
  }

  const clusterHubBullets = {
    [PLACEMENT_CLUSTER_EC]: [
      "Electronics & Communication cluster hub.",
      "Programmes include: EC, EE, EI, ET",
    ],
    [PLACEMENT_CLUSTER_ME]: [
      "Mechanical cluster hub.",
      "Programmes include: AS, IM, ME",
    ],
    [PLACEMENT_CLUSTER_CS]: [
      "Computer Science & Engineering cluster hub.",
      "Programmes include: AI, CD, CS, CY, IS",
    ],
    [PLACEMENT_CLUSTER_CHEM]: [
      "Chemical sciences cluster hub.",
      "Programmes include: BT, CH, CV",
    ],
  };

  // Placement-card year /category (no cluster): pick cluster hub.
  if (
    isPlacementCardsYear &&
    placementTier === null &&
    location.pathname === PATH_COMPANY_CATEGORY &&
    clusterParam === null
  ) {
    const clusters = [
      {
        id: PLACEMENT_CLUSTER_CS,
        title: "CS cluster",
        subtitle: "Computer Science & Engineering",
        icon: FaLaptopCode,
        bullets: clusterHubBullets[PLACEMENT_CLUSTER_CS],
        companies: csCompanies,
      },
      {
        id: PLACEMENT_CLUSTER_EC,
        title: "EC cluster",
        subtitle: "Electronics & Communication",
        icon: FaBolt,
        bullets: clusterHubBullets[PLACEMENT_CLUSTER_EC],
        companies: ecCompanies,
      },
      {
        id: PLACEMENT_CLUSTER_ME,
        title: "ME cluster",
        subtitle: "Mechanical Engineering",
        icon: FaCogs,
        bullets: clusterHubBullets[PLACEMENT_CLUSTER_ME],
        companies: meCompanies,
      },
      {
        id: PLACEMENT_CLUSTER_CHEM,
        title: "Chemical sciences",
        subtitle: "CH · Civil · BT",
        icon: FaFlask,
        bullets: clusterHubBullets[PLACEMENT_CLUSTER_CHEM],
        companies: chemCompanies,
      },
    ];

    return (
      <div className={`min-h-screen overflow-x-hidden ${pageShellOuterClass}`}>
        <div className={pageShellInnerClass}>
          <PageBackNavRow>
            <PageBackButton
              onClick={() => {
                setCompanies([]);
                setSearch("");
                setTierCategories({
                  [PLACEMENT_TIER_DREAM]: "all",
                  [PLACEMENT_TIER_OPEN_DREAM]: "all",
                  [PLACEMENT_TIER_OFF_CAMPUS]: "all",
                });
                resetListPages();
                setPlacementTier(null);
                setSelectedYear(null);
                navigate(PATH_COMPANY_STATS, { replace: true });
              }}
              label="Back to Year Selection"
            />
          </PageBackNavRow>
        <div className="mx-auto w-full max-w-6xl min-w-0">
          <div className="mb-8">
            <h2 className="text-center text-2xl font-bold tracking-tight text-theme-primary sm:text-3xl">
              Choose your cluster
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-center text-sm text-theme-secondary sm:text-base">
              Pick your program cluster for the selected year company hub.
            </p>
            <div
              className="mt-8 grid w-full min-w-0 grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6"
              data-tour="company-stats-hub"
            >
              {clusters.map((c) => {
                const Icon = c.icon;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => navigate(companystatsClusterCategoryUrl(c.id))}
                    className="company-card group flex min-h-0 w-full min-w-0 flex-col rounded-2xl border-2 border-theme bg-theme-card p-6 text-left shadow-lg transition-[box-shadow,border-color] duration-300 sm:p-7 motion-reduce:transition-none hover:border-theme-accent hover:shadow-2xl"
                  >
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="mb-4 flex justify-center">
                        <div className="rounded-2xl border border-theme-accent/35 bg-theme-accent/10 p-4 text-theme-accent sm:p-5">
                          <Icon className="text-3xl sm:text-4xl" aria-hidden />
                        </div>
                      </div>
                      <h3 className="text-center text-xl font-bold text-theme-primary sm:text-2xl">{c.title}</h3>
                      <p className="mb-4 text-center text-sm text-theme-secondary sm:text-base">{c.subtitle}</p>
                      <ul className="w-full min-w-0 flex-1 list-outside list-disc space-y-2 pl-5 text-left text-sm leading-relaxed text-theme-secondary sm:pl-6 sm:text-base [&>li]:pl-1 marker:text-theme-accent">
                        {c.bullets.map((line, i) => (
                          <li key={`${c.id}-${i}`}>{line}</li>
                        ))}
                      </ul>
                      <div className="mt-5 flex items-center justify-start gap-1 text-xs font-semibold uppercase tracking-wide text-theme-accent opacity-90 group-hover:opacity-100 sm:text-sm">
                        <span>Open</span>
                        <FaChevronRight
                          className="h-3 w-3"
                          aria-hidden
                        />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        </div>
      </div>
    );
  }

  // Legacy EC / ME flat list route kept disabled after moving to tier cards parity.
  if (
    isPlacementCardsYear &&
    placementTier === null &&
    location.pathname === PATH_COMPANY_CATEGORY &&
    clusterParam === "__legacy_ec_me_flat_list__"
  ) {
    const clusterLabel = clusterParam === PLACEMENT_CLUSTER_EC ? "EC cluster" : "ME cluster";
    return (
      <div className={`min-h-screen overflow-x-hidden ${pageShellOuterClass}`}>
        <div className={pageShellInnerClass}>
          <PageBackNavRow>
            <PageBackButton
              onClick={() => navigate(PATH_COMPANY_CATEGORY, { replace: true })}
              label="Back to cluster selection"
            />
          </PageBackNavRow>
          <div className="mx-auto w-full max-w-7xl min-w-0">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-theme-primary sm:text-2xl">{clusterLabel}</h2>
            </div>
            <div className="top-bar mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex w-full flex-col gap-2 sm:max-w-xl sm:flex-row sm:items-center">
                <input
                  type="text"
                  placeholder={`Search in ${clusterLabel}...`}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setClusterBranchPage(1);
                  }}
                  className="search-bar w-full flex-1 px-4 py-2 sm:py-3 border border-theme-input rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-theme-accent transition duration-200 text-sm sm:text-base bg-theme-input text-theme-primary placeholder-theme-muted"
                />
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  max="10"
                  step="0.01"
                  placeholder="My CGPA"
                  title="Show companies whose CGPA cutoff is at most your CGPA (companies without a cutoff stay visible)"
                  value={cgpaFilter}
                  onChange={(e) => {
                    setCgpaFilter(clampCgpaFilterInput(e.target.value));
                    setClusterBranchPage(1);
                  }}
                  className="w-full sm:w-28 px-3 py-2 sm:py-3 border border-theme-input rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-theme-accent transition duration-200 text-sm sm:text-base bg-theme-input text-theme-primary placeholder-theme-muted"
                  aria-label="Filter by my CGPA"
                />
                <button
                  type="button"
                  onClick={() => setClusterBranchPage(1)}
                  className="inline-flex items-center gap-1 rounded-xl border border-theme bg-theme-card px-3 py-2 text-sm text-theme-secondary hover:bg-theme-nav"
                  aria-label="Search companies"
                >
                  <FaSearch className="h-4 w-4" aria-hidden />
                  <span className="hidden sm:inline">Search</span>
                </button>
              </div>
            </div>
            {ecMeFilteredCompanies.length === 0 ? (
              <div className="company-card rounded-2xl border-2 border-theme bg-theme-card p-8 text-center shadow-lg sm:p-10">
                <p className="text-base text-theme-secondary">No companies found in this cluster.</p>
              </div>
            ) : (
              <div className="company-grid grid w-full min-w-0 max-w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 items-stretch auto-rows-fr">
                {ecMeSlice.map((c) => (
                  <CompanyCard
                  key={c.placementCompanyVisitId || c._id}
                    company={c}
                    placementYear={selectedYear}
                    helpfulStatus={helpfulStatusByCompanyId[c._id]}
                    isAdmin={isAdmin}
                    onUpdate={handleCompanyCardUpdated}
                    onStatsUpdated={handleCompanyCardUpdated}
                    placementCluster={effectiveClusterParam}
                  />
                ))}
              </div>
            )}
            {renderTierPagination(ecMeFilteredCompanies.length, clusterBranchPage, setClusterBranchPage)}
            {ecMeFilteredCompanies.length > 0 && (
              <p className="mt-2 text-center text-sm text-theme-muted" aria-live="polite">
                Page {clusterBranchPage} of {ecMeTotalPages} · {ecMeFilteredCompanies.length}{" "}
                {ecMeFilteredCompanies.length === 1 ? "company" : "companies"}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Hub cluster: category cards
  if (
    isPlacementCardsYear &&
    placementTier === null &&
    location.pathname === PATH_COMPANY_CATEGORY &&
    isPlacementHubCluster(clusterParam)
  ) {
    const useFullListForCategoryTiles = isNonCsStrictHubCluster(clusterParam)
      ? true
      : companies.length > 0;
    const p = categoryPreview;
    const nTile = CATEGORY_TILE_LOGO_GRID;
    const dreamLogoPreview = useFullListForCategoryTiles
      ? allDreamCompanies.slice(0, nTile)
      : p?.logos?.dream ?? [];
    const openDreamLogoPreview = useFullListForCategoryTiles
      ? allOpenDreamCompanies.slice(0, nTile)
      : p?.logos?.openDream ?? [];
    const internshipOnlyLogoPreview = useFullListForCategoryTiles
      ? allInternshipOnlyCompanies.slice(0, nTile)
      : p?.logos?.internshipOnly ?? [];
    const offCampusLogoPreview = useFullListForCategoryTiles
      ? allOffCampusCompanies.slice(0, nTile)
      : p?.logos?.offCampus ?? [];
    const summerLogoPreview = useFullListForCategoryTiles
      ? allSummerInternshipCompanies.slice(0, nTile)
      : p?.logos?.summerInternship ?? [];
    const dreamCount = useFullListForCategoryTiles
      ? allDreamCompanies.length
      : p?.counts?.dream ?? 0;
    const openDreamCount = useFullListForCategoryTiles
      ? allOpenDreamCompanies.length
      : p?.counts?.openDream ?? 0;
    const internshipOnlyCount = useFullListForCategoryTiles
      ? allInternshipOnlyCompanies.length
      : p?.counts?.internshipOnly ?? 0;
    const summerCount = useFullListForCategoryTiles
      ? allSummerInternshipCompanies.length
      : p?.counts?.summerInternship ?? 0;
    const offCampusCount = useFullListForCategoryTiles
      ? allOffCampusCompanies.length
      : p?.counts?.offCampus ?? 0;

    const categoryTiles = [
      {
        tier: PLACEMENT_TIER_DREAM,
        title: "Dream companies",
        cutoffLabel: `< ${openDreamThresholdLpaLabel} LPA`,
        shortLabel: "Dream",
        count: dreamCount,
        logos: dreamLogoPreview,
        logoGrid: { gridSize: CATEGORY_TILE_LOGO_GRID, disableRotation: true, pixelSize: 72 },
      },
      {
        tier: PLACEMENT_TIER_OPEN_DREAM,
        title: "Open dream companies",
        cutoffLabel: `≥ ${openDreamThresholdLpaLabel} LPA`,
        shortLabel: "Open dream",
        count: openDreamCount,
        logos: openDreamLogoPreview,
        logoGrid: { gridSize: CATEGORY_TILE_LOGO_GRID, disableRotation: true, pixelSize: 72 },
      },
      {
        tier: PLACEMENT_TIER_SUMMER_INTERNSHIP,
        title: "Summer internship companies",
        shortLabel: "Summer internship",
        count: summerCount,
        logos: summerLogoPreview,
        logoGrid: { gridSize: CATEGORY_TILE_LOGO_GRID, disableRotation: true, pixelSize: 72 },
      },
      {
        tier: PLACEMENT_TIER_INTERNSHIP_ONLY,
        title: "Internship only companies",
        shortLabel: "Internship only (6 months)",
        count: internshipOnlyCount,
        logos: internshipOnlyLogoPreview,
        logoGrid: { gridSize: 5, interval: 3000 },
      },
      {
        tier: PLACEMENT_TIER_OFF_CAMPUS,
        title: "Off campus companies",
        shortLabel: "Off-campus",
        count: offCampusCount,
        logos: offCampusLogoPreview,
        logoGrid: { gridSize: 5, interval: 3000 },
      },
    ].filter((tile) => tile.count > 0);

    const isCategoryTilesLoading = categoryTiles.length === 0 && !companiesFetchDone;

    const categorySubtitle = (() => {
      if (isCategoryTilesLoading) {
        return "Loading categories…";
      }
      const labels = categoryTiles.map((tile) => tile.shortLabel);
      if (labels.length === 0) {
        return "No companies are listed in any category for this cluster yet.";
      }
      if (labels.length === 1) {
        return `Choose ${labels[0]} to browse company cards`;
      }
      const last = labels[labels.length - 1];
      const rest = labels.slice(0, -1).join(", ");
      return `Choose ${rest}, or ${last} to browse company cards`;
    })();

    return (
      <div className={`min-h-screen ${pageShellOuterClass}`}>
        <div className={pageShellInnerClass}>
          <PageBackNavRow>
            <PageBackButton
              onClick={() => {
                navigate(PATH_COMPANY_CATEGORY, { replace: true });
              }}
              label="Back to cluster selection"
            />
          </PageBackNavRow>
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <h2 className="text-center text-2xl font-bold tracking-tight text-theme-primary sm:text-3xl">
                Select category
              </h2>
              <p className="mx-auto mt-2 max-w-lg px-1 text-center text-sm leading-snug text-theme-secondary sm:max-w-2xl sm:px-0 sm:text-base sm:leading-normal md:text-lg">
                {categorySubtitle}
              </p>
            </div>
          </div>
          {isCategoryTilesLoading ? (
            <CategoryTilesGridShimmer />
          ) : categoryTiles.length === 0 ? (
            <div
              className="company-card mx-auto max-w-xl rounded-2xl border-2 border-dashed border-theme bg-theme-card/40 px-6 py-12 text-center"
              role="status"
            >
              <p className="text-base font-medium text-theme-primary sm:text-lg">No categories yet</p>
              <p className="mt-2 text-sm text-theme-secondary">
                When companies are added for this cluster, their categories will appear here.
              </p>
            </div>
          ) : (
          <div
            className="mx-auto grid min-w-0 w-full max-w-6xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 md:gap-6 auto-rows-fr items-stretch"
            data-tour="company-stats-categories"
          >
            {categoryTiles.map((tile) => (
            <button
              key={tile.tier}
              type="button"
              onClick={() => openPlacementTierList(tile.tier)}
              className="company-card flex h-full min-h-0 w-full min-w-0 flex-col rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 transition-[box-shadow,border-color] duration-300 border-2 bg-theme-card border-theme hover:border-theme-accent hover:shadow-2xl text-left"
            >
              <div className="flex h-full min-h-0 min-w-0 flex-col">
                <div className="mb-2 flex-shrink-0 sm:mb-3">
                  <h3 className="text-base font-bold leading-snug text-theme-primary sm:text-xl md:text-2xl">
                    {tile.title}
                  </h3>
                  {tile.cutoffLabel ? (
                    <p className="mt-0.5 text-[11px] leading-snug text-theme-muted sm:mt-1 sm:text-xs">
                      {tile.cutoffLabel}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-1 items-center justify-center mb-3 min-h-[156px] sm:mb-4 sm:min-h-[120px] md:min-h-[140px]">
                  <AnimatedLogoGrid companies={tile.logos} {...tile.logoGrid} />
                </div>
                <div className="flex items-center justify-between text-theme-primary font-medium mt-auto pt-1 border-t border-theme">
                  <span className="text-sm sm:text-base">
                    {tile.count} {tile.count === 1 ? "company" : "companies"}
                  </span>
                  <FaChevronRight className="text-theme-muted shrink-0" aria-hidden />
                </div>
              </div>
            </button>
            ))}
          </div>
          )}
        </div>
        </div>
      </div>
    );
  }

  // Company cards list: /companystats?tier=dream|open_dream|internship_only|summer_internship|off_campus
  if (
    !(
      isPlacementCardsYear &&
      placementTier &&
      location.pathname === PATH_COMPANY_STATS &&
      tierQuery === placementTier
    )
  ) {
    return (
      <div className="p-6 min-h-screen bg-theme-app flex items-center justify-center">
        <p className="text-theme-secondary text-sm">Loading…</p>
      </div>
    );
  }

  const tierListSlice = tierListConfig.slice;
  const tierListPool = tierListConfig.pool;
  const tierListPage = tierListConfig.page;
  const setTierListPage = tierListConfig.setPage;
  const tierListTotal = tierListPool.length;
  const tierListTotalPages = Math.max(1, Math.ceil(tierListTotal / companiesPerPage));

  return (
    <div className={`page-container min-h-screen relative w-full max-w-full min-w-0 ${pageShellOuterClass}`}>
      <div className={pageShellInnerClass}>
        <PageBackNavRow>
          <PageBackButton
            onClick={() => {
              resetListPages();
              navigate(
                companystatsClusterCategoryUrl(
                  effectiveClusterParam ||
                    (isNonCsStrictHubCluster(clusterParam) ? clusterParam : PLACEMENT_CLUSTER_CS)
                )
              );
            }}
            label="Back"
          />
        </PageBackNavRow>
        <div className="mb-4 sm:mb-6">
        <div className="top-bar flex flex-col sm:flex-row items-center sm:justify-between gap-4 mb-8 w-full">
          <div className="flex w-full flex-col gap-2 sm:max-w-xl sm:flex-row sm:items-center">
          <input
            type="text"
            placeholder="Search companies..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              resetListPages();
            }}
            data-tour="company-stats-2026-search"
            className="search-bar w-full flex-1 px-4 py-2 sm:py-3 border border-theme-input rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-theme-accent transition duration-200 text-sm sm:text-base bg-theme-input text-theme-primary placeholder-theme-muted"
          />
          <input
            type="number"
            inputMode="decimal"
            min="0"
            max="10"
            step="0.01"
            placeholder="My CGPA"
            title="Show companies whose CGPA cutoff is at most your CGPA (companies without a cutoff stay visible)"
            value={cgpaFilter}
            onChange={(e) => {
              setCgpaFilter(clampCgpaFilterInput(e.target.value));
              resetListPages();
            }}
            data-tour="company-stats-cgpa-filter"
            className="w-full sm:w-28 px-3 py-2 sm:py-3 border border-theme-input rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-theme-accent transition duration-200 text-sm sm:text-base bg-theme-input text-theme-primary placeholder-theme-muted"
            aria-label="Filter by my CGPA"
          />
        </div>
      </div>

      <section className="mb-6 sm:mb-10 w-full max-w-full min-w-0">
        <div
          className="company-grid grid w-full min-w-0 max-w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 items-stretch auto-rows-fr"
          data-tour="company-stats-company-grid"
        >
          {!companiesFetchDone ? (
            <CompanyCardGridShimmer count={companiesPerPage} />
          ) : tierListSlice.length > 0 ? (
            tierListSlice.map((c) => {
              let typeDisplayLabel;
              let detailDefaultYear;
              let typePlacementLabelPending = false;
              // Summer internship hub: fixed subtitle on every card; strict-visit rules only affect listing membership + detail page.
              if (placementTier === PLACEMENT_TIER_SUMMER_INTERNSHIP) {
                typeDisplayLabel = "Internship(PPO)";
                const listingYear = isPlacementDetailVisitYear(selectedYear)
                  ? selectedYear
                  : null;
                detailDefaultYear =
                  listingYear !== null
                    ? listingYear
                    : isPlacementDetailVisitYear(c.placementSummerDetailYear)
                      ? c.placementSummerDetailYear
                      : undefined;
              } else if (placementTier === PLACEMENT_TIER_INTERNSHIP_ONLY) {
                const listingYear = isPlacementDetailVisitYear(selectedYear)
                  ? selectedYear
                  : null;
                const internVisitType =
                  typeof c.placementInternshipOnlyDisplayType === "string"
                    ? c.placementInternshipOnlyDisplayType.trim()
                    : "";
                const mergedType =
                  typeof c.type === "string" && c.type.trim()
                    ? c.type.trim()
                    : "";
                typeDisplayLabel =
                  internVisitType || mergedType || "Only internship(6 months)";
                detailDefaultYear =
                  listingYear !== null
                    ? listingYear
                    : isPlacementDetailVisitYear(c.placementInternshipOnlyDetailYear)
                      ? c.placementInternshipOnlyDetailYear
                      : undefined;
              } else if (placementTier === PLACEMENT_TIER_OFF_CAMPUS) {
                const mergedType =
                  typeof c.type === "string" && c.type.trim()
                    ? c.type.trim()
                    : "";
                typeDisplayLabel = mergedType || "Off-campus";
              } else if (
                placementTier === PLACEMENT_TIER_DREAM ||
                placementTier === PLACEMENT_TIER_OPEN_DREAM
              ) {
                const listingYear = isPlacementDetailVisitYear(selectedYear)
                  ? selectedYear
                  : null;
                if (
                  !isStrictClusterTiering &&
                  listingYear !== null &&
                  c.placementDreamTierForListingYear === false
                ) {
                  const dreamDetailY = isPlacementDetailVisitYear(c.placementDreamDetailYear)
                    ? c.placementDreamDetailYear
                    : null;
                  const dreamFallbackLabel =
                    typeof c.placementDreamDisplayType === "string"
                      ? c.placementDreamDisplayType.trim()
                      : "";
                  const showLaterCycleDreamCard =
                    dreamDetailY !== null &&
                    dreamDetailY > listingYear &&
                    dreamFallbackLabel.length > 0;

                  if (showLaterCycleDreamCard) {
                    typeDisplayLabel = dreamFallbackLabel;
                    detailDefaultYear = dreamDetailY;
                    typePlacementLabelPending = false;
                  } else {
                    typeDisplayLabel = PLACEMENT_CATEGORY_NO_VISIT_COPY;
                    detailDefaultYear = listingYear;
                    typePlacementLabelPending = true;
                  }
                } else {
                  const mergedType =
                    typeof c.type === "string" && c.type.trim()
                      ? c.type.trim()
                      : "";
                  const dreamVisitType =
                    typeof c.placementDreamDisplayType === "string"
                      ? c.placementDreamDisplayType.trim()
                      : "";
                  typeDisplayLabel =
                    dreamVisitType || mergedType || "Placement Drive";
                  detailDefaultYear =
                    listingYear !== null
                      ? listingYear
                      : isPlacementDetailVisitYear(c.placementDreamDetailYear)
                        ? c.placementDreamDetailYear
                        : undefined;
                }
              }
              if (!isPlacementDetailVisitYear(detailDefaultYear)) {
                detailDefaultYear = undefined;
              }
              const placementListContext =
                placementTier === PLACEMENT_TIER_SUMMER_INTERNSHIP
                  ? PLACEMENT_TIER_SUMMER_INTERNSHIP
                  : placementTier === PLACEMENT_TIER_DREAM ||
                      placementTier === PLACEMENT_TIER_OPEN_DREAM
                    ? placementTier
                    : placementTier === PLACEMENT_TIER_INTERNSHIP_ONLY
                      ? PLACEMENT_TIER_INTERNSHIP_ONLY
                      : placementTier === PLACEMENT_TIER_OFF_CAMPUS
                        ? PLACEMENT_TIER_OFF_CAMPUS
                        : undefined;

              return (
                <CompanyCard
                  key={c.placementCompanyVisitId || c._id}
                  company={c}
                  typeDisplayLabel={typeDisplayLabel}
                  typePlacementLabelPending={typePlacementLabelPending}
                  detailDefaultYear={detailDefaultYear}
                  placementYear={selectedYear}
                  helpfulStatus={helpfulStatusByCompanyId[c._id]}
                  isAdmin={isAdmin}
                  onUpdate={handleCompanyCardUpdated}
                  onStatsUpdated={handleCompanyCardUpdated}
                  hidePlacementGotInCounts={
                    placementTier === PLACEMENT_TIER_SUMMER_INTERNSHIP ||
                    placementTier === PLACEMENT_TIER_DREAM ||
                    placementTier === PLACEMENT_TIER_OPEN_DREAM ||
                    placementTier === PLACEMENT_TIER_INTERNSHIP_ONLY ||
                    placementTier === PLACEMENT_TIER_OFF_CAMPUS
                  }
                  placementListContext={placementListContext}
                  placementCluster={effectiveClusterParam}
                />
              );
            })
          ) : (
            <div
              className="col-span-full flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-theme bg-theme-card/40 px-6 py-12 sm:py-14 text-center"
              role="status"
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-theme bg-theme-input text-theme-muted">
                <FaSearch className="h-6 w-6" aria-hidden />
              </div>
              <p className="text-base font-medium text-theme-primary sm:text-lg">No matches</p>
              <p className="mt-1 max-w-sm text-sm text-theme-secondary">
                Try a different search term or filter — companies will show here when they match.
              </p>
            </div>
          )}
        </div>
        {renderTierPagination(tierListTotal, tierListPage, setTierListPage)}
        {companiesFetchDone && tierListTotal > 0 && (
          <p className="mt-2 text-center text-sm text-theme-muted" aria-live="polite">
            Page {tierListPage} of {tierListTotalPages} · {tierListTotal}{" "}
            {tierListTotal === 1 ? "company" : "companies"}
          </p>
        )}
      </section>

      {(placementTier === PLACEMENT_TIER_DREAM ||
        placementTier === PLACEMENT_TIER_OPEN_DREAM) && (
        <div className="fixed bottom-28 sm:bottom-44 right-4 sm:right-8 lg:right-20 z-50 flex flex-col gap-3 sm:gap-4 items-end max-w-[calc(100vw-1.5rem)]">
          <button
            onClick={() => setShowFilter((prev) => !prev)}
            data-tour="company-stats-2026-filter"
            className="fab filter-fab bg-theme-accent p-3 sm:p-4 rounded-full shadow-lg transition duration-200"
            aria-label="Filter"
          >
            <FaFilter size={18} className="sm:w-5 sm:h-5" />
          </button>

          {showFilter && (
            <div
              className="absolute bottom-full mb-2 bg-theme-card border border-theme rounded-lg shadow-lg py-2 w-44 sm:w-56 flex flex-col right-0"
              data-tour="company-stats-2026-filter-menu"
            >
              <button
                onClick={() => {
                  setActiveCategory("all");
                  setShowFilter(false);
                  resetListPages();
                }}
                className={`px-4 py-2 text-left hover:bg-theme-nav text-theme-secondary ${
                  activeCategory === "all" ? "font-semibold nav-active-theme text-theme-primary" : ""
                }`}
              >
                All
              </button>
              <button
                data-tour="company-stats-2026-filter-fte"
                onClick={() => {
                  setActiveCategory("fte");
                  setShowFilter(false);
                  resetListPages();
                }}
                className={`px-4 py-2 text-left hover:bg-theme-nav text-theme-secondary ${
                  activeCategory === "fte" ? "font-semibold nav-active-theme text-theme-primary" : ""
                }`}
              >
                FTE
              </button>
              <button
                data-tour="company-stats-2026-filter-internship-fte"
                onClick={() => {
                  setActiveCategory("internship + fte");
                  setShowFilter(false);
                  resetListPages();
                }}
                className={`px-4 py-2 text-left hover:bg-theme-nav text-theme-secondary ${
                  activeCategory === "internship + fte" ? "font-semibold nav-active-theme text-theme-primary" : ""
                }`}
              >
                Internship + FTE
              </button>
              <button
                onClick={() => {
                  setActiveCategory("internship + fte (pbc)");
                  setShowFilter(false);
                  resetListPages();
                }}
                className={`px-4 py-2 text-left hover:bg-theme-nav text-theme-secondary ${
                  activeCategory === "internship + fte (pbc)"
                    ? "font-semibold nav-active-theme text-theme-primary"
                    : ""
                }`}
              >
                Internship + FTE (PBC)
              </button>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
    </div>
  );
}

export default CompanyStats;