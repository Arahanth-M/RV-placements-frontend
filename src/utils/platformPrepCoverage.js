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
