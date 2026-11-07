import { useEffect } from "react";
import { FaExclamationCircle } from "react-icons/fa";

/**
 * Themed confirm dialog for company-wide enhance actions (dark + light via theme tokens).
 */
export default function PlatformEnhanceConfirmModal({
  open = false,
  title = "Confirm enhancement",
  message = "",
  confirmLabel = "Yes, enhance",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event) => {
      if (event.key === "Escape") onCancel?.();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      role="presentation"
      onClick={onCancel}
    >
      <div
        className="bg-theme-card border border-theme rounded-xl w-full max-w-md shadow-[var(--shadow-soft)] overflow-hidden"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="platform-enhance-confirm-title"
        aria-describedby="platform-enhance-confirm-message"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-2 flex gap-3.5">
          <span
            className="shrink-0 mt-0.5"
            style={{ color: "var(--warning)" }}
            aria-hidden
          >
            <FaExclamationCircle className="w-7 h-7" />
          </span>
          <div className="min-w-0 flex-1">
            <h2
              id="platform-enhance-confirm-title"
              className="text-lg font-semibold text-theme-primary tracking-tight"
            >
              {title}
            </h2>
            <p
              id="platform-enhance-confirm-message"
              className="mt-2 text-sm leading-relaxed text-theme-secondary whitespace-pre-line"
            >
              {message}
            </p>
          </div>
        </div>
        <div className="px-5 pb-5 pt-3 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 border-t border-theme">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-theme px-5 py-2.5 text-sm font-medium text-theme-secondary hover:bg-theme-nav transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-secondary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-theme-accent px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-secondary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)]"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
