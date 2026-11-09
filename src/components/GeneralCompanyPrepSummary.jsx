import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { buildGeneralCompanyPrepSummary } from "../utils/generalCompanyPrepSummary.js";
import {
  applyCardDisplayPrepBoost,
  formatPlatformPrepCoverage,
} from "../utils/platformPrepCoverage.js";

/** Keep grid cards the same height: show this many roles, then “+N more”. */
export const COMPANY_CARD_VISIBLE_ROLES = 5;

/** Fixed block height = 5 role rows + “+N more” row (keeps short lists aligned). */
const COMPANY_CARD_ROLES_BLOCK_CLASS =
  "mb-4 flex h-[16.25rem] w-full min-w-0 shrink-0 flex-col gap-y-2.5 overflow-hidden";

function MoreRolesHoverButton({
  remainingRows,
  remainingCount,
  onMoreRolesClick,
}) {
  const buttonRef = useRef(null);
  const closeTimerRef = useRef(null);
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const openPanel = () => {
    clearCloseTimer();
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = 260;
    const left = Math.min(
      Math.max(8, rect.left),
      window.innerWidth - width - 8
    );
    setCoords({ top: rect.bottom + 6, left });
    setOpen(true);
  };

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => setOpen(false), 120);
  };

  useEffect(() => () => clearCloseTimer(), []);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onMouseEnter={openPanel}
        onMouseLeave={scheduleClose}
        onFocus={openPanel}
        onBlur={scheduleClose}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onMoreRolesClick?.(event);
        }}
        className="text-xs font-semibold leading-5 text-theme-accent hover:underline sm:text-sm"
        data-testid="company-prep-more-roles"
      >
        +{remainingCount} more role{remainingCount === 1 ? "" : "s"}
      </button>
      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              id={panelId}
              role="tooltip"
              data-testid="company-prep-more-roles-popover"
              className="fixed z-[80] max-h-64 w-[min(16.25rem,calc(100vw-1rem))] overflow-y-auto rounded-xl border border-theme bg-theme-card p-3 shadow-xl"
              style={{ top: coords.top, left: coords.left }}
              onMouseEnter={openPanel}
              onMouseLeave={scheduleClose}
            >
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-theme-muted">
                More roles
              </p>
              <ul className="space-y-2">
                {remainingRows.map((row) => (
                  <li key={`${row.key}::${row.label}`} className="min-w-0">
                    <p className="truncate text-xs font-semibold text-theme-primary sm:text-sm">
                      {row.label}
                    </p>
                    <p className="text-[11px] leading-snug text-theme-secondary tabular-nums">
                      {row.line}
                    </p>
                  </li>
                ))}
              </ul>
            </div>,
            document.body
          )
        : null}
    </>
  );
}

/**
 * /general company card + detail header: roles, last updated, prep counts.
 */
export default function GeneralCompanyPrepSummary({
  company,
  variant = "detail",
  className = "",
  /** Card UI only: fill zero OA / interview / experience counts with 5–10. */
  boostZeroPrepCounts = false,
  /** Card UI: open full details when “+N more roles” is clicked. */
  onMoreRolesClick,
}) {
  const {
    rolesLine,
    countsLine,
    countsLineCard,
    roleCoverage,
    oa,
    interview,
    experiences,
  } = buildGeneralCompanyPrepSummary(company);
  const compact = variant === "card";
  const companySeed = String(company?._id || company?.id || company?.name || "company");
  const shouldBoost = compact && boostZeroPrepCounts;

  const cardRoleCoverage =
    shouldBoost && roleCoverage.length > 0
      ? roleCoverage.map((row) => {
          const boosted = applyCardDisplayPrepBoost(
            {
              oa: row.oa,
              interview: row.interview,
              experiences: row.experiences,
            },
            { companySeed, roleKey: row.key || row.label }
          );
          return {
            ...row,
            line: formatPlatformPrepCoverage(boosted).line,
          };
        })
      : roleCoverage;

  const cardCountsLine = shouldBoost
    ? formatPlatformPrepCoverage(
        applyCardDisplayPrepBoost(
          { oa, interview, experiences },
          { companySeed, roleKey: "all" }
        )
      ).line
    : countsLineCard;

  if (compact) {
    if (cardRoleCoverage.length > 0) {
      const visibleRoles = cardRoleCoverage.slice(0, COMPANY_CARD_VISIBLE_ROLES);
      const remainingRoles = Math.max(
        0,
        cardRoleCoverage.length - visibleRoles.length
      );
      return (
        <ul
          className={`${COMPANY_CARD_ROLES_BLOCK_CLASS} ${className}`.trim()}
          data-testid="company-prep-coverage"
        >
          {visibleRoles.map((row) => (
            <li key={`${row.key}::${row.label}`} className="min-w-0 shrink-0">
              <p className="truncate text-xs font-semibold leading-5 text-theme-primary sm:text-sm">
                {row.label}
              </p>
              <p className="text-[clamp(9px,3.2cqi,11px)] leading-4 tracking-tight text-theme-secondary tabular-nums break-words [overflow-wrap:anywhere] sm:text-xs sm:leading-4">
                {row.line}
              </p>
            </li>
          ))}
          {remainingRoles > 0 ? (
            <li className="relative z-[1] min-w-0 shrink-0">
              <MoreRolesHoverButton
                remainingRows={cardRoleCoverage.slice(COMPANY_CARD_VISIBLE_ROLES)}
                remainingCount={remainingRoles}
                onMoreRolesClick={onMoreRolesClick}
              />
            </li>
          ) : (
            <li className="h-5 shrink-0" aria-hidden="true" />
          )}
          {/* Fills leftover space when fewer than 5 roles so cards stay equal height. */}
          <li className="min-h-0 flex-1" aria-hidden="true" />
        </ul>
      );
    }

    return (
      <div
        className={`${COMPANY_CARD_ROLES_BLOCK_CLASS} ${className}`.trim()}
        data-testid="company-prep-coverage"
      >
        <p className="w-full min-w-0 text-[clamp(9px,3.2cqi,11px)] sm:text-xs leading-snug tracking-tight text-theme-secondary tabular-nums break-words [overflow-wrap:anywhere]">
          {cardCountsLine}
        </p>
      </div>
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
      <p className="text-theme-muted text-sm sm:text-base md:text-lg font-normal tabular-nums">
        {countsLine}
      </p>
    </div>
  );
}
