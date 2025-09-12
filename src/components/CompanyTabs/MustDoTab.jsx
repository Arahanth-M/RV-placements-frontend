import React from "react";

function MustDoTab({ company }) {
  if (!company.Must_Do_Topics || company.Must_Do_Topics.length === 0) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6 border">
        <p className="text-gray-600 italic">No Must Do Topics provided.</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-6 border">
      <h2 className="text-2xl font-bold mb-4 text-blue-800">Must Do Topics</h2>
      <div className="space-y-3">
        {company.Must_Do_Topics.map((topic, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-3 rounded-lg border bg-gray-50 shadow-sm hover:shadow-md transition"
          >
            <span className="text-blue-600 font-bold">{index + 1}.</span>
            <p className="text-gray-800 leading-relaxed">{topic}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MustDoTab;
