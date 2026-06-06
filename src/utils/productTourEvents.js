export const TOUR_PREPARE_EVENT = "placement-product-tour:prepare";

export function dispatchTourPrepare(stepId) {
  window.dispatchEvent(
    new CustomEvent(TOUR_PREPARE_EVENT, { detail: { stepId } })
  );
}
