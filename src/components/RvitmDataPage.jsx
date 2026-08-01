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

function emptyRole() {
  return { roleName: "", internshipStipend: "", ctcJson: "{}" };
}

function emptyGotIn() {
  return { branchCode: "", gotIn: "0" };
}

function rolesToDraft(roles) {
  const list = Array.isArray(roles) ? roles : [];
  if (list.length === 0) return [emptyRole()];
  return list.map((r) => ({
    roleName: r?.roleName != null ? String(r.roleName) : "",
    internshipStipend:
      r?.internshipStipend != null && r.internshipStipend !== ""
        ? String(r.internshipStipend)
        : "",
    ctcJson: JSON.stringify(r?.ctc && typeof r.ctc === "object" ? r.ctc : {}, null, 0),
  }));
}

function gotInToDraft(rows) {
  const list = Array.isArray(rows) ? rows : [];
  if (list.length === 0) return [emptyGotIn()];
  return list.map((r) => ({
    branchCode: r?.branchCode != null ? String(r.branchCode) : "",
    gotIn: r?.gotIn != null ? String(r.gotIn) : "0",
  }));
}

function draftForRow(row) {
  return {
    roles: rolesToDraft(row?.sourceRvitmRoles),
    gotIn: gotInToDraft(row?.sourceRvitmGotIn),
  };
}

function parseCtcJson(raw, companyName) {
  const text = String(raw ?? "").trim() || "{}";
  try {
    const parsed = JSON.parse(text);
    if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("CTC must be a JSON object");
    }
    return parsed;
  } catch (err) {
    throw new Error(
      `Invalid CTC JSON for ${companyName}: ${err?.message || "parse error"}`
    );
  }
}

