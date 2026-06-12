import React from "react";

/** Horizontal padding + vertical rhythm — matches Events.jsx outer wrapper. */
export const pageShellOuterClass =
  "pt-3 sm:pt-4 pb-8 sm:pb-10 px-4 sm:px-6 lg:px-8 bg-theme-app text-theme-primary";

/** Tighter top padding for pages with the serif hero header (Contact, Events, etc.). */
export const pageShellOuterClassCompact =
  "pt-1 sm:pt-2 pb-8 sm:pb-10 px-4 sm:px-6 lg:px-8 bg-theme-app text-theme-primary";

/** Content column — matches Events.jsx inner wrapper. */
export const pageShellInnerClass = "max-w-7xl mx-auto";

const PAGE_HERO_LABEL_STYLE = {
  fontSize: "13px",
  fontWeight: 600,
  letterSpacing: "0.13em",
  textTransform: "uppercase",
  color: "#6366F1",
  marginBottom: "0.5rem",
};

const PAGE_HERO_TITLE_STYLE = {
  fontFamily: "'DM Serif Display', Georgia, serif",
  fontSize: "clamp(1.85rem, 4.2vw, 2.85rem)",
  fontWeight: 400,
  lineHeight: 1.15,
  marginBottom: "0.65rem",
};

const PAGE_HERO_SUBTITLE_STYLE = {
  fontSize: "16px",
  color: "var(--text-secondary)",
  lineHeight: 1.6,
  margin: "0 auto",
};

/** DM Serif Display import for page hero headings. */
export function PageHeroFontStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&display=swap');
    `}</style>
  );
}

/** Shared "Placement prep" hero block — compact spacing and title size. */
export function PageHeroHeader({ children, subtitle, subtitleClassName = "", subtitleMaxWidth = "620px" }) {
  return (
    <div className="-mt-2 sm:-mt-3 mb-6 sm:mb-8 text-center">
      <p style={PAGE_HERO_LABEL_STYLE}>Placement prep</p>
      <h1 className="text-theme-primary" style={PAGE_HERO_TITLE_STYLE}>
        {children}
      </h1>
      {subtitle ? (
        <p
          className={subtitleClassName}
          style={{ ...PAGE_HERO_SUBTITLE_STYLE, maxWidth: subtitleMaxWidth }}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

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
