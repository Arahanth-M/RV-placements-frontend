import React from "react";

function OffCampusQuestionsTab({ company }) {
  // Normalize interview_questions - handle both array and single object cases
  const interviewQuestions = Array.isArray(company.interview_questions)
    ? company.interview_questions
    : company.interview_questions
    ? [company.interview_questions]
    : [];

  // Filter out any invalid entries
  const validQuestions = interviewQuestions.filter(
    (item) => item && (item.question || (typeof item === "string" && item.trim().length > 0))
  );

  if (validQuestions.length === 0) {
    return (
      <div className="space-y-6 px-4 sm:px-6 lg:px-0 max-w-screen-xl mx-auto">
        <div className="bg-white shadow-md rounded-lg p-6 border overflow-hidden">
          <p className="text-gray-600 text-center py-4">
            No off-campus questions available for this company.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-0 max-w-screen-xl mx-auto">
      <div className="bg-white shadow-md rounded-lg border overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <h2 className="text-2xl font-bold text-white">
            Off-Campus Questions
          </h2>
          <p className="text-blue-100 text-sm mt-1">
            {validQuestions.length} question{validQuestions.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <div className="p-4 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {validQuestions.map((item, index) => {
            // Handle both object format {question, questionUrl} and string format
            const questionText = typeof item === "string" ? item : item.question || "";
            const questionUrl = typeof item === "object" ? item.questionUrl : null;

            if (!questionText || questionText.trim().length === 0) {
              return null;
            }

            return (
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
                      {questionText}
                    </p>
                    {questionUrl && questionUrl.trim() !== '' && (
                      <a
                        href={questionUrl}
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
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default OffCampusQuestionsTab;

