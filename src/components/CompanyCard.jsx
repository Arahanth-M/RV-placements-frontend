import React from "react";

function CompanyCard({ company, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-2xl shadow-md p-6 cursor-pointer 
                 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 ease-in-out
                 hover:border-indigo-400"
    >

      <h2 className="text-2xl font-extrabold text-gray-800 mb-2 tracking-tight">
        {company.name}
      </h2>

      
      <p className="text-sm text-gray-500 mb-3 italic">{company.type}</p>

      <div className="mb-3">
        <span className="font-semibold text-gray-700">Business Model: </span>
        <span className="text-gray-600">{company.business_model}</span>
      </div>

      
      <div className="mb-3">
        <span className="font-semibold text-gray-700">Eligibility: </span>
        <span className="text-gray-600">{company.eligibility}</span>
      </div>

      
      <div className="mb-3">
      
        <span className="font-semibold text-gray-700">Count: </span>
        
        <span className="text-gray-600">{company["count"] || "Not available"}</span>
      </div>

      
      <div className="flex items-center gap-2 bg-gradient-to-r from-indigo-100 to-indigo-50 
                      rounded-lg px-3 py-2 w-fit">
        <span className="font-semibold text-indigo-600">Role:</span>
        <span className="text-gray-800">{company.roles[0]?.roleName}</span>
      </div>
    </div>
  );
}

export default CompanyCard;

