import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaThumbsUp } from "react-icons/fa";
import { companyAPI } from "../utils/api";
import { useAuth } from "../utils/AuthContext";

function CompanyCard({ company, onUpdate }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [helpfulCount, setHelpfulCount] = useState(company.helpfulCount || 0);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

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

  // Helper function to get company initials
  const getCompanyInitials = () => {
    if (!company.name) return 'XX';
    
    const words = company.name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return words[0].substring(0, 2).toUpperCase();
  };

  // Default logo image (SVG with company initials)
  const getDefaultLogo = () => {
    const initials = getCompanyInitials();
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' fill='%236366F1'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial, sans-serif' font-size='18' font-weight='bold' fill='white'%3E${encodeURIComponent(initials)}%3C/text%3E%3C/svg%3E`;
  };
  
  const defaultLogo = getDefaultLogo();

  const handleCardClick = () => {
    // Store that we're navigating from company cards view (user-specific)
    // The parent component (CompanyStats) will store the current state via useEffect cleanup
    const storageKey = user && user.userId ? `fromCompanyCards_${user.userId}` : 'fromCompanyCards';
    sessionStorage.setItem(storageKey, 'true');
    navigate(`/companies/${company._id}`);
  };

  const handleThumbsUp = async (e) => {
    e.stopPropagation(); // Prevent card click navigation
    
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
      className="rounded-2xl shadow-md p-6 cursor-pointer 
                 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 ease-in-out"
      style={{
        backgroundColor: '#1a1a1a',
        border: '2px solid #126FA6'
      }}
      data-testid="company-card"
    >
      {/* Company Logo/Header Section */}
      <div className="flex items-center gap-3 mb-4">
        {/* Company Logo */}
        <div 
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg shadow-md border-2 border-slate-700 flex-shrink-0 bg-slate-800 flex items-center justify-center overflow-hidden"
          data-testid="company-logo"
        >
          {company.logo && company.logo.trim() !== '' ? (
            <img
              src={company.logo}
              alt={company.name || "Company logo"}
              className="w-full h-full object-contain p-1"
              onError={(e) => {
                // Fallback to default logo if image fails to load
                e.target.src = defaultLogo;
              }}
            />
          ) : (
            <img
              src={defaultLogo}
              alt={company.name || "Company logo"}
              className="w-full h-full object-cover"
            />
          )}
        </div>
        {/* Company Name and Type */}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight truncate">
            {company.name}
          </h2>
          <p className="text-sm text-slate-400 italic truncate">{company.type}</p>
        </div>
      </div>

      <div className="mb-3">
        <span className="font-semibold text-slate-300">Date of interview: </span>
        <span className="text-slate-400">{company.date_of_visit}</span>
      </div>

      <div className="mb-3">
        <span className="font-semibold text-slate-300">Business Model: </span>
        <span className="text-slate-400">{company.business_model}</span>
      </div>

      <div className="mb-3">
        <span className="font-semibold text-slate-300">Eligibility: </span>
        <span className="text-slate-400">{company.eligibility}</span>
      </div>

      {/* Helpful Count Section */}
      <div className="mt-4 pt-3 border-t border-slate-700 flex items-center justify-between">
        <span className="text-sm text-slate-300">Was this helpful?</span>
        <button
          onClick={handleThumbsUp}
          disabled={isUpdating || hasUpvoted || isCheckingStatus}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm font-semibold ${
            hasUpvoted
              ? "bg-green-600 text-white cursor-not-allowed"
              : isUpdating || isCheckingStatus
              ? "bg-slate-700 text-slate-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700 text-white"
          }`}
          title={hasUpvoted ? "You have already upvoted this company" : "Mark as helpful"}
        >
          <FaThumbsUp className={`w-4 h-4 ${hasUpvoted ? "text-white" : "text-white"}`} />
          <span>{helpfulCount}</span>
        </button>
      </div>
      
    </div>
  );
}

export default CompanyCard;