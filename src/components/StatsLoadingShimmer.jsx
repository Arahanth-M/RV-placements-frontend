import React from "react";

const DEFAULT_COMPANY_CARD_SHIMMER_COUNT = 9;

/**
 * Skeleton grid for CompanyStats tier lists — matches the company card grid (1 / 2 / 3 columns).
 * @param {{ count?: number, className?: string }} [props]
 */
export function CompanyCardGridShimmer({
  count = DEFAULT_COMPANY_CARD_SHIMMER_COUNT,
  className = "",
}) {
  return (
    <div
      className={`company-grid grid w-full min-w-0 max-w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 items-stretch auto-rows-fr col-span-full ${className}`.trim()}
      aria-busy="true"
      aria-label="Loading companies"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl shadow-md p-5 sm:p-6 company-card h-full w-full min-w-0 max-w-full flex flex-col bg-theme-card border-2 border-theme pointer-events-none"
        >
          <div className="flex items-center gap-3 mb-4 flex-shrink-0">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex-shrink-0 stats-shimmer border border-theme" />
            <div className="flex-1 min-w-0 space-y-2">
              <div className="h-6 sm:h-7 w-full max-w-[14rem] stats-shimmer rounded-lg" />
              <div className="h-4 w-2/3 max-w-[10rem] stats-shimmer rounded opacity-90" />
            </div>
          </div>
          <div className="flex-1 flex flex-col gap-3 min-w-0">
            <div className="h-4 w-4/5 stats-shimmer rounded" />
            <div className="h-3 w-full stats-shimmer rounded opacity-80" />
            <div className="h-3 w-5/6 stats-shimmer rounded opacity-80" />
            <div className="mt-2 h-3 w-2/3 stats-shimmer rounded opacity-70" />
          </div>
          <div className="mt-4 space-y-3 flex-shrink-0">
            <div className="h-10 w-full stats-shimmer rounded-xl" />
            <div className="h-px w-full border-t border-theme opacity-40" />
            <div className="h-4 w-1/2 stats-shimmer rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

const DEFAULT_CATEGORY_TILE_SHIMMER_COUNT = 5;

/**
 * Skeleton grid for CompanyStats cluster category tiles (Dream, Open dream, etc.).
 * @param {{ count?: number, className?: string }} [props]
 */
export function CategoryTilesGridShimmer({
  count = DEFAULT_CATEGORY_TILE_SHIMMER_COUNT,
  className = "",
}) {
  return (
    <div
      className={`mx-auto grid min-w-0 w-full max-w-6xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 md:gap-6 auto-rows-fr items-stretch ${className}`.trim()}
      aria-busy="true"
      aria-label="Loading categories"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="company-card flex h-full min-h-0 w-full min-w-0 flex-col rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 border-2 bg-theme-card border-theme pointer-events-none"
        >
          <div className="flex h-full min-h-0 min-w-0 flex-col">
            <div className="h-6 sm:h-7 md:h-8 w-3/4 max-w-[14rem] stats-shimmer rounded-lg mb-2 sm:mb-3 flex-shrink-0" />
            <div className="flex flex-1 items-center justify-center mb-3 min-h-[156px] sm:mb-4 sm:min-h-[120px] md:min-h-[140px]">
              <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full max-w-[200px]">
                {Array.from({ length: 6 }).map((__, j) => (
                  <div
                    key={j}
                    className="aspect-square rounded-lg stats-shimmer border border-theme opacity-90"
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between mt-auto pt-1 border-t border-theme">
              <div className="h-4 w-24 stats-shimmer rounded" />
              <div className="h-4 w-4 stats-shimmer rounded opacity-70" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Theme-aware shimmer blocks for year stats table + analytics loading states */
export function YearStatsTableShimmer({ yearLabel = "" }) {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading statistics">
      <div className="h-5 w-48 stats-shimmer rounded-md ml-16 sm:ml-20" />

      <div className="flex gap-1 p-1 rounded-lg border border-theme bg-theme-card max-w-md">
        <div className="flex-1 h-10 stats-shimmer rounded-md" />
        <div className="flex-1 h-10 stats-shimmer rounded-md opacity-60" />
      </div>

      <div className="bg-theme-card border border-theme rounded-xl shadow-lg overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-theme space-y-4">
          <div className="h-7 w-64 stats-shimmer rounded-md" />
          <div className="h-10 w-full max-w-sm stats-shimmer rounded-lg" />
          <div className="h-4 w-40 stats-shimmer rounded-md opacity-80" />
        </div>
        <div className="p-2 sm:p-4 space-y-2">
          <div className="flex gap-2 px-2 py-2 border-b border-theme">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-4 flex-1 stats-shimmer rounded opacity-90" style={{ minWidth: "3rem" }} />
            ))}
          </div>
          {Array.from({ length: 8 }).map((_, row) => (
            <div key={row} className="flex gap-2 px-2 py-3 border-b border-theme/60 last:border-0">
              {[1, 2, 3, 4, 5].map((col) => (
                <div
                  key={col}
                  className="h-4 flex-1 stats-shimmer rounded"
                  style={{ opacity: 0.75 + (col % 3) * 0.08 }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      {yearLabel ? (
        <p className="text-center text-sm text-theme-muted sr-only">Loading {yearLabel} statistics</p>
      ) : null}
    </div>
  );
}

export function AnalyticsGridShimmer({ embedded = false, year = null }) {
  const cardGrid = (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="bg-theme-card border border-theme rounded-xl shadow-lg p-6 space-y-4"
        >
          <div className="h-6 w-3/4 max-w-[12rem] stats-shimmer rounded-md" />
          <div className="h-px w-full bg-theme opacity-40" />
          <div className="space-y-3">
            <div className="h-4 w-full stats-shimmer rounded" />
            <div className="h-4 w-full stats-shimmer rounded opacity-90" />
            <div className="h-4 max-w-[85%] stats-shimmer rounded opacity-80" />
          </div>
        </div>
      ))}
    </div>
  );

  const section = (key, showHeading) => (
    <div key={key} className="mb-12">
      {showHeading && (
        <div className="h-8 w-72 max-w-full mx-auto stats-shimmer rounded-md mb-6" />
      )}
      {cardGrid}
    </div>
  );

  const showFullPageBothYears = !embedded && (year === null || year === undefined);
  const showSingleYearEmbedded = embedded && (year === 2024 || year === 2025);

  return (
    <div className="w-full" aria-busy="true" aria-label="Loading analytics">
      {!embedded && (
        <div className="h-10 sm:h-12 md:h-14 w-80 max-w-full mx-auto stats-shimmer rounded-lg mb-8" />
      )}
      {showFullPageBothYears ? (
        <>
          {section("y24", true)}
          {section("y25", true)}
        </>
      ) : showSingleYearEmbedded ? (
        section("embed", false)
      ) : (
        section("single", !embedded)
      )}
      <p className="text-center text-sm text-theme-muted mt-4">Loading analytics data…</p>
    </div>
  );
}
