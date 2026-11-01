import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BrandLogo from "./BrandLogo.jsx";
import { MESSAGES } from "../utils/constants";
import { billingAPI, companyAPI } from "../utils/api";
import { useAuth } from "../utils/AuthContext";
import { useTenantShell } from "../context/TenantShellContext.jsx";
import { GENERAL_COMPANY_CATEGORIES } from "../utils/generalCompanyCategory.js";

function sortByName(list) {
  return [...list].sort((a, b) =>
    String(a?.name || "").localeCompare(String(b?.name || ""), undefined, {
      sensitivity: "base",
    })
  );
}

function uniqueById(list) {
  const seen = new Set();
  const out = [];
  for (const row of Array.isArray(list) ? list : []) {
    const id = row?._id != null ? String(row._id) : "";
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push({
      _id: id,
      name: String(row.name || "").trim() || "Company",
      categoryId: row.categoryId || "",
      categoryLabel: row.categoryLabel || "",
    });
  }
  return out;
}

function companiesFromNames(names) {
  return uniqueById(
    (Array.isArray(names) ? names : []).map((row) => {
      const categoryId = String(row?.categoryId || "").trim();
      const categoryMeta = GENERAL_COMPANY_CATEGORIES.find((item) => item.id === categoryId);
      return {
        _id: row?._id,
        name: row?.name,
        categoryId,
        categoryLabel: categoryMeta?.label || row?.categoryLabel || "",
      };
    })
  );
}

function messageSaysFreeMockUsed(text) {
  return /free\s+ai\s+mock[\s\S]*used|free\s+mock[\s\S]*already\s+been\s+used|free\s+mock\s+interview\s+has\s+been\s+used/i.test(
    String(text || "")
  );
}

function readFreeMockRemaining(access) {
  // Prefer explicit remaining; if freeMockConsumed is still false, treat as 1 available.
  if (access?.freeMockConsumed === false) return 1;
  const remaining = Number(access?.freeMockRemaining);
  return Number.isFinite(remaining) ? Math.max(0, remaining) : 0;
}

/**
 * Shown when a user has reached the weekly interview cap, or a /general paywall.
 */
