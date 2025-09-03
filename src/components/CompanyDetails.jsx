import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useSelector } from "react-redux";

function CompanyDetails() {
  const { id } = useParams();
  const [company, setCompany] = useState(null);
  const user = useSelector((store) => store.user);

  useEffect(() => {
    if (!user) return;

    axios
      .get(BASE_URL+`/api/companies/${id}`, { withCredentials: true })
      .then((res) => setCompany(res.data))
      .catch((err) => console.error("❌ Error fetching company details:", err));
  }, [id, user]);

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <p className="text-xl font-semibold text-gray-700">
          🚪 Login to view the company details
        </p>
      </div>
    );
  }

  if (!company) return <p className="p-6 text-gray-600">Loading...</p>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Basic Info */}
      <div className="bg-white shadow-md rounded-lg p-6 border mb-6">
        <h1 className="text-4xl font-extrabold text-blue-900 mb-2">
          {company.name}
        </h1>
        <p className="text-lg text-gray-700">
          <b>Type:</b> {company.type}
        </p>
        <p className="text-lg text-gray-700">
          <b>Eligibility:</b> {company.eligibility}
        </p>
      </div>

      {/* About The Company */}
      {company["About The Company"] && (
        <div className="bg-white shadow-md rounded-lg p-6 border mb-6">
          <h2 className="text-2xl font-bold border-b pb-2 mb-3 text-blue-800">
            About The Company
          </h2>
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
            {company["About The Company"]}
          </p>
        </div>
      )}

      {/* Roles */}
      <div className="bg-white shadow-md rounded-lg p-6 border mb-6">
        <h2 className="text-2xl font-bold border-b pb-2 mb-3 text-blue-800">
          Roles
        </h2>
        {company.roles.map((role, index) => (
          <div
            key={index}
            className="border p-4 my-4 rounded-lg bg-gray-50 shadow-sm"
          >
            <p className="text-lg font-semibold text-blue-700">
              {role.roleName}
            </p>

            
            {role.ctc && (
              <div className="mt-3">
                <b className="text-gray-800">CTC Split-up:</b>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {Object.entries(role.ctc).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex justify-between bg-white px-3 py-1 border rounded"
                    >
                      <span className="capitalize font-medium">{key}</span>
                      <span className="text-gray-700">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {role.internshipStipend && (
              <p className="mt-2 text-gray-700">
                <b>Stipend:</b> {role.internshipStipend}
              </p>
            )}
            {role.finalPayFirstYear && (
              <p className="text-gray-700">
                <b>First Year Pay:</b> {role.finalPayFirstYear}
              </p>
            )}
            {role.finalPayAnnual && (
              <p className="text-gray-700">
                <b>Annual Pay:</b> {role.finalPayAnnual}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 border mb-6">
        <h2 className="text-2xl font-bold border-b pb-2 mb-3 text-blue-800">
          Job Descriptions
        </h2>
        {company.jobDescription.map((jd, index) => (
          <div
            key={index}
            className="p-3 my-2 rounded bg-gray-50 border shadow-sm"
          >
            <p className="font-semibold">
              {jd.title}{" "}
              <span className="text-sm text-gray-500">({jd.fileType})</span>
            </p>
            {jd.fileUrl !== "Not provided" ? (
              <a
                href={jd.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline"
              >
                📥 Download
              </a>
            ) : (
              <p className="text-gray-500">Not provided</p>
            )}
          </div>
        ))}
      </div>

      {company.mcqQuestions && company.mcqQuestions.length > 0 && (
        <div className="bg-white shadow-md rounded-lg p-6 border mb-6">
          <h2 className="text-2xl font-bold border-b pb-2 mb-3 text-blue-800">
            MCQs
          </h2>
          {company.mcqQuestions.map((q, index) => (
            <div
              key={index}
              className="border p-4 my-3 rounded bg-gray-50 shadow-sm"
            >
              <p className="font-medium text-gray-800">
                {index + 1}. {q.question}
              </p>
              <div className="mt-2 space-y-1">
                <p>A. {q.optionA}</p>
                <p>B. {q.optionB}</p>
                <p>C. {q.optionC}</p>
                <p>D. {q.optionD}</p>
              </div>
              <p className="mt-2 text-green-700 font-semibold">
                ✅ Correct Answer: {q.answer}
              </p>
            </div>
          ))}
        </div>
      )}

      {company.onlineQuestions && company.onlineQuestions.length > 0 && (
        <div className="bg-white shadow-md rounded-lg p-6 border mb-6">
          <h2 className="text-2xl font-bold border-b pb-2 mb-3 text-blue-800">
            Online Questions
          </h2>
          <ol className="list-decimal ml-6 space-y-2 text-gray-700">
            {company.onlineQuestions.map((q, i) => (
              <li key={i} className="leading-relaxed">
                {q}
              </li>
            ))}
          </ol>
        </div>
      )}

 
      {company.interviewQuestions && company.interviewQuestions.length > 0 && (
        <div className="bg-white shadow-md rounded-lg p-6 border mb-6">
          <h2 className="text-2xl font-bold border-b pb-2 mb-3 text-blue-800">
            Interview Questions
          </h2>
          <ol className="list-decimal ml-6 space-y-2 text-gray-700">
            {company.interviewQuestions.map((q, i) => (
              <li key={i} className="leading-relaxed">
                {q}
              </li>
            ))}
          </ol>
        </div>
      )}

      
      {company.interviewProcess && (
        <div className="bg-white shadow-md rounded-lg p-6 border mb-6">
          <h2 className="text-2xl font-bold border-b pb-2 mb-3 text-blue-800">
            Interview Process
          </h2>
          <div className="whitespace-pre-line text-gray-700 leading-relaxed space-y-2">
            {company.interviewProcess.split("\n").map((line, idx) => (
              <p key={idx}>• {line}</p>
            ))}
          </div>
        </div>
      )}

     
      {company.count && (
        <div className="bg-white shadow-md rounded-lg p-6 border mb-6">
          <h2 className="text-2xl font-bold border-b pb-2 mb-3 text-blue-800">
            Count
          </h2>
          <p className="whitespace-pre-line text-gray-700 leading-relaxed">
            {company.count}
          </p>
        </div>
      )}


      {company.selectedCandidates && company.selectedCandidates.length > 0 && (
        <div className="bg-white shadow-md rounded-lg p-6 border mb-6">
          <h2 className="text-2xl font-bold border-b pb-2 mb-3 text-blue-800">
            Selected Candidates
          </h2>
          <ul className="list-disc ml-6 space-y-1 text-gray-700">
            {company.selectedCandidates.map((c, i) => (
              <li key={i}>
                {c.name}{" "}
                <span className="text-sm text-gray-500">({c.emailId})</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default CompanyDetails;


