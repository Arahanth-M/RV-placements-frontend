/** Number of rotating accent styles for OA / interview / coding solution blocks */
export const SOLUTION_PALETTE_COUNT = 6;

/**
 * @param {number} index - question or item index (any integer; normalized with modulo)
 * @returns {string} e.g. "sol-block sol-block--3"
 */
export function solutionBlockClass(index) {
  const raw =
    typeof index === "number" && !Number.isNaN(index) ? Math.floor(index) : 0;
  const n =
    ((raw % SOLUTION_PALETTE_COUNT) + SOLUTION_PALETTE_COUNT) %
    SOLUTION_PALETTE_COUNT;
  return `sol-block sol-block--${n}`;
}
