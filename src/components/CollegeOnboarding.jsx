import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaHandshake,
  FaMoon,
  FaRocket,
  FaSun,
  FaUsers,
} from "react-icons/fa";
import { useTheme } from "../utils/ThemeContext";
import { authAPI } from "../utils/api";
import { PageHeroFontStyles } from "./PageBackNav.jsx";
import {
  DATA_EXTENT_OPTIONS,
  ONBOARDING_BASE_PRICE_INR,
  ONBOARDING_FEATURES,
  estimateOnboardingPrice,
  formatInr,
} from "../constants/collegeOnboarding.js";

const PAGE_SECTION_LABEL_STYLE = {
  fontSize: "13px",
  fontWeight: 600,
  letterSpacing: "0.13em",
  textTransform: "uppercase",
  color: "#6366F1",
  marginBottom: "0.5rem",
};

const PAGE_SECTION_TITLE_STYLE = {
  fontFamily: "'DM Serif Display', Georgia, serif",
  fontSize: "clamp(1.85rem, 4.2vw, 2.85rem)",
  fontWeight: 400,
  lineHeight: 1.15,
  marginBottom: "0.65rem",
};

const NEXT_STEPS = [
  {
    title: "We send a quotation",
    text: "Based on your feature mix, data plan, and campus size.",
  },
  {
    title: "You review & confirm",
    text: "Adjust scope if needed until the quote works for both sides.",
  },
  {
    title: "MOU is signed",
    text: "Terms, roles, and data responsibilities are locked in.",
  },
  {
    title: "Payment & go-live",
    text: "Payment is finalized and your campus dashboard is onboarded.",
  },
];

const inputClass =
  "mt-1.5 w-full rounded-xl border border-theme bg-theme-hero px-3 py-2.5 text-sm font-normal text-theme-primary outline-none focus:border-theme-accent";

function toggleId(list, id) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

function OnboardingHeader() {
  const { theme, toggleTheme } = useTheme();
  return (
    <header className="sticky top-0 z-50 border-b border-theme bg-theme-card/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          to="/"
          className="min-w-0 shrink font-serif text-lg sm:text-xl text-theme-primary tracking-tight"
        >
          lastminute<span className="italic text-theme-accent">placementprep</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-theme bg-theme-card text-theme-primary hover:bg-theme-hero transition-colors"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <FaSun className="h-3.5 w-3.5" /> : <FaMoon className="h-3.5 w-3.5" />}
          </button>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl border border-theme px-3 py-2 text-sm font-semibold text-theme-secondary hover:text-theme-accent transition-colors"
          >
            <FaArrowLeft className="h-3 w-3" />
            Back
          </Link>
        </div>
      </div>
    </header>
  );
}

