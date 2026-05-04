import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { spcAPI } from "../utils/api";
import {
  PageBackButton,
  PageBackNavRow,
  pageShellInnerClass,
  pageShellOuterClass,
} from "./PageBackNav.jsx";

const PRIMARY_ACTION_BTN_CLASS =
  "inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-theme-accent px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90";

function formatWhen(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
}

export default function SPCDashboard() {
  const navigate = useNavigate();
  const [showSubmissions, setShowSubmissions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [placements, setPlacements] = useState([]);

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await spcAPI.getMySubmissions();
      setPlacements(Array.isArray(data?.placements) ? data.placements : []);
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          "Could not load your submissions."
      );
      setPlacements([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (showSubmissions) {
      loadSubmissions();
    }
  }, [showSubmissions, loadSubmissions]);

  return (
    <div className={`min-h-screen ${pageShellOuterClass}`}>
      <div className={pageShellInnerClass}>
        {!showSubmissions ? (
          <div className="mx-auto w-full max-w-5xl">
            <div className="rounded-3xl border border-theme bg-theme-card p-6 shadow-xl sm:p-8">
              <h1 className="text-3xl font-bold text-theme-primary">SPC Dashboard</h1>
              <p className="mt-3 text-sm text-theme-secondary">
                Manage SPC placement workflows and review what you have submitted.
              </p>

              <div className="mt-6 flex flex-wrap items-start gap-3">
                <button type="button" onClick={() => navigate("/spc/form")} className={PRIMARY_ACTION_BTN_CLASS}>
                  Add Placement Data
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/spc/conversion-details")}
                  className={PRIMARY_ACTION_BTN_CLASS}
                >
                  Update conversion details
                </button>
                <button type="button" onClick={() => setShowSubmissions(true)} className={PRIMARY_ACTION_BTN_CLASS}>
                  View submissions
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <PageBackNavRow>
              <PageBackButton onClick={() => setShowSubmissions(false)} label="Back to Dashboard" />
            </PageBackNavRow>

            <div className="mx-auto w-full max-w-5xl">
              <div className="rounded-3xl border border-theme bg-theme-card p-6 shadow-xl sm:p-8">
                <div className="space-y-8">
                  {error ? (
                    <div
                      className="rounded-xl border border-red-300/60 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:border-red-500/35 dark:bg-red-950/40 dark:text-red-300"
                      role="alert"
                    >
                      {error}
                    </div>
                  ) : null}

                  {loading && !placements.length ? (
                    <p className="text-sm text-theme-muted">Loading…</p>
                  ) : null}

                  <section className="space-y-3" aria-label="Placement and conversion records">
                    <div className="flex w-full flex-wrap items-center gap-3">
                      <h2 className="min-w-0 flex-1 text-lg font-semibold text-theme-primary">
                        Placement & conversion records
                      </h2>
                      <button
                        type="button"
                        onClick={loadSubmissions}
                        disabled={loading}
                        className="ml-auto h-10 shrink-0 rounded-xl border border-theme-input bg-theme-input px-4 text-sm font-medium text-theme-primary transition-colors hover:bg-theme-nav disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {loading ? "Refreshing…" : "Refresh"}
                      </button>
                    </div>
                    {placements.length === 0 && !loading ? (
                      <p className="text-sm text-theme-muted">No placement or conversion entries yet.</p>
                    ) : placements.length > 0 ? (
                      <div className="overflow-x-auto rounded-xl border border-theme-input">
                        <table className="min-w-full text-left text-sm">
                          <thead className="border-b border-theme-input bg-theme-input/80 text-theme-secondary">
                            <tr>
                              <th className="whitespace-nowrap px-3 py-2.5 font-medium">Updated</th>
                              <th className="whitespace-nowrap px-3 py-2.5 font-medium">Student</th>
                              <th className="whitespace-nowrap px-3 py-2.5 font-medium">Company</th>
                              <th className="whitespace-nowrap px-3 py-2.5 font-medium">Year</th>
                              <th className="whitespace-nowrap px-3 py-2.5 font-medium">Branch</th>
                              <th className="whitespace-nowrap px-3 py-2.5 font-medium">Offer</th>
                              <th className="min-w-[8rem] px-3 py-2.5 font-medium">Role</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-theme-input text-theme-primary">
                            {placements.map((row) => (
                              <tr key={row._id} className="bg-theme-card hover:bg-theme-nav/50">
                                <td className="whitespace-nowrap px-3 py-2 align-top text-theme-secondary">
                                  {formatWhen(row.updatedAt || row.createdAt)}
                                </td>
                                <td className="px-3 py-2 align-top">
                                  <div className="font-medium">{row.studentName}</div>
                                  <div className="text-xs text-theme-muted">{row.studentUsn || row.studentEmail}</div>
                                </td>
                                <td className="px-3 py-2 align-top">{row.companyName}</td>
                                <td className="whitespace-nowrap px-3 py-2 align-top">{row.placementYear ?? "—"}</td>
                                <td className="whitespace-nowrap px-3 py-2 align-top uppercase">
                                  {row.branchCode || "—"}
                                </td>
                                <td className="max-w-[10rem] px-3 py-2 align-top">{row.typeOfOffer || "—"}</td>
                                <td className="max-w-[14rem] px-3 py-2 align-top text-theme-secondary">
                                  {row.role || "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : null}
                  </section>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
