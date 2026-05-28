import React from "react";
import {
  PageBackButton,
  PageBackNavRow,
  pageShellInnerClass,
  pageShellOuterClass,
} from "./PageBackNav.jsx";

/** Theme-aware shimmer block (uses global `.stats-shimmer` in index.css). */
function Shimmer({ className = "" }) {
  return (
    <div
      className={`stats-shimmer border-0 ${className}`.trim()}
      aria-hidden="true"
    />
  );
}

function ProfileHeaderShimmer() {
  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex items-center gap-4 rounded-xl border border-theme bg-theme-card px-6 py-4 shadow-sm">
        <Shimmer className="h-12 w-12 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2.5">
          <Shimmer className="h-8 w-48 max-w-[85%] rounded-lg sm:h-9 sm:w-56" />
          <Shimmer className="h-4 w-36 max-w-[70%] rounded-md opacity-90" />
        </div>
      </div>
    </div>
  );
}

function ProfileSectionShimmer({ rowWidths, rowCount = 4 }) {
  const widths =
    rowWidths ||
    Array.from({ length: rowCount }, (_, i) =>
      i % 3 === 0 ? "w-[88%]" : i % 3 === 1 ? "w-[62%]" : "w-[76%]"
    );

  return (
    <div className="rounded-xl border border-theme bg-theme-card p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center gap-2 border-b border-theme pb-2 sm:mb-4 sm:pb-2">
        <Shimmer className="h-5 w-5 shrink-0 rounded-md" />
        <Shimmer className="h-6 w-44 max-w-[75%] rounded-md" />
      </div>
      <div className="divide-y divide-theme border-t border-theme">
        {widths.map((valueWidth, idx) => (
          <div key={idx} className="py-3 sm:py-3.5">
            <div className="sm:hidden">
              <Shimmer className={`h-4 ${valueWidth} max-w-full rounded-md`} />
            </div>
            <div className="hidden sm:flex sm:items-start sm:gap-6 md:gap-8">
              <Shimmer className="h-4 w-36 shrink-0 rounded-md md:w-44 lg:w-48" />
              <Shimmer
                className={`h-4 min-w-0 flex-1 rounded-md opacity-90 ${
                  idx % 2 === 0 ? "max-w-[70%]" : "max-w-[55%]"
                }`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StudentProfilePageShimmer({ onBack }) {
  return (
    <div
      className={`min-h-screen overflow-y-auto ${pageShellOuterClass}`}
      aria-busy="true"
      aria-label="Loading profile"
    >
      <div className={pageShellInnerClass}>
        <PageBackNavRow>
          <PageBackButton onClick={onBack} />
        </PageBackNavRow>

        <div className="pointer-events-none select-none">
        <ProfileHeaderShimmer />

        <div className="space-y-6">
          <ProfileSectionShimmer rowCount={4} rowWidths={["w-[90%]", "w-[72%]", "w-[48%]", "w-[64%]"]} />
          <ProfileSectionShimmer
            rowCount={5}
            rowWidths={["w-[85%]", "w-[70%]", "w-[58%]", "w-[80%]", "w-[52%]"]}
          />
        </div>
        </div>
      </div>
    </div>
  );
}

function SubmissionsHeaderShimmer() {
  return (
    <div className="mb-6 sm:mb-5">
      <div className="flex items-center gap-4 rounded-xl border border-theme bg-theme-card px-6 py-4 shadow-sm">
        <Shimmer className="h-12 w-12 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2.5">
          <Shimmer className="h-8 w-44 max-w-[80%] rounded-lg sm:h-9 sm:w-52" />
          <Shimmer className="h-4 w-56 max-w-[90%] rounded-md opacity-90" />
        </div>
      </div>
    </div>
  );
}

function SubmissionsStatCardsShimmer() {
  return (
    <div className="mb-6 grid grid-cols-3 gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-theme bg-theme-card px-4 py-3 shadow-sm"
        >
          <Shimmer className="mb-2 h-3 w-14 rounded" />
          <Shimmer className="h-8 w-10 rounded-md" />
        </div>
      ))}
    </div>
  );
}

function SubmissionsToolbarShimmer() {
  return (
    <div className="mb-5 flex items-center gap-2">
      <Shimmer className="h-10 min-w-0 flex-1 rounded-lg" />
      <Shimmer className="h-10 w-10 shrink-0 rounded-lg" />
      <Shimmer className="h-10 w-10 shrink-0 rounded-lg" />
    </div>
  );
}

function SubmissionCardShimmer({ index = 0 }) {
  return (
    <article
      className="overflow-hidden rounded-xl border border-theme border-l-[3px] border-l-theme-secondary/35 bg-theme-card shadow-sm"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap gap-2">
              <Shimmer className="h-7 w-28 rounded-full" />
              <Shimmer className="h-7 w-[4.5rem] rounded-full" />
              <Shimmer className="hidden h-7 w-20 rounded-full sm:block" />
            </div>
            <Shimmer className="h-5 w-52 max-w-full rounded-md" />
            <Shimmer className="h-4 w-40 max-w-[85%] rounded-md opacity-90" />
            <Shimmer className="h-3 w-64 max-w-full rounded opacity-80" />
          </div>
          <Shimmer className="h-4 w-28 shrink-0 self-start rounded-md" />
        </div>
      </div>
    </article>
  );
}

export function MySubmissionsPageShimmer({ onBack }) {
  return (
    <div
      className={`min-h-screen overflow-y-auto ${pageShellOuterClass}`}
      aria-busy="true"
      aria-label="Loading submissions"
    >
      <div className={pageShellInnerClass}>
        <PageBackNavRow>
          <PageBackButton onClick={onBack} />
        </PageBackNavRow>

        <div className="pointer-events-none select-none">
        <SubmissionsHeaderShimmer />
        <SubmissionsStatCardsShimmer />
        <SubmissionsToolbarShimmer />

        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, idx) => (
            <SubmissionCardShimmer key={idx} index={idx} />
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-theme bg-theme-card p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Shimmer className="h-4 w-48 max-w-full rounded-md" />
            <div className="flex gap-2">
              <Shimmer className="h-9 w-24 rounded-lg" />
              <Shimmer className="h-9 w-20 rounded-lg" />
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
