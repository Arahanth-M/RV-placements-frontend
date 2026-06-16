import React, { useEffect, useState } from "react";
import { FaChartLine, FaChevronDown, FaFileExcel } from "react-icons/fa";
import { adminAPI } from "../utils/api";
import { GENERAL_STATS_YEARS } from "../constants/generalStatsYears";

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return "—";
  }
}

function formatUploadDateShort(value) {
  if (!value) return null;
  try {
    return new Date(value).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

function yearOptionLabel(year, upload) {
  if (!upload?.lastUpdatedAt) {
    return `${year} (no data yet)`;
  }
  const uploadedOn = formatUploadDateShort(upload.lastUpdatedAt);
  return uploadedOn ? `${year} · uploaded ${uploadedOn}` : `${year}`;
}

export default function AdminGeneralStatsUpload() {
  const [selectedYear, setSelectedYear] = useState(2026);
  const [fileKey, setFileKey] = useState(0);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [meta, setMeta] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);

  const loadMeta = async () => {
    try {
      const { data } = await adminAPI.getPlacementGeneralStatsMeta();
      setMeta(data);
    } catch {
      setMeta(null);
    }
  };

  useEffect(() => {
    loadMeta();
  }, []);

  useEffect(() => {
    if (!yearDropdownOpen) return undefined;
    const close = () => setYearDropdownOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [yearDropdownOpen]);

  const uploadsByYear = React.useMemo(() => {
    const map = new Map();
    if (Array.isArray(meta?.uploads)) {
      for (const row of meta.uploads) {
        map.set(row.year, row);
      }
    }
    return map;
  }, [meta]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setResult(null);

    const fileInput = event.currentTarget.elements.namedItem("general-stats-file");
    const file = fileInput?.files?.[0];
    if (!file) {
      setError("Choose an .xlsx file first.");
      return;
    }

    try {
      setUploading(true);
      const { data } = await adminAPI.importPlacementGeneralStats(selectedYear, file);
      if (!data?.success) {
        setError(data?.error || "Import failed.");
        return;
      }
      setResult(data);
      setSelectedFileName("");
      setFileKey((k) => k + 1);
      await loadMeta();
    } catch (e) {
      setError(
        e?.response?.data?.error ||
          "Failed to import general placement statistics. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-theme bg-theme-card p-6 shadow-sm">
        <div className="mb-6 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
            <FaChartLine className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-theme-accent">Update general stats</h2>
            <p className="mt-1 text-sm text-theme-secondary">
              Upload the placement statistics Excel for a year. This updates the public General Stats
              page only — no other database collections are modified.
            </p>
          </div>
        </div>

        <form key={fileKey} onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="max-w-md">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-theme-secondary">
              Placement year
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setYearDropdownOpen((prev) => !prev);
                }}
                className="flex w-full items-center justify-between rounded-lg border border-theme-input bg-theme-input px-3 py-2.5 text-left text-sm font-medium text-theme-primary outline-none transition focus:border-theme-accent focus:ring-2 focus:ring-indigo-500/30"
              >
                <span className="truncate pr-3">
                  {yearOptionLabel(selectedYear, uploadsByYear.get(selectedYear))}
                </span>
                <FaChevronDown
                  className={`shrink-0 text-xs text-theme-muted transition-transform ${
                    yearDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {yearDropdownOpen ? (
                <div
                  className="absolute left-0 right-0 z-20 mt-1 overflow-hidden rounded-lg border border-theme bg-theme-card shadow-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="max-h-56 overflow-y-auto py-1">
                    {GENERAL_STATS_YEARS.map((year) => {
                      const isSelected = year === selectedYear;
                      const upload = uploadsByYear.get(year);
                      const uploadedOn = formatUploadDateShort(upload?.lastUpdatedAt);
                      return (
                        <button
                          type="button"
                          key={year}
                          onClick={() => {
                            setSelectedYear(year);
                            setYearDropdownOpen(false);
                          }}
                          className={`flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left text-sm transition ${
                            isSelected
                              ? "bg-indigo-600/15 text-theme-primary"
                              : "text-theme-secondary hover:bg-theme-nav hover:text-theme-primary"
                          }`}
                        >
                          <span className="font-medium">{year}</span>
                          <span className="text-xs text-theme-muted">
                            {uploadedOn ? `Uploaded ${uploadedOn}` : "No data yet"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
            {uploadsByYear.has(selectedYear) ? (
              <p className="mt-2 text-xs text-theme-secondary">
                Last updated: {formatDate(uploadsByYear.get(selectedYear)?.lastUpdatedAt)}
                {uploadsByYear.get(selectedYear)?.sourceFileName
                  ? ` · ${uploadsByYear.get(selectedYear).sourceFileName}`
                  : ""}
              </p>
            ) : (
              <p className="mt-2 text-xs text-theme-secondary">
                No statistics published for {selectedYear} yet.
              </p>
            )}
          </div>

          <label
            htmlFor="general-stats-file"
            className={`group flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
              selectedFileName
                ? "border-indigo-400 dark:border-indigo-500"
                : "border-theme hover:border-indigo-400 hover:bg-indigo-50 dark:hover:border-indigo-500 dark:hover:bg-indigo-950/20"
            }`}
          >
            {selectedFileName ? (
              <>
                <FaFileExcel className="h-8 w-8 text-indigo-500" />
                <div>
                  <p className="text-sm font-semibold text-indigo-400">{selectedFileName}</p>
                  <p className="mt-0.5 text-xs text-theme-secondary">Ready to upload · click to replace</p>
                </div>
              </>
            ) : (
              <>
                <FaFileExcel className="h-10 w-10 text-emerald-500" />
                <div>
                  <p className="text-sm font-semibold text-theme-primary">
                    Drop placement statistics Excel here
                  </p>
                  <p className="mt-0.5 text-xs text-theme-secondary">
                    Same format as &quot;Placement Statistics.xlsx&quot; (.xlsx)
                  </p>
                </div>
              </>
            )}
            <input
              id="general-stats-file"
              name="general-stats-file"
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(e) => setSelectedFileName(e.target.files?.[0]?.name || "")}
              className="hidden"
            />
          </label>

          <div className="rounded-xl border border-theme bg-theme-hero px-4 py-3 text-xs text-theme-secondary">
            <p className="font-medium text-theme-primary">Expected columns</p>
            <p className="mt-1">
              Company Name, Month, Stipend, CTC, department columns (CSE, ECE, …), BE Total
            </p>
          </div>

          {error ? (
            <p className="rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          ) : null}

          {result?.success ? (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
              <p className="font-medium">{result.message}</p>
              <p className="mt-1 text-xs opacity-90">
                Total offers: {result.totalOffers} · Companies: {result.companiesRecruited}
              </p>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={uploading}
            className="inline-flex w-fit items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploading ? "Uploading…" : "Upload and update stats"}
          </button>
        </form>
      </div>
    </div>
  );
}
