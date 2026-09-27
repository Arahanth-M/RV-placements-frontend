import { buildGeneralCompanyPrepSummary } from "../utils/generalCompanyPrepSummary.js";

/**
 * /general company card + detail header: roles, last updated, prep counts.
 */
export default function GeneralCompanyPrepSummary({
  company,
  variant = "detail",
  className = "",
}) {
  const { rolesLine, updatedLine, countsLine, countsLineCard } =
    buildGeneralCompanyPrepSummary(company);
  const compact = variant === "card";

  if (compact) {
    return (
      <p
        className={`mb-4 w-full min-w-0 text-[clamp(9px,3.2cqi,11px)] sm:text-xs leading-snug tracking-tight text-theme-secondary tabular-nums break-words [overflow-wrap:anywhere] ${className}`.trim()}
        data-testid="company-prep-coverage"
      >
        {countsLineCard}
      </p>
    );
  }

  return (
    <div
      className={`mt-2 sm:mt-3 space-y-1.5 sm:space-y-2 text-base sm:text-lg md:text-xl text-theme-secondary font-medium ${className}`.trim()}
      data-testid="general-company-prep-summary"
    >
      <p className="break-words">
        <span className="font-semibold text-theme-primary">Roles:</span> {rolesLine}
      </p>
      <p>{updatedLine}</p>
      <p className="text-theme-muted text-sm sm:text-base md:text-lg font-normal tabular-nums">
        {countsLine}
      </p>
    </div>
  );
}
