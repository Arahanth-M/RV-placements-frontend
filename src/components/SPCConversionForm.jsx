import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { tenantPath } from "../constants/tenant.js";
import { FaCheckCircle, FaChevronDown, FaExclamationCircle } from "react-icons/fa";
import { spcAPI } from "../utils/api";
import {
  DEFAULT_PLACEMENT_DETAIL_YEAR,
  PLACEMENT_DETAIL_VISIT_YEARS,
} from "../constants/placementYears.js";
import { formatPpoBranchLabel, ppoBranchCodesForHubCluster } from "../constants/ppoBranchCodes.js";
import { useAuth } from "../utils/AuthContext";
import SpcClusterNotice from "./SpcClusterNotice.jsx";
import {
  PageBackButton,
  PageBackNavRow,
  pageShellInnerClass,
  pageShellOuterClass,
} from "./PageBackNav.jsx";
import SpcRoleField from "./SpcRoleField.jsx";
import SpcFormField from "./SpcFormField.jsx";
import SpcCompanySuggestField from "./SpcCompanySuggestField.jsx";
import {
  SPC_COMPENSATION_TBD_HINT,
  validateSpcConversionSubmit,
} from "../utils/spcFormValidation.js";

function formatSpcSubmitError(err, fallbackMessage) {
  const base =
    err?.response?.data?.message ||
    (Array.isArray(err?.response?.data?.errors) && err.response.data.errors.join(" ")) ||
    "";
  const msg = String(base || fallbackMessage);
  if (msg.includes("different student")) {
    return `${msg} Use the email and USN from the same student profile, or ask the placement cell to correct duplicate records.`;
  }
  return msg;
}

/** Custom picker options — native `<select>` popups ignore dark theme on Windows (white list + light text). */
const CONVERSION_TYPES = [
  { value: "fte", label: "FTE" },
  { value: "fte_internship", label: "Internship + FTE" },
];

const INITIAL_FORM = {
  email: "",
  name: "",
  usn: "",
  placementYear: DEFAULT_PLACEMENT_DETAIL_YEAR,
  branchCode: "",
  companyQuery: "",
  conversionType: "fte",
  ctc: "",
  base: "",
  stipend: "",
  role: "",
};

/** Same hub as company detail (`?placementContext=` or session from company cards). */
function placementContextHintForSpc(companyId, searchParams) {
  const fromUrl = String(searchParams.get("placementContext") || "").trim();
  if (fromUrl) return fromUrl;
  if (!companyId) return "";
  try {
    return String(
      sessionStorage.getItem(`company_detail_placement_ctx:${companyId}`) || ""
    ).trim();
  } catch {
    return "";
  }
}

const INPUT_CLASS =
  "spc-field-control h-11 min-h-[2.75rem] max-h-[2.75rem] w-full shrink-0 rounded-xl border border-theme-input bg-theme-input px-4 text-sm text-theme-primary outline-none focus:border-theme-accent transition-colors placeholder:text-theme-muted box-border";

