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
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-slate-200">
      <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4 text-indigo-400 flex justify-between items-center">
          Must Do Topics
          <button
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md shadow-sm hover:shadow-md transition-all duration-200 text-sm font-medium"
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
                className="flex items-start gap-3 p-4 rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-slate-800 transition min-w-0"
              >
                <span className="text-indigo-400 font-bold flex-shrink-0">{index + 1}.</span>
                <p className="text-slate-300 leading-relaxed break-words">{topic}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-400 italic">No Must Do Topics provided yet.</p>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl w-96 max-w-[90vw]">
            <h3 className="text-lg font-semibold mb-4 text-indigo-400">Add Must Do Topic</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter the topic that students must prepare for this company..."
                className="w-full p-3 border border-slate-600 rounded-lg bg-slate-900 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="px-4 py-2 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors"
                  onClick={() => {
                    setShowModal(false);
                    setTopic("");
                  }}
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
    </div>
  );
}

export default MustDoTab;
