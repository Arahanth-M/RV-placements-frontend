import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FaMinus, FaPlus } from "react-icons/fa";
import { adminAPI } from "../../utils/api";
import {
  DEFAULT_PLACEMENT_DETAIL_YEAR,
  PLACEMENT_DETAIL_VISIT_YEARS,
  isPlacementDetailVisitYear,
  normalizeTotalGotInByYear,
} from "../../constants/placementYears.js";
import {
  PLACEMENT_TIER_DREAM,
  PLACEMENT_TIER_OPEN_DREAM,
  PLACEMENT_TIER_SUMMER_INTERNSHIP,
} from "../../constants/placementTiers.js";

/** PPO / placement-got-in stats columns per hub (aligned with {@link PLACEMENT_CLUSTER_* }). */
const CS_BRANCH_CODES = ["cd", "cy", "ise", "cse", "aiml"];
const EC_BRANCH_CODES = ["ece", "ete", "eie", "eee"];
const ME_BRANCH_CODES = ["ase", "iem", "me"];
const CHEM_BRANCH_CODES = ["bt", "ch", "civil"];

function gotInForBranchCode(rows, branchCode) {
  const bc = String(branchCode || "").toLowerCase();
  const hit = rows.find((row) => row.branchCode === bc);
  return hit ? Math.max(0, Number(hit.gotIn) || 0) : 0;
}

function normalizeBranchRows(rows, allowedBranchCodes) {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => ({
      branchCode: String(row?.branchCode || "").toLowerCase(),
      gotIn: Math.max(0, Number(row?.gotIn) || 0),
      converted: Math.max(0, Number(row?.converted) || 0),
      convertedNotApplicable: Boolean(row?.convertedNotApplicable),
    }))
    .filter((row) => allowedBranchCodes.includes(row.branchCode));
}

function sumGotIn(rows) {
  return rows.reduce((sum, row) => sum + row.gotIn, 0);
}

function buildFullPlacementDraftRows(placementRows, allowedBranchCodes) {
  return allowedBranchCodes.map((bc) => ({
    branchCode: bc,
    gotIn: gotInForBranchCode(placementRows, bc),
  }));
}

/** Backend-aligned: exclude branches marked conversion N/A from converted totals and acceptance denominator. */
function sumGotInApplicable(rows) {
  return rows.reduce(
    (sum, row) => sum + (row.convertedNotApplicable ? 0 : row.gotIn),
    0
  );
}

function sumConvertedApplicable(rows) {
  return rows.reduce(
    (sum, row) => sum + (row.convertedNotApplicable ? 0 : row.converted),
    0
  );
}

