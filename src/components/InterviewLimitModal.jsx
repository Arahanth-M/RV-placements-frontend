import React, { useEffect } from "react";
import rvLogo from "../assets/logo2.webp";
import { MESSAGES } from "../utils/constants";

/**
 * Shown when a user has reached the one-interview-per-user cap.
 * Styled to match AI interview feedback modals in AIInterviewTab.
 */
export default function InterviewLimitModal({ open, onClose, message }) {
  useEffect(() => {
    if (!open) return undefined;
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

  const body =
    (message && String(message).trim()) || MESSAGES.INTERVIEW_LIMIT_REACHED;

  return (
    <div
      className="fixed inset-0 z-[220] flex items-center justify-center p-4 sm:p-6 bg-black/55 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="interview-limit-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-theme-accent bg-theme-card shadow-2xl p-6 sm:p-10 flex flex-col gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="h-14 w-24 shrink-0 rounded-lg border border-theme bg-white/95 p-2 shadow-sm">
            <img src={rvLogo} alt="RV College logo" className="h-full w-full object-contain" />
          </div>
          <div className="min-w-0">
            <p
              id="interview-limit-title"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-theme-accent mb-2"
            >
              Interview limit
            </p>
            <h3 className="text-2xl sm:text-3xl font-bold text-theme-primary leading-tight">
              One interview per user
            </h3>
          </div>
        </div>
        <p className="text-sm sm:text-base text-theme-secondary leading-relaxed">{body}</p>
        <div className="flex justify-end pt-2 border-t border-theme">
          <button
            type="button"
            onClick={onClose}
            className="px-8 py-3.5 rounded-xl bg-theme-accent text-white text-base font-semibold shadow-lg transition-colors hover:opacity-95"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
