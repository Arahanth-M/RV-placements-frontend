import { useState } from "react";
import { authAPI } from "../utils/api";

export default function BlockedLoginInterestForm({ token, onSkip }) {
  const [collegeName, setCollegeName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const canSubmit = collegeName.trim().length >= 2 && !submitting;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit || !token) return;
    setSubmitting(true);
    setError("");
    try {
      await authAPI.submitBlockedLoginInterest({
        token,
        collegeName: collegeName.trim(),
        wantsPlatformAtCollege: true,
      });
      setDone(true);
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          "Could not save your response. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="mt-6 border-t border-theme pt-6 text-left">
        <p className="text-sm font-semibold text-theme-primary">Thanks for telling us.</p>
        <p className="mt-2 text-sm text-theme-secondary">
          We recorded your college interest. We will soon get in touch with your
          college and build a custom dashboard for your college.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 border-t border-theme pt-6 text-left">
      <p className="text-sm font-semibold text-theme-primary">
        Our team is working to implement the platform in multiple colleges across
        India. Want this to be implemented in your college? Please enter the
        college name.
      </p>
      <label className="mt-3 block text-sm font-semibold text-theme-primary">
        <span className="sr-only">College name</span>
        <input
          type="text"
          value={collegeName}
          onChange={(e) => setCollegeName(e.target.value)}
          maxLength={120}
          autoComplete="organization"
          placeholder="College name"
          className="mt-2 w-full rounded-xl border border-theme bg-theme-hero px-3 py-2 text-sm font-normal text-theme-primary outline-none focus:border-theme-accent"
        />
      </label>
      <p className="mt-2 text-xs text-theme-secondary">
        This does not grant access. Skip if you do not want to share.
      </p>

      {error ? <p className="mt-3 text-sm text-red-500">{error}</p> : null}

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-xl bg-theme-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Sending…" : "Send response"}
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="rounded-xl border border-theme px-4 py-2 text-sm font-medium text-theme-secondary hover:text-theme-primary"
        >
          Skip
        </button>
      </div>
    </form>
  );
}
