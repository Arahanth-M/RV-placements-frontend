import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaChevronDown } from "react-icons/fa";
import { spcAPI } from "../utils/api";

const INITIAL_FORM = {
  email: "",
  name: "",
  usn: "",
  companyPlaced: "",
  typeOfOffer: "",
  stipend: "",
  base: "",
  ctc: "",
};

const SPC_TYPE_OF_OFFER_OPTIONS = [
  "Internship(PPO)",
  "FTE",
  "Internship+FTE",
  "Internship + FTE (PBC)",
];

/* ─── Shared input class ────────────────────────────────────────────────── */
const INPUT_CLASS =
  "spc-field-control h-11 min-h-[2.75rem] max-h-[2.75rem] w-full shrink-0 rounded-xl border border-theme bg-theme-app px-4 text-sm text-theme-primary outline-none focus:border-theme-accent transition-colors placeholder:text-theme-muted box-border";

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
          className={`h-3.5 w-3.5 shrink-0 text-theme-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open && (
        <ul
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-auto rounded-xl border border-theme bg-theme-card py-1 shadow-lg"
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

/* ─── Field ─────────────────────────────────────────────────────────────── */
function Field({ label, name, value, onChange, type = "text", placeholder = "" }) {
  return (
    <div className="flex min-h-0 w-full flex-col gap-2 self-start">
      <label htmlFor={`field-${name}`} className="block text-sm font-medium text-theme-primary">
        {label}
      </label>
      <input
        id={`field-${name}`}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={INPUT_CLASS}
      />
    </div>
  );
}

/* ─── Main Form ─────────────────────────────────────────────────────────── */
export default function SPCPlacementForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setError("");
    setSuccess("");
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      if (!String(form.typeOfOffer || "").trim()) {
        setError("Please select a type of offer.");
        return;
      }

      const cleaned = {};
      Object.keys(form).forEach((key) => {
        if (form[key] !== "" && form[key] !== null) cleaned[key] = form[key];
      });

      await spcAPI.submitPlacement(cleaned);
      setSuccess("Placement data submitted successfully");
      setForm(INITIAL_FORM);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to submit placement data");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="spc-placement-form min-h-screen bg-theme-app px-4 py-8">
      <div className="mx-auto w-full max-w-2xl">
        <div className="rounded-3xl border border-theme bg-theme-card p-6 shadow-xl sm:p-8">

          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-theme-primary">SPC Placement Form</h1>
              <p className="mt-2 text-sm text-theme-secondary">
                Add a linked student record and placement entry using the new normalized placement flow.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/spc-dashboard")}
              className="shrink-0 rounded-xl border border-theme px-4 py-2 text-sm font-medium text-theme-primary transition-colors hover:bg-theme-nav"
            >
              Back to Dashboard
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">

            {/* Student Details */}
            <section className="space-y-4 rounded-2xl border border-theme bg-theme-app/40 p-5">
              <h2 className="text-lg font-semibold text-theme-primary">Student Details</h2>
              <div className="grid auto-rows-auto grid-cols-1 gap-4 sm:grid-cols-2 items-start min-h-0">
                <div className="sm:col-span-2">
                  <Field
                    label="Email of student"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    type="email"
                    placeholder="student@rvce.edu.in"
                  />
                </div>
                <Field
                  label="Name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Student full name"
                />
                <Field
                  label="USN"
                  name="usn"
                  value={form.usn}
                  onChange={(e) =>
                    handleChange({ target: { name: "usn", value: e.target.value.toUpperCase() } })
                  }
                  placeholder="1RV22CS001"
                />
              </div>
            </section>

            {/* Placement Details */}
            <section className="space-y-4 rounded-2xl border border-theme bg-theme-app/40 p-5">
              <h2 className="text-lg font-semibold text-theme-primary">Placement Details</h2>

              <div className="grid auto-rows-auto grid-cols-1 gap-4 sm:grid-cols-2 items-start min-h-0">
                <Field
                  label="Company placed"
                  name="companyPlaced"
                  value={form.companyPlaced}
                  onChange={handleChange}
                  placeholder="Enter company name"
                />

                <div className="flex min-h-0 w-full flex-col gap-2 self-start">
                  <label className="block text-sm font-medium text-theme-primary" id="spc-type-of-offer-label">
                    Type of offer
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

              <div className="grid auto-rows-auto grid-cols-1 gap-4 sm:grid-cols-3 items-start min-h-0">
                <Field
                  label="Stipend"
                  name="stipend"
                  value={form.stipend}
                  onChange={handleChange}
                  placeholder="e.g. 50,000"
                />
                 <Field
                  label="CTC"
                  name="ctc"
                  value={form.ctc}
                  onChange={handleChange}
                  placeholder="e.g. 18 LPA"
                />
                <Field
                  label="Base"
                  name="base"
                  value={form.base}
                  onChange={handleChange}
                  placeholder="e.g. 12LPA"
                />
               
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

            {/* Feedback */}
            {error && (
              <div className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-700/50 dark:bg-red-950/40 dark:text-red-400">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-2xl border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-700/50 dark:bg-green-950/40 dark:text-green-400">
                {success}
              </div>
            )}

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
  );
}