function PathCard({ active, icon: Icon, title, subtitle, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border p-5 text-left transition-colors ${
        active
          ? "border-theme-accent bg-theme-accent/10 shadow-sm"
          : "border-theme bg-theme-card hover:border-theme-accent/40"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            active ? "bg-theme-accent text-white" : "bg-theme-hero text-theme-accent"
          }`}
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-base font-semibold text-theme-primary">{title}</p>
          <p className="mt-1 text-sm text-theme-secondary leading-relaxed">{subtitle}</p>
        </div>
      </div>
    </button>
  );
}

function SuccessPanel({ path, collegeName, approxPriceInr, onReset }) {
  const isDemo = path === "demo";
  return (
    <div className="rounded-2xl border border-theme bg-theme-card p-6 sm:p-8">
      <div className="flex items-start gap-3">
        <FaCheckCircle className="mt-1 h-6 w-6 shrink-0 text-theme-accent" />
        <div>
          <h2
            className="text-xl text-theme-primary"
            style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
          >
            {isDemo ? "Demo request received" : "Quotation request received"}
          </h2>
          <p className="mt-2 text-sm text-theme-secondary leading-relaxed">
            Thanks{collegeName ? ` — we’ve noted interest from ${collegeName}` : ""}.{" "}
            {isDemo
              ? "One of our team will reach out to walk you through a demo and help set things up."
              : "We’ll review your feature mix and send a formal quotation to your POC email."}
          </p>
          {!isDemo && approxPriceInr != null ? (
            <p className="mt-3 text-sm text-theme-primary">
              Approximate configurator estimate:{" "}
              <strong>{formatInr(approxPriceInr)}</strong>
              <span className="text-theme-secondary font-normal">
                {" "}
                (final quote may differ)
              </span>
            </p>
          ) : null}
        </div>
      </div>

      {!isDemo ? (
        <ol className="mt-6 space-y-3">
          {NEXT_STEPS.map((step, i) => (
            <li
              key={step.title}
              className="flex gap-3 rounded-xl border border-theme bg-theme-hero/60 px-4 py-3"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-theme-accent text-xs font-bold text-white">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-semibold text-theme-primary">{step.title}</p>
                <p className="mt-0.5 text-sm text-theme-secondary">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          to="/"
          className="rounded-xl bg-theme-accent px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
        >
          Back to home
        </Link>
        <button
          type="button"
          onClick={onReset}
          className="rounded-xl border border-theme px-4 py-2.5 text-sm font-semibold text-theme-secondary hover:text-theme-accent"
        >
          Submit another request
        </button>
      </div>
    </div>
  );
}

export default function CollegeOnboarding() {
  const [path, setPath] = useState(null);
  const [collegeName, setCollegeName] = useState("");
  const [pocName, setPocName] = useState("");
  const [pocEmail, setPocEmail] = useState("");
  const [pocPhone, setPocPhone] = useState("");
  const [willProvideData, setWillProvideData] = useState(null);
  const [dataExtent, setDataExtent] = useState([]);
  const [selectedFeatures, setSelectedFeatures] = useState(
    ONBOARDING_FEATURES.map((f) => f.id)
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);

  const approxPriceInr = useMemo(
    () =>
      estimateOnboardingPrice({
        selectedFeatureIds: selectedFeatures,
        willProvideData: willProvideData === true,
        dataExtentIds: dataExtent,
      }),
    [selectedFeatures, willProvideData, dataExtent]
  );

  const basicOk =
    collegeName.trim().length >= 2 &&
    pocName.trim().length >= 2 &&
    pocEmail.trim().includes("@");

  const selfOk =
    basicOk &&
    willProvideData !== null &&
    (willProvideData === false || dataExtent.length > 0) &&
    selectedFeatures.length > 0;

  const canSubmit =
    !submitting &&
    ((path === "demo" && basicOk) || (path === "self_onboard" && selfOk));

  const resetForm = () => {
    setPath(null);
    setCollegeName("");
    setPocName("");
    setPocEmail("");
    setPocPhone("");
    setWillProvideData(null);
    setDataExtent([]);
    setSelectedFeatures(ONBOARDING_FEATURES.map((f) => f.id));
    setError("");
    setDone(null);
    setSubmitting(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit || !path) return;
    setSubmitting(true);
    setError("");
    try {
      const payload =
        path === "demo"
          ? {
              path: "demo",
              collegeName: collegeName.trim(),
              pocName: pocName.trim(),
              pocEmail: pocEmail.trim(),
              pocPhone: pocPhone.trim(),
            }
          : {
              path: "self_onboard",
              collegeName: collegeName.trim(),
              pocName: pocName.trim(),
              pocEmail: pocEmail.trim(),
              pocPhone: pocPhone.trim(),
              willProvideData: willProvideData === true,
              dataExtent: willProvideData === true ? dataExtent : [],
              selectedFeatures,
              approxPriceInr,
            };
      const res = await authAPI.submitCollegeOnboarding(payload);
      setDone({
        path,
        collegeName: collegeName.trim(),
        approxPriceInr: res?.data?.approxPriceInr ?? approxPriceInr,
      });
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Could not save your request. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-theme-app text-theme-primary">
      <PageHeroFontStyles />
      <OnboardingHeader />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <p style={PAGE_SECTION_LABEL_STYLE}>College onboarding</p>
        <h1 style={PAGE_SECTION_TITLE_STYLE} className="text-theme-primary">
          Bring the platform{" "}
          <em className="italic text-theme-accent">to your campus</em>
        </h1>
        <p className="max-w-2xl text-base text-theme-secondary leading-relaxed">
          Choose how you’d like to get started — request a guided demo, or configure a full
          onboarding and ask for a quotation.
        </p>

        {done ? (
          <div className="mt-8">
            <SuccessPanel
              path={done.path}
              collegeName={done.collegeName}
              approxPriceInr={done.approxPriceInr}
              onReset={resetForm}
            />
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <PathCard
                active={path === "demo"}
                icon={FaUsers}
                title="Request a demo"
                subtitle="Share college name and POC. Our team will help you set up."
                onClick={() => {
                  setPath("demo");
                  setError("");
                }}
              />
              <PathCard
                active={path === "self_onboard"}
                icon={FaRocket}
                title="Onboard on the platform"
                subtitle="Pick data scope & features, see an approximate price, request a quote."
                onClick={() => {
                  setPath("self_onboard");
                  setError("");
                }}
              />
            </div>

            {path ? (
              <form
                onSubmit={handleSubmit}
                className="rounded-2xl border border-theme bg-theme-card p-5 sm:p-7 space-y-5"
              >
                <div>
                  <h2 className="text-lg font-semibold text-theme-primary">
                    {path === "demo" ? "Demo contact details" : "College & POC details"}
                  </h2>
                  <p className="mt-1 text-sm text-theme-secondary">
                    We’ll use these details to follow up on your request.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-semibold text-theme-primary sm:col-span-2">
                    College name
                    <input
                      type="text"
                      value={collegeName}
                      onChange={(e) => setCollegeName(e.target.value)}
                      maxLength={160}
                      required
                      autoComplete="organization"
                      placeholder="e.g. ABC Institute of Technology"
                      className={inputClass}
                    />
                  </label>
                  <label className="block text-sm font-semibold text-theme-primary">
                    Point of contact (name)
                    <input
                      type="text"
                      value={pocName}
                      onChange={(e) => setPocName(e.target.value)}
                      maxLength={120}
                      required
                      autoComplete="name"
                      placeholder="Placement officer / coordinator"
                      className={inputClass}
                    />
                  </label>
                  <label className="block text-sm font-semibold text-theme-primary">
                    POC email
                    <input
                      type="email"
                      value={pocEmail}
                      onChange={(e) => setPocEmail(e.target.value)}
                      maxLength={320}
                      required
                      autoComplete="email"
                      placeholder="name@college.edu"
                      className={inputClass}
                    />
                  </label>
                  <label className="block text-sm font-semibold text-theme-primary sm:col-span-2">
                    POC phone{" "}
                    <span className="font-normal text-theme-secondary">(optional)</span>
                    <input
                      type="tel"
                      value={pocPhone}
                      onChange={(e) => setPocPhone(e.target.value)}
                      maxLength={40}
                      autoComplete="tel"
                      placeholder="+91 …"
                      className={inputClass}
                    />
                  </label>
                </div>

                {path === "self_onboard" ? (
                  <>
                    <div className="border-t border-theme pt-5 space-y-3">
                      <h3 className="text-base font-semibold text-theme-primary">
                        Will your college provide placement data?
                      </h3>
                      <p className="text-sm text-theme-secondary">
                        Shared campus data improves insights for your students and can reduce the
                        approximate price.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: true, label: "Yes, we’ll provide data" },
                          { value: false, label: "No, platform-only setup" },
                        ].map((opt) => (
                          <button
                            key={String(opt.value)}
                            type="button"
                            onClick={() => {
                              setWillProvideData(opt.value);
                              if (!opt.value) setDataExtent([]);
                            }}
                            className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                              willProvideData === opt.value
                                ? "border-theme-accent bg-theme-accent text-white"
                                : "border-theme bg-theme-hero text-theme-primary hover:border-theme-accent/40"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>

                      {willProvideData === true ? (
                        <div className="mt-3 space-y-2">
                          <p className="text-sm font-semibold text-theme-primary">
                            To what extent?
                          </p>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {DATA_EXTENT_OPTIONS.map((opt) => {
                              const checked = dataExtent.includes(opt.id);
                              return (
                                <label
                                  key={opt.id}
                                  className={`flex cursor-pointer items-start gap-2.5 rounded-xl border px-3 py-3 text-sm ${
                                    checked
                                      ? "border-theme-accent/50 bg-theme-accent/10"
                                      : "border-theme bg-theme-hero"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => setDataExtent((prev) => toggleId(prev, opt.id))}
                                    className="mt-0.5 accent-[var(--accent,#6366F1)]"
                                  />
                                  <span className="text-theme-primary leading-snug">
                                    {opt.label}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="border-t border-theme pt-5 space-y-3">
                      <div className="flex flex-wrap items-end justify-between gap-2">
                        <div>
                          <h3 className="text-base font-semibold text-theme-primary">
                            Select features
                          </h3>
                          <p className="mt-1 text-sm text-theme-secondary">
                            Base platform setup {formatInr(ONBOARDING_BASE_PRICE_INR)} + selected
                            modules. Prices are approximate.
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="text-xs font-semibold text-theme-accent hover:underline"
                            onClick={() =>
                              setSelectedFeatures(ONBOARDING_FEATURES.map((f) => f.id))
                            }
                          >
                            Select all
                          </button>
                          <button
                            type="button"
                            className="text-xs font-semibold text-theme-secondary hover:underline"
                            onClick={() => setSelectedFeatures([])}
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {ONBOARDING_FEATURES.map((feature) => {
                          const checked = selectedFeatures.includes(feature.id);
                          return (
                            <label
                              key={feature.id}
                              className={`flex cursor-pointer gap-3 rounded-xl border px-3 py-3 ${
                                checked
                                  ? "border-theme-accent/50 bg-theme-accent/10"
                                  : "border-theme bg-theme-hero"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
                                  setSelectedFeatures((prev) => toggleId(prev, feature.id))
                                }
                                className="mt-1 accent-[var(--accent,#6366F1)]"
                              />
                              <span className="min-w-0 flex-1">
                                <span className="flex items-start justify-between gap-2">
                                  <span className="text-sm font-semibold text-theme-primary">
                                    {feature.title}
                                  </span>
                                  <span className="shrink-0 text-xs font-semibold text-theme-accent">
                                    +{formatInr(feature.priceInr)}
                                  </span>
                                </span>
                                <span className="mt-0.5 block text-xs text-theme-secondary leading-snug">
                                  {feature.text}
                                </span>
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-theme-accent/30 bg-theme-accent/10 px-4 py-4 sm:px-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-theme-accent">
                            Approximate price
                          </p>
                          <p
                            className="mt-1 text-2xl text-theme-primary"
                            style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
                          >
                            {formatInr(approxPriceInr)}
                            <span className="ml-1 text-sm font-sans font-normal text-theme-secondary">
                              / year (est.)
                            </span>
                          </p>
                          <p className="mt-1 text-xs text-theme-secondary">
                            Final quotation may vary after we review campus size and scope.
                          </p>
                        </div>
                        <FaHandshake className="hidden h-8 w-8 text-theme-accent/60 sm:block" />
                      </div>
                    </div>

                    <div className="rounded-xl border border-dashed border-theme px-4 py-3">
                      <p className="text-sm font-semibold text-theme-primary">What happens next</p>
                      <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-theme-secondary">
                        {NEXT_STEPS.map((step) => (
                          <li key={step.title}>
                            <span className="text-theme-primary font-medium">{step.title}</span>
                            {" — "}
                            {step.text}
                          </li>
                        ))}
                      </ol>
                    </div>
                  </>
                ) : null}

                {error ? (
                  <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-300">
                    {error}
                  </p>
                ) : null}

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="rounded-xl bg-theme-accent px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting
                      ? "Submitting…"
                      : path === "demo"
                        ? "Request demo"
                        : "Request quotation"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPath(null);
                      setError("");
                    }}
                    className="rounded-xl border border-theme px-4 py-2.5 text-sm font-semibold text-theme-secondary hover:text-theme-accent"
                  >
                    Change option
                  </button>
                </div>
              </form>
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
}
