/**
 * Format /general company-card prep coverage from list API counts.
 * @param {unknown} coverage
 * @returns {{ oa: number, interview: number, experiences: number, line: string }}
 */
export function formatPlatformPrepCoverage(coverage) {
  const oa = Math.max(0, Number(coverage?.oa) || 0);
  const interview = Math.max(0, Number(coverage?.interview) || 0);
  const experiences = Math.max(0, Number(coverage?.experiences) || 0);
  const exprLabel = experiences > 1 ? "interview exprs" : "interview expr";
  return {
    oa,
    interview,
    experiences,
    line: `${oa} OA · ${interview} interview q's · ${experiences} ${exprLabel}`,
  };
}

/**
 * @param {unknown} coverage
 * @returns {string}
 */
export function formatPlatformPrepCoverageLine(coverage) {
  return formatPlatformPrepCoverage(coverage).line;
}

/** Stable 5–10 for card UI only (same seed → same value). */
export function stableCardDisplayCount(seed) {
  const text = String(seed ?? "");
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (Math.abs(hash >>> 0) % 6) + 5;
}

/**
 * Company-card display tweak: replace zero OA / interview / experience counts
 * with a stable 5–10. Caller decides which cards to apply this to.
 */
export function applyCardDisplayPrepBoost(counts, { companySeed, roleKey = "" } = {}) {
  const oa = Math.max(0, Number(counts?.oa) || 0);
  const interview = Math.max(0, Number(counts?.interview) || 0);
  const experiences = Math.max(0, Number(counts?.experiences) || 0);
  const base = `${companySeed}::${roleKey}`;
  return {
    oa: oa === 0 ? stableCardDisplayCount(`${base}:oa`) : oa,
    interview: interview === 0 ? stableCardDisplayCount(`${base}:iq`) : interview,
    experiences: experiences === 0 ? stableCardDisplayCount(`${base}:exp`) : experiences,
  };
}
