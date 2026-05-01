import React, { useMemo, useState } from "react";
import { adminAPI } from "../../utils/api";

const BRANCH_CODES = ["cd", "cy", "ise", "cse", "aiml", "bt"];

function normalizeBranchRows(rows) {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => ({
      branchCode: String(row?.branchCode || "").toLowerCase(),
      gotIn: Math.max(0, Number(row?.gotIn) || 0),
      converted: Math.max(0, Number(row?.converted) || 0),
    }))
    .filter((row) => BRANCH_CODES.includes(row.branchCode));
}

function StatsTab({ company = {}, isAdmin = false, onStatsUpdated, placementYear = 2026 }) {
  const isPpoCompany = String(company?.type || "").toLowerCase().includes("ppo");
  const [branchFilter, setBranchFilter] = useState("all");
  const [isEditingStats, setIsEditingStats] = useState(false);
  const [savingStats, setSavingStats] = useState(false);
  const [draftRows, setDraftRows] = useState(() => normalizeBranchRows(company.ppoBranchStats));
  const [selectedBranch, setSelectedBranch] = useState("cd");
  const [gotInInput, setGotInInput] = useState("0");
  const [convertedInput, setConvertedInput] = useState("0");

  const displayRows = useMemo(() => normalizeBranchRows(company.ppoBranchStats), [company.ppoBranchStats]);

  const filteredRows = useMemo(() => {
    if (branchFilter === "all") return displayRows;
    return displayRows.filter((row) => row.branchCode === branchFilter);
  }, [displayRows, branchFilter]);

  const overallTotals = useMemo(() => {
    const gotIn = displayRows.reduce((sum, row) => sum + row.gotIn, 0);
    const converted = displayRows.reduce((sum, row) => sum + row.converted, 0);
    const acceptanceRate = gotIn > 0 ? Number(((converted / gotIn) * 100).toFixed(2)) : 0;
    return { gotIn, converted, acceptanceRate };
  }, [displayRows]);

  const totals = useMemo(() => {
    const gotIn = filteredRows.reduce((sum, row) => sum + row.gotIn, 0);
    const converted = filteredRows.reduce((sum, row) => sum + row.converted, 0);
    const acceptanceRate = gotIn > 0 ? Number(((converted / gotIn) * 100).toFixed(2)) : 0;
    return { gotIn, converted, acceptanceRate };
  }, [filteredRows]);

  const tableRows = isAdmin ? filteredRows : displayRows;
  const summary = isAdmin ? totals : overallTotals;

  if (!isPpoCompany) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6 text-theme-secondary">
        <div className="bg-theme-card border border-theme rounded-xl p-6 shadow-sm">
          Stats are currently available for Internship (PPO) companies only.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-theme-primary">
      <div className="bg-theme-card border border-theme rounded-xl p-6 shadow-sm">
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
                {BRANCH_CODES.map((code) => (
                  <option key={code} value={code}>{code.toUpperCase()}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="grid sm:grid-cols-3 gap-3 mb-4">
          <div className="rounded-lg border border-theme bg-theme-nav p-3">
            <p className="text-xs text-theme-muted uppercase tracking-wide">Total Got in</p>
            <p className="text-lg font-semibold text-theme-primary tabular-nums">{summary.gotIn}</p>
          </div>
          <div className="rounded-lg border border-theme bg-theme-nav p-3">
            <p className="text-xs text-theme-muted uppercase tracking-wide">Total Converted</p>
            <p className="text-lg font-semibold text-theme-primary tabular-nums">{summary.converted}</p>
          </div>
          <div className="rounded-lg border border-theme bg-theme-nav p-3">
            <p className="text-xs text-theme-muted uppercase tracking-wide">Overall Conversion rate</p>
            <p className="text-lg font-semibold text-theme-primary tabular-nums">{summary.acceptanceRate.toFixed(2)}%</p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-theme">
          <table className="min-w-full text-sm divide-y divide-[var(--border)]">
            <thead className="bg-theme-hero">
              <tr>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">Branch</th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-theme-muted uppercase tracking-wider">Got in</th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-theme-muted uppercase tracking-wider">Converted</th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-theme-muted uppercase tracking-wider">Conversion %</th>
              </tr>
            </thead>
            <tbody className="bg-theme-card divide-y divide-[var(--border)]">
              {tableRows.length > 0 ? (
                tableRows.map((row) => {
                  const rate = row.gotIn > 0 ? Number(((row.converted / row.gotIn) * 100).toFixed(2)) : 0;
                  return (
                    <tr key={row.branchCode} className="hover:bg-theme-nav/80 transition-colors">
                      <td className="px-3 py-2.5 font-medium text-theme-primary uppercase">{row.branchCode}</td>
                      <td className="px-3 py-2.5 text-right text-theme-primary tabular-nums">{row.gotIn}</td>
                      <td className="px-3 py-2.5 text-right text-theme-primary tabular-nums">{row.converted}</td>
                      <td className="px-3 py-2.5 text-right text-theme-primary tabular-nums">{rate.toFixed(2)}%</td>
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
                  setDraftRows(normalizeBranchRows(company.ppoBranchStats));
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
                  {BRANCH_CODES.map((code) => (
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
                  className="px-3 py-2 rounded-lg border border-theme-input bg-theme-input text-theme-primary text-sm placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-accent"
                  placeholder="Converted"
                />
                <button
                  type="button"
                  onClick={() => {
                    const gotIn = Math.max(0, parseInt(gotInInput || "0", 10) || 0);
                    const converted = Math.max(0, parseInt(convertedInput || "0", 10) || 0);
                    setDraftRows((prev) => {
                      const next = [...prev];
                      const idx = next.findIndex((r) => r.branchCode === selectedBranch);
                      if (idx >= 0) next[idx] = { branchCode: selectedBranch, gotIn, converted };
                      else next.push({ branchCode: selectedBranch, gotIn, converted });
                      return next;
                    });
                  }}
                  className="px-3 py-2 rounded-lg bg-theme-accent hover:opacity-90 text-white text-sm font-semibold transition-opacity"
                >
                  Add / update
                </button>
              </div>

              <div className="space-y-2">
                {draftRows.length > 0 ? draftRows.map((row) => (
                  <div key={row.branchCode} className="flex items-center justify-between gap-3 rounded-lg border border-theme bg-theme-nav px-3 py-2">
                    <span className="text-sm uppercase text-theme-primary">{row.branchCode}</span>
                    <span className="text-sm text-theme-secondary">Got in: {row.gotIn} | Converted: {row.converted}</span>
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
                      { ppoBranchStats: draftRows },
                      { year: placementYear }
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
