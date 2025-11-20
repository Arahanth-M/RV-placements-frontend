import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { companyAPI } from "../utils/api";

function CompanyCard({ company, onRatingUpdate }) {
  const navigate = useNavigate();
  const [isRating, setIsRating] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);

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

  const handleCardClick = (e) => {
    // Don't navigate if clicking on stars
    if (e.target.closest('.star-rating')) {
      return;
    }
    // Store that we're navigating from company cards view
    sessionStorage.setItem('fromCompanyCards', 'true');
    navigate(`/companies/${company._id}`);
  };

  const handleStarClick = async (rating) => {
    if (isRating) return;
    
    setIsRating(true);
    try {
      console.log("⭐ Rating clicked:", rating, "for company:", company._id);
      const response = await companyAPI.rateDifficulty(company._id, rating);
      console.log("✅ Rating response:", response.data);
      // Update the company object with new rating
      if (onRatingUpdate) {
        onRatingUpdate(company._id, {
          interview_difficulty_level: response.data.interview_difficulty_level,
          difficulty_rating_count: response.data.difficulty_rating_count,
        });
      }
    } catch (error) {
      console.error("Error rating difficulty:", error);
      console.error("Error response:", error.response?.data);
      const errorMessage = error.response?.data?.error || 
                         error.response?.data?.message || 
                         error.response?.data?.details ||
                         error.message || 
                         "Failed to update rating. Please try again.";
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsRating(false);
      setHoveredStar(0);
    }
  };

  const getCurrentRating = () => {
    return company.interview_difficulty_level || 0;
  };

  const renderStars = () => {
    const rating = getCurrentRating();
    const stars = [];
    
    for (let i = 1; i <= 5; i++) {
      const isFilled = i <= Math.round(rating);
      const isHalfFilled = i - 0.5 <= rating && rating < i;
      const isHovered = hoveredStar >= i;
      
      stars.push(
        <button
          key={i}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleStarClick(i);
          }}
          onMouseEnter={() => setHoveredStar(i)}
          onMouseLeave={() => setHoveredStar(0)}
          disabled={isRating}
          className={`star-rating transition-all duration-150 ${
            isRating ? 'cursor-wait' : 'cursor-pointer hover:scale-110'
          }`}
          aria-label={`Rate ${i} out of 5 stars`}
        >
          <svg
            className={`w-5 h-5 ${
              isFilled || isHovered
                ? 'text-yellow-400 fill-current'
                : isHalfFilled
                ? 'text-yellow-400 fill-current opacity-50'
                : 'text-gray-300'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      );
    }
    
    return stars;
  };

  return (
    <div
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick(e);
        }
      }}
      className="bg-white border border-gray-200 rounded-2xl shadow-md p-6 cursor-pointer 
                 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 ease-in-out
                 hover:border-indigo-400"
      data-testid="company-card"
    >
      {/* Company Logo/Header Section */}
      <div className="flex items-center mb-4">
        <div 
          className="w-12 h-12 rounded-lg shadow-sm border border-gray-200 mr-3 bg-white flex items-center justify-center overflow-hidden"
          data-testid="company-logo"
        >
          {company.logo && company.logo.trim() !== '' ? (
            <img
              src={company.logo}
              alt={company.name || "Company logo"}
              className="w-full h-full object-cover"
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
        <div className="flex-1">
          <h2 className="text-xl font-extrabold text-gray-800 tracking-tight">
            {company.name}
          </h2>
          <p className="text-sm text-gray-500 italic">{company.type}</p>
        </div>
      </div>

      <div className="mb-3">
        <span className="font-semibold text-gray-700">Date of interview: </span>
        <span className="text-gray-600">{company.date_of_visit}</span>
      </div>

      <div className="mb-3">
        <span className="font-semibold text-gray-700">Business Model: </span>
        <span className="text-gray-600">{company.business_model}</span>
      </div>

      <div className="mb-3">
        <span className="font-semibold text-gray-700">Eligibility: </span>
        <span className="text-gray-600">{company.eligibility}</span>
      </div>

      {/* Interview Difficulty Rating */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-gray-700 text-sm">Interview Difficulty:</span>
          <div className="flex items-center gap-1">
            {renderStars()}
            {getCurrentRating() > 0 && (
              <span className="ml-2 text-sm text-gray-600">
                ({getCurrentRating().toFixed(1)})
              </span>
            )}
            {company.difficulty_rating_count > 0 && (
              <span className="ml-1 text-xs text-gray-500">
                ({company.difficulty_rating_count} {company.difficulty_rating_count === 1 ? 'rating' : 'ratings'})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* <div className="flex items-center gap-2 bg-gradient-to-r from-indigo-100 to-indigo-50 
                      rounded-lg px-3 py-2 w-fit">
        <span className="font-semibold text-indigo-600">Role:</span>
        <span className="text-gray-800">{company.roles[0]?.roleName}</span>
      </div> */}
      
    </div>
  );
}

export default CompanyCard;