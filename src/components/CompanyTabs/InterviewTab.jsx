// import React, { useState } from "react";

// function InterviewTab({ company = {} }) {
//   const [openIndex, setOpenIndex] = useState(null);

//   const toggleAccordion = (index) => {
//     setOpenIndex(openIndex === index ? null : index);
//   };

//   const interviewQuestions = Array.isArray(company.interviewQuestions)
//     ? company.interviewQuestions
//     : company.interviewQuestions
//     ? [company.interviewQuestions]
//     : [];

//   let interviewProcess = [];
//   if (typeof company.interviewProcess === "string") {
//     interviewProcess = company.interviewProcess
//       .split(/(?=Round\s+\d+:)/)
//       .map((round) => round.trim())
//       .filter((round) => round.length > 0);
//   } else if (Array.isArray(company.interviewProcess)) {
//     interviewProcess = company.interviewProcess;
//   }

//   return (
//     <div className="space-y-6 px-4 sm:px-6 lg:px-0 max-w-screen-xl mx-auto">
//       {/* Interview Questions */}
//       {interviewQuestions.length > 0 && (
//         <div className="bg-white shadow-md rounded-lg p-6 border overflow-hidden">
//           <h2 className="text-2xl font-bold mb-4 text-blue-800">
//             Interview Questions
//           </h2>
//           <div className="space-y-4">
//             {interviewQuestions.map((q, index) => (
//               <div
//                 key={index}
//                 className="border rounded-lg shadow-sm bg-gray-100 min-w-0 overflow-hidden"
//               >
//                 <button
//                   onClick={() => toggleAccordion(index)}
//                   className="w-full text-left px-4 py-3 font-semibold text-gray-800 flex justify-between items-center min-w-0"
//                 >
//                   <span className="truncate">Question {index + 1}</span>
//                   <span className="text-lg">{openIndex === index ? "−" : "+"}</span>
//                 </button>

//                 {openIndex === index && (
//                   <div className="px-4 pb-4 text-gray-700 leading-relaxed break-words whitespace-pre-wrap">
//                     {q}
//                   </div>
//                 )}
//               </div>
//             ))}
//           </div>
//         </div>
//       )}

//       {/* Interview Process */}
//       {interviewProcess.length > 0 && (
//         <div className="bg-white shadow-md rounded-lg p-6 border overflow-hidden">
//           <h2 className="text-2xl font-bold mb-4 text-blue-800">
//             Interview Process
//           </h2>
//           <div className="space-y-6 text-gray-700 leading-relaxed">
//             {interviewProcess.map((round, index) => (
//               <div
//                 key={index}
//                 className="p-4 bg-gray-50 rounded-md shadow-sm break-words"
//               >
//                 <p className="font-semibold text-blue-900 mb-2">
//                   {round.split(":")[0]}:
//                 </p>
//                 <p className="whitespace-pre-wrap break-words">
//                   {round.substring(round.indexOf(":") + 1).trim()}
//                 </p>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default InterviewTab;

import React, { useState } from "react";
import { API_ENDPOINTS, MESSAGES } from "../../utils/constants";

