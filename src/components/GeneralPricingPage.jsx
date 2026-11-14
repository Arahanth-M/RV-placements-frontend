import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FaCheck, FaCheckCircle, FaInfoCircle, FaTimes } from "react-icons/fa";
import { billingAPI } from "../utils/api";
import { useAuth } from "../utils/AuthContext";
import { loadRazorpayCheckoutScript } from "../utils/loadRazorpay.js";
import { GENERAL_COMPANY_CATEGORIES } from "../utils/generalCompanyCategory.js";
import { GENERAL_BASE } from "../constants/tenant.js";
import {
  FEATURE_CONSENT_COPY,
  FEATURE_CONSENT_IDS,
} from "../constants/featureConsents.js";
import { useFeatureConsent } from "../hooks/useFeatureConsent.js";
import {
  PageBackButton,
  PageBackNavRow,
  PageHeroFontStyles,
  PageHeroHeader,
  pageShellInnerClass,
  pageShellOuterClassCompact,
} from "./PageBackNav.jsx";
import ThemedSelect from "./ThemedSelect.jsx";

const BILLING_CONSENT_COPY =
  FEATURE_CONSENT_COPY[FEATURE_CONSENT_IDS.BILLING_CHECKOUT];

const PLAN_ORDER = ["category", "prep_path", "mocks", "all_premium"];

/** Flat feature rows for the compare table (aligned to PLAN_ORDER columns). */
const COMPARISON_ROWS = [
  {
    id: "company_cards",
    label: "Company-card details",
    hint: "Full details for each company",
    values: {
      category: "One category",
      prep_path: "All categories",
      mocks: "All categories",
      all_premium: "All categories",
    },
  },
  {
    id: "ai_mocks",
    label: "AI mock interviews",
    hint: "Practise for any company",
    values: {
      category: false,
      prep_path: false,
      mocks: "Unlimited",
      all_premium: "Unlimited",
    },
  },
  {
    id: "prep_path",
    label: "PrepPath plans",
    hint: "Step-by-step prep plan",
    values: {
      category: false,
      prep_path: "Unlimited",
      mocks: false,
      all_premium: "Unlimited",
    },
  },
  {
    id: "behavioral",
    label: "Behavioural coach",
    hint: "Questions answered by the coach",
    values: {
      category: "3 per hour",
      prep_path: "Unlimited",
      mocks: "Unlimited",
      all_premium: "Unlimited",
    },
  },
  {
    id: "peer_sessions",
    label: "Peer sessions",
    hint: "Peer interviews, study groups, doubt sessions",
    values: {
      category: false,
      prep_path: false,
      mocks: false,
      all_premium: "Included",
    },
  },
];

const PLAN_INFO = {
  trial: {
    includes: [
      "Full details for the first company in each category",
      "1 lifetime AI mock interview (any company)",
      "1 lifetime PrepPath plan",
      "1 lifetime behavioural coach question + evaluation",
    ],
    excludes: [
      "Full details for other companies in a category",
      "Unlimited AI mocks",
      "Unlimited PrepPath",
      "Unlimited behavioural coach",
      "Peer sessions",
    ],
  },
  category: {
    includes: [
      "Full company-card details for every company in the category you choose",
      "Unlimited behavioural coach (up to 3 questions per hour)",
    ],
    excludes: [
      "AI mock interviews",
      "PrepPath",
      "Peer sessions",
      "Companies in other categories",
    ],
  },
  prep_path: {
    includes: [
      "Unlimited PrepPath plans for 6 months",
      "Full company-card details for every company",
      "Unlimited behavioural coach (up to 3 questions per hour)",
    ],
    excludes: ["Unlimited AI mock interviews", "Peer sessions"],
  },
  mocks: {
    includes: [
      "Unlimited AI mock interviews for 6 months",
      "Full company-card details for every company",
      "Unlimited behavioural coach (up to 3 questions per hour)",
    ],
    excludes: ["Unlimited PrepPath", "Peer sessions"],
  },
  all_premium: {
    includes: [
      "Full company-card details for every company",
      "Unlimited AI mock interviews for 6 months",
      "Unlimited PrepPath for 6 months",
      "Peer sessions (interviews, study groups, doubts)",
      "Unlimited behavioural coach (up to 3 questions per hour)",
    ],
    excludes: [],
  },
  all_cards: {
    includes: [
      "Full company-card details for every company",
      "Unlimited behavioural coach (up to 3 questions per hour)",
    ],
    excludes: ["AI mock interviews", "PrepPath", "Peer sessions"],
  },
  mocks_prep: {
    includes: [
      "Unlimited AI mock interviews",
      "Unlimited PrepPath",
      "Unlimited behavioural coach (up to 3 questions per hour)",
    ],
    excludes: ["Unlocking extra company cards", "Peer sessions"],
  },
};

