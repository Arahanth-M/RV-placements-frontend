import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaThumbsUp, FaTimes, FaEdit, FaCheck, FaMinus, FaPlus, FaEye, FaFire } from "react-icons/fa";
import { companyAPI } from "../utils/api";
import { useAuth } from "../utils/AuthContext";
import { adminMayMutateSharedCompanyContent } from "../utils/collegeScope.js";
import {
  PLACEMENT_TIER_DREAM,
  PLACEMENT_TIER_OPEN_DREAM,
  PLACEMENT_TIER_SUMMER_INTERNSHIP,
} from "../constants/placementTiers.js";
import { tenantPath } from "../constants/tenant.js";
import {
  DEFAULT_PLACEMENT_DETAIL_YEAR,
  PLACEMENT_DETAIL_VISIT_YEARS,
  isPlacementDetailVisitYear,
  normalizeTotalGotInByYear,
} from "../constants/placementYears.js";
import CompanyLogo from "./CompanyLogo";
import { formatExperienceMonth } from "../utils/parseExperienceStoredEntry.js";

const GOT_IN_DISPLAY_YEARS = [...PLACEMENT_DETAIL_VISIT_YEARS];

/** Shrinks focus-area pill text when it would overflow the card width. */
function FocusAreaTag({ tag }) {
  const ref = useRef(null);
  const [sizeLevel, setSizeLevel] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const row = el.parentElement;
    if (!row) return;

    const resolveSize = () => {
      let level = 0;
      for (; level <= 2; level += 1) {
        el.classList.remove("tag--s0", "tag--s1", "tag--s2");
        el.classList.add(`tag--s${level}`);
        if (el.scrollWidth <= el.clientWidth + 1) break;
      }
      setSizeLevel(Math.min(level, 2));
    };

    resolveSize();
    const observer = new ResizeObserver(resolveSize);
    observer.observe(row);
    return () => observer.disconnect();
  }, [tag]);

  return (
    <span
      ref={ref}
      className={`tag tag--s${sizeLevel} inline-flex max-w-full items-center rounded-md font-bold bg-theme-accent bg-opacity-10 border border-theme-accent text-theme-accent uppercase tracking-tight whitespace-normal break-words`}
    >
      {tag}
    </span>
  );
}

