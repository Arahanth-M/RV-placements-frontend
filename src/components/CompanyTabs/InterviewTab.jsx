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

import React, { useState, useEffect } from "react";
import { FaCopy, FaCheck, FaEdit, FaTrash } from "react-icons/fa";
import { API_ENDPOINTS, MESSAGES } from "../../utils/constants";
import { adminAPI } from "../../utils/api";

function InterviewTab({ company, isAdmin, onCompanyUpdate }) {
  const [openIndexQ, setOpenIndexQ] = useState(null);
  const [openSolutionIndex, setOpenSolutionIndex] = useState({});
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [editIQIndex, setEditIQIndex] = useState(null);
  const [editIQQuestion, setEditIQQuestion] = useState("");
  const [editIQSolution, setEditIQSolution] = useState("");
  const [editIPIndex, setEditIPIndex] = useState(null);
  const [editIPContent, setEditIPContent] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

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
  // Supported structures (often stored as JSON or JSON-like strings):
  // - [{ "answer": "solution text" }]
  // - [{ "answers": "solution text" }]
  // - [{ "answers": ["line1", "line2"] }]
  // If parsing fails but the string still looks JSON-like, we fall back to
  // regex extraction of just the answer/answers value so we never dump
  // the whole JSON into the UI.
  const solutions =
    company.interviewQuestions_solution?.map((sol) => {
      if (!sol) return "";
      let processedSol = "";
      
      // Handle different input formats
      const extractAnswerFromJsonish = (str) => {
        if (typeof str !== "string") return "";
        const trimmed = str.trim();

        // Try to capture "answer": "...."
        const answerMatch = trimmed.match(/"answer"\s*:\s*"([\s\S]*?)"/);
        if (answerMatch && answerMatch[1]) {
          return answerMatch[1];
        }

        // Try to capture "answers": "...."
        const answersSingleMatch = trimmed.match(/"answers"\s*:\s*"([\s\S]*?)"/);
        if (answersSingleMatch && answersSingleMatch[1]) {
          return answersSingleMatch[1];
        }

        // Try to capture "answers": ["...","..."]
        const answersArrayMatch = trimmed.match(
          /"answers"\s*:\s*\[([\s\S]*?)\]/
        );
        if (answersArrayMatch && answersArrayMatch[1]) {
          const rawInside = answersArrayMatch[1];
          // Grab all quoted strings inside the array
          const itemMatches = [...rawInside.matchAll(/"([\s\S]*?)"/g)].map(
            (m) => m[1]
          );
          if (itemMatches.length > 0) {
            return itemMatches.join("\n\n");
          }
        }

        return "";
      };

      if (typeof sol === "string") {
        // Try to parse as JSON first (handles cases like [{"answer":"solution"}])
        try {
          const parsed = JSON.parse(sol);

          const extractAnswerLike = (obj) => {
            if (!obj || typeof obj !== "object") return "";
            const raw =
              obj.answer ??
              obj.answers ??
              obj.solution ??
              obj.text ??
              obj.content ??
              "";
            // If answers is an array, join lines nicely
            if (Array.isArray(raw)) {
              return raw.map((v) => String(v)).join("\n\n");
            }
            return raw;
          };

          // If it's an array of objects, extract the answer/answers field from first object
          if (Array.isArray(parsed) && parsed.length > 0) {
            const firstItem = parsed[0];
            if (typeof firstItem === "object" && firstItem !== null) {
              processedSol = extractAnswerLike(firstItem);
            } else {
              processedSol = String(firstItem);
            }
          } else if (typeof parsed === "object" && parsed !== null) {
            // Single object, extract answer/answers field
            processedSol = extractAnswerLike(parsed);
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
                const firstItem = parsed[0];
                if (typeof firstItem === "object" && firstItem !== null) {
                  const raw =
                    firstItem.answer ??
                    firstItem.answers ??
                    firstItem.solution ??
                    firstItem.text ??
                    firstItem.content ??
                    "";
                  processedSol = Array.isArray(raw)
                    ? raw.map((v) => String(v)).join("\n\n")
                    : raw;
                } else {
                  processedSol = String(firstItem);
                }
              } else if (typeof parsed === "object" && parsed !== null) {
                const raw =
                  parsed.answer ??
                  parsed.answers ??
                  parsed.solution ??
                  parsed.text ??
                  parsed.content ??
                  "";
                processedSol = Array.isArray(raw)
                  ? raw.map((v) => String(v)).join("\n\n")
                  : raw;
              } else {
                processedSol = String(parsed);
              }
            } catch {
              // If still can't parse, try regex extraction of answer/answers
              const extracted = extractAnswerFromJsonish(trimmed);
              processedSol = extracted || trimmed.slice(1, -1);
            }
          } else {
            // Try regex extraction of answer/answers before falling back
            const extracted = extractAnswerFromJsonish(sol);
            processedSol = extracted || sol;
          }
        }
      } else if (Array.isArray(sol) && sol.length > 0) {
        // If it's already an array, extract the answer from first object
        const firstItem = sol[0];
        if (typeof firstItem === "object" && firstItem !== null) {
          const raw =
            firstItem.answer ??
            firstItem.answers ??
            firstItem.solution ??
            firstItem.text ??
            firstItem.content ??
            "";
          processedSol = Array.isArray(raw)
            ? raw.map((v) => String(v)).join("\n\n")
            : raw;
        } else {
          processedSol = String(firstItem);
        }
      } else if (typeof sol === "object" && sol !== null) {
        // If it's an object, extract the answer field
        const raw =
          sol.answer ??
          sol.answers ??
          sol.solution ??
          sol.text ??
          sol.content ??
          "";
        processedSol = Array.isArray(raw)
          ? raw.map((v) => String(v)).join("\n\n")
          : raw;
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

  const handleCopySolution = async (solutionText, index) => {
    try {
      await navigator.clipboard.writeText(solutionText);
      setCopiedIndex(index);
      setTimeout(() => {
        setCopiedIndex(null);
      }, 2000); // Reset after 2 seconds
    } catch (err) {
      console.error("Failed to copy solution:", err);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = solutionText;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        setCopiedIndex(index);
        setTimeout(() => {
          setCopiedIndex(null);
        }, 2000);
      } catch (fallbackErr) {
        console.error("Fallback copy failed:", fallbackErr);
        alert("Failed to copy solution. Please try selecting and copying manually.");
      }
      document.body.removeChild(textArea);
    }
  };

  const handleEditIQ = (index, questionText, solutionText) => {
    setEditIQIndex(index);
    setEditIQQuestion(questionText || "");
    setEditIQSolution(solutionText || "");
  };

  const handleSaveEditIQ = async (e) => {
    e.preventDefault();
    if (editIQIndex == null || !company?._id) return;
    setActionLoading(true);
    try {
      await adminAPI.updateInterviewQuestion(company._id, editIQIndex, { question: editIQQuestion, solution: editIQSolution });
      if (onCompanyUpdate) onCompanyUpdate();
      setEditIQIndex(null);
      setEditIQQuestion("");
      setEditIQSolution("");
    } catch (err) {
      console.error(err);
      alert("Failed to update question.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteIQ = async (index) => {
    if (!company?._id || !window.confirm("Delete this interview question?")) return;
    setActionLoading(true);
    try {
      await adminAPI.deleteInterviewQuestion(company._id, index);
      if (onCompanyUpdate) onCompanyUpdate();
      setOpenIndexQ(null);
    } catch (err) {
      console.error(err);
      alert("Failed to delete question.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditIP = (index, contentText) => {
    setEditIPIndex(index);
    setEditIPContent(contentText || "");
  };

  const handleSaveEditIP = async (e) => {
    e.preventDefault();
    if (editIPIndex == null || !company?._id) return;
    setActionLoading(true);
    try {
      await adminAPI.updateInterviewProcess(company._id, editIPIndex, { content: editIPContent });
      if (onCompanyUpdate) onCompanyUpdate();
      setEditIPIndex(null);
      setEditIPContent("");
    } catch (err) {
      console.error(err);
      alert("Failed to update entry.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteIP = async (index) => {
    if (!company?._id || !window.confirm("Delete this interview process entry?")) return;
    setActionLoading(true);
    try {
      await adminAPI.deleteInterviewProcess(company._id, index);
      if (onCompanyUpdate) onCompanyUpdate();
    } catch (err) {
      console.error(err);
      alert("Failed to delete entry.");
    } finally {
      setActionLoading(false);
    }
  };

  // Normalize interview process - handle both legacy string format and new JSON string format
  let interviewProcess = [];
  if (Array.isArray(company.interviewProcess)) {
    interviewProcess = company.interviewProcess
      .map(p => {
        if (!p || typeof p !== 'string') return null;
        
        const trimmed = p.trim();
        if (trimmed.length === 0) return null;
        
        // Try to parse as JSON (new format with metadata)
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed && typeof parsed === 'object' && parsed.content) {
            return {
              content: parsed.content.trim(),
              isAnonymous: parsed.isAnonymous === true || parsed.isAnonymous === 'true',
              submittedBy: parsed.submittedBy || null
            };
          }
        } catch {
          // Not JSON, treat as legacy string format
        }
        
        // Legacy string format - no submitter info
        return {
          content: trimmed,
          isAnonymous: false,
          submittedBy: null
        };
      })
      .filter(p => p !== null);
  } else if (typeof company.interviewProcess === "string" && company.interviewProcess.trim().length > 0) {
    // Legacy support: convert string to array
    interviewProcess = [{ content: company.interviewProcess.trim(), isAnonymous: false, submittedBy: null }];
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-slate-200">
      {/* Interview Questions */}
      <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-indigo-400 mb-4 flex justify-between items-center">
          Interview Questions
        </h2>

        {interviewQuestions.length > 0 ? (
          <div className="space-y-4">
            {interviewQuestions.map((q, index) => (
              <div
                key={index}
                className="border border-slate-700 rounded-lg bg-slate-800/60 min-w-0 overflow-hidden"
              >
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setOpenIndexQ(openIndexQ === index ? null : index)
                    }
                    className="flex-1 text-left px-4 py-3 font-semibold text-slate-200 flex justify-between items-center min-w-0"
                  >
                    <span className="truncate">Question {index + 1}</span>
                    <span className="text-lg text-slate-400">
                      {openIndexQ === index ? "−" : "+"}
                    </span>
                  </button>
                  {isAdmin && (
                    <div className="flex items-center gap-1 pr-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleEditIQ(index, q, solutions[index])}
                        className="p-2 rounded-md text-amber-400 hover:bg-slate-700 transition-colors"
                        title="Edit question"
                      >
                        <FaEdit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteIQ(index)}
                        disabled={actionLoading}
                        className="p-2 rounded-md text-red-400 hover:bg-slate-700 transition-colors disabled:opacity-50"
                        title="Delete question"
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {openIndexQ === index && (
                  <div className="px-4 pb-4 text-slate-300 leading-relaxed space-y-3 break-words whitespace-pre-wrap">
                    <p>{q || `Question ${index + 1}`}</p>

                    {/* Solution Accordion */}
                    {solutions[index] && solutions[index].trim().length > 0 ? (
                      <div className="border border-slate-700 rounded-lg bg-slate-800/60 overflow-hidden">
                        <button
                          onClick={() => toggleSolutionAccordion(index)}
                          className="w-full text-left px-4 py-2 font-medium text-indigo-400 flex justify-between items-center"
                        >
                          <span>View Solution</span>
                          <span className="text-lg text-slate-400">
                            {openSolutionIndex[index] ? "−" : "+"}
                          </span>
                        </button>
                        {openSolutionIndex[index] && (
                          <div className="px-4 pb-4">
                            <div className="relative">
                              <button
                                onClick={() => handleCopySolution(solutions[index], index)}
                                className="absolute top-2 right-2 bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-md transition-colors flex items-center gap-2 text-xs z-10"
                                title="Copy solution"
                              >
                                {copiedIndex === index ? (
                                  <>
                                    <FaCheck className="w-3 h-3" />
                                    <span>Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <FaCopy className="w-3 h-3" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                              <pre className="bg-slate-900 text-green-300 rounded-lg p-4 overflow-x-auto max-w-full text-sm leading-relaxed whitespace-pre-wrap break-words">
                                <code>{solutions[index]}</code>
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="border border-slate-700 rounded-lg bg-slate-800/60 overflow-hidden">
                        <div className="px-4 py-2">
                          <p className="text-sm text-slate-400 italic">
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
          <p className="text-slate-400">No interview questions yet.</p>
        )}
      </div>

      {/* Interview Process */}
      <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-indigo-400 mb-4 flex justify-between items-center">
          Interview Process
        </h2>

        {interviewProcess.length > 0 ? (
          <div className="space-y-4">
            {interviewProcess.map((process, index) => {
              const processContent = process.content || process;
              const isAnonymous = process.isAnonymous === true || process.isAnonymous === 'true';
              const submittedBy = process.submittedBy || null;
              const showSubmitter = !isAnonymous && submittedBy && submittedBy.name;
              
              return (
                <div key={index} className="bg-slate-800/60 rounded-lg p-4 border border-slate-700 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center font-semibold text-xs">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="whitespace-pre-wrap break-words text-sm sm:text-base text-slate-300">
                        {processContent}
                      </p>
                      {showSubmitter && (
                        <p className="text-xs text-slate-400 mt-2 italic">
                          Submitted by: {submittedBy.name}
                        </p>
                      )}
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEditIP(index, processContent)}
                        className="p-2 rounded-md text-amber-400 hover:bg-slate-700 transition-colors"
                        title="Edit entry"
                      >
                        <FaEdit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteIP(index)}
                        disabled={actionLoading}
                        className="p-2 rounded-md text-red-400 hover:bg-slate-700 transition-colors disabled:opacity-50"
                        title="Delete entry"
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-slate-400">No interview process info yet.</p>
        )}
      </div>

      {/* Edit Interview Question modal (admin) */}
      {editIQIndex !== null && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl w-96 max-w-[90vw]">
            <h3 className="text-lg font-semibold mb-4 text-amber-400">Edit Interview Question {editIQIndex + 1}</h3>
            <form onSubmit={handleSaveEditIQ} className="space-y-3">
              <textarea
                value={editIQQuestion}
                onChange={(e) => setEditIQQuestion(e.target.value)}
                placeholder="Question"
                className="w-full p-3 border border-slate-600 rounded-lg bg-slate-900 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <textarea
                value={editIQSolution}
                onChange={(e) => setEditIQSolution(e.target.value)}
                placeholder="Solution (optional)"
                className="w-full p-3 border border-slate-600 rounded-lg bg-slate-900 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex justify-end gap-2">
                <button type="button" className="px-4 py-2 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700" onClick={() => { setEditIQIndex(null); setEditIQQuestion(""); setEditIQSolution(""); }}>Cancel</button>
                <button type="submit" disabled={actionLoading} className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50">{actionLoading ? "Saving…" : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Interview Process modal (admin) */}
      {editIPIndex !== null && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl w-96 max-w-[90vw]">
            <h3 className="text-lg font-semibold mb-4 text-amber-400">Edit Interview Process {editIPIndex + 1}</h3>
            <form onSubmit={handleSaveEditIP} className="space-y-3">
              <textarea
                value={editIPContent}
                onChange={(e) => setEditIPContent(e.target.value)}
                placeholder="Content"
                className="w-full p-3 border border-slate-600 rounded-lg bg-slate-900 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <div className="flex justify-end gap-2">
                <button type="button" className="px-4 py-2 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700" onClick={() => { setEditIPIndex(null); setEditIPContent(""); }}>Cancel</button>
                <button type="submit" disabled={actionLoading} className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50">{actionLoading ? "Saving…" : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default InterviewTab;


