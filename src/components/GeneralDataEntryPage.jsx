import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { FaChevronRight } from "react-icons/fa";
import { companyAPI } from "../utils/api";
import { GENERAL_BASE } from "../constants/tenant.js";
import GeneralResearchPanel from "./GeneralResearchPanel.jsx";
import AnimatedLogoGrid from "./AnimatedLogoGrid";
import { CategoryTilesGridShimmer } from "./StatsLoadingShimmer";
import {
  PageBackButton,
  PageBackNavRow,
  PageHeroFontStyles,
  PageHeroHeader,
  pageShellInnerClass,
  pageShellOuterClassCompact,
} from "./PageBackNav.jsx";
import {
  GENERAL_COMPANY_CATEGORIES,
  groupCompaniesByGeneralCategory,
  parseGeneralCompanyCategoryParam,
} from "../utils/generalCompanyCategory.js";
import {
  companyHasPlatformPrepContent,
  summarizeCategoryPrepProgress,
} from "../utils/platformPrepCatalogProgress.js";

const inputClass =
  "w-full rounded-xl border-2 border-theme bg-theme-input px-3 py-2 text-sm text-theme-primary";

const CATEGORY_TILE_LOGO_GRID = 4;
const STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: "added", label: "Added" },
  { id: "remaining", label: "Remaining" },
];

function prepProgressLabel({ added, remaining }) {
  const addedLabel = added === 1 ? "1 added" : `${added} added`;
  const remainingLabel = remaining === 1 ? "1 remaining" : `${remaining} remaining`;
  return `${addedLabel} · ${remainingLabel}`;
}

