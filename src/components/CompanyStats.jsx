import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import CompanyCard from "../components/CompanyCard";
import CompanyLogo from "../components/CompanyLogo";
import AnimatedLogoGrid from "../components/AnimatedLogoGrid";
import YearStatsTable from "../components/YearStatsTable";
import { YearStatsTableShimmer } from "../components/StatsLoadingShimmer";
import { FaFilter, FaCalendarAlt, FaArrowLeft, FaRegStar, FaMedal, FaChevronRight } from "react-icons/fa";
import { useAuth } from "../utils/AuthContext";
import { companyAPI, yearStatsAPI } from "../utils/api";
import {
  PLACEMENT_TIER_DREAM,
  PLACEMENT_TIER_INTERNSHIP_ONLY,
  PLACEMENT_TIER_OPEN_DREAM,
  PLACEMENT_TIER_SUMMER_INTERNSHIP,
  PATH_COMPANY_CATEGORY,
  PATH_COMPANY_STATS,
  companystatsTierListUrl,
  isPlacementTierParam,
} from "../constants/placementTiers.js";

function CompanyStats() {
  // Year selection state
  const [selectedYear, setSelectedYear] = useState(null);
  const [yearStatsData, setYearStatsData] = useState([]);
  const [loadingYearStats, setLoadingYearStats] = useState(false);

  // Company cards state (for 2026)
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [dreamPage, setDreamPage] = useState(1);
  const [openDreamPage, setOpenDreamPage] = useState(1);
  const [internshipOnlyPage, setInternshipOnlyPage] = useState(1);
  const [summerInternshipPage, setSummerInternshipPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);
  /** 2026: null = pick Dream vs Open dream; otherwise which list to show */
  const [placementTier, setPlacementTier] = useState(null);

  const companiesPerPage = 9;
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const tierQuery = searchParams.get("tier");
  const { user, isAdmin } = useAuth();

  const handleBack = () => {
    navigate('/');
  };  

  const toTimestamp = (value) => {
    if (value === null || value === undefined) return null;
    if (typeof value === "number" && Number.isFinite(value)) return value;

    const raw = String(value).trim();
    if (!raw) return null;

    // Numeric epoch values (seconds or milliseconds).
    if (/^\d+$/.test(raw)) {
      const n = Number(raw);
      if (Number.isFinite(n)) return raw.length <= 10 ? n * 1000 : n;
    }

    // Native parse first for ISO-like formats.
    let ts = Date.parse(raw);
    if (!Number.isNaN(ts)) return ts;

    // Remove ordinal suffixes (e.g. 25th -> 25) for "25th August 2026".
    const noOrdinal = raw.replace(/\b(\d{1,2})(st|nd|rd|th)\b/gi, "$1");
    ts = Date.parse(noOrdinal);
    if (!Number.isNaN(ts)) return ts;

    // dd/mm/yyyy or dd-mm-yyyy or dd.mm.yyyy
    const dmy = noOrdinal.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
    if (dmy) {
      const day = Number(dmy[1]);
      const month = Number(dmy[2]) - 1;
      let year = Number(dmy[3]);
      if (year < 100) year += 2000;
      const date = new Date(year, month, day);
      if (
        date.getFullYear() === year &&
        date.getMonth() === month &&
        date.getDate() === day
      ) {
        return date.getTime();
      }
    }

    return null;
  };

  const orderedCompanies = useMemo(() => {
    return [...companies].sort((a, b) => {
      const aMessageTs = toTimestamp(a?.messageDate ?? a?.messagedate ?? a?.message_date);
      const bMessageTs = toTimestamp(b?.messageDate ?? b?.messagedate ?? b?.message_date);

      if (aMessageTs !== null && bMessageTs !== null) return aMessageTs - bMessageTs;
      if (aMessageTs !== null) return -1;
      if (bMessageTs !== null) return 1;

      const aUpdatedTs = toTimestamp(a?.updatedAt) ?? toTimestamp(a?.createdAt) ?? 0;
      const bUpdatedTs = toTimestamp(b?.updatedAt) ?? toTimestamp(b?.createdAt) ?? 0;
      if (aUpdatedTs !== bUpdatedTs) return aUpdatedTs - bUpdatedTs;

      return (a?.name || "").localeCompare(b?.name || "");
    });
  }, [companies]);

  // Helper function to get user-specific storage keys
  const getStorageKey = (key) => {
    if (!user || !user.userId) return key;
    return `${key}_${user.userId}`;
  };

  // Clear old sessionStorage items when user changes
  useEffect(() => {
    if (user && user.userId) {
      // Clear any old sessionStorage items that don't belong to current user
      const keysToCheck = [
        'companystats_selectedYear',
        'companystats_search',
        'companystats_category',
        'companystats_dream_page',
        'companystats_open_dream_page',
        'companystats_internship_only_page',
        'companystats_summer_internship_page',
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
        'companystats_category',
        'companystats_dream_page',
        'companystats_open_dream_page',
        'companystats_internship_only_page',
        'companystats_summer_internship_page',
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

  // URL is source of truth for 2026 flow: /category (picker) vs /companystats?tier=… (list)
  useEffect(() => {
    if (location.pathname === PATH_COMPANY_CATEGORY) {
      setSelectedYear(2026);
      setPlacementTier(null);
      return;
    }
    if (location.pathname === PATH_COMPANY_STATS && isPlacementTierParam(tierQuery)) {
      setSelectedYear(2026);
      setPlacementTier(tierQuery);
    }
  }, [location.pathname, tierQuery]);

  // Check for navigation state or sessionStorage to restore selectedYear (non-2026 only on hub)
  useEffect(() => {
    if (location.pathname !== PATH_COMPANY_STATS || isPlacementTierParam(tierQuery)) return;

    if (location.state?.selectedYear !== undefined) {
      const yearToSet = location.state.selectedYear;
      if (yearToSet === 2026) {
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
        if (parsedYear === 2026) {
          navigate(PATH_COMPANY_CATEGORY, { replace: true });
        } else {
          setSelectedYear(parsedYear);
        }
      }
    }
  }, [location.state, location.pathname, tierQuery, user, navigate]);

  // Persist hub year (2024/2025 only). 2026 flow uses /category and ?tier= URLs only.
  useEffect(() => {
    if (!user?.userId) return;
    if (selectedYear === null || selectedYear === 2026) {
      sessionStorage.setItem(getStorageKey("companystats_selectedYear"), "");
    } else {
      sessionStorage.setItem(getStorageKey("companystats_selectedYear"), String(selectedYear));
    }
  }, [selectedYear, user]);

  useEffect(() => {
    if (selectedYear !== 2026 || !placementTier) return;
    if (location.pathname !== PATH_COMPANY_STATS) return;
    if (tierQuery !== placementTier) {
      navigate(companystatsTierListUrl(placementTier), { replace: true });
    }
  }, [selectedYear, placementTier, location.pathname, tierQuery, navigate]);

  useEffect(() => {
    if (location.pathname !== PATH_COMPANY_STATS) return;
    if (isPlacementTierParam(tierQuery)) return;
    if (selectedYear === 2026 && placementTier === null) {
      navigate(PATH_COMPANY_CATEGORY, { replace: true });
    }
  }, [location.pathname, tierQuery, selectedYear, placementTier, navigate]);

  // Only clear tier when leaving 2026 for a concrete other year — not when selectedYear is still null on first paint
  // (otherwise this runs before URL sync and wipes tier after /companystats?tier= navigation → infinite "Loading…").
  useEffect(() => {
    if (selectedYear == null) return;
    if (selectedYear !== 2026) setPlacementTier(null);
  }, [selectedYear]);

  // Internship-only / summer internship lists are pre-bucketed; hide type filter and avoid stale category emptying the grid.
  useEffect(() => {
    if (
      placementTier !== PLACEMENT_TIER_INTERNSHIP_ONLY &&
      placementTier !== PLACEMENT_TIER_SUMMER_INTERNSHIP
    )
      return;
    setCategory("all");
    setShowFilter(false);
  }, [placementTier]);

  // PPO companies live under Summer internship only; clear legacy "ppo" filter on Dream / Open dream.
  useEffect(() => {
    if (placementTier !== PLACEMENT_TIER_DREAM && placementTier !== PLACEMENT_TIER_OPEN_DREAM) return;
    setCategory((prev) => (prev === "ppo" ? "all" : prev));
  }, [placementTier]);

  useEffect(() => {
    const key = getStorageKey("companystats_placement_tier");
    if (selectedYear === 2026) {
      const v =
        placementTier === PLACEMENT_TIER_DREAM ||
        placementTier === PLACEMENT_TIER_OPEN_DREAM ||
        placementTier === PLACEMENT_TIER_INTERNSHIP_ONLY ||
        placementTier === PLACEMENT_TIER_SUMMER_INTERNSHIP
          ? placementTier
          : "";
      sessionStorage.setItem(key, v);
    } else {
      sessionStorage.removeItem(key);
    }
  }, [selectedYear, placementTier, user]);

  // Restore company cards state if coming back from company details
  useEffect(() => {
    if (!user) return;
    
    if (selectedYear === 2026 && sessionStorage.getItem(getStorageKey('fromCompanyCards')) === 'true') {
      const storedSearch = sessionStorage.getItem(getStorageKey('companystats_search'));
      const storedCategory = sessionStorage.getItem(getStorageKey('companystats_category'));
      const storedDreamPage = sessionStorage.getItem(getStorageKey('companystats_dream_page'));
      const storedOpenDreamPage = sessionStorage.getItem(getStorageKey('companystats_open_dream_page'));
      const storedInternshipOnlyPage = sessionStorage.getItem(getStorageKey('companystats_internship_only_page'));
      const storedSummerInternshipPage = sessionStorage.getItem(getStorageKey('companystats_summer_internship_page'));
      const legacyPage = sessionStorage.getItem(getStorageKey('companystats_page'));
      const parsedLegacy = legacyPage != null ? parseInt(legacyPage, 10) : NaN;
      const fallbackPage = Number.isFinite(parsedLegacy) && parsedLegacy > 0 ? parsedLegacy : 1;

      const storedTierRaw = sessionStorage.getItem(getStorageKey("companystats_placement_tier"));
      const storedTier =
        storedTierRaw === PLACEMENT_TIER_DREAM ||
        storedTierRaw === PLACEMENT_TIER_OPEN_DREAM ||
        storedTierRaw === PLACEMENT_TIER_INTERNSHIP_ONLY ||
        storedTierRaw === PLACEMENT_TIER_SUMMER_INTERNSHIP
          ? storedTierRaw
          : null;

      if (storedSearch !== null) setSearch(storedSearch);
      if (storedCategory !== null) {
        let cat =
          storedCategory === "only internship(6 months)" ? "all" : storedCategory;
        if (
          storedTier === PLACEMENT_TIER_INTERNSHIP_ONLY ||
          storedTier === PLACEMENT_TIER_SUMMER_INTERNSHIP
        )
          cat = "all";
        if (
          cat === "ppo" &&
          (storedTier === PLACEMENT_TIER_DREAM || storedTier === PLACEMENT_TIER_OPEN_DREAM)
        )
          cat = "all";
        setCategory(cat);
      }
      if (storedDreamPage !== null) setDreamPage(parseInt(storedDreamPage, 10) || 1);
      else setDreamPage(fallbackPage);
      if (storedOpenDreamPage !== null) setOpenDreamPage(parseInt(storedOpenDreamPage, 10) || 1);
      else setOpenDreamPage(fallbackPage);
      if (storedInternshipOnlyPage !== null) setInternshipOnlyPage(parseInt(storedInternshipOnlyPage, 10) || 1);
      else setInternshipOnlyPage(fallbackPage);
      if (storedSummerInternshipPage !== null)
        setSummerInternshipPage(parseInt(storedSummerInternshipPage, 10) || 1);
      else setSummerInternshipPage(fallbackPage);

      if (storedTier) {
        setPlacementTier(storedTier);
      }
      
      // Clear the flag after restoring
      sessionStorage.removeItem(getStorageKey('fromCompanyCards'));
    }
  }, [selectedYear, user]);

  // Store company cards state whenever it changes (for restoring after navigation)
  useEffect(() => {
    if (selectedYear === 2026 && user && user.userId) {
      sessionStorage.setItem(getStorageKey('companystats_search'), search);
      sessionStorage.setItem(getStorageKey('companystats_category'), category);
      sessionStorage.setItem(getStorageKey('companystats_dream_page'), String(dreamPage));
      sessionStorage.setItem(getStorageKey('companystats_open_dream_page'), String(openDreamPage));
      sessionStorage.setItem(getStorageKey('companystats_internship_only_page'), String(internshipOnlyPage));
      sessionStorage.setItem(getStorageKey('companystats_summer_internship_page'), String(summerInternshipPage));
    }
  }, [selectedYear, search, category, dreamPage, openDreamPage, internshipOnlyPage, summerInternshipPage, user]);

  // Fetch companies only when 2026 is selected
  useEffect(() => {
    if (selectedYear === 2026) {
      // Set localStorage flag for chatbot visibility
      localStorage.setItem('companystats_selectedYear', '2026');
      
      const fetchCompanies = async () => {
        try {
          const res = await companyAPI.getAllCompanies();
          setCompanies(res.data || []);
        } catch (err) {
          console.error("❌ Error fetching companies:", err);
        }
      };
      fetchCompanies();
    } else {
      // Clear the flag when not on 2026
      localStorage.setItem('companystats_selectedYear', selectedYear ? String(selectedYear) : '');
    }

    // Cleanup: clear localStorage when component unmounts
    return () => {
      if (selectedYear !== 2026) {
        localStorage.removeItem('companystats_selectedYear');
      }
    };
  }, [selectedYear]);

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
  const filteredCompanies = orderedCompanies
    .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    .filter((c) => {
      if (category === "all") return true;
      
      const typeLower = (c.type || "").toLowerCase();

      if (category === "ppo") {
        return typeLower.includes("ppo");
      }
      if (category === "internship + fte") {
        return typeLower.includes("internship") && typeLower.includes("fte");
      }
      if (category === "others") {
        const isFte = typeLower === "fte";
        const isOnlyInternship = typeLower === "only internship(6 months)";
        const isPpo = typeLower.includes("ppo");
        const isInternshipFte = typeLower.includes("internship") && typeLower.includes("fte");
        return !isFte && !isOnlyInternship && !isPpo && !isInternshipFte;
      }
      
      return typeLower === category.toLowerCase();
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

  const isInternshipOnlyCompany = (company) => {
    if (!Array.isArray(company?.roles) || company.roles.length === 0) return false;
    if (hasNonEmptyCtcStringInCompany(company)) return false;
    if (!company.roles.every((role) => isCtcObjectEmpty(role?.ctc))) return false;
    return company.roles.some((role) => Number(role?.internshipStipend) > 0);
  };

  const isPpoCompany = (company) => {
    const typeLower = (company?.type || "").toLowerCase();
    return typeLower.includes("ppo");
  };

  const summerInternshipCompanies = filteredCompanies.filter(isPpoCompany);
  const internshipOnlyCompanies = filteredCompanies.filter(
    (company) => isInternshipOnlyCompany(company) && !isPpoCompany(company)
  );
  const dreamCompanies = filteredCompanies.filter(
    (company) =>
      !isPpoCompany(company) &&
      company.category !== "open dream" &&
      !isInternshipOnlyCompany(company)
  );
  const openDreamCompanies = filteredCompanies.filter(
    (company) =>
      !isPpoCompany(company) &&
      company.category === "open dream" &&
      !isInternshipOnlyCompany(company)
  );
  // Category cards must always represent full 2026 data, independent of list search/filter state.
  const allSummerInternshipCompanies = orderedCompanies.filter(isPpoCompany);
  const allInternshipOnlyCompanies = orderedCompanies.filter(
    (company) => isInternshipOnlyCompany(company) && !isPpoCompany(company)
  );
  const allDreamCompanies = orderedCompanies.filter(
    (company) =>
      !isPpoCompany(company) &&
      company.category !== "open dream" &&
      !isInternshipOnlyCompany(company)
  );
  const allOpenDreamCompanies = orderedCompanies.filter(
    (company) =>
      !isPpoCompany(company) &&
      company.category === "open dream" &&
      !isInternshipOnlyCompany(company)
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

  const scrollToCompanyListTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const renderTierPagination = (totalItems, page, setPage) => {
    const totalPages = Math.ceil(totalItems / companiesPerPage);
    if (totalItems <= companiesPerPage) return null;
    return (
      <div className="pagination flex items-center justify-center gap-1 sm:gap-2 mt-4 sm:mt-6 flex-wrap px-2">
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

  const resetListPages = () => {
    setDreamPage(1);
    setOpenDreamPage(1);
    setInternshipOnlyPage(1);
    setSummerInternshipPage(1);
  };

  const yearStatsHubBullets = {
    2024: [
      "Year stats table with placement outcomes.",
      "Scan companies and packages at a glance.",
      "Sort / browse rows for quick comparison.",
      "Filter by dream and open-dream and view branch-wise analytics.",
    ],
    2025: [
      "Year stats table with placement outcomes.",
      "Same layout as 2024 for easy comparison.",
      "Sort / browse rows for quick comparison.",
      "Filter by dream and open-dream and view branch-wise analytics.",
    ],
    2026: [
      "OA questions and interview Q&A with solutions.",
      "Company-wise AI mock interviews.",
      "Past coding questions per company, with intuition.",
      "Must-do topics tailored per company.",
      "CTC split by role—and more in each profile.",
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
      <div className="min-h-screen overflow-x-hidden bg-theme-app px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto w-full max-w-6xl min-w-0">
           {/* Back Button */}
      <div className="mb-6 flex items-center justify-between gap-2 flex-wrap">
        <button
          type="button"
          onClick={handleBack}
          className="back-nav-clear-sidebar flex items-center back-link-theme text-sm sm:text-base transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>
      </div>
          {/* Year Selection Cards */}
          <div className="mb-8">
            <h2 className="text-center text-2xl font-bold tracking-tight text-theme-primary sm:text-3xl">
              Select Year
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-center text-sm text-theme-secondary sm:text-base">
              Pick a batch to open placement stats or the 2026 company hub.
            </p>
          <div className="mt-8 grid w-full min-w-0 grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-6">
            {[2024, 2025, 2026].map((year) => {
              const requiresAuth = year === 2024 || year === 2025;
              const isDisabled = requiresAuth && !user;
              const bullets = yearStatsHubBullets[year] || [];
              
              return (
                <button
                  key={year}
                  onClick={() => {
                    if (requiresAuth && !user) {
                      alert("You must be logged in to view 2024 and 2025 statistics.");
                      return;
                    }
                    if (year === 2026) {
                      sessionStorage.setItem(getStorageKey("companystats_placement_tier"), "");
                      navigate(PATH_COMPANY_CATEGORY);
                      return;
                    }
                    setSelectedYear(year);
                  }}
                  disabled={isDisabled}
                  className={`company-card group flex min-h-0 w-full min-w-0 flex-col rounded-2xl border-2 bg-theme-card p-6 text-left shadow-lg transition-[transform,box-shadow,border-color] duration-300 sm:p-7 motion-reduce:transition-none ${
                    isDisabled
                      ? "cursor-not-allowed border-theme opacity-50"
                      : "border-theme hover:-translate-y-1 hover:border-theme-accent hover:shadow-2xl motion-reduce:hover:translate-y-0"
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
                      {year} Stats
                    </h3>
                    <p className="mb-4 text-center text-sm text-theme-secondary sm:text-base">
                      {year === 2026 ? "View company cards" : "View statistics table"}
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
                        <FaChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" aria-hidden />
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
    );
  }

  // Year stats table view (2024 or 2025)
  if (selectedYear === 2024 || selectedYear === 2025) {
    return (
      <div className="p-4 sm:p-6 min-h-screen bg-theme-app">
        <div className="max-w-7xl mx-auto">
          {loadingYearStats ? (
            <YearStatsTableShimmer yearLabel={String(selectedYear)} />
          ) : (
            <YearStatsTable
              year={selectedYear}
              data={yearStatsData}
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

  // 2026: choose Dream / Open dream / Internship only / Summer internship — /category only
  if (
    selectedYear === 2026 &&
    placementTier === null &&
    location.pathname === PATH_COMPANY_CATEGORY
  ) {
    const dreamLogoPreview = allDreamCompanies.slice(0, 5);
    const openDreamLogoPreview = allOpenDreamCompanies.slice(0, 5);
    const internshipOnlyLogoPreview = allInternshipOnlyCompanies.slice(0, 5);

    return (
      <div className="p-6 sm:p-8 min-h-screen bg-theme-app">
        <div className="max-w-7xl mx-auto">
          <button
            type="button"
            onClick={() => {
              setCompanies([]);
              setSearch("");
              setCategory("all");
              resetListPages();
              setPlacementTier(null);
              setSelectedYear(null);
              navigate(PATH_COMPANY_STATS, { replace: true });
            }}
            className="back-nav-clear-sidebar mb-6 flex items-center back-link-theme text-sm sm:text-base"
          >
            <FaArrowLeft className="mr-2" />
            Back to Year Selection
          </button>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-theme-primary mb-2">Select category</h2>
            <p className="text-theme-secondary text-sm sm:text-base whitespace-nowrap">
              Choose Dream, Open dream, Internship only, or Summer internship (type includes PPO) to browse company cards for 2026.
            </p>
          </div>
          <div className="mx-auto grid min-w-0 w-full max-w-5xl grid-cols-2 grid-rows-2 gap-3 sm:gap-5 md:gap-6 auto-rows-fr items-stretch">
            <button
              type="button"
              onClick={() => navigate(companystatsTierListUrl(PLACEMENT_TIER_DREAM))}
              className="company-card flex h-full min-h-0 w-full min-w-0 flex-col rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 transition-all duration-300 border-2 bg-theme-card border-theme hover:border-theme-accent hover:shadow-2xl hover:scale-[1.02] text-left"
            >
              <div className="flex h-full min-h-0 min-w-0 flex-col">

                <h3 className="text-base leading-snug sm:text-xl md:text-2xl font-bold text-theme-primary mb-2 sm:mb-3 flex-shrink-0">
                  Dream companies
                </h3>
                <div className="flex flex-1 items-center justify-center mb-3 min-h-[88px] sm:mb-4 sm:min-h-[120px] md:min-h-[140px]">
                  <AnimatedLogoGrid
                    companies={dreamLogoPreview}
                    gridSize={5}
                    interval={3500}
                  />
                </div>
                <div className="flex items-center justify-between text-theme-primary font-medium mt-auto pt-1 border-t border-theme">
                  <span className="text-sm sm:text-base">{allDreamCompanies.length} companies</span>
                  <FaChevronRight className="text-theme-muted shrink-0" aria-hidden />
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => navigate(companystatsTierListUrl(PLACEMENT_TIER_OPEN_DREAM))}
              className="company-card flex h-full min-h-0 w-full min-w-0 flex-col rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 transition-all duration-300 border-2 bg-theme-card border-theme hover:border-theme-accent hover:shadow-2xl hover:scale-[1.02] text-left"
            >
              <div className="flex h-full min-h-0 min-w-0 flex-col">

                <h3 className="text-base leading-snug sm:text-xl md:text-2xl font-bold text-theme-primary mb-2 sm:mb-3 flex-shrink-0">
                  Open dream companies
                </h3>
                <div className="flex flex-1 items-center justify-center mb-3 min-h-[88px] sm:mb-4 sm:min-h-[120px] md:min-h-[140px]">
                  <AnimatedLogoGrid
                    companies={openDreamLogoPreview}
                    gridSize={5}
                    interval={2800}
                  />
                </div>
                <div className="flex items-center justify-between text-theme-primary font-medium mt-auto pt-1 border-t border-theme">
                  <span className="text-sm sm:text-base">{allOpenDreamCompanies.length} companies</span>
                  <FaChevronRight className="text-theme-muted shrink-0" aria-hidden />
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => navigate(companystatsTierListUrl(PLACEMENT_TIER_INTERNSHIP_ONLY))}
              className="company-card flex h-full min-h-0 w-full min-w-0 flex-col rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 transition-all duration-300 border-2 bg-theme-card border-theme hover:border-theme-accent hover:shadow-2xl hover:scale-[1.02] text-left"
            >
              <div className="flex h-full min-h-0 min-w-0 flex-col">

                <h3 className="text-base leading-snug sm:text-xl md:text-2xl font-bold text-theme-primary mb-2 sm:mb-3 flex-shrink-0">
                  Internship only companies
                </h3>
                <div className="flex flex-1 items-center justify-center mb-3 min-h-[88px] sm:mb-4 sm:min-h-[120px] md:min-h-[140px]">
                  <AnimatedLogoGrid
                    companies={internshipOnlyLogoPreview}
                    gridSize={5}
                    interval={3000}
                  />
                </div>
                <div className="flex items-center justify-between text-theme-primary font-medium mt-auto pt-1 border-t border-theme">
                  <span className="text-sm sm:text-base">{allInternshipOnlyCompanies.length} companies</span>
                  <FaChevronRight className="text-theme-muted shrink-0" aria-hidden />
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => navigate(companystatsTierListUrl(PLACEMENT_TIER_SUMMER_INTERNSHIP))}
              className="company-card flex h-full min-h-0 w-full min-w-0 flex-col rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 transition-all duration-300 border-2 bg-theme-card border-theme hover:border-theme-accent hover:shadow-2xl hover:scale-[1.02] text-left"
            >
              <div className="flex h-full min-h-0 min-w-0 flex-col">
                <h3 className="text-base leading-snug sm:text-xl md:text-2xl font-bold text-theme-primary mb-2 sm:mb-3 flex-shrink-0">
                  Summer internship companies
                </h3>
                <div className="flex flex-1 items-center justify-center mb-3 min-h-[88px] sm:mb-4 sm:min-h-[120px] md:min-h-[140px]">
                  <AnimatedLogoGrid
                    companies={allSummerInternshipCompanies.slice(0, 5)}
                    gridSize={5}
                    interval={3200}
                  />
                </div>
                <div className="flex items-center justify-between text-theme-primary font-medium mt-auto pt-1 border-t border-theme">
                  <span className="text-sm sm:text-base">{allSummerInternshipCompanies.length} companies</span>
                  <FaChevronRight className="text-theme-muted shrink-0" aria-hidden />
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Company cards list: /companystats?tier=dream|open_dream|internship_only|summer_internship
  if (
    !(
      selectedYear === 2026 &&
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

  let tierListSlice;
  let tierListPool;
  let tierListPage;
  let setTierListPage;
  if (placementTier === PLACEMENT_TIER_DREAM) {
    tierListSlice = dreamSlice;
    tierListPool = dreamCompanies;
    tierListPage = dreamPage;
    setTierListPage = setDreamPage;
  } else if (placementTier === PLACEMENT_TIER_OPEN_DREAM) {
    tierListSlice = openDreamSlice;
    tierListPool = openDreamCompanies;
    tierListPage = openDreamPage;
    setTierListPage = setOpenDreamPage;
  } else if (placementTier === PLACEMENT_TIER_INTERNSHIP_ONLY) {
    tierListSlice = internshipOnlySlice;
    tierListPool = internshipOnlyCompanies;
    tierListPage = internshipOnlyPage;
    setTierListPage = setInternshipOnlyPage;
  } else {
    tierListSlice = summerInternshipSlice;
    tierListPool = summerInternshipCompanies;
    tierListPage = summerInternshipPage;
    setTierListPage = setSummerInternshipPage;
  }

  return (
    <div className="page-container px-4 sm:px-6 pt-3 sm:pt-4 pb-4 sm:pb-6 min-h-screen relative bg-theme-app w-full max-w-full min-w-0">
      <div className="mb-4 sm:mb-6">
        <button
          type="button"
          onClick={() => {
            resetListPages();
            navigate(PATH_COMPANY_CATEGORY);
          }}
          className="back-nav-clear-sidebar mb-6 flex items-center back-link-theme text-sm sm:text-base"
        >
          <FaArrowLeft className="mr-2" />
          Back
        </button>
        <div className="top-bar flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <div className="w-full sm:w-auto sm:max-w-md">
          <input
            type="text"
            placeholder="Search companies..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              resetListPages();
            }}
              className="search-bar w-full px-4 py-2 sm:py-3 border border-theme-input rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-theme-accent transition duration-200 text-sm sm:text-base bg-theme-input text-theme-primary placeholder-theme-muted"
          />
        </div>
        </div>
      </div>

      <section className="mb-6 sm:mb-10 w-full max-w-full min-w-0">
        <div className="company-grid grid w-full min-w-0 max-w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 items-stretch auto-rows-fr">
          {tierListSlice.length > 0 ? (
            tierListSlice.map((c) => (
              <CompanyCard
                key={c._id}
                company={c}
                isAdmin={isAdmin}
                onStatsUpdated={() => companyAPI.getAllCompanies().then((res) => setCompanies(res.data || []))}
              />
            ))
          ) : (
            <p className="text-theme-muted col-span-full text-center py-8">
              No companies match your search or filters.
            </p>
          )}
        </div>
        {renderTierPagination(tierListPool.length, tierListPage, setTierListPage)}
      </section>

      {placementTier !== PLACEMENT_TIER_INTERNSHIP_ONLY &&
        placementTier !== PLACEMENT_TIER_SUMMER_INTERNSHIP && (
        <div className="fixed bottom-28 sm:bottom-44 right-4 sm:right-8 lg:right-20 z-50 flex flex-col gap-3 sm:gap-4 items-end max-w-[calc(100vw-1.5rem)]">
          <button
            onClick={() => setShowFilter((prev) => !prev)}
            className="fab filter-fab bg-theme-accent p-3 sm:p-4 rounded-full shadow-lg transition duration-200"
            aria-label="Filter"
          >
            <FaFilter size={18} className="sm:w-5 sm:h-5" />
          </button>

          {showFilter && (
            <div className="absolute bottom-full mb-2 bg-theme-card border border-theme rounded-lg shadow-lg py-2 w-40 sm:w-48 flex flex-col right-0">
              <button
                onClick={() => {
                  setCategory("all");
                  setShowFilter(false);
                  resetListPages();
                }}
                className={`px-4 py-2 text-left hover:bg-theme-nav text-theme-secondary ${
                  category === "all" ? "font-semibold nav-active-theme text-theme-primary" : ""
                }`}
              >
                All
              </button>
              <button
                onClick={() => {
                  setCategory("fte");
                  setShowFilter(false);
                  resetListPages();
                }}
                className={`px-4 py-2 text-left hover:bg-theme-nav text-theme-secondary ${
                  category === "fte" ? "font-semibold nav-active-theme text-theme-primary" : ""
                }`}
              >
                FTE
              </button>
              <button
                onClick={() => {
                  setCategory("internship + fte");
                  setShowFilter(false);
                  resetListPages();
                }}
                className={`px-4 py-2 text-left hover:bg-theme-nav text-theme-secondary ${
                  category === "internship + fte" ? "font-semibold nav-active-theme text-theme-primary" : ""
                }`}
              >
                Internship + FTE
              </button>
              <button
                onClick={() => {
                  setCategory("others");
                  setShowFilter(false);
                  resetListPages();
                }}
                className={`px-4 py-2 text-left hover:bg-theme-nav text-theme-secondary ${
                  category === "others" ? "font-semibold nav-active-theme text-theme-primary" : ""
                }`}
              >
                Others
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CompanyStats;
