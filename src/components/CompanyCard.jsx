import React, { useState, useEffect } from "react";
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
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
      className="rounded-2xl shadow-md p-6 cursor-pointer company-card h-full flex flex-col
                 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 ease-in-out bg-theme-card border-2 border-theme-accent"
      data-testid="company-card"
    >
      {/* Company Logo/Header Section */}
      <div className="company-header flex items-center gap-3 mb-4">
        {/* Company Logo */}
        <div 
          className="company-logo w-14 h-14 sm:w-16 sm:h-16 rounded-lg shadow-md border-2 border-theme flex-shrink-0 bg-theme-card flex items-center justify-center overflow-hidden"
          data-testid="company-logo"
        >
          <CompanyLogo
            company={company}
            className="w-full h-full object-contain p-1"
            alt={company.name || "Company logo"}
          />
        </div>
        {/* Company Name and Type */}
        <div className="flex-1 min-w-0">
          <h2 className="company-name text-xl sm:text-2xl font-extrabold text-theme-primary tracking-tight truncate">
            {company.name}
          </h2>
          <p className="company-role text-sm text-theme-secondary italic truncate">{company.type}</p>
        </div>
      </div>

      <div className="company-info mb-3">
        <span className="font-semibold text-theme-secondary">Date of interview: </span>
        <span className="text-theme-muted">{company.date_of_visit}</span>
      </div>

      <div className="company-info mb-3">
        <span className="font-semibold text-theme-secondary">Business Model: </span>
        <span className="text-theme-muted">{company.business_model}</span>
      </div>

      {/* Focus tags: DSA, CS Fundamentals, ML/AI based on interview process, questions & must-do topics */}
      {company.focusTags && company.focusTags.length > 0 && (
        <div className="mb-3">
          <span className="font-semibold text-theme-secondary block mb-1.5">Focus areas</span>
          <div className="flex flex-wrap gap-1.5">
            {company.focusTags.map((tag) => (
              <span
                key={tag}
                className="tag inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-theme-card border border-theme-accent text-theme-accent"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Helpful Count Section */}
      <div className="card-divider mt-4 pt-3 border-t border-theme" aria-hidden="true" />
      <div className="card-footer flex items-center justify-between flex-wrap gap-2 mt-auto pt-3">
        <div className="stats-label flex items-center gap-2">
          <button
            onClick={handleStatsClick}
            className="stats-btn flex items-center gap-2 px-3 py-1.5 rounded-lg bg-theme-card-hover hover:bg-theme-nav text-theme-primary text-sm font-semibold transition-colors"
            title="View stats"
          >
            <FaChartBar className="w-4 h-4" />
            <span>Stats</span>
          </button>
          <span className="text-sm text-theme-secondary">Was this helpful?</span>
        </div>
        <button
          onClick={handleThumbsUp}
          disabled={isUpdating || hasUpvoted || isCheckingStatus}
          className={`helpful-btn like-btn flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm font-semibold ${hasUpvoted ? 'helpful-btn--active active' : ''} ${
            hasUpvoted
              ? "bg-green-600 text-white cursor-not-allowed"
              : isUpdating || isCheckingStatus
              ? "bg-theme-card-hover text-theme-muted cursor-not-allowed"
              : "bg-theme-accent hover:bg-theme-accent text-white"
          }`}
          title={hasUpvoted ? "You have already upvoted this company" : "Mark as helpful"}
        >
          <FaThumbsUp className="w-4 h-4" />
          <span>{helpfulCount}</span>
        </button>
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