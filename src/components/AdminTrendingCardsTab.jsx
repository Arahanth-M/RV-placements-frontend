import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FaFire } from "react-icons/fa";
import { adminAPI } from "../utils/api";
import ThemedSelect from "./ThemedSelect.jsx";
import DashboardRefreshButton from "./DashboardRefreshButton.jsx";
import { PLACEMENT_HUB_CLUSTER_LABELS } from "../constants/placementTiers.js";

function visitLabel(row) {
  const year = row?.year ? String(row.year) : "Year n/a";
  const cluster =
    PLACEMENT_HUB_CLUSTER_LABELS[row?.clusterKey] || row?.cluster || "Cluster n/a";
  const type = String(row?.type || "").trim() || "Type n/a";
  return `${year} · ${cluster} · ${type}`;
}

function remainingLabel(expiresAt) {
  const exp = expiresAt ? new Date(expiresAt).getTime() : 0;
  if (!exp) return "";
  const ms = exp - Date.now();
  if (ms <= 0) return "expired";
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  if (hours >= 1) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

export default function AdminTrendingCardsTab() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [suggesting, setSuggesting] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [visits, setVisits] = useState([]);
  const [visitId, setVisitId] = useState("");
  const [loadingVisits, setLoadingVisits] = useState(false);
  const [pinning, setPinning] = useState(false);
  const [items, setItems] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadPinned = useCallback(async () => {
    setListLoading(true);
    setError("");
    try {
      const res = await adminAPI.listTrendingCards();
      setItems(Array.isArray(res.data?.items) ? res.data.items : []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to load trending cards.");
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPinned();
  }, [loadPinned]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return undefined;
    }
    const t = setTimeout(() => {
      setSuggesting(true);
      adminAPI
        .companySuggest(q, 12)
        .then((res) => {
          setSuggestions(Array.isArray(res.data?.items) ? res.data.items : []);
        })
        .catch(() => setSuggestions([]))
        .finally(() => setSuggesting(false));
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const loadVisits = async (company) => {
    setSelectedCompany(company);
    setQuery(company.name || "");
    setSuggestions([]);
    setVisitId("");
    setLoadingVisits(true);
    try {
      const res = await adminAPI.listTrendingCardVisits(company.id);
      const next = Array.isArray(res.data?.items) ? res.data.items : [];
      setVisits(next);
      if (next[0]?.visitId) setVisitId(next[0].visitId);
    } catch (err) {
      console.error(err);
      setVisits([]);
      setError(err.response?.data?.error || "Failed to load company cards.");
    } finally {
      setLoadingVisits(false);
    }
  };

  const visitOptions = useMemo(
    () =>
      visits.map((row) => ({
        value: row.visitId,
        label: visitLabel(row),
      })),
    [visits]
  );

  const handlePin = async (e) => {
    e.preventDefault();
    if (!visitId) return;
    setPinning(true);
    setError("");
    setMessage("");
    try {
      const res = await adminAPI.pinTrendingCard(visitId);
      setMessage(res.data?.message || "Marked trending for 24 hours.");
      await loadPinned();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to mark trending.");
    } finally {
      setPinning(false);
    }
  };

  const handleUnpin = async (id) => {
    try {
      await adminAPI.unpinTrendingCard(id);
      await loadPinned();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to remove trending mark.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-theme bg-theme-card p-5 shadow-sm">
        <div className="mb-5 text-center">
          <h2 className="text-2xl font-semibold text-theme-accent">Trending company cards</h2>
          <p className="mx-auto mt-1 max-w-2xl text-sm text-theme-secondary">
            Pin a company card as trending for 24 hours. This is stored in Redis only — company
            visit records in Mongo are not changed. Cards also show trending automatically when
            profile views spike.
          </p>
        </div>

        <form onSubmit={handlePin} className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-theme-primary">Company</span>
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedCompany(null);
                setVisits([]);
                setVisitId("");
              }}
              placeholder="Search company name"
              className="w-full rounded-lg border border-theme bg-theme-hero px-4 py-3 text-sm text-theme-primary outline-none focus:border-theme-accent"
            />
            {suggesting ? (
              <p className="mt-1 text-xs text-theme-muted">Searching…</p>
            ) : null}
            {suggestions.length > 0 ? (
              <ul className="mt-2 max-h-48 overflow-auto rounded-xl border border-theme bg-theme-card py-1">
                {suggestions.map((row) => (
                  <li key={row.id}>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm text-theme-primary hover:bg-theme-nav"
                      onClick={() => void loadVisits(row)}
                    >
                      {row.name}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </label>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <label className="block min-w-0">
              <span className="mb-2 block text-sm font-medium text-theme-primary">
                Company card (year · cluster · type)
              </span>
              <ThemedSelect
                value={visitId}
                options={visitOptions}
                onChange={(value) => setVisitId(String(value || ""))}
                placeholder={
                  loadingVisits
                    ? "Loading cards…"
                    : selectedCompany
                      ? "Select a company card"
                      : "Search a company first"
                }
                ariaLabel="Company card visit"
                disabled={!selectedCompany || loadingVisits || visitOptions.length === 0}
                triggerClassName="py-3 bg-theme-hero"
              />
            </label>
            <button
              type="submit"
              disabled={pinning || !visitId}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FaFire className="h-3.5 w-3.5" aria-hidden />
              {pinning ? "Marking…" : "Mark trending for 24 hours"}
            </button>
          </div>
        </form>

        {message ? (
          <p className="mt-4 text-sm font-medium text-emerald-500">{message}</p>
        ) : null}
        {error ? <p className="mt-4 text-sm font-medium text-red-400">{error}</p> : null}
      </div>

      <div className="rounded-xl border border-theme bg-theme-card p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-theme-primary">Currently pinned</h3>
            <p className="mt-1 text-sm text-theme-secondary">
              These cards show a trending badge until the 24-hour window ends.
            </p>
          </div>
          <DashboardRefreshButton loading={listLoading} onClick={() => void loadPinned()} />
        </div>

        {listLoading && items.length === 0 ? (
          <p className="rounded-lg border border-theme bg-theme-hero p-8 text-center text-sm text-theme-secondary">
            Loading…
          </p>
        ) : items.length === 0 ? (
          <p className="rounded-lg border border-theme bg-theme-hero p-8 text-center text-sm text-theme-secondary">
            No admin-pinned trending cards right now.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-theme">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-theme-secondary">
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Card</th>
                  <th className="px-4 py-3">Expires</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-theme">
                {items.map((row) => (
                  <tr key={row.visitId}>
                    <td className="px-4 py-3 text-sm font-medium text-theme-primary">
                      {row.companyName}
                    </td>
                    <td className="px-4 py-3 text-sm text-theme-secondary">{visitLabel(row)}</td>
                    <td className="px-4 py-3 text-sm tabular-nums text-theme-secondary">
                      {remainingLabel(row.expiresAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        className="rounded-lg border border-theme px-3 py-1.5 text-xs font-semibold text-theme-primary hover:bg-theme-nav"
                        onClick={() => void handleUnpin(row.visitId)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
