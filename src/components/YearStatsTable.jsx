import React, { useState, useMemo, useEffect, useCallback } from "react";
import { FaSearch, FaFilter } from "react-icons/fa";
import { PageBackButton, PageBackNavRow } from "./PageBackNav.jsx";
import Analytics from "./Analytics";
import { DEFAULT_OPEN_DREAM_MIN_LPA } from "../constants/placementTiers.js";
import { TOUR_PREPARE_EVENT } from "../utils/productTourEvents";
import { resolveYearStatsRowCategory } from "../utils/yearStatsCategory.js";
import {
  findYearStatsSerialFieldKeyFromRows,
  sortYearStatsRows,
} from "../utils/yearStatsSort.js";

const PAGE_SIZE = 100;

function YearStatsTable({ year, data, onBack, openDreamMinLpa = DEFAULT_OPEN_DREAM_MIN_LPA }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("Table");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [showFilter, setShowFilter] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const onTourPrepare = (event) => {
      if (event.detail?.stepId === "company-stats-2025-analytics") {
        setActiveTab("Analytics");
      }
    };
    window.addEventListener(TOUR_PREPARE_EVENT, onTourPrepare);
    return () => window.removeEventListener(TOUR_PREPARE_EVENT, onTourPrepare);
  }, []);

  const thresholdLpa =
    Number.isFinite(Number(openDreamMinLpa)) && Number(openDreamMinLpa) >= 0
      ? Number(openDreamMinLpa)
      : DEFAULT_OPEN_DREAM_MIN_LPA;

  const resolveRowCategory = useCallback(
    (row) => resolveYearStatsRowCategory(row, thresholdLpa),
    [thresholdLpa]
  );

  const sortedData = useMemo(() => sortYearStatsRows(data), [data]);

  // Filter data based on search term
  // Search in all fields, but prioritize company name fields
  const branchFieldKey = useMemo(() => {
    if (!sortedData || sortedData.length === 0) return null;
    const keys = new Set();
    sortedData.forEach((row) => {
      Object.keys(row || {}).forEach((key) => keys.add(key));
    });
    return Array.from(keys).find((key) => /branch|program/i.test(key)) || null;
  }, [sortedData]);

  const branchOptions = useMemo(() => {
    if (!branchFieldKey) return [];
    const values = new Set();
    (sortedData || []).forEach((row) => {
      const raw = row?.[branchFieldKey];
      if (raw === null || raw === undefined) return;
      const normalized = String(raw).trim();
      if (!normalized) return;
      values.add(normalized);
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [sortedData, branchFieldKey]);

  const filteredData = useMemo(() => {
    const categoryFiltered = (sortedData || []).filter((row) => {
      if (categoryFilter === "all") return true;
      if (categoryFilter === "dream") return resolveRowCategory(row) === "dream";
      if (categoryFilter === "open_dream") return resolveRowCategory(row) === "open_dream";
      return true;
    });

    const branchFiltered = categoryFiltered.filter((row) => {
      if (branchFilter === "all" || !branchFieldKey) return true;
      return String(row?.[branchFieldKey] ?? "").trim() === branchFilter;
    });

    if (!searchTerm.trim()) {
      return branchFiltered;
    }

    const searchLower = searchTerm.toLowerCase();
    return branchFiltered.filter((row) => {
      // Check all fields for the search term
      return Object.entries(row).some(([key, value]) => {
        // Skip MongoDB internal fields
        if (key === "_id" || key === "__v") {
          return false;
        }

        // Convert value to string and search
        const valueStr =
          value !== null && value !== undefined ? String(value).toLowerCase() : "";

        // Prioritize company name fields
        if (key.toLowerCase().includes("company") || key.toLowerCase().includes("name")) {
          return valueStr.includes(searchLower);
        }

        // Also search in other fields
        return valueStr.includes(searchLower);
      });
    });
  }, [sortedData, searchTerm, categoryFilter, branchFilter, branchFieldKey, resolveRowCategory]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, categoryFilter, branchFilter]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [filteredData.length]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const paginatedData = useMemo(
    () => filteredData.slice(pageStart, pageStart + PAGE_SIZE),
    [filteredData, pageStart]
  );

  const formatCellValue = (value) => {
    if (value === null || value === undefined) {
      return "N/A";
    }
    if (typeof value === "object") {
      return JSON.stringify(value);
    }
    return String(value);
  };

  const headers = useMemo(() => {
    const allKeys = new Set();
    (sortedData || []).forEach((item) => {
      Object.keys(item || {}).forEach((key) => {
        if (key !== "_id" && key !== "__v") {
          allKeys.add(key);
        }
      });
    });
    const keys = Array.from(allKeys);
    const serialKey = findYearStatsSerialFieldKeyFromRows(sortedData);
    if (serialKey && keys.includes(serialKey)) {
      return [serialKey, ...keys.filter((key) => key !== serialKey)];
    }
    return keys;
  }, [sortedData]);

  const tableRows = useMemo(
    () =>
      paginatedData.map((row, index) => (
        <tr key={row._id || `${pageStart}-${index}`} className="hover:bg-theme-nav/80">
          {headers.map((header) => (
            <td
              key={header}
              className="px-3 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm text-theme-secondary align-top break-words"
            >
              {formatCellValue(row[header])}
            </td>
          ))}
        </tr>
      )),
    [paginatedData, headers, pageStart]
  );

  const scrollToYearStatsTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (!data || data.length === 0) {
    return (
      <div className="bg-theme-card backdrop-blur border border-theme rounded-xl shadow-lg p-6 sm:p-8">
        <PageBackNavRow>
          <PageBackButton onClick={onBack} label="Back to Year Selection" />
        </PageBackNavRow>
        <p className="text-theme-muted text-center py-8">No data available for {year} stats.</p>
      </div>
    );
  }

  const tabActive =
    "bg-theme-hero text-theme-accent shadow-md";
  const tabInactive =
    "text-theme-secondary hover:text-theme-primary hover:bg-theme-nav";

  return (
    <div className="space-y-6">
      <PageBackNavRow>
        <PageBackButton onClick={onBack} label="Back to Year Selection" />
      </PageBackNavRow>

      <div className="bg-theme-card border border-theme rounded-xl p-4 sm:p-6 shadow-lg">
        <div className="flex flex-col items-center justify-center gap-3 text-center">
          <h1 className="year-stats-page-title text-2xl sm:text-4xl font-semibold">
            {year} Placement Statistics
          </h1>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm border border-theme text-theme-secondary bg-theme-nav">
            {filteredData.length} Records
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-theme-card border border-theme rounded-lg p-1 flex gap-1" data-tour="year-stats-analytics-tab">
        {["Table", "Analytics"].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-2.5 rounded-md transition-all duration-200 font-medium text-sm sm:text-base ${
              activeTab === tab ? tabActive : tabInactive
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-theme-card backdrop-blur border border-theme rounded-xl shadow-lg overflow-hidden">
        {activeTab === "Table" && (
          <>
            <div className="p-4 sm:p-6 border-b border-theme" data-tour="year-stats-toolbar">
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <div className="relative w-full sm:flex-1 sm:max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="h-4 w-4 text-theme-muted" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by company name"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    data-tour="year-stats-search"
                    className="block w-full pl-10 pr-3 py-2 border border-theme-input rounded-lg bg-theme-input text-theme-primary placeholder-theme-muted focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] text-sm sm:text-base"
                  />
                </div>
                {branchOptions.length > 0 && (
                  <select
                    value={branchFilter}
                    onChange={(e) => setBranchFilter(e.target.value)}
                    data-tour="year-stats-branch"
                    className="w-full sm:w-52 sm:ml-auto px-3 py-2 border border-theme-input rounded-lg bg-theme-input text-theme-primary focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] text-sm sm:text-base"
                  >
                    <option value="all">All Programmes</option>
                    {branchOptions.map((branch) => (
                      <option key={branch} value={branch}>
                        {branch}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              {(searchTerm || categoryFilter !== "all" || branchFilter !== "all") && (
                <p className="text-sm text-theme-muted mt-2">
                  Showing {filteredData.length} of {sortedData.length} results
                </p>
              )}
              {/* <p className="text-sm text-theme-muted mt-2">
                Pagination: 100 rows per page
              </p> */}
            </div>

            {filteredData.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-theme-secondary">
                  {searchTerm
                    ? `No results found for "${searchTerm}"`
                    : "No results found for selected filters."}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setCategoryFilter("all");
                    setBranchFilter("all");
                  }}
                  className="mt-4 text-[var(--primary)] hover:opacity-90 font-medium text-sm"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full table-fixed divide-y divide-[var(--border)]">
                    <colgroup>
                      {headers.map((header) => (
                        <col key={`col-${header}`} style={{ width: `${100 / headers.length}%` }} />
                      ))}
                    </colgroup>
                    <thead className="bg-theme-hero">
                      <tr>
                        {headers.map((header) => (
                          <th
                            key={header}
                            className="px-3 sm:px-5 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider"
                          >
                            {header.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-theme-card divide-y divide-[var(--border)]">{tableRows}</tbody>
                  </table>
                </div>
                {totalPages > 1 && (
                  <div className="border-t border-theme bg-theme-card px-2 pt-4 pb-4 sm:pt-6 sm:pb-6">
                    <p className="text-sm text-theme-muted text-center mb-3 sm:mb-4 px-2">
                      Showing {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filteredData.length)} of{" "}
                      {filteredData.length} (page {currentPage} of {totalPages})
                    </p>
                    <div className="pagination flex items-center justify-center gap-1 sm:gap-2 mt-4 sm:mt-6 flex-wrap px-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPage((prev) => Math.max(prev - 1, 1));
                          scrollToYearStatsTop();
                        }}
                        disabled={currentPage === 1}
                        className="px-3 sm:px-4 py-2 rounded-lg disabled:opacity-50 transition duration-200 text-sm sm:text-base bg-theme-card border border-theme text-theme-secondary"
                      >
                        Prev
                      </button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                          const shouldShow =
                            pageNum === 1 ||
                            pageNum === totalPages ||
                            Math.abs(pageNum - currentPage) <= 1 ||
                            (currentPage <= 3 && pageNum <= 4) ||
                            (currentPage >= totalPages - 2 && pageNum >= totalPages - 3);

                          if (!shouldShow) {
                            if (pageNum === 2 && currentPage > 4) {
                              return (
                                <span key={`ellipsis-${pageNum}`} className="px-2 text-theme-muted">
                                  ...
                                </span>
                              );
                            }
                            if (pageNum === totalPages - 1 && currentPage < totalPages - 3) {
                              return (
                                <span key={`ellipsis-2-${pageNum}`} className="px-2 text-theme-muted">
                                  ...
                                </span>
                              );
                            }
                            return null;
                          }

                          return (
                            <button
                              type="button"
                              key={pageNum}
                              onClick={() => {
                                setPage(pageNum);
                                scrollToYearStatsTop();
                              }}
                              data-active={pageNum === currentPage ? "true" : undefined}
                              className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition duration-200 text-sm sm:text-base ${
                                pageNum === currentPage
                                  ? "active bg-theme-accent text-white"
                                  : "bg-theme-card border border-theme text-theme-secondary hover:bg-theme-nav"
                              }`}
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
                          scrollToYearStatsTop();
                        }}
                        disabled={currentPage === totalPages}
                        className="px-3 sm:px-4 py-2 rounded-lg disabled:opacity-50 transition duration-200 text-sm sm:text-base bg-theme-card border border-theme text-theme-secondary"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {activeTab === "Analytics" && (
          <div className="p-4 sm:p-6" data-tour="year-stats-analytics">
            <h2 className="text-xl font-semibold text-[var(--primary)] mb-6">{year} Analytics</h2>
            <Analytics year={year} embedded={true} />
          </div>
        )}
      </div>
      {activeTab === "Table" && (
        <div className="fixed bottom-28 sm:bottom-36 right-4 sm:right-8 z-50 flex flex-col gap-3 items-end">
          <button
            type="button"
            onClick={() => setShowFilter((prev) => !prev)}
            data-tour="year-stats-filter"
            className="bg-[var(--primary)] text-white p-3 sm:p-4 rounded-full shadow-lg transition duration-200 hover:opacity-90"
            aria-label="Filter categories"
          >
            <FaFilter size={18} className="sm:w-5 sm:h-5" />
          </button>

          {showFilter && (
            <div className="absolute bottom-full mb-2 bg-theme-card border border-theme rounded-lg shadow-lg py-2 w-44 flex flex-col right-0">
              <button
                onClick={() => {
                  setCategoryFilter("all");
                  setShowFilter(false);
                }}
                className={`px-4 py-2 text-left hover:bg-theme-nav text-theme-secondary ${
                  categoryFilter === "all" ? "font-semibold nav-active-theme text-theme-primary" : ""
                }`}
              >
                All
              </button>
              <button
                onClick={() => {
                  setCategoryFilter("dream");
                  setShowFilter(false);
                }}
                className={`px-4 py-2 text-left hover:bg-theme-nav text-theme-secondary ${
                  categoryFilter === "dream" ? "font-semibold nav-active-theme text-theme-primary" : ""
                }`}
              >
                Dream
              </button>
              <button
                onClick={() => {
                  setCategoryFilter("open_dream");
                  setShowFilter(false);
                }}
                className={`px-4 py-2 text-left hover:bg-theme-nav text-theme-secondary ${
                  categoryFilter === "open_dream" ? "font-semibold nav-active-theme text-theme-primary" : ""
                }`}
              >
                Open-Dream
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default React.memo(
  YearStatsTable,
  (prevProps, nextProps) =>
    prevProps.year === nextProps.year &&
    prevProps.data === nextProps.data &&
    prevProps.openDreamMinLpa === nextProps.openDreamMinLpa
);
