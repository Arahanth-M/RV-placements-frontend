import React from "react";

/** Footnote marker next to CTC / internship stipend labels (inline with label, not superscript). */
export function CompensationAsterisk({ className }) {
  const sizing =
    "inline align-baseline ml-0.5 text-[13px] sm:text-sm leading-none font-semibold";
  return (
    <span
      className={`${sizing} ${className ?? "text-theme-muted"}`.trim()}
      aria-hidden
    >
      *
    </span>
  );
}

export {
  formatInternshipStipendDisplay,
  isStipendNotApplicable,
} from "../utils/compensationDisplay.js";

/** Single-line disclaimer shown below compensation figures */
export function CompensationDisclaimerFootnote({ className }) {
  return (
    <p
      role="note"
      className={
        className ??
        "text-[11px] sm:text-xs text-theme-muted mt-2 italic leading-snug"
      }
    >
      * Subject to change.
    </p>
  );
}
