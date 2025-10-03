import React from "react";
import { useNavigate } from "react-router-dom";

function CompanyCard({ company }) {
  const navigate = useNavigate();

  // Helper function to get company initials
  const getCompanyInitials = () => {
    if (!company.name) return 'XX';
    
    const words = company.name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return words[0].substring(0, 2).toUpperCase();
  };

  return (
    <div
      onClick={() => navigate(`/companies/${company._id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(`/companies/${company._id}`);
        }
      }}
      className="bg-white border border-gray-200 rounded-2xl shadow-md p-6 cursor-pointer 
                 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 ease-in-out
                 hover:border-indigo-400"
      data-testid="company-card"
    >
      {/* Company Logo/Header Section */}
      <div className="flex items-center mb-4">
        <div 
          className="w-12 h-12 rounded-lg shadow-sm border border-gray-200 mr-3 bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-lg flex items-center justify-center"
          data-testid="company-initials"
        >
          {getCompanyInitials()}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-extrabold text-gray-800 tracking-tight">
            {company.name}
          </h2>
          <p className="text-sm text-gray-500 italic">{company.type}</p>
        </div>
      </div>

      <div className="mb-3">
        <span className="font-semibold text-gray-700">Date of interview: </span>
        <span className="text-gray-600">{company.date_of_visit}</span>
      </div>

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

      {/* <div className="flex items-center gap-2 bg-gradient-to-r from-indigo-100 to-indigo-50 
                      rounded-lg px-3 py-2 w-fit">
        <span className="font-semibold text-indigo-600">Role:</span>
        <span className="text-gray-800">{company.roles[0]?.roleName}</span>
      </div> */}
      
    </div>
  );
}

export default CompanyCard;