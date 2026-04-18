import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaThumbsUp, FaTimes, FaEdit, FaCheck, FaMinus, FaPlus } from "react-icons/fa";
import { companyAPI } from "../utils/api";
import { useAuth } from "../utils/AuthContext";
import CompanyLogo from "./CompanyLogo";

function CompanyCard({ company, onUpdate, isAdmin, onStatsUpdated }) {
  const COMPANY_DETAILS_RETURN_PATH_KEY = "companyDetailsReturnPath";
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [helpfulCount, setHelpfulCount] = useState(company.helpfulCount || 0);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const hasPrefetchedRef = useRef(false);

  const [isEditingType, setIsEditingType] = useState(false);
  const [editTypeValue, setEditTypeValue] = useState("");
  const [isSavingType, setIsSavingType] = useState(false);
  const [totalGotIn, setTotalGotIn] = useState(company.totalGotIn ?? 0);
  const [isUpdatingTotalGotIn, setIsUpdatingTotalGotIn] = useState(false);

  // Update local state when company prop changes
  useEffect(() => {
    setHelpfulCount(company.helpfulCount || 0);
  }, [company.helpfulCount]);

  useEffect(() => {
    setTotalGotIn(company.totalGotIn ?? 0);
  }, [company.totalGotIn]);

  // Check if user has already upvoted this company
  useEffect(() => {
    const checkUpvoteStatus = async () => {
      if (!user) {
        setIsCheckingStatus(false);
        return;
      }

      try {
        const response = await companyAPI.getHelpfulStatus(company._id);
        setHasUpvoted(response.data.hasUpvoted || false);
        if (response.data.helpfulCount !== undefined) {
          setHelpfulCount(response.data.helpfulCount);
        }
      } catch (err) {
        console.error("Error checking upvote status:", err);
        // If user is not logged in, just set hasUpvoted to false
        setHasUpvoted(false);
      } finally {
        setIsCheckingStatus(false);
      }
    };

    checkUpvoteStatus();
  }, [company._id, user]);

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
    navigate(`/companies/${company._id}`);
  };

  const handleViewDetailsClick = (e) => {
    e.stopPropagation();
    handleCardClick();
  };

  const prefetchDetails = () => {
    if (hasPrefetchedRef.current || !company?._id) return;
    hasPrefetchedRef.current = true;
    companyAPI.prefetchCompany(company._id);
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
        onUpdate(company._id, response.data.helpfulCount);
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

  const handleAdjustTotalGotIn = async (e, delta) => {
    e.stopPropagation();
    if (!isAdmin || isUpdatingTotalGotIn) return;

    try {
      setIsUpdatingTotalGotIn(true);
      const { adminAPI } = await import("../utils/api");
      const response = await adminAPI.adjustCompanyTotalGotIn(company._id, delta);
      const updatedTotalGotIn = response.data?.totalGotIn ?? 0;
      setTotalGotIn(updatedTotalGotIn);
      if (onStatsUpdated) onStatsUpdated(company._id, { totalGotIn: updatedTotalGotIn });
    } catch (err) {
      console.error("Error updating total got in:", err);
      alert("Failed to update Got in count");
    } finally {
      setIsUpdatingTotalGotIn(false);
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
                  {company.type || "Placement Drive"}
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
        <div className="company-info text-sm flex-shrink-0 leading-relaxed break-words">
          <span className="font-semibold text-theme-secondary">Date of visit: </span>
          <span className="text-theme-muted">{company.date_of_visit || "TBA"}</span>
        </div>

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

        <div className="card-footer flex items-center justify-between gap-2 overflow-hidden">
          <div className="flex items-center gap-2 shrink-0">
            <p className="text-xs sm:text-sm font-semibold text-theme-secondary">
              Got in: <span className="text-theme-primary tabular-nums">{totalGotIn}</span>
            </p>
            {isAdmin && (
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={(e) => handleAdjustTotalGotIn(e, -1)}
                  disabled={isUpdatingTotalGotIn || totalGotIn <= 0}
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

export default CompanyCard;