export default function GeneralDataEntryPage() {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [companies, setCompanies] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [listError, setListError] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [detailError, setDetailError] = useState("");
  const [loadingDetail, setLoadingDetail] = useState(false);

  const selectedCategory = parseGeneralCompanyCategoryParam(searchParams.get("category"));
  const selectedCategoryMeta = GENERAL_COMPANY_CATEGORIES.find(
    (category) => category.id === selectedCategory
  );

  useEffect(() => {
    let cancelled = false;
    setListLoading(true);
    (async () => {
      try {
        const res = await companyAPI.getPlatformPrepCatalog();
        if (cancelled) return;
        setCompanies(Array.isArray(res.data) ? res.data : []);
        setListError("");
      } catch (err) {
        if (!cancelled) {
          setCompanies([]);
          setListError(err?.response?.data?.error || "Could not load companies.");
        }
      } finally {
        if (!cancelled) setListLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setSearch("");
    setStatusFilter("all");
  }, [selectedCategory]);

  useEffect(() => {
    if (!companyId) {
      setCompanyName("");
      setDetailError("");
      return undefined;
    }
    let cancelled = false;
    setLoadingDetail(true);
    (async () => {
      try {
        const res = await companyAPI.getPlatformContent(companyId);
        if (cancelled) return;
        setCompanyName(String(res.data?.name || "").trim());
        setDetailError("");
      } catch (err) {
        if (!cancelled) {
          setCompanyName("");
          setDetailError(err?.response?.data?.error || "Could not load company.");
        }
      } finally {
        if (!cancelled) setLoadingDetail(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  const groupedCompanies = useMemo(
    () => groupCompaniesByGeneralCategory(companies),
    [companies]
  );
  const overallProgress = useMemo(
    () => summarizeCategoryPrepProgress(companies),
    [companies]
  );

  const categoryCompanies = selectedCategory
    ? groupedCompanies[selectedCategory] || []
    : [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return categoryCompanies.filter((row) => {
      if (q && !String(row.name || "").toLowerCase().includes(q)) return false;
      const added = companyHasPlatformPrepContent(row);
      if (statusFilter === "added") return added;
      if (statusFilter === "remaining") return !added;
      return true;
    });
  }, [categoryCompanies, search, statusFilter]);

  const resolvedName =
    companyName ||
    companies.find((row) => String(row._id) === String(companyId))?.name ||
    "";

  const listPath = selectedCategory
    ? `${GENERAL_BASE}/data-entry?category=${selectedCategory}`
    : `${GENERAL_BASE}/data-entry`;

  const openCategory = (categoryId) => {
    setSearchParams({ category: categoryId });
  };

  if (companyId) {
    return (
      <div className={`min-h-screen ${pageShellOuterClassCompact}`}>
        <PageHeroFontStyles />
        <div className={pageShellInnerClass}>
          <PageBackNavRow>
            <PageBackButton onClick={() => navigate(listPath)} label="Back" />
          </PageBackNavRow>
          <PageHeroHeader>{resolvedName || "Company content"}</PageHeroHeader>

          {loadingDetail ? (
            <p className="text-center text-sm text-theme-secondary">Loading…</p>
          ) : null}
          {detailError ? (
            <p className="mb-4 text-center text-sm text-red-500">{detailError}</p>
          ) : null}

          {!loadingDetail && !detailError ? (
            <GeneralResearchPanel key={companyId} companyId={companyId} companyName={resolvedName} />
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${pageShellOuterClassCompact}`}>
      <PageHeroFontStyles />
      <div className={pageShellInnerClass}>
        <PageBackNavRow>
          <PageBackButton
            onClick={() =>
              selectedCategory
                ? setSearchParams({})
                : navigate(`${GENERAL_BASE}/admin/dashboard`)
            }
            label={selectedCategory ? "Back to categories" : "Back to platform admin"}
          />
        </PageBackNavRow>
        <PageHeroHeader
          subtitle={
            selectedCategory
              ? selectedCategoryMeta?.subtitle
              : "Grouped the same way as Student Corner. Added means the research pipeline has published prep content for that company."
          }
        >
          {selectedCategory ? selectedCategoryMeta?.label || "Companies" : "Data entry"}
        </PageHeroHeader>

        {listError ? (
          <p className="mb-4 text-center text-sm text-red-500">{listError}</p>
        ) : null}

        {!selectedCategory ? (
          <>
            {!listLoading && !listError && companies.length > 0 ? (
              <p className="mx-auto mb-5 max-w-6xl text-center text-sm text-theme-secondary">
                {prepProgressLabel(overallProgress)} across {overallProgress.total}{" "}
                {overallProgress.total === 1 ? "company" : "companies"}
              </p>
            ) : null}
            {listLoading ? (
              <CategoryTilesGridShimmer count={GENERAL_COMPANY_CATEGORIES.length} />
            ) : (
              <div className="mx-auto grid min-w-0 w-full max-w-6xl auto-rows-fr grid-cols-1 items-stretch gap-3 sm:grid-cols-2 sm:gap-5 md:gap-6 lg:grid-cols-3">
                {GENERAL_COMPANY_CATEGORIES.map((category) => {
                  const list = groupedCompanies[category.id] || [];
                  const progress = summarizeCategoryPrepProgress(list);
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
                        <div className="mt-auto border-t border-theme pt-2 font-medium text-theme-primary">
                          <div className="flex items-center justify-between">
                            <span className="text-sm sm:text-base">
                              {list.length} {list.length === 1 ? "company" : "companies"}
                            </span>
                            <FaChevronRight className="shrink-0 text-theme-muted" aria-hidden />
                          </div>
                          {list.length > 0 ? (
                            <p className="mt-1 text-xs font-normal text-theme-secondary sm:text-sm">
                              {prepProgressLabel(progress)}
                            </p>
                          ) : null}
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
            <div className="mx-auto mb-4 flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center">
              <input
                className={inputClass}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search companies"
                aria-label="Search companies"
              />
              <div
                className="flex shrink-0 rounded-xl border border-theme bg-theme-card p-1"
                role="group"
                aria-label="Filter by prep content"
              >
                {STATUS_FILTERS.map((filter) => {
                  const active = statusFilter === filter.id;
                  return (
                    <button
                      key={filter.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setStatusFilter(filter.id)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium sm:text-sm ${
                        active
                          ? "bg-theme-hero text-theme-primary"
                          : "text-theme-secondary hover:text-theme-primary"
                      }`}
                    >
                      {filter.label}
                    </button>
                  );
                })}
              </div>
            </div>
            {!listLoading ? (
              <p className="mx-auto mb-3 max-w-3xl text-sm text-theme-secondary">
                {prepProgressLabel(summarizeCategoryPrepProgress(categoryCompanies))}
              </p>
            ) : null}

            <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-theme bg-theme-card">
              {listLoading ? (
                <p className="px-4 py-6 text-center text-sm text-theme-secondary">Loading…</p>
              ) : null}
              {filtered.map((row) => {
                const added = companyHasPlatformPrepContent(row);
                return (
                  <button
                    key={row._id}
                    type="button"
                    onClick={() =>
                      navigate(`${GENERAL_BASE}/data-entry/${row._id}?category=${selectedCategory}`)
                    }
                    className="flex w-full items-center justify-between gap-3 border-b border-theme px-4 py-3 text-left last:border-b-0 hover:bg-theme-hero/50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-theme-primary">
                        {row.name}
                      </span>
                      <span className="mt-0.5 block text-xs text-theme-muted">
                        {added
                          ? "Research pipeline published"
                          : "Research pipeline not published"}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                          added
                            ? "bg-emerald-500/15 text-emerald-600"
                            : "bg-amber-500/15 text-amber-600"
                        }`}
                      >
                        {added ? "Added" : "Remaining"}
                      </span>
                      <FaChevronRight className="h-3.5 w-3.5 shrink-0 text-theme-muted" />
                    </span>
                  </button>
                );
              })}
              {!listLoading && !filtered.length ? (
                <p className="px-4 py-6 text-center text-sm text-theme-secondary">
                  {search.trim() || statusFilter !== "all"
                    ? "No companies match that filter."
                    : "No companies in this category yet."}
                </p>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
