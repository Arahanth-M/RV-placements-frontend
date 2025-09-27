// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";
// import CompanyCard from "../components/CompanyCard";
// import { BASE_URL } from "../utils/constants";
// import { FaFilter } from "react-icons/fa";

// function CompanyStats() {
//   const [companies, setCompanies] = useState([]);
//   const [search, setSearch] = useState("");
//   const [category, setCategory] = useState("all");
//   const [isLoggedIn, setIsLoggedIn] = useState(true);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [showFilter, setShowFilter] = useState(false);
//   const companiesPerPage = 6;

//   const navigate = useNavigate();

//   useEffect(() => {
//     axios
//       .get(BASE_URL + "/api/companies")
//       .then((res) => {
//         setCompanies(res.data);
//         setIsLoggedIn(true);
//       })
//       .catch((err) => {
//         console.error("❌ Error fetching companies:", err);
//         if (err.response && err.response.status === 401) {
//           setIsLoggedIn(false);
//         }
//       });
//   }, []);

//   // Filter companies by search and category
//   const filteredCompanies = companies
//     .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
//     .filter((c) => {
//       if (category === "all") return true;
//       if (category === "internship + fte") {
//         return c.type.toLowerCase().includes("internship + fte");
//       }
//       return c.type.toLowerCase() === category.toLowerCase();
//     });

//   const indexOfLastCompany = currentPage * companiesPerPage;
//   const indexOfFirstCompany = indexOfLastCompany - companiesPerPage;
//   const currentCompanies = filteredCompanies.slice(
//     indexOfFirstCompany,
//     indexOfLastCompany
//   );
//   const totalPages = Math.ceil(filteredCompanies.length / companiesPerPage);

//   return (
//     <div className="p-6 bg-gradient-to-b from-indigo-100 via-white to-indigo-50 min-h-screen relative">

//       {/* Search Input */}
//       <div className="mb-6 flex justify-center">
//         <input
//           type="text"
//           placeholder="Search companies..."
//           value={search}
//           onChange={(e) => {
//             setSearch(e.target.value);
//             setCurrentPage(1);
//           }}
//           className="w-full sm:w-1/2 lg:w-1/3 px-4 py-2 border border-gray-300 
//                      rounded-xl shadow-sm focus:outline-none focus:ring-2 
//                      focus:ring-indigo-400 transition duration-200"
//         />
//       </div>

//       {/* Companies Grid */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
//         {currentCompanies.length > 0 ? (
//           currentCompanies.map((c) => (
//             <CompanyCard
//               key={c._id}
//               company={c}
//               onClick={() => navigate(`/company/${c._id}`)}
//             />
//           ))
//         ) : (
//           <p className="text-gray-500 col-span-full text-center">
//             No companies found.
//           </p>
//         )}
//       </div>

//       {/* Pagination */}
//       {filteredCompanies.length > companiesPerPage && (
//         <div className="flex items-center justify-center gap-3 mt-6">
//           <button
//             onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
//             disabled={currentPage === 1}
//             className="px-4 py-2 bg-indigo-500 text-white rounded-lg disabled:bg-gray-300 transition duration-200"
//           >
//             Prev
//           </button>

//           <span className="text-gray-700 font-medium">
//             Page {currentPage} of {totalPages}
//           </span>

//           <button
//             onClick={() =>
//               setCurrentPage((prev) => Math.min(prev + 1, totalPages))
//             }
//             disabled={currentPage === totalPages}
//             className="px-4 py-2 bg-indigo-500 text-white rounded-lg disabled:bg-gray-300 transition duration-200"
//           >
//             Next
//           </button>
//         </div>
//       )}

//       {/* Floating Filter Button */}
//       <div className="fixed bottom-6 right-6 z-50">
//         <button
//           onClick={() => setShowFilter((prev) => !prev)}
//           className="bg-indigo-500 text-white p-4 rounded-full shadow-lg hover:bg-indigo-600 transition duration-200"
//         >
//           <FaFilter size={20} />
//         </button>

