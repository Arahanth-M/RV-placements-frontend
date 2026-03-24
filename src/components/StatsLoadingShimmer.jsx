import React from "react";

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
