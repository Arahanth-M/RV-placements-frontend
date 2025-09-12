// import React, { useEffect, useState } from "react";
// import { useParams } from "react-router-dom";
// import axios from "axios";
// import { BASE_URL } from "../utils/constants";

// import GeneralTab from "./CompanyTabs/GeneralTab";
// import OATab from "./CompanyTabs/OATab";
// import InterviewTab from "./CompanyTabs/InterviewTab";

// function CompanyDetails() {
//   const { id } = useParams();
//   const [company, setCompany] = useState(null);
//   const [activeTab, setActiveTab] = useState("general");

//   useEffect(() => {
//     axios
//       .get(BASE_URL + `/api/companies/${id}`, { withCredentials: true })
//       .then((res) => setCompany(res.data))
//       .catch((err) =>
//         console.error("❌ Error fetching company details:", err)
//       );
//   }, [id]);

//   if (!company) return <p className="p-6 text-gray-600">Loading...</p>;

//   return (
//     <div className="p-6 max-w-6xl mx-auto">
//       {/* Header */}
//       <div className="bg-white shadow-md rounded-lg p-6 border mb-6">
//         <h1 className="text-4xl font-extrabold text-blue-900 mb-2">
//           {company.name}
//         </h1>
//         <p className="text-lg text-gray-700">{company.type}</p>
//       </div>

//       {/* Tabs */}
//       <div className="flex gap-4 mb-6">
//         <button
//           onClick={() => setActiveTab("general")}
//           className={`px-4 py-2 rounded-lg font-semibold transition ${
//             activeTab === "general"
//               ? "bg-blue-600 text-white"
//               : "bg-gray-200 text-gray-700 hover:bg-gray-300"
//           }`}
//         >
//           General
//         </button>
//         <button
//           onClick={() => setActiveTab("oa")}
//           className={`px-4 py-2 rounded-lg font-semibold transition ${
//             activeTab === "oa"
//               ? "bg-blue-600 text-white"
//               : "bg-gray-200 text-gray-700 hover:bg-gray-300"
//           }`}
//         >
//           OA Questions
//         </button>
//         <button
//           onClick={() => setActiveTab("interview")}
//           className={`px-4 py-2 rounded-lg font-semibold transition ${
//             activeTab === "interview"
//               ? "bg-blue-600 text-white"
//               : "bg-gray-200 text-gray-700 hover:bg-gray-300"
//           }`}
//         >
//           Interview Experience
//         </button>
       
//       </div>

//       {/* Tab Content */}
//       {activeTab === "general" && <GeneralTab company={company} />}
//       {activeTab === "oa" && <OATab company={company} />}
//       {activeTab === "interview" && <InterviewTab company={company} />}
//     </div>
//   );
// }

// export default CompanyDetails;


import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../utils/constants";

import GeneralTab from "./CompanyTabs/GeneralTab";
import OATab from "./CompanyTabs/OATab";
import InterviewTab from "./CompanyTabs/InterviewTab";
import MustDoTab from "./CompanyTabs/MustDoTab";

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
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab("general")}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            activeTab === "general"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          General
        </button>
        <button
          onClick={() => setActiveTab("oa")}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            activeTab === "oa"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          OA Questions
        </button>
        <button
          onClick={() => setActiveTab("interview")}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            activeTab === "interview"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Interview Experience
        </button>
        <button
          onClick={() => setActiveTab("mustdo")}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            activeTab === "mustdo"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Must Do Topics
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "general" && <GeneralTab company={company} />}
      {activeTab === "oa" && <OATab company={company} />}
      {activeTab === "interview" && <InterviewTab company={company} />}
      {activeTab === "mustdo" && <MustDoTab company={company} />}
    </div>
  );
}

export default CompanyDetails;