export default function RvitmDataPage() {
  const [year, setYear] = useState(String(DEFAULT_PLACEMENT_DETAIL_YEAR));
  const [statusFilter, setStatusFilter] = useState("pending");
  const [items, setItems] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [expandedId, setExpandedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [query, setQuery] = useState("");
  const [meta, setMeta] = useState({ pending: 0, filled: 0, count: 0 });

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const load = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const { data } = await adminAPI.listRvitmData(year);
      const list = (Array.isArray(data?.items) ? data.items : []).map((row) => ({
        ...row,
        filled: Boolean(row.filled ?? row.applied),
      }));
      setItems(list);
      setMeta({
        pending: Number(data?.pending) || 0,
        filled: Number(data?.filled ?? data?.applied) || 0,
        count: Number(data?.count) || list.length,
      });
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
          "Failed to load RVITM company list."
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
    return items.filter((row) => {
      if (statusFilter === "pending" && row.filled) return false;
      if (statusFilter === "filled" && !row.filled) return false;
      if (!q) return true;
      const hay = [
        row.companyName,
        row.clusterLabel,
        row.cluster,
        row.clusterKey,
        row.type,
        String(row.year || ""),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [items, query, statusFilter]);

  const updateDraft = (visitId, patch) => {
    setDrafts((prev) => ({
      ...prev,
      [visitId]: { ...(prev[visitId] || draftForRow({})), ...patch },
    }));
  };

  const handleSave = async (row) => {
    const visitId = row.visitId;
    const draft = drafts[visitId] || draftForRow(row);

    let rolesPayload;
    let gotInPayload;
    try {
      rolesPayload = (draft.roles || [])
        .filter((r) => String(r.roleName || "").trim())
        .map((r) => ({
          roleName: String(r.roleName).trim(),
          internshipStipend:
            String(r.internshipStipend || "").trim() === ""
              ? undefined
              : Number(r.internshipStipend),
          ctc: parseCtcJson(r.ctcJson, row.companyName),
          collegeId: "rvitm",
        }));
      gotInPayload = (draft.gotIn || [])
        .filter((r) => String(r.branchCode || "").trim())
        .map((r) => ({
          branchCode: String(r.branchCode).trim().toLowerCase(),
          gotIn: Math.max(0, Number.parseInt(String(r.gotIn ?? 0), 10) || 0),
          collegeId: "rvitm",
        }));
    } catch (err) {
      setError(err.message || "Invalid form data");
      return;
    }

    if (rolesPayload.length === 0 && gotInPayload.length === 0) {
      setError(`Add at least one RVITM role or got-in row for ${row.companyName}.`);
      return;
    }

    setError("");
    setSavingId(visitId);
    try {
      await adminAPI.saveRvitmData(visitId, {
        roles: rolesPayload,
        placementGotInBranchStats: gotInPayload,
      });
      setItems((prev) =>
        prev.map((item) =>
          item.visitId === visitId
            ? {
                ...item,
                filled: true,
                applied: true,
                sourceRvitmRoles: rolesPayload,
                sourceRvitmGotIn: gotInPayload,
              }
            : item
        )
      );
      setMeta((prev) => ({
        ...prev,
        pending: Math.max(0, (prev.pending || 0) - (row.filled ? 0 : 1)),
        filled: (prev.filled || 0) + (row.filled ? 0 : 1),
      }));
      setToast({
        type: "success",
        message: `Saved RVITM data for ${row.companyName} to company_visits_with_rvitm.`,
      });
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.details ||
          err.response?.data?.error ||
          "Failed to save RVITM data."
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
            Add RVITM roles &amp; got-in
          </h1>
          <p className="mt-2 text-sm text-slate-400 max-w-3xl">
            Companies from{" "}
            <code className="text-slate-300">company_visits_with_rvitm</code>.
            Saving updates that collection only (not{" "}
            <code className="text-slate-300">company_visits</code>), with{" "}
            <code className="text-slate-300">collegeId: &quot;rvitm&quot;</code>{" "}
            on roles and placementGotInBranchStats. Existing RVCE rows stay
            tagged <code className="text-slate-300">rvce</code>.
          </p>
        </header>

        <div className="flex flex-col lg:flex-row gap-3 lg:items-end mb-5">
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
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
            >
              <option value="pending">Needs data (stub / zeros)</option>
              <option value="filled">Has RVITM data</option>
              <option value="all">All</option>
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
            : `${filtered.length} shown · ${meta.pending} need data · ${meta.filled} filled · ${meta.count} total`}
        </p>

        <div className="space-y-3">
          {!loading && filtered.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-10 text-center text-slate-400">
              No matching visits in company_visits_with_rvitm for this filter.
            </div>
          ) : null}

          {filtered.map((row) => {
            const busy = savingId === row.visitId;
            const open = expandedId === row.visitId;
            const draft = drafts[row.visitId] || draftForRow(row);
            return (
              <div
                key={row.visitId}
                className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedId((id) => (id === row.visitId ? "" : row.visitId))
                  }
                  className="w-full text-left px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 hover:bg-slate-800/40"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-100 truncate">
                      {row.companyName}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {row.year} · {row.type || "—"} · {row.clusterLabel}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        row.filled
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-sky-500/20 text-sky-300"
                      }`}
                    >
                      {row.filled ? "filled" : "needs data"}
                    </span>
                    <span className="text-xs text-slate-500">
                      {open ? "Hide" : "Edit"}
                    </span>
                  </div>
                </button>

                {open ? (
                  <div className="border-t border-slate-800 px-4 py-4 space-y-5">
                    <section>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          RVITM roles
                        </h3>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            updateDraft(row.visitId, {
                              roles: [...(draft.roles || []), emptyRole()],
                            })
                          }
                          className="text-xs text-indigo-300 hover:text-indigo-200"
                        >
                          + Add role
                        </button>
                      </div>
                      <div className="space-y-3">
                        {(draft.roles || []).map((role, idx) => (
                          <div
                            key={`role-${idx}`}
                            className="grid grid-cols-1 md:grid-cols-12 gap-2 rounded-lg border border-slate-800 bg-slate-950/50 p-3"
                          >
                            <div className="md:col-span-4">
                              <label className="block text-[11px] text-slate-500 mb-1">
                                Role name
                              </label>
                              <input
                                value={role.roleName}
                                disabled={busy}
                                onChange={(e) => {
                                  const roles = [...draft.roles];
                                  roles[idx] = {
                                    ...roles[idx],
                                    roleName: e.target.value,
                                  };
                                  updateDraft(row.visitId, { roles });
                                }}
                                className="w-full rounded-md border border-slate-600 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-[11px] text-slate-500 mb-1">
                                Stipend
                              </label>
                              <input
                                type="number"
                                value={role.internshipStipend}
                                disabled={busy}
                                onChange={(e) => {
                                  const roles = [...draft.roles];
                                  roles[idx] = {
                                    ...roles[idx],
                                    internshipStipend: e.target.value,
                                  };
                                  updateDraft(row.visitId, { roles });
                                }}
                                className="w-full rounded-md border border-slate-600 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
                              />
                            </div>
                            <div className="md:col-span-5">
                              <label className="block text-[11px] text-slate-500 mb-1">
                                CTC (JSON object)
                              </label>
                              <input
                                value={role.ctcJson}
                                disabled={busy}
                                onChange={(e) => {
                                  const roles = [...draft.roles];
                                  roles[idx] = {
                                    ...roles[idx],
                                    ctcJson: e.target.value,
                                  };
                                  updateDraft(row.visitId, { roles });
                                }}
                                className="w-full rounded-md border border-slate-600 bg-slate-950 px-2 py-1.5 text-sm text-slate-100 font-mono"
                              />
                            </div>
                            <div className="md:col-span-1 flex items-end">
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => {
                                  const roles = draft.roles.filter((_, i) => i !== idx);
                                  updateDraft(row.visitId, {
                                    roles: roles.length ? roles : [emptyRole()],
                                  });
                                }}
                                className="text-xs text-red-400 hover:text-red-300 py-2"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          RVITM got-in by branch
                        </h3>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            updateDraft(row.visitId, {
                              gotIn: [...(draft.gotIn || []), emptyGotIn()],
                            })
                          }
                          className="text-xs text-indigo-300 hover:text-indigo-200"
                        >
                          + Add branch
                        </button>
                      </div>
                      <div className="space-y-2">
                        {(draft.gotIn || []).map((g, idx) => (
                          <div
                            key={`gotin-${idx}`}
                            className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end"
                          >
                            <div className="sm:col-span-5">
                              <label className="block text-[11px] text-slate-500 mb-1">
                                Branch code
                              </label>
                              <input
                                value={g.branchCode}
                                disabled={busy}
                                placeholder="cse / ise / ece"
                                onChange={(e) => {
                                  const gotIn = [...draft.gotIn];
                                  gotIn[idx] = {
                                    ...gotIn[idx],
                                    branchCode: e.target.value,
                                  };
                                  updateDraft(row.visitId, { gotIn });
                                }}
                                className="w-full rounded-md border border-slate-600 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
                              />
                            </div>
                            <div className="sm:col-span-4">
                              <label className="block text-[11px] text-slate-500 mb-1">
                                Got in
                              </label>
                              <input
                                type="number"
                                min={0}
                                value={g.gotIn}
                                disabled={busy}
                                onChange={(e) => {
                                  const gotIn = [...draft.gotIn];
                                  gotIn[idx] = {
                                    ...gotIn[idx],
                                    gotIn: e.target.value,
                                  };
                                  updateDraft(row.visitId, { gotIn });
                                }}
                                className="w-full rounded-md border border-slate-600 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
                              />
                            </div>
                            <div className="sm:col-span-3">
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => {
                                  const gotIn = draft.gotIn.filter((_, i) => i !== idx);
                                  updateDraft(row.visitId, {
                                    gotIn: gotIn.length ? gotIn : [emptyGotIn()],
                                  });
                                }}
                                className="text-xs text-red-400 hover:text-red-300 py-2"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>

                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => handleSave(row)}
                        disabled={busy || loading}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                      >
                        {busy ? "Saving…" : "Save to company_visits_with_rvitm"}
                      </button>
                      <span className="text-xs text-slate-500">
                        Writes collegeId=&quot;rvitm&quot; on roles + got-in in
                        company_visits_with_rvitm only.
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
