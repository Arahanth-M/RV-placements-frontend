import React, { useState } from "react";

function OATab({ company }) {
  const [openQuestionIndex, setOpenQuestionIndex] = useState(null);
  const [openSolutionIndex, setOpenSolutionIndex] = useState(null);

  const toggleQuestionAccordion = (index) => {
    setOpenQuestionIndex(openQuestionIndex === index ? null : index);
    setOpenSolutionIndex(null); // collapse solution when switching question
  };

  const toggleSolutionAccordion = (index) => {
    setOpenSolutionIndex(openSolutionIndex === index ? null : index);
  };

  return (
    <div>
      
      {company.mcqQuestions && company.mcqQuestions.length > 0 && (
        <div className="bg-white shadow-md rounded-lg p-6 border mb-6">
          <h2 className="text-2xl font-bold mb-4 text-blue-800">MCQs</h2>
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
        <div className="bg-white shadow-md rounded-lg p-6 border">
          <h2 className="text-2xl font-bold mb-4 text-blue-800">
            Online Questions
          </h2>
          <div className="space-y-4">
            {company.onlineQuestions.map((q, index) => (
              <div
                key={index}
                className="border rounded-lg shadow-sm bg-gray-100"
              >
              
                <button
                  onClick={() => toggleQuestionAccordion(index)}
                  className="w-full text-left px-4 py-3 font-semibold text-gray-800 flex justify-between items-center"
                >
                  <span>Question {index + 1}</span>
                  <span className="text-lg">
                    {openQuestionIndex === index ? "−" : "+"}
                  </span>
                </button>

                {openQuestionIndex === index && (
                  <div className="px-4 pb-4 text-gray-700 leading-relaxed space-y-3">
                    
                    <p>{q}</p>

                    
                    {company.onlineQuestions_solution &&
                      company.onlineQuestions_solution[index] && (
                        <div className="border rounded-lg bg-white shadow-sm">
                          <button
                            onClick={() => toggleSolutionAccordion(index)}
                            className="w-full text-left px-4 py-2 font-medium text-blue-700 flex justify-between items-center"
                          >
                            <span>View Solution</span>
                            <span className="text-lg">
                              {openSolutionIndex === index ? "−" : "+"}
                            </span>
                          </button>

                         
                          {openSolutionIndex === index && (
                            <div className="px-4 pb-4">
                              <pre className="bg-gray-900 text-green-200 rounded-lg p-4 overflow-x-auto text-sm leading-relaxed">
                                <code className="language-cpp">
                                  {company.onlineQuestions_solution[index]}
                                </code>
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default OATab;