//         {/* Filter Dropdown */}
//         {showFilter && (
//           <div className="mt-2 bg-white border border-gray-300 rounded-lg shadow-lg py-2 w-48 flex flex-col">
//             <button
//               onClick={() => { setCategory("all"); setShowFilter(false); setCurrentPage(1); }}
//               className={`px-4 py-2 text-left hover:bg-indigo-100 ${category === "all" ? "font-semibold" : ""}`}
//             >
//               All
//             </button>
//             <button
//               onClick={() => { setCategory("fte"); setShowFilter(false); setCurrentPage(1); }}
//               className={`px-4 py-2 text-left hover:bg-indigo-100 ${category === "fte" ? "font-semibold" : ""}`}
//             >
//               FTE
//             </button>
//             <button
//               onClick={() => { setCategory("internship + fte"); setShowFilter(false); setCurrentPage(1); }}
//               className={`px-4 py-2 text-left hover:bg-indigo-100 ${category === "internship + fte" ? "font-semibold" : ""}`}
//             >
//               Internship + FTE
//             </button>
//             <button
//               onClick={() => { setCategory("only internship(6 months)"); setShowFilter(false); setCurrentPage(1); }}
//               className={`px-4 py-2 text-left hover:bg-indigo-100 ${category === "only internship(6 months)" ? "font-semibold" : ""}`}
//             >
//               Only Internship
//             </button>
//           </div>
//         )}
//       </div>

//     </div>
//   );
// }

// export default CompanyStats;

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import CompanyCard from "../components/CompanyCard";
import { BASE_URL } from "../utils/constants";
import { FaFilter, FaPlus } from "react-icons/fa";
import { authAPI, companyAPI } from "../utils/api";

