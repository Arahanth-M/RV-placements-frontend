import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import CompanyCard from "../components/CompanyCard";
import { BASE_URL } from "../utils/constants";

function CompanyStats() {
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState(""); 
  const [isLoggedIn, setIsLoggedIn] = useState(true); 
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(BASE_URL+"/api/companies", { withCredentials: true })
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

  const filteredCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  if (!isLoggedIn) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen bg-gradient-to-b from-indigo-100 via-white to-indigo-50">
        <p className="text-gray-700 text-lg font-medium">
          Please <span className="text-indigo-600 font-semibold cursor-pointer"
          onClick={() => navigate("/login")}>login</span> to view the data.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-b from-indigo-100 via-white to-indigo-50 min-h-screen">

      
      <div className="mb-6 flex justify-center">
        <input
          type="text"
          placeholder="Search companies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-1/2 lg:w-1/3 px-4 py-2 border border-gray-300 
                     rounded-xl shadow-sm focus:outline-none focus:ring-2 
                     focus:ring-indigo-400"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCompanies.length > 0 ? (
          filteredCompanies.map((c) => (
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
    </div>
  );
}

export default CompanyStats;
