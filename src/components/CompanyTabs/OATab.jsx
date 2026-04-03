// import React, { useState } from "react";

// function OATab({ company = {} }) {
//   const [openQuestionIndex, setOpenQuestionIndex] = useState(null);
//   const [openSolutionIndex, setOpenSolutionIndex] = useState(null);

//   const toggleQuestionAccordion = (index) => {
//     setOpenQuestionIndex(openQuestionIndex === index ? null : index);
//     setOpenSolutionIndex(null);
//   };

//   const toggleSolutionAccordion = (index) => {
//     setOpenSolutionIndex(openSolutionIndex === index ? null : index);
//   };

//   return (
//     <div className="space-y-6 px-4 sm:px-6 lg:px-0 max-w-screen-xl mx-auto">
//       {/* MCQs */}
//       {company.mcqQuestions && company.mcqQuestions.length > 0 && (
//         <div className="bg-white shadow-md rounded-lg p-6 border mb-6 overflow-hidden">
//           <h2 className="text-2xl font-bold mb-4 text-blue-800">MCQs</h2>
//           {company.mcqQuestions.map((q, index) => (
//             <div
//               key={index}
//               className="border p-4 my-3 rounded bg-gray-50 shadow-sm break-words min-w-0"
//             >
//               <p className="font-medium text-gray-800 break-words">
//                 {index + 1}. {q.question}
//               </p>
//               <div className="mt-2 space-y-1 break-words">
//                 <p className="break-words">A. {q.optionA}</p>
//                 <p className="break-words">B. {q.optionB}</p>
//                 <p className="break-words">C. {q.optionC}</p>
//                 <p className="break-words">D. {q.optionD}</p>
//               </div>
//               <p className="mt-2 text-green-700 font-semibold break-words">
//                 ✅ Correct Answer: {q.answer}
//               </p>
//             </div>
//           ))}
//         </div>
//       )}

//       {/* Online Questions */}
//       {company.onlineQuestions && company.onlineQuestions.length > 0 && (
//         <div className="bg-white shadow-md rounded-lg p-6 border overflow-hidden">
//           <h2 className="text-2xl font-bold mb-4 text-blue-800">
//             Online Questions
//           </h2>
//           <div className="space-y-4">
//             {company.onlineQuestions.map((q, index) => (
//               <div
//                 key={index}
//                 className="border rounded-lg shadow-sm bg-gray-100 min-w-0 overflow-hidden"
//               >
//                 <button
//                   onClick={() => toggleQuestionAccordion(index)}
//                   className="w-full text-left px-4 py-3 font-semibold text-gray-800 flex justify-between items-center min-w-0"
//                 >
//                   <span className="truncate">Question {index + 1}</span>
//                   <span className="text-lg">
//                     {openQuestionIndex === index ? "−" : "+"}
//                   </span>
//                 </button>

//                 {openQuestionIndex === index && (
//                   <div className="px-4 pb-4 text-gray-700 leading-relaxed space-y-3 break-words whitespace-pre-wrap">
//                     <p className="break-words">{q}</p>

//                     {company.onlineQuestions_solution &&
//                       company.onlineQuestions_solution[index] && (
//                         <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
//                           <button
//                             onClick={() => toggleSolutionAccordion(index)}
//                             className="w-full text-left px-4 py-2 font-medium text-blue-700 flex justify-between items-center"
//                           >
//                             <span>View Solution</span>
//                             <span className="text-lg">
//                               {openSolutionIndex === index ? "−" : "+"}
//                             </span>
//                           </button>

//                           {openSolutionIndex === index && (
//                             <div className="px-4 pb-4">
//                               <pre className="bg-gray-900 text-green-200 rounded-lg p-4 overflow-x-auto max-w-full text-sm leading-relaxed whitespace-pre-wrap break-words">
//                                 <code className="language-cpp break-words">
//                                   {company.onlineQuestions_solution[index]}
//                                 </code>
//                               </pre>
//                             </div>
//                           )}
//                         </div>
//                       )}
//                   </div>
//                 )}
//               </div>
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default OATab;

// import React, { useState } from "react";

// function OATab({ company }) {
//   const [showModal, setShowModal] = useState(false);
//   const [question, setQuestion] = useState("");
//   const [solution, setSolution] = useState("");
//   const [openQuestionIndex, setOpenQuestionIndex] = useState(null);
//   const [openSolutionIndex, setOpenSolutionIndex] = useState(null);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       const res = await fetch("http://localhost:7779/api/submissions", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           companyId: company._id,
//           type: "onlineQuestions",
//           content: JSON.stringify({ question, solution }),
//         }),
//       });

