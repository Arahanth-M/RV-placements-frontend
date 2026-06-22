import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { adminAPI } from "../utils/api";
import { FaChevronDown, FaFileExcel } from "react-icons/fa";
import SpcThemeSelect from "./SpcThemeSelect.jsx";
import { INPUT_CLASS } from "./SpcFormField.jsx";
import { formatInternshipStipendDisplay } from "../utils/compensationDisplay.js";
import {
  CUSTOM_SEARCH_BRANCH_ALL,
  CUSTOM_SEARCH_OFFER_ALL,
  filterPlacementStudentsForCustomSearch,
  PLACEMENT_OFFER_TYPE_OPTIONS,
  searchPlacementStudentsByStudentQuery,
  suggestPlacementStudentsForCustomSearch,
} from "../utils/studentPlacementCustomSearch.js";
import { downloadPlacementSearchExcel } from "../utils/exportPlacementSearchExcel.js";
import DashboardRefreshButton from "./DashboardRefreshButton.jsx";
import DashboardNavCard, { DashboardNavGrid } from "./DashboardNavCard.jsx";
import {
  formatPlacementRecordWhen,
  placementRecordTimestamp,
} from "../utils/placementRecordDisplay.js";

const YEAR_OPTIONS_FALLBACK = [];
const PLACEMENT_STATS_EXTRA_YEARS = [2029, 2028];

const PLACEMENT_STATS_VIEWS = {
  roster: "roster",
  customSearch: "customSearch",
};

const PLACEMENT_STATS_VIEW_LABELS = {
  [PLACEMENT_STATS_VIEWS.roster]: "Student data",
  [PLACEMENT_STATS_VIEWS.customSearch]: "Custom search",
};

const PLACEMENT_STATS_NAV_ITEMS = [
  {
    key: PLACEMENT_STATS_VIEWS.roster,
    title: PLACEMENT_STATS_VIEW_LABELS[PLACEMENT_STATS_VIEWS.roster],
    description: "Browse placed students branch by branch.",
    cta: "View student data",
    accent: "border-l-indigo-500",
    ctaColor: "text-indigo-500",
  },
  {
    key: PLACEMENT_STATS_VIEWS.customSearch,
    title: PLACEMENT_STATS_VIEW_LABELS[PLACEMENT_STATS_VIEWS.customSearch],
    description: "Filter or search students with advanced criteria.",
    cta: "Start custom search",
    accent: "border-l-violet-500",
    ctaColor: "text-violet-500",
  },
];

function mergePlacementStatsYears(apiYears) {
  const fromApi = (Array.isArray(apiYears) ? apiYears : [])
    .map((y) => Number.parseInt(String(y), 10))
    .filter((y) => Number.isFinite(y));
  const merged = new Set([...fromApi, ...PLACEMENT_STATS_EXTRA_YEARS]);
  return [...merged].sort((a, b) => b - a);
}

const PLACEMENT_STATS_PAGE_SIZE = 10;
const BRANCH_FILTER_ALL = "all";

const CUSTOM_SEARCH_MODES = {
  filter: "filter",
  student: "student",
};

const CUSTOM_SEARCH_MODE_LABELS = {
  [CUSTOM_SEARCH_MODES.filter]: "Filter search",
  [CUSTOM_SEARCH_MODES.student]: "Search by student",
};

const CUSTOM_SEARCH_MODE_NAV_ITEMS = [
  {
    key: CUSTOM_SEARCH_MODES.filter,
    title: CUSTOM_SEARCH_MODE_LABELS[CUSTOM_SEARCH_MODES.filter],
    description: "Branch, company, offer type, and CTC range.",
    cta: "Use filters",
    accent: "border-l-violet-500",
    ctaColor: "text-violet-500",
  },
  {
    key: CUSTOM_SEARCH_MODES.student,
    title: CUSTOM_SEARCH_MODE_LABELS[CUSTOM_SEARCH_MODES.student],
    description: "Name, USN, or email lookup.",
    cta: "Search student",
    accent: "border-l-amber-500",
    ctaColor: "text-amber-600",
  },
];

function titleCaseBranch(code) {
  const c = String(code || "").trim();
  if (!c) return "Unknown";
  return c.toUpperCase();
}

function paginateList(items, page, pageSize = PLACEMENT_STATS_PAGE_SIZE) {
  const list = Array.isArray(items) ? items : [];
  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * pageSize;
  return {
    items: list.slice(start, start + pageSize),
    total,
    totalPages,
    currentPage,
    rangeStart: total === 0 ? 0 : start + 1,
    rangeEnd: Math.min(start + pageSize, total),
  };
}

