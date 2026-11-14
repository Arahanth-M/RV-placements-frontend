import { Link } from "react-router-dom";
import { GENERAL_BASE } from "../constants/tenant.js";

/**
 * Inline DPDP feature-consent checkbox block (unticked by default).
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
    <div className={`rounded-xl border border-theme bg-theme-input/40 p-3 sm:p-4 ${className}`}>
      {title ? (
        <p className="text-sm font-semibold text-theme-primary">{title}</p>
      ) : null}
      {summary ? (
        <p className="mt-1 text-xs leading-relaxed text-theme-secondary sm:text-sm">
          {summary}{" "}
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
          className="mt-0.5 h-4 w-4 shrink-0"
          checked={Boolean(checked)}
          disabled={disabled}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
        />
        <span className="text-xs text-theme-primary sm:text-sm">
          {checkboxLabel || "I consent to this processing."}
        </span>
      </label>
      {error ? (
        <p className="mt-2 text-sm text-red-500" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
