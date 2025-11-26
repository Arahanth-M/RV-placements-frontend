// import React, { useState } from "react";

// function GeneralTab({ company = {} }) {
//   const [aboutOpen, setAboutOpen] = useState(false);

//   const formatAboutCompany = (text) => {
//     if (!text) return null;
//     return text.split("\n").map((line, idx) => {
//       const trimmed = line.trim();
//       if (!trimmed) return null;

//       if (/^[-•\d]/.test(trimmed)) {
//         return (
//           <p key={idx} className="mb-2 break-words">
//             <span className="font-bold break-words">{trimmed}</span>
//           </p>
//         );
//       }

//       return (
//         <p key={idx} className="mb-3 leading-relaxed break-words">
//           {trimmed}
//         </p>
//       );
//     });
//   };

//   return (
//     <div className="space-y-6 px-4 sm:px-6 lg:px-0 max-w-screen-xl mx-auto">
//       {/* About */}
//       <div className="bg-white shadow-md rounded-lg p-6 border overflow-hidden">
//         <button
//           onClick={() => setAboutOpen(!aboutOpen)}
//           className="w-full flex justify-between items-center text-xl font-bold text-blue-800"
//         >
//           About The Company
//           <span className="ml-2 text-gray-600">{aboutOpen ? "▲" : "▼"}</span>
//         </button>

//         {aboutOpen && (
//           <div className="mt-4 text-gray-700 leading-relaxed break-words">
//             {formatAboutCompany(company["About The Company"])}
//           </div>
//         )}
//       </div>

//       {/* General Info */}
//       <div className="bg-white shadow-md rounded-lg p-6 border overflow-hidden">
//         <h2 className="text-xl font-bold text-blue-800 mb-4">
//           General Information
//         </h2>
//         <p className="text-lg text-gray-700 mb-3 break-words">
//           <b>Eligibility:</b> {company.eligibility ?? "Not provided"}
//         </p>
//         <p className="text-lg text-gray-700 mb-3 break-words">
//           <b>Business Model:</b> {company.business_model ?? "Not provided"}
//         </p>
//       </div>

//       {/* Roles */}
//       <div className="bg-white shadow-md rounded-lg p-6 border overflow-hidden">
//         <h2 className="text-xl font-bold text-blue-800 mb-4">Roles</h2>
//         {(company.roles ?? []).map((role, index) => (
//           <div
//             key={index}
//             className="border p-4 my-4 rounded-lg bg-gray-50 shadow-sm min-w-0"
//           >
//             <p className="text-lg font-semibold text-blue-700 mb-3 break-words">
//               {role.roleName}
//             </p>

//             {role.ctc && (
//               <div className="mb-4">
//                 <p className="font-bold text-gray-800 mb-2">CTC Split-up:</p>
//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
//                   {Object.entries(role.ctc).map(([key, value]) => (
//                     <div
//                       key={key}
//                       className="flex justify-between bg-white px-3 py-2 border rounded min-w-0"
//                     >
//                       <span className="capitalize font-medium break-words">
//                         {key}
//                       </span>
//                       <span className="text-gray-700 break-words">{value}</span>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}

// <p className="text-gray-700 mb-2 break-words">
//   <b>Stipend:</b> {role.internshipStipend ?? 0}
// </p>

//             {role.finalPayFirstYear && (
//               <p className="text-gray-700 mb-2 break-words">
//                 <b>First Year Pay:</b> {role.finalPayFirstYear}
//               </p>
//             )}
//             {role.finalPayAnnual && (
//               <p className="text-gray-700 break-words">
//                 <b>Annual Pay:</b> {role.finalPayAnnual}
//               </p>
//             )}
//           </div>
//         ))}
//       </div>

     
//     </div>
//   );
// }

// export default GeneralTab;




import React, { useState } from "react";

