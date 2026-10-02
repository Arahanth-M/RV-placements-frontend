import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaCheckCircle, FaInfoCircle, FaLock, FaUnlock } from "react-icons/fa";
import { billingAPI } from "../utils/api";
import { useAuth } from "../utils/AuthContext";
import { loadRazorpayCheckoutScript } from "../utils/loadRazorpay.js";
import { GENERAL_COMPANY_CATEGORIES } from "../utils/generalCompanyCategory.js";
import {
  PageBackButton,
  PageBackNavRow,
  PageHeroFontStyles,
  PageHeroHeader,
  pageShellInnerClass,
  pageShellOuterClassCompact,
} from "./PageBackNav.jsx";
import ThemedSelect from "./ThemedSelect.jsx";

const PLAN_ORDER = ["category", "prep_path", "mocks", "all_premium"];

const PLAN_INFO = {
  trial: {
    includes: [
      "Full details for the first company in each category",
      "1 lifetime AI mock interview",
      "1 lifetime PrepPath plan",
    ],
    excludes: [
      "Full details for other companies in a category",
      "Unlimited AI mocks",
      "Unlimited PrepPath",
    ],
  },
  category: {
    includes: ["Full company-card details for every company in the category you choose"],
    excludes: [
      "AI mock interviews",
      "PrepPath",
      "Companies in other categories",
    ],
  },
  prep_path: {
    includes: [
      "Unlimited PrepPath plans for 6 months",
      "Full company-card details for every company",
    ],
    excludes: ["Unlimited AI mock interviews"],
  },
  mocks: {
    includes: [
      "Unlimited AI mock interviews for 6 months",
      "Full company-card details for every company",
    ],
    excludes: ["Unlimited PrepPath"],
  },
  all_premium: {
    includes: [
      "Full company-card details for every company",
      "Unlimited AI mock interviews for 6 months",
      "Unlimited PrepPath for 6 months",
    ],
    excludes: [],
  },
  all_cards: {
    includes: ["Full company-card details for every company"],
    excludes: ["AI mock interviews", "PrepPath"],
  },
  mocks_prep: {
    includes: ["Unlimited AI mock interviews", "Unlimited PrepPath"],
    excludes: ["Unlocking extra company cards"],
  },
};

