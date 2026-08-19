import React from "react";

export function DashboardNavArrow() {
  return (
    <svg
      className="h-3.5 w-3.5 sm:h-4 sm:w-4"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M4 8a.75.75 0 0 1 .75-.75h5.69L8.22 5.03a.75.75 0 0 1 1.06-1.06l3.5 3.5a.75.75 0 0 1 0 1.06l-3.5 3.5a.75.75 0 0 1-1.06-1.06l2.22-2.22H4.75A.75.75 0 0 1 4 8z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function DashboardNavGrid({ children, className = "", role, "aria-label": ariaLabel }) {
  return (
    <div
      className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${className}`}
      role={role}
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
}

export default function DashboardNavCard({
  title,
  description,
  cta = "Open",
  ctaColor = "text-violet-500",
  accent = "border-l-violet-500",
  badge = null,
  badgeLabel = "pending",
  isActive = false,
  activeCta = "Currently viewing",
  onClick,
  role,
  "aria-selected": ariaSelected,
}) {
  const showBadge = badge != null && Number(badge) > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      role={role}
      aria-selected={ariaSelected}
      aria-current={isActive ? "page" : undefined}
      className={`group flex min-w-0 w-full flex-col gap-3.5 overflow-hidden rounded-xl border p-5 sm:p-6 text-left shadow-sm transition-all border-l-[3px] ${accent} ${
        isActive
          ? "border-indigo-500 bg-indigo-600/10 ring-2 ring-indigo-500/35"
          : "border-theme bg-theme-card hover:bg-theme-hero/40"
      }`}
    >
      <div className="flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:justify-between sm:gap-3">
        <p className="min-w-0 w-full break-words text-lg font-semibold text-theme-primary sm:flex-1 sm:text-xl">
          {title}
        </p>
        {showBadge ? (
          <span
            className="inline-flex max-w-full shrink-0 items-center rounded-full border border-red-500/25 bg-red-500/10 px-2.5 py-0.5 text-left text-sm font-semibold leading-snug text-red-500"
            title={`${badge} ${badgeLabel}`}
          >
            {badge} {badgeLabel}
          </span>
        ) : null}
      </div>
      <p className="text-sm leading-6 text-theme-secondary sm:text-base sm:leading-7">
        {description}
      </p>
      <div
        className={`flex items-center gap-1.5 text-sm font-medium sm:text-base ${
          isActive ? "text-indigo-500" : ctaColor
        }`}
      >
        <span>{isActive ? activeCta : cta}</span>
        <DashboardNavArrow />
      </div>
    </button>
  );
}
