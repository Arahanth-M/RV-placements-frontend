import React, { useState, useMemo } from "react";
import { FaArrowLeft, FaSearch } from "react-icons/fa";

function YearStatsTable({ year, data, onBack }) {
  const [searchTerm, setSearchTerm] = useState("");

  // Filter data based on search term
  // Search in all fields, but prioritize company name fields
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) {
      return data || [];
    }

    const searchLower = searchTerm.toLowerCase();
    return (data || []).filter((row) => {
      // Check all fields for the search term
      return Object.entries(row).some(([key, value]) => {
        // Skip MongoDB internal fields
        if (key === "_id" || key === "__v") {
          return false;
        }
        
        // Convert value to string and search
        const valueStr = value !== null && value !== undefined 
          ? String(value).toLowerCase() 
          : "";
        
        // Prioritize company name fields
        if (key.toLowerCase().includes("company") || key.toLowerCase().includes("name")) {
          return valueStr.includes(searchLower);
        }
        
        // Also search in other fields
        return valueStr.includes(searchLower);
      });
    });
  }, [data, searchTerm]);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
        <button
          onClick={onBack}
          className="mb-4 flex items-center text-indigo-600 hover:text-indigo-800 font-medium text-sm sm:text-base"
        >
          <FaArrowLeft className="mr-2" />
          Back to Year Selection
        </button>
        <p className="text-gray-600 text-center py-8">No data available for {year} stats.</p>
      </div>
    );
  }

  // Get all unique keys from all objects to create table headers
  const allKeys = new Set();
  data.forEach((item) => {
    Object.keys(item).forEach((key) => {
      // Exclude MongoDB internal fields
      if (key !== "_id" && key !== "__v") {
        allKeys.add(key);
      }
    });
  });

  const headers = Array.from(allKeys);

  // Helper function to format cell values
  const formatCellValue = (value) => {
    if (value === null || value === undefined) {
      return "N/A";
    }
    if (typeof value === "object") {
      return JSON.stringify(value);
    }
    return String(value);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <button
          onClick={onBack}
          className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium text-sm sm:text-base mb-4"
        >
          <FaArrowLeft className="mr-2" />
          Back to Year Selection
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            {year} Placement Statistics
          </h2>
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by company name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
            />
          </div>
        </div>
        {searchTerm && (
          <p className="text-sm text-gray-600 mt-2">
            Showing {filteredData.length} of {data.length} results
          </p>
        )}
      </div>

      {filteredData.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-gray-600">No results found for "{searchTerm}"</p>
          <button
            onClick={() => setSearchTerm("")}
            className="mt-4 text-indigo-600 hover:text-indigo-800 font-medium text-sm"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {headers.map((header) => (
                  <th
                    key={header}
                    className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {header.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((row, index) => (
                <tr key={row._id || index} className="hover:bg-gray-50">
                  {headers.map((header) => (
                    <td
                      key={header}
                      className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-700"
                    >
                      {formatCellValue(row[header])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default YearStatsTable;
