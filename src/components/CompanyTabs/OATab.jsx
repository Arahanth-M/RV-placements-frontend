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
import { API_ENDPOINTS, MESSAGES, CONFIG } from "../../utils/constants";

function OATab({ company }) {
  const [showModal, setShowModal] = useState(false);
  const [question, setQuestion] = useState("");
  const [solution, setSolution] = useState("");
  const [openQuestionIndex, setOpenQuestionIndex] = useState(null);
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

  // Normalize questions & solutions
  const parsedQuestions =
    company.onlineQuestions?.map((qa) => {
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

  // Function to convert escape sequences to their actual characters and remove special characters
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
    
    // Remove opening and closing square brackets
    processed = processed.replace(/\[/g, "").replace(/\]/g, "");
    
    return processed;
  };

  const solutions =
    company.onlineQuestions_solution?.map((sol) => {
      if (!sol) return "";
      let processedSol;
      if (typeof sol === "string") {
        processedSol = sol;
      } else {
        try {
          processedSol = JSON.parse(sol);
        } catch {
          processedSol = String(sol);
        }
      }
      // Convert escape sequences to actual characters
      return unescapeString(processedSol);
    }) || [];

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-0 max-w-screen-xl mx-auto">
      <div className="bg-white shadow-md rounded-lg p-6 border overflow-hidden">
        <h2 className="text-2xl font-bold mb-4 text-blue-800 flex justify-between items-center">
          Online Assessment Questions
          <button
            className="flex items-center space-x-1.5 bg-slate-700 hover:bg-slate-800 text-white px-3 py-1.5 rounded-md shadow-sm hover:shadow-md transition-all duration-200 text-sm font-medium"
            onClick={() => setShowModal(true)}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Add Question</span>
          </button>
        </h2>

        {parsedQuestions.length > 0 ? (
          <div className="space-y-4">
            {parsedQuestions.map((q, index) => (
              <div
                key={index}
                className="border rounded-lg shadow-sm bg-gray-100 min-w-0 overflow-hidden"
              >
                {/* Question Accordion */}
                <button
                  onClick={() => toggleQuestionAccordion(index)}
                  className="w-full text-left px-4 py-3 font-semibold text-gray-800 flex justify-between items-center min-w-0"
                >
                  <span className="truncate">Question {index + 1}</span>
                  <span className="text-lg">
                    {openQuestionIndex === index ? "−" : "+"}
                  </span>
                </button>

                {openQuestionIndex === index && (
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
                      <p className="text-sm text-gray-500 italic">
                        No solution submitted yet.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p>No online assessment questions yet.</p>
        )}
      </div>

      {/* Modal to add new question */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white p-4 rounded w-96">
            <h3 className="text-lg font-bold mb-2">Add Online Assessment</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Enter question"
                className="w-full p-2 border rounded"
                required
              />
              <textarea
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
                placeholder="Enter solution (optional)"
                className="w-full p-2 border rounded"
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
                  className="px-3 py-1 bg-blue-600 text-white rounded"
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

export default OATab;
