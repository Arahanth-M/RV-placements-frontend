import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaCheckCircle, FaChevronDown, FaExclamationCircle } from "react-icons/fa";
import { spcAPI } from "../utils/api";
import {
  PageBackButton,
  PageBackNavRow,
  pageShellInnerClass,
  pageShellOuterClass,
} from "./PageBackNav.jsx";
import SpcRoleField from "./SpcRoleField.jsx";
import SpcFormField, { INPUT_CLASS } from "./SpcFormField.jsx";
import SpcCompanySuggestField from "./SpcCompanySuggestField.jsx";
import {
  DEFAULT_PLACEMENT_DETAIL_YEAR,
  PLACEMENT_DETAIL_VISIT_YEARS,
} from "../constants/placementYears.js";
import { formatPpoBranchLabel, PPO_BRANCH_CODES } from "../constants/ppoBranchCodes.js";
import {
  compensationVisibilityForTypeOfOffer,
  SPC_COMPENSATION_TBD_HINT,
  validateSpcPlacementSubmit,
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

const INITIAL_FORM = {
  email: "",
  name: "",
  usn: "",
  companyQuery: "",
  companyPlaced: "",
  typeOfOffer: "",
  role: "",
  stipend: "",
  base: "",
  ctc: "",
  placementYear: DEFAULT_PLACEMENT_DETAIL_YEAR,
  branchCode: "",
};

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

const SPC_TYPE_OF_OFFER_OPTIONS = [
  "Internship(PPO)",
  "FTE",
  "Internship+FTE",
  "Internship + FTE (PBC)",
  "Only internship(6 months)",
];

/* ─── TypeOfOfferPicker ─────────────────────────────────────────────────── */
function TypeOfOfferPicker({ value, onChange, options, placeholder, labelId }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => { if (e.key === "Escape") setOpen(false); };
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

  const pick = (next) => {
    onChange({ target: { name: "typeOfOffer", value: next } });
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        type="button"
        id="spc-type-of-offer-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={labelId}
        className={`${INPUT_CLASS} flex cursor-pointer items-center justify-between gap-2 text-left`}
        onClick={() => setOpen((p) => !p)}
      >
        <span className={value ? "text-theme-primary" : "text-theme-muted"}>
          {value || placeholder}
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
            const selected = value === opt;
            return (
              <li key={opt} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={`flex w-full px-4 py-2.5 text-left text-sm transition-colors ${
                    selected
                      ? "bg-theme-nav font-medium text-theme-primary"
                      : "text-theme-primary hover:bg-theme-nav"
                  }`}
                  onClick={() => pick(opt)}
                >
                  {opt}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ─── Main Form ─────────────────────────────────────────────────────────── */
export default function SPCPlacementForm() {
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
  const selectedCompanyRef = useRef(null);

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
      setForm((prev) => ({ ...prev, companyQuery: value, companyPlaced: "", role: "" }));
      return;
    }
    if (name === "branchCode") {
      setForm((prev) => ({ ...prev, branchCode: value, role: "" }));
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
        const locked = selectedCompanyRef.current;
        const matchesLocked =
          locked?.id && q.trim() === String(locked.name || "").trim();
        setSuggestOpen(Boolean(items.length > 0 && !matchesLocked));
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
    setForm((prev) => ({
      ...prev,
      companyQuery: item.name,
      companyPlaced: item.name,
      role: "",
    }));
    setSuggestOpen(false);
    setSuggestions([]);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const validationErrors = validateSpcPlacementSubmit(form, selectedCompany);
      if (validationErrors.length) {
        setError(validationErrors[0]);
        return;
      }

      const { stipend: sendStipend, fte: sendFte } = compensationVisibilityForTypeOfOffer(
        form.typeOfOffer
      );

      const cleaned = {
        email: form.email.trim(),
        name: form.name.trim(),
        usn: form.usn.trim(),
        companyPlaced: selectedCompany.name.trim(),
        typeOfOffer: form.typeOfOffer.trim(),
        companyId: selectedCompany.id,
        placementYear: Number(form.placementYear),
        branchCode: form.branchCode,
        role: String(form.role ?? "").trim(),
      };
      if (sendStipend) cleaned.stipend = String(form.stipend ?? "").trim();
      if (sendFte) {
        cleaned.base = String(form.base ?? "").trim();
        cleaned.ctc = String(form.ctc ?? "").trim();
      }
      const placementCtx = placementContextHintForSpc(selectedCompany.id, searchParams);
      if (placementCtx) {
        cleaned.placementContext = placementCtx;
      }

      await spcAPI.submitPlacement(cleaned);
      setSuccess("Placement data submitted successfully");
      setForm(INITIAL_FORM);
      setSelectedCompany(null);
      setSuggestions([]);
    } catch (err) {
      setError(formatSpcSubmitError(err, "Failed to submit placement data"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const compFields = compensationVisibilityForTypeOfOffer(form.typeOfOffer);
  const placementCtxForRoles = placementContextHintForSpc(selectedCompany?.id, searchParams);

  return (
    <div className={`spc-placement-form min-h-screen ${pageShellOuterClass}`}>
      <div className={pageShellInnerClass}>
        <PageBackNavRow>
          <PageBackButton onClick={() => navigate("/spc-dashboard")} label="Back to Dashboard" />
        </PageBackNavRow>

        <div className="mx-auto w-full max-w-2xl">
        <div className="rounded-3xl border border-theme bg-theme-card p-6 shadow-xl sm:p-8">
          <div>
            <h1 className="text-3xl font-bold text-theme-primary">Placement Form</h1>
            {/* <p className="mt-2 text-sm text-theme-secondary">
              With company, placement year, and branch from suggestions, role and the compensation fields you see
              (by type of offer) update the matched company visit the same way as Update conversion details.
            </p> */}
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {/* Student Details */}
            <section className="space-y-4 rounded-2xl border border-theme bg-theme-app/40 p-5">
              <h2 className="text-lg font-semibold text-theme-primary">Student Details</h2>
              <div className="grid auto-rows-auto grid-cols-1 gap-4 sm:grid-cols-2 items-start min-h-0">
                <div className="sm:col-span-2">
                  <SpcFormField
                    label="Email of student"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    type="email"
                    placeholder="student@rvce.edu.in"
                    required
                    idPrefix="spc-pl"
                  />
                </div>
                <SpcFormField
                  label="Name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Student full name"
                  required
                  idPrefix="spc-pl"
                />
                <SpcFormField
                  label="USN"
                  name="usn"
                  value={form.usn}
                  onChange={(e) =>
                    handleChange({ target: { name: "usn", value: e.target.value.toUpperCase() } })
                  }
                  placeholder="1RV22CS001"
                  required
                  idPrefix="spc-pl"
                />
              </div>
            </section>

            {/* Placement Details */}
            <section className="space-y-4 rounded-2xl border border-theme bg-theme-app/40 p-5">
              <h2 className="text-lg font-semibold text-theme-primary">Placement Details</h2>

              <SpcCompanySuggestField
                inputId="spc-pl-company"
                label="Company"
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

              <div className="grid auto-rows-auto grid-cols-1 gap-4 sm:grid-cols-2 items-start min-h-0">
                <div className="flex min-h-0 w-full flex-col gap-2 self-start">
                  <label htmlFor="spc-pl-year" className="block text-sm font-medium text-theme-primary">
                    Placement year <span className="text-theme-accent">*</span>
                  </label>
                  <select
                    id="spc-pl-year"
                    name="placementYear"
                    required
                    value={form.placementYear}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        placementYear: Number(e.target.value),
                      }))
                    }
                    className={INPUT_CLASS}
                  >
                    {PLACEMENT_DETAIL_VISIT_YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex min-h-0 w-full flex-col gap-2 self-start">
                  <label htmlFor="spc-pl-branch" className="block text-sm font-medium text-theme-primary">
                    Branch <span className="text-theme-accent">*</span>
                  </label>
                  <select
                    id="spc-pl-branch"
                    name="branchCode"
                    required
                    value={form.branchCode}
                    onChange={handleChange}
                    className={INPUT_CLASS}
                  >
                    <option value="">Select branch</option>
                    {PPO_BRANCH_CODES.map((b) => (
                      <option key={b} value={b}>
                        {formatPpoBranchLabel(b)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid auto-rows-auto grid-cols-1 gap-4 sm:grid-cols-2 items-start min-h-0">
                <div className="flex min-h-0 w-full flex-col gap-2 self-start">
                  <label className="block text-sm font-medium text-theme-primary" id="spc-type-of-offer-label">
                    Type of offer <span className="text-theme-accent">*</span>
                  </label>
                  <TypeOfOfferPicker
                    value={form.typeOfOffer}
                    onChange={handleChange}
                    options={SPC_TYPE_OF_OFFER_OPTIONS}
                    placeholder="Select type of offer"
                    labelId="spc-type-of-offer-label"
                  />
                </div>
              </div>

              <div className="grid auto-rows-auto grid-cols-1 gap-4 sm:grid-cols-2 items-start min-h-0">
                <SpcRoleField
                  inputId="spc-pl-role"
                  companyId={selectedCompany?.id}
                  placementYear={form.placementYear}
                  placementContext={placementCtxForRoles}
                  branchCode={form.branchCode}
                  value={form.role}
                  onChange={handleChange}
                />
                {compFields.stipend ? (
                  <SpcFormField
                    label="Stipend"
                    name="stipend"
                    value={form.stipend}
                    onChange={handleChange}
                    placeholder="e.g. 50,000 or TBD"
                    required
                    hint={SPC_COMPENSATION_TBD_HINT}
                    idPrefix="spc-pl"
                  />
                ) : null}
                {compFields.fte ? (
                  <>
                    <SpcFormField
                      label="CTC"
                      name="ctc"
                      value={form.ctc}
                      onChange={handleChange}
                      placeholder="e.g. 18 LPA or TBD"
                      required
                      hint={SPC_COMPENSATION_TBD_HINT}
                      idPrefix="spc-pl"
                    />
                    <SpcFormField
                      label="Base"
                      name="base"
                      value={form.base}
                      onChange={handleChange}
                      placeholder="e.g. 12 LPA or TBD"
                      required
                      hint={SPC_COMPENSATION_TBD_HINT}
                      idPrefix="spc-pl"
                    />
                  </>
                ) : null}
              </div>
            </section>

            {/* Resume Upload */}
            <section className="space-y-4 rounded-2xl border border-theme bg-theme-app/40 p-5">
              <h2 className="text-lg font-semibold text-theme-primary">Resume Upload</h2>
              <div className="flex min-h-0 w-full max-w-full flex-col gap-2 self-start">
                <label className="block text-sm font-medium text-theme-primary">Upload resume</label>
                <input
                  type="file"
                  disabled
                  className={`${INPUT_CLASS} cursor-not-allowed opacity-50 file:cursor-not-allowed`}
                />
              </div>
              <p className="text-sm text-theme-secondary">
                Resume upload is on hold for now and is not being submitted yet.
              </p>
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

            {/* Actions */}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => navigate("/spc-dashboard")}
                className="h-11 rounded-xl border border-theme px-5 text-sm font-semibold text-theme-primary transition-colors hover:bg-theme-nav"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-11 rounded-xl bg-theme-accent px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Submitting…" : "Submit Placement Data"}
              </button>
            </div>
          </form>
        </div>
      </div>
      </div>
    </div>
  );
}