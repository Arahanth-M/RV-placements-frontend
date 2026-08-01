import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { adminAPI } from "../utils/api";
import {
  DEFAULT_PLACEMENT_DETAIL_YEAR,
  PLACEMENT_DETAIL_VISIT_YEARS,
} from "../constants/placementYears.js";
import {
  PageBackButton,
  PageBackNavRow,
  PageHeroFontStyles,
  pageShellInnerClass,
  pageShellOuterClassCompact,
} from "./PageBackNav.jsx";

function emptyDraft() {
  return { minCgpa: "", eligibility: "" };
}

function draftForRow(row) {
  return {
    minCgpa: "",
    eligibility: row?.eligibility != null ? String(row.eligibility) : "",
  };
}

export default function MinCgpaGapsPage() {
  const [year, setYear] = useState(String(DEFAULT_PLACEMENT_DETAIL_YEAR));
  const [items, setItems] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const load = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const { data } = await adminAPI.listMinCgpaGaps(year);
      const list = Array.isArray(data?.items) ? data.items : [];
      setItems(list);
      const nextDrafts = {};
      for (const row of list) {
        nextDrafts[row.visitId] = draftForRow(row);
      }
      setDrafts(nextDrafts);
    } catch (err) {
      console.error(err);
      setItems([]);
      setDrafts({});
      setError(
        err.response?.data?.details ||
          err.response?.data?.error ||
          "Failed to load companies missing minCgpa."
      );
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((row) => {
      const hay = [
        row.companyName,
        row.clusterLabel,
        row.cluster,
        row.clusterKey,
        row.type,
        row.eligibility,
        drafts[row.visitId]?.eligibility,
        String(row.year || ""),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [items, query, drafts]);

  const updateDraft = (visitId, patch) => {
    setDrafts((prev) => ({
      ...prev,
      [visitId]: { ...(prev[visitId] || emptyDraft()), ...patch },
    }));
  };

  const handleSave = async (row) => {
    const visitId = row.visitId;
    const draft = drafts[visitId] || emptyDraft();
    const rawMin = String(draft.minCgpa ?? "").trim();
    const eligibility = String(draft.eligibility ?? "");
    const eligibilityChanged = eligibility !== String(row.eligibility || "");

    if (!rawMin && !eligibilityChanged) {
      setError(`Enter a min CGPA and/or change eligibility for ${row.companyName}.`);
      return;
    }

    /** @type {{ minCgpa?: number, eligibility?: string }} */
    const payload = {};
    if (rawMin) {
      const n = Number(rawMin.replace(/,/g, ""));
      if (!Number.isFinite(n) || n < 0 || n > 10) {
        setError(`Enter a min CGPA between 0 and 10 for ${row.companyName}.`);
        return;
      }
      payload.minCgpa = n;
    }
    if (eligibilityChanged) {
      payload.eligibility = eligibility;
    }

    setError("");
    setSavingId(visitId);
    try {
      await adminAPI.setVisitMinCgpa(visitId, payload);
      if (payload.minCgpa != null) {
        setItems((prev) => prev.filter((item) => item.visitId !== visitId));
        setDrafts((prev) => {
          const next = { ...prev };
          delete next[visitId];
          return next;
        });
      } else {
        setItems((prev) =>
          prev.map((item) =>
            item.visitId === visitId
              ? { ...item, eligibility: payload.eligibility ?? item.eligibility }
              : item
          )
        );
      }
      const parts = [];
      if (payload.minCgpa != null) parts.push(`minCgpa ${payload.minCgpa}`);
      if (payload.eligibility != null) parts.push("eligibility");
      setToast({
        type: "success",
        message: `Saved ${parts.join(" + ")} for ${row.companyName} (${row.clusterLabel}).`,
      });
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.details ||
          err.response?.data?.error ||
          "Failed to save visit."
      );
    } finally {
      setSavingId("");
    }
  };

  return (
    <div className={`min-h-screen ${pageShellOuterClassCompact}`}>
      <PageHeroFontStyles />
      {toast?.message ? (
        <div
          className={`fixed right-4 top-4 z-[90] rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-xl ${
            toast.type === "error" ? "bg-red-600" : "bg-green-600"
          }`}
        >
          {toast.message}
        </div>
      ) : null}

      <div className={pageShellInnerClass}>
        <PageBackNavRow>
          <PageBackButton to="/" />
          <Link
            to="/admin/dashboard"
            className="text-sm text-slate-400 hover:text-indigo-300 transition-colors"
          >
            Admin dashboard
          </Link>
        </PageBackNavRow>

        <header className="mb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-indigo-400/80 mb-2">
            Temporary admin tool
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-white">
            Missing min CGPA
          </h1>
          <p className="mt-2 text-sm text-slate-400 max-w-2xl">
            Company visit rows with no{" "}
            <code className="text-slate-300">minCgpa</code>. Edit eligibility
            text and/or set a cutoff (0–10) per company + cluster; both are
            stored on that visit in the database.
          </p>
        </header>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-end mb-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
              Year
            </label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
            >
              {PLACEMENT_DETAIL_VISIT_YEARS.map((y) => (
                <option key={y} value={String(y)}>
                  {y}
                </option>
              ))}
              <option value="all">All years</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
              Search
            </label>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Company, cluster, type…"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
            />
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-700 disabled:opacity-50"
          >
            Refresh
          </button>
        </div>

        {error ? (
          <p className="mb-4 text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        <p className="mb-3 text-xs text-slate-500">
          {loading
            ? "Loading…"
            : `${filtered.length} row${filtered.length === 1 ? "" : "s"}${
                query.trim() ? " matching search" : ""
              } · ${items.length} total missing for this year filter`}
        </p>

        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Company</th>
                <th className="px-4 py-3 font-semibold">Year</th>
                <th className="px-4 py-3 font-semibold">Cluster</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold min-w-[16rem]">Eligibility</th>
                <th className="px-4 py-3 font-semibold">minCgpa</th>
                <th className="px-4 py-3 font-semibold" />
              </tr>
            </thead>
            <tbody>
              {!loading && filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-slate-400"
                  >
                    No visits missing minCgpa for this filter.
                  </td>
                </tr>
              ) : null}
              {filtered.map((row) => {
                const busy = savingId === row.visitId;
                const draft = drafts[row.visitId] || draftForRow(row);
                return (
                  <tr
                    key={row.visitId}
                    className="border-b border-slate-800/80 align-top hover:bg-slate-800/40"
                  >
                    <td className="px-4 py-3 text-slate-100 font-medium">
                      {row.companyName}
                      <div className="mt-0.5 text-[11px] text-slate-500 font-normal">
                        {row.companyId}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{row.year ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-300">
                      <div>{row.clusterLabel}</div>
                      <div className="text-[11px] text-slate-500">
                        {row.clusterKey}
                        {row.cluster ? ` · ${row.cluster}` : ""}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {row.type || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <textarea
                        value={draft.eligibility}
                        onChange={(e) =>
                          updateDraft(row.visitId, { eligibility: e.target.value })
                        }
                        rows={4}
                        disabled={busy}
                        placeholder="Eligibility text…"
                        className="w-full min-w-[14rem] max-w-md rounded-md border border-slate-600 bg-slate-950 px-2 py-1.5 text-xs leading-relaxed text-slate-100 disabled:opacity-50"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={0}
                        max={10}
                        step={0.1}
                        inputMode="decimal"
                        value={draft.minCgpa}
                        onChange={(e) =>
                          updateDraft(row.visitId, { minCgpa: e.target.value })
                        }
                        placeholder="e.g. 7.5"
                        disabled={busy}
                        className="w-24 rounded-md border border-slate-600 bg-slate-950 px-2 py-1.5 text-slate-100 disabled:opacity-50"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleSave(row)}
                        disabled={busy || loading}
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                      >
                        {busy ? "Saving…" : "Save"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
