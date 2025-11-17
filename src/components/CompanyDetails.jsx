import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { companyAPI } from "../utils/api";

import GeneralTab from "./CompanyTabs/GeneralTab";
import OATab from "./CompanyTabs/OATab";
import InterviewTab from "./CompanyTabs/InterviewTab";
import MustDoTab from "./CompanyTabs/MustDoTab";
import VideoTab from "./CompanyTabs/VideoTab";
import CommentsTab from "./CompanyTabs/CommentsTab";

function CompanyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [activeTab, setActiveTab] = useState("general");
  const [showKnowMoreModal, setShowKnowMoreModal] = useState(false);
  const [knowMoreData, setKnowMoreData] = useState(null);
  const [knowMoreLoading, setKnowMoreLoading] = useState(false);
  const [knowMoreError, setKnowMoreError] = useState(null);
  const [hasKnowMoreData, setHasKnowMoreData] = useState(false);

  useEffect(() => {
    axios
      .get(BASE_URL + `/api/companies/${id}`, { withCredentials: true })
      .then((res) => setCompany(res.data))
      .catch((err) =>
        console.error("❌ Error fetching company details:", err)
      );
  }, [id]);

  const handleKnowMore = async () => {
    if (!company?.name) return;
    
    setKnowMoreLoading(true);
    setKnowMoreError(null);
    setShowKnowMoreModal(true);
    setHasKnowMoreData(false);
    
    try {
      const response = await companyAPI.sendKnowMore(company.name);
      // Extract data from response (response is an array, get first element's data)
      const responseData = Array.isArray(response.data) ? response.data[0] : response.data;
      const extractedData = responseData?.data || responseData;
      setKnowMoreData(extractedData);
      setHasKnowMoreData(true);
    } catch (error) {
      console.error("❌ Failed to fetch Know More:", error);
      setKnowMoreError(error.response?.data?.error || error.message || "Failed to fetch company information");
    } finally {
      setKnowMoreLoading(false);
    }
  };

  if (!company) return <p className="p-6 text-gray-600">Loading...</p>;

  const handleBack = () => {
    // Check if we came from company cards view
    const fromCompanyCards = sessionStorage.getItem('fromCompanyCards');
    if (fromCompanyCards === 'true') {
      // Navigate to company stats with year 2026 to show company cards
      sessionStorage.setItem('companystats_selectedYear', '2026');
      navigate('/companystats', { state: { selectedYear: 2026 } });
      sessionStorage.removeItem('fromCompanyCards');
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
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-blue-900 mb-2">
          {company.name}
        </h1>
        <p className="text-base sm:text-lg text-gray-700">{company.type}</p>
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
        <button
          onClick={handleKnowMore}
          disabled={knowMoreLoading}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold transition text-sm sm:text-base whitespace-nowrap relative
                     ${knowMoreLoading 
                       ? "bg-blue-600 text-white" 
                       : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                     } 
                     disabled:cursor-not-allowed flex items-center gap-2`}
        >
          {knowMoreLoading ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Loading...</span>
            </>
          ) : (
            <>
              Know More
              {hasKnowMoreData && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  !
                </span>
              )}
            </>
          )}
        </button>
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
      </div>
      {activeTab === "general" && <GeneralTab company={company} />}
      {activeTab === "oa" && <OATab company={company} />}
      {activeTab === "interview" && <InterviewTab company={company} />}
      {activeTab === "mustdo" && <MustDoTab company={company} />}
      {activeTab === "video" && <VideoTab videoUrl={company.videoUrl} />}
      {activeTab === "comments" && <CommentsTab company={company} />}

      {/* Know More Modal */}
      {showKnowMoreModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-4 sm:p-6 border-b">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                Know More - {company.name}
              </h2>
              <button
                onClick={() => {
                  setShowKnowMoreModal(false);
                  setKnowMoreData(null);
                  setKnowMoreError(null);
                  setHasKnowMoreData(false);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              {knowMoreLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <svg className="animate-spin h-12 w-12 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-lg font-semibold text-gray-800 mb-2">It may take a while...</p>
                  <p className="text-gray-600 text-center">Keep learning! 📚</p>
                </div>
              ) : knowMoreError ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 font-semibold mb-2">Error</p>
                  <p className="text-red-600">{knowMoreError}</p>
                </div>
              ) : knowMoreData ? (
                <div className="space-y-6">
                  {/* Display Interview Questions */}
                  {knowMoreData.interview_questions && Array.isArray(knowMoreData.interview_questions) && (
                    <div className="bg-white shadow-md rounded-lg border overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                        <h2 className="text-2xl font-bold text-white">
                          Interview Questions
                        </h2>
                        <p className="text-blue-100 text-sm mt-1">
                          {knowMoreData.interview_questions.length} question{knowMoreData.interview_questions.length !== 1 ? 's' : ''} found
                        </p>
                      </div>
                      <div className="p-4 sm:p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                        {knowMoreData.interview_questions.map((item, index) => (
                          <div
                            key={index}
                            className="border border-gray-200 rounded-lg p-4 sm:p-5 bg-gray-50 hover:bg-gray-100 transition-colors shadow-sm"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                                {index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-gray-800 font-medium leading-relaxed break-words mb-2">
                                  {item.question}
                                </p>
                                {item.questionUrl && item.questionUrl.trim() !== '' && (
                                  <a
                                    href={item.questionUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium text-sm transition-colors"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                    View Source
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Show message if no interview questions */}
                  {(!knowMoreData.interview_questions || !Array.isArray(knowMoreData.interview_questions) || knowMoreData.interview_questions.length === 0) && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-yellow-800">No interview questions found for this company.</p>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CompanyDetails;
