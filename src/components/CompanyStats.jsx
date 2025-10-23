import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CompanyCard from "../components/CompanyCard";
import { BASE_URL, MESSAGES } from "../utils/constants";
import { FaFilter, FaPlus, FaTimes, FaBuilding, FaBriefcase, FaUsers, FaEdit, FaTrash } from "react-icons/fa";
import { useAuth } from "../utils/AuthContext";
import { companyAPI } from "../utils/api";

function CompanyStats() {
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: "",
    type: "",
    count: "",
    interviewExperience: [""],
    interviewQuestions: [""],
    onlineQuestions: [""],
    mustDoTopics: [""],
  });

  const companiesPerPage = 6;
  const navigate = useNavigate();
  const { user } = useAuth();

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

  // 🔒 Frontend validation
  const validateCompany = (company) => {
    const nameRegex = /^[a-zA-Z0-9\s]{2,50}$/;
    if (!nameRegex.test(company.name)) {
      return "Invalid company name. Use 2–50 letters/numbers only.";
    }

    

    if (!Number.isInteger(Number(company.count)) || company.count < 0) {
      return "Count must be a positive integer.";
    }

    const noScriptRegex = /<script.*?>.*?<\/script>/gi;

    const checkArrayFields = (arr, fieldName) => {
      for (let item of arr) {
        if (!item.trim()) return `${fieldName} cannot be empty.`;
        if (noScriptRegex.test(item))
          return `Malicious script detected in ${fieldName}.`;
      }
      return null;
    };

    let error;
    error = checkArrayFields(company.interviewExperience, "Interview Experience");
    if (error) return error;
    error = checkArrayFields(company.interviewQuestions, "Interview Questions");
    if (error) return error;
    error = checkArrayFields(company.onlineQuestions, "Online Questions");
    if (error) return error;
    error = checkArrayFields(company.mustDoTopics, "Must Do Topics");
    if (error) return error;

    return null; // ✅ all valid
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert(MESSAGES.AUTH_ERRORS.NOT_LOGGED_IN);
      return;
    }

    const errorMsg = validateCompany(newCompany);
    if (errorMsg) {
      alert(`❌ ${errorMsg}`);
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
        mustDoTopics: [""],
      });
    } catch (err) {
      console.error("❌ Error submitting company:", err);
      alert(MESSAGES.SUBMISSION_ERROR);
    }
  };

  return (
    <div className="p-6 bg-gradient-to-b from-indigo-100 via-white to-indigo-50 min-h-screen relative">
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

      {filteredCompanies.length > companiesPerPage && (
        <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-indigo-500 text-white rounded-lg disabled:bg-gray-300 transition duration-200"
          >
            Prev
          </button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
              // Show first page, last page, current page, and pages around current page
              const shouldShow = 
                pageNum === 1 || 
                pageNum === totalPages || 
                Math.abs(pageNum - currentPage) <= 1 ||
                (currentPage <= 3 && pageNum <= 4) ||
                (currentPage >= totalPages - 2 && pageNum >= totalPages - 3);

              if (!shouldShow) {
                // Show ellipsis for gaps
                if (pageNum === 2 && currentPage > 4) {
                  return <span key={`ellipsis-${pageNum}`} className="px-2 text-gray-500">...</span>;
                }
                if (pageNum === totalPages - 1 && currentPage < totalPages - 3) {
                  return <span key={`ellipsis-${pageNum}`} className="px-2 text-gray-500">...</span>;
                }
                return null;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-2 rounded-lg transition duration-200 ${
                    pageNum === currentPage
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

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

      <div className="fixed bottom-20 right-6 z-50 flex flex-col gap-4 items-end">
        <button
          onClick={() => setShowFilter((prev) => !prev)}
          className="bg-indigo-500 text-white p-4 rounded-full shadow-lg hover:bg-indigo-600 transition duration-200"
        >
          <FaFilter size={20} />
        </button>

        {user && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition duration-200"
          >
            <FaPlus size={20} />
          </button>
        )}

        {showFilter && (
          <div className="absolute bottom-full mb-2 bg-white border border-gray-300 rounded-lg shadow-lg py-2 w-48 flex flex-col">
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

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                    <FaBuilding className="text-xl" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Add New Company</h2>
                    <p className="text-indigo-100 text-sm">Share your placement experience</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition duration-200"
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <form id="company-form" onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information Section */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <FaBuilding className="mr-2 text-indigo-600" />
                    Basic Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        placeholder="e.g., Google, Microsoft, Amazon"
                        value={newCompany.name}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Job Type *
                      </label>
                      <input
                        type="text"
                        name="type"
                        placeholder="e.g., FTE, Internship + FTE, Only Internship"
                        value={newCompany.type}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Total Selected Candidates *
                      </label>
                      <input
                        type="number"
                        name="count"
                        placeholder="e.g., 25, 50, 100"
                        value={newCompany.count}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Experience & Questions Section */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <FaEdit className="mr-2 text-indigo-600" />
                    Experience & Questions
                  </h3>
                  <div className="space-y-6">
                    {["interviewExperience", "interviewQuestions", "onlineQuestions", "mustDoTopics"].map((field) => (
                      <div key={field} className="bg-white rounded-lg p-4 border border-gray-200">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          {field === "interviewExperience" && "Interview Experience"}
                          {field === "interviewQuestions" && "Interview Questions"}
                          {field === "onlineQuestions" && "Online Assessment Questions"}
                          {field === "mustDoTopics" && "Must Do Topics"}
                        </label>
                        
                        <div className="space-y-3">
                          {newCompany[field].map((item, i) => (
                            <div key={i} className="flex gap-3 items-start">
                              <div className="flex-1">
                                {(field === "interviewExperience" || field === "interviewQuestions" || field === "onlineQuestions") ? (
                                  <textarea
                                    value={item}
                                    onChange={(e) =>
                                      handleArrayInputChange(field, i, e.target.value)
                                    }
                                    className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-vertical min-h-[100px] transition duration-200"
                                    placeholder={`Enter ${field === "interviewExperience" ? "your interview experience" : field === "interviewQuestions" ? "interview questions asked" : field === "onlineQuestions" ? "online assessment questions" : "topics to focus on"}...`}
                                    required
                                  />
                                ) : (
                                  <input
                                    type="text"
                                    value={item}
                                    onChange={(e) =>
                                      handleArrayInputChange(field, i, e.target.value)
                                    }
                                    className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                                    placeholder="Enter topic..."
                                    required
                                  />
                                )}
                              </div>
                              {i > 0 && (
                                <button
                                  type="button"
                                  onClick={() => removeField(field, i)}
                                  className="mt-3 p-2 text-red-500 hover:bg-red-50 rounded-lg transition duration-200"
                                  title="Remove this item"
                                >
                                  <FaTrash className="text-sm" />
                                </button>
                              )}
                            </div>
                          ))}
                          
                          <button
                            type="button"
                            onClick={() => addField(field)}
                            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-50 to-blue-50 border-2 border-dashed border-indigo-300 text-indigo-600 hover:from-indigo-100 hover:to-blue-100 hover:border-indigo-400 font-medium py-3 px-4 rounded-lg transition-all duration-200 group"
                          >
                            <div className="bg-indigo-100 group-hover:bg-indigo-200 p-1 rounded-full transition duration-200">
                              <FaPlus className="text-sm" />
                            </div>
                            <span>Add {field.includes("Questions") ? "Question" : "Item"}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-2xl border-t border-gray-200">
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400 transition duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="company-form"
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-blue-700 transition duration-200 shadow-lg"
                >
                  Submit for Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CompanyStats;

