import React, { useState } from "react";

function GeneralTab({ company = {} }) {
  const [aboutOpen, setAboutOpen] = useState(false);

  const formatAboutCompany = (text) => {
    if (!text) return null;
    return text.split("\n").map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return null;

      if (/^[-•\d]/.test(trimmed)) {
        return (
          <p key={idx} className="mb-2 break-words">
            <span className="font-bold break-words">{trimmed}</span>
          </p>
        );
      }

      return (
        <p key={idx} className="mb-3 leading-relaxed break-words">
          {trimmed}
        </p>
      );
    });
  };

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-0 max-w-screen-xl mx-auto">
      {/* About */}
      <div className="bg-white shadow-md rounded-lg p-6 border overflow-hidden">
        <button
          onClick={() => setAboutOpen(!aboutOpen)}
          className="w-full flex justify-between items-center text-xl font-bold text-blue-800"
        >
          About The Company
          <span className="ml-2 text-gray-600">{aboutOpen ? "▲" : "▼"}</span>
        </button>

        {aboutOpen && (
          <div className="mt-4 text-gray-700 leading-relaxed break-words">
            {formatAboutCompany(company["About The Company"])}
          </div>
        )}
      </div>

      {/* General Info */}
      <div className="bg-white shadow-md rounded-lg p-6 border overflow-hidden">
        <h2 className="text-xl font-bold text-blue-800 mb-4">
          General Information
        </h2>
        <p className="text-lg text-gray-700 mb-3 break-words">
          <b>Eligibility:</b> {company.eligibility ?? "Not provided"}
        </p>
        <p className="text-lg text-gray-700 mb-3 break-words">
          <b>Business Model:</b> {company.business_model ?? "Not provided"}
        </p>
      </div>

      {/* Roles */}
      <div className="bg-white shadow-md rounded-lg p-6 border overflow-hidden">
        <h2 className="text-xl font-bold text-blue-800 mb-4">Roles</h2>
        {(company.roles ?? []).map((role, index) => (
          <div
            key={index}
            className="border p-4 my-4 rounded-lg bg-gray-50 shadow-sm min-w-0"
          >
            <p className="text-lg font-semibold text-blue-700 mb-3 break-words">
              {role.roleName}
            </p>

            {role.ctc && (
              <div className="mb-4">
                <p className="font-bold text-gray-800 mb-2">CTC Split-up:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(role.ctc).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex justify-between bg-white px-3 py-2 border rounded min-w-0"
                    >
                      <span className="capitalize font-medium break-words">
                        {key}
                      </span>
                      <span className="text-gray-700 break-words">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

<p className="text-gray-700 mb-2 break-words">
  <b>Stipend:</b> {role.internshipStipend ?? 0}
</p>

            {role.finalPayFirstYear && (
              <p className="text-gray-700 mb-2 break-words">
                <b>First Year Pay:</b> {role.finalPayFirstYear}
              </p>
            )}
            {role.finalPayAnnual && (
              <p className="text-gray-700 break-words">
                <b>Annual Pay:</b> {role.finalPayAnnual}
              </p>
            )}
          </div>
        ))}
      </div>

     
    </div>
  );
}

export default GeneralTab;