function CompanyStats() {
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);

  // Modal + form state
  const [showModal, setShowModal] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: "",
    type: "",
    count: "",
    interviewExperience: [""],
    interviewQuestions: [""],
    onlineQuestions: [""],
  });

  const companiesPerPage = 6;
  const navigate = useNavigate();

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await authAPI.getCurrentUser();
        if (res.data && res.data.user) {
          setUser(res.data.user);
          setIsLoggedIn(true);
        } else {
          setUser(null);
          setIsLoggedIn(false);
        }
      } catch (err) {
        console.error("❌ Error fetching user:", err);
        setUser(null);
        setIsLoggedIn(false);
      }
    };
    fetchUser();
  }, []);

  // Fetch companies
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await companyAPI.getAllCompanies();
        setCompanies(res.data);
      } catch (err) {
        console.error("❌ Error fetching companies:", err);
      }
    };
    fetchCompanies();
  }, []);

  // Filter companies
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

  // Form handlers
  const handleInputChange = (e) => {
    setNewCompany({ ...newCompany, [e.target.name]: e.target.value });
  };

  const handleArrayInputChange = (field, index, value) => {
    const updatedArray = [...newCompany[field]];
    updatedArray[index] = value;
    setNewCompany({ ...newCompany, [field]: updatedArray });
  };

  const addField = (field) => {
    setNewCompany({ ...newCompany, [field]: [...newCompany[field], ""] });
  };

  const removeField = (field, index) => {
    const updatedArray = [...newCompany[field]];
    updatedArray.splice(index, 1);
    setNewCompany({ ...newCompany, [field]: updatedArray });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      alert("⚠️ You must be logged in to add a company.");
      return;
    }
    try {
      await companyAPI.createCompany({ ...newCompany, status: "pending" });
      alert("✅ Company submitted for review!");
      setShowModal(false);
      setNewCompany({
        name: "",
        type: "",
        count: "",
        interviewExperience: [""],
        interviewQuestions: [""],
        onlineQuestions: [""],
      });
    } catch (err) {
      console.error("❌ Error submitting company:", err);
      if (err.response && err.response.data)
        console.log("Server response:", err.response.data);
      alert("Failed to submit company.");
    }
  };

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

      {/* Floating Buttons */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4 items-end">
        {user && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition duration-200"
          >
            <FaPlus size={20} />
          </button>
        )}
        <button
          onClick={() => setShowFilter((prev) => !prev)}
          className="bg-indigo-500 text-white p-4 rounded-full shadow-lg hover:bg-indigo-600 transition duration-200"
        >
          <FaFilter size={20} />
        </button>

        {showFilter && (
          <div className="mt-2 bg-white border border-gray-300 rounded-lg shadow-lg py-2 w-48 flex flex-col">
            <button
              onClick={() => {
                setCategory("all");
                setShowFilter(false);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 text-left hover:bg-indigo-100 ${
                category === "all" ? "font-semibold" : ""
              }`}
            >
              All
            </button>
            <button
              onClick={() => {
                setCategory("fte");
                setShowFilter(false);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 text-left hover:bg-indigo-100 ${
                category === "fte" ? "font-semibold" : ""
              }`}
            >
              FTE
            </button>
            <button
              onClick={() => {
                setCategory("internship + fte");
                setShowFilter(false);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 text-left hover:bg-indigo-100 ${
                category === "internship + fte" ? "font-semibold" : ""
              }`}
            >
              Internship + FTE
            </button>
            <button
              onClick={() => {
                setCategory("only internship(6 months)");
                setShowFilter(false);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 text-left hover:bg-indigo-100 ${
                category === "only internship(6 months)" ? "font-semibold" : ""
              }`}
            >
              Only Internship
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && user && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
            <h2 className="text-xl font-semibold mb-4">Add New Company</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                name="name"
                placeholder="Company Name"
                value={newCompany.name}
                onChange={handleInputChange}
                className="w-full border px-3 py-2 rounded-lg"
                required
              />
              <input
                type="text"
                name="type"
                placeholder="Type (e.g. FTE, Internship + FTE)"
                value={newCompany.type}
                onChange={handleInputChange}
                className="w-full border px-3 py-2 rounded-lg"
                required
              />
              <input
                type="number"
                name="count"
                placeholder="Total Selected Candidates"
                value={newCompany.count}
                onChange={handleInputChange}
                className="w-full border px-3 py-2 rounded-lg"
                required
              />

              {/* Dynamic Interview Experience */}
              <div>
                <label className="font-medium">Interview Experience</label>
                {newCompany.interviewExperience.map((q, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={q}
                      onChange={(e) =>
                        handleArrayInputChange(
                          "interviewExperience",
                          i,
                          e.target.value
                        )
                      }
                      className="border px-2 py-1 rounded-lg flex-1"
                      required
                    />
                    {i > 0 && (
                      <button
                        type="button"
                        onClick={() => removeField("interviewExperience", i)}
                      >
                        ❌
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addField("interviewExperience")}
                  className="text-green-600 font-medium"
                >
                  + Add Experience
                </button>
              </div>

              {/* Dynamic Interview Questions */}
              <div>
                <label className="font-medium">Interview Questions</label>
                {newCompany.interviewQuestions.map((q, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={q}
                      onChange={(e) =>
                        handleArrayInputChange("interviewQuestions", i, e.target.value)
                      }
                      className="border px-2 py-1 rounded-lg flex-1"
                      required
                    />
                    {i > 0 && (
                      <button
                        type="button"
                        onClick={() => removeField("interviewQuestions", i)}
                      >
                        ❌
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addField("interviewQuestions")}
                  className="text-green-600 font-medium"
                >
                  + Add Question
                </button>
              </div>

              {/* Dynamic Online Questions */}
              <div>
                <label className="font-medium">Online Assessment Questions</label>
                {newCompany.onlineQuestions.map((q, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={q}
                      onChange={(e) =>
                        handleArrayInputChange("onlineQuestions", i, e.target.value)
                      }
                      className="border px-2 py-1 rounded-lg flex-1"
                      required
                    />
                    {i > 0 && (
                      <button
                        type="button"
                        onClick={() => removeField("onlineQuestions", i)}
                      >
                        ❌
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addField("onlineQuestions")}
                  className="text-green-600 font-medium"
                >
                  + Add Question
                </button>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 text-white rounded-lg"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CompanyStats;

