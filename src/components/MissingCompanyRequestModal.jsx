import React, { useEffect, useMemo, useState } from "react";
import { submitMissingCompany } from "../utils/api";

function normalizeCompanyName(value) {
  if (value == null) return "";
  return String(value).trim();
}

function normalizeCompanyKey(value) {
  return normalizeCompanyName(value).toLowerCase();
}

export default function MissingCompanyRequestModal({
  isOpen,
  onClose,
  onSuccess,
  userCompanies = [],
  requestCategory = "company-listing",
}) {
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState(null);
  const [errorToast, setErrorToast] = useState("");

  const selectableCompanies = useMemo(() => {
    const uniqueCompanies = new Map();

    for (const companyName of userCompanies) {
      const displayName = normalizeCompanyName(companyName);
      if (!displayName) continue;

      const normalizedName = normalizeCompanyKey(displayName);
      if (!uniqueCompanies.has(normalizedName)) {
        uniqueCompanies.set(normalizedName, displayName);
      }
    }

    return Array.from(uniqueCompanies.values());
  }, [userCompanies]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedCompanies([]);
      setIsSubmitting(false);
      setErrorToast("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (!successToast && !errorToast) return undefined;

    const timeoutId = window.setTimeout(() => {
      setSuccessToast(null);
      setErrorToast("");
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [successToast, errorToast]);

  const toggleCompanySelection = (companyName) => {
    setSelectedCompanies((prev) =>
      prev.includes(companyName)
        ? prev.filter((item) => item !== companyName)
        : [...prev, companyName]
    );
  };

  const handleSubmit = async () => {
    if (selectedCompanies.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    setErrorToast("");
    try {
      const trimmedSelectedCompanies = selectedCompanies
        .map((companyName) => normalizeCompanyName(companyName))
        .filter(Boolean);

      const response = await submitMissingCompany({
        companyNames: trimmedSelectedCompanies,
        category: normalizeCompanyName(requestCategory) || "company-listing",
      });

      setSuccessToast({
        title: "Thanks! We'll update it soon 🚀",
        description: "Your missing company request has been recorded.",
      });
      setSelectedCompanies([]);
      if (typeof onSuccess === "function") {
        onSuccess(response?.data);
      }
      onClose?.();
    } catch (error) {
      const message =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Unable to submit missing company request right now.";
      setErrorToast(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {successToast && (
        <div className="fixed right-4 top-4 z-[70] w-[min(92vw,24rem)] rounded-2xl border border-theme bg-theme-card px-4 py-3 shadow-2xl">
          <p className="text-sm font-semibold text-theme-primary">{successToast.title}</p>
          <p className="mt-1 text-xs text-theme-secondary">{successToast.description}</p>
        </div>
      )}
      {errorToast && (
        <div className="fixed right-4 top-4 z-[71] w-[min(92vw,24rem)] rounded-2xl border border-red-500/30 bg-theme-card px-4 py-3 shadow-2xl">
          <p className="text-sm font-semibold text-red-600 dark:text-red-400">Request failed</p>
          <p className="mt-1 text-xs text-theme-secondary">{errorToast}</p>
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div
            className="w-full max-w-2xl rounded-2xl border border-theme bg-theme-card p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="missing-company-modal-title"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3
                  id="missing-company-modal-title"
                  className="text-xl font-semibold text-theme-primary"
                >
                  Missing Company Request
                </h3>
                <p className="mt-2 text-sm text-theme-secondary">
                  Select the companies from your profile that are still missing on the platform.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md px-2 py-1 text-theme-secondary transition-colors hover:bg-theme-nav hover:text-theme-primary"
                aria-label="Close missing company modal"
              >
                X
              </button>
            </div>

            {selectableCompanies.length === 0 ? (
              <div className="mt-6 rounded-xl border border-theme bg-theme-hero p-5 text-center">
                <p className="text-base font-medium text-theme-primary">
                  No companies were found in your profile.
                </p>
              </div>
            ) : (
              <>
                <div className="mt-6 grid max-h-[360px] grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
                  {selectableCompanies.map((companyName) => {
                    const isSelected = selectedCompanies.includes(companyName);
                    return (
                      <label
                        key={companyName}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                          isSelected
                            ? "border-theme-accent bg-theme-hero"
                            : "border-theme bg-theme-card hover:bg-theme-nav"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleCompanySelection(companyName)}
                          className="mt-1 h-4 w-4"
                        />
                        <div>
                          <p className="text-sm font-medium text-theme-primary">
                            {companyName}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>

                <p className="mt-4 text-xs text-theme-secondary">
                  Select the company from your profile that is not yet available on the platform.
                </p>
              </>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-lg border border-theme px-4 py-2 text-sm font-semibold text-theme-secondary transition-colors hover:bg-theme-nav disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={
                  isSubmitting ||
                  selectableCompanies.length === 0 ||
                  selectedCompanies.length === 0
                }
                className="rounded-lg bg-theme-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Submit request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
