import React, { useEffect, useMemo, useState } from "react";
import { adminAPI } from "../utils/api";
import { FaChevronDown, FaFileExcel } from "react-icons/fa";

const YEAR_OPTIONS_FALLBACK = [];

function titleCaseBranch(code) {
  const c = String(code || "").trim();
  if (!c) return "Unknown";
  return c.toUpperCase();
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

  const totalStudents = useMemo(
    () => branches.reduce((sum, b) => sum + (Number(b?.count) || 0), 0),
    [branches]
  );

  const loadData = async (yearArg) => {
    try {
      setLoading(true);
      setError("");
      const year = yearArg == null || yearArg === "" ? undefined : Number(yearArg);
      const { data } = await adminAPI.getStudentPlacementStats(year);
      const apiYears = Array.isArray(data?.years) ? data.years : [];
      const apiSelected =
        data?.selectedYear != null ? String(data.selectedYear) : "";
      setYears(apiYears);
      setSelectedYear(apiSelected);
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
    } catch (e) {
      console.error("Failed to load student placement stats:", e);
      setError("Failed to load student placement stats. Please try again.");
      setBranches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleYearChange = async (event) => {
    const year = event.target.value;
    setSelectedYear(year);
    await loadData(year);
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
      const fileName = match?.[1] || `student-placement-stats-${selectedYear || "all"}.xlsx`;

      const blob = new Blob([response.data], {
        type:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
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

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-theme bg-theme-card p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-theme-accent">
              Student Placement Stats
            </h2>
            <p className="mt-1 text-sm text-theme-secondary">
              Branch-wise placed students for the selected placement year.
            </p>
          </div>
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

        <div className="rounded-lg border border-theme bg-theme-hero px-4 py-3 text-sm text-theme-secondary">
          Total placed students shown:{" "}
          <span className="font-semibold text-theme-primary">{totalStudents}</span>
        </div>
      </div>

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
          <div className="rounded-xl border border-theme bg-theme-card p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-theme-secondary">
                Branch Codes
              </p>
              <button
                type="button"
                onClick={handleExport}
                disabled={exporting || loading || years.length === 0}
                className="inline-flex h-[34px] items-center gap-2 rounded-lg border border-theme bg-theme-hero px-3 text-xs font-semibold text-theme-secondary transition hover:bg-theme-nav disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FaFileExcel className="h-4 w-4 text-emerald-500" />
                {exporting ? "Exporting..." : "Export as Excel"}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {branches.map((branch) => {
                const code = String(branch.branchCode);
                const isActive = openBranchCode === code;
                return (
                  <button
                    type="button"
                    key={code}
                    onClick={() => setOpenBranchCode(code)}
                    className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                      isActive
                        ? "border-indigo-500 bg-indigo-600 text-white"
                        : "border-theme bg-theme-hero text-theme-primary hover:bg-theme-nav"
                    }`}
                  >
                    {titleCaseBranch(code)} ({Number(branch.count) || 0})
                  </button>
                );
              })}
            </div>
          </div>

          {branches
            .filter((branch) => String(branch.branchCode) === openBranchCode)
            .map((branch) => (
          <div
            key={String(branch.branchCode)}
            className="rounded-xl border border-theme bg-theme-card p-5 shadow-sm"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-theme-primary">
                {titleCaseBranch(branch.branchCode)}
              </h3>
              <span className="rounded-full bg-indigo-600/15 px-3 py-1 text-xs font-semibold text-indigo-400">
                {Number(branch.count) || 0} students
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-theme">
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-theme-secondary">
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">USN</th>
                    <th className="px-3 py-2">Email ID</th>
                    <th className="px-3 py-2">Company Placed</th>
                    <th className="px-3 py-2">Stipend</th>
                    <th className="px-3 py-2">CTC</th>
                    <th className="px-3 py-2">Role</th>
                    <th className="px-3 py-2">PPO Conversion Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme text-sm text-theme-primary">
                  {(Array.isArray(branch.students) ? branch.students : []).map(
                    (student, idx) => (
                      <tr key={`${student.usn || student.email || "row"}-${idx}`}>
                        <td className="px-3 py-2">{student.name || "-"}</td>
                        <td className="px-3 py-2 font-mono text-xs">
                          {student.usn || "-"}
                        </td>
                        <td className="px-3 py-2">{student.email || "-"}</td>
                        <td className="px-3 py-2">{student.companyPlaced || "-"}</td>
                        <td className="px-3 py-2">{student.stipend || "-"}</td>
                        <td className="px-3 py-2">{student.ctc || "-"}</td>
                        <td className="px-3 py-2">{student.role || "-"}</td>
                        <td className="px-3 py-2">
                          {student.ppoConversionType || ""}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ))}
        </div>
      )}
    </div>
  );
}
