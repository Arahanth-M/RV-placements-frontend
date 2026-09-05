import { useCallback, useEffect, useState } from "react";
import { FaTimes } from "react-icons/fa";
import { adminAPI } from "../utils/api";

function formatWhen(value) {
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

function interestLabel(value) {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "—";
}

export default function AdminBlockedLoginsModal({ open, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminAPI.getBlockedLogins({ days: 30 });
      setData(res?.data || null);
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to load blocked sign-ins."
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    load();
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, load, onClose]);

  if (!open) return null;

  const kpis = [
    { label: "Attempts", value: data?.attemptCount ?? 0 },
    { label: "Unique emails", value: data?.uniqueEmails ?? 0 },
    { label: "Responded", value: data?.respondedCount ?? 0 },
    { label: "Want platform", value: data?.wantsPlatformCount ?? 0 },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-blocked-logins-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-theme bg-theme-card shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-theme px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h2
              id="admin-blocked-logins-title"
              className="text-lg font-semibold text-theme-primary"
            >
              Blocked sign-ins
            </h2>
            <p className="mt-0.5 text-xs text-theme-secondary">
              People who tried to log in without an RVCE or RVITM email. They
              did not get an account. Rows expire after 30 days.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-theme p-2 text-theme-muted transition hover:text-theme-primary"
            aria-label="Close"
          >
            <FaTimes className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-4 py-3 sm:px-5">
          {error ? (
            <p className="mb-3 text-center text-sm text-red-500">{error}</p>
          ) : null}

          {loading && !data ? (
            <p className="py-10 text-center text-sm text-theme-secondary">
              Loading last 30 days…
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {kpis.map((kpi) => (
                  <div
                    key={kpi.label}
                    className="rounded-xl border border-theme bg-theme-hero px-3 py-2"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-theme-muted">
                      {kpi.label}
                    </p>
                    <p className="mt-0.5 text-lg font-bold tabular-nums text-theme-primary">
                      {kpi.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-theme p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-theme-muted">
                    Top colleges
                  </p>
                  {Array.isArray(data?.topColleges) && data.topColleges.length > 0 ? (
                    <ul className="mt-2 space-y-1 text-sm text-theme-secondary">
                      {data.topColleges.map((row) => (
                        <li
                          key={row.collegeName}
                          className="flex justify-between gap-3"
                        >
                          <span className="truncate text-theme-primary">
                            {row.collegeName}
                          </span>
                          <span className="tabular-nums">{row.count}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-theme-muted">
                      No college responses yet.
                    </p>
                  )}
                </div>
                <div className="rounded-xl border border-theme p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-theme-muted">
                    Top email domains
                  </p>
                  {Array.isArray(data?.topDomains) && data.topDomains.length > 0 ? (
                    <ul className="mt-2 space-y-1 text-sm text-theme-secondary">
                      {data.topDomains.map((row) => (
                        <li
                          key={row.domain}
                          className="flex justify-between gap-3"
                        >
                          <span className="truncate text-theme-primary">
                            {row.domain}
                          </span>
                          <span className="tabular-nums">{row.count}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-theme-muted">
                      No blocked attempts yet.
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 overflow-x-auto rounded-xl border border-theme">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-theme-hero text-[11px] uppercase tracking-wide text-theme-muted">
                    <tr>
                      <th className="px-3 py-2 font-semibold">When</th>
                      <th className="px-3 py-2 font-semibold">Email</th>
                      <th className="px-3 py-2 font-semibold">College</th>
                      <th className="px-3 py-2 font-semibold">Want platform</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme/60">
                    {Array.isArray(data?.recent) && data.recent.length > 0 ? (
                      data.recent.map((row) => (
                        <tr key={row.id} className="text-theme-secondary">
                          <td className="whitespace-nowrap px-3 py-2 align-top">
                            {formatWhen(row.createdAt)}
                          </td>
                          <td className="max-w-[16rem] truncate px-3 py-2 align-top text-theme-primary">
                            {row.email || "—"}
                          </td>
                          <td className="max-w-[12rem] truncate px-3 py-2 align-top">
                            {row.collegeName || "—"}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 align-top">
                            {interestLabel(row.wantsPlatformAtCollege)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-3 py-8 text-center text-theme-muted"
                        >
                          No blocked sign-ins in the last {data?.windowDays || 30}{" "}
                          days.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
