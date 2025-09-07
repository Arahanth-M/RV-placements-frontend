import React, { useState } from "react";

function InterviewTab({ company }) {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const interviewQuestions = Array.isArray(company.interviewQuestions)
    ? company.interviewQuestions
    : company.interviewQuestions
    ? [company.interviewQuestions]
    : [];

  
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
    <div className="space-y-6">
      
      {interviewQuestions.length > 0 && (
        <div className="bg-white shadow-md rounded-lg p-6 border">
          <h2 className="text-2xl font-bold mb-4 text-blue-800">
            Interview Questions
          </h2>
          <div className="space-y-4">
            {interviewQuestions.map((q, index) => (
              <div
                key={index}
                className="border rounded-lg shadow-sm bg-gray-100"
              >
                
                <button
                  onClick={() => toggleAccordion(index)}
                  className="w-full text-left px-4 py-3 font-semibold text-gray-800 flex justify-between items-center"
                >
                  <span>Question {index + 1}</span>
                  <span className="text-lg">
                    {openIndex === index ? "−" : "+"}
                  </span>
                </button>

      
                {openIndex === index && (
                  <div className="px-4 pb-4 text-gray-700 leading-relaxed">
                    {q}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      
      {interviewProcess.length > 0 && (
        <div className="bg-white shadow-md rounded-lg p-6 border">
          <h2 className="text-2xl font-bold mb-4 text-blue-800">
            Interview Process
          </h2>
          <div className="space-y-6 text-gray-700 leading-relaxed">
            {interviewProcess.map((round, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-md shadow-sm">
                <p className="font-semibold text-blue-900 mb-2">
                  {round.split(":")[0]}:
                </p>
                <p className="whitespace-pre-line">
                  {round.substring(round.indexOf(":") + 1).trim()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default InterviewTab;


