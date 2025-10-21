import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CompanyCard from "../components/CompanyCard";
import { BASE_URL, MESSAGES } from "../utils/constants";
import { FaFilter, FaPlus } from "react-icons/fa";
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
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="p-6 pb-0">
              <h2 className="text-xl font-semibold mb-4">Add New Company</h2>
            </div>
            <div className="flex-1 overflow-y-auto px-6">
              <form id="company-form" onSubmit={handleSubmit} className="space-y-4">
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

              {["interviewExperience", "interviewQuestions", "onlineQuestions", "mustDoTopics"].map((field) => (
                <div key={field}>
                  <label className="font-medium">
                    {field
                      .replace(/([A-Z])/g, " $1")
                      .replace(/^./, (str) => str.toUpperCase())}
                  </label>
                  {newCompany[field].map((item, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      {(field === "interviewExperience" || field === "interviewQuestions" || field === "onlineQuestions") ? (
                        <textarea
                          value={item}
                          onChange={(e) =>
                            handleArrayInputChange(field, i, e.target.value)
                          }
                          className="border px-2 py-1 rounded-lg flex-1 resize-vertical min-h-[80px]"
                          placeholder={`Enter ${field.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase()).toLowerCase()}...`}
                          required
                        />
                      ) : (
                        <input
                          type="text"
                          value={item}
                          onChange={(e) =>
                            handleArrayInputChange(field, i, e.target.value)
                          }
                          className="border px-2 py-1 rounded-lg flex-1"
                          required
                        />
                      )}
                      {i > 0 && (
                        <button
                          type="button"
                          onClick={() => removeField(field, i)}
                          className="text-red-500 hover:text-red-700"
                        >
                          ❌
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addField(field)}
                    className="text-green-600 font-medium hover:text-green-700"
                  >
                    + Add {field.includes("Questions") ? "Question" : "Item"}
                  </button>
                </div>
              ))}

              </form>
            </div>
            <div className="p-6 pt-4 border-t border-gray-200">
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 transition duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="company-form"
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-200"
                >
                  Submit
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

