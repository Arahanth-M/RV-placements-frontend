import { useEffect } from "react";
import { createPortal } from "react-dom";
import { FaSpinner } from "react-icons/fa";
import FeatureConsentInline from "./FeatureConsentInline.jsx";

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
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, starting, onCancel]);

  if (!open || typeof document === "undefined" || !preview) return null;

  const rounds = Array.isArray(preview.rounds) ? preview.rounds : [];

  return createPortal(
    <div
      className="fixed inset-0 z-[220] flex items-end justify-center bg-black/55 p-0 backdrop-blur-md sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="interview-plan-preview-title"
      onClick={() => {
        if (!starting) onCancel();
      }}
    >
      <div
        className="flex max-h-[min(94dvh,94vh)] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-theme bg-theme-card shadow-2xl sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pb-2 sm:p-8 sm:pb-4">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-theme-accent sm:mb-2 sm:text-xs">
            Interview preview
          </p>
          <h3
            id="interview-plan-preview-title"
            className="text-xl font-bold leading-tight text-theme-primary sm:text-2xl"
          >
            Here is what you will be asked
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-theme-secondary sm:text-sm">
            Review the round structure before you begin. The actual questions are picked when the
            interview starts.
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] text-theme-secondary sm:mt-4 sm:gap-2 sm:text-xs">
            {preview.companyName ? (
              <span className="rounded-lg border border-theme bg-theme-input px-2 py-1 sm:px-2.5 sm:py-1.5">
                <span className="text-theme-muted">Company</span>{" "}
                <strong className="text-theme-primary">{preview.companyName}</strong>
              </span>
            ) : null}
            {preview.role ? (
              <span className="rounded-lg border border-theme bg-theme-input px-2 py-1 sm:px-2.5 sm:py-1.5">
                <span className="text-theme-muted">Role</span>{" "}
                <strong className="text-theme-primary">{preview.role}</strong>
              </span>
            ) : null}
            {preview.difficulty ? (
              <span className="rounded-lg border border-theme bg-theme-input px-2 py-1 sm:px-2.5 sm:py-1.5">
                <span className="text-theme-muted">Difficulty</span>{" "}
                <strong className="text-theme-primary">{preview.difficulty}</strong>
              </span>
            ) : null}
            <span className="rounded-lg border border-theme bg-theme-input px-2 py-1 sm:px-2.5 sm:py-1.5">
              <strong className="text-theme-primary">
                {preview.totalRounds} round{preview.totalRounds === 1 ? "" : "s"}
              </strong>
              <span className="text-theme-muted"> · </span>
              <strong className="text-theme-primary">
                {preview.totalQuestions} question{preview.totalQuestions === 1 ? "" : "s"}
              </strong>
            </span>
          </div>

          <ol className="mt-4 space-y-2.5 sm:mt-5 sm:space-y-3">
            {rounds.map((round) => (
              <li
                key={`preview-round-${round.roundNumber}`}
                className="rounded-xl border border-theme bg-theme-input p-3 sm:p-4"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-theme-muted sm:text-[11px]">
                  Round {round.roundNumber}
                </p>
                <h4 className="mt-1 text-base font-semibold text-theme-primary sm:text-lg">
                  {round.type}
                </h4>
                <p className="mt-1 text-xs text-theme-secondary sm:text-sm">
                  Topic: <strong className="text-theme-primary">{round.topic}</strong>
                  {round.difficulty ? (
                    <>
                      <span className="text-theme-muted"> · </span>
                      {round.difficulty} difficulty
                    </>
                  ) : null}
                </p>
                <p className="mt-2 text-xs font-semibold text-theme-accent sm:text-sm">
                  {round.mix}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-theme-secondary sm:text-sm">
                  {round.brief}
                </p>
              </li>
            ))}
          </ol>

          {requireFeatureConsent ? (
            <div className="mt-4 sm:mt-5">
              <FeatureConsentInline
                title={featureConsentTitle}
                summary={featureConsentSummary}
                checkboxLabel={featureConsentCheckboxLabel}
                checked={featureConsentChecked}
                onCheckedChange={onFeatureConsentCheckedChange}
                disabled={starting}
                error={featureConsentError}
              />
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-theme bg-theme-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:gap-3 sm:p-6 sm:pb-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={starting}
            className="min-h-[44px] w-full rounded-xl border border-theme px-5 py-3 text-sm text-theme-primary transition-colors hover:bg-theme-nav disabled:opacity-50 sm:w-auto"
          >
            Back to setup
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={starting || (requireFeatureConsent && !featureConsentChecked)}
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-indigo-700 disabled:bg-slate-700 disabled:text-slate-400 sm:w-auto"
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
