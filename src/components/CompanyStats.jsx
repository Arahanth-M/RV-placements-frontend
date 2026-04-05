import React, { useEffect, useState, useRef } from "react";
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
  PLACEMENT_TIER_OPEN_DREAM,
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
  const [cluster, setCluster] = useState("all");
  const [dreamPage, setDreamPage] = useState(1);
  const [openDreamPage, setOpenDreamPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);
  const [showClusterFilter, setShowClusterFilter] = useState(false);
  /** 2026: null = pick Dream vs Open dream; otherwise which list to show */
  const [placementTier, setPlacementTier] = useState(null);

  const companiesPerPage = 9;
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const tierQuery = searchParams.get("tier");
  const { user, isAdmin } = useAuth();
  const clusterFilterRef = useRef(null);

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
        'companystats_cluster',
        'companystats_dream_page',
        'companystats_open_dream_page',
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
        'companystats_cluster',
        'companystats_dream_page',
        'companystats_open_dream_page',
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

  useEffect(() => {
    const key = getStorageKey("companystats_placement_tier");
    if (selectedYear === 2026) {
      const v =
        placementTier === PLACEMENT_TIER_DREAM || placementTier === PLACEMENT_TIER_OPEN_DREAM
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
      const storedCluster = sessionStorage.getItem(getStorageKey('companystats_cluster'));
      const storedDreamPage = sessionStorage.getItem(getStorageKey('companystats_dream_page'));
      const storedOpenDreamPage = sessionStorage.getItem(getStorageKey('companystats_open_dream_page'));
      const legacyPage = sessionStorage.getItem(getStorageKey('companystats_page'));
      const parsedLegacy = legacyPage != null ? parseInt(legacyPage, 10) : NaN;
      const fallbackPage = Number.isFinite(parsedLegacy) && parsedLegacy > 0 ? parsedLegacy : 1;

      if (storedSearch !== null) setSearch(storedSearch);
      if (storedCategory !== null) setCategory(storedCategory);
      if (storedCluster !== null) setCluster(storedCluster);
      if (storedDreamPage !== null) setDreamPage(parseInt(storedDreamPage, 10) || 1);
      else setDreamPage(fallbackPage);
      if (storedOpenDreamPage !== null) setOpenDreamPage(parseInt(storedOpenDreamPage, 10) || 1);
      else setOpenDreamPage(fallbackPage);

      const storedTier = sessionStorage.getItem(getStorageKey("companystats_placement_tier"));
      if (storedTier === PLACEMENT_TIER_DREAM || storedTier === PLACEMENT_TIER_OPEN_DREAM) {
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
      sessionStorage.setItem(getStorageKey('companystats_cluster'), cluster);
      sessionStorage.setItem(getStorageKey('companystats_dream_page'), String(dreamPage));
      sessionStorage.setItem(getStorageKey('companystats_open_dream_page'), String(openDreamPage));
    }
  }, [selectedYear, search, category, cluster, dreamPage, openDreamPage, user]);

  // Fetch companies only when 2026 is selected
  useEffect(() => {
    if (selectedYear === 2026) {
      // Set localStorage flag for chatbot visibility
      localStorage.setItem('companystats_selectedYear', '2026');
      
      const fetchCompanies = async () => {
        try {
          const res = await companyAPI.getAllCompanies();
          setCompanies(res.data);
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

  // Close cluster filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (clusterFilterRef.current && !clusterFilterRef.current.contains(event.target)) {
        setShowClusterFilter(false);
      }
    };

    if (showClusterFilter) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showClusterFilter]);

  // Filter companies (only for 2026)
  const filteredCompanies = companies
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
    })
    .filter((c) => {
      if (cluster === "all") return true;
      // Handle null/undefined and trim whitespace for comparison
      const companyCluster = c.cluster ? c.cluster.trim() : null;
      const selectedCluster = cluster.trim();
      return companyCluster === selectedCluster;
    });

  const dreamCompanies = filteredCompanies.filter((c) => c.category !== "open dream");
  const openDreamCompanies = filteredCompanies.filter((c) => c.category === "open dream");

  const dreamSlice = dreamCompanies.slice(
    (dreamPage - 1) * companiesPerPage,
    dreamPage * companiesPerPage
  );
  const openDreamSlice = openDreamCompanies.slice(
    (openDreamPage - 1) * companiesPerPage,
    openDreamPage * companiesPerPage
  );

  const renderTierPagination = (totalItems, page, setPage) => {
    const totalPages = Math.ceil(totalItems / companiesPerPage);
    if (totalItems <= companiesPerPage) return null;
    return (
      <div className="pagination flex items-center justify-center gap-1 sm:gap-2 mt-4 sm:mt-6 flex-wrap px-2">
        <button
          type="button"
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
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
                onClick={() => setPage(pageNum)}
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
          onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
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
  };

  // Year selection view (hub only, not ?tier= and not /category)
  if (
    selectedYear === null &&
    location.pathname === PATH_COMPANY_STATS &&
    !isPlacementTierParam(tierQuery)
  ) {
    return (
      <div className="p-6 sm:p-8 min-h-screen bg-theme-app">
        <div className="max-w-7xl mx-auto">
          {/* Year Selection Cards */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-theme-primary mb-4">Select Year</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[2024, 2025, 2026].map((year) => {
              const requiresAuth = year === 2024 || year === 2025;
              const isDisabled = requiresAuth && !user;
              
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
                  className={`rounded-xl shadow-lg p-6 sm:p-8 transition-all duration-300 border-2 bg-theme-card ${
                    isDisabled
                      ? "opacity-50 cursor-not-allowed border-theme"
                      : "hover:shadow-2xl hover:scale-105 border-theme hover:border-theme-accent"
                  }`}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className={`rounded-full p-4 sm:p-5 mb-4 ${
                      isDisabled ? "bg-gray-700" : "bg-blue-900"
                    }`}>
                      <FaCalendarAlt className={`text-3xl sm:text-4xl ${
                        isDisabled ? "text-gray-500" : "text-blue-300"
                      }`} />
                    </div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-theme-primary mb-2">
                      {year} Stats
                    </h2>
                    <p className="text-theme-secondary text-sm sm:text-base">
                      {year === 2026 ? "View Company Cards" : "View Statistics Table"}
                    </p>
                    {isDisabled && (
                      <p className="text-red-500 text-xs mt-2 font-medium">
                        Login Required
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

  // 2026: choose Dream vs Open dream (two cards) — /category only
  if (
    selectedYear === 2026 &&
    placementTier === null &&
    location.pathname === PATH_COMPANY_CATEGORY
  ) {
    const dreamLogoPreview = dreamCompanies.slice(0, 5);
    const openDreamLogoPreview = openDreamCompanies.slice(0, 5);

    return (
      <div className="p-6 sm:p-8 min-h-screen bg-theme-app">
        <div className="max-w-7xl mx-auto">
          <button
            type="button"
            onClick={() => {
              setCompanies([]);
              setSearch("");
              setCategory("all");
              setCluster("all");
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
            <p className="text-theme-secondary text-sm sm:text-base max-w-2xl">
              Choose Dream or Open dream to browse company cards for 2026.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
            <button
              type="button"
              onClick={() => navigate(companystatsTierListUrl(PLACEMENT_TIER_DREAM))}
              className="rounded-xl shadow-lg p-6 sm:p-8 transition-all duration-300 border-2 bg-theme-card border-theme hover:border-theme-accent hover:shadow-2xl hover:scale-[1.02] text-left"
            >
              <div className="flex flex-col h-full">

                <h3 className="text-xl sm:text-2xl font-bold text-theme-primary mb-3 flex-shrink-0">
                  Dream companies
                </h3>
                <div className="flex-1 flex items-center justify-center mb-4 min-h-[140px]">
                  <AnimatedLogoGrid
                    companies={dreamCompanies}
                    gridSize={5}
                    interval={3500}
                  />
                </div>
                <div className="flex items-center justify-between text-theme-primary font-medium mt-auto pt-1 border-t border-theme">
                  <span className="text-sm sm:text-base">{dreamCompanies.length} companies</span>
                  <FaChevronRight className="text-theme-muted shrink-0" aria-hidden />
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => navigate(companystatsTierListUrl(PLACEMENT_TIER_OPEN_DREAM))}
              className="rounded-xl shadow-lg p-6 sm:p-8 transition-all duration-300 border-2 bg-theme-card border-theme hover:border-theme-accent hover:shadow-2xl hover:scale-[1.02] text-left"
            >
              <div className="flex flex-col h-full">

                <h3 className="text-xl sm:text-2xl font-bold text-theme-primary mb-3 flex-shrink-0">
                  Open dream companies
                </h3>
                <div className="flex-1 flex items-center justify-center mb-4 min-h-[140px]">
                  <AnimatedLogoGrid
                    companies={openDreamCompanies}
                    gridSize={5}
                    interval={2800}
                  />
                </div>
                <div className="flex items-center justify-between text-theme-primary font-medium mt-auto pt-1 border-t border-theme">
                  <span className="text-sm sm:text-base">{openDreamCompanies.length} companies</span>
                  <FaChevronRight className="text-theme-muted shrink-0" aria-hidden />
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Company cards list: /companystats?tier=dream|open_dream
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

  const tierListSlice =
    placementTier === PLACEMENT_TIER_DREAM ? dreamSlice : openDreamSlice;
  const tierListPool =
    placementTier === PLACEMENT_TIER_DREAM ? dreamCompanies : openDreamCompanies;
  const tierListPage =
    placementTier === PLACEMENT_TIER_DREAM ? dreamPage : openDreamPage;
  const setTierListPage =
    placementTier === PLACEMENT_TIER_DREAM ? setDreamPage : setOpenDreamPage;

  return (
    <div className="page-container p-4 sm:p-6 min-h-screen relative bg-theme-app w-full max-w-full min-w-0">
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
          {/* Cluster Filter Dropdown */}
          <div className="relative w-full sm:w-auto" ref={clusterFilterRef}>
            <button
              onClick={() => setShowClusterFilter(!showClusterFilter)}
              className="filter-dropdown w-full sm:w-auto px-4 py-2 sm:py-3 border border-theme-input rounded-xl shadow-sm bg-theme-input hover:bg-theme-card-hover focus:outline-none focus:ring-2 focus:ring-theme-accent transition duration-200 text-sm sm:text-base text-theme-primary font-medium min-w-[200px] sm:min-w-[250px] flex items-center justify-between"
            >
              <span>
                {cluster === "all" 
                  ? "All Clusters" 
                  : cluster === "Computer Science and Engineering"
                  ? "CSE"
                  : cluster === "Electronics and Communication"
                  ? "ECE"
                  : cluster === "Mechanical Engineering"
                  ? "ME"
                  : cluster}
              </span>
              <svg
                className={`w-4 h-4 ml-2 transition-transform ${showClusterFilter ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showClusterFilter && (
              <div className="absolute right-0 mt-2 bg-theme-card border border-theme rounded-lg shadow-lg py-2 w-full min-w-[200px] sm:min-w-[250px] z-50">
                <button
                  onClick={() => {
                    setCluster("all");
                    setShowClusterFilter(false);
                    resetListPages();
                  }}
                  className={`w-full px-4 py-2 text-left hover:bg-theme-nav text-theme-secondary ${
                    cluster === "all" ? "font-semibold nav-active-theme text-theme-primary" : ""
                  }`}
                >
                  All Clusters
                </button>
                <button
                  onClick={() => {
                    setCluster("Computer Science and Engineering");
                    setShowClusterFilter(false);
                    resetListPages();
                  }}
                  className={`w-full px-4 py-2 text-left hover:bg-theme-nav text-theme-secondary ${
                    cluster === "Computer Science and Engineering" ? "font-semibold nav-active-theme text-theme-primary" : ""
                  }`}
                >
                  Computer Science and Engineering
                </button>
                <button
                  onClick={() => {
                    setCluster("Electronics and Communication");
                    setShowClusterFilter(false);
                    resetListPages();
                  }}
                  className={`w-full px-4 py-2 text-left hover:bg-theme-nav text-theme-secondary ${
                    cluster === "Electronics and Communication" ? "font-semibold nav-active-theme text-theme-primary" : ""
                  }`}
                >
                  Electronics and Communication
                </button>
                <button
                  onClick={() => {
                    setCluster("Mechanical Engineering");
                    setShowClusterFilter(false);
                    resetListPages();
                  }}
                  className={`w-full px-4 py-2 text-left hover:bg-theme-nav text-theme-secondary ${
                    cluster === "Mechanical Engineering" ? "font-semibold nav-active-theme text-theme-primary" : ""
                  }`}
                >
                  Mechanical Engineering
                </button>
              </div>
            )}
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
                onStatsUpdated={() => companyAPI.getAllCompanies().then((res) => setCompanies(res.data))}
              />
            ))
          ) : (
            <p className="text-theme-muted col-span-full text-center py-8">
              {cluster !== "all"
                ? "No companies match this cluster and search."
                : "No companies match your search or filters."}
            </p>
          )}
        </div>
        {renderTierPagination(tierListPool.length, tierListPage, setTierListPage)}
      </section>

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
                setCategory("only internship(6 months)");
                setShowFilter(false);
                resetListPages();
              }}
              className={`px-4 py-2 text-left hover:bg-theme-nav text-theme-secondary ${
                category === "only internship(6 months)" ? "font-semibold nav-active-theme text-theme-primary" : ""
              }`}
            >
              Only Internship
            </button>
            <button
              onClick={() => {
                setCategory("ppo");
                setShowFilter(false);
                resetListPages();
              }}
              className={`px-4 py-2 text-left hover:bg-theme-nav text-theme-secondary ${
                category === "ppo" ? "font-semibold nav-active-theme text-theme-primary" : ""
              }`}
            >
              PPO
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
    </div>
  );
}

export default CompanyStats;
