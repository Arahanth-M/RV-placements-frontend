import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaChevronRight, FaSearch } from "react-icons/fa";
import CompanyCard from "./CompanyCard";
import AnimatedLogoGrid from "./AnimatedLogoGrid";
import {
  CategoryTileShimmer,
  CategoryTilesGridShimmer,
  CompanyCardGridShimmer,
} from "./StatsLoadingShimmer";
import {
  PageBackButton,
  PageBackNavRow,
  PageHeroFontStyles,
  PageHeroHeader,
  pageShellInnerClass,
  pageShellOuterClass,
} from "./PageBackNav.jsx";
import { companyAPI, billingAPI } from "../utils/api";
import { useAuth } from "../utils/AuthContext";
import { isPlatformAdminUser } from "../utils/collegeScope.js";
import { useTenantShell } from "../context/TenantShellContext.jsx";
import {
  GENERAL_COMPANY_CATEGORIES,
  groupCompaniesByGeneralCategory,
  isGeneralCompanyCardDetailLocked,
  locateGeneralCompanyCard,
  parseGeneralCompanyCategoryParam,
} from "../utils/generalCompanyCategory.js";
import { scrollFocusNode } from "../utils/prepPathCompanyFocus.js";
import {
  COMPANY_LIST_SEARCH_PARAM,
  parseCompanyListPageParam,
  setCompanyListPageParam,
  setCompanyListSearchParam,
} from "../utils/companyListUrlState.js";
import {
  readGeneralCompanyList,
  writeGeneralCompanyList,
} from "../utils/generalCompanyListCache.js";
import { peekCompanyLogo, requestCompanyLogo } from "../utils/companyLogoBatch.js";
import {
  LIST_LOGO_PIXEL_SIZE,
  resolveCompanyLogoTarget,
} from "../utils/companyLogoSrc.js";

/** Jump to top of the document (and common scroll roots). Instant — smooth scroll loses to focus restore. */
function scrollWindowToTop() {
  if (typeof window === "undefined") return;
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  document.querySelectorAll("main, [data-tour-scroll-root]").forEach((node) => {
    if (node instanceof HTMLElement) {
      node.scrollTop = 0;
      node.scrollLeft = 0;
    }
  });
}

const COMPANIES_PER_PAGE = 9;
const CATEGORY_TILE_LOGO_GRID = 4;
/** Reveal 2 tiles per tick so each flush fills one BATCH_CHUNK of 8 logos. */
const CATEGORY_REVEAL_STEP = 2;
/** Gap between reveal steps — next batch is prefetched during this window. */
const CATEGORY_REVEAL_MS = 450;

function prefetchCategoryTileLogos(companies) {
  for (const company of (Array.isArray(companies) ? companies : []).slice(
    0,
    CATEGORY_TILE_LOGO_GRID
  )) {
    const target = resolveCompanyLogoTarget(company, LIST_LOGO_PIXEL_SIZE);
    if (!target.domain || peekCompanyLogo(target.cacheKey)) continue;
    void requestCompanyLogo(target);
  }
}

function uniqueCompaniesById(list) {
  const seen = new Set();
  const out = [];
  for (const company of Array.isArray(list) ? list : []) {
    const id = company?._id != null ? String(company._id) : "";
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(company);
  }
  return out;
}

function sortCompaniesByName(list) {
  return [...list].sort((a, b) =>
    String(a?.name || "").localeCompare(String(b?.name || ""), undefined, {
      sensitivity: "base",
    })
  );
}

/** Cards only read prepRoleKey. Drop link snippets before holding the list in memory. */
function slimCompanyForGeneralList(company) {
  if (!company || typeof company !== "object" || !Array.isArray(company.researchSources)) {
    return company;
  }
  return {
    ...company,
    researchSources: company.researchSources.map((source) => ({
      prepRoleKey: String(source?.prepRoleKey ?? ""),
    })),
  };
}