function PlanInfoHint({ planId }) {
  const info = PLAN_INFO[planId];
  const [open, setOpen] = useState(false);
  const closeTimerRef = useRef(null);

  useEffect(
    () => () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    },
    []
  );

  if (!info) return null;

  const show = () => {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    setOpen(true);
  };
  const hide = () => {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => setOpen(false), 120);
  };

  return (
    <span
      className="relative inline-flex shrink-0"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      <button
        type="button"
        className="inline-flex h-6 w-6 items-center justify-center rounded-full text-theme-muted transition-colors hover:text-theme-accent"
        aria-label="What this plan includes"
        aria-expanded={open}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <FaInfoCircle className="h-3.5 w-3.5" aria-hidden />
      </button>
      {open ? (
        <div
          className="absolute right-0 top-full z-30 mt-2 w-64 rounded-xl border border-theme bg-theme-card p-3 text-left shadow-xl sm:w-72"
          role="tooltip"
          aria-label="Plan details"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-theme-accent">Includes</p>
          <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-theme-secondary">
            {info.includes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {info.excludes.length ? (
            <>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-theme-muted">
                Does not include
              </p>
              <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-theme-secondary">
                {info.excludes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      ) : null}
    </span>
  );
}

function formatExpiry(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function categoryLabel(categoryId) {
  const id = String(categoryId || "").trim();
  return GENERAL_COMPANY_CATEGORIES.find((row) => row.id === id)?.label || id;
}

function alreadyOwnsPlan(summary, planId, categoryId = "") {
  const id = String(planId || "").trim();
  if (id === "all_premium") {
    return Boolean(
      summary.allCards && summary.mocks && summary.prepPath && summary.peerSessions
    );
  }
  if (id === "all_cards") return Boolean(summary.allCards);
  if (id === "mocks") return Boolean(summary.mocks);
  if (id === "prep_path") return Boolean(summary.prepPath);
  if (id === "mocks_prep") return Boolean(summary.mocks && summary.prepPath);
  if (id === "category") {
    if (summary.allCards) return true;
    const cat = String(categoryId || "").trim();
    if (!cat) return false;
    return Boolean(summary.categories?.[cat]);
  }
  return false;
}

function paidPlanTitle(plan, entitlement) {
  const name = plan?.name || "Paid plan";
  if (plan?.id === "category" || entitlement?.categoryId) {
    const label = categoryLabel(entitlement?.categoryId);
    return label ? `${name} (${label})` : name;
  }
  return name;
}

/** Continuous selected-column chrome. */
function selectedColumnStyle({ edge = "middle" } = {}) {
  const shadows = ["inset 2px 0 0 0 var(--accent)", "inset -2px 0 0 0 var(--accent)"];
  if (edge === "start" || edge === "alone") {
    shadows.unshift("inset 0 3px 0 0 var(--accent)");
  }
  if (edge === "end" || edge === "alone") {
    shadows.push("inset 0 -3px 0 0 var(--accent)");
  }
  return {
    backgroundColor: "color-mix(in srgb, var(--accent) 14%, var(--bg-card))",
    boxShadow: shadows.join(", "),
  };
}

function ComparisonValue({ value, emphasized = false }) {
  if (value === false || value == null) {
    return (
      <span
        className="inline-flex h-5 w-5 items-center justify-center rounded border-2 border-theme-muted/40 text-theme-muted/70"
        aria-label="Not included"
      >
        <FaTimes className="h-2.5 w-2.5" aria-hidden />
      </span>
    );
  }

  const label = String(value);
  const isBroad =
    label.toLowerCase() === "unlimited" || label.toLowerCase().startsWith("all ");

  // Selected column: limited perks as accent pills (matches mock).
  if (emphasized && !isBroad) {
    return (
      <span className="inline-flex rounded-full bg-theme-accent px-3 py-1 text-xs font-semibold text-white shadow-sm">
        {label}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center justify-center gap-2 text-sm text-theme-secondary">
      <span
        className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 border-theme-muted/40 text-theme-muted"
        aria-hidden
      >
        <FaCheck className="h-2.5 w-2.5" />
      </span>
      <span className="font-medium">{label}</span>
    </span>
  );
}

const PLAN_SHORT = {
  category: "One category",
  prep_path: "PrepPath",
  mocks: "AI mocks",
  all_premium: "All premium",
};

function freeCreditLabel(unlimitedPaid, remaining, fallback = 1) {
  if (unlimitedPaid) return "Unlimited (paid)";
  if (Number.isFinite(remaining) && remaining <= 0) return "Used";
  return `${Number.isFinite(remaining) ? remaining : fallback} remaining`;
}

export default function GeneralPricingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    needsConsent: needsFeatureConsent,
    ensureAccepted: ensureFeatureConsent,
    busy: featureConsentBusy,
    error: featureConsentError,
    setError: setFeatureConsentError,
  } = useFeatureConsent();
  const billingConsentNeeded = needsFeatureConsent(
    FEATURE_CONSENT_IDS.BILLING_CHECKOUT
  );
  const [searchParams] = useSearchParams();
  const feature = String(searchParams.get("feature") || "").trim();
  const prefillCategory = String(searchParams.get("category") || "").trim();

  const [plans, setPlans] = useState([]);
  const [configured, setConfigured] = useState(false);
  const [access, setAccess] = useState(null);
  const [categoryId, setCategoryId] = useState(prefillCategory);
  const [busyPlan, setBusyPlan] = useState("");
  const [paying, setPaying] = useState(false);
  const [checkoutPreview, setCheckoutPreview] = useState(null);
  const [billingConsentChecked, setBillingConsentChecked] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");

  const load = async () => {
    const configRes = await billingAPI.getConfig();
    setConfigured(Boolean(configRes.data?.configured));
    setPlans(Array.isArray(configRes.data?.plans) ? configRes.data.plans : []);
    try {
      const accessRes = await billingAPI.getAccess();
      setAccess(accessRes.data || null);
    } catch {
      setAccess(null);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await load();
      } catch (err) {
        if (!cancelled) {
          setError(err?.response?.data?.error || "Could not load pricing.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const summary = access?.summary || {};

  const categoryOptions = useMemo(() => {
    if (summary.allCards) return [];
    return GENERAL_COMPANY_CATEGORIES.filter((row) => !summary.categories?.[row.id]).map(
      (row) => ({ value: row.id, label: row.label })
    );
  }, [summary]);

  useEffect(() => {
    if (!categoryOptions.length) {
      if (categoryId) setCategoryId("");
      return;
    }
    const stillValid = categoryOptions.some((row) => row.value === categoryId);
    if (!stillValid) setCategoryId(categoryOptions[0].value);
  }, [categoryOptions, categoryId]);

  const displayPlans = useMemo(
    () =>
      PLAN_ORDER.map((id) => plans.find((plan) => plan.id === id)).filter(Boolean),
    [plans]
  );

  const shopPlans = useMemo(() => {
    return displayPlans.filter((plan) => {
      if (plan.id === "category") {
        return !summary.allCards && categoryOptions.length > 0;
      }
      return !alreadyOwnsPlan(summary, plan.id, categoryId);
    });
  }, [displayPlans, summary, categoryId, categoryOptions]);

  useEffect(() => {
    if (!displayPlans.length) {
      if (selectedPlanId) setSelectedPlanId("");
      return;
    }
    if (displayPlans.some((plan) => plan.id === selectedPlanId)) return;
    if (feature === "mocks" && displayPlans.some((plan) => plan.id === "mocks")) {
      setSelectedPlanId("mocks");
      return;
    }
    if (feature === "prep_path" && displayPlans.some((plan) => plan.id === "prep_path")) {
      setSelectedPlanId("prep_path");
      return;
    }
    if (
      (feature === "peer_sessions" || feature === "all_premium") &&
      displayPlans.some((plan) => plan.id === "all_premium")
    ) {
      setSelectedPlanId("all_premium");
      return;
    }
    if (displayPlans.some((plan) => plan.id === "all_premium")) {
      setSelectedPlanId("all_premium");
      return;
    }
    setSelectedPlanId(displayPlans[0].id);
  }, [displayPlans, feature, selectedPlanId]);

  const currentPaidPlans = useMemo(() => {
    const entitlements = Array.isArray(access?.entitlements) ? access.entitlements : [];
    const byKey = new Map();
    for (const row of entitlements) {
      const plan = plans.find((item) => item.id === row.planId);
      const key = `${row.planId}:${row.categoryId || ""}`;
      const existing = byKey.get(key);
      const expiresAt = row.expiresAt ? new Date(row.expiresAt) : null;
      if (!existing || (expiresAt && expiresAt > new Date(existing.expiresAt || 0))) {
        byKey.set(key, {
          key,
          planId: row.planId,
          categoryId: row.categoryId || "",
          expiresAt: row.expiresAt,
          title: paidPlanTitle(plan, row),
          description: plan?.description || "Active for 6 months.",
        });
      }
    }
    return [...byKey.values()];
  }, [access?.entitlements, plans]);

  const closeCheckoutPreview = () => {
    if (paying || featureConsentBusy) return;
    setCheckoutPreview(null);
    setBusyPlan("");
    setBillingConsentChecked(false);
    setFeatureConsentError("");
  };

  /** Quote first so we can show Base / GST / Total before Razorpay opens. */
  const buy = async (plan) => {
    setError("");
    setSuccess("");
    if (!configured) {
      setError("Payments are not configured yet. Add Razorpay keys on the server.");
      return;
    }
    if (plan.requiresCategory && !categoryId) {
      setError("Pick a category to unlock.");
      return;
    }
    setBusyPlan(plan.id);
    try {
      const quoteRes = await billingAPI.quote({
        planId: plan.id,
        categoryId: plan.requiresCategory ? categoryId : undefined,
      });
      const quote = quoteRes.data?.quote;
      if (!quote || Number(quote.payableInr) <= 0) {
        setError(quoteRes.data?.owned ? "You already have this access." : "Nothing to pay for this plan.");
        setBusyPlan("");
        return;
      }
      setBillingConsentChecked(false);
      setFeatureConsentError("");
      setCheckoutPreview({
        plan,
        categoryId: plan.requiresCategory ? categoryId : "",
        quote,
      });
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Could not prepare checkout.");
      setBusyPlan("");
    }
  };

  const confirmCheckoutPreview = async () => {
    if (!checkoutPreview?.plan || paying || featureConsentBusy) return;
    if (billingConsentNeeded && !billingConsentChecked) return;

    if (billingConsentNeeded) {
      const ok = await ensureFeatureConsent(FEATURE_CONSENT_IDS.BILLING_CHECKOUT);
      if (!ok) return;
    }

    const { plan, categoryId: previewCategoryId, quote } = checkoutPreview;
    setPaying(true);
    setError("");
    try {
      const orderRes = await billingAPI.createOrder({
        planId: plan.id,
        categoryId: plan.requiresCategory ? previewCategoryId : undefined,
      });
      const Razorpay = await loadRazorpayCheckoutScript();
      const payload = orderRes.data;
      const order = payload.order || {};
      const baseInr = order.baseInr ?? quote.baseInr;
      const gstInr = order.gstInr ?? quote.gstInr;
      const payableInr = order.payableInr ?? quote.payableInr;
      const checkoutDescription =
        order.checkoutDescription ||
        `${payload.plan?.name || plan.name}: Base ₹${baseInr} + GST 18% ₹${gstInr} = ₹${payableInr}`;

      // Razorpay Price Summary only shows the total; close our split modal first.
      setCheckoutPreview(null);

      await new Promise((resolve, reject) => {
        const checkout = new Razorpay({
          key: payload.keyId,
          amount: order.amountPaise,
          currency: order.currency || "INR",
          name: "One Stop Placement Prep",
          description: checkoutDescription,
          order_id: order.razorpayOrderId,
          prefill: {
            email: user?.email || "",
            name: user?.username || "",
          },
          notes: {
            planId: plan.id,
            categoryId: plan.requiresCategory ? previewCategoryId : "",
            baseInr: baseInr != null ? String(baseInr) : "",
            gstInr: gstInr != null ? String(gstInr) : "",
            gstRate: order.gstRate != null ? String(order.gstRate) : "0.18",
            totalInr: payableInr != null ? String(payableInr) : "",
            breakdown: checkoutDescription,
          },
          theme: { color: "#6366F1" },
          handler: async (response) => {
            try {
              await billingAPI.confirm(response);
              resolve();
            } catch (confirmErr) {
              reject(confirmErr);
            }
          },
          modal: {
            ondismiss: () => reject(new Error("Checkout closed")),
          },
        });
        checkout.open();
      });
      await load();
      if (payableInr != null && baseInr != null && gstInr != null) {
        setSuccess(
          `Payment of ₹${payableInr} successful (₹${baseInr} + ₹${gstInr} GST). ${plan.name} is active for 6 months.`
        );
      } else if (payableInr != null) {
        setSuccess(`Payment of ₹${payableInr} successful. ${plan.name} is active for 6 months.`);
      } else {
        setSuccess(`Payment successful. ${plan.name} is active for 6 months.`);
      }
    } catch (err) {
      const closed = err?.message === "Checkout closed";
      if (!closed) {
        setError(err?.response?.data?.error || err?.message || "Payment failed.");
      }
      setCheckoutPreview(null);
    } finally {
      setPaying(false);
      setBusyPlan("");
    }
  };

  const mockRemaining = Number(access?.freeMockRemaining);
  const prepRemaining = Number(access?.freePrepRemaining);
  const behavioralRemaining = Number(access?.freeBehavioralRemaining);
  const unlimitedBehavioral = access?.unlimitedBehavioralCoach === true;

  return (
    <div className={`min-h-screen ${pageShellOuterClassCompact}`}>
      <PageHeroFontStyles />
      <div className={pageShellInnerClass}>
        <PageBackNavRow>
          <PageBackButton onClick={() => navigate(-1)} label="Back" />
        </PageBackNavRow>

        <PageHeroHeader subtitle="Pick one category, or unlock everything for 6 months.">
          Choose the plan that fits you best
        </PageHeroHeader>

        <section className="mx-auto mb-10 max-w-6xl">
          <h2 className="mb-3 text-xl font-semibold text-theme-primary">Current plans</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex h-full flex-col rounded-2xl border-2 border-theme-accent bg-theme-card p-5 shadow-md">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="flex min-w-0 items-center gap-2 text-lg font-semibold text-theme-primary">
                  <span className="min-w-0">Free trial</span>
                  <PlanInfoHint planId="trial" />
                </h3>
                <FaCheckCircle className="shrink-0 text-theme-accent" aria-hidden />
              </div>
              <p className="flex-1 text-sm text-theme-secondary">
                First company in each category stays free for full details. Includes 1 AI mock
                interview of any company, 1 PrepPath plan, and 1 behavioural coach question.
              </p>
              <ul className="mt-3 space-y-1 text-sm text-theme-secondary">
                <li>
                  Free mock:{" "}
                  {freeCreditLabel(summary.mocks, mockRemaining, 1)}
                </li>
                <li>
                  Free PrepPath:{" "}
                  {freeCreditLabel(summary.prepPath, prepRemaining, 1)}
                </li>
                <li>
                  Free behavioural coach:{" "}
                  {freeCreditLabel(
                    unlimitedBehavioral || summary.behavioralCoach,
                    behavioralRemaining,
                    1
                  )}
                </li>
              </ul>
              <p className="mt-4 text-sm font-semibold text-theme-accent">Active</p>
            </div>
            {currentPaidPlans.map((row) => (
              <div
                key={row.key}
                className="flex h-full flex-col rounded-2xl border-2 border-theme bg-theme-card p-5 shadow-md"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="flex min-w-0 items-center gap-2 text-lg font-semibold text-theme-primary">
                    <span className="min-w-0">{row.title}</span>
                    <PlanInfoHint planId={row.planId} />
                  </h3>
                  <FaCheckCircle className="shrink-0 text-emerald-500" aria-hidden />
                </div>
                <p className="flex-1 text-sm text-theme-secondary">{row.description}</p>
                <p className="mt-4 text-sm font-semibold text-theme-primary">
                  Active until {formatExpiry(row.expiresAt) || "—"}
                </p>
              </div>
            ))}
          </div>
        </section>

        {error ? (
          <p className="mx-auto mb-4 max-w-3xl text-center text-sm text-red-500">{error}</p>
        ) : null}
        {success ? (
          <p className="mx-auto mb-4 max-w-3xl text-center text-sm text-emerald-500">{success}</p>
        ) : null}

        <section className="mx-auto max-w-6xl">
          <h2 className="mb-3 text-xl font-semibold text-theme-primary">Unlock more</h2>
          {!displayPlans.length ? (
            <p className="rounded-2xl border border-theme bg-theme-card p-5 text-sm text-theme-secondary">
              Pricing plans are not available yet.
            </p>
          ) : null}
          {!displayPlans.length ? null : !shopPlans.length ? (
            <p className="mb-6 rounded-2xl border border-theme bg-theme-card p-5 text-sm text-theme-secondary">
              You already have every paid plan.
            </p>
          ) : null}

          {displayPlans.length ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {displayPlans.map((plan) => {
                  const owned = alreadyOwnsPlan(summary, plan.id, categoryId);
                  const canBuyCategory =
                    plan.id !== "category" ||
                    (!summary.allCards && categoryOptions.length > 0);
                  const buyDisabled =
                    owned || !canBuyCategory || Boolean(busyPlan) || paying;
                  const isBest = plan.id === "all_premium";
                  const isSelected = selectedPlanId === plan.id;

                  return (
                    <div
                      key={plan.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedPlanId(plan.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedPlanId(plan.id);
                        }
                      }}
                      className={`relative flex h-full cursor-pointer flex-col rounded-2xl border-2 p-5 transition-[border-color,box-shadow,background-color] ${
                        isSelected
                          ? "border-theme-accent shadow-lg ring-2 ring-theme-accent/40"
                          : "border-theme bg-theme-card shadow-sm hover:border-theme-accent/40"
                      }`}
                      style={
                        isSelected
                          ? {
                              backgroundColor:
                                "color-mix(in srgb, var(--accent) 12%, var(--bg-card))",
                            }
                          : undefined
                      }
                    >
                      {isBest ? (
                        <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-theme-accent px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                          Best value
                        </span>
                      ) : null}
                      <div className="mb-2 flex items-start justify-between gap-2 pt-1">
                        <h3 className="text-lg font-semibold leading-snug text-theme-primary">
                          {plan.name}
                        </h3>
                        <PlanInfoHint planId={plan.id} />
                      </div>
                      <p className="min-h-[2.75rem] text-sm leading-relaxed text-theme-secondary">
                        {plan.description}
                      </p>
                      {plan.requiresCategory && canBuyCategory && !owned ? (
                        <div
                          className="mt-4"
                          onClick={(event) => event.stopPropagation()}
                          onKeyDown={(event) => event.stopPropagation()}
                        >
                          <label className="mb-1.5 block text-xs font-medium text-theme-secondary">
                            Choose a category
                          </label>
                          <ThemedSelect
                            value={categoryId}
                            options={categoryOptions}
                            onChange={setCategoryId}
                            placeholder="Select a category"
                            ariaLabel="Choose a category"
                            triggerSurface="card"
                          />
                        </div>
                      ) : null}
                      <div className="mt-auto pt-5">
                        <p className="text-3xl font-semibold tracking-tight text-theme-primary">
                          ₹{plan.priceInr}
                          <span className="ml-1 text-sm font-normal text-theme-muted">
                            / 6 months
                          </span>
                        </p>
                        <button
                          type="button"
                          disabled={buyDisabled}
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedPlanId(plan.id);
                            buy(plan);
                          }}
                          className={`mt-4 w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-60 ${
                            isSelected || isBest
                              ? "bg-theme-accent text-white hover:opacity-95"
                              : "border border-theme-accent bg-transparent text-theme-accent hover:bg-theme-accent/5"
                          }`}
                        >
                          {owned
                            ? "Owned"
                            : busyPlan === plan.id && !checkoutPreview
                              ? "Preparing…"
                              : "Unlock"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-10 overflow-hidden rounded-3xl border border-theme bg-theme-card shadow-md">
                <div className="border-b border-theme px-5 py-4 sm:px-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-theme-accent">
                    Compare plans
                  </p>
                </div>

                <div className="overflow-x-auto px-2 pb-2 sm:px-3">
                  <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b-2 border-theme">
                        <th className="w-[26%] min-w-[11rem] px-4 py-5 align-bottom text-sm font-medium text-theme-muted sm:px-5">
                          What&apos;s included
                        </th>
                        {displayPlans.map((plan) => {
                          const isSelected = selectedPlanId === plan.id;
                          const isBest = plan.id === "all_premium";
                          return (
                            <th
                              key={`head-${plan.id}`}
                              className="relative px-3 py-5 text-center align-bottom"
                              style={
                                isSelected
                                  ? selectedColumnStyle({ edge: "start" })
                                  : undefined
                              }
                            >
                              {isBest ? (
                                <span className="mb-2 inline-flex rounded-full bg-amber-300 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-950">
                                  Best value
                                </span>
                              ) : (
                                <span className="mb-2 inline-block h-5" aria-hidden />
                              )}
                              <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-theme-primary">
                                {PLAN_SHORT[plan.id] || plan.name}
                              </span>
                              <span className="mt-1 block text-sm font-semibold text-theme-primary">
                                ₹{plan.priceInr}
                                <span className="font-normal text-theme-muted">/6 mo</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => setSelectedPlanId(plan.id)}
                                className={`mt-3 inline-flex min-w-[5.5rem] items-center justify-center rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                  isSelected
                                    ? "bg-theme-accent text-white"
                                    : "border border-theme-accent bg-transparent text-theme-accent hover:bg-theme-accent/5"
                                }`}
                              >
                                {isSelected ? "Selected" : "Choose"}
                              </button>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {COMPARISON_ROWS.map((row, rowIndex) => {
                        const isLast = rowIndex === COMPARISON_ROWS.length - 1;
                        return (
                          <tr key={row.id} className="align-middle">
                            <th
                              scope="row"
                              className={`px-4 py-5 align-middle sm:px-5 ${
                                isLast ? "" : "border-b-2 border-theme"
                              }`}
                            >
                              <p className="font-semibold text-theme-primary">{row.label}</p>
                              {row.hint ? (
                                <p className="mt-0.5 text-xs font-normal text-theme-muted">
                                  {row.hint}
                                </p>
                              ) : null}
                            </th>
                            {displayPlans.map((plan) => {
                              const isSelected = selectedPlanId === plan.id;
                              return (
                                <td
                                  key={`${row.id}-${plan.id}`}
                                  className={`px-3 py-5 text-center transition-colors ${
                                    isLast ? "" : "border-b-2 border-theme"
                                  }`}
                                  style={
                                    isSelected
                                      ? selectedColumnStyle({
                                          edge: isLast ? "end" : "middle",
                                        })
                                      : undefined
                                  }
                                >
                                  <div className="flex justify-center">
                                    <ComparisonValue
                                      value={row.values[plan.id]}
                                      emphasized={isSelected}
                                    />
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <p className="border-t border-theme px-5 py-4 text-center text-sm text-theme-secondary sm:px-6">
                  All Premium saves ₹199 compared with buying PrepPath and AI Mocks separately.
                </p>
              </div>
            </>
          ) : null}
        </section>
      </div>

      {checkoutPreview ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="gst-checkout-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-theme bg-theme-card p-6 shadow-xl">
            <h3 id="gst-checkout-title" className="text-lg font-semibold text-theme-primary">
              Confirm payment
            </h3>
            <p className="mt-1 text-sm text-theme-secondary">
              {checkoutPreview.plan?.name}
              {checkoutPreview.plan?.requiresCategory && checkoutPreview.categoryId
                ? ` · ${categoryLabel(checkoutPreview.categoryId)}`
                : ""}
            </p>
            <dl className="mt-5 space-y-2.5 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-theme-secondary">Base</dt>
                <dd className="font-medium text-theme-primary">₹{checkoutPreview.quote.baseInr}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-theme-secondary">GST (18%)</dt>
                <dd className="font-medium text-theme-primary">₹{checkoutPreview.quote.gstInr}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-theme pt-2.5">
                <dt className="font-semibold text-theme-primary">Total</dt>
                <dd className="text-lg font-semibold text-theme-primary">
                  ₹{checkoutPreview.quote.payableInr}
                </dd>
              </div>
            </dl>

            {billingConsentNeeded ? (
              <div className="mt-5 rounded-xl border border-theme bg-theme-input/40 p-3">
                <p className="text-sm font-semibold text-theme-primary">
                  {BILLING_CONSENT_COPY.title}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-theme-secondary">
                  {BILLING_CONSENT_COPY.summary}{" "}
                  <Link
                    className="font-medium text-theme-accent underline"
                    to={`${GENERAL_BASE}/privacy`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Privacy Policy
                  </Link>
                  .
                </p>
                <label className="mt-3 flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 shrink-0"
                    checked={billingConsentChecked}
                    disabled={paying || featureConsentBusy}
                    onChange={(e) => setBillingConsentChecked(e.target.checked)}
                  />
                  <span className="text-xs text-theme-primary sm:text-sm">
                    {BILLING_CONSENT_COPY.checkboxLabel}
                  </span>
                </label>
                {featureConsentError ? (
                  <p className="mt-2 text-sm text-red-500" role="alert">
                    {featureConsentError}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                disabled={paying || featureConsentBusy}
                onClick={closeCheckoutPreview}
                className="rounded-xl border border-theme px-4 py-2.5 text-sm font-medium text-theme-secondary hover:bg-theme-hero disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  paying ||
                  featureConsentBusy ||
                  (billingConsentNeeded && !billingConsentChecked)
                }
                onClick={confirmCheckoutPreview}
                className="rounded-xl bg-theme-accent px-4 py-2.5 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60"
              >
                {paying || featureConsentBusy
                  ? "Opening Razorpay…"
                  : "Pay ₹" + checkoutPreview.quote.payableInr}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