function PlacementStatsPagination({ pagination, onPageChange }) {
  const { total, totalPages, currentPage, rangeStart, rangeEnd } = pagination;
  if (total === 0 || totalPages <= 1) return null;

  return (
    <div className="flex flex-col gap-2 border-t border-theme px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-theme-secondary tabular-nums">
        Showing {rangeStart}–{rangeEnd} of {total}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="rounded-lg border border-theme bg-theme-hero px-3 py-1.5 text-xs font-semibold text-theme-secondary transition hover:bg-theme-nav disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-xs font-medium text-theme-secondary tabular-nums">
          Page {currentPage} of {totalPages}
        </span>
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="rounded-lg border border-theme bg-theme-hero px-3 py-1.5 text-xs font-semibold text-theme-secondary transition hover:bg-theme-nav disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function buildBranchSelectOptions(branches, allValue = BRANCH_FILTER_ALL) {
  const list = Array.isArray(branches) ? branches : [];
  return [
    { value: allValue, label: "All branches" },
    ...list.map((branch) => ({
      value: String(branch.branchCode),
      label: titleCaseBranch(branch.branchCode),
    })),
  ];
}

function ThemeFilterSelect({ id, label, name, value, onChange, options }) {
  const labelId = `${id}-label`;
  return (
    <div className="min-w-[180px] flex-1">
      <span
        id={labelId}
        className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-theme-secondary"
      >
        {label}
      </span>
      <SpcThemeSelect
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        options={options}
        labelId={labelId}
      />
    </div>
  );
}

function CustomSearchCompanyField({ value, onChange }) {
  const rootRef = useRef(null);
  const debounceRef = useRef(null);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestOpen, setSuggestOpen] = useState(false);

  useEffect(() => {
    const q = String(value ?? "").trim();
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (q.length < 2) {
      setSuggestions([]);
      setSuggestOpen(false);
      return undefined;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await adminAPI.companySuggest(q);
        const items = Array.isArray(data?.items) ? data.items : [];
        setSuggestions(items);
        setSuggestOpen(items.length > 0);
      } catch {
        setSuggestions([]);
        setSuggestOpen(false);
      }
    }, 280);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  useEffect(() => {
    const onPointerDown = (event) => {
      const target = event.target instanceof Node ? event.target : null;
      if (target && rootRef.current?.contains(target)) return;
      setSuggestOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const pickCompany = (item) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    onChange(String(item?.name || "").trim());
    setSuggestOpen(false);
    setSuggestions([]);
  };

  return (
    <div ref={rootRef} className="relative min-w-[200px] flex-1">
      <label htmlFor="custom-search-company" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-theme-secondary">
        Company
      </label>
      <div className="relative">
        <input
          id="custom-search-company"
          type="text"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setSuggestOpen(true);
          }}
          placeholder="Search company name"
          className={INPUT_CLASS}
        />
        {suggestOpen && suggestions.length > 0 ? (
          <ul
            className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-auto rounded-xl border border-theme bg-theme-card py-1 shadow-lg"
            role="listbox"
          >
            {suggestions.map((item) => (
              <li key={item.id} role="presentation">
                <button
                  type="button"
                  className="flex w-full px-4 py-2.5 text-left text-sm text-theme-primary hover:bg-theme-nav"
                  onMouseDown={(ev) => ev.preventDefault()}
                  onClick={() => pickCompany(item)}
                >
                  {item.name}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

function CustomSearchStudentField({ value, onChange, branches }) {
  const rootRef = useRef(null);
  const debounceRef = useRef(null);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestOpen, setSuggestOpen] = useState(false);

  useEffect(() => {
    const q = String(value ?? "").trim();
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (q.length < 2) {
      setSuggestions([]);
      setSuggestOpen(false);
      return undefined;
    }

    debounceRef.current = setTimeout(() => {
      const items = suggestPlacementStudentsForCustomSearch(branches, q);
      setSuggestions(items);
      setSuggestOpen(items.length > 0);
    }, 180);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, branches]);

  useEffect(() => {
    const onPointerDown = (event) => {
      const target = event.target instanceof Node ? event.target : null;
      if (target && rootRef.current?.contains(target)) return;
      setSuggestOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const pickStudent = (item) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    const nextValue = String(item?.usn || item?.name || "").trim();
    onChange(nextValue);
    setSuggestOpen(false);
    setSuggestions([]);
  };

  return (
    <div ref={rootRef} className="relative min-w-[240px] flex-1">
      <label htmlFor="custom-search-student" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-theme-secondary">
        Student
      </label>
      <div className="relative">
        <input
          id="custom-search-student"
          type="text"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setSuggestOpen(true);
          }}
          placeholder="Name, USN, or email"
          className={INPUT_CLASS}
        />
        {suggestOpen && suggestions.length > 0 ? (
          <ul
            className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-auto rounded-xl border border-theme bg-theme-card py-1 shadow-lg"
            role="listbox"
          >
            {suggestions.map((item) => {
              const key = `${item.usn || item.email || item.name}-${item.branchCode}`;
              return (
                <li key={key} role="presentation">
                  <button
                    type="button"
                    className="flex w-full flex-col px-4 py-2.5 text-left hover:bg-theme-nav"
                    onMouseDown={(ev) => ev.preventDefault()}
                    onClick={() => pickStudent(item)}
                  >
                    <span className="text-sm font-medium text-theme-primary">
                      {String(item?.name ?? "").trim() || "Unknown"}
                    </span>
                    <span className="text-xs text-theme-secondary">
                      {[item.usn, item.email, titleCaseBranch(item.branchCode)]
                        .map((part) => String(part ?? "").trim())
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

function PlacementCustomSearchPanel({ branches, selectedYear }) {
  const [searchMode, setSearchMode] = useState(CUSTOM_SEARCH_MODES.filter);
  const [branchFilter, setBranchFilter] = useState(CUSTOM_SEARCH_BRANCH_ALL);
  const [offerTypeFilter, setOfferTypeFilter] = useState(CUSTOM_SEARCH_OFFER_ALL);
  const [companyQuery, setCompanyQuery] = useState("");
  const [studentQuery, setStudentQuery] = useState("");
  const [ctcMinInput, setCtcMinInput] = useState("");
  const [ctcMaxInput, setCtcMaxInput] = useState("");
  const [appliedFilters, setAppliedFilters] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [resultsPage, setResultsPage] = useState(1);

  const branchOptions = useMemo(
    () => buildBranchSelectOptions(branches, CUSTOM_SEARCH_BRANCH_ALL),
    [branches]
  );
  const offerTypeOptions = useMemo(
    () => [
      { value: CUSTOM_SEARCH_OFFER_ALL, label: "All offer types" },
      ...PLACEMENT_OFFER_TYPE_OPTIONS.map((offerType) => ({
        value: offerType,
        label: offerType,
      })),
    ],
    []
  );

  const results = useMemo(() => {
    if (!appliedFilters) return [];
    if (appliedFilters.mode === CUSTOM_SEARCH_MODES.student) {
      return searchPlacementStudentsByStudentQuery(branches, appliedFilters);
    }
    return filterPlacementStudentsForCustomSearch(branches, appliedFilters);
  }, [branches, appliedFilters]);

  const resultsPagination = useMemo(
    () => paginateList(results, resultsPage),
    [results, resultsPage]
  );

  const handleApplyFilters = () => {
    setResultsPage(1);
    if (searchMode === CUSTOM_SEARCH_MODES.student) {
      setAppliedFilters({
        mode: CUSTOM_SEARCH_MODES.student,
        studentQueryInput: studentQuery,
      });
      return;
    }
    setAppliedFilters({
      mode: CUSTOM_SEARCH_MODES.filter,
      branch: branchFilter,
      offerType: offerTypeFilter,
      companyQueryInput: companyQuery,
      ctcMinInput,
      ctcMaxInput,
    });
  };

  const handleSearchModeChange = (nextMode) => {
    if (nextMode === searchMode) return;
    setSearchMode(nextMode);
    setAppliedFilters(null);
    setResultsPage(1);
  };

  const handleResetFilters = () => {
    setBranchFilter(CUSTOM_SEARCH_BRANCH_ALL);
    setOfferTypeFilter(CUSTOM_SEARCH_OFFER_ALL);
    setCompanyQuery("");
    setStudentQuery("");
    setCtcMinInput("");
    setCtcMaxInput("");
    setResultsPage(1);
    setAppliedFilters(null);
  };

  const handleExportResults = async () => {
    if (results.length === 0) return;
    try {
      setExporting(true);
      downloadPlacementSearchExcel(results, selectedYear);
    } catch (e) {
      console.error("Failed to export custom search results:", e);
    } finally {
      setExporting(false);
    }
  };

  const cellText = (value) => {
    const text = String(value ?? "").trim();
    return text || "—";
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-theme bg-theme-card p-5 shadow-sm space-y-5">
        <DashboardNavGrid role="tablist" aria-label="Custom search modes">
          {CUSTOM_SEARCH_MODE_NAV_ITEMS.map((item) => (
            <DashboardNavCard
              key={item.key}
              title={item.title}
              description={item.description}
              cta={item.cta}
              accent={item.accent}
              ctaColor={item.ctaColor}
              isActive={searchMode === item.key}
              role="tab"
              aria-selected={searchMode === item.key}
              onClick={() => handleSearchModeChange(item.key)}
            />
          ))}
        </DashboardNavGrid>

        <p className="text-sm text-theme-secondary">
          {searchMode === CUSTOM_SEARCH_MODES.student
            ? "Search placed students by name, USN, or email. Click "
            : "Filter placed students by branch, company, offer type, and CTC range. Click "}
          <span className="font-medium text-theme-primary">Apply filter</span> to load results.
        </p>

        {searchMode === CUSTOM_SEARCH_MODES.student ? (
          <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
            <CustomSearchStudentField
              value={studentQuery}
              onChange={setStudentQuery}
              branches={branches}
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleApplyFilters}
                className="inline-flex h-[42px] items-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-500"
              >
                Apply filter
              </button>
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex h-[42px] items-center rounded-lg border border-theme bg-theme-hero px-4 text-sm font-semibold text-theme-secondary transition hover:bg-theme-nav"
              >
                Reset
              </button>
            </div>
          </div>
        ) : (
        <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
          <ThemeFilterSelect
            id="custom-search-branch"
            label="Branch"
            name="customSearchBranch"
            value={branchFilter}
            onChange={(e) => setBranchFilter(String(e.target.value))}
            options={branchOptions}
          />

          <ThemeFilterSelect
            id="custom-search-offer-type"
            label="Offer type"
            name="customSearchOfferType"
            value={offerTypeFilter}
            onChange={(e) => setOfferTypeFilter(String(e.target.value))}
            options={offerTypeOptions}
          />

          <CustomSearchCompanyField value={companyQuery} onChange={setCompanyQuery} />

          <label className="block min-w-[140px] flex-1">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-theme-secondary">
              Min CTC (LPA)
            </span>
            <input
              type="number"
              min={0}
              step="0.5"
              value={ctcMinInput}
              onChange={(e) => setCtcMinInput(e.target.value)}
              placeholder="Optional"
              className="w-full rounded-lg border border-theme-input bg-theme-input px-3 py-2.5 text-sm text-theme-primary placeholder:text-theme-muted outline-none focus:border-theme-accent focus:ring-2 focus:ring-indigo-500/30"
            />
          </label>

          <label className="block min-w-[140px] flex-1">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-theme-secondary">
              Max CTC (LPA)
            </span>
            <input
              type="number"
              min={0}
              step="0.5"
              value={ctcMaxInput}
              onChange={(e) => setCtcMaxInput(e.target.value)}
              placeholder="Optional"
              className="w-full rounded-lg border border-theme-input bg-theme-input px-3 py-2.5 text-sm text-theme-primary placeholder:text-theme-muted outline-none focus:border-theme-accent focus:ring-2 focus:ring-indigo-500/30"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleApplyFilters}
              className="inline-flex h-[42px] items-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              Apply filter
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex h-[42px] items-center rounded-lg border border-theme bg-theme-hero px-4 text-sm font-semibold text-theme-secondary transition hover:bg-theme-nav"
            >
              Reset
            </button>
          </div>
        </div>
        )}
      </div>

      {appliedFilters != null ? (
      <div className="rounded-xl border border-theme bg-theme-card p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-theme-primary">Search results</h3>
            <p className="mt-1 text-sm text-theme-secondary">
              {results.length} student{results.length === 1 ? "" : "s"} matched.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportResults}
            disabled={exporting || results.length === 0}
            className="inline-flex h-[34px] items-center gap-2 rounded-lg border border-theme bg-theme-hero px-3 text-xs font-semibold text-theme-secondary transition hover:bg-theme-nav disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FaFileExcel className="h-4 w-4 text-emerald-500" />
            {exporting ? "Exporting..." : "Export results to Excel"}
          </button>
        </div>

        {results.length === 0 ? (
          <p className="rounded-lg border border-theme bg-theme-hero px-4 py-8 text-center text-sm text-theme-secondary">
            No students match the selected filters.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-theme">
            <table className="min-w-[1100px] w-full divide-y divide-theme text-sm">
              <thead className="bg-theme-hero">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-theme-secondary">
                  <th className="px-3 py-3">Branch</th>
                  <th className="px-3 py-3">Name</th>
                  <th className="px-3 py-3">USN</th>
                  <th className="px-3 py-3">Email</th>
                  <th className="px-3 py-3">Company</th>
                  <th className="px-3 py-3">Offer type</th>
                  <th className="px-3 py-3">CTC</th>
                  <th className="px-3 py-3">Role</th>
                  <th className="px-3 py-3">Stipend</th>
                  <th className="px-3 py-3">6 mo. stipend</th>
                  <th className="px-3 py-3">PPO conversion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme bg-theme-card">
                {resultsPagination.items.map((student, idx) => {
                  const rowKey = `${student.usn || student.email || "row"}-${resultsPagination.rangeStart + idx}`;
                  return (
                    <tr key={rowKey} className="text-theme-primary">
                      <td className="px-3 py-2.5 font-medium whitespace-nowrap">
                        {titleCaseBranch(student.branchCode)}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">{cellText(student.name)}</td>
                      <td className="px-3 py-2.5 font-mono text-xs whitespace-nowrap">
                        {cellText(student.usn)}
                      </td>
                      <td className="px-3 py-2.5 max-w-[180px] truncate">{cellText(student.email)}</td>
                      <td className="px-3 py-2.5 max-w-[160px] truncate">
                        {cellText(student.companyPlaced)}
                      </td>
                      <td className="px-3 py-2.5 max-w-[160px] truncate">
                        {cellText(student.typeOfOffer)}
                      </td>
                      <td className="px-3 py-2.5 font-semibold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                        {cellText(student.ctc)}
                      </td>
                      <td className="px-3 py-2.5 max-w-[140px] truncate">{cellText(student.role)}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {formatInternshipStipendDisplay(student.stipend) || "—"}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {formatInternshipStipendDisplay(student.sixMonthsInternshipStipend) || "—"}
                      </td>
                      <td className="px-3 py-2.5 max-w-[140px] truncate">
                        {cellText(student.ppoConversionType)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <PlacementStatsPagination
              pagination={resultsPagination}
              onPageChange={setResultsPage}
            />
          </div>
        )}
      </div>
      ) : null}
    </div>
  );
}

export default function StudentPlacementStatsTab() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [years, setYears] = useState(YEAR_OPTIONS_FALLBACK);
  const [selectedYear, setSelectedYear] = useState("");
  const [branches, setBranches] = useState([]);
  const [openBranchCode, setOpenBranchCode] = useState("");
  const [exporting, setExporting] = useState(false);
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  const [addedByViewer, setAddedByViewer] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [activeSubView, setActiveSubView] = useState(PLACEMENT_STATS_VIEWS.roster);
  const [rosterPage, setRosterPage] = useState(1);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const totalStudents = useMemo(
    () => branches.reduce((sum, b) => sum + (Number(b?.count) || 0), 0),
    [branches]
  );

  const activeBranch = useMemo(
    () => branches.find((branch) => String(branch.branchCode) === openBranchCode) || null,
    [branches, openBranchCode]
  );

  const loadData = useCallback(async (yearArg, options = {}) => {
    const { silent = false } = options;
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");
      const year = yearArg == null || yearArg === "" ? undefined : Number(yearArg);
      const { data } = await adminAPI.getStudentPlacementStats(year);
      const apiYears = Array.isArray(data?.years) ? data.years : [];
      const apiSelected =
        data?.selectedYear != null ? String(data.selectedYear) : "";
      setYears(mergePlacementStatsYears(apiYears));
      setSelectedYear(apiSelected);
      setLastUpdatedAt(data?.lastUpdatedAt ?? null);
      const nextBranches = Array.isArray(data?.branches) ? data.branches : [];
      setBranches(nextBranches);
      if (nextBranches.length > 0) {
        setOpenBranchCode((prev) =>
          nextBranches.some((b) => String(b.branchCode) === prev)
            ? prev
            : String(nextBranches[0].branchCode)
        );
      } else {
        setOpenBranchCode("");
      }
      setExpandedRows(new Set());
      setRosterPage(1);
    } catch (e) {
      console.error("Failed to load student placement stats:", e);
      setError("Failed to load student placement stats. Please try again.");
      setBranches([]);
      setLastUpdatedAt(null);
    } finally {
      if (silent) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      void loadData(selectedYear || undefined, { silent: true });
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [loadData, selectedYear]);

  const handleRefresh = () => {
    void loadData(selectedYear || undefined, { silent: true });
  };

  const handleYearSelect = async (year) => {
    setYearDropdownOpen(false);
    setSelectedYear(String(year));
    await loadData(String(year));
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      setError("");
      const year = selectedYear ? Number(selectedYear) : undefined;
      const response = await adminAPI.exportStudentPlacementStats(year);
      const contentDisposition = response?.headers?.["content-disposition"] || "";
      const match = /filename=\"?([^"]+)\"?/i.exec(contentDisposition);
      const fileName =
        match?.[1] || `student-placement-stats-${selectedYear || "all"}.xlsx`;
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Failed to export student placement stats:", e);
      setError("Failed to export as Excel. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const toggleRow = (key) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  // Small helper: renders a labelled detail card inside the expanded panel
  const DetailField = ({ label, value, accent = false, stipend = false }) => {
    const display = stipend ? formatInternshipStipendDisplay(value) : String(value ?? "").trim();
    if (!stipend && (!display || display === "-")) return null;
    if (!stipend && !display) return null;
    return (
      <div className="rounded-lg border border-theme bg-theme-card px-3 py-2.5">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-theme-secondary">
          {label}
        </p>
        <p
          className={`text-sm font-medium break-words ${
            accent
              ? "text-indigo-600 dark:text-indigo-400"
              : "text-theme-primary"
          }`}
        >
          {display}
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="rounded-xl border border-theme bg-theme-card p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-theme-accent">
              Student Placement Stats
            </h2>
            {!loading && selectedYear ? (
              <p className="mt-1 text-sm text-theme-secondary">
                {lastUpdatedAt ? (
                  <>
                    Last placement update for{" "}
                    <span className="font-medium text-theme-primary">{selectedYear}</span>:{" "}
                    <span className="font-medium text-theme-primary">
                      {formatPlacementRecordWhen(lastUpdatedAt)}
                    </span>
                  </>
                ) : (
                  <>No placement records for {selectedYear} yet.</>
                )}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <DashboardRefreshButton
              loading={refreshing}
              disabled={loading}
              onClick={handleRefresh}
            />
            <div className="min-w-[220px]">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-theme-secondary">
              Placement Year
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  if (loading || years.length === 0) return;
                  setYearDropdownOpen((prev) => !prev);
                }}
                className="flex w-full items-center justify-between rounded-lg border border-theme-input bg-theme-input px-3 py-2.5 text-left text-sm font-medium text-theme-primary outline-none transition focus:border-theme-accent focus:ring-2 focus:ring-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={loading || years.length === 0}
              >
                <span>{selectedYear || "No years"}</span>
                <FaChevronDown
                  className={`text-xs text-theme-muted transition-transform ${
                    yearDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {yearDropdownOpen && years.length > 0 ? (
                <div className="absolute left-0 right-0 z-20 mt-1 overflow-hidden rounded-lg border border-theme bg-theme-card shadow-xl">
                  <div className="max-h-56 overflow-y-auto py-1">
                    {years.map((y) => {
                      const value = String(y);
                      const isSelected = value === selectedYear;
                      return (
                        <button
                          type="button"
                          key={value}
                          onClick={() => handleYearSelect(value)}
                          className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition ${
                            isSelected
                              ? "bg-indigo-600/15 text-theme-primary"
                              : "text-theme-secondary hover:bg-theme-nav hover:text-theme-primary"
                          }`}
                        >
                          <span>{value}</span>
                          {isSelected ? (
                            <span className="text-xs font-semibold text-indigo-400">
                              Selected
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
            </div>
          </div>
        </div>
      </div>

      {!loading && branches.length > 0 ? (
        <DashboardNavGrid role="tablist" aria-label="Student placement stats views">
          {PLACEMENT_STATS_NAV_ITEMS.map((item) => (
            <DashboardNavCard
              key={item.key}
              title={item.title}
              description={item.description}
              cta={item.cta}
              accent={item.accent}
              ctaColor={item.ctaColor}
              isActive={activeSubView === item.key}
              role="tab"
              aria-selected={activeSubView === item.key}
              onClick={() => setActiveSubView(item.key)}
            />
          ))}
        </DashboardNavGrid>
      ) : null}

      {/* Body */}
      {loading ? (
        <div className="rounded-xl border border-theme bg-theme-card p-8 text-center text-sm text-theme-secondary">
          Loading student placement stats...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      ) : branches.length === 0 ? (
        <div className="rounded-xl border border-theme bg-theme-card p-8 text-center text-sm text-theme-secondary">
          No placed student records found for the selected year.
        </div>
      ) : (
        <div className="space-y-4">
          {activeSubView === PLACEMENT_STATS_VIEWS.customSearch ? (
            <PlacementCustomSearchPanel branches={branches} selectedYear={selectedYear} />
          ) : (
            <>
          <div className="rounded-lg border border-theme bg-theme-hero px-4 py-3 text-sm text-theme-secondary">
            Total placed students shown:{" "}
            <span className="font-semibold text-theme-primary">{totalStudents}</span>
          </div>

          {/* Branch selector */}
          <div className="rounded-xl border border-theme bg-theme-card p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-theme-primary">Branches</p>
                {activeBranch ? (
                  <div className="mt-1 space-y-0.5 text-xs text-theme-secondary">
                    <p>
                      Last modified:{" "}
                      <span className="font-medium text-theme-primary">
                        {activeBranch.lastUpdatedAt
                          ? formatPlacementRecordWhen(activeBranch.lastUpdatedAt)
                          : "—"}
                      </span>
                    </p>
                    <p>
                      Latest company updated by SPC:{" "}
                      <span className="font-medium text-theme-primary">
                        {activeBranch.latestSpcPlacement?.companyPlaced || "—"}
                      </span>
                    </p>
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                onClick={handleExport}
                disabled={exporting || loading || years.length === 0}
                className="inline-flex h-[38px] shrink-0 items-center gap-2 rounded-lg border border-theme bg-theme-hero px-4 text-xs font-semibold text-theme-secondary transition hover:bg-theme-nav disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FaFileExcel className="h-4 w-4 text-emerald-500" />
                {exporting ? "Exporting..." : "Export as Excel"}
              </button>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {branches.map((branch) => {
                const code = String(branch.branchCode);
                const isActive = openBranchCode === code;
                return (
                  <button
                    type="button"
                    key={code}
                    onClick={() => {
                      setOpenBranchCode(code);
                      setExpandedRows(new Set());
                      setRosterPage(1);
                    }}
                    className={`min-w-[4.25rem] rounded-xl border px-5 py-2.5 text-sm font-semibold tracking-wide transition-all ${
                      isActive
                        ? "border-indigo-500 bg-indigo-600 text-white shadow-md shadow-indigo-500/20 ring-2 ring-indigo-500/25"
                        : "border-theme bg-theme-hero text-theme-primary hover:border-indigo-400/40 hover:bg-theme-nav hover:shadow-sm"
                    }`}
                  >
                    {titleCaseBranch(code)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Student list — expandable rows */}
          {branches
            .filter((branch) => String(branch.branchCode) === openBranchCode)
            .map((branch) => {
              const students = Array.isArray(branch.students)
                ? branch.students
                : [];
              const rosterPagination = paginateList(students, rosterPage);
              const pagedStudents = rosterPagination.items;
              return (
                <div
                  key={String(branch.branchCode)}
                  className="rounded-xl border border-theme bg-theme-card p-5 shadow-sm"
                >
                  {/* Card header */}
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-theme-primary">
                      {titleCaseBranch(branch.branchCode)}
                    </h3>
                    <span className="rounded-full bg-indigo-600/15 px-3 py-1 text-xs font-semibold text-indigo-400">
                      {Number(branch.count) || 0} students
                    </span>
                  </div>

                  {/* Column headers — same grid template as rows */}
                  <div
                    className="mb-1 grid items-center gap-x-3 px-4 py-1"
                    style={{ gridTemplateColumns: "1rem 1.8fr 1.4fr 1fr 0.6fr 0.8fr 3rem" }}
                  >
                    <span />
                    <span className="text-xs font-semibold uppercase tracking-wide text-theme-secondary">Name / USN</span>
                    <span className="text-xs font-semibold uppercase tracking-wide text-theme-secondary">Company</span>
                    <span className="text-xs font-semibold uppercase tracking-wide text-theme-secondary">Offer</span>
                    <span className="text-xs font-semibold uppercase tracking-wide text-theme-secondary">CTC</span>
                    <span className="text-xs font-semibold uppercase tracking-wide text-theme-secondary">Role</span>
                    <span />
                  </div>

                  {/* Rows */}
                  <div className="divide-y divide-theme rounded-lg border border-theme overflow-hidden">
                    {students.length === 0 ? (
                      <p className="px-4 py-6 text-center text-sm text-theme-secondary">
                        No students found for this branch.
                      </p>
                    ) : (
                      pagedStudents.map((student, idx) => {
                        const rowKey = `${student.usn || student.email || "row"}-${rosterPagination.rangeStart + idx}`;
                        const isOpen = expandedRows.has(rowKey);

                        return (
                          <div key={rowKey}>
                            {/* Summary row — identical grid template to headers */}
                            <button
                              type="button"
                              onClick={() => toggleRow(rowKey)}
                              className={`w-full text-left transition-colors ${
                                isOpen
                                  ? "bg-indigo-50 dark:bg-indigo-950/20"
                                  : "bg-theme-card hover:bg-theme-hero"
                              }`}
                            >
                              <div
                                className="grid items-center gap-x-3 px-4 py-3"
                                style={{ gridTemplateColumns: "1rem 1.8fr 1.4fr 1fr 0.6fr 0.8fr 3rem" }}
                              >
                                {/* Chevron */}
                                <FaChevronDown
                                  className={`h-3 w-3 shrink-0 text-theme-secondary transition-transform duration-200 ${
                                    isOpen ? "rotate-180 text-indigo-500" : ""
                                  }`}
                                />
                                {/* Name + USN */}
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-theme-primary">
                                    {student.name || "—"}
                                  </p>
                                  <p className="font-mono text-xs text-theme-secondary">
                                    {student.usn || "—"}
                                  </p>
                                </div>
                                {/* Company */}
                                <span className="truncate text-sm text-theme-secondary">
                                  {student.companyPlaced || "—"}
                                </span>
                                {/* Offer type */}
                                <span className="truncate text-sm text-theme-secondary">
                                  {student.typeOfOffer || "—"}
                                </span>
                                {/* CTC */}
                                <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                                  {student.ctc || "—"}
                                </span>
                                {/* Role */}
                                <span className="truncate text-sm text-theme-secondary">
                                  {student.role || "—"}
                                </span>
                                {/* Details label */}
                                <span className="text-right text-xs text-theme-secondary">
                                  {isOpen ? "Hide" : "Details"}
                                </span>
                              </div>
                            </button>

                            {/* Expanded detail panel */}
                            {isOpen && (
                              <div className="border-t border-indigo-200 bg-theme-hero px-4 py-4 dark:border-indigo-800">
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                  <DetailField label="Email ID" value={student.email} />
                                  <DetailField label="Company placed" value={student.companyPlaced} />
                                  <DetailField label="Type of offer" value={student.typeOfOffer} />
                                  <DetailField label="Role" value={student.role} />
                                  <DetailField label="Stipend" value={student.stipend} stipend />
                                  <DetailField
                                    label="6 mo. internship stipend"
                                    value={student.sixMonthsInternshipStipend}
                                    stipend
                                  />
                                  <DetailField label="CTC" value={student.ctc} accent />
                                  <DetailField
                                    label="PPO conversion type"
                                    value={student.ppoConversionType}
                                  />
                                  <DetailField
                                    label="Last updated"
                                    value={formatPlacementRecordWhen(
                                      placementRecordTimestamp(student)
                                    )}
                                  />
                                </div>

                                {/* Added by */}
                                <div className="mt-3 flex items-center justify-between gap-3 border-t border-theme pt-3">
                                  <p className="text-xs text-theme-secondary">
                                    Placement record source
                                  </p>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setAddedByViewer({
                                        addedByName: student.addedByName || "",
                                        addedByUsn: student.addedByUsn || "",
                                        addedByEmail: student.addedByEmail || "",
                                      });
                                    }}
                                    className="inline-flex items-center gap-1.5 rounded-md border border-theme bg-theme-card px-2.5 py-1.5 text-xs font-semibold text-theme-primary transition hover:bg-theme-nav"
                                  >
                                    View added by
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                  <PlacementStatsPagination
                    pagination={rosterPagination}
                    onPageChange={(page) => {
                      setRosterPage(page);
                      setExpandedRows(new Set());
                    }}
                  />
                </div>
              );
            })}
            </>
          )}
        </div>
      )}

      {/* Added-by modal — unchanged */}
      {addedByViewer ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-theme bg-theme-card p-5 shadow-xl">
            <h4 className="text-base font-semibold text-theme-primary">
              Placement Record Source
            </h4>
            <div className="mt-3 space-y-2 text-sm text-theme-secondary">
              <p>
                <span className="font-semibold text-theme-primary">Name:</span>{" "}
                {addedByViewer.addedByName || "Unavailable"}
              </p>
              <p>
                <span className="font-semibold text-theme-primary">USN:</span>{" "}
                {addedByViewer.addedByUsn || "Unavailable"}
              </p>
              <p>
                <span className="font-semibold text-theme-primary">Email:</span>{" "}
                {addedByViewer.addedByEmail || "Unavailable"}
              </p>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setAddedByViewer(null)}
                className="rounded-lg bg-theme-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}