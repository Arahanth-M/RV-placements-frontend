import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../utils/constants";

import GeneralTab from "./CompanyTabs/GeneralTab";
import OATab from "./CompanyTabs/OATab";
import InterviewTab from "./CompanyTabs/InterviewTab";
import MustDoTab from "./CompanyTabs/MustDoTab";
import VideoTab from "./CompanyTabs/VideoTab";
import CommentsTab from "./CompanyTabs/CommentsTab";

function CompanyDetails() {
  const { id } = useParams();
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

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
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
    </div>
  );
}

export default CompanyDetails;
