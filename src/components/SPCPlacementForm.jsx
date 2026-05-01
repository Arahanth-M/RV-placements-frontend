import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { spcAPI } from "../utils/api";
import {
  CompensationAsterisk,
  CompensationDisclaimerFootnote,
} from "./PlacementCompensationNote.jsx";

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

/** Allowed values for SPC submission — matches company visit type vocabulary */
const SPC_TYPE_OF_OFFER_OPTIONS = [
  "Internship(PPO)",
  "FTE",
  "Internship+FTE",
  "Internship + FTE (PBC)",
];

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder = "",
  compensationMarker = false,
}) {
  return (
    <label className="block w-full space-y-2">
      <span className="text-sm font-medium text-theme-primary inline-flex items-baseline gap-1 flex-wrap">
        {label}
        {compensationMarker ? <CompensationAsterisk /> : null}
      </span>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="spc-form-field w-full rounded-xl border border-theme bg-theme-app px-4 py-3 text-sm text-theme-primary outline-none focus:border-theme-accent"
      />
    </label>
  );
}

export default function SPCPlacementForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setError("");
    setSuccess("");
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const cleaned = {};
      Object.keys(form).forEach((key) => {
        if (form[key] !== "" && form[key] !== null) {
          cleaned[key] = form[key];
        }
      });

      await spcAPI.submitPlacement(cleaned);
      setSuccess("Placement data submitted successfully");
      setForm(INITIAL_FORM);
    } catch (submitError) {
      setError(
        submitError?.response?.data?.message ||
          "Failed to submit placement data"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="spc-placement-form min-h-screen bg-theme-app px-4 py-8">
      <div className="mx-auto w-full max-w-2xl">
        <div className="rounded-3xl border border-theme bg-theme-card p-6 shadow-xl sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-theme-primary">
                SPC Placement Form
              </h1>
              <p className="mt-2 text-sm text-theme-secondary">
                Add a linked student record and placement entry using the new
                normalized placement flow.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/spc-dashboard")}
              className="rounded-xl border border-theme px-4 py-2 text-sm font-medium text-theme-primary transition-colors hover:bg-theme-nav"
            >
              Back to Dashboard
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-8">
            <section className="space-y-4 rounded-2xl border border-theme bg-theme-app/40 p-5">
              <h2 className="text-lg font-semibold text-theme-primary">
                Student Details
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                  onChange={(event) =>
                    handleChange({
                      target: {
                        name: "usn",
                        value: event.target.value.toUpperCase(),
                      },
                    })
                  }
                  placeholder="1RV22CS001"
                />
              </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-theme bg-theme-app/40 p-5">
              <h2 className="text-lg font-semibold text-theme-primary">
                Placement Details
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label="Company placed"
                  name="companyPlaced"
                  value={form.companyPlaced}
                  onChange={handleChange}
                  placeholder="Enter company name"
                />
                <label className="block w-full space-y-2">
                  <span className="text-sm font-medium text-theme-primary">
                    Type of offer
                  </span>
                  <select
                    name="typeOfOffer"
                    value={form.typeOfOffer}
                    onChange={handleChange}
                    required
                    className="spc-form-field w-full rounded-xl border border-theme bg-theme-app px-4 py-3 text-sm text-theme-primary outline-none focus:border-theme-accent"
                  >
                    <option value="">Select type of offer</option>
                    {SPC_TYPE_OF_OFFER_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field
                  label="Stipend"
                  name="stipend"
                  value={form.stipend}
                  onChange={handleChange}
                  placeholder="e.g. ₹ 50,000 / month"
                  compensationMarker
                />
                <Field
                  label="Base"
                  name="base"
                  value={form.base}
                  onChange={handleChange}
                  placeholder="e.g. base component of package"
                  compensationMarker
                />
                <Field
                  label="CTC"
                  name="ctc"
                  value={form.ctc}
                  onChange={handleChange}
                  placeholder="e.g. 18 LPA or breakdown"
                  compensationMarker
                />
              </div>
              <CompensationDisclaimerFootnote className="text-[11px] sm:text-xs text-theme-muted mt-1 italic leading-snug" />
            </section>

            <section className="space-y-4 rounded-2xl border border-theme bg-theme-app/40 p-5">
              <h2 className="text-lg font-semibold text-theme-primary">
                Resume Upload
              </h2>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-theme-primary">
                  Upload resume
                </span>
                <input
                  type="file"
                  disabled
                  className="spc-form-field w-full cursor-not-allowed rounded-xl border border-theme bg-theme-app px-4 py-3 text-sm text-theme-secondary opacity-70"
                />
              </label>
              <p className="text-sm text-theme-secondary">
                Resume upload is on hold for now and is not being submitted yet.
              </p>
            </section>

            {error ? (
              <div className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="rounded-2xl border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700">
                {success}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => navigate("/spc-dashboard")}
                className="rounded-xl border border-theme px-5 py-3 text-sm font-semibold text-theme-primary transition-colors hover:bg-theme-nav"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-theme-accent px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Submitting..." : "Submit Placement Data"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
