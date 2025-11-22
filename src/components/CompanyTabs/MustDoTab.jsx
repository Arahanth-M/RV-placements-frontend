import React, { useState } from "react";
import { API_ENDPOINTS, MESSAGES } from "../../utils/constants";

function MustDoTab({ company = {} }) {
  const [showModal, setShowModal] = useState(false);
  const [topic, setTopic] = useState("");
  const topics = company.Must_Do_Topics ?? [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(API_ENDPOINTS.SUBMISSIONS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Include cookies for authentication
        body: JSON.stringify({
          companyId: company._id,
          type: "mustDoTopics",
          content: topic,
        }),
      });

      if (!res.ok) throw new Error("Failed to submit");
      const data = await res.json();
      alert(data.message || MESSAGES.SUBMISSION_SUCCESS);

      setTopic("");
      setShowModal(false);
    } catch (err) {
      console.error(err);
      alert(MESSAGES.SUBMISSION_ERROR);
    }
  };

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-0 max-w-screen-xl mx-auto">
      <div className="bg-white shadow-md rounded-lg p-6 border overflow-hidden">
        <h2 className="text-2xl font-bold mb-4 text-blue-800 flex justify-between items-center">
          Must Do Topics
          <button
            className="flex items-center space-x-1.5 bg-slate-700 hover:bg-slate-800 text-white px-3 py-1.5 rounded-md shadow-sm hover:shadow-md transition-all duration-200 text-sm font-medium"
            onClick={() => setShowModal(true)}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Add Topic</span>
          </button>
        </h2>

        {topics.length > 0 ? (
          <div className="space-y-3">
            {topics.map((topic, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg border bg-gray-50 shadow-sm hover:shadow-md transition min-w-0"
              >
                <span className="text-blue-600 font-bold flex-shrink-0">{index + 1}.</span>
                <p className="text-gray-800 leading-relaxed break-words">{topic}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 italic">No Must Do Topics provided yet.</p>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white p-4 rounded w-96 max-w-[90vw]">
            <h3 className="text-lg font-bold mb-2">Add Must Do Topic</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter the topic that students must prepare for this company..."
                className="w-full p-2 border rounded min-h-[100px]"
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="px-3 py-1 border rounded hover:bg-gray-50 transition-colors"
                  onClick={() => {
                    setShowModal(false);
                    setTopic("");
                  }}
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

export default MustDoTab;