//       if (!res.ok) throw new Error("Failed to submit");
//       const data = await res.json();
//       alert(data.message);

//       setQuestion("");
//       setSolution("");
//       setShowModal(false);
//     } catch (err) {
//       console.error(err);
//       alert("Something went wrong. Try again.");
//     }
//   };

//   const toggleQuestionAccordion = (index) => {
//     setOpenQuestionIndex(openQuestionIndex === index ? null : index);
//     setOpenSolutionIndex(null);
//   };

//   const toggleSolutionAccordion = (index) => {
//     setOpenSolutionIndex(openSolutionIndex === index ? null : index);
//   };

//   // Parse questions safely if stored as JSON
//   const parsedOA =
//     company.onlineQuestions?.map((qa) => {
//       try {
//         return JSON.parse(qa);
//       } catch {
//         return { question: qa, solution: "" };
//       }
//     }) || [];

//   return (
//     <div className="space-y-6 px-4 sm:px-6 lg:px-0 max-w-screen-xl mx-auto">
//       <div className="bg-white shadow-md rounded-lg p-6 border overflow-hidden">
//         <h2 className="text-2xl font-bold mb-4 text-blue-800 flex justify-between items-center">
//           Online Assessment Questions
//           <button
//             className="text-white bg-blue-600 rounded-full w-6 h-6 flex items-center justify-center"
//             onClick={() => setShowModal(true)}
//           >
//             +
//           </button>
//         </h2>

//         {parsedOA.length > 0 ? (
//           <div className="space-y-4">
//             {parsedOA.map((qa, index) => (
//               <div
//                 key={index}
//                 className="border rounded-lg shadow-sm bg-gray-100 min-w-0 overflow-hidden"
//               >
//                 {/* Question Accordion */}
//                 <button
//                   onClick={() => toggleQuestionAccordion(index)}
//                   className="w-full text-left px-4 py-3 font-semibold text-gray-800 flex justify-between items-center min-w-0"
//                 >
//                   <span className="truncate">Question {index + 1}</span>
//                   <span className="text-lg">
//                     {openQuestionIndex === index ? "−" : "+"}
//                   </span>
//                 </button>

//                 {openQuestionIndex === index && (
//                   <div className="px-4 pb-4 text-gray-700 leading-relaxed space-y-3 break-words whitespace-pre-wrap">
//                     <p>{qa.question}</p>

//                     {/* Solution Accordion */}
//                     {qa.solution && (
//                       <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
//                         <button
//                           onClick={() => toggleSolutionAccordion(index)}
//                           className="w-full text-left px-4 py-2 font-medium text-blue-700 flex justify-between items-center"
//                         >
//                           <span>View Solution</span>
//                           <span className="text-lg">
//                             {openSolutionIndex === index ? "−" : "+"}
//                           </span>
//                         </button>
//                         {openSolutionIndex === index && (
//                           <div className="px-4 pb-4">
//                             <pre className="bg-gray-900 text-green-200 rounded-lg p-4 overflow-x-auto max-w-full text-sm leading-relaxed whitespace-pre-wrap break-words">
//                               <code>{qa.solution}</code>
//                             </pre>
//                           </div>
//                         )}
//                       </div>
//                     )}
//                   </div>
//                 )}
//               </div>
//             ))}
//           </div>
//         ) : (
//           <p>No online assessment questions yet.</p>
//         )}
//       </div>

//       {/* Modal to add new question */}
//       {showModal && (
//         <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
//           <div className="bg-white p-4 rounded w-96">
//             <h3 className="text-lg font-bold mb-2">Add Online Assessment</h3>
//             <form onSubmit={handleSubmit} className="space-y-3">
//               <textarea
//                 value={question}
//                 onChange={(e) => setQuestion(e.target.value)}
//                 placeholder="Enter question"
//                 className="w-full p-2 border rounded"
//                 required
//               />
//               <textarea
//                 value={solution}
//                 onChange={(e) => setSolution(e.target.value)}
//                 placeholder="Enter solution (optional)"
//                 className="w-full p-2 border rounded"
//               />
//               <div className="flex justify-end gap-2">
//                 <button
//                   type="button"
//                   className="px-3 py-1 border rounded"
//                   onClick={() => setShowModal(false)}
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   className="px-3 py-1 bg-blue-600 text-white rounded"
//                 >
//                   Submit
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default OATab;

