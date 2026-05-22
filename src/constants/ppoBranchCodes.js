/**
 * Branch codes for PPO / SPC placement & conversion (aligned with backend `ppoBranchCodes.js`).
 */
export const PPO_BRANCH_CODES = Object.freeze([
  "cd",
  "cy",
  "ise",
  "cse",
  "aiml",
  "bt",
  "ece",
  "ete",
  "eie",
  "eee",
  "ase",
  "ch",
  "civil",
  "iem",
  "me",
]);

/** @param {string} code */
export function formatPpoBranchLabel(code) {
  return String(code || "").trim().toUpperCase();
}
