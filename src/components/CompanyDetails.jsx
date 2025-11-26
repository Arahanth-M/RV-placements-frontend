import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { useAuth } from "../utils/AuthContext";

import GeneralTab from "./CompanyTabs/GeneralTab";
import OATab from "./CompanyTabs/OATab";
import InterviewTab from "./CompanyTabs/InterviewTab";
import MustDoTab from "./CompanyTabs/MustDoTab";
import VideoTab from "./CompanyTabs/VideoTab";
import CommentsTab from "./CompanyTabs/CommentsTab";
import OffCampusQuestionsTab from "./CompanyTabs/OffCampusQuestionsTab";

function CompanyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [company, setCompany] = useState(null);
  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    axios
      .get(BASE_URL + `/api/companies/${id}`, { withCredentials: true })
      .then((res) => setCompany(res.data))
      .catch((err) =>
        console.error("❌ Error fetching company details:", err)
      );
  }, [id]);

  if (!company) return <p className="p-6 text-gray-600">Loading...</p>;

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

  // Check if company has interview_questions
  const hasInterviewQuestions = company.interview_questions && 
    Array.isArray(company.interview_questions) && 
    company.interview_questions.length > 0 &&
    company.interview_questions.some(item => {
      if (typeof item === "string") return item.trim().length > 0;
      return item && (item.question || (typeof item === "object" && Object.keys(item).length > 0));
    });

  const handleBack = () => {
    // Check if we came from company cards view (user-specific)
    const storageKey = user && user.userId ? `fromCompanyCards_${user.userId}` : 'fromCompanyCards';
    const selectedYearKey = user && user.userId ? `companystats_selectedYear_${user.userId}` : 'companystats_selectedYear';
    
    const fromCompanyCards = sessionStorage.getItem(storageKey);
    if (fromCompanyCards === 'true') {
      // Navigate to company stats with year 2026 to show company cards
      sessionStorage.setItem(selectedYearKey, '2026');
      navigate('/companystats', { state: { selectedYear: 2026 } });
      sessionStorage.removeItem(storageKey);
    } else {
      // Default back navigation
      navigate(-1);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="mb-4 flex items-center text-gray-600 hover:text-gray-800 font-medium text-sm sm:text-base transition-colors"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back
      </button>
      
      <div className="bg-white shadow-md rounded-lg p-4 sm:p-6 border mb-4 sm:mb-6">
        <div className="flex items-center gap-4">
          {/* Company Logo */}
          <div 
            className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-lg shadow-md border-2 border-gray-200 flex-shrink-0 bg-white flex items-center justify-center overflow-hidden"
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
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-blue-900 mb-2 break-words">
              {company.name}
            </h1>
            <p className="text-base sm:text-lg text-gray-700 break-words">{company.type}</p>
          </div>
        </div>
      </div>
      <div className="flex gap-2 sm:gap-4 mb-4 sm:mb-6 flex-wrap overflow-x-auto pb-2">
        {["general", "oa", "interview", "mustdo", "comments"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold transition text-sm sm:text-base whitespace-nowrap ${
              activeTab === tab
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {tab === "general"
              ? "General"
              : tab === "oa"
              ? "OA Questions"
              : tab === "interview"
              ? "Interview Experience"
              : tab === "mustdo"
              ? "Must Do Topics"
              : "Comments"}
          </button>
        ))}
        {company.videoUrl && (
          <button
            onClick={() => setActiveTab("video")}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold transition text-sm sm:text-base whitespace-nowrap ${
              activeTab === "video"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Video
          </button>
        )}
        {hasInterviewQuestions && (
          <button
            onClick={() => setActiveTab("offcampus")}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold transition text-sm sm:text-base whitespace-nowrap ${
              activeTab === "offcampus"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Off-Campus Questions
          </button>
        )}
      </div>
      {activeTab === "general" && <GeneralTab company={company} />}
      {activeTab === "oa" && <OATab company={company} />}
      {activeTab === "interview" && <InterviewTab company={company} />}
      {activeTab === "mustdo" && <MustDoTab company={company} />}
      {activeTab === "video" && <VideoTab videoUrl={company.videoUrl} />}
      {activeTab === "comments" && <CommentsTab company={company} />}
      {activeTab === "offcampus" && <OffCampusQuestionsTab company={company} />}
    </div>
  );
}

export default CompanyDetails;
