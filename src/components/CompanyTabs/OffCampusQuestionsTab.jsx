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
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-slate-200">
        <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl p-6">
          <p className="text-slate-400 text-center py-4">
            No off-campus questions available for this company.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-slate-200">
      <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl overflow-hidden">
        <div className="bg-indigo-600 px-6 py-4">
          <h2 className="text-xl font-semibold text-white">
            Off-Campus Questions
          </h2>
          <p className="text-indigo-200 text-sm mt-1">
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
                className="border border-slate-700 rounded-lg p-4 sm:p-5 bg-slate-800/60 hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-300 font-medium leading-relaxed break-words mb-2">
                      {questionText}
                    </p>
                    {questionUrl && questionUrl.trim() !== '' && (
                      <a
                        href={questionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-medium text-sm transition-colors"
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

