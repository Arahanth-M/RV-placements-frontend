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
  const [openIndexP, setOpenIndexP] = useState(null);

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

  // Normalize interview process
  let interviewProcess = [];
  if (typeof company.interviewProcess === "string") {
    interviewProcess = company.interviewProcess
      .split(/(?=Round\s+\d+:)/)
      .map((round) => round.trim())
      .filter((round) => round.length > 0);
  } else if (Array.isArray(company.interviewProcess)) {
    interviewProcess = company.interviewProcess;
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
                  <div className="px-4 pb-4 text-gray-700 leading-relaxed break-words whitespace-pre-wrap">
                    {q}
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
          <div className="space-y-4">
            {interviewProcess.map((round, index) => (
              <div
                key={index}
                className="border rounded-lg shadow-sm bg-gray-50 min-w-0 overflow-hidden"
              >
                <button
                  onClick={() =>
                    setOpenIndexP(openIndexP === index ? null : index)
                  }
                  className="w-full text-left px-4 py-3 font-semibold text-gray-800 flex justify-between items-center min-w-0"
                >
                  <span className="truncate">
                    {round.split(":")[0]}:
                  </span>
                  <span className="text-lg">
                    {openIndexP === index ? "−" : "+"}
                  </span>
                </button>
                {openIndexP === index && (
                  <div className="px-4 pb-4 text-gray-700 leading-relaxed break-words whitespace-pre-wrap">
                    {round.substring(round.indexOf(":") + 1).trim()}
                  </div>
                )}
              </div>
            ))}
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

export default InterviewTab;