function GeneralTab({ company = {} }) {
  const [aboutOpen, setAboutOpen] = useState(false);

  // Format CTC value - handles both string and number types
  const formatCTCValue = (value) => {
    if (value === null || value === undefined) {
      return 'N/A';
    }
    
    // If it's already a string, return it as is
    if (typeof value === 'string') {
      return value;
    }
    
    // If it's a number, format it with commas
    if (typeof value === 'number') {
      return value.toLocaleString('en-IN');
    }
    
    // For any other type, convert to string
    return String(value);
  };

  // --- UPDATED FORMATTER ---
  const formatAboutCompany = (text) => {
    if (!text) return null;

    // Replace escaped newlines (\n) with real line breaks
    const normalized = text.replace(/\\n/g, "\n");

    // Split text by multiple newlines
    return normalized.split(/\n+/).map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return null;

      // Section titles like "1. Company Culture & Values:" or "Skills and Experience Valued by the Company:"
      if (/^\d+\.\s+.+?:$/.test(trimmed) || /^[A-Za-z].+?:$/.test(trimmed)) {
        return (
          <p
            key={idx}
            className="mt-4 mb-2 font-bold text-blue-800 text-lg break-words"
          >
            {trimmed}
          </p>
        );
      }

      // Bullet points like "-" or "•"
      if (/^[-•]/.test(trimmed)) {
        return (
          <p
            key={idx}
            className="ml-4 mb-2 text-gray-700 leading-relaxed break-words"
          >
            {trimmed}
          </p>
        );
      }

      // Normal paragraphs
      return (
        <p
          key={idx}
          className="mb-2 text-gray-700 leading-relaxed break-words"
        >
          {trimmed}
        </p>
      );
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-4 md:px-6 lg:px-0 max-w-screen-xl mx-auto">
      {/* About The Company */}
      <div className="bg-white shadow-md rounded-lg p-4 sm:p-6 border overflow-hidden">
        <button
          onClick={() => setAboutOpen(!aboutOpen)}
          className="w-full flex justify-between items-center text-base sm:text-lg md:text-xl font-bold text-blue-800"
        >
          <span className="text-left">About The Company</span>
          <span className="ml-2 text-gray-600 flex-shrink-0">{aboutOpen ? "▲" : "▼"}</span>
        </button>

        {aboutOpen && (
          <div className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-700 leading-relaxed break-words max-h-[400px] sm:max-h-[600px] overflow-y-auto">
            {formatAboutCompany(company["About The Company"])}
          </div>
        )}
      </div>

      {/* General Info */}
      <div className="bg-white shadow-md rounded-lg p-4 sm:p-6 border overflow-hidden">
        <h2 className="text-lg sm:text-xl font-bold text-blue-800 mb-3 sm:mb-4">
          General Information
        </h2>
        <p className="text-sm sm:text-base md:text-lg text-gray-700 mb-2 sm:mb-3 break-words">
          <b>Eligibility:</b> {company.eligibility ?? "Not provided"}
        </p>
        <p className="text-sm sm:text-base md:text-lg text-gray-700 mb-2 sm:mb-3 break-words">
          <b>Business Model:</b> {company.business_model ?? "Not provided"}
        </p>
      </div>

      {/* Roles */}
      <div className="bg-white shadow-md rounded-lg p-4 sm:p-6 border overflow-hidden">
        <h2 className="text-lg sm:text-xl font-bold text-blue-800 mb-3 sm:mb-4">Roles</h2>
        {(company.roles ?? []).map((role, index) => (
          <div
            key={index}
            className="border p-3 sm:p-4 my-3 sm:my-4 rounded-lg bg-gray-50 shadow-sm min-w-0"
          >
            <p className="text-base sm:text-lg font-semibold text-blue-700 mb-2 sm:mb-3 break-words">
              {role.roleName}
            </p>

            {role.ctc && (
              <div className="mb-3 sm:mb-4">
                <p className="font-bold text-gray-800 mb-2 text-sm sm:text-base">CTC Split-up:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  {Object.entries(role.ctc).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex flex-col sm:flex-row sm:justify-between bg-white px-3 py-2 border rounded min-w-0 gap-1 sm:gap-0"
                    >
                      <span className="capitalize font-medium break-words text-xs sm:text-sm">
                        {key}:
                      </span>
                      <span className="text-gray-700 break-words text-xs sm:text-sm sm:text-right">{formatCTCValue(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-sm sm:text-base text-gray-700 mb-2 break-words">
              <b>Stipend:</b> {role.internshipStipend ?? 0}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default GeneralTab;
