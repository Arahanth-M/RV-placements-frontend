import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaThumbsUp, FaTimes, FaEdit, FaCheck, FaMinus, FaPlus } from "react-icons/fa";
import { companyAPI } from "../utils/api";
import { useAuth } from "../utils/AuthContext";
import CompanyLogo from "./CompanyLogo";

const GOT_IN_DISPLAY_YEARS = [2026, 2027];

function normalizeTotalGotInByYear(company, fallbackYear = 2026) {
  const d = company?.totalGotInByYear;
  if (d && typeof d === "object") {
    return {
      2026: Number(d[2026]) || 0,
      2027: Number(d[2027]) || 0,
    };
  }
  const legacy = Number(company?.totalGotIn) || 0;
  return {
    2026: fallbackYear === 2026 ? legacy : 0,
    2027: fallbackYear === 2027 ? legacy : 0,
  };
}

function CompanyCard({
  company,
  onUpdate,
  isAdmin,
  onStatsUpdated,
  typeDisplayLabel,
  detailDefaultYear,
  placementYear,
  helpfulStatus,
  /** Summer internship list: hide placement + PPO “got in” counts on the card */
  hidePlacementGotInCounts = false,
}) {
  const COMPANY_DETAILS_RETURN_PATH_KEY = "companyDetailsReturnPath";
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [helpfulCount, setHelpfulCount] = useState(company.helpfulCount || 0);
  const [hasUpvoted, setHasUpvoted] = useState(helpfulStatus?.hasUpvoted === true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(Boolean(user) && !helpfulStatus);
  const hasPrefetchedRef = useRef(false);

  const cardPlacementYear =
    detailDefaultYear === 2026 || detailDefaultYear === 2027
      ? detailDefaultYear
      : placementYear === 2026 || placementYear === 2027
        ? placementYear
        : 2026;

  const [isEditingType, setIsEditingType] = useState(false);
  const [editTypeValue, setEditTypeValue] = useState("");
  const [isSavingType, setIsSavingType] = useState(false);
  const [totalGotInByYear, setTotalGotInByYear] = useState(() =>
    normalizeTotalGotInByYear(company, cardPlacementYear)
  );
  const [isUpdatingTotalGotIn, setIsUpdatingTotalGotIn] = useState(false);
  const [isEditingPpoConversion, setIsEditingPpoConversion] = useState(false);
  const [isSavingPpoConversion, setIsSavingPpoConversion] = useState(false);
  const [ppoConversionDraft, setPpoConversionDraft] = useState({
    gotIn: 0,
    converted: 0,
    conversionType: "",
  });

  // Update local state when company prop changes
  useEffect(() => {
    setHelpfulCount(company.helpfulCount || 0);
  }, [company.helpfulCount]);

  useEffect(() => {
    if (!user) {
      setHasUpvoted(false);
      setIsCheckingStatus(false);
      return;
    }
    if (!helpfulStatus) {
      setIsCheckingStatus(true);
      return;
    }
    setHasUpvoted(helpfulStatus.hasUpvoted === true);
    if (helpfulStatus.helpfulCount !== undefined) {
      setHelpfulCount(helpfulStatus.helpfulCount);
    }
    setIsCheckingStatus(false);
  }, [helpfulStatus, user]);

  useEffect(() => {
    setTotalGotInByYear(normalizeTotalGotInByYear(company, cardPlacementYear));
  }, [company.totalGotIn, company.totalGotInByYear, cardPlacementYear]);

  const companyDetailPath = (() => {
    const cid = company._id;
    if (detailDefaultYear === 2026 || detailDefaultYear === 2027) {
      return `/companies/${cid}?year=${detailDefaultYear}`;
    }
    return `/companies/${cid}`;
  })();

  const handleCardClick = () => {
    // Store that we're navigating from company cards view (user-specific)
    // The parent component (CompanyStats) will store the current state via useEffect cleanup
    const storageKey = user && user.userId ? `fromCompanyCards_${user.userId}` : 'fromCompanyCards';
    const currentPath = `${location.pathname || "/"}${location.search || ""}${location.hash || ""}`;
    sessionStorage.setItem(storageKey, 'true');
    sessionStorage.setItem(COMPANY_DETAILS_RETURN_PATH_KEY, currentPath);
    if (user?.userId) {
      sessionStorage.setItem(`${COMPANY_DETAILS_RETURN_PATH_KEY}_${user.userId}`, currentPath);
    }
    const navState =
      detailDefaultYear === 2026 || detailDefaultYear === 2027
        ? { defaultPlacementYear: detailDefaultYear }
        : undefined;
    navigate(companyDetailPath, { state: navState });
  };

  const handleViewDetailsClick = (e) => {
    e.stopPropagation();
    handleCardClick();
  };

  const prefetchDetails = () => {
    if (hasPrefetchedRef.current || !company?._id) return;
    hasPrefetchedRef.current = true;
    const prefetchOpts =
      detailDefaultYear === 2026 || detailDefaultYear === 2027
        ? { year: detailDefaultYear }
        : {};
    companyAPI.prefetchCompany(company._id, prefetchOpts);
  };

  const handleThumbsUp = async (e) => {
    e.stopPropagation(); // Prevent card click navigation // Prevent card click navigation
    
    if (isUpdating || hasUpvoted) return; // Prevent multiple clicks or if already upvoted
    
    if (!user) {
      alert("Please log in to upvote this company");
      return;
    }
    
    try {
      setIsUpdating(true);
      const response = await companyAPI.incrementHelpfulCount(company._id);
      setHelpfulCount(response.data.helpfulCount);
      setHasUpvoted(true);
      
      // Notify parent component to update the company list if callback provided
      if (onUpdate) {
        onUpdate(company._id, { helpfulCount: response.data.helpfulCount });
      }
    } catch (err) {
      console.error("Error updating helpful count:", err);
      if (err.response?.status === 400) {
        // User has already upvoted
        setHasUpvoted(true);
        if (err.response?.data?.helpfulCount !== undefined) {
          setHelpfulCount(err.response.data.helpfulCount);
        }
      } else if (err.response?.status === 401) {
        alert("Please log in to upvote this company");
      } else {
        alert("Failed to upvote. Please try again.");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const startEditType = (e) => {
    e.stopPropagation();
    setEditTypeValue(company.type || "");
    setIsEditingType(true);
  };

  const cancelEditType = (e) => {
    e.stopPropagation();
    setIsEditingType(false);
  };

  const saveType = async (e) => {
    e.stopPropagation();
    setIsSavingType(true);
    try {
      const { adminAPI } = await import("../utils/api");
      await adminAPI.updateCompanyGeneralInfo(company._id, { type: editTypeValue });
      if (onStatsUpdated) onStatsUpdated(company._id, { type: editTypeValue });
      setIsEditingType(false);
    } catch (err) {
      console.error(err);
      alert("Failed to update company type");
    } finally {
      setIsSavingType(false);
    }
  };

  const typeShown = typeDisplayLabel ?? company.type;
  const isPpoCard = String(typeShown || company.type || "")
    .toLowerCase()
    .includes("ppo");

  const ppoGotIn = Number(company.ppoConversionGotIn) || 0;
  const ppoConverted = Number(company.ppoConversionConverted) || 0;
  const ppoAcceptanceRate =
    ppoGotIn > 0
      ? Number(((ppoConverted / ppoGotIn) * 100).toFixed(2))
      : Number(company.ppoConversionAcceptanceRate) || 0;
  const ppoConversionType = String(company.ppoConversionType || "").trim();

  const visitDateStr =
    company.date_of_visit == null ? "" : String(company.date_of_visit).trim();
  const showDateOfVisit =
    visitDateStr.length > 0 && !/^(tba|tbd)$/i.test(visitDateStr);

  const adminGotInYear = cardPlacementYear;
  const adminYearGotIn = totalGotInByYear[adminGotInYear] ?? 0;

  const handleAdjustTotalGotIn = async (e, delta) => {
    e.stopPropagation();
    if (!isAdmin || isUpdatingTotalGotIn) return;

    try {
      setIsUpdatingTotalGotIn(true);
      const { adminAPI } = await import("../utils/api");
      const response = await adminAPI.adjustCompanyTotalGotIn(company._id, delta, {
        year: adminGotInYear,
      });
      const nextByYear =
        response.data?.totalGotInByYear != null &&
        typeof response.data.totalGotInByYear === "object"
          ? {
              2026: Number(response.data.totalGotInByYear[2026]) || 0,
              2027: Number(response.data.totalGotInByYear[2027]) || 0,
            }
          : {
              ...totalGotInByYear,
              [adminGotInYear]: response.data?.totalGotIn ?? 0,
            };
      setTotalGotInByYear(nextByYear);
      if (onStatsUpdated) {
        onStatsUpdated(company._id, {
          totalGotInByYear: nextByYear,
          totalGotIn: nextByYear[adminGotInYear],
        });
      }
    } catch (err) {
      console.error("Error updating total got in:", err);
      alert("Failed to update Got in count");
    } finally {
      setIsUpdatingTotalGotIn(false);
    }
  };

  const startEditPpoConversion = (e) => {
    e.stopPropagation();
    setPpoConversionDraft({
      gotIn: ppoGotIn,
      converted: ppoConverted,
      conversionType: ppoConversionType,
    });
    setIsEditingPpoConversion(true);
  };

  const cancelEditPpoConversion = (e) => {
    e.stopPropagation();
    setIsEditingPpoConversion(false);
  };

  const savePpoConversion = async (e) => {
    e.stopPropagation();
    if (!isAdmin || isSavingPpoConversion) return;
    const gotIn = hidePlacementGotInCounts
      ? Math.max(0, Number(ppoGotIn) || 0)
      : Math.max(0, Number(ppoConversionDraft.gotIn) || 0);
    const converted = Math.max(0, Number(ppoConversionDraft.converted) || 0);
    const acceptanceRate =
      gotIn > 0 ? Number(((converted / gotIn) * 100).toFixed(2)) : 0;

    try {
      setIsSavingPpoConversion(true);
      const { adminAPI } = await import("../utils/api");
      await adminAPI.updateCompanyStats(
        company._id,
        {
          ppoConversionGotIn: gotIn,
          ppoConversionConverted: converted,
          ppoConversionAcceptanceRate: acceptanceRate,
          ppoConversionType: ppoConversionDraft.conversionType || "",
        },
        { year: cardPlacementYear }
      );
      if (onStatsUpdated) {
        onStatsUpdated(company._id, {
          ppoConversionGotIn: gotIn,
          ppoConversionConverted: converted,
          ppoConversionAcceptanceRate: acceptanceRate,
          ppoConversionType: ppoConversionDraft.conversionType || "",
        });
      }
      setIsEditingPpoConversion(false);
    } catch (err) {
      console.error("Error updating PPO conversion stats:", err);
      alert("Failed to update PPO conversion stats");
    } finally {
      setIsSavingPpoConversion(false);
    }
  };

  return (
    <div
      className="rounded-2xl shadow-md p-5 sm:p-6 company-card h-full w-full min-w-0 max-w-full overflow-hidden flex flex-col bg-theme-card border-2 border-theme-accent transition-all duration-300 hover:shadow-2xl relative z-0 hover:z-10"
      data-testid="company-card"
    >
      {/* Top Section: Header + Logo */}
      <div className="company-header flex items-center gap-3 mb-4 flex-shrink-0">
        <div 
          className="company-logo w-14 h-14 sm:w-16 sm:h-16 rounded-xl shadow-sm border border-theme flex-shrink-0 bg-theme-card flex items-center justify-center overflow-hidden"
          data-testid="company-logo"
        >
          <CompanyLogo
            company={company}
            className="w-full h-full object-contain p-1.5"
            alt={company.name || "Company"}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="company-name text-lg sm:text-xl font-bold text-theme-primary tracking-tight truncate">
            {company.name || "Unknown Company"}
          </h2>
          <div className="flex items-center gap-2">
            {!isEditingType ? (
              <>
                <p className="company-role text-xs sm:text-sm text-theme-secondary italic truncate">
                  {typeShown || "Placement Drive"}
                </p>
                {isAdmin && (
                  <button onClick={startEditType} className="text-theme-muted hover:text-theme-accent transition-colors" aria-label="Edit type" title="Edit company type">
                    <FaEdit className="w-3.5 h-3.5" />
                  </button>
                )}
              </>
            ) : (
              <div className="flex items-center gap-1 w-full max-w-[220px]" onClick={(e) => e.stopPropagation()}>
                 <input
                    type="text"
                    value={editTypeValue}
                    onChange={(e) => setEditTypeValue(e.target.value)}
                    className="text-xs px-2 py-1 rounded bg-theme-input border border-theme-accent text-theme-primary w-full focus:outline-none focus:ring-1 focus:ring-theme-accent"
                    placeholder="e.g. fte, internship + fte"
                 />
                 <button onClick={saveType} disabled={isSavingType} className="text-green-500 hover:text-green-400 p-1 rounded bg-theme-card transition-colors disabled:opacity-50">
                    <FaCheck className="w-3.5 h-3.5" />
                 </button>
                 <button onClick={cancelEditType} disabled={isSavingType} className="text-red-500 hover:text-red-400 p-1 rounded bg-theme-card transition-colors disabled:opacity-50">
                    <FaTimes className="w-3.5 h-3.5" />
                 </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Middle Section: Main info - Flex grow to push footer down */}
      <div className="flex-1 flex flex-col min-w-0 gap-3">
        
        <div className="company-info flex flex-col gap-1 min-h-[3.5rem] flex-shrink-0">
          <span className="font-semibold text-theme-secondary text-sm">Business Model:</span>
          <span className="text-theme-muted text-xs sm:text-sm line-clamp-2 leading-relaxed break-words">
            {company.business_model || "Innovative solutions and high-quality services."}
          </span>
        </div>

        <div className="mt-1 flex flex-col gap-2 min-h-[4rem]">
          {company.focusTags && company.focusTags.length > 0 ? (
            <>
              <span className="font-semibold text-theme-secondary text-[10px] uppercase tracking-wider">Top focus areas</span>
              <div className="flex flex-wrap gap-1.5 line-clamp-2 overflow-hidden">
                {company.focusTags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="tag inline-flex items-center px-2 py-1 rounded-md text-[9px] font-bold bg-theme-accent bg-opacity-10 border border-theme-accent text-theme-accent uppercase tracking-tight whitespace-nowrap"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="h-full flex items-center">
              <span className="text-[10px] text-theme-muted italic uppercase tracking-widest">General placement prep</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section: Action + Footer */}
      <div className="mt-4 flex-shrink-0">
        <button
          onClick={handleViewDetailsClick}
          onMouseEnter={prefetchDetails}
          onTouchStart={prefetchDetails}
          className="full-details-btn w-full px-4 py-2.5 rounded-xl font-bold text-sm bg-theme-accent hover:brightness-110 text-white transition-all shadow-md active:scale-[0.98]"
        >
          View Full Details
        </button>

        <div className="card-divider my-4 border-t border-theme opacity-50" aria-hidden="true" />

        {/* {isPpoCard && (
          <div className="mb-4 rounded-xl border border-theme bg-theme-input p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-theme-secondary">
                Stats & conversion
              </span>
              {isAdmin && !isEditingPpoConversion && (
                <button
                  type="button"
                  onClick={startEditPpoConversion}
                  className="text-theme-muted hover:text-theme-accent transition-colors"
                  aria-label="Edit PPO conversion stats"
                  title="Edit PPO conversion stats"
                >
                  <FaEdit className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {!isEditingPpoConversion ? (
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs sm:text-sm text-theme-primary">
                {!hidePlacementGotInCounts ? (
                  <span>Got in: {ppoGotIn}</span>
                ) : null}
                <span>Converted: {ppoConverted}</span>
                <span>Acceptance: {ppoAcceptanceRate.toFixed(2)}%</span>
                <span className="truncate" title={ppoConversionType || "N/A"}>
                  Type: {ppoConversionType || "N/A"}
                </span>
              </div>
            ) : (
              <div
                className="space-y-2"
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className={`grid gap-2 ${hidePlacementGotInCounts ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2"}`}
                >
                  {!hidePlacementGotInCounts ? (
                    <input
                      type="number"
                      min="0"
                      value={ppoConversionDraft.gotIn}
                      onChange={(e) =>
                        setPpoConversionDraft((prev) => ({
                          ...prev,
                          gotIn: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-theme bg-theme-card px-2 py-1.5 text-xs text-theme-primary focus:outline-none focus:ring-1 focus:ring-theme-accent"
                      placeholder="Got in"
                    />
                  ) : null}
                  <input
                    type="number"
                    min="0"
                    value={ppoConversionDraft.converted}
                    onChange={(e) =>
                      setPpoConversionDraft((prev) => ({
                        ...prev,
                        converted: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-theme bg-theme-card px-2 py-1.5 text-xs text-theme-primary focus:outline-none focus:ring-1 focus:ring-theme-accent"
                    placeholder="Converted"
                  />
                </div>
                <input
                  type="text"
                  value={ppoConversionDraft.conversionType}
                  onChange={(e) =>
                    setPpoConversionDraft((prev) => ({
                      ...prev,
                      conversionType: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-theme bg-theme-card px-2 py-1.5 text-xs text-theme-primary focus:outline-none focus:ring-1 focus:ring-theme-accent"
                  placeholder="Type of conversion"
                />
                <p className="text-[11px] text-theme-secondary">
                  Acceptance rate:{" "}
                  {(() => {
                    const gotIn = Math.max(0, Number(ppoConversionDraft.gotIn) || 0);
                    const converted = Math.max(
                      0,
                      Number(ppoConversionDraft.converted) || 0
                    );
                    const rate =
                      gotIn > 0 ? Number(((converted / gotIn) * 100).toFixed(2)) : 0;
                    return `${rate.toFixed(2)}%`;
                  })()}
                </p>
                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={savePpoConversion}
                    disabled={isSavingPpoConversion}
                    className="text-green-500 hover:text-green-400 p-1 rounded transition-colors disabled:opacity-50"
                    aria-label="Save PPO conversion stats"
                    title="Save PPO conversion stats"
                  >
                    <FaCheck className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={cancelEditPpoConversion}
                    disabled={isSavingPpoConversion}
                    className="text-red-500 hover:text-red-400 p-1 rounded transition-colors disabled:opacity-50"
                    aria-label="Cancel PPO conversion stats edit"
                    title="Cancel PPO conversion stats edit"
                  >
                    <FaTimes className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )} */}

        <div
          className={`card-footer flex items-center gap-2 overflow-hidden ${
            hidePlacementGotInCounts ? "justify-end" : "justify-between"
          }`}
        >
          {!hidePlacementGotInCounts ? (
            <div className="flex items-center gap-2 shrink-0 min-w-0">
              <div className="text-xs sm:text-sm font-semibold text-theme-secondary min-w-0">
                <span className="block">Got in</span>
                {GOT_IN_DISPLAY_YEARS.map((y) => (
                  <span key={y} className="block text-theme-primary tabular-nums">
                    {y}: {totalGotInByYear[y] ?? 0}
                  </span>
                ))}
              </div>
              {isAdmin && (
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={(e) => handleAdjustTotalGotIn(e, -1)}
                    disabled={isUpdatingTotalGotIn || adminYearGotIn <= 0}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-theme bg-theme-input text-theme-primary transition-colors hover:bg-theme-nav disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Decrease got in count"
                    title="Decrease got in count"
                  >
                    <FaMinus className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleAdjustTotalGotIn(e, 1)}
                    disabled={isUpdatingTotalGotIn}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-theme bg-theme-input text-theme-primary transition-colors hover:bg-theme-nav disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Increase got in count"
                    title="Increase got in count"
                  >
                    <FaPlus className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          ) : null}

          <button
            onClick={handleThumbsUp}
            disabled={isUpdating || hasUpvoted || isCheckingStatus}
            className={`helpful-btn ${hasUpvoted ? "helpful-btn--active" : ""} group relative inline-flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition-all ${
              hasUpvoted
                ? "border-theme bg-theme-card-hover text-theme-secondary cursor-not-allowed opacity-90"
                : isUpdating || isCheckingStatus
                ? "border-theme bg-theme-card-hover text-theme-muted cursor-not-allowed"
                : "border-theme bg-theme-input text-theme-primary hover:-translate-y-[1px] hover:shadow-md hover:bg-theme-nav"
            }`}
            title={hasUpvoted ? "Already upvoted" : "Mark as helpful"}
            aria-label={`Helpful votes: ${helpfulCount}`}
          >
            <span
              className={`inline-flex h-7 w-7 items-center justify-center rounded-lg border border-theme bg-theme-card ${
                hasUpvoted ? "opacity-80" : ""
              }`}
              aria-hidden
            >
              <FaThumbsUp className={`w-3.5 h-3.5 ${isUpdating ? "animate-bounce" : ""}`} />
            </span>
            <span className="text-theme-secondary">Helpful</span>
            <span
              className={`min-w-[28px] rounded-md px-2 py-0.5 text-center text-[11px] font-bold border border-theme bg-theme-card text-theme-primary ${
                hasUpvoted ? "text-theme-secondary" : ""
              }`}
            >
              {helpfulCount}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default React.memo(CompanyCard);