import React from "react";

/** Horizontal padding + vertical rhythm — matches Events.jsx outer wrapper. */
export const pageShellOuterClass =
  "pt-3 sm:pt-4 pb-8 sm:pb-10 px-4 sm:px-6 lg:px-8 bg-theme-app text-theme-primary";

/** Content column — matches Events.jsx inner wrapper. */
export const pageShellInnerClass = "max-w-7xl mx-auto";

/** Row above page title — matches Events.jsx back strip (flush start on narrow viewports). */
export function PageBackNavRow({ children }) {
  return (
    <div className="mb-2 flex w-full min-w-0 flex-wrap items-center justify-start gap-2">{children}</div>
  );
}

/** Back control — icon + label aligned with Events.jsx. */
export function PageBackButton({ onClick, label = "Back" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="back-nav-clear-sidebar inline-flex shrink-0 items-center back-link-theme text-sm sm:text-base transition-colors"
    >
      <svg
        className="mr-2 h-5 w-5 shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 19l-7-7m0 0l7-7m-7 7h18"
        />
      </svg>
      {label}
    </button>
  );
}