function CompanyCard({
  company,
  onUpdate,
  isAdmin,
  onStatsUpdated,
  typeDisplayLabel,
  /** Dream/Open dream: true when this year has no on-campus FTE-tier visit (category no-visit copy). */
  typePlacementLabelPending = false,
  detailDefaultYear,
  placementYear,
  helpfulStatus,
  /** Dream / open dream / internship-only / off-campus / summer internship: hide placement “got in” on the card (shown on Stats tab by year). */
  hidePlacementGotInCounts = false,
  /** Dream / Open dream / Summer internship lists — drives detail-page subtitle framing */
  placementListContext,
  /** Hub cluster (cs|ec|me|chem) — scopes GET /companies/:id when multiple visits share year/type */
  placementCluster,
}) {
  const COMPANY_DETAILS_RETURN_PATH_KEY = "companyDetailsReturnPath";
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const canEditProgramGotIn = adminMayMutateSharedCompanyContent(user, isAdmin);
  const [helpfulCount, setHelpfulCount] = useState(company.helpfulCount || 0);
  const [hasUpvoted, setHasUpvoted] = useState(helpfulStatus?.hasUpvoted === true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(Boolean(user) && !helpfulStatus);
  const hasPrefetchedRef = useRef(false);

  const cardPlacementYear = isPlacementDetailVisitYear(detailDefaultYear)
    ? detailDefaultYear
    : isPlacementDetailVisitYear(placementYear)
      ? placementYear
      : DEFAULT_PLACEMENT_DETAIL_YEAR;

  const [isEditingType, setIsEditingType] = useState(false);
  const [editTypeValue, setEditTypeValue] = useState("");
  const [isSavingType, setIsSavingType] = useState(false);
  const [totalGotInByYear, setTotalGotInByYear] = useState(() =>
    normalizeTotalGotInByYear(company, cardPlacementYear)
  );
  const [isUpdatingTotalGotIn, setIsUpdatingTotalGotIn] = useState(false);
  const viewCount = Math.max(0, Number(company.views) || 0);
  const lastUpdatedMonth = formatExperienceMonth(company.contentUpdatedAt || company.createdAt);
  const isTrending = company.trending === true;

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

  /**
   * Summer cards show a fixed Internship(PPO) label, but `placementCompanyVisitId` on the list row
   * is the first visit in that cluster/year (often Internship+FTE). Passing that hint forces the
   * wrong merge on detail — same as CS when only one slot exists. Omit the hint so GET /companies/:id
   * uses `placementContext=summer_internship` + cluster/year to pick the strict PPO row.
   */
  const shouldSendPlacementVisitIdHint =
    placementListContext !== PLACEMENT_TIER_SUMMER_INTERNSHIP;

  const companyDetailPath = (() => {
    const cid = company._id;
    const params = new URLSearchParams();
    if (isPlacementDetailVisitYear(detailDefaultYear)) {
      params.set("year", String(detailDefaultYear));
    }
    if (placementListContext) {
      params.set("placementContext", placementListContext);
    }
    if (shouldSendPlacementVisitIdHint && company?.placementCompanyVisitId) {
      params.set("placementCompanyVisitId", String(company.placementCompanyVisitId));
    }
    if (typeof placementCluster === "string" && placementCluster.trim() !== "") {
      params.set("placementCluster", placementCluster.trim().toLowerCase());
    }
    const q = params.toString();
    return q ? tenantPath(`/companies/${cid}?${q}`) : tenantPath(`/companies/${cid}`);
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
    if (company._id) {
      if (placementListContext) {
        sessionStorage.setItem(
          `company_detail_placement_ctx:${company._id}`,
          placementListContext
        );
      } else {
        sessionStorage.removeItem(`company_detail_placement_ctx:${company._id}`);
      }
    }
    const navState = isPlacementDetailVisitYear(detailDefaultYear)
      ? {
          defaultPlacementYear: detailDefaultYear,
          ...(placementListContext ? { placementListContext } : {}),
        }
      : placementListContext
        ? { placementListContext }
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
    const prefetchOpts = {};
    if (isPlacementDetailVisitYear(detailDefaultYear)) {
      prefetchOpts.year = detailDefaultYear;
    }
    if (placementListContext) {
      prefetchOpts.placementContext = placementListContext;
    }
    if (shouldSendPlacementVisitIdHint && company?.placementCompanyVisitId) {
      prefetchOpts.placementCompanyVisitId = company.placementCompanyVisitId;
    }
    if (
      typeof placementCluster === "string" &&
      placementCluster.trim() !== ""
    ) {
      prefetchOpts.placementCluster = placementCluster.trim();
    }
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
      const { adminAPI, adminCompanyVisitOpts } = await import("../utils/api");
      await adminAPI.updateCompanyGeneralInfo(
        company._id,
        { type: editTypeValue },
        adminCompanyVisitOpts({
          placementYear: cardPlacementYear,
          placementListContext,
          placementCompanyVisitId: shouldSendPlacementVisitIdHint
            ? company.placementCompanyVisitId
            : undefined,
          placementCluster,
        })
      );
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

  /** Dream / Open dream / Summer: category no-visit copy omits company-static teaser rows (business model, tags). */
  const tierPendingOmitsPlacementTeasers =
    typePlacementLabelPending &&
    (placementListContext === PLACEMENT_TIER_SUMMER_INTERNSHIP ||
      placementListContext === PLACEMENT_TIER_DREAM ||
      placementListContext === PLACEMENT_TIER_OPEN_DREAM);

  const adminGotInYear = cardPlacementYear;
  const adminYearGotIn = totalGotInByYear[adminGotInYear] ?? 0;

  const handleAdjustTotalGotIn = async (e, delta) => {
    e.stopPropagation();
    if (!canEditProgramGotIn || isUpdatingTotalGotIn) return;

    try {
      setIsUpdatingTotalGotIn(true);
      const { adminAPI, adminCompanyVisitOpts } = await import("../utils/api");
      const response = await adminAPI.adjustCompanyTotalGotIn(
        company._id,
        delta,
        adminCompanyVisitOpts({
          placementYear: adminGotInYear,
          placementListContext,
          placementCompanyVisitId: shouldSendPlacementVisitIdHint
            ? company.placementCompanyVisitId
            : undefined,
        })
      );
      const nextByYear =
        response.data?.totalGotInByYear != null &&
        typeof response.data.totalGotInByYear === "object"
          ? Object.fromEntries(
              PLACEMENT_DETAIL_VISIT_YEARS.map((y) => [
                y,
                Number(response.data.totalGotInByYear[y]) || 0,
              ])
            )
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

  return (
    <div
      className={`relative rounded-2xl shadow-md p-5 sm:p-6 company-card h-full w-full min-w-0 max-w-full overflow-hidden flex flex-col bg-theme-card border-2 transition-[box-shadow,border-color] duration-300 hover:shadow-2xl ${
        isTrending
          ? "company-card--trending border-amber-400/70"
          : "border-theme-accent"
      }`}
      data-testid="company-card"
    >
      {isTrending ? (
        <div className="absolute right-3 top-3 z-[2] flex max-w-[48%] flex-col items-end">
          <span
            className="inline-flex items-center gap-1 rounded-full border border-amber-400/50 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-300"
            title={
              company.trendingReason === "admin"
                ? "Marked trending by admin for 24 hours"
                : "Views are rising quickly"
            }
          >
            <FaFire className="h-3 w-3" aria-hidden />
            Trending
          </span>
        </div>
      ) : null}

      {/* Top Section: Header + Logo */}
      <div
        className={`company-header mb-4 flex flex-shrink-0 items-center gap-3 ${
          isTrending ? "pr-24" : ""
        }`}
      >
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
                <p
                  className={`company-role text-xs sm:text-sm italic truncate ${
                    typePlacementLabelPending ? "text-theme-muted" : "text-theme-secondary"
                  }`}
                >
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
        {tierPendingOmitsPlacementTeasers ? (
          <div
            className="flex flex-1 min-h-[7.5rem] rounded-xl border border-dashed border-theme/45 bg-theme-input/15"
            aria-hidden
          />
        ) : (
          <>
            <div className="company-info flex flex-col gap-1 min-h-[3.5rem] flex-shrink-0" data-tour="company-card-business-model">
              <span className="font-semibold text-theme-secondary text-sm">Business Model:</span>
              <span className="text-theme-muted text-xs sm:text-sm line-clamp-2 leading-relaxed break-words">
                {company.business_model || "Innovative solutions and high-quality services."}
              </span>
            </div>

            <div className="mt-1 flex flex-col gap-2 min-h-[4rem]" data-tour="company-card-focus-areas">
              {company.focusTags && company.focusTags.length > 0 ? (
                <>
                  <span className="font-semibold text-theme-secondary text-[10px] uppercase tracking-wider">
                    Top focus areas
                  </span>
                  <div className="flex flex-wrap gap-1.5 min-w-0 w-full">
                    {company.focusTags.slice(0, 3).map((tag) => (
                      <FocusAreaTag key={tag} tag={tag} />
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center">
                  <span className="text-[10px] text-theme-muted italic uppercase tracking-widest">
                    General placement prep
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Bottom Section: Action + Footer */}
      <div className="mt-4 flex-shrink-0">
        <button
          onClick={handleViewDetailsClick}
          onMouseEnter={prefetchDetails}
          onTouchStart={prefetchDetails}
          className="full-details-btn w-full px-4 py-2.5 rounded-xl font-bold text-sm bg-theme-accent hover:brightness-110 text-white transition-colors shadow-md"
        >
          View Full Details
        </button>

        <div className="card-divider my-4 border-t border-theme opacity-50" aria-hidden="true" />

        <div className="card-footer flex items-end justify-between gap-2 overflow-hidden">
          {!hidePlacementGotInCounts || lastUpdatedMonth || isAdmin ? (
            <div className="card-footer-left flex min-w-0 flex-1 flex-col items-start justify-end gap-1">
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
                  {canEditProgramGotIn && (
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
              {lastUpdatedMonth ? (
                <p className="card-last-updated min-w-0 whitespace-nowrap text-left text-[10px] font-medium leading-tight text-theme-muted sm:text-[11px]">
                  Last updated on: {lastUpdatedMonth}
                </p>
              ) : null}
              {isAdmin ? (
                <span
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-theme bg-theme-input px-2.5 py-1.5 text-xs font-semibold text-theme-secondary"
                  title={`${viewCount.toLocaleString("en-IN")} profile views`}
                  aria-label={`${viewCount} views`}
                >
                  <span
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-theme bg-theme-card"
                    aria-hidden
                  >
                    <FaEye className="h-3.5 w-3.5" />
                  </span>
                  <span>Views</span>
                  <span className="min-w-[28px] rounded-md border border-theme bg-theme-card px-2 py-0.5 text-center text-[11px] font-bold tabular-nums text-theme-primary">
                    {viewCount.toLocaleString("en-IN")}
                  </span>
                </span>
              ) : null}
            </div>
          ) : null}

          <div className="card-footer-actions ml-auto flex shrink-0 items-center justify-end gap-2">
            <button
              onClick={handleThumbsUp}
              disabled={isUpdating || hasUpvoted || isCheckingStatus}
              data-tour="company-card-helpful"
              className={`helpful-btn ${hasUpvoted ? "helpful-btn--active" : ""} group relative inline-flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition-[box-shadow,background-color,border-color,color] ${
                hasUpvoted
                  ? "border-theme bg-theme-card-hover text-theme-secondary cursor-not-allowed opacity-90"
                  : isUpdating || isCheckingStatus
                  ? "border-theme bg-theme-card-hover text-theme-muted cursor-not-allowed"
                  : "border-theme bg-theme-input text-theme-primary hover:shadow-md hover:bg-theme-nav"
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
    </div>
  );
}

export default React.memo(CompanyCard);