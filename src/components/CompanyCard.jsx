import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaThumbsUp, FaChartBar, FaTimes } from "react-icons/fa";
import { companyAPI } from "../utils/api";
import { useAuth } from "../utils/AuthContext";
import CompanyLogo from "./CompanyLogo";

function CompanyCard({ company, onUpdate, isAdmin, onStatsUpdated }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [helpfulCount, setHelpfulCount] = useState(company.helpfulCount || 0);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [editingStats, setEditingStats] = useState(false);
  const [editApplied, setEditApplied] = useState("");
  const [editClearedOA, setEditClearedOA] = useState("");
  const [editGotIn, setEditGotIn] = useState("");
  const [statsSaving, setStatsSaving] = useState(false);
  const hasPrefetchedRef = useRef(false);

  // Update local state when company prop changes
  useEffect(() => {
    setHelpfulCount(company.helpfulCount || 0);
  }, [company.helpfulCount]);

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
    sessionStorage.setItem(storageKey, 'true');
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

  const handleStatsClick = (e) => {
    e.stopPropagation();
    setShowStatsModal(true);
  };

  const applied = company.totalStudentsApplied ?? 0;
  const clearedOA = company.totalClearedOA ?? 0;
  const gotIn = company.totalGotIn ?? 0;

  const startEditStats = () => {
    setEditApplied(String(applied));
    setEditClearedOA(String(clearedOA));
    setEditGotIn(String(gotIn));
    setEditingStats(true);
  };

  const cancelEditStats = () => {
    setEditingStats(false);
    setEditApplied("");
    setEditClearedOA("");
    setEditGotIn("");
  };

  const saveStats = async (e) => {
    e.preventDefault();
    const a = parseInt(editApplied, 10);
    const o = parseInt(editClearedOA, 10);
    const g = parseInt(editGotIn, 10);
    if (isNaN(a) || a < 0 || isNaN(o) || o < 0 || isNaN(g) || g < 0) {
      alert("Please enter valid non-negative numbers.");
      return;
    }
    setStatsSaving(true);
    try {
      const { adminAPI } = await import("../utils/api");
      await adminAPI.updateCompanyStats(company._id, { totalStudentsApplied: a, totalClearedOA: o, totalGotIn: g });
      if (onStatsUpdated) onStatsUpdated();
      setEditingStats(false);
      setEditApplied("");
      setEditClearedOA("");
      setEditGotIn("");
      setShowStatsModal(false);
    } catch (err) {
      console.error(err);
      alert("Failed to update stats.");
    } finally {
      setStatsSaving(false);
    }
  };

  return (
    <div
      className="rounded-2xl shadow-md p-5 sm:p-6 company-card h-full flex flex-col bg-theme-card border-2 border-theme-accent transition-all duration-300 hover:shadow-2xl hover:scale-[1.05] relative z-0 hover:z-10"
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
          <p className="company-role text-xs sm:text-sm text-theme-secondary italic truncate">
            {company.type || "Placement Drive"}
          </p>
        </div>
      </div>

      {/* Middle Section: Main info - Flex grow to push footer down */}
      <div className="flex-1 flex flex-col min-w-0 gap-3">
        <div className="company-info text-sm line-clamp-1 flex-shrink-0">
          <span className="font-semibold text-theme-secondary">Date of visit: </span>
          <span className="text-theme-muted">{company.date_of_visit || "TBA"}</span>
        </div>

        <div className="company-info flex flex-col gap-1 min-h-[3.5rem] flex-shrink-0">
          <span className="font-semibold text-theme-secondary text-sm">Business Model:</span>
          <span className="text-theme-muted text-xs sm:text-sm line-clamp-2 leading-relaxed">
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
          <button
            onClick={handleStatsClick}
            className="stats-btn flex items-center gap-2 px-3 py-1.5 rounded-lg bg-theme-card-hover hover:bg-theme-nav text-theme-primary text-xs font-bold transition-all border border-theme"
            title="View statistics"
          >
            <FaChartBar className="w-3.5 h-3.5" />
            <span>Stats</span>
          </button>
          
          <button
            onClick={handleThumbsUp}
            disabled={isUpdating || hasUpvoted || isCheckingStatus}
            className={`helpful-btn flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-xs font-bold ${
              hasUpvoted
                ? "bg-green-500 text-white cursor-not-allowed shadow-inner"
                : isUpdating || isCheckingStatus
                ? "bg-theme-card-hover text-theme-muted cursor-not-allowed"
                : "bg-theme-accent hover:brightness-110 text-white shadow-sm"
            }`}
            title={hasUpvoted ? "Already upvoted" : "Mark as helpful"}
          >
            <FaThumbsUp className={`w-3.5 h-3.5 ${isUpdating ? 'animate-bounce' : ''}`} />
            <span>{helpfulCount}</span>
          </button>
        </div>
      </div>

      {/* Stats modal */}
      {showStatsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => { e.stopPropagation(); setShowStatsModal(false); setEditingStats(false); }}
        >
          <div
            className="bg-theme-card border border-theme rounded-xl shadow-xl max-w-sm w-full p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-theme-primary">Placement Stats</h3>
              <button
                onClick={() => setShowStatsModal(false)}
                className="p-1 rounded text-theme-secondary hover:text-theme-primary hover:bg-theme-nav"
                aria-label="Close"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-theme-secondary mb-4">{company.name}</p>

            {!editingStats ? (
              <>
                <ul className="space-y-3">
                  <li className="flex justify-between items-center py-2 border-b border-theme">
                    <span className="text-theme-secondary">Total students applied</span>
                    <span className="font-semibold text-theme-primary">{applied}</span>
                  </li>
                  <li className="flex justify-between items-center py-2 border-b border-theme">
                    <span className="text-theme-secondary">Cleared OA</span>
                    <span className="font-semibold text-theme-primary">{clearedOA}</span>
                  </li>
                  <li className="flex justify-between items-center py-2">
                    <span className="text-theme-secondary">Got in</span>
                    <span className="font-semibold text-theme-primary">{gotIn}</span>
                  </li>
                </ul>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={startEditStats}
                    className="mt-4 w-full py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold"
                  >
                    Edit stats
                  </button>
                )}
              </>
            ) : (
              <form onSubmit={saveStats} className="space-y-3">
                <label className="block">
                  <span className="text-theme-secondary text-sm">Total students applied</span>
                  <input
                    type="number"
                    min={0}
                    value={editApplied}
                    onChange={(e) => setEditApplied(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg bg-theme-input border border-theme-input text-theme-primary"
                  />
                </label>
                <label className="block">
                  <span className="text-theme-secondary text-sm">Cleared OA</span>
                  <input
                    type="number"
                    min={0}
                    value={editClearedOA}
                    onChange={(e) => setEditClearedOA(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg bg-theme-input border border-theme-input text-theme-primary"
                  />
                </label>
                <label className="block">
                  <span className="text-theme-secondary text-sm">Got in</span>
                  <input
                    type="number"
                    min={0}
                    value={editGotIn}
                    onChange={(e) => setEditGotIn(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg bg-theme-input border border-theme-input text-theme-primary"
                  />
                </label>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={cancelEditStats} className="flex-1 py-2 rounded-lg border border-theme text-theme-secondary hover:bg-theme-nav">
                    Cancel
                  </button>
                  <button type="submit" disabled={statsSaving} className="flex-1 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold disabled:opacity-50">
                    {statsSaving ? "Saving…" : "Save"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CompanyCard;