function SimplePicker({ value, onChange, options, placeholder, labelId }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointerDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? "";

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={labelId}
        className={`${INPUT_CLASS} flex cursor-pointer items-center justify-between gap-2 text-left`}
        onClick={() => setOpen((p) => !p)}
      >
        <span className={value ? "text-theme-primary" : "text-theme-muted"}>
          {selectedLabel || placeholder}
        </span>
        <FaChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-theme-secondary transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open && (
        <ul
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-auto rounded-xl border border-theme-input bg-theme-card py-1 shadow-lg"
          role="listbox"
          aria-labelledby={labelId}
        >
          {options.map((opt) => {
            const selected = value === opt.value;
            return (
              <li key={opt.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={`flex w-full px-4 py-2.5 text-left text-sm transition-colors ${
                    selected
                      ? "bg-theme-nav font-medium text-theme-primary"
                      : "text-theme-primary hover:bg-theme-nav"
                  }`}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  {opt.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function SPCConversionForm() {
  const { user } = useAuth();
  const spcCluster = user?.spcCluster || null;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState(INITIAL_FORM);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const suggestRootRef = useRef(null);
  const debounceRef = useRef(null);
  const formFeedbackRef = useRef(null);
  /** Keeps latest selection for debounced suggest callback (avoids stale closures). */
  const selectedCompanyRef = useRef(null);
  const branchOptions = useMemo(() => {
    const codes = ppoBranchCodesForHubCluster(spcCluster);
    if (!codes.length) return [{ value: "", label: "Select program" }];
    return [
      { value: "", label: "Select program" },
      ...codes.map((b) => ({ value: b, label: formatPpoBranchLabel(b) })),
    ];
  }, [spcCluster]);

  useEffect(() => {
    selectedCompanyRef.current = selectedCompany;
  }, [selectedCompany]);

  useEffect(() => {
    if (!error && !success) return;
    formFeedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [error, success]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    if (!suggestOpen) return undefined;
    const onPointerDown = (e) => {
      if (!suggestRootRef.current?.contains(e.target)) setSuggestOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [suggestOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setError("");
    setSuccess("");
    if (name === "companyQuery") {
      setSelectedCompany(null);
      selectedCompanyRef.current = null;
      setForm((prev) => ({ ...prev, companyQuery: value, role: "" }));
      return;
    }
    if (name === "branchCode" || name === "placementYear") {
      setForm((prev) => ({
        ...prev,
        [name]: name === "placementYear" ? Number(value) : value,
        role: "",
      }));
      return;
    }
    if (name === "conversionType") {
      setForm((prev) => ({
        ...prev,
        conversionType: value,
        stipend: value === "fte" ? "" : prev.stipend,
        role: prev.role,
      }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    const q = form.companyQuery.trim();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) {
      setSuggestions([]);
      setSuggestOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSuggestLoading(true);
      try {
        const res = await spcAPI.companySuggest(q);
        const items = Array.isArray(res?.data?.items) ? res.data.items : [];
        setSuggestions(items);
        const trimmed = q.trim();
        const locked = selectedCompanyRef.current;
        const matchesLockedSelection =
          locked?.id &&
          trimmed === String(locked.name || "").trim();
        // After choosing from the list, query updates to the canonical name and triggers another fetch.
        // Do not reopen the dropdown — that felt like having to "select twice".
        setSuggestOpen(Boolean(items.length > 0 && !matchesLockedSelection));
      } catch {
        setSuggestions([]);
        setSuggestOpen(false);
      } finally {
        setSuggestLoading(false);
      }
    }, 280);
  }, [form.companyQuery]);

  const pickCompany = (item) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    setSelectedCompany({ id: item.id, name: item.name });
    selectedCompanyRef.current = { id: item.id, name: item.name };
    setForm((prev) => ({ ...prev, companyQuery: item.name, role: "" }));
    setSuggestOpen(false);
    setSuggestions([]);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const validationErrors = validateSpcConversionSubmit(form, selectedCompany);
    if (validationErrors.length) {
      setError(validationErrors[0]);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        companyId: selectedCompany.id,
        placementYear: Number(form.placementYear),
        branchCode: form.branchCode,
        email: form.email,
        name: form.name,
        usn: form.usn,
        conversionType: form.conversionType,
        ctc: String(form.ctc ?? "").trim(),
        base: String(form.base ?? "").trim(),
        role: String(form.role ?? "").trim(),
        stipend:
          form.conversionType === "fte_internship" ? String(form.stipend ?? "").trim() : "",
      };
      const placementCtx = placementContextHintForSpc(selectedCompany.id, searchParams);
      if (placementCtx) {
        payload.placementContext = placementCtx;
      }

      await spcAPI.submitConversionDetails(payload);
      setSuccess("Conversion details saved successfully.");
      setForm(INITIAL_FORM);
      setSelectedCompany(null);
      selectedCompanyRef.current = null;
      setSuggestions([]);
    } catch (err) {
      setError(formatSpcSubmitError(err, "Failed to save conversion details"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const showStipend = form.conversionType === "fte_internship";
  const placementCtxForRoles = placementContextHintForSpc(selectedCompany?.id, searchParams);

  const yearOptions = [...PLACEMENT_DETAIL_VISIT_YEARS];

  return (
    <div className={`spc-conversion-form min-h-screen ${pageShellOuterClass}`}>
      <div className={pageShellInnerClass}>
        <PageBackNavRow>
          <PageBackButton onClick={() => navigate(tenantPath("/spc-dashboard"))} label="Back to Dashboard" />
        </PageBackNavRow>

        <div className="mx-auto w-full max-w-2xl">
        <div className="rounded-3xl border border-theme bg-theme-card p-6 shadow-xl sm:p-8">
          <div>
            <h1 className="text-3xl font-bold text-theme-primary">Update conversion details</h1>
            <SpcClusterNotice cluster={spcCluster} />
            <p className="mt-2 text-sm text-theme-secondary">
              Pick company, year, and program from the list so roles load from that hub&apos;s visit. CTC,
              base, and stipend merge into the company card (same rules as add placement).
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <section className="space-y-4 rounded-2xl border border-theme bg-theme-app/40 p-5">
              <h2 className="text-lg font-semibold text-theme-primary">Student</h2>
              <div className="grid auto-rows-auto grid-cols-1 gap-4 sm:grid-cols-2 items-start min-h-0">
                <div className="sm:col-span-2">
                  <SpcFormField
                    label="Email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    type="email"
                    placeholder="student@rvce.edu.in"
                    required
                    idPrefix="conv"
                  />
                </div>
                <SpcFormField
                  label="Name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Full name"
                  required
                  idPrefix="conv"
                />
                <SpcFormField
                  label="USN"
                  name="usn"
                  value={form.usn}
                  onChange={(e) =>
                    handleChange({
                      target: { name: "usn", value: e.target.value.toUpperCase() },
                    })
                  }
                  placeholder="1RV22CS001"
                  required
                  idPrefix="conv"
                />
              </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-theme bg-theme-app/40 p-5">
              <h2 className="text-lg font-semibold text-theme-primary">Placement cycle</h2>
              <div className="grid auto-rows-auto grid-cols-1 gap-4 sm:grid-cols-2 items-start min-h-0">
                <div className="flex min-h-0 w-full flex-col gap-2 self-start">
                  <label id="conv-year-label" className="block text-sm font-medium text-theme-primary">
                    Year <span className="text-theme-accent">*</span>
                  </label>
                  <SimplePicker
                    value={form.placementYear}
                    onChange={(v) => {
                      setError("");
                      setSuccess("");
                      setForm((prev) => ({ ...prev, placementYear: Number(v) }));
                    }}
                    options={yearOptions.map((y) => ({ value: y, label: String(y) }))}
                    placeholder="Select year"
                    labelId="conv-year-label"
                  />
                </div>
                <div className="flex min-h-0 w-full flex-col gap-2 self-start">
                  <label id="conv-branch-label" className="block text-sm font-medium text-theme-primary">
                    Program <span className="text-theme-accent">*</span>
                  </label>
                  <SimplePicker
                    value={form.branchCode}
                    onChange={(v) => {
                      setError("");
                      setSuccess("");
                      setForm((prev) => ({ ...prev, branchCode: v, role: "" }));
                    }}
                    options={branchOptions}
                    placeholder="Select program"
                    labelId="conv-branch-label"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-theme bg-theme-app/40 p-5">
              <h2 className="text-lg font-semibold text-theme-primary">Company</h2>
              <SpcCompanySuggestField
                inputId="conv-company"
                label="Company name"
                companyQuery={form.companyQuery}
                selectedCompany={selectedCompany}
                suggestions={suggestions}
                suggestOpen={suggestOpen}
                suggestLoading={suggestLoading}
                suggestRootRef={suggestRootRef}
                onQueryChange={handleChange}
                onPickCompany={pickCompany}
                onFocusOpen={() => {
                  if (form.companyQuery.trim().length >= 2 && suggestions.length > 0) {
                    setSuggestOpen(true);
                  }
                }}
              />
            </section>

            <section className="space-y-4 rounded-2xl border border-theme bg-theme-app/40 p-5">
              <h2 className="text-lg font-semibold text-theme-primary">Conversion & compensation</h2>
              <div className="grid auto-rows-auto grid-cols-1 gap-4 sm:grid-cols-2 items-start min-h-0">
                <div className="sm:col-span-2 flex min-h-0 w-full flex-col gap-2 self-start">
                  <label className="block text-sm font-medium text-theme-primary" id="conv-type-label">
                    Conversion type <span className="text-theme-accent">*</span>
                  </label>
                  <SimplePicker
                    value={form.conversionType}
                    onChange={(v) => {
                      setError("");
                      setSuccess("");
                      setForm((prev) => ({
                        ...prev,
                        conversionType: v,
                        stipend: v === "fte" ? "" : prev.stipend,
                      }));
                    }}
                    options={CONVERSION_TYPES}
                    placeholder="Select conversion type"
                    labelId="conv-type-label"
                  />
                </div>
                <SpcRoleField
                  inputId="conv-role"
                  companyId={selectedCompany?.id}
                  placementYear={form.placementYear}
                  placementContext={placementCtxForRoles}
                  branchCode={form.branchCode}
                  value={form.role}
                  onChange={handleChange}
                />
                <SpcFormField
                  label="CTC"
                  name="ctc"
                  value={form.ctc}
                  onChange={handleChange}
                  placeholder="e.g. 18 LPA or TBD"
                  required
                  hint={SPC_COMPENSATION_TBD_HINT}
                  idPrefix="conv"
                />
                <SpcFormField
                  label="Base"
                  name="base"
                  value={form.base}
                  onChange={handleChange}
                  placeholder="e.g. 12 LPA or TBD"
                  required
                  hint={SPC_COMPENSATION_TBD_HINT}
                  idPrefix="conv"
                />
                {showStipend ? (
                  <div className="sm:col-span-2">
                    <SpcFormField
                      label="Stipend (for 6 month internship)"
                      name="stipend"
                      value={form.stipend}
                      onChange={handleChange}
                      placeholder="e.g. 50,000 or TBD"
                      required
                      hint={SPC_COMPENSATION_TBD_HINT}
                      idPrefix="conv"
                    />
                  </div>
                ) : null}
              </div>
            </section>

            {error || success ? (
              <div ref={formFeedbackRef} className="space-y-3">
                {error ? (
                  <div className="spc-form-alert spc-form-alert--error" role="alert">
                    <FaExclamationCircle className="spc-form-alert__icon" aria-hidden />
                    <span>{error}</span>
                  </div>
                ) : null}
                {success ? (
                  <div className="spc-form-alert spc-form-alert--success" role="status" aria-live="polite">
                    <FaCheckCircle className="spc-form-alert__icon" aria-hidden />
                    <span>{success}</span>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => navigate(tenantPath("/spc-dashboard"))}
                className="h-11 rounded-xl border border-theme px-5 text-sm font-semibold text-theme-primary transition-colors hover:bg-theme-nav"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-11 rounded-xl bg-theme-accent px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Saving…" : "Save conversion details"}
              </button>
            </div>
          </form>
        </div>
      </div>
      </div>
    </div>
  );
}