function PlanInfoHint({ planId }) {
  const info = PLAN_INFO[planId];
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (event) => {
      const target = event.target instanceof Node ? event.target : null;
      if (target && rootRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  if (!info) return null;

  return (
    <span ref={rootRef} className="relative inline-flex shrink-0">
      <button
        type="button"
        className="inline-flex h-6 w-6 items-center justify-center rounded-full text-theme-muted transition-colors hover:text-theme-accent"
        aria-label="What this plan includes"
        aria-expanded={open}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
      >
        <FaInfoCircle className="h-3.5 w-3.5" aria-hidden />
      </button>
      {open ? (
        <div
          className="absolute right-0 top-full z-30 mt-2 w-64 rounded-xl border border-theme bg-theme-card p-3 text-left shadow-xl sm:w-72"
          role="dialog"
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
    return Boolean(summary.allCards && summary.mocks && summary.prepPath);
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

export default function GeneralPricingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const feature = String(searchParams.get("feature") || "").trim();
  const prefillCategory = String(searchParams.get("category") || "").trim();

  const [plans, setPlans] = useState([]);
  const [configured, setConfigured] = useState(false);
  const [access, setAccess] = useState(null);
  const [categoryId, setCategoryId] = useState(prefillCategory);
  const [busyPlan, setBusyPlan] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

  const shopPlans = useMemo(() => {
    const list = [...plans].sort(
      (a, b) => PLAN_ORDER.indexOf(a.id) - PLAN_ORDER.indexOf(b.id)
    );
    return list.filter((plan) => {
      if (plan.id === "category") {
        return !summary.allCards && categoryOptions.length > 0;
      }
      return !alreadyOwnsPlan(summary, plan.id, categoryId);
    });
  }, [plans, summary, categoryId, categoryOptions]);

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

  const highlight = (planId) => {
    if (feature === "mocks" && (planId === "mocks" || planId === "all_premium")) {
      return true;
    }
    if (feature === "prep_path" && (planId === "prep_path" || planId === "all_premium")) {
      return true;
    }
    if (
      feature === "company_detail" &&
      (planId === "category" || planId === "prep_path" || planId === "mocks" || planId === "all_premium")
    ) {
      return true;
    }
    return planId === "all_premium";
  };

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
      const orderRes = await billingAPI.createOrder({
        planId: plan.id,
        categoryId: plan.requiresCategory ? categoryId : undefined,
      });
      const Razorpay = await loadRazorpayCheckoutScript();
      const payload = orderRes.data;
      await new Promise((resolve, reject) => {
        const checkout = new Razorpay({
          key: payload.keyId,
          amount: payload.order.amountPaise,
          currency: payload.order.currency || "INR",
          name: "Last Minute Placement Prep",
          description: payload.plan?.name || plan.name,
          order_id: payload.order.razorpayOrderId,
          prefill: {
            email: user?.email || "",
            name: user?.username || "",
          },
          notes: {
            planId: plan.id,
            categoryId: plan.requiresCategory ? categoryId : "",
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
      const paid = payload.order.payableInr;
      setSuccess(`Payment successful. ${plan.name} is active for 6 months.`);
      if (paid != null) {
        setSuccess(`Payment of ₹${paid} successful. ${plan.name} is active for 6 months.`);
      }
    } catch (err) {
      const closed = err?.message === "Checkout closed";
      if (!closed) {
        setError(err?.response?.data?.error || err?.message || "Payment failed.");
      }
    } finally {
      setBusyPlan("");
    }
  };

  const mockRemaining = Number(access?.freeMockRemaining);
  const prepRemaining = Number(access?.freePrepRemaining);

  return (
    <div className={`min-h-screen ${pageShellOuterClassCompact}`}>
      <PageHeroFontStyles />
      <div className={pageShellInnerClass}>
        <PageBackNavRow>
          <PageBackButton onClick={() => navigate(-1)} label="Back" />
        </PageBackNavRow>
        <PageHeroHeader>
          Pricing
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
                First company in each category stays free. Includes 1 AI mock interview and 1 PrepPath
                plan.
              </p>
              <ul className="mt-3 space-y-1 text-sm text-theme-secondary">
                <li>
                  Free mock:{" "}
                  {summary.mocks
                    ? "Unlimited (paid)"
                    : Number.isFinite(mockRemaining) && mockRemaining <= 0
                      ? "Used"
                      : "1 remaining"}
                </li>
                <li>
                  Free PrepPath:{" "}
                  {summary.prepPath
                    ? "Unlimited (paid)"
                    : Number.isFinite(prepRemaining) && prepRemaining <= 0
                      ? "Used"
                      : "1 remaining"}
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
          {shopPlans.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {shopPlans.map((plan) => {
                const featured = highlight(plan.id);
                return (
                  <div
                    key={plan.id}
                    className={`flex h-full flex-col rounded-2xl border-2 bg-theme-card p-5 shadow-md ${
                      featured ? "border-theme-accent" : "border-theme"
                    }`}
                  >
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <h3 className="flex min-w-0 items-center gap-2 text-lg font-semibold text-theme-primary">
                        <span className="min-w-0">{plan.name}</span>
                        <PlanInfoHint planId={plan.id} />
                      </h3>
                      {featured ? (
                        <FaUnlock className="shrink-0 text-theme-accent" aria-hidden />
                      ) : (
                        <FaLock className="shrink-0 text-theme-muted" aria-hidden />
                      )}
                    </div>
                    <p className="flex-1 text-sm text-theme-secondary">{plan.description}</p>
                    {plan.requiresCategory ? (
                      <div className="mt-4">
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
                    <p className="mt-4 text-3xl font-semibold text-theme-primary">
                      ₹{plan.priceInr}
                      <span className="ml-1 text-sm font-normal text-theme-muted">/ 6 months</span>
                    </p>
                    <button
                      type="button"
                      disabled={Boolean(busyPlan)}
                      onClick={() => buy(plan)}
                      className="mt-4 rounded-xl bg-theme-accent px-4 py-2.5 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60"
                    >
                      {busyPlan === plan.id ? "Opening checkout…" : "Unlock"}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="rounded-2xl border border-theme bg-theme-card p-5 text-sm text-theme-secondary">
              You already have every paid plan.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