function InterviewTab({ company }) {
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [content, setContent] = useState("");
  const [openIndexQ, setOpenIndexQ] = useState(null);
  const [openSolutionIndex, setOpenSolutionIndex] = useState({}); // track solution open per question

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(API_ENDPOINTS.SUBMISSIONS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Include cookies for authentication
        body: JSON.stringify({
          companyId: company._id,
          type:
            modalType === "interviewQ"
              ? "interviewQuestions"
              : "interviewProcess",
          content,
          }),
      });

      if (!res.ok) throw new Error("Failed to submit");
      const data = await res.json();
      alert(data.message || MESSAGES.SUBMISSION_SUCCESS);

      setContent("");
      setShowModal(false);
    } catch (err) {
      console.error(err);
      alert(MESSAGES.SUBMISSION_ERROR);
    }
  };

  // Normalize interview questions
  const interviewQuestions = Array.isArray(company.interviewQuestions)
    ? company.interviewQuestions
    : company.interviewQuestions
    ? [company.interviewQuestions]
    : [];

  // Function to convert escape sequences to their actual characters and remove unnecessary quotes
  const unescapeString = (str) => {
    if (typeof str !== "string") return str;
    
    // Handle common escape sequences
    let processed = str
      .replace(/\\n/g, "\n")      // \n -> newline
      .replace(/\\t/g, "\t")      // \t -> tab
      .replace(/\\r/g, "\r")      // \r -> carriage return
      .replace(/\\"/g, '"')       // \" -> double quote
      .replace(/\\'/g, "'")       // \' -> single quote
      .replace(/\\\\/g, "\\");     // \\ -> backslash (must be last to avoid double replacement)
    
    // Remove outer quotes if the string is wrapped in matching quotes
    // Only remove if the entire string is wrapped and there are no quotes in the middle
    const trimmed = processed.trim();
    if (trimmed.length > 1) {
      if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
        const innerContent = trimmed.slice(1, -1);
        // Only remove if there are no unescaped quotes in the middle
        if (!innerContent.includes('"') || innerContent.match(/^["'].*["']$/)) {
          processed = innerContent;
        }
      } else if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
        const innerContent = trimmed.slice(1, -1);
        // Only remove if there are no unescaped quotes in the middle
        if (!innerContent.includes("'") || innerContent.match(/^["'].*["']$/)) {
          processed = innerContent;
        }
      }
    }
    
    return processed;
  };

  // Process interview questions solutions
  const solutions =
    company.interviewQuestions_solution?.map((sol) => {
      if (!sol) return "";
      let processedSol;
      
      // Handle different input formats
      if (typeof sol === "string") {
        // Try to parse as JSON first (handles cases like ["solution\nhere"])
        try {
          const parsed = JSON.parse(sol);
          // If it's an array, extract the first element
          if (Array.isArray(parsed) && parsed.length > 0) {
            processedSol = String(parsed[0]);
          } else {
            processedSol = String(parsed);
          }
        } catch {
          // Not valid JSON, check if it starts and ends with brackets
          const trimmed = sol.trim();
          if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            // Try one more time to parse after trimming
            try {
              const parsed = JSON.parse(trimmed);
              if (Array.isArray(parsed) && parsed.length > 0) {
                processedSol = String(parsed[0]);
              } else {
                processedSol = String(parsed);
              }
            } catch {
              // If still can't parse, remove outer brackets manually
              processedSol = trimmed.slice(1, -1);
            }
          } else {
            // Use as-is
            processedSol = sol;
          }
        }
      } else if (Array.isArray(sol) && sol.length > 0) {
        // If it's already an array, extract the first element
        processedSol = String(sol[0]);
      } else {
        processedSol = String(sol);
      }
      
      // Convert escape sequences to actual characters (e.g., \n -> newline)
      return unescapeString(processedSol);
    }) || [];

  const toggleSolutionAccordion = (questionIdx) => {
    setOpenSolutionIndex((prev) => ({
      ...prev,
      [questionIdx]: !prev[questionIdx],
    }));
  };

  // Normalize interview process - now it's always an array
  let interviewProcess = [];
  if (Array.isArray(company.interviewProcess)) {
    interviewProcess = company.interviewProcess.filter(p => p && p.trim().length > 0);
  } else if (typeof company.interviewProcess === "string" && company.interviewProcess.trim().length > 0) {
    // Legacy support: convert string to array
    interviewProcess = [company.interviewProcess.trim()];
  }

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-0 max-w-screen-xl mx-auto">
      {/* Interview Questions */}
      <div className="bg-white shadow-md rounded-lg p-6 border overflow-hidden">
        <h2 className="text-2xl font-bold mb-4 text-blue-800 flex justify-between items-center">
          Interview Questions
          <button
            className="flex items-center space-x-1.5 bg-slate-700 hover:bg-slate-800 text-white px-3 py-1.5 rounded-md shadow-sm hover:shadow-md transition-all duration-200 text-sm font-medium"
            onClick={() => {
              setModalType("interviewQ");
              setShowModal(true);
            }}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Add Question</span>
          </button>
        </h2>

        {interviewQuestions.length > 0 ? (
          <div className="space-y-4">
            {interviewQuestions.map((q, index) => (
              <div
                key={index}
                className="border rounded-lg shadow-sm bg-gray-100 min-w-0 overflow-hidden"
              >
                <button
                  onClick={() =>
                    setOpenIndexQ(openIndexQ === index ? null : index)
                  }
                  className="w-full text-left px-4 py-3 font-semibold text-gray-800 flex justify-between items-center min-w-0"
                >
                  <span className="truncate">Question {index + 1}</span>
                  <span className="text-lg">
                    {openIndexQ === index ? "−" : "+"}
                  </span>
                </button>

                {openIndexQ === index && (
                  <div className="px-4 pb-4 text-gray-700 leading-relaxed space-y-3 break-words whitespace-pre-wrap">
                    <p>{q || `Question ${index + 1}`}</p>

                    {/* Solution Accordion */}
                    {solutions[index] && solutions[index].trim().length > 0 ? (
                      <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
                        <button
                          onClick={() => toggleSolutionAccordion(index)}
                          className="w-full text-left px-4 py-2 font-medium text-blue-700 flex justify-between items-center"
                        >
                          <span>View Solution</span>
                          <span className="text-lg">
                            {openSolutionIndex[index] ? "−" : "+"}
                          </span>
                        </button>
                        {openSolutionIndex[index] && (
                          <div className="px-4 pb-4">
                            <pre className="bg-gray-900 text-green-200 rounded-lg p-4 overflow-x-auto max-w-full text-sm leading-relaxed whitespace-pre-wrap break-words">
                              <code>{solutions[index]}</code>
                            </pre>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
                        <div className="px-4 py-2">
                          <p className="text-sm text-gray-500 italic">
                            Solution not yet provided
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p>No interview questions yet.</p>
        )}
      </div>

      {/* Interview Process */}
      <div className="bg-white shadow-md rounded-lg p-6 border overflow-hidden">
        <h2 className="text-2xl font-bold mb-4 text-blue-800 flex justify-between items-center">
          Interview Process
          <button
            className="flex items-center space-x-1.5 bg-slate-700 hover:bg-slate-800 text-white px-3 py-1.5 rounded-md shadow-sm hover:shadow-md transition-all duration-200 text-sm font-medium"
            onClick={() => {
              setModalType("process");
              setShowModal(true);
            }}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Add Process</span>
          </button>
        </h2>

        {interviewProcess.length > 0 ? (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="space-y-4 text-gray-700 leading-relaxed">
              {interviewProcess.map((process, index) => (
                <div key={index} className="break-words border-l-4 border-blue-900 pl-4 py-2 bg-white rounded-r shadow-sm">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-900 text-white rounded-full flex items-center justify-center font-semibold text-xs">
                      {index + 1}
                    </span>
                    <p className="whitespace-pre-wrap break-words text-sm sm:text-base text-gray-800 flex-1">
                      {process}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p>No interview process info yet.</p>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white p-4 rounded w-96">
            <h3 className="text-lg font-bold mb-2">
              {modalType === "interviewQ"
                ? "Add Interview Question"
                : "Add Interview Process"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter here..."
                className="w-full p-2 border rounded"
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="px-3 py-1 border rounded"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-blue-900 text-white rounded hover:bg-blue-800 transition-colors"
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

export default InterviewTab;