export default function InterviewLimitModal({
  open,
  onClose,
  message,
  limitRequestStatus = "none",
  onRequestAccess,
  requesting = false,
  upgradePath = "",
  preferredCompanyId = "",
  preferredCompanyName = "",
  onContinueWithPreferredCompany,
}) {
  const navigate = useNavigate();
  const { appPath } = useTenantShell();
  const { user } = useAuth();
  const testEmailPicksAnyCompany = user?.testEmailAccess?.active === true;
  const testMockStillAvailable =
    testEmailPicksAnyCompany && user.testEmailAccess.mockRemaining !== 0;
  const preferredId = String(preferredCompanyId || "").trim();
  const preferredName = String(preferredCompanyName || "").trim();
  const hasPreferredCompany = Boolean(preferredId);
  const [requestFeedback, setRequestFeedback] = useState("");
  const [freeMockRemaining, setFreeMockRemaining] = useState(null);
  const [accessLoaded, setAccessLoaded] = useState(false);
  const [mockCompanies, setMockCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [showCompanyPicker, setShowCompanyPicker] = useState(false);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [companiesError, setCompaniesError] = useState("");

  useEffect(() => {
    if (!open) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setRequestFeedback("");
      setShowCompanyPicker(false);
      setSelectedCompanyId("");
      setCompaniesError("");
      setFreeMockRemaining(null);
      setAccessLoaded(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !upgradePath || testEmailPicksAnyCompany) return undefined;
    let cancelled = false;
    setAccessLoaded(false);
    setFreeMockRemaining(null);
    // Company was already chosen in setup — only need remaining-count, not a second picker.
    if (hasPreferredCompany) {
      setCompaniesLoading(true);
      (async () => {
        try {
          const accessRes = await billingAPI.getAccess().catch(() => null);
          if (cancelled) return;
          setFreeMockRemaining(readFreeMockRemaining(accessRes?.data));
          setMockCompanies([]);
          setSelectedCompanyId(preferredId);
          setCompaniesError("");
        } catch {
          if (!cancelled) {
            setFreeMockRemaining(0);
            setMockCompanies([]);
            setSelectedCompanyId(preferredId);
            setCompaniesError("");
          }
        } finally {
          if (!cancelled) {
            setCompaniesLoading(false);
            setAccessLoaded(true);
          }
        }
      })();
      return () => {
        cancelled = true;
      };
    }

    setCompaniesLoading(true);
    (async () => {
      try {
        const [accessRes, namesRes] = await Promise.all([
          billingAPI.getAccess().catch(() => null),
          companyAPI.getCompanyNames().catch(() => ({ data: [] })),
        ]);
        if (cancelled) return;
        setFreeMockRemaining(readFreeMockRemaining(accessRes?.data));

        const companies = sortByName(companiesFromNames(namesRes?.data || []));
        setMockCompanies(companies);
        setSelectedCompanyId(companies[0]?._id ? String(companies[0]._id) : "");
        setCompaniesError(companies.length ? "" : "Could not load companies. Please try again.");
      } catch {
        if (!cancelled) {
          setFreeMockRemaining(0);
          setMockCompanies([]);
          setSelectedCompanyId("");
          setCompaniesError("Could not load companies. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setCompaniesLoading(false);
          setAccessLoaded(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, upgradePath, testEmailPicksAnyCompany, hasPreferredCompany, preferredId]);

  if (!open) return null;

  const body =
    (message && String(message).trim()) || MESSAGES.INTERVIEW_LIMIT_REACHED;
  const isPending = limitRequestStatus === "pending";
  const freeMockUsedByMessage = messageSaysFreeMockUsed(body);
  // Wait for access load; never treat null/loading as "still have a free mock".
  const freeMockAvailable =
    Boolean(upgradePath) &&
    !testEmailPicksAnyCompany &&
    accessLoaded &&
    !freeMockUsedByMessage &&
    Number.isFinite(freeMockRemaining) &&
    freeMockRemaining > 0;
  const freeMockUsed =
    Boolean(upgradePath) &&
    !testEmailPicksAnyCompany &&
    accessLoaded &&
    (freeMockUsedByMessage || freeMockRemaining === 0);

  const handleRequest = async () => {
    if (!onRequestAccess || isPending || requesting) return;
    setRequestFeedback("");
    try {
      const result = await onRequestAccess();
      setRequestFeedback(result?.message || MESSAGES.INTERVIEW_LIMIT_REQUEST_SUBMITTED);
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Could not submit your request. Please try again.";
      setRequestFeedback(msg);
    }
  };

  const startFreeMock = () => {
    if (hasPreferredCompany && typeof onContinueWithPreferredCompany === "function") {
      onContinueWithPreferredCompany();
      return;
    }
    const id = String(selectedCompanyId || "").trim();
    if (!id) return;
    onClose();
    navigate(`${appPath("/interviews")}?companyId=${encodeURIComponent(id)}`);
  };

  return (
    <div
      className="fixed inset-0 z-[220] flex items-center justify-center p-4 sm:p-6 bg-black/55 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="interview-limit-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-theme-accent bg-theme-card shadow-2xl p-6 sm:p-10 flex flex-col gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="h-14 w-24 shrink-0 rounded-lg border border-theme bg-white/95 p-2 shadow-sm">
            <BrandLogo />
          </div>
          <div className="min-w-0">
            <p
              id="interview-limit-title"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-theme-accent mb-2"
            >
              Interview limit
            </p>
            <h3 className="text-2xl sm:text-3xl font-bold text-theme-primary leading-tight">
              {upgradePath ? "Unlock more mocks" : "Come back in a week"}
            </h3>
          </div>
        </div>
        <p className="text-sm sm:text-base text-theme-secondary leading-relaxed">{body}</p>

        {upgradePath && !testMockStillAvailable ? (
          <div className="flex flex-col gap-3">
            {!accessLoaded ? (
              <p className="text-sm text-theme-muted">Checking free mock availability…</p>
            ) : freeMockAvailable ? (
              hasPreferredCompany ? (
                <div className="rounded-xl border border-theme bg-theme-hero/30 p-4">
                  <p className="text-sm font-semibold text-theme-primary">
                    You still have {freeMockRemaining} free mock
                    {freeMockRemaining === 1 ? "" : "s"}
                  </p>
                  <p className="mt-1 text-sm text-theme-secondary">
                    Continue with{" "}
                    <span className="font-semibold text-theme-primary">
                      {preferredName || "your selected company"}
                    </span>
                    . Company and rounds are already set.
                  </p>
                  <button
                    type="button"
                    onClick={startFreeMock}
                    disabled={companiesLoading}
                    className="mt-3 w-full px-6 py-3 rounded-xl border border-theme-accent text-theme-accent text-base font-semibold transition-colors hover:bg-theme-hero disabled:opacity-60"
                  >
                    Continue free mock
                  </button>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setShowCompanyPicker(true)}
                    className={`text-left rounded-xl border p-4 transition-colors ${
                      showCompanyPicker
                        ? "border-theme-accent bg-theme-hero/50"
                        : "border-theme bg-theme-hero/30 hover:bg-theme-hero/50"
                    }`}
                  >
                    <p className="text-sm font-semibold text-theme-primary">
                      Take 1 free mock on any company
                    </p>
                    <p className="mt-1 text-sm text-theme-secondary">
                      You have one free mock. Use it on any company of your choice.
                    </p>
                  </button>

                  {showCompanyPicker ? (
                    <div className="rounded-xl border border-theme bg-theme-card p-4">
                      <label
                        htmlFor="free-mock-company"
                        className="mb-1 block text-xs font-medium text-theme-secondary"
                      >
                        Choose a company
                      </label>
                      {companiesLoading ? (
                        <p className="text-sm text-theme-muted">Loading companies…</p>
                      ) : companiesError && !mockCompanies.length ? (
                        <p className="text-sm text-theme-muted">{companiesError}</p>
                      ) : (
                        <select
                          id="free-mock-company"
                          className="w-full rounded-lg border border-theme bg-theme-card px-3 py-2 text-sm text-theme-primary"
                          value={selectedCompanyId}
                          onChange={(e) => setSelectedCompanyId(e.target.value)}
                        >
                          {mockCompanies.map((company) => (
                            <option key={company._id} value={company._id}>
                              {company.name}
                              {company.categoryLabel ? ` (${company.categoryLabel})` : ""}
                            </option>
                          ))}
                        </select>
                      )}
                      <button
                        type="button"
                        onClick={startFreeMock}
                        disabled={!selectedCompanyId || companiesLoading}
                        className="mt-3 w-full px-6 py-3 rounded-xl border border-theme-accent text-theme-accent text-base font-semibold transition-colors hover:bg-theme-hero disabled:opacity-60"
                      >
                        Start free mock
                      </button>
                    </div>
                  ) : null}
                </>
              )
            ) : freeMockUsed && !freeMockUsedByMessage ? (
              <p className="text-sm text-theme-muted leading-relaxed">
                Your free AI mock interview has already been used. Unlock unlimited mocks from the
                pricing page.
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-theme-muted leading-relaxed">
            Need another mock interview sooner? You can request access from the admin team.
          </p>
        )}
        {isPending ? (
          <p className="text-sm text-amber-600 dark:text-indigo-400" aria-live="polite">
            {MESSAGES.INTERVIEW_LIMIT_REQUEST_PENDING}
          </p>
        ) : null}
        {requestFeedback ? (
          <p className="text-sm text-theme-secondary" aria-live="polite">
            {requestFeedback}
          </p>
        ) : null}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2 border-t border-theme">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 rounded-xl border border-theme text-theme-primary text-base font-semibold transition-colors hover:bg-theme-hero"
          >
            OK
          </button>
          {upgradePath ? (
            <Link
              to={upgradePath}
              onClick={onClose}
              className="px-6 py-3 rounded-xl bg-theme-accent text-white text-base font-semibold shadow-lg transition-colors hover:opacity-95 text-center"
            >
              View pricing
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleRequest}
              disabled={isPending || requesting}
              className="px-6 py-3 rounded-xl bg-theme-accent text-white text-base font-semibold shadow-lg transition-colors hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending
                ? "Request pending"
                : requesting
                  ? "Sending request…"
                  : "Request additional interview"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
