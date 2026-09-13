import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import BrandLogo from "./BrandLogo.jsx";

export function paywallPricingPath(pricingPath, feature, categoryId) {
  const params = new URLSearchParams();
  if (feature) params.set("feature", feature);
  if (categoryId) params.set("category", categoryId);
  const query = params.toString();
  return query ? `${pricingPath}?${query}` : pricingPath;
}

export default function PaywallModal({
  open,
  onClose,
  title = "Premium feature",
  message,
  pricingPath,
  categoryId,
  feature,
}) {
  useEffect(() => {
    if (!open) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const to = paywallPricingPath(pricingPath, feature, categoryId);

  return createPortal(
    <div
      className="fixed inset-0 z-[220] flex items-center justify-center p-4 sm:p-6 bg-black/55 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="paywall-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border-2 border-theme bg-theme-card p-6 shadow-2xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start gap-3">
          <div className="h-14 w-24 shrink-0 rounded-lg border border-theme bg-white/95 p-2 shadow-sm">
            <BrandLogo />
          </div>
          <div className="min-w-0">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-theme-accent">
              Unlock
            </p>
            <h3
              id="paywall-title"
              className="text-2xl font-bold leading-tight text-theme-primary sm:text-3xl"
            >
              {title}
            </h3>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-theme-secondary sm:text-base">{message}</p>
        <div className="mt-6 flex flex-col-reverse gap-3 border-t border-theme pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-theme px-6 py-3 text-base font-semibold text-theme-primary transition-colors hover:bg-theme-hero"
          >
            Close
          </button>
          <Link
            to={to}
            onClick={onClose}
            className="rounded-xl bg-theme-accent px-6 py-3 text-center text-base font-semibold text-white shadow-lg hover:opacity-95"
          >
            View pricing
          </Link>
        </div>
      </div>
    </div>,
    document.body
  );
}
