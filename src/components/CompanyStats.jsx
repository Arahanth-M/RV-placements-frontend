import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import CompanyCard from "../components/CompanyCard";
import { BASE_URL } from "../utils/constants";
import { FaFilter } from "react-icons/fa";

function CompanyStats() {
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false); // toggle filter dropdown
  const companiesPerPage = 6;

  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(BASE_URL + "/api/companies")
      .then((res) => {
        setCompanies(res.data);
        setIsLoggedIn(true);
      })
      .catch((err) => {
        console.error("❌ Error fetching companies:", err);
        if (err.response && err.response.status === 401) {
          setIsLoggedIn(false);
        }
      });
  }, []);

  // Filter companies by search and category
  const filteredCompanies = companies
    .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    .filter((c) => {
      if (category === "all") return true;
      if (category === "internship + fte") {
        return c.type.toLowerCase().includes("internship + fte");
      }
      return c.type.toLowerCase() === category.toLowerCase();
    });

  const indexOfLastCompany = currentPage * companiesPerPage;
  const indexOfFirstCompany = indexOfLastCompany - companiesPerPage;
  const currentCompanies = filteredCompanies.slice(
    indexOfFirstCompany,
    indexOfLastCompany
  );
  const totalPages = Math.ceil(filteredCompanies.length / companiesPerPage);

  return (
    <div className="p-6 bg-gradient-to-b from-indigo-100 via-white to-indigo-50 min-h-screen relative">

      {/* Search Input */}
      <div className="mb-6 flex justify-center">
        <input
          type="text"
          placeholder="Search companies..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full sm:w-1/2 lg:w-1/3 px-4 py-2 border border-gray-300 
                     rounded-xl shadow-sm focus:outline-none focus:ring-2 
                     focus:ring-indigo-400 transition duration-200"
        />
      </div>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentCompanies.length > 0 ? (
          currentCompanies.map((c) => (
            <CompanyCard
              key={c._id}
              company={c}
              onClick={() => navigate(`/company/${c._id}`)}
            />
          ))
        ) : (
          <p className="text-gray-500 col-span-full text-center">
            No companies found.
          </p>
        )}
      </div>

      {/* Pagination */}
      {filteredCompanies.length > companiesPerPage && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-indigo-500 text-white rounded-lg disabled:bg-gray-300 transition duration-200"
          >
            Prev
          </button>

          <span className="text-gray-700 font-medium">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-indigo-500 text-white rounded-lg disabled:bg-gray-300 transition duration-200"
          >
            Next
          </button>
        </div>
      )}

      {/* Floating Filter Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setShowFilter((prev) => !prev)}
          className="bg-indigo-500 text-white p-4 rounded-full shadow-lg hover:bg-indigo-600 transition duration-200"
        >
          <FaFilter size={20} />
        </button>

        {/* Filter Dropdown */}
        {showFilter && (
          <div className="mt-2 bg-white border border-gray-300 rounded-lg shadow-lg py-2 w-48 flex flex-col">
            <button
              onClick={() => { setCategory("all"); setShowFilter(false); setCurrentPage(1); }}
              className={`px-4 py-2 text-left hover:bg-indigo-100 ${category === "all" ? "font-semibold" : ""}`}
            >
              All
            </button>
            <button
              onClick={() => { setCategory("fte"); setShowFilter(false); setCurrentPage(1); }}
              className={`px-4 py-2 text-left hover:bg-indigo-100 ${category === "fte" ? "font-semibold" : ""}`}
            >
              FTE
            </button>
            <button
              onClick={() => { setCategory("internship + fte"); setShowFilter(false); setCurrentPage(1); }}
              className={`px-4 py-2 text-left hover:bg-indigo-100 ${category === "internship + fte" ? "font-semibold" : ""}`}
            >
              Internship + FTE
            </button>
            <button
              onClick={() => { setCategory("only internship(6 months)"); setShowFilter(false); setCurrentPage(1); }}
              className={`px-4 py-2 text-left hover:bg-indigo-100 ${category === "only internship(6 months)" ? "font-semibold" : ""}`}
            >
              Only Internship
            </button>
          </div>
        )}
      </div>

    </div>
  );
}

export default CompanyStats;
