import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../utils/AuthContext";
import { authAPI } from "../utils/api";
import { GENERAL_BASE } from "../constants/tenant.js";
import { LEGAL_BRAND, PRIVACY_POLICY_VERSION } from "./legal/legalMeta.js";

/** Legal paths under /general where the blocking overlay is skipped so the notice can be read. */
const LEGAL_PATH_SUFFIXES = [
  "/privacy",
  "/terms",
  "/about",
  "/refund",
  "/shipping",
  "/contact",
];

function isLegalReadPath(pathname) {
  const p = String(pathname || "");
  if (!p.startsWith(GENERAL_BASE)) return false;
  return LEGAL_PATH_SUFFIXES.some(
    (suffix) => p === `${GENERAL_BASE}${suffix}` || p.startsWith(`${GENERAL_BASE}${suffix}/`)
  );
}

/**
 * Blocking DPDP consent gate for signed-in users on the general dashboard.
 * Shows until the user accepts the current PRIVACY_POLICY_VERSION (stored on User1).
 * Works the same in local and production — status comes from `/api/auth/current_user`.
 */
export default function PrivacyConsentGate() {
  const { user, loading, setUser, logout, refreshUser } = useAuth();
  const location = useLocation();
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  const privacyConsent = user?.privacyConsent || null;
  const requiredVersion =
    privacyConsent?.requiredPolicyVersion || PRIVACY_POLICY_VERSION;

  const needsConsent = useMemo(() => {
    if (!user || loading) return false;
    // Offline lastUser cache may lack consent fields — don't block read-only mode.
    if (typeof navigator !== "undefined" && !navigator.onLine) return false;
    if (privacyConsent && typeof privacyConsent.needsConsent === "boolean") {
      return privacyConsent.needsConsent === true;
    }
    // Online session without consent payload: require acceptance.
    return true;
  }, [user, loading, privacyConsent]);

  const showGate =
    Boolean(user) &&
    !loading &&
    needsConsent &&
    !isLegalReadPath(location.pathname);

  useEffect(() => {
    if (!showGate) {
      setChecked(false);
      setError("");
    }
  }, [showGate, user?.userId, user?._id, requiredVersion]);

  const handleAccept = useCallback(async () => {
    if (!checked || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const { data } = await authAPI.acceptPrivacyConsent({
        privacyPolicyVersion: requiredVersion,
        accepted: true,
      });
      const nextConsent = data?.privacyConsent;
      if (nextConsent?.needsConsent === false) {
        setUser((prev) =>
          prev
            ? {
                ...prev,
                privacyConsent: nextConsent,
              }
            : prev
        );
        try {
          localStorage.setItem(
            "lastUser",
            JSON.stringify({
              ...(user || {}),
              privacyConsent: nextConsent,
            })
          );
        } catch {
          /* ignore */
        }
      } else {
        await refreshUser?.(true);
      }
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Could not save your consent. Please try again.";
      setError(String(msg));
      if (err?.response?.status === 409) {
        try {
          await refreshUser?.(true);
        } catch {
          /* ignore */
        }
      }
    } finally {
      setSubmitting(false);
    }
  }, [
    checked,
    submitting,
    requiredVersion,
    setUser,
    user,
    refreshUser,
  ]);

  const handleDecline = useCallback(async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  }, [logout, loggingOut]);

  if (!showGate) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-consent-title"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-theme bg-theme-card p-6 shadow-2xl sm:p-7">
        <h2
          id="privacy-consent-title"
          className="text-xl font-bold text-theme-primary"
        >
          Privacy notice
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-theme-secondary">
          Before you use {LEGAL_BRAND}, please review how we collect and use your personal
          data (account, usage, AI interviews, payments, and related activity) under India&apos;s
          Digital Personal Data Protection Act, 2023.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-theme-secondary">
          <li>We process data only for stated product purposes.</li>
          <li>You can request access, correction, or deletion later.</li>
          <li>You can withdraw consent by contacting us or closing your account.</li>
        </ul>
        <p className="mt-3 text-sm text-theme-secondary">
          Full notice:{" "}
          <Link
            className="font-medium text-theme-accent underline"
            to={`${GENERAL_BASE}/privacy`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Privacy Policy
          </Link>
          <span className="text-theme-muted">
            {" "}
            (version {requiredVersion})
          </span>
        </p>

        <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-theme bg-theme-input/40 px-3 py-3">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 shrink-0 accent-[var(--theme-accent,theme(colors.indigo.500))]"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            disabled={submitting || loggingOut}
          />
          <span className="text-sm text-theme-primary">
            I have read the Privacy Policy and I consent to the processing of my personal data
            as described in it for the general platform.
          </span>
        </label>

        {error ? (
          <p className="mt-3 text-sm text-red-500" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleDecline}
            disabled={submitting || loggingOut}
            className="rounded-xl border border-theme px-4 py-2.5 text-sm font-medium text-theme-secondary hover:text-theme-primary disabled:opacity-50"
          >
            {loggingOut ? "Signing out…" : "Decline & sign out"}
          </button>
          <button
            type="button"
            onClick={handleAccept}
            disabled={!checked || submitting || loggingOut}
            className="rounded-xl bg-theme-accent px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Accept & continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