import React, { useState } from "react";
import { FaCopy, FaCheck, FaEdit, FaTrash } from "react-icons/fa";
import { API_ENDPOINTS, MESSAGES, CONFIG } from "../../utils/constants";
import { adminAPI } from "../../utils/api";
import SolutionSyntaxBlock from "../SolutionSyntaxBlock";

function OATab({ company, isAdmin, onCompanyUpdate }) {
  const [showModal, setShowModal] = useState(false);
  const [question, setQuestion] = useState("");
  const [solution, setSolution] = useState("");
  const [openQuestionIndex, setOpenQuestionIndex] = useState(null);
  const [openSolutionIndex, setOpenSolutionIndex] = useState({}); // track solution open per question
  const [copiedIndex, setCopiedIndex] = useState(null); // track which solution was copied
  const [editIndex, setEditIndex] = useState(null);
  const [editQuestion, setEditQuestion] = useState("");
  const [editSolution, setEditSolution] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const safeCompany = company || {};

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(API_ENDPOINTS.SUBMISSIONS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Include cookies for authentication
        body: JSON.stringify({
          companyId: safeCompany._id,
          type: "onlineQuestions",
          content: JSON.stringify({ question, solution }),
        }),
      });

      if (!res.ok) throw new Error("Failed to submit");
      const data = await res.json();
      alert(data.message || MESSAGES.SUBMISSION_SUCCESS);

      setQuestion("");
      setSolution("");
      setShowModal(false);
    } catch (err) {
      console.error(err);
      alert(MESSAGES.SUBMISSION_ERROR);
    }
  };

  const toggleQuestionAccordion = (index) => {
    setOpenQuestionIndex(openQuestionIndex === index ? null : index);
  };

  const toggleSolutionAccordion = (questionIdx) => {
    setOpenSolutionIndex((prev) => ({
      ...prev,
      [questionIdx]: !prev[questionIdx],
    }));
  };

  const handleEditOA = (index, questionText, solutionText) => {
    setEditIndex(index);
    setEditQuestion(questionText || "");
    setEditSolution(solutionText || "");
  };

  const handleSaveEditOA = async (e) => {
    e.preventDefault();
    if (editIndex == null || !safeCompany._id) return;
    setActionLoading(true);
    try {
      await adminAPI.updateOAQuestion(safeCompany._id, editIndex, { question: editQuestion, solution: editSolution });
      if (onCompanyUpdate) onCompanyUpdate();
      setEditIndex(null);
      setEditQuestion("");
      setEditSolution("");
    } catch (err) {
      console.error(err);
      alert("Failed to update question.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteOA = async (index) => {
    if (!safeCompany._id || !window.confirm("Delete this OA question?")) return;
    setActionLoading(true);
    try {
      await adminAPI.deleteOAQuestion(safeCompany._id, index);
      if (onCompanyUpdate) onCompanyUpdate();
      setOpenQuestionIndex(null);
    } catch (err) {
      console.error(err);
      alert("Failed to delete question.");
    } finally {
      setActionLoading(false);
    }
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

  // Normalize questions & solutions
  const parsedQuestions =
    safeCompany.onlineQuestions?.map((qa) => {
      if (!qa) return "";
      if (typeof qa === "string") return qa;
      if (typeof qa === "object" && qa.question) return qa.question;
      try {
        const parsed = JSON.parse(qa);
        if (typeof parsed === "string") return parsed;
        if (parsed && typeof parsed === "object" && parsed.question) {
          return parsed.question;
        }
        return String(qa);
      } catch {
        return String(qa);
      }
    }) || [];

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

  const solutions =
    safeCompany.onlineQuestions_solution?.map((sol) => {
      if (!sol) return "";
      let processedSol;
      
      // Handle different input formats
      if (typeof sol === "string") {
        // Try to parse as JSON first (handles cases like ["solution\nhere"])
        try {
          const parsed = JSON.parse(sol);
          // If it's an array, extract the first element
          if (Array.isArray(parsed) && parsed.length > 0) {
            const firstItem = parsed[0];
            if (typeof firstItem === "object" && firstItem !== null) {
              // Try to extract common fields from object
              processedSol = firstItem.solution || firstItem.answer || firstItem.text || firstItem.content || JSON.stringify(firstItem);
            } else {
              processedSol = String(firstItem);
            }
          } else if (typeof parsed === "object" && parsed !== null) {
            // Try to extract common fields from object
            processedSol = parsed.solution || parsed.answer || parsed.text || parsed.content || JSON.stringify(parsed);
          } else {
            processedSol = String(parsed);
          }
        } catch {
          // Not valid JSON, check if it starts and ends with brackets
          // (handles cases where it's stored as a string representation of an array)
          const trimmed = sol.trim();
          if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            // Try one more time to parse after trimming
            try {
              const parsed = JSON.parse(trimmed);
              if (Array.isArray(parsed) && parsed.length > 0) {
                const firstItem = parsed[0];
                if (typeof firstItem === "object" && firstItem !== null) {
                  // Try to extract common fields from object
                  processedSol = firstItem.solution || firstItem.answer || firstItem.text || firstItem.content || JSON.stringify(firstItem);
                } else {
                  processedSol = String(firstItem);
                }
              } else if (typeof parsed === "object" && parsed !== null) {
                // Try to extract common fields from object
                processedSol = parsed.solution || parsed.answer || parsed.text || parsed.content || JSON.stringify(parsed);
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
        const firstItem = sol[0];
        if (typeof firstItem === "object" && firstItem !== null) {
          // Try to extract common fields from object
          processedSol = firstItem.solution || firstItem.answer || firstItem.text || firstItem.content || JSON.stringify(firstItem);
        } else {
          processedSol = String(firstItem);
        }
      } else if (typeof sol === "object" && sol !== null) {
        // If it's an object, try to extract common fields
        processedSol = sol.solution || sol.answer || sol.text || sol.content || JSON.stringify(sol);
      } else {
        processedSol = String(sol);
      }
      
      // Convert escape sequences to actual characters (e.g., \n -> newline)
      return unescapeString(processedSol);
    }) || [];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-5 py-4 sm:py-6 space-y-5 sm:space-y-6 text-slate-200">
      {/* MCQ Questions Section */}
      {safeCompany.mcqQuestions && safeCompany.mcqQuestions.length > 0 && (
        <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-indigo-400 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Multiple Choice Questions (MCQs)
          </h2>
          <div className="space-y-5 sm:space-y-6">
            {safeCompany.mcqQuestions.map((q, qIndex) => (
              <div 
                key={qIndex} 
                className="border border-slate-700/50 rounded-lg bg-slate-800/40 p-4 sm:p-5 hover:border-slate-600 transition-colors"
                data-testid={`mcq-question-${qIndex}`}
              >
                <div className="flex gap-2.5 sm:gap-3 mb-3 sm:mb-4">
                  <span className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-indigo-900/50 text-indigo-300 text-xs sm:text-sm font-bold border border-indigo-700/50">
                    {qIndex + 1}
                  </span>
                  <p className="text-slate-200 font-medium text-sm sm:text-lg leading-relaxed sm:leading-snug min-w-0">
                    {q.question}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 ml-0 sm:ml-10">
                  {[
                    { label: 'A', value: q.optionA },
                    { label: 'B', value: q.optionB },
                    { label: 'C', value: q.optionC },
                    { label: 'D', value: q.optionD }
                  ].map((opt) => opt.value && (
                    <div 
                      key={opt.label}
                      className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-slate-900/50 border border-slate-700/30 text-slate-400"
                    >
                      <span className="font-bold text-indigo-500/80 shrink-0">{opt.label}.</span>
                      <span className="text-xs sm:text-sm leading-relaxed min-w-0">{opt.value}</span>
                    </div>
                  ))}
                </div>

                {q.answer && (
                  <div className="mt-3 sm:mt-4 ml-0 sm:ml-10 flex flex-wrap items-center gap-2 text-emerald-400 bg-emerald-500/5 px-3 py-2 rounded-lg border border-emerald-500/20 w-full sm:w-fit max-w-full">
                    <FaCheck className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-xs sm:text-sm font-semibold tracking-wide leading-snug">
                      Correct Answer: <span className="text-emerald-300 ml-1">{q.answer}</span>
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-indigo-400 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span className="shrink-0">Online Assessment Questions</span>
          <button
            className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 sm:py-1.5 rounded-md shadow-sm hover:shadow-md transition-all duration-200 text-xs sm:text-sm font-medium w-full sm:w-auto"
            onClick={() => setShowModal(true)}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Add Question</span>
          </button>
        </h2>

        {parsedQuestions.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {parsedQuestions.map((q, index) => (
              <div
                key={index}
                className="border border-slate-700 rounded-lg bg-slate-800/60 min-w-0 overflow-hidden"
              >
                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    onClick={() => toggleQuestionAccordion(index)}
                    className="flex-1 text-left px-3 py-3 sm:px-4 sm:py-3 font-semibold text-slate-200 flex justify-between items-center min-w-0 gap-2 text-sm sm:text-base"
                  >
                    <span className="truncate min-w-0">Question {index + 1}</span>
                    <span className="text-base sm:text-lg text-slate-400 shrink-0">
                      {openQuestionIndex === index ? "−" : "+"}
                    </span>
                  </button>
                  {isAdmin && (
                    <div className="flex items-center gap-1 pr-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleEditOA(index, q, solutions[index])}
                        className="p-2 rounded-md text-amber-400 hover:bg-slate-700 transition-colors"
                        title="Edit question"
                      >
                        <FaEdit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteOA(index)}
                        disabled={actionLoading}
                        className="p-2 rounded-md text-red-400 hover:bg-slate-700 transition-colors disabled:opacity-50"
                        title="Delete question"
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {openQuestionIndex === index && (
                  <div className="px-3 pb-4 sm:px-4 text-slate-300 text-sm sm:text-base leading-7 sm:leading-relaxed space-y-4 break-words whitespace-pre-wrap">
                    <p className="min-w-0">{q || `Question ${index + 1}`}</p>

                    {/* Solution Accordion */}
                    {solutions[index] && solutions[index].trim().length > 0 ? (
                      <div className="min-w-0 overflow-hidden rounded-lg border border-slate-700 bg-slate-800/60">
                        <button
                          type="button"
                          onClick={() => toggleSolutionAccordion(index)}
                          className="w-full text-left px-3 py-2.5 sm:px-4 sm:py-2 font-medium text-indigo-400 flex justify-between items-center gap-2 border-b border-slate-700 bg-slate-900/40"
                        >
                          <span>View Solution</span>
                          <span className="text-base sm:text-lg text-slate-400 shrink-0">
                            {openSolutionIndex[index] ? "−" : "+"}
                          </span>
                        </button>
                        {openSolutionIndex[index] && (
                          <div className="p-2 sm:p-3">
                            <SolutionSyntaxBlock
                              code={solutions[index]}
                              toolbar={
                                <button
                                  type="button"
                                  onClick={() => handleCopySolution(solutions[index], index)}
                                  className="rounded-lg bg-slate-800/95 hover:bg-slate-700 text-slate-200 px-2 py-1.5 text-xs font-medium transition-colors border border-slate-600 flex items-center gap-1.5"
                                  title="Copy solution"
                                >
                                  {copiedIndex === index ? (
                                    <>
                                      <FaCheck className="w-3 h-3 shrink-0" />
                                      <span>Copied!</span>
                                    </>
                                  ) : (
                                    <>
                                      <FaCopy className="w-3 h-3 shrink-0" />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>
                              }
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs sm:text-sm text-slate-400 italic">
                        No solution submitted yet.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-400">No online assessment questions yet.</p>
        )}
      </div>

      {/* Modal to add new question */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl w-96 max-w-[90vw]">
            <h3 className="text-lg font-semibold mb-4 text-indigo-400">Add Online Assessment</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Enter question"
                className="w-full p-3 border border-slate-600 rounded-lg bg-slate-900 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <textarea
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
                placeholder="Enter solution (optional)"
                className="w-full p-3 border border-slate-600 rounded-lg bg-slate-900 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

      {/* Modal to edit OA question (admin) */}
      {editIndex !== null && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl w-96 max-w-[90vw]">
            <h3 className="text-lg font-semibold mb-4 text-amber-400">Edit OA Question {editIndex + 1}</h3>
            <form onSubmit={handleSaveEditOA} className="space-y-3">
              <textarea
                value={editQuestion}
                onChange={(e) => setEditQuestion(e.target.value)}
                placeholder="Question"
                className="w-full p-3 border border-slate-600 rounded-lg bg-slate-900 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <textarea
                value={editSolution}
                onChange={(e) => setEditSolution(e.target.value)}
                placeholder="Solution (optional)"
                className="w-full p-3 border border-slate-600 rounded-lg bg-slate-900 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="px-4 py-2 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors"
                  onClick={() => { setEditIndex(null); setEditQuestion(""); setEditSolution(""); }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default OATab;
