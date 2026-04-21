import React, { useEffect } from "react";
import { FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import { MESSAGES } from "../utils/constants";

/**
 * Themed success/error dialog for POST /api/submissions flows (replaces window.alert).
 */
export default function SubmissionFeedbackModal({
  open,
  onClose,
  variant,
  statusMessage,
}) {
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const isSuccess = variant === "success";
  const primary =
    (statusMessage && String(statusMessage).trim()) ||
    (isSuccess ? MESSAGES.SUBMISSION_SUCCESS : MESSAGES.SUBMISSION_ERROR);

  return (
    <div
      className="submission-feedback-backdrop fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="bg-theme-card border border-theme rounded-xl w-full max-w-md shadow-[var(--shadow-soft)] overflow-hidden"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="submission-feedback-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-2 flex gap-3.5">
          <span
            className="shrink-0 mt-0.5"
            style={{ color: isSuccess ? "var(--success)" : "var(--warning)" }}
            aria-hidden
          >
            {isSuccess ? (
              <FaCheckCircle className="w-7 h-7" />
            ) : (
              <FaExclamationCircle className="w-7 h-7" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <h2
              id="submission-feedback-title"
              className="text-lg font-semibold text-theme-primary tracking-tight"
            >
              {isSuccess ? "Submission received" : "Something went wrong"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-theme-secondary">
              {primary}
            </p>
            {isSuccess && (
              <p className="mt-3 text-sm leading-relaxed text-theme-secondary border-t border-theme pt-3">
                {MESSAGES.SUBMISSION_CONTRIBUTION_NOTE}
              </p>
            )}
          </div>
        </div>
        <div className="px-5 pb-5 pt-1 flex justify-end border-t border-theme">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-theme-accent px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-secondary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)]"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
