import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { spcAPI } from "../utils/api";

const TAB_HOME = "home";
const TAB_SUBMISSIONS = "submissions";

const CONTRIBUTION_TYPE_LABELS = {
  onlineQuestions: "Online questions",
  interviewQuestions: "Interview questions",
  interviewProcess: "Interview process",
  mustDoTopics: "Must-do topics",
  internshipExperience: "Internship experience",
};

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

function labelForContributionType(type) {
  return CONTRIBUTION_TYPE_LABELS[type] || type || "—";
}

export default function SPCDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(TAB_HOME);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [contributions, setContributions] = useState([]);
  const [placements, setPlacements] = useState([]);

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await spcAPI.getMySubmissions();
      setContributions(Array.isArray(data?.contributions) ? data.contributions : []);
      setPlacements(Array.isArray(data?.placements) ? data.placements : []);
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          "Could not load your submissions."
      );
      setContributions([]);
      setPlacements([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === TAB_SUBMISSIONS) {
      loadSubmissions();
    }
  }, [tab, loadSubmissions]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl shrink-0 rounded-3xl border border-theme bg-theme-card p-6 shadow-xl sm:p-8">
        <h1 className="text-3xl font-bold text-theme-primary">SPC Dashboard</h1>
        <p className="mt-3 text-sm text-theme-secondary">
          Manage SPC placement workflows and review what you have submitted.
        </p>

        <div
          className="mt-6 flex flex-wrap gap-2 border-b border-theme pb-px"
          role="tablist"
          aria-label="SPC dashboard sections"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === TAB_HOME}
            className={`rounded-t-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
              tab === TAB_HOME
                ? "border border-b-0 border-theme bg-theme-input text-theme-primary"
                : "text-theme-secondary hover:bg-theme-nav hover:text-theme-primary"
            }`}
            onClick={() => setTab(TAB_HOME)}
          >
            Home
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === TAB_SUBMISSIONS}
            className={`rounded-t-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
              tab === TAB_SUBMISSIONS
                ? "border border-b-0 border-theme bg-theme-input text-theme-primary"
                : "text-theme-secondary hover:bg-theme-nav hover:text-theme-primary"
            }`}
            onClick={() => setTab(TAB_SUBMISSIONS)}
          >
            View my submissions
          </button>
        </div>

        <div className="mt-6">
          {tab === TAB_HOME ? (
            <div className="flex flex-wrap items-start gap-3">
              <button
                type="button"
                onClick={() => navigate("/spc/form")}
                className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-theme-accent px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Add Placement Data
              </button>
              <button
                type="button"
                onClick={() => navigate("/spc/conversion-details")}
                className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-theme-accent px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Update conversion details
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-theme-secondary">
                  Company contributions (questions / process) and placement or conversion records you filed.
                </p>
                <button
                  type="button"
                  onClick={loadSubmissions}
                  disabled={loading}
                  className="h-10 shrink-0 rounded-xl border border-theme-input bg-theme-input px-4 text-sm font-medium text-theme-primary transition-colors hover:bg-theme-nav disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Refreshing…" : "Refresh"}
                </button>
              </div>

              {error ? (
                <div
                  className="rounded-xl border border-red-300/60 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:border-red-500/35 dark:bg-red-950/40 dark:text-red-300"
                  role="alert"
                >
                  {error}
                </div>
              ) : null}

              {loading && !contributions.length && !placements.length ? (
                <p className="text-sm text-theme-muted">Loading…</p>
              ) : null}

              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-theme-primary">Placement & conversion records</h2>
                {placements.length === 0 && !loading ? (
                  <p className="text-sm text-theme-muted">No placement or conversion entries yet.</p>
                ) : (
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
                )}
              </section>

              {/* <section className="space-y-3">
                <h2 className="text-lg font-semibold text-theme-primary">Company contributions</h2>
                <p className="text-xs text-theme-muted">
                  Submissions from company detail pages (questions, interview process, etc.) pending admin review.
                </p>
                {contributions.length === 0 && !loading ? (
                  <p className="text-sm text-theme-muted">No company contribution submissions yet.</p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-theme-input">
                    <table className="min-w-full text-left text-sm">
                      <thead className="border-b border-theme-input bg-theme-input/80 text-theme-secondary">
                        <tr>
                          <th className="whitespace-nowrap px-3 py-2.5 font-medium">Submitted</th>
                          <th className="whitespace-nowrap px-3 py-2.5 font-medium">Company</th>
                          <th className="whitespace-nowrap px-3 py-2.5 font-medium">Type</th>
                          <th className="whitespace-nowrap px-3 py-2.5 font-medium">Status</th>
                          <th className="min-w-[12rem] px-3 py-2.5 font-medium">Preview</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-theme-input text-theme-primary">
                        {contributions.map((row) => (
                          <tr key={row._id} className="bg-theme-card hover:bg-theme-nav/50">
                            <td className="whitespace-nowrap px-3 py-2 align-top text-theme-secondary">
                              {formatWhen(row.submittedAt)}
                            </td>
                            <td className="px-3 py-2 align-top">{row.companyName}</td>
                            <td className="whitespace-nowrap px-3 py-2 align-top">
                              {labelForContributionType(row.type)}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 align-top capitalize">{row.status}</td>
                            <td className="max-w-md px-3 py-2 align-top text-xs text-theme-secondary break-words">
                              {row.contentPreview || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section> */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
