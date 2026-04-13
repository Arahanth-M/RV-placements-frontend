import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../utils/AuthContext";
import { companyAPI } from "../utils/api";
import {
  companystatsTierListUrl,
  isPlacementTierParam,
} from "../constants/placementTiers.js";
import CompanyLogo from "./CompanyLogo";

import GeneralTab from "./CompanyTabs/GeneralTab";
import OATab from "./CompanyTabs/OATab";
import CodingTab from "./CompanyTabs/CodingTab";
import InterviewTab from "./CompanyTabs/InterviewTab";
import MustDoTab from "./CompanyTabs/MustDoTab";
import VideoTab from "./CompanyTabs/VideoTab";
import OffCampusQuestionsTab from "./CompanyTabs/OffCampusQuestionsTab";
import AIInterviewTab from "./CompanyTabs/AIInterviewTab";
import AiInterviewExploreButton from "./AiInterviewExploreButton";
import InternshipTab from "./CompanyTabs/InternshipTab";

function CompanyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin } = useAuth();
  const [company, setCompany] = useState(null);
  const [activeTab, setActiveTab] = useState("general");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(null); // 'offline' | 'error' | null
  const [loading, setLoading] = useState(true);
  const [isInterviewLocked, setIsInterviewLocked] = useState(false);
  const EXIT_WARNING_MESSAGE =
    "Progress will be lost and interview cannot be attended again. Are you sure you want to exit?";

  useEffect(() => {
    if (!id) return;
    if (user?.betaAccess === false) {
      setLoading(false);
      return;
    }
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
  }, [id, user?.betaAccess]);

  const openTabFromNav = location.state?.openTab;

  useEffect(() => {
    if (!company || !id) return;
    if (openTabFromNav !== "aiinterview") return;
    setActiveTab("aiinterview");
    navigate(`/companies/${id}`, { replace: true, state: {} });
  }, [company, id, openTabFromNav, navigate]);

  const handleRefresh = () => {
    if (!id || isRefreshing) return;
    if (user?.betaAccess === false) return;
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
      <div className="px-4 sm:px-6 pt-3 sm:pt-4 pb-4 sm:pb-6 max-w-6xl mx-auto min-h-screen bg-theme-app">
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
    if (isInterviewLocked) {
      const shouldExit = window.confirm(EXIT_WARNING_MESSAGE);
      if (!shouldExit) return;
      window.dispatchEvent(new Event("ai-interview-intentional-exit"));
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsInterviewLocked(false);
      setActiveTab("general");
      return;
    }

    // Check if we came from company cards view (user-specific)
    const storageKey = user && user.userId ? `fromCompanyCards_${user.userId}` : 'fromCompanyCards';
    const selectedYearKey = user && user.userId ? `companystats_selectedYear_${user.userId}` : 'companystats_selectedYear';
    
    const fromCompanyCards = sessionStorage.getItem(storageKey);
    if (fromCompanyCards === 'true') {
      const placementTierKey =
        user && user.userId
          ? `companystats_placement_tier_${user.userId}`
          : "companystats_placement_tier";
      const storedTier = sessionStorage.getItem(placementTierKey);

      if (isPlacementTierParam(storedTier)) {
        navigate(companystatsTierListUrl(storedTier));
        return;
      }

      const storedYear = sessionStorage.getItem(selectedYearKey);
      let yearToRestore = null;

      if (storedYear && storedYear !== "") {
        const parsedYear = parseInt(storedYear, 10);
        if (!Number.isNaN(parsedYear)) {
          yearToRestore = parsedYear;
        }
      }

      navigate("/companystats", { state: { selectedYear: yearToRestore } });
    } else {
      // Default back navigation
      navigate(-1);
    }
  };

  const handleTabChange = (nextTab) => {
    if (
      isInterviewLocked &&
      activeTab === "aiinterview" &&
      nextTab !== "aiinterview"
    ) {
      const shouldExit = window.confirm(EXIT_WARNING_MESSAGE);
      if (!shouldExit) return;
      window.dispatchEvent(new Event("ai-interview-intentional-exit"));
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsInterviewLocked(false);
    }

    setActiveTab(nextTab);
  };

  return (
    <>
    <div className="px-4 sm:px-6 pt-3 sm:pt-4 pb-4 sm:pb-6 max-w-6xl mx-auto min-h-screen bg-theme-app">
      {/* Back Button */}
      <div className="mb-4 flex items-center justify-between gap-2 flex-wrap">
        <button
          type="button"
          onClick={handleBack}
          className="back-nav-clear-sidebar flex items-center back-link-theme text-sm sm:text-base transition-colors"
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
        {["general", "oa", "coding", "interview", "internship", "mustdo"].map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
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
              : tab === "internship"
              ? "Internship Experience"
              : "Must Do Topics"}
          </button>
        ))}
        {company.videoUrl && (
          <button
            onClick={() => handleTabChange("video")}
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
            onClick={() => handleTabChange("offcampus")}
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
        {activeTab === "interview" && (
          <InterviewTab 
            company={company} 
            isAdmin={isAdmin} 
            onCompanyUpdate={handleRefresh} 
          />
        )}
        {activeTab === "internship" && <InternshipTab company={company} />}
        {activeTab === "aiinterview" && (
          <AIInterviewTab
            company={company}
            onInterviewLockChange={setIsInterviewLocked}
            onForceExitToGeneral={() => setActiveTab("general")}
          />
        )}
        {activeTab === "mustdo" && <MustDoTab company={company} />}
        {activeTab === "video" && <VideoTab videoUrl={company.videoUrl} />}
        {activeTab === "offcampus" && <OffCampusQuestionsTab company={company} />}
      </div>
    </div>

    {activeTab !== "aiinterview" && (
      <div
        className="ai-interview-explore-scope fixed z-[30] pointer-events-none flex flex-col items-end gap-2"
        style={{
          bottom: "max(1.25rem, env(safe-area-inset-bottom, 0px))",
          right: "max(1rem, env(safe-area-inset-right, 0px))",
        }}
      >
        <AiInterviewExploreButton
          className="pointer-events-auto shadow-lg"
          onClick={() => handleTabChange("aiinterview")}
        />
      </div>
    )}
    </>
  );
}

export default CompanyDetails;
