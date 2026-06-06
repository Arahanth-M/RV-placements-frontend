export const PRODUCT_TOUR_VERSION = 4;

const COMPLETED_KEY = `placementProductTourCompleted_v${PRODUCT_TOUR_VERSION}`;
const PROMPT_DISMISSED_KEY = `placementProductTourPromptDismissed_v${PRODUCT_TOUR_VERSION}`;

export function isTourCompleted() {
  try {
    return localStorage.getItem(COMPLETED_KEY) === "true";
  } catch {
    return false;
  }
}

export function markTourCompleted() {
  try {
    localStorage.setItem(COMPLETED_KEY, "true");
  } catch {
    /* ignore quota / private mode */
  }
}

export function isTourPromptDismissed() {
  try {
    return localStorage.getItem(PROMPT_DISMISSED_KEY) === "true";
  } catch {
    return false;
  }
}

export function dismissTourPrompt() {
  try {
    localStorage.setItem(PROMPT_DISMISSED_KEY, "true");
  } catch {
    /* ignore */
  }
}