export default function GeneralCompanyList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { base, homePath } = useTenantShell();
  const { user } = useAuth();
  const isPlatformAdmin = isPlatformAdminUser(user);
  const [companies, setCompanies] = useState(() => readGeneralCompanyList() || []);
  const [fetchDone, setFetchDone] = useState(() => Boolean(readGeneralCompanyList()));
  const [visibleCategoryCount, setVisibleCategoryCount] = useState(0);
  const [helpfulStatusByCompanyId, setHelpfulStatusByCompanyId] = useState({});
  const [teaserCompanyIds, setTeaserCompanyIds] = useState({});
  const [cardAccess, setCardAccess] = useState({ allCards: false, categories: {} });

  const selectedCategory = parseGeneralCompanyCategoryParam(searchParams.get("category"));
  const focusCardId = String(searchParams.get("card") || "").trim();
  const appliedCardRef = useRef("");
  const selectedCategoryMeta = GENERAL_COMPANY_CATEGORIES.find(
    (category) => category.id === selectedCategory
  );
  const search = searchParams.get(COMPANY_LIST_SEARCH_PARAM) || "";
  const page = parseCompanyListPageParam(searchParams.get("page"));
  const hubSearchActive = !selectedCategory && Boolean(String(search).trim());
  const showCompanyResults = Boolean(selectedCategory) || hubSearchActive;

  const updateListParams = useCallback(
    (mutate) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (selectedCategory && !next.get("category")) {
            next.set("category", selectedCategory);
          }
          mutate(next);
          return next;
        },
        { replace: true }
      );
    },
    [selectedCategory, setSearchParams]
  );

  const setSearch = useCallback(
    (value) => {
      updateListParams((params) => {
        setCompanyListSearchParam(params, value);
        setCompanyListPageParam(params, 1);
      });
    },
    [updateListParams]
  );

  const setPage = useCallback(
    (updater) => {
      updateListParams((params) => {
        const current = parseCompanyListPageParam(params.get("page"));
        const nextPage =
          typeof updater === "function" ? updater(current) : updater;
        setCompanyListPageParam(params, nextPage);
      });
    },
    [updateListParams]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await billingAPI.getAccess();
        if (cancelled) return;
        setTeaserCompanyIds(res.data?.teaserCompanyIds || {});
        setCardAccess({
          allCards: Boolean(res.data?.summary?.allCards),
          categories: res.data?.summary?.categories || {},
        });
      } catch {
        if (!cancelled) {
          setTeaserCompanyIds({});
          setCardAccess({ allCards: false, categories: {} });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.userId]);

  useEffect(() => {
    let cancelled = false;
    const hadCache = Boolean(readGeneralCompanyList());
    (async () => {
      try {
        const res = await companyAPI.getAllCompanies();
        if (cancelled) return;
        const next = sortCompaniesByName(
          uniqueCompaniesById(res.data || []).map(slimCompanyForGeneralList)
        );
        writeGeneralCompanyList(next);
        setCompanies(next);
      } catch (err) {
        console.error("Error fetching companies:", err);
        if (!cancelled && !hadCache) setCompanies([]);
      } finally {
        if (!cancelled) setFetchDone(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const groupedCompanies = useMemo(
    () => groupCompaniesByGeneralCategory(companies),
    [companies]
  );

  // Reveal two category tiles per tick (8 logos ≈ one batch chunk).
  useEffect(() => {
    if (!fetchDone || selectedCategory || hubSearchActive) {
      return undefined;
    }
    const total = GENERAL_COMPANY_CATEGORIES.length;
    const initial = Math.min(CATEGORY_REVEAL_STEP, total);
    setVisibleCategoryCount(initial);
    if (initial >= total) return undefined;

    let shown = initial;
    const timer = window.setInterval(() => {
      shown = Math.min(total, shown + CATEGORY_REVEAL_STEP);
      setVisibleCategoryCount(shown);
      if (shown >= total) window.clearInterval(timer);
    }, CATEGORY_REVEAL_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [fetchDone, selectedCategory, hubSearchActive]);

  // Prefetch the next reveal step's logos during the stagger gap.
  useEffect(() => {
    if (!fetchDone || selectedCategory || hubSearchActive || visibleCategoryCount <= 0) {
      return;
    }
    const nextStart = visibleCategoryCount;
    const nextEnd = Math.min(
      GENERAL_COMPANY_CATEGORIES.length,
      visibleCategoryCount + CATEGORY_REVEAL_STEP
    );
    for (let i = nextStart; i < nextEnd; i += 1) {
      const category = GENERAL_COMPANY_CATEGORIES[i];
      prefetchCategoryTileLogos(groupedCompanies[category.id] || []);
    }
  }, [
    fetchDone,
    selectedCategory,
    hubSearchActive,
    visibleCategoryCount,
    groupedCompanies,
  ]);

  const revealedCategories = useMemo(
    () => GENERAL_COMPANY_CATEGORIES.slice(0, Math.max(0, visibleCategoryCount)),
    [visibleCategoryCount]
  );
  const pendingCategories = useMemo(
    () => GENERAL_COMPANY_CATEGORIES.slice(Math.max(0, visibleCategoryCount)),
    [visibleCategoryCount]
  );

  const companyCategoryById = useMemo(() => {
    const map = new Map();
    for (const category of GENERAL_COMPANY_CATEGORIES) {
      for (const company of groupedCompanies[category.id] || []) {
        const id = company?._id != null ? String(company._id) : "";
        if (id) map.set(id, category.id);
      }
    }
    return map;
  }, [groupedCompanies]);

  const categoryLabelById = useMemo(
    () =>
      Object.fromEntries(
        GENERAL_COMPANY_CATEGORIES.map((category) => [category.id, category.label])
      ),
    []
  );

  const categoryCompanies = selectedCategory
    ? groupedCompanies[selectedCategory] || []
    : companies;
  const firstCategoryCompanyId = selectedCategory
    ? categoryCompanies[0]?._id
    : "";

  const filteredCompanies = useMemo(() => {
    const q = String(search || "").trim().toLowerCase();
    if (!q) return selectedCategory ? categoryCompanies : [];
    return categoryCompanies.filter((company) =>
      String(company?.name || "").toLowerCase().includes(q)
    );
  }, [categoryCompanies, search, selectedCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredCompanies.length / COMPANIES_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageSlice = filteredCompanies.slice(
    (safePage - 1) * COMPANIES_PER_PAGE,
    safePage * COMPANIES_PER_PAGE
  );

  const visibleIds = pageSlice.map((c) => c?._id).filter(Boolean);
  const visibleIdsKey = visibleIds.join("|");

  useEffect(() => {
    let cancelled = false;
    if (!user || !showCompanyResults || visibleIds.length === 0) {
      setHelpfulStatusByCompanyId({});
      return () => {
        cancelled = true;
      };
    }
    (async () => {
      try {
        const response = await companyAPI.getHelpfulStatusBatch(visibleIds);
        if (!cancelled) {
          setHelpfulStatusByCompanyId(response.data?.statuses || {});
        }
      } catch {
        if (!cancelled) setHelpfulStatusByCompanyId({});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.userId, showCompanyResults, visibleIdsKey]);

  useEffect(() => {
    if (!fetchDone || !focusCardId) return;
    if (appliedCardRef.current === focusCardId) return;
    const located = locateGeneralCompanyCard(
      companies,
      focusCardId,
      COMPANIES_PER_PAGE
    );
    if (!located) return;
    const onCard =
      selectedCategory === located.category &&
      page === located.page &&
      !String(search || "").trim();
    if (!onCard) {
      const next = new URLSearchParams();
      next.set("category", located.category);
      if (located.page > 1) next.set("page", String(located.page));
      next.set("card", focusCardId);
      setSearchParams(next, { replace: true });
      return;
    }
    appliedCardRef.current = focusCardId;
    scrollFocusNode(document.getElementById(`company-card-${focusCardId}`));
  }, [
    companies,
    fetchDone,
    focusCardId,
    page,
    search,
    selectedCategory,
    setSearchParams,
  ]);

  // Category / pagination keep the same pathname, so App ScrollToTop does not run.
  // Deep-links with ?card= handle their own scroll-into-view.
  useLayoutEffect(() => {
    if (focusCardId) return;
    scrollWindowToTop();
  }, [selectedCategory, page, focusCardId]);

  const openCategory = (categoryId) => {
    setSearchParams({ category: categoryId });
    scrollWindowToTop();
  };

  const backToCategories = () => {
    setSearchParams({});
    scrollWindowToTop();
  };

  const clearHubSearch = () => {
    setSearchParams({});
    scrollWindowToTop();
  };

  const scrollToListTop = () => {
    scrollWindowToTop();
  };

  const resolveCardCategory = (companyId) => {
    if (selectedCategory) return selectedCategory;
    return companyCategoryById.get(String(companyId || "")) || "";
  };

  const searchBar = (
    <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search companies..."
        className="search-bar w-full flex-1 rounded-xl border border-theme-input bg-theme-input px-4 py-2 text-sm text-theme-primary shadow-sm placeholder-theme-muted transition duration-200 focus:outline-none focus:ring-2 focus:ring-theme-accent sm:py-3 sm:text-base"
      />
      <button
        type="button"
        className="inline-flex items-center justify-center gap-1 rounded-xl border border-theme bg-theme-card px-3 py-2 text-sm text-theme-secondary hover:bg-theme-nav"
        aria-label="Search companies"
      >
        <FaSearch className="h-4 w-4" aria-hidden />
        <span className="hidden sm:inline">Search</span>
      </button>
    </div>
  );

  const companyResults = (
    <>
      <div className="company-grid grid w-full min-w-0 max-w-full auto-rows-auto grid-cols-1 items-stretch gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
        {!fetchDone ? (
          <CompanyCardGridShimmer count={COMPANIES_PER_PAGE} />
        ) : pageSlice.length > 0 ? (
          pageSlice.map((company) => {
            const cardCategory = resolveCardCategory(company._id);
            const firstInCategoryId = selectedCategory
              ? firstCategoryCompanyId
              : (groupedCompanies[cardCategory] || [])[0]?._id;
            return (
              <div key={company._id} className="flex h-full min-h-min flex-col gap-1.5">
                {hubSearchActive && categoryLabelById[cardCategory] ? (
                  <p className="px-0.5 text-xs font-medium uppercase tracking-wide text-theme-muted">
                    {categoryLabelById[cardCategory]}
                  </p>
                ) : null}
                <div className="flex min-h-min flex-1 flex-col">
                  <CompanyCard
                    company={company}
                    highlighted={focusCardId !== "" && String(company._id) === focusCardId}
                    helpfulStatus={helpfulStatusByCompanyId[company._id]}
                    isAdmin={false}
                    hidePlacementGotInCounts
                    boostZeroPrepCounts={
                      !isPlatformAdmin &&
                      String(company._id) !== String(firstInCategoryId || "")
                    }
                    isTeaser={
                      String(teaserCompanyIds[cardCategory] || "") === String(company._id)
                    }
                    detailLocked={isGeneralCompanyCardDetailLocked({
                      user,
                      cardAccess,
                      selectedCategory: cardCategory,
                      teaserCompanyIds,
                      companyId: company._id,
                    })}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <div
            className="col-span-full flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-theme bg-theme-card/40 px-6 py-12 text-center sm:py-14"
            role="status"
          >
            <p className="text-base text-theme-secondary">
              {search.trim()
                ? "No companies match that search."
                : "No companies in this category yet."}
            </p>
          </div>
        )}
      </div>

      {fetchDone && filteredCompanies.length > COMPANIES_PER_PAGE ? (
        <div className="pagination relative z-10 mt-8 mb-2 flex flex-wrap items-center justify-center gap-1 px-2 py-3 sm:mt-10 sm:gap-2">
          <button
            type="button"
            onClick={() => {
              setPage((prev) => Math.max(prev - 1, 1));
              scrollToListTop();
            }}
            disabled={safePage === 1}
            className="rounded-lg border border-theme bg-theme-card px-3 py-2 text-sm text-theme-secondary transition duration-200 disabled:opacity-50 sm:px-4 sm:text-base"
          >
            Prev
          </button>
          <span className="px-3 text-sm text-theme-muted">
            Page {safePage} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => {
              setPage((prev) => Math.min(prev + 1, totalPages));
              scrollToListTop();
            }}
            disabled={safePage >= totalPages}
            className="rounded-lg border border-theme bg-theme-card px-3 py-2 text-sm text-theme-secondary transition duration-200 disabled:opacity-50 sm:px-4 sm:text-base"
          >
            Next
          </button>
        </div>
      ) : null}
      {fetchDone && filteredCompanies.length > 0 ? (
        <p className="mt-2 text-center text-sm text-theme-muted" aria-live="polite">
          {filteredCompanies.length}{" "}
          {filteredCompanies.length === 1 ? "company" : "companies"}
        </p>
      ) : null}
    </>
  );

  return (
    <div className={`min-h-screen overflow-x-hidden ${pageShellOuterClass}`}>
      <PageHeroFontStyles />
      <div className={pageShellInnerClass}>
        <PageBackNavRow>
          <PageBackButton
            onClick={() => {
              if (selectedCategory) {
                backToCategories();
                return;
              }
              if (hubSearchActive) {
                clearHubSearch();
                return;
              }
              navigate(homePath || base);
            }}
            label={
              selectedCategory || hubSearchActive ? "Back to categories" : "Back"
            }
          />
        </PageBackNavRow>
        <div className="mx-auto w-full max-w-6xl min-w-0">
          {!selectedCategory ? (
            <>
              <PageHeroHeader
                subtitle={
                  hubSearchActive
                    ? "Matching companies across all categories."
                    : "Grouped by each company’s business model. Search by name or pick a category."
                }
              >
                Company <em style={{ color: "#818CF8", fontStyle: "italic" }}>Prep Hub</em>
              </PageHeroHeader>
              {searchBar}
              {hubSearchActive ? (
                companyResults
              ) : !fetchDone ? (
                <CategoryTilesGridShimmer count={GENERAL_COMPANY_CATEGORIES.length} />
              ) : (
                <div
                  className="mx-auto grid min-w-0 w-full max-w-6xl auto-rows-auto grid-cols-1 items-stretch gap-3 sm:grid-cols-2 sm:gap-5 md:gap-6 lg:grid-cols-3"
                  aria-busy={pendingCategories.length > 0 ? "true" : undefined}
                >
                  {revealedCategories.map((category) => {
                    const list = groupedCompanies[category.id] || [];
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => openCategory(category.id)}
                        className="company-card flex h-full min-h-0 w-full min-w-0 flex-col rounded-xl border-2 border-theme bg-theme-card p-4 text-left shadow-lg transition-[box-shadow,border-color] duration-300 hover:border-theme-accent hover:shadow-2xl sm:p-6 lg:p-8"
                      >
                        <div className="flex h-full min-h-0 min-w-0 flex-col">
                          <div className="mb-2 flex-shrink-0 sm:mb-3">
                            <h3 className="text-base font-bold leading-snug text-theme-primary sm:text-xl md:text-2xl">
                              {category.label}
                            </h3>
                            <p className="mt-0.5 text-[11px] leading-snug text-theme-muted sm:mt-1 sm:text-xs">
                              {category.subtitle}
                            </p>
                          </div>
                          <div className="mb-3 flex min-h-[156px] flex-1 items-center justify-center sm:mb-4 sm:min-h-[120px] md:min-h-[140px]">
                            {list.length > 0 ? (
                              <AnimatedLogoGrid
                                companies={list.slice(0, CATEGORY_TILE_LOGO_GRID)}
                                gridSize={CATEGORY_TILE_LOGO_GRID}
                                disableRotation
                                pixelSize={LIST_LOGO_PIXEL_SIZE}
                                loading="eager"
                              />
                            ) : (
                              <p className="text-sm italic text-theme-muted">No companies yet</p>
                            )}
                          </div>
                          <div className="mt-auto flex items-center justify-between border-t border-theme pt-1 font-medium text-theme-primary">
                            <span className="text-sm sm:text-base">
                              {list.length} {list.length === 1 ? "company" : "companies"}
                            </span>
                            <FaChevronRight className="shrink-0 text-theme-muted" aria-hidden />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                  {pendingCategories.map((category) => (
                    <CategoryTileShimmer key={`pending-${category.id}`} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <PageHeroHeader subtitle={selectedCategoryMeta?.subtitle}>
                {selectedCategoryMeta?.label || "Companies"}
              </PageHeroHeader>
              {searchBar}
              {companyResults}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
