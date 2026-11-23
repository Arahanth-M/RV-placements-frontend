import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaChartLine, FaMapMarkedAlt, FaTrash, FaUserCircle } from "react-icons/fa";
import { useAuth } from "../utils/AuthContext";
import { billingAPI, interviewAPI, prepPathAPI } from "../utils/api";
import { useTenantShell } from "../context/TenantShellContext.jsx";
import { GENERAL_COMPANY_CATEGORIES } from "../utils/generalCompanyCategory.js";
import PlatformEnhanceConfirmModal from "./platform/PlatformEnhanceConfirmModal.jsx";
import {
  PageBackButton,
  PageBackNavRow,
  PageHeroFontStyles,
  PageHeroHeader,
  pageShellInnerClass,
  pageShellOuterClassCompact,
} from "./PageBackNav.jsx";

const PLAN_LABELS = {
  category: "Unlock one category",
  prep_path: "PrepPath (10 / 30 days)",
  mocks: "AI mock interviews (10 / 30 days)",
  all_premium: "All premium features",
  all_cards: "Unlock all company cards",
  mocks_prep: "AI mocks + PrepPath",
};

function formatExpiry(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function categoryLabel(categoryId) {
  const id = String(categoryId || "").trim();
  if (!id) return "";
  return GENERAL_COMPANY_CATEGORIES.find((row) => row.id === id)?.label || id;
}

function planTitle(entitlement) {
  const planId = String(entitlement?.planId || "").trim();
  const base = PLAN_LABELS[planId] || planId || "Paid plan";
  const cat = categoryLabel(entitlement?.categoryId);
  return cat ? `${base} · ${cat}` : base;
}

function buildUsageBreakdown({
  paid,
  monthlyUsed,
  monthlyRemaining,
  monthlyLimit,
  freeRemaining,
  freeConsumed,
  freeLimit = 1,
  windowStart,
  windowEnd,
  windowDays = 30,
}) {
  if (paid) {
    const limit = Number(monthlyLimit);
    const used = Number(monthlyUsed);
    const remaining = Number(monthlyRemaining);
    const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 10;
    const safeUsed = Number.isFinite(used) ? Math.max(0, used) : 0;
    const safeRemaining = Number.isFinite(remaining)
      ? Math.max(0, remaining)
      : Math.max(0, safeLimit - safeUsed);
    const startLabel = formatExpiry(windowStart);
    const endLabel = formatExpiry(windowEnd);
    const windowLabel =
      startLabel && endLabel ? `${startLabel} → ${endLabel}` : `current ${windowDays}-day window`;
    return {
      mode: "paid",
      limit: safeLimit,
      used: safeUsed,
      remaining: safeRemaining,
      headline: `${safeRemaining} left in this window`,
      detail: `${safeUsed} used · ${safeLimit} every ${windowDays} days`,
      windowLabel,
      resetsLabel: endLabel ? `Resets ${endLabel}` : "",
    };
  }

  const freeLeft = Number(freeRemaining);
  const consumed = freeConsumed === true || freeLeft === 0;
  const remaining = Number.isFinite(freeLeft)
    ? Math.max(0, freeLeft)
    : consumed
      ? 0
      : freeLimit;
  const used = Math.max(0, freeLimit - remaining);
  return {
    mode: "free",
    limit: freeLimit,
    used,
    remaining,
    headline: remaining > 0 ? `${remaining} free left` : "Free credit used",
    detail: `${used} used · ${freeLimit} free credit`,
    windowLabel: "",
    resetsLabel: "",
  };
}

function UsageCard({ title, usage, loading, errored }) {
  return (
    <div className="rounded-3xl border border-theme bg-theme-card p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-theme-muted">{title}</p>
      {loading ? (
        <p className="mt-2 text-lg font-semibold text-theme-primary">…</p>
      ) : errored ? (
        <p className="mt-2 text-lg font-semibold text-theme-primary">—</p>
      ) : (
        <>
          <p className="mt-2 text-lg font-semibold text-theme-primary">{usage.headline}</p>
          <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl border border-theme bg-theme-app/40 px-2 py-2.5">
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-theme-muted">
                Used
              </dt>
              <dd className="mt-1 text-base font-semibold text-theme-primary">{usage.used}</dd>
            </div>
            <div className="rounded-xl border border-theme bg-theme-app/40 px-2 py-2.5">
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-theme-muted">
                Left
              </dt>
              <dd className="mt-1 text-base font-semibold text-theme-primary">{usage.remaining}</dd>
            </div>
            <div className="rounded-xl border border-theme bg-theme-app/40 px-2 py-2.5">
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-theme-muted">
                Limit
              </dt>
              <dd className="mt-1 text-base font-semibold text-theme-primary">{usage.limit}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-theme-secondary">
            {usage.detail}
            {usage.windowLabel ? ` · ${usage.windowLabel}` : ""}
          </p>
          {usage.resetsLabel ? (
            <p className="mt-1 text-xs font-medium text-theme-accent">{usage.resetsLabel}</p>
          ) : null}
        </>
      )}
    </div>
  );
}

export default function AccountProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { appPath } = useTenantShell();
  const [access, setAccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savedResumes, setSavedResumes] = useState([]);
  const [resumeLoading, setResumeLoading] = useState(true);
  const [privacyBusy, setPrivacyBusy] = useState("");
  const [privacyMessage, setPrivacyMessage] = useState("");
  const [privacyError, setPrivacyError] = useState("");
  /** "resume-all" | "resume:<id>" | "mocks" | null */
  const [confirmDelete, setConfirmDelete] = useState(null);

  const loadResumeDigest = useCallback(async () => {
    setResumeLoading(true);
    try {
      const res = await prepPathAPI.getResumeDigest();
      const list = Array.isArray(res?.data?.resumes)
        ? res.data.resumes.filter((row) => row?.hasDigest && row?.id)
        : [];
      const fallback =
        !list.length && res?.data?.resume?.hasDigest && res?.data?.resume?.id
          ? [res.data.resume]
          : [];
      setSavedResumes(list.length ? list : fallback);
    } catch {
      setSavedResumes([]);
    } finally {
      setResumeLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    billingAPI
      .getAccess()
      .then((res) => {
        if (cancelled) return;
        setAccess(res?.data || null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err?.response?.data?.error ||
            err?.message ||
            "Could not load your plan details."
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    loadResumeDigest();
  }, [loadResumeDigest]);

  const closeConfirm = useCallback(() => {
    if (privacyBusy) return;
    setConfirmDelete(null);
  }, [privacyBusy]);

  const runConfirmedDelete = async () => {
    if (confirmDelete === "resume-all" || String(confirmDelete || "").startsWith("resume:")) {
      const digestId =
        confirmDelete === "resume-all"
          ? ""
          : String(confirmDelete).slice("resume:".length);
      setPrivacyBusy(confirmDelete);
      setPrivacyError("");
      setPrivacyMessage("");
      try {
        const res = await prepPathAPI.deleteResumeDigest(digestId || undefined);
        const list = Array.isArray(res?.data?.resumes)
          ? res.data.resumes.filter((row) => row?.hasDigest && row?.id)
          : [];
        setSavedResumes(list);
        setPrivacyMessage(
          digestId
            ? "Saved resume digest deleted."
            : list.length === 0
              ? "All saved resume digests deleted."
              : "Saved resume digests deleted."
        );
        setConfirmDelete(null);
      } catch (err) {
        setPrivacyError(
          err?.response?.data?.error || err?.message || "Could not delete resume digest."
        );
      } finally {
        setPrivacyBusy("");
      }
      return;
    }

    if (confirmDelete === "mocks") {
      setPrivacyBusy("mocks");
      setPrivacyError("");
      setPrivacyMessage("");
      try {
        const res = await interviewAPI.deleteMyInterviewAnalytics();
        interviewAPI.invalidateUserInterviewAnalyticsCache(user?.userId || user?._id);
        const n = Number(res?.data?.deletedCount) || 0;
        setPrivacyMessage(
          n > 0
            ? `Deleted ${n} AI mock interview session${n === 1 ? "" : "s"}.`
            : "No AI mock interview data was stored for your account."
        );
        setConfirmDelete(null);
      } catch (err) {
        setPrivacyError(
          err?.response?.data?.error ||
            err?.message ||
            "Could not delete mock interview analytics."
        );
      } finally {
        setPrivacyBusy("");
      }
    }
  };

  const displayName =
    String(user?.username || user?.name || "").trim() ||
    (user?.email ? String(user.email).split("@")[0] : "Student");

  const windowDays = Number(access?.paidQuotaWindowDays) || 30;

  const activePlans = useMemo(() => {
    const rows = Array.isArray(access?.entitlements) ? access.entitlements : [];
    return rows
      .map((row) => ({
        ...row,
        title: planTitle(row),
        expiresLabel: formatExpiry(row.expiresAt),
        startsLabel: formatExpiry(row.startsAt),
      }))
      .sort((a, b) => String(b.expiresAt || "").localeCompare(String(a.expiresAt || "")));
  }, [access?.entitlements]);

  const planSummary =
    access?.isTestEmail
      ? "Test email access"
      : activePlans.length
        ? activePlans.map((p) => p.title).join(", ")
        : "Free trial";

  const mocksUsage = useMemo(
    () =>
      buildUsageBreakdown({
        paid: access?.unlimitedMocks === true,
        monthlyUsed: access?.paidMocksMonthlyUsed,
        monthlyRemaining: access?.paidMocksMonthlyRemaining,
        monthlyLimit: access?.paidMocksMonthlyLimit,
        freeRemaining: access?.freeMockRemaining,
        freeConsumed: access?.freeMockConsumed,
        freeLimit: 1,
        windowStart: access?.paidMocksQuotaWindowStart,
        windowEnd: access?.paidMocksQuotaWindowEnd,
        windowDays,
      }),
    [access, windowDays]
  );

  const prepUsage = useMemo(
    () =>
      buildUsageBreakdown({
        paid: access?.unlimitedPrepPath === true,
        monthlyUsed: access?.paidPrepMonthlyUsed,
        monthlyRemaining: access?.paidPrepMonthlyRemaining,
        monthlyLimit: access?.paidPrepMonthlyLimit,
        freeRemaining: access?.freePrepRemaining,
        freeConsumed:
          Number(access?.freePrepRemaining) === 0 && access?.unlimitedPrepPath !== true,
        freeLimit: 1,
        windowStart: access?.paidPrepQuotaWindowStart,
        windowEnd: access?.paidPrepQuotaWindowEnd,
        windowDays,
      }),
    [access, windowDays]
  );

  return (
    <div className={`min-h-screen ${pageShellOuterClassCompact}`}>
      <PageHeroFontStyles />
      <div className={pageShellInnerClass}>
        <PageBackNavRow>
          <PageBackButton onClick={() => navigate(-1)} label="Back" />
        </PageBackNavRow>

        <PageHeroHeader subtitle="Your account, plan, and rolling practice credits.">
          Your profile
        </PageHeroHeader>

        <section className="mx-auto max-w-3xl space-y-5">
          <div className="rounded-3xl border border-theme bg-theme-card p-6 shadow-sm sm:p-8">
            <div className="flex items-start gap-4">
              {user?.picture ? (
                <img
                  src={user.picture}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-theme-hero text-theme-accent">
                  <FaUserCircle className="h-10 w-10" aria-hidden />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-semibold text-theme-primary">{displayName}</h2>
                <p className="mt-1 break-all text-sm text-theme-secondary">
                  {user?.email || "—"}
                </p>
              </div>
            </div>

            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-theme bg-theme-app/40 p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-theme-muted">
                  Name
                </dt>
                <dd className="mt-1 text-sm font-medium text-theme-primary">{displayName}</dd>
              </div>
              <div className="rounded-2xl border border-theme bg-theme-app/40 p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-theme-muted">
                  Email
                </dt>
                <dd className="mt-1 break-all text-sm font-medium text-theme-primary">
                  {user?.email || "—"}
                </dd>
              </div>
              <div className="rounded-2xl border border-theme bg-theme-app/40 p-4 sm:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-wide text-theme-muted">
                  Plan
                </dt>
                <dd className="mt-1 text-sm font-medium text-theme-primary">
                  {loading ? "Loading…" : error ? "Unavailable" : planSummary}
                </dd>
                {!loading && !error && activePlans.length > 0 ? (
                  <ul className="mt-3 space-y-1.5 text-xs text-theme-secondary">
                    {activePlans.map((plan) => (
                      <li key={`${plan.id || plan.planId}:${plan.categoryId || ""}`}>
                        {plan.title}
                        {plan.startsLabel ? ` · from ${plan.startsLabel}` : ""}
                        {plan.expiresLabel ? ` · until ${plan.expiresLabel}` : ""}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {!loading && !error && !activePlans.length && !access?.isTestEmail ? (
                  <p className="mt-2 text-xs text-theme-secondary">
                    Includes 1 free AI mock, 1 PrepPath, and first-company teasers.{" "}
                    <Link
                      to={appPath("/pricing")}
                      className="font-semibold text-theme-accent underline-offset-2 hover:underline"
                    >
                      View plans
                    </Link>
                  </p>
                ) : null}
              </div>
            </dl>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <UsageCard
              title="AI mock interviews"
              usage={mocksUsage}
              loading={loading}
              errored={Boolean(error)}
            />
            <UsageCard
              title="PrepPath plans"
              usage={prepUsage}
              loading={loading}
              errored={Boolean(error)}
            />
          </div>

          {!loading && !error && (mocksUsage.mode === "paid" || prepUsage.mode === "paid") ? (
            <p className="text-xs text-theme-secondary">
              Paid limits are {windowDays} days from your purchase date, then the next{" "}
              {windowDays} days, and so on for the life of your subscription. Example: buy on
              22 Nov → 10 uses until 22 Dec → then another 10 until 21 Jan, and so on
              {" "}
              (previous months&apos; unused mock interviews and PrepPaths won&apos;t be added to
              the next month).
            </p>
          ) : null}

          {error ? (
            <p className="rounded-2xl border border-red-300/50 bg-red-50/80 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">
              {error}
            </p>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              to={appPath("/interviews?tab=analytics")}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-theme-accent px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95"
            >
              <FaChartLine className="h-4 w-4" aria-hidden />
              Previous mock interview analytics
            </Link>
            <Link
              to={appPath("/prep-path?history=1")}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-theme-accent bg-transparent px-4 py-3 text-sm font-semibold text-theme-accent transition hover:bg-theme-accent/5"
            >
              <FaMapMarkedAlt className="h-4 w-4" aria-hidden />
              Previous PrepPath plans
            </Link>
          </div>

          <section className="rounded-3xl border border-theme bg-theme-card p-6 shadow-sm sm:p-8">
            <h3 className="text-base font-semibold text-theme-primary">Your data &amp; privacy</h3>
            <p className="mt-1 text-xs text-theme-secondary">
              Review what we keep from PrepPath resume parsing, and erase AI mock analytics or saved
              resume digests. Job descriptions are never stored after generation.
            </p>

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-theme bg-theme-app/40 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-theme-muted">
                      Saved resume digests
                    </p>
                    <p className="mt-2 text-sm text-theme-secondary">
                      {resumeLoading
                        ? "Loading…"
                        : savedResumes.length
                          ? `${savedResumes.length} saved for PrepPath reuse`
                          : "No resume saved yet. It appears here after you generate a PrepPath with a resume upload."}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={
                      resumeLoading ||
                      Boolean(privacyBusy) ||
                      savedResumes.length === 0
                    }
                    onClick={() => setConfirmDelete("resume-all")}
                    className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-red-300/60 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/40"
                  >
                    <FaTrash className="h-3 w-3" aria-hidden />
                    Delete all
                  </button>
                </div>

                {!resumeLoading && savedResumes.length ? (
                  <div className="mt-3 space-y-2">
                    {savedResumes.map((row) => {
                      const title =
                        String(row.resumeMeta?.fileName || "").trim() || "Saved resume";
                      return (
                        <div
                          key={row.id}
                          className="flex items-start justify-between gap-3 rounded-xl border border-theme bg-theme-hero/50 px-4 py-3"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-theme-primary">
                              {title}
                            </p>
                            <p className="mt-1 text-[11px] text-theme-secondary">
                              {row.updatedAt
                                ? `Updated ${formatExpiry(row.updatedAt)}`
                                : "Saved from PrepPath"}
                            </p>
                          </div>
                          <button
                            type="button"
                            disabled={Boolean(privacyBusy)}
                            onClick={() => setConfirmDelete(`resume:${row.id}`)}
                            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-red-300/60 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/40"
                          >
                            <FaTrash className="h-3 w-3" aria-hidden />
                            Delete
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              <div className="rounded-2xl border border-theme bg-theme-app/40 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-theme-muted">
                      AI mock interview analytics
                    </p>
                    <p className="mt-2 text-sm text-theme-secondary">
                      Scores, readiness, and history from general-dashboard AI mocks. Deleting
                      removes those sessions permanently. Job descriptions are not stored.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={Boolean(privacyBusy)}
                    onClick={() => setConfirmDelete("mocks")}
                    className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-red-300/60 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/40"
                  >
                    <FaTrash className="h-3 w-3" aria-hidden />
                    Delete analytics
                  </button>
                </div>
              </div>
            </div>

            {privacyMessage ? (
              <p className="mt-4 text-sm text-theme-accent">{privacyMessage}</p>
            ) : null}
            {privacyError ? (
              <p className="mt-4 text-sm text-red-600 dark:text-red-300">{privacyError}</p>
            ) : null}
          </section>
        </section>
      </div>

      <PlatformEnhanceConfirmModal
        open={confirmDelete === "resume-all"}
        title="Delete all saved resume digests?"
        message="You will need to upload a resume again for the next PrepPath. This cannot be undone."
        confirmLabel="Delete all"
        cancelLabel="Cancel"
        variant="danger"
        busy={privacyBusy === "resume-all"}
        onCancel={closeConfirm}
        onConfirm={runConfirmedDelete}
      />
      <PlatformEnhanceConfirmModal
        open={String(confirmDelete || "").startsWith("resume:")}
        title="Delete this resume digest?"
        message="This saved resume will be removed from PrepPath reuse. This cannot be undone."
        confirmLabel="Delete digest"
        cancelLabel="Cancel"
        variant="danger"
        busy={String(privacyBusy || "").startsWith("resume:")}
        onCancel={closeConfirm}
        onConfirm={runConfirmedDelete}
      />
      <PlatformEnhanceConfirmModal
        open={confirmDelete === "mocks"}
        title="Delete AI mock analytics?"
        message="This permanently removes your general-dashboard AI mock interview analytics and history. This cannot be undone."
        confirmLabel="Delete analytics"
        cancelLabel="Cancel"
        variant="danger"
        busy={privacyBusy === "mocks"}
        onCancel={closeConfirm}
        onConfirm={runConfirmedDelete}
      />
    </div>
  );
}
