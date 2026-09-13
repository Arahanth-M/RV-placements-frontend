import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BrandLogo from "./BrandLogo.jsx";
import { MESSAGES } from "../utils/constants";
import { billingAPI, companyAPI } from "../utils/api";
import { useTenantShell } from "../context/TenantShellContext.jsx";
import {
  GENERAL_COMPANY_CATEGORIES,
  groupCompaniesByGeneralCategory,
} from "../utils/generalCompanyCategory.js";

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

function teasersFromAccess(access, nameLookup) {
  const fromApi = uniqueById(access?.teaserCompanies);
  if (fromApi.length) return fromApi;

  const ids = access?.teaserCompanyIds && typeof access.teaserCompanyIds === "object"
    ? access.teaserCompanyIds
    : {};
  const fromIds = [];
  for (const [categoryId, rawId] of Object.entries(ids)) {
    const id = rawId != null ? String(rawId).trim() : "";
    if (!id) continue;
    const categoryMeta = GENERAL_COMPANY_CATEGORIES.find((item) => item.id === categoryId);
    fromIds.push({
      _id: id,
      name: nameLookup.get(id) || "Teaser company",
      categoryId,
      categoryLabel: categoryMeta?.label || categoryId,
    });
  }
  return uniqueById(fromIds);
}

function teasersFromCompanyList(companies) {
  const sorted = sortByName(Array.isArray(companies) ? companies : []);
  const grouped = groupCompaniesByGeneralCategory(sorted);
  const out = [];
  for (const category of GENERAL_COMPANY_CATEGORIES) {
    const first = grouped[category.id]?.[0];
    if (!first?._id) continue;
    out.push({
      _id: String(first._id),
      name: String(first.name || "").trim() || "Company",
      categoryId: category.id,
      categoryLabel: category.label,
    });
  }
  return uniqueById(out);
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
}) {
  const navigate = useNavigate();
  const { appPath } = useTenantShell();
  const [requestFeedback, setRequestFeedback] = useState("");
  const [freeMockRemaining, setFreeMockRemaining] = useState(null);
  const [teaserCompanies, setTeaserCompanies] = useState([]);
  const [selectedTeaserId, setSelectedTeaserId] = useState("");
  const [showTeaserPicker, setShowTeaserPicker] = useState(false);
  const [teasersLoading, setTeasersLoading] = useState(false);
  const [teasersError, setTeasersError] = useState("");

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
      setShowTeaserPicker(false);
      setSelectedTeaserId("");
      setTeasersError("");
    }
  }, [open]);

  useEffect(() => {
    if (!open || !upgradePath) return undefined;
    let cancelled = false;
    setTeasersLoading(true);
    (async () => {
      try {
        const [accessRes, namesRes, companiesRes] = await Promise.all([
          billingAPI.getAccess().catch(() => null),
          companyAPI.getCompanyNames().catch(() => ({ data: [] })),
          companyAPI.getAllCompanies().catch(() => ({ data: [] })),
        ]);
        if (cancelled) return;
        const access = accessRes?.data || {};
        const remaining = Number(access.freeMockRemaining);
        setFreeMockRemaining(Number.isFinite(remaining) ? remaining : 1);

        const nameLookup = new Map(
          (Array.isArray(namesRes?.data) ? namesRes.data : []).map((row) => [
            String(row._id),
            String(row.name || "").trim(),
          ])
        );
        let teasers = teasersFromAccess(access, nameLookup);
        if (!teasers.length) {
          teasers = teasersFromCompanyList(companiesRes?.data || []);
        }
        teasers = sortByName(teasers);
        setTeaserCompanies(teasers);
        setSelectedTeaserId(teasers[0]?._id ? String(teasers[0]._id) : "");
        setTeasersError(teasers.length ? "" : "Could not load teaser companies. Please try again.");
      } catch {
        if (!cancelled) {
          setFreeMockRemaining(1);
          setTeaserCompanies([]);
          setSelectedTeaserId("");
          setTeasersError("Could not load teaser companies. Please try again.");
        }
      } finally {
        if (!cancelled) setTeasersLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, upgradePath]);

  if (!open) return null;

  const body =
    (message && String(message).trim()) || MESSAGES.INTERVIEW_LIMIT_REACHED;
  const isPending = limitRequestStatus === "pending";
  const freeMockAvailable = Boolean(upgradePath) && (freeMockRemaining == null || freeMockRemaining > 0);

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

  const startFreeTeaserMock = () => {
    const id = String(selectedTeaserId || "").trim();
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

        {upgradePath ? (
          <div className="flex flex-col gap-3">
            {freeMockAvailable ? (
              <button
                type="button"
                onClick={() => setShowTeaserPicker(true)}
                className={`text-left rounded-xl border p-4 transition-colors ${
                  showTeaserPicker
                    ? "border-theme-accent bg-theme-hero/50"
                    : "border-theme bg-theme-hero/30 hover:bg-theme-hero/50"
                }`}
              >
                <p className="text-sm font-semibold text-theme-primary">
                  Take 1 free mock on a teaser company
                </p>
                <p className="mt-1 text-sm text-theme-secondary">
                  You have one free mock. Use it on the first company in any category.
                </p>
              </button>
            ) : (
              <p className="text-sm text-theme-muted leading-relaxed">
                Your free AI mock interview has already been used. Unlock unlimited mocks from the
                pricing page.
              </p>
            )}

            {showTeaserPicker && freeMockAvailable ? (
              <div className="rounded-xl border border-theme bg-theme-card p-4">
                <label
                  htmlFor="teaser-mock-company"
                  className="mb-1 block text-xs font-medium text-theme-secondary"
                >
                  Choose a teaser company
                </label>
                {teasersLoading ? (
                  <p className="text-sm text-theme-muted">Loading companies…</p>
                ) : teasersError && !teaserCompanies.length ? (
                  <p className="text-sm text-theme-muted">{teasersError}</p>
                ) : (
                  <select
                    id="teaser-mock-company"
                    className="w-full rounded-lg border border-theme bg-theme-card px-3 py-2 text-sm text-theme-primary"
                    value={selectedTeaserId}
                    onChange={(e) => setSelectedTeaserId(e.target.value)}
                  >
                    {teaserCompanies.map((company) => (
                      <option key={company._id} value={company._id}>
                        {company.name}
                        {company.categoryLabel ? ` (${company.categoryLabel})` : ""}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  type="button"
                  onClick={startFreeTeaserMock}
                  disabled={!selectedTeaserId || teasersLoading}
                  className="mt-3 w-full px-6 py-3 rounded-xl border border-theme-accent text-theme-accent text-base font-semibold transition-colors hover:bg-theme-hero disabled:opacity-60"
                >
                  Start free mock
                </button>
              </div>
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
