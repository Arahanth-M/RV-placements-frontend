import React, { useState } from "react";
import { API_ENDPOINTS, MESSAGES } from "../../utils/constants";

function InternshipTab({ company }) {
  const [showModal, setShowModal] = useState(false);
  const [experienceText, setExperienceText] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(API_ENDPOINTS.SUBMISSIONS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Include cookies for authentication
        body: JSON.stringify({
          companyId: company._id,
          type: "internshipExperience",
          content: JSON.stringify({ experience: experienceText }),
          isAnonymous: false,
        }),
      });

      if (!res.ok) throw new Error("Failed to submit");
      const data = await res.json();
      alert(data.message || MESSAGES.SUBMISSION_SUCCESS);

      setExperienceText("");
      setShowModal(false);
    } catch (err) {
      console.error(err);
      alert(MESSAGES.SUBMISSION_ERROR);
    }
  };

  // Normalize internship experience - handle both legacy string format and new JSON string format
  let internshipExperience = [];
  if (Array.isArray(company.internshipExperience)) {
    internshipExperience = company.internshipExperience
      .map((exp) => {
        if (!exp || typeof exp !== "string") return null;

        const trimmed = exp.trim();
        if (trimmed.length === 0) return null;

        // Try to parse as JSON (new format with metadata or our new submission payload format)
        try {
          const parsed = JSON.parse(trimmed);
          
          // Handle the format we use in our submissions: JSON.stringify({ experience: ... })
          if (parsed && typeof parsed === "object" && parsed.experience) {
            return {
              content: parsed.experience.trim(),
              isAnonymous: false,
              submittedBy: null, // Submitter info is not natively saved here unless admin merges it
            };
          }

          if (parsed && typeof parsed === "object" && parsed.content) {
             // Handle the 'new metadata format' if it's there
            return {
              content: parsed.content.trim(),
              isAnonymous: parsed.isAnonymous === true || parsed.isAnonymous === "true",
              submittedBy: parsed.submittedBy || null,
            };
          }
        } catch {
          // Not JSON, treat as legacy string format
        }

        // Legacy string format - no submitter info
        return {
          content: trimmed,
          isAnonymous: false,
          submittedBy: null,
        };
      })
      .filter((exp) => exp !== null);
  } else if (typeof company.internshipExperience === "string" && company.internshipExperience.trim().length > 0) {
    // Legacy support: convert string to array
    internshipExperience = [
      {
        content: company.internshipExperience.trim(),
        isAnonymous: false,
        submittedBy: null,
      },
    ];
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-slate-200">
      <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4 text-indigo-400 flex justify-between items-center">
          Internship Experience
          <button
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md shadow-sm hover:shadow-md transition-all duration-200 text-sm font-medium"
            onClick={() => setShowModal(true)}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Add Internship Experience</span>
          </button>
        </h2>

        {internshipExperience.length > 0 ? (
          <div className="space-y-4">
            {internshipExperience.map((exp, index) => {
              const expContent = exp.content || exp;
              const isAnonymous = exp.isAnonymous === true || exp.isAnonymous === "true";
              const submittedBy = exp.submittedBy || null;
              const showSubmitter = !isAnonymous && submittedBy && submittedBy.name;

              return (
                <div key={index} className="bg-slate-800/60 rounded-lg p-4 border border-slate-700 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center font-semibold text-xs">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="whitespace-pre-wrap break-words text-sm sm:text-base text-slate-300">
                        {expContent}
                      </p>
                      {showSubmitter && (
                        <p className="text-xs text-slate-400 mt-2 italic">
                          Submitted by: {submittedBy.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-slate-400">No internship experiences yet</p>
        )}
      </div>

      {/* Modal to add new internship experience */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl w-96 max-w-[90vw]">
            <h3 className="text-lg font-semibold mb-4 text-indigo-400">Add Internship Experience</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <textarea
                value={experienceText}
                onChange={(e) => setExperienceText(e.target.value)}
                placeholder="Share your internship experience..."
                className="w-full p-3 border border-slate-600 rounded-lg bg-slate-900 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 h-32"
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="px-4 py-2 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default InternshipTab;
