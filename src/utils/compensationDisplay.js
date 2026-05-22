/** Missing, empty, or zero stipend → not applicable for display. */
export function isStipendNotApplicable(value) {
  if (value === null || value === undefined) return true;
  const s = String(value).trim();
  if (!s) return true;
  if (/^n\/a$/i.test(s)) return true;
  const n = Number(s.replace(/,/g, ""));
  return Number.isFinite(n) && n === 0;
}

/**
 * Company role `internshipStipend` or placement `stipend` / `6-months-internship-stipend` for UI.
 * Shows N/A instead of 0 when there is no internship stipend.
 */
export function formatInternshipStipendDisplay(value) {
  if (isStipendNotApplicable(value)) return "N/A";
  const s = String(value).trim();
  if (/^tbd$/i.test(s)) return "TBD";
  const n = Number(s.replace(/,/g, ""));
  if (Number.isFinite(n) && n > 0) {
    return `₹ ${n.toLocaleString("en-IN")}`;
  }
  if (s.startsWith("₹")) return s;
  if (/\d/.test(s)) return `₹ ${s}`;
  return s;
}
