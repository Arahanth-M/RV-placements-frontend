import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../utils/AuthContext";
import { companyAPI } from "../utils/api";
import CompanyLogo from "./CompanyLogo";

import GeneralTab from "./CompanyTabs/GeneralTab";
import OATab from "./CompanyTabs/OATab";
import CodingTab from "./CompanyTabs/CodingTab";
import InterviewTab from "./CompanyTabs/InterviewTab";
import MustDoTab from "./CompanyTabs/MustDoTab";
import VideoTab from "./CompanyTabs/VideoTab";
import CommentsTab from "./CompanyTabs/CommentsTab";
import OffCampusQuestionsTab from "./CompanyTabs/OffCampusQuestionsTab";

function CompanyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [company, setCompany] = useState(null);
  const [activeTab, setActiveTab] = useState("general");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(null); // 'offline' | 'error' | null
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setLoadError(null);
    setCompany(null);
    companyAPI
      .getCompany(id)
      .then((res) => {
        setCompany(res.data);
        setLoadError(null);
      })
      .catch((err) => {
        console.error("❌ Error fetching company details:", err);
        const isOffline =
          typeof navigator !== "undefined" && !navigator.onLine;
        const networkError =
          err.message === "Network Error" ||
          err.code === "ERR_NETWORK" ||
          (err.response == null && err.request != null);
        setLoadError(isOffline || networkError ? "offline" : "error");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleRefresh = () => {
    if (!id || isRefreshing) return;
    setIsRefreshing(true);
    companyAPI
      .refreshCompany(id)
      .then((res) => setCompany(res.data))
      .catch((err) => console.error("❌ Error refreshing company:", err))
      .finally(() => setIsRefreshing(false));
  };

  if (!id) return <div className="p-6 min-h-screen bg-theme-app"><p className="text-theme-secondary">Invalid company link.</p></div>;
  if (loading && !company) {
    return (
      <div className="p-4 sm:p-6 max-w-6xl mx-auto min-h-screen bg-theme-app">
        <div className="mb-4">
          <div className="shimmer-box h-5 w-20 rounded-md" />
        </div>

        <div className="bg-theme-card border border-theme rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-center gap-4">
            <div className="shimmer-box w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-lg flex-shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
              <div className="shimmer-box h-8 sm:h-10 w-56 max-w-full rounded-lg" />
              <div className="shimmer-box h-5 w-40 rounded-md" />
            </div>
          </div>
        </div>

        <div className="flex gap-2 sm:gap-4 mb-4 sm:mb-6 flex-wrap">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="shimmer-box h-10 w-24 sm:w-28 rounded-lg" />
          ))}
        </div>

        <div className="bg-theme-card border border-theme rounded-xl p-4 sm:p-6">
          <div className="space-y-4">
            <div className="shimmer-box h-6 w-48 rounded-md" />
            <div className="shimmer-box h-4 w-full rounded-md" />
            <div className="shimmer-box h-4 w-[92%] rounded-md" />
            <div className="shimmer-box h-4 w-[85%] rounded-md" />
            <div className="shimmer-box h-24 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }
  if (loadError === 'offline' && !company) {
    return (
      <div className="p-6 flex flex-col items-center justify-center text-center min-h-screen bg-theme-app">
        <p className="text-theme-primary font-medium mb-2">You are offline.</p>
        <p className="text-theme-secondary text-sm mb-4">This company is not available from cache. Please connect to the internet to view it.</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 rounded-lg bg-theme-card border border-theme back-link-theme transition-colors"
        >
          Go back
        </button>
      </div>
    );
  }
  if (loadError && !company) {
    return (
      <div className="p-6 flex flex-col items-center justify-center text-center min-h-screen bg-theme-app">
        <p className="text-theme-secondary mb-4">Could not load this company. Please try again.</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 rounded-lg bg-theme-card border border-theme back-link-theme hover:bg-theme-nav transition-colors"
        >
          Go back
        </button>
      </div>
    );
  }
  if (!company) return null;

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
      // Get the stored selectedYear (could be 2024, 2025, 2026, or null for year selection)
      const storedYear = sessionStorage.getItem(selectedYearKey);
      let yearToRestore = null;
      
      if (storedYear && storedYear !== '') {
        const parsedYear = parseInt(storedYear);
        if (!isNaN(parsedYear)) {
          yearToRestore = parsedYear;
        }
      }
      // If storedYear is empty string or null, yearToRestore stays null (year selection screen)
      
      // Navigate to company stats with the restored year (or null for year selection)
      navigate('/companystats', { state: { selectedYear: yearToRestore } });
      sessionStorage.removeItem(storageKey);
    } else {
      // Default back navigation
      navigate(-1);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto min-h-screen bg-theme-app">
      {/* Back Button */}
      <div className="mb-4 flex items-center justify-between gap-2 flex-wrap">
        <button
          onClick={handleBack}
          className="flex items-center back-link-theme text-sm sm:text-base transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>
      </div>
      
      <div className="bg-theme-card border border-theme rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex items-center gap-4">
          {/* Company Logo */}
          <div 
            className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-lg shadow-md border-2 border-theme flex-shrink-0 bg-theme-card flex items-center justify-center overflow-hidden"
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
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-theme-primary mb-2 break-words">
              {company.name}
            </h1>
            <p className="text-base sm:text-lg text-theme-secondary break-words">{company.type}</p>
          </div>
        </div>
      </div>
      <div className="flex gap-2 sm:gap-4 mb-4 sm:mb-6 flex-wrap overflow-x-auto pb-2">
        {["general", "oa", "coding", "interview", "mustdo", "comments"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`company-tab-btn px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold transition text-sm sm:text-base whitespace-nowrap ${
              activeTab === tab
                ? "company-tab-btn--active"
                : "bg-theme-card border border-theme text-theme-secondary"
            }`}
          >
            {tab === "general"
              ? "General"
              : tab === "oa"
              ? "OA Questions"
              : tab === "coding"
              ? "Coding"
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
            className={`company-tab-btn px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold transition text-sm sm:text-base whitespace-nowrap ${
              activeTab === "video"
                ? "company-tab-btn--active"
                : "bg-theme-card border border-theme text-theme-secondary"
            }`}
          >
            Video
          </button>
        )}
        {hasInterviewQuestions && (
          <button
            onClick={() => setActiveTab("offcampus")}
            className={`company-tab-btn px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold transition text-sm sm:text-base whitespace-nowrap ${
              activeTab === "offcampus"
                ? "company-tab-btn--active"
                : "bg-theme-card border border-theme text-theme-secondary"
            }`}
          >
            Off-Campus Questions
          </button>
        )}
      </div>
      <div className="company-tab-content">
        {activeTab === "general" && (
          <GeneralTab
            company={company}
            isAdmin={isAdmin}
            onRolesUpdated={handleRefresh}
          />
        )}
        {activeTab === "oa" && <OATab company={company} isAdmin={isAdmin} onCompanyUpdate={handleRefresh} />}
        {activeTab === "coding" && <CodingTab company={company} />}
        {activeTab === "interview" && <InterviewTab company={company} isAdmin={isAdmin} onCompanyUpdate={handleRefresh} />}
        {activeTab === "mustdo" && <MustDoTab company={company} />}
        {activeTab === "video" && <VideoTab videoUrl={company.videoUrl} />}
        {activeTab === "comments" && <CommentsTab company={company} />}
        {activeTab === "offcampus" && <OffCampusQuestionsTab company={company} />}
      </div>
    </div>
  );
}

export default CompanyDetails;
