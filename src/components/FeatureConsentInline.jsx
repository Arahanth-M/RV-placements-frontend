import { Link } from "react-router-dom";
import { GENERAL_BASE } from "../constants/tenant.js";

/**
 * Inline DPDP feature-consent checkbox block (unticked by default).
 * Mobile-first: readable wrap, larger tap target on the checkbox row.
 */
export default function FeatureConsentInline({
  title,
  summary,
  checkboxLabel,
  checked,
  onCheckedChange,
  disabled = false,
  error = "",
  className = "",
}) {
  return (
    <div
      className={`rounded-xl border border-theme bg-theme-input/40 p-3 sm:p-4 ${className}`}
    >
      {title ? (
        <p className="text-sm font-semibold leading-snug text-theme-primary sm:text-base">
          {title}
        </p>
      ) : null}
      {summary ? (
        <p className="mt-1.5 text-xs leading-relaxed text-theme-secondary sm:text-sm">
          {summary}{" "}
          <Link
            className="font-medium text-theme-accent underline underline-offset-2"
            to={`${GENERAL_BASE}/privacy`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Privacy Policy
          </Link>
          .
        </p>
      ) : null}
      <label className="mt-3 flex min-h-[44px] cursor-pointer items-start gap-3 rounded-lg py-1">
        <input
          type="checkbox"
          className="mt-1 h-5 w-5 shrink-0 accent-[var(--theme-accent,theme(colors.indigo.500))] sm:mt-0.5 sm:h-4 sm:w-4"
          checked={Boolean(checked)}
          disabled={disabled}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
        />
        <span className="min-w-0 flex-1 break-words text-xs leading-relaxed text-theme-primary sm:text-sm">
          {checkboxLabel || "I consent to this processing."}
        </span>
      </label>
      {error ? (
        <p className="mt-2 text-xs text-red-500 sm:text-sm" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
