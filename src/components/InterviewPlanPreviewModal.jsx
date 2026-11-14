import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { FaSpinner } from "react-icons/fa";
import { GENERAL_BASE } from "../constants/tenant.js";

export default function InterviewPlanPreviewModal({
  open,
  preview,
  starting = false,
  onCancel,
  onConfirm,
  /** When true, require an unticked-by-default checkbox before Begin. */
  requireFeatureConsent = false,
  featureConsentChecked = false,
  onFeatureConsentCheckedChange,
  featureConsentTitle = "",
  featureConsentSummary = "",
  featureConsentCheckboxLabel = "",
  featureConsentError = "",
}) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape" && !starting) onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, starting, onCancel]);

  if (!open || typeof document === "undefined" || !preview) return null;

  const rounds = Array.isArray(preview.rounds) ? preview.rounds : [];

  return createPortal(
    <div
      className="fixed inset-0 z-[220] flex items-center justify-center p-4 sm:p-6 bg-black/55 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="interview-plan-preview-title"
      onClick={() => {
        if (!starting) onCancel();
      }}
    >
      <div
        className="w-full max-w-2xl max-h-[min(92vh,880px)] overflow-y-auto rounded-2xl border border-theme bg-theme-card shadow-2xl p-6 sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-theme-accent mb-2">
          Interview preview
        </p>
        <h3
          id="interview-plan-preview-title"
          className="text-2xl font-bold text-theme-primary leading-tight"
        >
          Here is what you will be asked
        </h3>
        <p className="mt-2 text-sm text-theme-secondary leading-relaxed">
          Review the round structure before you begin. The actual questions are picked when the
          interview starts.
        </p>

        <div className="mt-4 flex flex-wrap gap-2 text-xs text-theme-secondary">
          {preview.companyName ? (
            <span className="rounded-lg border border-theme bg-theme-input px-2.5 py-1.5">
              <span className="text-theme-muted">Company</span>{" "}
              <strong className="text-theme-primary">{preview.companyName}</strong>
            </span>
          ) : null}
          {preview.role ? (
            <span className="rounded-lg border border-theme bg-theme-input px-2.5 py-1.5">
              <span className="text-theme-muted">Role</span>{" "}
              <strong className="text-theme-primary">{preview.role}</strong>
            </span>
          ) : null}
          {preview.difficulty ? (
            <span className="rounded-lg border border-theme bg-theme-input px-2.5 py-1.5">
              <span className="text-theme-muted">Difficulty</span>{" "}
              <strong className="text-theme-primary">{preview.difficulty}</strong>
            </span>
          ) : null}
          <span className="rounded-lg border border-theme bg-theme-input px-2.5 py-1.5">
            <strong className="text-theme-primary">
              {preview.totalRounds} round{preview.totalRounds === 1 ? "" : "s"}
            </strong>
            <span className="text-theme-muted"> · </span>
            <strong className="text-theme-primary">
              {preview.totalQuestions} question{preview.totalQuestions === 1 ? "" : "s"}
            </strong>
          </span>
        </div>

        <ol className="mt-5 space-y-3">
          {rounds.map((round) => (
            <li
              key={`preview-round-${round.roundNumber}`}
              className="rounded-xl border border-theme bg-theme-input p-4"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-theme-muted">
                Round {round.roundNumber}
              </p>
              <h4 className="mt-1 text-lg font-semibold text-theme-primary">{round.type}</h4>
              <p className="mt-1 text-sm text-theme-secondary">
                Topic: <strong className="text-theme-primary">{round.topic}</strong>
                {round.difficulty ? (
                  <>
                    <span className="text-theme-muted"> · </span>
                    {round.difficulty} difficulty
                  </>
                ) : null}
              </p>
              <p className="mt-2 text-sm font-semibold text-theme-accent">{round.mix}</p>
              <p className="mt-1 text-sm text-theme-secondary leading-relaxed">{round.brief}</p>
            </li>
          ))}
        </ol>

        {requireFeatureConsent ? (
          <div className="mt-5 rounded-xl border border-theme bg-theme-input/50 p-4">
            {featureConsentTitle ? (
              <p className="text-sm font-semibold text-theme-primary">{featureConsentTitle}</p>
            ) : null}
            {featureConsentSummary ? (
              <p className="mt-1 text-sm leading-relaxed text-theme-secondary">
                {featureConsentSummary}{" "}
                <Link
                  className="font-medium text-theme-accent underline"
                  to={`${GENERAL_BASE}/privacy`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            ) : null}
            <label className="mt-3 flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 shrink-0"
                checked={featureConsentChecked}
                disabled={starting}
                onChange={(e) => onFeatureConsentCheckedChange?.(e.target.checked)}
              />
              <span className="text-sm text-theme-primary">
                {featureConsentCheckboxLabel ||
                  "I consent to processing my interview data for this mock."}
              </span>
            </label>
            {featureConsentError ? (
              <p className="mt-2 text-sm text-red-500" role="alert">
                {featureConsentError}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={starting}
            className="px-5 py-3 rounded-xl border border-theme text-theme-primary hover:bg-theme-nav transition-colors disabled:opacity-50"
          >
            Back to setup
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={starting || (requireFeatureConsent && !featureConsentChecked)}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md transition-colors disabled:bg-slate-700 disabled:text-slate-400"
          >
            {starting ? <FaSpinner className="h-4 w-4 animate-spin" aria-hidden /> : null}
            {starting ? "Starting…" : "Begin interview"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
