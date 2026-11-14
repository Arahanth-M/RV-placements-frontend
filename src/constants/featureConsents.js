/**
 * Feature-level DPDP consents for the general platform.
 * Keep versions in sync with backend `FEATURE_CONSENT_VERSIONS`
 * (RV-placements-backend/config/featureConsents.js).
 */
export const FEATURE_CONSENT_IDS = Object.freeze({
  AI_INTERVIEW: "aiInterview",
  BILLING_CHECKOUT: "billingCheckout",
  PREP_PATH: "prepPath",
  BEHAVIORAL_COACH: "behavioralCoach",
});

export const FEATURE_CONSENT_VERSIONS = Object.freeze({
  [FEATURE_CONSENT_IDS.AI_INTERVIEW]: "2026-11-13",
  [FEATURE_CONSENT_IDS.BILLING_CHECKOUT]: "2026-11-13",
  [FEATURE_CONSENT_IDS.PREP_PATH]: "2026-11-13",
  [FEATURE_CONSENT_IDS.BEHAVIORAL_COACH]: "2026-11-13",
});

export const FEATURE_CONSENT_COPY = Object.freeze({
  [FEATURE_CONSENT_IDS.AI_INTERVIEW]: {
    title: "AI interview data consent",
    summary:
      "To run this mock interview we store your answers (including code), scores, feedback, and session details so we can evaluate them with AI providers and show you results.",
    checkboxLabel:
      "I consent to storing and processing my interview answers and related session data for AI mock interviews as described in the Privacy Policy.",
  },
  [FEATURE_CONSENT_IDS.BILLING_CHECKOUT]: {
    title: "Payment data consent",
    summary:
      "Checkout is processed by Razorpay. We store your plan, order/payment identifiers, amount (including GST), and entitlement details. We do not store full card numbers or UPI PINs.",
    checkboxLabel:
      "I consent to processing my billing details via Razorpay and storing payment/entitlement records as described in the Privacy Policy.",
  },
  [FEATURE_CONSENT_IDS.PREP_PATH]: {
    title: "PrepPath resume & JD consent",
    summary:
      "To generate your plan we process your uploaded resume and optional job description (JD) with AI. We may store a short resume digest and plan outputs. If you do not agree, we will not generate a plan or keep the uploaded files.",
    checkboxLabel:
      "I consent to processing my resume and JD to generate a PrepPath plan, as described in the Privacy Policy.",
  },
  [FEATURE_CONSENT_IDS.BEHAVIORAL_COACH]: {
    title: "Behavioural coach data consent",
    summary:
      "To run behavioural coaching we store your answers, scores, and feedback so we can evaluate them with AI providers and show you results.",
    checkboxLabel:
      "I consent to storing and processing my behavioural coach answers and related session data as described in the Privacy Policy.",
  },
});

export function featureNeedsConsent(user, featureId) {
  const entry = user?.featureConsents?.[featureId];
  if (entry && typeof entry.needsConsent === "boolean") {
    return entry.needsConsent === true;
  }
  return true;
}

export function requiredFeatureConsentVersion(user, featureId) {
  return (
    user?.featureConsents?.[featureId]?.requiredVersion ||
    FEATURE_CONSENT_VERSIONS[featureId] ||
    ""
  );
}