function StatsTab({
  company = {},
  isAdmin = false,
  onStatsUpdated,
  placementYear = DEFAULT_PLACEMENT_DETAIL_YEAR,
  /** When set from summer internship listings, hide placement-cycle “got in” (not applicable to that hub). */
  placementListContext,
  placementCluster,
}) {
  const normalizedPlacementCluster = String(placementCluster || "")
    .trim()
    .toLowerCase();
  const branchCodes =
    normalizedPlacementCluster === "ec"
      ? EC_BRANCH_CODES
      : normalizedPlacementCluster === "me"
        ? ME_BRANCH_CODES
        : normalizedPlacementCluster === "chem"
          ? CHEM_BRANCH_CODES
          : CS_BRANCH_CODES;
  const isPpoCompany = String(company?.type || "").toLowerCase().includes("ppo");
  const hidePlacementGotInByYear =
    placementListContext === PLACEMENT_TIER_SUMMER_INTERNSHIP;
  const adminGotInYear = isPlacementDetailVisitYear(placementYear)
    ? placementYear
    : DEFAULT_PLACEMENT_DETAIL_YEAR;
  const [totalGotInByYear, setTotalGotInByYear] = useState(() =>
    normalizeTotalGotInByYear(company, adminGotInYear)
  );
  const [isUpdatingTotalGotIn, setIsUpdatingTotalGotIn] = useState(false);
  const [branchFilter, setBranchFilter] = useState("all");
  const [isEditingStats, setIsEditingStats] = useState(false);
  const [savingStats, setSavingStats] = useState(false);
  const [draftRows, setDraftRows] = useState(() =>
    normalizeBranchRows(company.ppoBranchStats, branchCodes)
  );
  const [selectedBranch, setSelectedBranch] = useState(branchCodes[0] || "cd");
  const [gotInInput, setGotInInput] = useState("0");
  const [convertedInput, setConvertedInput] = useState("0");
  const [convertedNaInput, setConvertedNaInput] = useState(false);
  const [isEditingPlacementGotIn, setIsEditingPlacementGotIn] = useState(false);
  const [savingPlacementGotIn, setSavingPlacementGotIn] = useState(false);
  const [draftPlacementRows, setDraftPlacementRows] = useState(() =>
    buildFullPlacementDraftRows([], branchCodes)
  );

  const displayRows = useMemo(
    () => normalizeBranchRows(company.ppoBranchStats, branchCodes),
    [company.ppoBranchStats, branchCodes]
  );
  /** SPC add-placement / FTE conversion — separate from PPO conversion branch stats. */
  const placementGotInRows = useMemo(
    () => normalizeBranchRows(company.placementGotInBranchStats, branchCodes),
    [company.placementGotInBranchStats, branchCodes]
  );
  const applicableBranchRows = useMemo(
    () => displayRows.filter((row) => !row.convertedNotApplicable),
    [displayRows]
  );
  const hasAnyBranchNa = useMemo(
    () => displayRows.some((row) => Boolean(row.convertedNotApplicable)),
    [displayRows]
  );
  const isConvertedDataUnavailable = useMemo(() => {
    const yearNum = Number(placementYear);
    if (!Number.isFinite(yearNum) || yearNum < 2027) return false;
    if (applicableBranchRows.length === 0) return false;
    return applicableBranchRows.every((row) => Number(row?.converted || 0) === 0);
  }, [placementYear, applicableBranchRows]);
  const noApplicableBranches = applicableBranchRows.length === 0 && displayRows.length > 0;
  const shouldMaskSummary =
    noApplicableBranches ||
    (applicableBranchRows.length === 0 && displayRows.length === 0) ||
    (isConvertedDataUnavailable && !isAdmin);

  useEffect(() => {
    setTotalGotInByYear(normalizeTotalGotInByYear(company, adminGotInYear));
  }, [
    company.totalGotIn,
    company.totalGotInByYear,
    company.ppoBranchStats,
    company.placementGotInBranchStats,
    adminGotInYear,
  ]);

  useEffect(() => {
    if (!isEditingStats) return;
    const existing = draftRows.find((row) => row.branchCode === selectedBranch);
    if (existing) {
      setGotInInput(String(existing.gotIn ?? 0));
      setConvertedInput(String(existing.converted ?? 0));
      setConvertedNaInput(Boolean(existing.convertedNotApplicable));
      return;
    }
    setGotInInput("0");
    setConvertedInput("0");
    setConvertedNaInput(false);
  }, [isEditingStats, selectedBranch, draftRows]);

  useEffect(() => {
    const fallbackBranch = branchCodes[0] || "cd";
    setSelectedBranch((prev) =>
      branchCodes.includes(String(prev || "").toLowerCase()) ? prev : fallbackBranch
    );
    setDraftRows(normalizeBranchRows(company.ppoBranchStats, branchCodes));
    setDraftPlacementRows(buildFullPlacementDraftRows(placementGotInRows, branchCodes));
  }, [branchCodes, company.ppoBranchStats, placementGotInRows]);

  const filteredRows = useMemo(() => {
    if (branchFilter === "all") return displayRows;
    return displayRows.filter((row) => row.branchCode === branchFilter);
  }, [displayRows, branchFilter]);

  const overallTotals = useMemo(() => {
    const gotIn = sumGotIn(displayRows);
    const converted = sumConvertedApplicable(displayRows);
    const gotInForRate = sumGotInApplicable(displayRows);
    const acceptanceRate =
      gotInForRate > 0 ? Number(((converted / gotInForRate) * 100).toFixed(2)) : 0;
    return { gotIn, converted, acceptanceRate };
  }, [displayRows]);

  const totals = useMemo(() => {
    const gotIn = sumGotIn(filteredRows);
    const converted = sumConvertedApplicable(filteredRows);
    const gotInForRate = sumGotInApplicable(filteredRows);
    const acceptanceRate =
      gotInForRate > 0 ? Number(((converted / gotInForRate) * 100).toFixed(2)) : 0;
    return { gotIn, converted, acceptanceRate };
  }, [filteredRows]);

  const tableRows = isAdmin ? filteredRows : displayRows;
  const summary = isAdmin ? totals : overallTotals;

  /** Visit row returned for this ?year= (+ placement hub when set): same source as Roles & OA tabs. */
  const visitTotalSelectedYear = (() => {
    const raw = company?.totalGotIn;
    if (raw != null && raw !== "") {
      const n = Number(raw);
      if (Number.isFinite(n)) return Math.max(0, n);
    }
    return totalGotInByYear[adminGotInYear] ?? 0;
  })();
  const adminYearGotIn = visitTotalSelectedYear;
  const placementGotInBranchesWithCounts = useMemo(
    () =>
      branchCodes.filter((bc) => gotInForBranchCode(placementGotInRows, bc) > 0),
    [placementGotInRows, branchCodes]
  );

  const branchesForPlacementTable = useMemo(
    () => (isAdmin ? [...branchCodes] : placementGotInBranchesWithCounts),
    [isAdmin, branchCodes, placementGotInBranchesWithCounts]
  );

  const placementHubHint =
    placementListContext === PLACEMENT_TIER_OPEN_DREAM
      ? "Open dream"
      : placementListContext === PLACEMENT_TIER_DREAM
        ? "Dream"
        : null;

  const handleAdjustTotalGotIn = useCallback(
    async (delta) => {
      if (!isAdmin || isUpdatingTotalGotIn || !company?._id) return;
      try {
        setIsUpdatingTotalGotIn(true);
        const response = await adminAPI.adjustCompanyTotalGotIn(company._id, delta, {
          year: adminGotInYear,
          placementContext: placementListContext || undefined,
          companyVisitId: company?.placementCompanyVisitId || undefined,
        });
        const nextByYear =
          response.data?.totalGotInByYear != null &&
          typeof response.data.totalGotInByYear === "object"
            ? Object.fromEntries(
                PLACEMENT_DETAIL_VISIT_YEARS.map((y) => [
                  y,
                  Number(response.data.totalGotInByYear[y]) || 0,
                ])
              )
            : {
                ...totalGotInByYear,
                [adminGotInYear]: response.data?.totalGotIn ?? 0,
              };
        setTotalGotInByYear(nextByYear);
        if (typeof onStatsUpdated === "function") {
          await onStatsUpdated();
        }
      } catch (err) {
        console.error("Error updating total got in:", err);
        alert("Failed to update Got in count");
      } finally {
        setIsUpdatingTotalGotIn(false);
      }
    },
    [
      adminGotInYear,
      company?._id,
      company?.placementCompanyVisitId,
      isAdmin,
      isUpdatingTotalGotIn,
      onStatsUpdated,
      placementListContext,
      totalGotInByYear,
    ]
  );

  const placementGotInSection = useMemo(
    () => (
    <div className="bg-theme-card border border-theme rounded-xl p-6 shadow-sm" data-tour="company-tab-stats-placement-got-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
        <div>
          <h2 className="text-xl font-semibold text-theme-accent">
            Placed in by branch ({adminGotInYear})
          </h2>
          {isAdmin && placementHubHint ? (
            <p className="mt-1 text-xs text-theme-muted">
              Editing counts for the <span className="font-medium text-theme-secondary">{placementHubHint}</span>{" "}
              visit slot (same hub as the URL). Switch Dream / Open dream in the address bar to edit the other slot.
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right sm:text-right">
            <div className="text-xs font-medium text-theme-muted uppercase tracking-wide">
              Total got in
            </div>
            <div className="text-2xl font-bold text-theme-accent tabular-nums leading-tight">
              {visitTotalSelectedYear}
            </div>
          </div>
          {isAdmin ? (
            <div className="flex items-center gap-1 border-l border-theme pl-4">
              <button
                type="button"
                onClick={() => handleAdjustTotalGotIn(-1)}
                disabled={isUpdatingTotalGotIn || adminYearGotIn <= 0}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-theme bg-theme-input text-theme-primary transition-colors hover:bg-theme-nav disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Decrease got in count"
                title="Decrease got in count"
              >
                <FaMinus className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleAdjustTotalGotIn(1)}
                disabled={isUpdatingTotalGotIn}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-theme bg-theme-input text-theme-primary transition-colors hover:bg-theme-nav disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Increase got in count"
                title="Increase got in count"
              >
                <FaPlus className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : null}
        </div>
      </div>
      {!isAdmin && placementGotInBranchesWithCounts.length === 0 ? (
        <p className="text-sm text-theme-muted py-2 text-center">
          No branch rows with a count yet for {adminGotInYear}. Visit total above still reflects the visit.
        </p>
      ) : (
        <div className="max-w-md w-full mx-auto rounded-lg border border-theme overflow-hidden">
          <table className="w-full text-sm table-fixed divide-y divide-[var(--border)]">
            <thead className="bg-theme-hero">
              <tr>
                <th className="px-2 py-2 w-[42%] text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                  Branch
                </th>
                <th className="px-2 py-2 text-right text-xs font-medium text-theme-muted uppercase tracking-wider tabular-nums">
                  Got in ({adminGotInYear})
                </th>
              </tr>
            </thead>
            <tbody className="bg-theme-card divide-y divide-[var(--border)]">
              {branchesForPlacementTable.map((bc) => {
                const draft = draftPlacementRows.find((r) => r.branchCode === bc);
                const readOnlyGotIn = gotInForBranchCode(placementGotInRows, bc);
                return (
                  <tr key={bc} className="hover:bg-theme-nav/50 transition-colors">
                    <td className="px-2 py-2 font-medium text-theme-primary uppercase">{bc}</td>
                    <td className="px-2 py-2 text-right text-theme-primary tabular-nums whitespace-nowrap">
                      {isEditingPlacementGotIn && isAdmin ? (
                        <input
                          type="number"
                          min={0}
                          value={draft != null ? String(draft.gotIn) : "0"}
                          onChange={(e) => {
                            const n = Math.max(0, parseInt(e.target.value || "0", 10) || 0);
                            setDraftPlacementRows((prev) =>
                              prev.map((r) => (r.branchCode === bc ? { ...r, gotIn: n } : r))
                            );
                          }}
                          className="ml-auto block w-20 rounded-md border border-theme-input bg-theme-input px-2 py-1 text-right text-sm text-theme-primary outline-none focus:border-theme-accent"
                        />
                      ) : (
                        readOnlyGotIn
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {isAdmin ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-theme pt-4">
          <p className="text-xs text-theme-muted max-w-xl">
            Branch totals should match the story you publish; saving also sets{" "}
            <span className="font-medium text-theme-secondary">Total got in</span> to the sum of these branches.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (!isEditingPlacementGotIn) {
                  setDraftPlacementRows(
                    buildFullPlacementDraftRows(placementGotInRows, branchCodes)
                  );
                }
                setIsEditingPlacementGotIn((v) => !v);
              }}
              className="px-3 py-1.5 text-sm rounded-lg bg-theme-card border border-theme text-theme-primary hover:bg-theme-nav transition-colors"
            >
              {isEditingPlacementGotIn ? "Cancel" : "Edit branch got-in"}
            </button>
            {isEditingPlacementGotIn ? (
              <button
                type="button"
                disabled={savingPlacementGotIn}
                onClick={async () => {
                  if (!company?._id) return;
                  try {
                    setSavingPlacementGotIn(true);
                    await adminAPI.updateCompanyStats(
                      company._id,
                      { placementGotInBranchStats: draftPlacementRows },
                      {
                        year: adminGotInYear,
                        placementContext: placementListContext || undefined,
                        companyVisitId: company?.placementCompanyVisitId || undefined,
                      }
                    );
                    if (typeof onStatsUpdated === "function") {
                      await onStatsUpdated();
                    }
                    setIsEditingPlacementGotIn(false);
                  } catch (err) {
                    console.error("Error saving placement got-in by branch:", err);
                    alert(err.response?.data?.error || "Failed to save branch got-in counts");
                  } finally {
                    setSavingPlacementGotIn(false);
                  }
                }}
                className="px-4 py-1.5 rounded-lg bg-theme-accent hover:opacity-90 text-white text-sm font-semibold disabled:opacity-60 transition-opacity"
              >
                {savingPlacementGotIn ? "Saving…" : "Save branch got-in"}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
    ),
    [
      adminGotInYear,
      adminYearGotIn,
      branchesForPlacementTable,
      company?._id,
      company?.placementCompanyVisitId,
      draftPlacementRows,
      handleAdjustTotalGotIn,
      isAdmin,
      isEditingPlacementGotIn,
      isUpdatingTotalGotIn,
      onStatsUpdated,
      placementGotInBranchesWithCounts.length,
      placementGotInRows,
      placementHubHint,
      placementListContext,
      savingPlacementGotIn,
      visitTotalSelectedYear,
    ]
  );

  if (!isPpoCompany) {
    if (hidePlacementGotInByYear) {
      return (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <p className="text-sm text-theme-muted">
            Placement offer counts by year are not shown for summer internship listings.
          </p>
        </div>
      );
    }
    return (
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-theme-primary" data-tour="company-tab-stats-branch">
        {placementGotInSection}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-theme-primary">
      {!hidePlacementGotInByYear ? placementGotInSection : null}
      <div className="bg-theme-card border border-theme rounded-xl p-6 shadow-sm" data-tour="company-tab-stats-branch">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <h2 className="text-xl font-semibold text-theme-accent">Branch-wise stats</h2>
          {isAdmin && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-theme-secondary" htmlFor="ppo-stats-filter">Filter</label>
              <select
                id="ppo-stats-filter"
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-theme-input bg-theme-input text-theme-primary text-sm focus:outline-none focus:ring-2 focus:ring-theme-accent"
              >
                <option value="all">All branches</option>
                {branchCodes.map((code) => (
                  <option key={code} value={code}>{code.toUpperCase()}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="grid sm:grid-cols-3 gap-3 mb-4">
          <div className="rounded-lg border border-theme bg-theme-nav p-3" data-tour="company-tab-stats-got-in">
            <p className="text-xs text-theme-muted uppercase tracking-wide">Got in</p>
            <p className="text-lg font-semibold text-theme-primary tabular-nums">{summary.gotIn}</p>
          </div>
          <div className="rounded-lg border border-theme bg-theme-nav p-3" data-tour="company-tab-stats-converted">
            <p className="text-xs text-theme-muted uppercase tracking-wide">Converted</p>
            <p className="text-lg font-semibold text-theme-primary tabular-nums">
              {shouldMaskSummary ? "N/A" : summary.converted}
            </p>
          </div>
          <div className="rounded-lg border border-theme bg-theme-nav p-3">
            <p className="text-xs text-theme-muted uppercase tracking-wide">Acceptance rate</p>
            <p className="text-lg font-semibold text-theme-primary tabular-nums">
              {shouldMaskSummary ? "N/A" : `${summary.acceptanceRate.toFixed(2)}%`}
            </p>
          </div>
        </div>
        {shouldMaskSummary && (
          <p className="text-xs text-theme-muted mb-4">
            {noApplicableBranches
              ? "Conversion values are not tracked for any branch (all marked not applicable)."
              : isConvertedDataUnavailable && !isAdmin
              ? `Conversion values for ${placementYear} are not available yet.`
              : "Conversion summary is unavailable."}
          </p>
        )}
        {!shouldMaskSummary && hasAnyBranchNa && (
          <p className="text-xs text-theme-muted mb-4">
            Branches marked not applicable are excluded from converted totals and acceptance rate.
          </p>
        )}

        <div className="overflow-x-auto rounded-lg border border-theme" data-tour="company-tab-stats-branch-table">
          <table className="min-w-full text-sm divide-y divide-[var(--border)]">
            <thead className="bg-theme-hero">
              <tr>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">Branch</th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-theme-muted uppercase tracking-wider">Got in</th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-theme-muted uppercase tracking-wider">Converted</th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-theme-muted uppercase tracking-wider">Acceptance %</th>
              </tr>
            </thead>
            <tbody className="bg-theme-card divide-y divide-[var(--border)]">
              {tableRows.length > 0 ? (
                tableRows.map((row) => {
                  const rate = row.gotIn > 0 ? Number(((row.converted / row.gotIn) * 100).toFixed(2)) : 0;
                  const shouldMaskRow =
                    Boolean(row.convertedNotApplicable) ||
                    (isConvertedDataUnavailable && !isAdmin);
                  return (
                    <tr key={row.branchCode} className="hover:bg-theme-nav/80 transition-colors">
                      <td className="px-3 py-2.5 font-medium text-theme-primary uppercase">{row.branchCode}</td>
                      <td className="px-3 py-2.5 text-right text-theme-primary tabular-nums">{row.gotIn}</td>
                      <td className="px-3 py-2.5 text-right text-theme-primary tabular-nums">
                        {shouldMaskRow ? "N/A" : row.converted}
                      </td>
                      <td className="px-3 py-2.5 text-right text-theme-primary tabular-nums">
                        {shouldMaskRow ? "N/A" : `${rate.toFixed(2)}%`}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="px-3 py-4 text-theme-muted text-center" colSpan={4}>
                    No branch stats available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAdmin && (
        <div className="bg-theme-card border border-theme rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-theme-accent">Admin controls</h3>
            <button
              type="button"
              onClick={() => {
                if (!isEditingStats) {
                  setDraftRows(normalizeBranchRows(company.ppoBranchStats, branchCodes));
                }
                setIsEditingStats((prev) => !prev);
              }}
              className="px-3 py-1.5 text-sm rounded-lg bg-theme-card border border-theme text-theme-primary hover:bg-theme-nav transition-colors"
            >
              {isEditingStats ? "Cancel" : "Edit branch stats"}
            </button>
          </div>

          {isEditingStats && (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-4 gap-3">
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-theme-input bg-theme-input text-theme-primary text-sm focus:outline-none focus:ring-2 focus:ring-theme-accent"
                >
                  {branchCodes.map((code) => (
                    <option key={code} value={code}>{code.toUpperCase()}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0"
                  value={gotInInput}
                  onChange={(e) => setGotInInput(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-theme-input bg-theme-input text-theme-primary text-sm placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-accent"
                  placeholder="Got in"
                />
                <input
                  type="number"
                  min="0"
                  value={convertedInput}
                  onChange={(e) => setConvertedInput(e.target.value)}
                  disabled={convertedNaInput}
                  className="px-3 py-2 rounded-lg border border-theme-input bg-theme-input text-theme-primary text-sm placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-accent"
                  placeholder="Converted"
                />
                <button
                  type="button"
                  onClick={() => {
                    const gotIn = Math.max(0, parseInt(gotInInput || "0", 10) || 0);
                    const converted = convertedNaInput
                      ? 0
                      : Math.max(0, parseInt(convertedInput || "0", 10) || 0);
                    setDraftRows((prev) => {
                      const next = [...prev];
                      const idx = next.findIndex((r) => r.branchCode === selectedBranch);
                      const nextRow = {
                        branchCode: selectedBranch,
                        gotIn,
                        converted,
                        convertedNotApplicable: convertedNaInput,
                      };
                      if (idx >= 0) next[idx] = nextRow;
                      else next.push(nextRow);
                      return next;
                    });
                  }}
                  className="px-3 py-2 rounded-lg bg-theme-accent hover:opacity-90 text-white text-sm font-semibold transition-opacity"
                >
                  Add / update
                </button>
              </div>

              <label className="inline-flex items-center gap-2 text-sm text-theme-secondary">
                <input
                  type="checkbox"
                  checked={convertedNaInput}
                  onChange={(e) => setConvertedNaInput(e.target.checked)}
                  className="h-4 w-4 rounded border border-theme-input bg-theme-input text-theme-accent focus:ring-theme-accent"
                />
                Mark selected branch conversion as not applicable
              </label>

              <div className="space-y-2">
                {draftRows.length > 0 ? draftRows.map((row) => (
                  <div key={row.branchCode} className="flex items-center justify-between gap-3 rounded-lg border border-theme bg-theme-nav px-3 py-2">
                    <span className="text-sm uppercase text-theme-primary">{row.branchCode}</span>
                    <span className="text-sm text-theme-secondary">
                      Got in: {row.gotIn} | Converted: {row.convertedNotApplicable ? "N/A" : row.converted}
                    </span>
                    <label className="inline-flex items-center gap-1 text-xs text-theme-secondary">
                      <input
                        type="checkbox"
                        checked={Boolean(row.convertedNotApplicable)}
                        onChange={(e) =>
                          setDraftRows((prev) =>
                            prev.map((r) =>
                              r.branchCode === row.branchCode
                                ? { ...r, convertedNotApplicable: e.target.checked, converted: e.target.checked ? 0 : r.converted }
                                : r
                            )
                          )
                        }
                        className="h-3.5 w-3.5 rounded border border-theme-input bg-theme-input text-theme-accent"
                      />
                      N/A
                    </label>
                    <button
                      type="button"
                      onClick={() => setDraftRows((prev) => prev.filter((r) => r.branchCode !== row.branchCode))}
                      className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                )) : (
                  <p className="text-sm text-theme-muted">No draft branch stats yet.</p>
                )}
              </div>

              <button
                type="button"
                disabled={savingStats}
                onClick={async () => {
                  try {
                    setSavingStats(true);
                    await adminAPI.updateCompanyStats(
                      company._id,
                      {
                        ppoBranchStats: draftRows,
                      },
                      {
                        year: placementYear,
                        placementContext: placementListContext || undefined,
                        companyVisitId: company?.placementCompanyVisitId || undefined,
                      }
                    );
                    if (typeof onStatsUpdated === "function") {
                      await onStatsUpdated();
                    }
                    setIsEditingStats(false);
                  } catch (err) {
                    console.error("Error updating branch stats:", err);
                    alert(err.response?.data?.error || "Failed to update branch stats");
                  } finally {
                    setSavingStats(false);
                  }
                }}
                className="px-4 py-2 rounded-lg bg-theme-accent hover:opacity-90 text-white text-sm font-semibold disabled:opacity-60 transition-opacity"
              >
                {savingStats ? "Saving..." : "Save branch stats"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default StatsTab;
