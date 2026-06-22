import React, { useEffect, useMemo, useState } from "react";
import { adminAPI } from "../utils/api";
import { FaChevronDown, FaFileExcel } from "react-icons/fa";
import { formatInternshipStipendDisplay } from "../utils/compensationDisplay.js";

import { formatPpoBranchLabel, formatPpoProgramName, normalizePpoBranchCode } from "../constants/ppoBranchCodes.js";

const YEAR_OPTIONS_FALLBACK = [];

function titleCaseBranch(code) {
  return formatPpoProgramName(code);
}

function branchChipLabel(code) {
  const normalized = normalizePpoBranchCode(code);
  return normalized ? normalized.toUpperCase() : "—";
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
      setExpandedRows(new Set());
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
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-theme-accent">
              Student Placement Stats
            </h2>
            <p className="mt-1 text-sm text-theme-secondary">
              Program-wise placed students for the selected placement year.
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
          {/* Branch selector */}
          <div className="rounded-xl border border-theme bg-theme-card p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-theme-secondary">
                Programmes
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
                    onClick={() => {
                      setOpenBranchCode(code);
                      setExpandedRows(new Set());
                    }}
                    title={formatPpoBranchLabel(code)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      isActive
                        ? "border-indigo-500 bg-indigo-600 text-white"
                        : "border-theme bg-theme-hero text-theme-primary hover:bg-theme-nav"
                    }`}
                  >
                    {branchChipLabel(code)}{" "}
                    <span className={isActive ? "opacity-80" : "opacity-60"}>
                      {Number(branch.count) || 0}
                    </span>
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
                        No students found for this program.
                      </p>
                    ) : (
                      students.map((student, idx) => {
                        const rowKey = `${student.usn || student.email || "row"}-${idx}`;
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
                </div>
              );
            })}
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