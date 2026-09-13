import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaChevronRight, FaSearch } from "react-icons/fa";
import CompanyCard from "./CompanyCard";
import AnimatedLogoGrid from "./AnimatedLogoGrid";
import {
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
import { useTenantShell } from "../context/TenantShellContext.jsx";
import {
  GENERAL_COMPANY_CATEGORIES,
  groupCompaniesByGeneralCategory,
  parseGeneralCompanyCategoryParam,
} from "../utils/generalCompanyCategory.js";

const COMPANIES_PER_PAGE = 9;
const CATEGORY_TILE_LOGO_GRID = 4;

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

export default function GeneralCompanyList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { base } = useTenantShell();
  const { user } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [fetchDone, setFetchDone] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [helpfulStatusByCompanyId, setHelpfulStatusByCompanyId] = useState({});
  const [teaserCompanyIds, setTeaserCompanyIds] = useState({});
  const [cardAccess, setCardAccess] = useState({ allCards: false, categories: {} });

  const selectedCategory = parseGeneralCompanyCategoryParam(searchParams.get("category"));
  const selectedCategoryMeta = GENERAL_COMPANY_CATEGORIES.find(
    (category) => category.id === selectedCategory
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
    (async () => {
      try {
        const res = await companyAPI.getAllCompanies();
        if (cancelled) return;
        setCompanies(sortCompaniesByName(uniqueCompaniesById(res.data || [])));
      } catch (err) {
        console.error("Error fetching companies:", err);
        if (!cancelled) setCompanies([]);
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

  const categoryCompanies = selectedCategory
    ? groupedCompanies[selectedCategory] || []
    : companies;

  const filteredCompanies = useMemo(() => {
    const q = String(search || "").trim().toLowerCase();
    if (!q) return categoryCompanies;
    return categoryCompanies.filter((company) =>
      String(company?.name || "").toLowerCase().includes(q)
    );
  }, [categoryCompanies, search]);

  const totalPages = Math.max(1, Math.ceil(filteredCompanies.length / COMPANIES_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageSlice = filteredCompanies.slice(
    (safePage - 1) * COMPANIES_PER_PAGE,
    safePage * COMPANIES_PER_PAGE
  );

  useEffect(() => {
    setPage(1);
    setSearch("");
  }, [selectedCategory]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const visibleIds = pageSlice.map((c) => c?._id).filter(Boolean);
  const visibleIdsKey = visibleIds.join("|");

  useEffect(() => {
    let cancelled = false;
    if (!user || !selectedCategory || visibleIds.length === 0) {
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
  }, [user?.userId, selectedCategory, visibleIdsKey]);

  const openCategory = (categoryId) => {
    setSearchParams({ category: categoryId });
  };

  const backToCategories = () => {
    setSearchParams({});
  };

  const scrollToListTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className={`min-h-screen overflow-x-hidden ${pageShellOuterClass}`}>
      <PageHeroFontStyles />
      <div className={pageShellInnerClass}>
        <PageBackNavRow>
          <PageBackButton
            onClick={() => (selectedCategory ? backToCategories() : navigate(base))}
            label={selectedCategory ? "Back to categories" : "Back"}
          />
        </PageBackNavRow>
        <div className="mx-auto w-full max-w-6xl min-w-0">
          {!selectedCategory ? (
            <>
              <PageHeroHeader subtitle="Grouped by each company’s business model. Pick a category to browse company cards.">
                Company <em style={{ color: "#818CF8", fontStyle: "italic" }}>Stats</em>
              </PageHeroHeader>
              {!fetchDone ? (
                <CategoryTilesGridShimmer count={GENERAL_COMPANY_CATEGORIES.length} />
              ) : (
                <div className="mx-auto grid min-w-0 w-full max-w-6xl auto-rows-fr grid-cols-1 items-stretch gap-3 sm:grid-cols-2 sm:gap-5 md:gap-6 lg:grid-cols-3">
                  {GENERAL_COMPANY_CATEGORIES.map((category) => {
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
                                pixelSize={72}
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
                </div>
              )}
            </>
          ) : (
            <>
              <PageHeroHeader subtitle={selectedCategoryMeta?.subtitle}>
                {selectedCategoryMeta?.label || "Companies"}
              </PageHeroHeader>

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

              <div className="company-grid grid w-full min-w-0 max-w-full auto-rows-fr grid-cols-1 items-stretch gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
                {!fetchDone ? (
                  <CompanyCardGridShimmer count={COMPANIES_PER_PAGE} />
                ) : pageSlice.length > 0 ? (
                  pageSlice.map((company) => (
                    <CompanyCard
                      key={company._id}
                      company={company}
                      helpfulStatus={helpfulStatusByCompanyId[company._id]}
                      isAdmin={false}
                      hidePlacementGotInCounts
                      isTeaser={
                        String(teaserCompanyIds[selectedCategory] || "") ===
                        String(company._id)
                      }
                      detailLocked={
                        !cardAccess.allCards &&
                        !cardAccess.categories?.[selectedCategory] &&
                        String(teaserCompanyIds[selectedCategory] || "") !==
                          String(company._id)
                      }
                    />
                  ))
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
                <div className="pagination relative z-10 mt-6 mb-2 flex flex-wrap items-center justify-center gap-1 px-2 py-2 sm:mt-8 sm:gap-2">
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
          )}
        </div>
      </div>
    </div>
  );
}
