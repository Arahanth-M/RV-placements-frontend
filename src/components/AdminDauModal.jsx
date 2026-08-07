import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaDownload, FaTimes } from "react-icons/fa";
import { adminAPI } from "../utils/api";
import { downloadDauExcel } from "../utils/exportDauExcel";

function formatLogin(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDayLabel(dateKey) {
  if (!dateKey) return "—";
  const d = new Date(`${dateKey}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return dateKey;
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/**
 * Admin popup: day chips → click a day to load that day's DAU.
 * Data is fetched only while the modal is open (not on stats poll).
 */
export default function AdminDauModal({ open, onClose }) {
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [dayLoading, setDayLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [days, setDays] = useState([]);
  const [selectedDay, setSelectedDay] = useState("");
  const [usersByDay, setUsersByDay] = useState({});
  const usersByDayRef = useRef({});

  useEffect(() => {
    usersByDayRef.current = usersByDay;
  }, [usersByDay]);

  const loadDayUsers = useCallback(async (dayKey) => {
    if (!dayKey) return;
    setSelectedDay(dayKey);
    if (Object.prototype.hasOwnProperty.call(usersByDayRef.current, dayKey)) {
      return;
    }

    setDayLoading(true);
    setError("");
    try {
      const res = await adminAPI.getDauDay(dayKey);
      const users = Array.isArray(res?.data?.users) ? res.data.users : [];
      const count = Number(res?.data?.count);
      setUsersByDay((prev) => {
        const next = { ...prev, [dayKey]: users };
        usersByDayRef.current = next;
        return next;
      });
      if (Number.isFinite(count)) {
        setDays((prev) =>
          prev.map((d) => (d.date === dayKey ? { ...d, count } : d))
        );
      }
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to load users for that day."
      );
    } finally {
      setDayLoading(false);
    }
  }, []);

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    setError("");
    setUsersByDay({});
    usersByDayRef.current = {};
    setSelectedDay("");
    try {
      const res = await adminAPI.getDau({ days: 7 });
      const list = Array.isArray(res?.data?.days) ? res.data.days : [];
      setDays(list);
      const latest = list.length ? list[list.length - 1].date : "";
      if (latest) {
        // Load latest day users immediately after summary.
        await loadDayUsers(latest);
      }
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to load daily active users."
      );
      setDays([]);
    } finally {
      setSummaryLoading(false);
    }
  }, [loadDayUsers]);

  useEffect(() => {
    if (!open) return undefined;
    loadSummary();
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, loadSummary, onClose]);

  const handleExport = async () => {
    setExporting(true);
    setError("");
    try {
      const res = await adminAPI.getDauExport();
      const exportRows = Array.isArray(res?.data?.rows) ? res.data.rows : [];
      downloadDauExcel(exportRows);
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to download Excel."
      );
    } finally {
      setExporting(false);
    }
  };

  const selectedUsers = useMemo(() => {
    if (!selectedDay) return [];
    return Array.isArray(usersByDay[selectedDay]) ? usersByDay[selectedDay] : [];
  }, [selectedDay, usersByDay]);

  const dayUsersPending =
    Boolean(selectedDay) &&
    !Object.prototype.hasOwnProperty.call(usersByDay, selectedDay);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-dau-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-theme bg-theme-card shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-theme px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h2
              id="admin-dau-title"
              className="text-lg font-semibold text-theme-primary"
            >
              Daily active users
            </h2>
            <p className="mt-0.5 text-xs text-theme-secondary">
              Click a day to see that day&apos;s users. Excel downloads the full
              stored history.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting || summaryLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-theme bg-theme-hero px-3 py-2 text-xs font-semibold text-theme-primary transition hover:border-emerald-500/50 disabled:opacity-50"
            >
              <FaDownload className="h-3 w-3" aria-hidden />
              {exporting ? "Preparing…" : "Download full list (Excel)"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-theme p-2 text-theme-muted transition hover:text-theme-primary"
              aria-label="Close"
            >
              <FaTimes className="h-4 w-4" />
            </button>
          </div>
        </div>

        {summaryLoading && days.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-theme-secondary sm:px-5">
            Loading last 7 days…
          </p>
        ) : days.length > 0 ? (
          <div className="flex flex-wrap gap-2 border-b border-theme/60 px-4 py-3 sm:px-5">
            {days.map((d) => {
              const active = d.date === selectedDay;
              return (
                <button
                  key={d.date}
                  type="button"
                  onClick={() => loadDayUsers(d.date)}
                  className={`min-w-[4.5rem] rounded-lg border px-2.5 py-1.5 text-center transition ${
                    active
                      ? "border-emerald-500 bg-emerald-500/15 ring-1 ring-emerald-500/40"
                      : "border-theme bg-theme-hero hover:border-emerald-500/50"
                  }`}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-theme-muted">
                    {formatDayLabel(d.date)}
                  </p>
                  <p className="text-sm font-bold tabular-nums text-theme-primary">
                    {d.count ?? 0}
                  </p>
                </button>
              );
            })}
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-auto px-4 py-3 sm:px-5">
          {error ? (
            <p className="mb-3 text-center text-sm text-red-500">{error}</p>
          ) : null}

          {!selectedDay && !summaryLoading ? (
            <p className="py-10 text-center text-sm text-theme-secondary">
              Select a day to view active users.
            </p>
          ) : dayLoading && dayUsersPending ? (
            <p className="py-10 text-center text-sm text-theme-secondary">
              Loading users for {selectedDay}…
            </p>
          ) : selectedUsers.length === 0 ? (
            <p className="py-10 text-center text-sm text-theme-secondary">
              No active users on {selectedDay || "this day"}.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-theme">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-theme-hero text-[11px] uppercase tracking-wide text-theme-muted">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Username</th>
                    <th className="px-3 py-2 font-semibold">Email</th>
                    <th className="px-3 py-2 font-semibold">Role</th>
                    <th className="px-3 py-2 font-semibold">Last login</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme/60">
                  {selectedUsers.map((row, i) => (
                    <tr
                      key={`${selectedDay}-${row.userId || row.email}-${i}`}
                      className="text-theme-secondary"
                    >
                      <td className="max-w-[10rem] truncate px-3 py-2 text-theme-primary">
                        {row.username || "—"}
                      </td>
                      <td className="max-w-[16rem] truncate px-3 py-2">
                        {row.email || "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 capitalize">
                        {row.role || "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">
                        {formatLogin(row.lastLoginAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
