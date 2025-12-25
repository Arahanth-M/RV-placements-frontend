

import React, { useState } from "react";

function GeneralTab({ company = {} }) {
  const [aboutOpen, setAboutOpen] = useState(true);

  const formatCTCValue = (value) => {
    if (value === null || value === undefined) return "N/A";
    if (typeof value === "number") return `₹ ${value.toLocaleString("en-IN")}`;
    return value;
  };

  const formatAboutCompany = (text) => {
    if (!text) return null;

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
      
      {/* ABOUT COMPANY */}
      <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl p-6">
        <button
          onClick={() => setAboutOpen(!aboutOpen)}
          className="w-full flex justify-between items-center"
        >
          <h2 className="text-xl font-semibold text-indigo-400">
            About the Company
          </h2>
          <span className="text-slate-400">
            {aboutOpen ? "−" : "+"}
          </span>
        </button>

        {aboutOpen && (
          <div className="mt-4 max-h-[500px] overflow-y-auto pr-2 space-y-2">
            {formatAboutCompany(company["About The Company"])}
          </div>
        )}
      </div>

      {/* GENERAL INFO */}
      <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-indigo-400 mb-4">
          General Information
        </h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-slate-800/60 rounded-lg p-4">
            <p className="text-slate-400 text-sm">Eligibility</p>
            <p className="text-slate-200 mt-1">
              {company.eligibility ?? "Not provided"}
            </p>
          </div>

          <div className="bg-slate-800/60 rounded-lg p-4">
            <p className="text-slate-400 text-sm">Business Model</p>
            <p className="text-slate-200 mt-1">
              {company.business_model ?? "Not provided"}
            </p>
          </div>
        </div>
      </div>

      {/* ROLES */}
      <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-indigo-400 mb-4">
          Roles Offered
        </h2>

        {(company.roles ?? []).map((role, index) => (
          <div
            key={index}
            className="mb-6 bg-gradient-to-br from-slate-800/70 to-slate-900 rounded-xl p-5 border border-slate-700"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              {role.roleName}
            </h3>

            {/* CTC */}
            {role.ctc && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {Object.entries(role.ctc).map(([key, value]) => (
                  <div
                    key={key}
                    className="bg-slate-800 rounded-lg p-4"
                  >
                    <p className="text-slate-400 text-xs uppercase">
                      {key.replace(/_/g, " ")}
                    </p>
                    <p className="text-slate-200 font-medium mt-1">
                      {formatCTCValue(value)}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Stipend */}
            <div className="bg-slate-800 rounded-lg p-4 w-fit">
              <p className="text-slate-400 text-xs">Internship Stipend</p>
              <p className="text-slate-200 font-medium mt-1">
                ₹ {role.internshipStipend ?? 0}
              </p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

export default GeneralTab;
