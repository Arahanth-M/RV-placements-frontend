/** Shared catalog for college self-onboarding feature pick + approximate pricing. */

export const ONBOARDING_FEATURES = [
  {
    id: "company_insights",
    title: "Company insights",
    text: "Roles, process, and what each company looks for.",
    priceInr: 12000,
  },
  {
    id: "ai_interviews",
    title: "AI interviews by company & role",
    text: "Practice rounds with actionable feedback.",
    priceInr: 28000,
  },
  {
    id: "prep_path",
    title: "PrepPath",
    text: "Guided plan toward target roles.",
    priceInr: 18000,
  },
  {
    id: "resources_must_do",
    title: "Curated resources & must-dos",
    text: "Handpicked links and must-do topics.",
    priceInr: 10000,
  },
  {
    id: "coding_experiences",
    title: "Coding Qs & interview experiences",
    text: "Real questions and campus stories.",
    priceInr: 15000,
  },
  {
    id: "practice_challenges",
    title: "Daily & weekly challenges",
    text: "Short practice bursts vs peers.",
    priceInr: 12000,
  },
  {
    id: "peer_mocks",
    title: "Peer mock pairing",
    text: "Book 30‑minute mocks with classmates.",
    priceInr: 14000,
  },
  {
    id: "behavioral_coach",
    title: "Behavioral answer coach",
    text: "STAR-format practice for HR rounds.",
    priceInr: 12000,
  },
  {
    id: "career_explorer",
    title: "Career explorer",
    text: "Roles, skills, JDs, and salary ranges.",
    priceInr: 10000,
  },
  {
    id: "resume_builder",
    title: "Resume builder + ATS",
    text: "Live preview and ATS checks.",
    priceInr: 16000,
  },
  {
    id: "drive_calendar",
    title: "Drive calendar & reminders",
    text: "Visits, deadlines, eligibility checklists.",
    priceInr: 14000,
  },
  {
    id: "document_vault",
    title: "Private document vault",
    text: "Offers, resumes, certificates in one place.",
    priceInr: 8000,
  },
  {
    id: "hear_from_seniors",
    title: "Hear from seniors",
    text: "Advice from people a step ahead on campus.",
    priceInr: 8000,
  },
  {
    id: "performance_overview",
    title: "Performance overview",
    text: "Strengths, gaps, and progress across practice.",
    priceInr: 12000,
  },
];

export const DATA_EXTENT_OPTIONS = [
  {
    id: "historical_placements",
    label: "Historical placement / package data",
  },
  {
    id: "company_visits",
    label: "Past company visits & drive outcomes",
  },
  {
    id: "interview_experiences",
    label: "Student interview experiences",
  },
  {
    id: "coding_questions",
    label: "Coding / technical questions asked",
  },
  {
    id: "eligibility_cutoffs",
    label: "Eligibility criteria & cutoffs",
  },
  {
    id: "ongoing_drive_updates",
    label: "Ongoing drive updates during the season",
  },
];

/** Platform setup fee before feature add-ons (INR / year, approximate). */
export const ONBOARDING_BASE_PRICE_INR = 45000;

/**
 * Approximate annual quote used for the self-onboard configurator.
 * Providing campus data applies a discount (more extent → higher discount, capped).
 */
export function estimateOnboardingPrice({
  selectedFeatureIds = [],
  willProvideData = false,
  dataExtentIds = [],
} = {}) {
  const selected = new Set(
    (Array.isArray(selectedFeatureIds) ? selectedFeatureIds : []).map((id) =>
      String(id || "").trim().toLowerCase()
    )
  );

  let total = ONBOARDING_BASE_PRICE_INR;
  for (const feature of ONBOARDING_FEATURES) {
    if (selected.has(feature.id)) total += feature.priceInr;
  }

  if (willProvideData) {
    const extentCount = (Array.isArray(dataExtentIds) ? dataExtentIds : []).filter(Boolean)
      .length;
    const discountPct = Math.min(25, 8 + extentCount * 3);
    total = Math.round(total * (1 - discountPct / 100));
  }

  return Math.max(0, Math.round(total));
}

export function formatInr(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}
