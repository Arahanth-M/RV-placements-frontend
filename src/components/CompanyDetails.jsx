

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../utils/constants";

import GeneralTab from "./CompanyTabs/GeneralTab";
import OATab from "./CompanyTabs/OATab";
import InterviewTab from "./CompanyTabs/InterviewTab";
import MustDoTab from "./CompanyTabs/MustDoTab";
import VideoTab from "./CompanyTabs/VideoTab";

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
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white shadow-md rounded-lg p-6 border mb-6">
        <h1 className="text-4xl font-extrabold text-blue-900 mb-2">
          {company.name}
        </h1>
        <p className="text-lg text-gray-700">{company.type}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 flex-wrap">
        {["general", "oa", "interview", "mustdo"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
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
              : "Must Do Topics"}
          </button>
        ))}

        {/* Video Tab appears only if backend sent a videoUrl */}
        {company.videoUrl && (
          <button
            onClick={() => setActiveTab("video")}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              activeTab === "video"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Video
          </button>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === "general" && <GeneralTab company={company} />}
      {activeTab === "oa" && <OATab company={company} />}
      {activeTab === "interview" && <InterviewTab company={company} />}
      {activeTab === "mustdo" && <MustDoTab company={company} />}
      {activeTab === "video" && <VideoTab videoUrl={company.videoUrl} />}
    </div>
  );
}

export default CompanyDetails;
