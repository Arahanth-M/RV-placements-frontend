import React from "react";

function AboutTab({ company = {} }) {
  const formatAboutCompany = (text) => {
    if (!text) return (
      <div className="text-slate-400 p-4">
        <p>No about information available for this company.</p>
      </div>
    );

    const normalized = text.replace(/\\n/g, "\n");

    return normalized.split(/\n+/).map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return null;

      if (/^\d+\.\s+.+?:$/.test(trimmed) || /^[A-Za-z].+?:$/.test(trimmed)) {
        return (
          <h3
            key={idx}
            className="mt-4 text-indigo-400 font-semibold text-lg"
          >
            {trimmed}
          </h3>
        );
      }

      if (/^[-•]/.test(trimmed)) {
        return (
          <p
            key={idx}
            className="ml-4 text-slate-300 leading-relaxed"
          >
            {trimmed}
          </p>
        );
      }

      return (
        <p
          key={idx}
          className="text-slate-300 leading-relaxed"
        >
          {trimmed}
        </p>
      );
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-slate-200">
      <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-indigo-400 mb-4">
          About {company.name || "the Company"}
        </h2>
        <div className="overflow-y-auto pr-2 space-y-2">
          {formatAboutCompany(company["About The Company"])}
        </div>
      </div>
    </div>
  );
}

export default AboutTab;
