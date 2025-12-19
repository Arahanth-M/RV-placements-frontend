import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import CompanyCard from "../components/CompanyCard";
import YearStatsTable from "../components/YearStatsTable";
import { BASE_URL, MESSAGES } from "../utils/constants";
import { FaFilter, FaPlus, FaTimes, FaBuilding, FaBriefcase, FaUsers, FaEdit, FaTrash, FaCalendarAlt, FaArrowLeft } from "react-icons/fa";
import { useAuth } from "../utils/AuthContext";
import { companyAPI, yearStatsAPI } from "../utils/api";

function CompanyStats() {
  // Year selection state
  const [selectedYear, setSelectedYear] = useState(null);
  const [yearStatsData, setYearStatsData] = useState([]);
  const [loadingYearStats, setLoadingYearStats] = useState(false);

  // Company cards state (for 2026)
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [cluster, setCluster] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);
  const [showClusterFilter, setShowClusterFilter] = useState(false);
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
  const location = useLocation();
  const { user } = useAuth();
  const clusterFilterRef = useRef(null);

  // Helper function to get user-specific storage keys
  const getStorageKey = (key) => {
    if (!user || !user.userId) return key;
    return `${key}_${user.userId}`;
  };

  // Clear old sessionStorage items when user changes
  useEffect(() => {
    if (user && user.userId) {
      // Clear any old sessionStorage items that don't belong to current user
      const keysToCheck = [
        'companystats_selectedYear',
        'companystats_search',
        'companystats_category',
        'companystats_cluster',
        'companystats_page',
        'fromCompanyCards'
      ];
      
      keysToCheck.forEach(key => {
        // Remove old non-user-specific keys
        if (sessionStorage.getItem(key) && !key.includes('_')) {
          sessionStorage.removeItem(key);
        }
      });
    } else {
      // Clear all company stats related sessionStorage when user logs out
      const keysToRemove = [
        'companystats_selectedYear',
        'companystats_search',
        'companystats_category',
        'companystats_cluster',
        'companystats_page',
        'fromCompanyCards'
      ];
      keysToRemove.forEach(key => {
        // Remove all user-specific and non-user-specific keys
        Object.keys(sessionStorage).forEach(storageKey => {
          if (storageKey.startsWith(key)) {
            sessionStorage.removeItem(storageKey);
          }
        });
      });
    }
  }, [user]);

  // Check for navigation state or sessionStorage to restore selectedYear and company cards state
  useEffect(() => {
    if (!user) return;

    // Check if state was passed from navigation
    if (location.state?.selectedYear !== undefined) {
      const yearToSet = location.state.selectedYear;
      setSelectedYear(yearToSet);
      // Store the selectedYear in sessionStorage
      if (yearToSet !== null) {
        sessionStorage.setItem(getStorageKey('companystats_selectedYear'), String(yearToSet));
      } else {
        sessionStorage.setItem(getStorageKey('companystats_selectedYear'), '');
      }
    } else if (sessionStorage.getItem(getStorageKey('companystats_selectedYear'))) {
      // Check sessionStorage for selectedYear (user-specific)
      const storedYear = sessionStorage.getItem(getStorageKey('companystats_selectedYear'));
      if (storedYear === '') {
        // Empty string means year selection screen (null)
        setSelectedYear(null);
      } else {
        const parsedYear = parseInt(storedYear);
        if (!isNaN(parsedYear)) {
          setSelectedYear(parsedYear);
        }
      }
    }
  }, [location.state, user]);

  // Store selectedYear in sessionStorage whenever it changes (but not on initial mount)
  useEffect(() => {
    if (user && user.userId && selectedYear !== null) {
      sessionStorage.setItem(getStorageKey('companystats_selectedYear'), String(selectedYear));
    } else if (user && user.userId && selectedYear === null) {
      // Store null as empty string to indicate year selection screen
      sessionStorage.setItem(getStorageKey('companystats_selectedYear'), '');
    }
  }, [selectedYear, user]);

  // Restore company cards state if coming back from company details
  useEffect(() => {
    if (!user) return;
    
    if (selectedYear === 2026 && sessionStorage.getItem(getStorageKey('fromCompanyCards')) === 'true') {
      const storedSearch = sessionStorage.getItem(getStorageKey('companystats_search'));
      const storedCategory = sessionStorage.getItem(getStorageKey('companystats_category'));
      const storedCluster = sessionStorage.getItem(getStorageKey('companystats_cluster'));
      const storedPage = sessionStorage.getItem(getStorageKey('companystats_page'));
      
      if (storedSearch !== null) setSearch(storedSearch);
      if (storedCategory !== null) setCategory(storedCategory);
      if (storedCluster !== null) setCluster(storedCluster);
      if (storedPage !== null) setCurrentPage(parseInt(storedPage) || 1);
      
      // Clear the flag after restoring
      sessionStorage.removeItem(getStorageKey('fromCompanyCards'));
    }
  }, [selectedYear, user]);

  // Store company cards state whenever it changes (for restoring after navigation)
  useEffect(() => {
    if (selectedYear === 2026 && user && user.userId) {
      sessionStorage.setItem(getStorageKey('companystats_search'), search);
      sessionStorage.setItem(getStorageKey('companystats_category'), category);
      sessionStorage.setItem(getStorageKey('companystats_cluster'), cluster);
      sessionStorage.setItem(getStorageKey('companystats_page'), String(currentPage));
    }
  }, [selectedYear, search, category, cluster, currentPage, user]);

  // Fetch companies only when 2026 is selected
  useEffect(() => {
    if (selectedYear === 2026) {
      // Set localStorage flag for chatbot visibility
      localStorage.setItem('companystats_selectedYear', '2026');
      
      const fetchCompanies = async () => {
        try {
          const res = await companyAPI.getAllCompanies();
          setCompanies(res.data);
        } catch (err) {
          console.error("❌ Error fetching companies:", err);
        }
      };
      fetchCompanies();
    } else {
      // Clear the flag when not on 2026
      localStorage.setItem('companystats_selectedYear', selectedYear ? String(selectedYear) : '');
    }

    // Cleanup: clear localStorage when component unmounts
    return () => {
      if (selectedYear !== 2026) {
        localStorage.removeItem('companystats_selectedYear');
      }
    };
  }, [selectedYear]);

  // Fetch year stats when 2024 or 2025 is selected
  useEffect(() => {
    if (selectedYear === 2024 || selectedYear === 2025) {
      // Check if user is logged in before fetching
      if (!user) {
        alert("You must be logged in to view 2024 and 2025 statistics.");
        setSelectedYear(null);
        return;
      }

      const fetchYearStats = async () => {
        setLoadingYearStats(true);
        try {
          const res = await yearStatsAPI.getYearStats(selectedYear);
          setYearStatsData(res.data || []);
        } catch (err) {
          console.error(`❌ Error fetching ${selectedYear} stats:`, err);
          if (err.response?.status === 401) {
            alert("You must be logged in to view this year's statistics.");
            setSelectedYear(null);
          } else {
            setYearStatsData([]);
          }
        } finally {
          setLoadingYearStats(false);
        }
      };
      fetchYearStats();
    }
  }, [selectedYear, user]);

  // Close cluster filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (clusterFilterRef.current && !clusterFilterRef.current.contains(event.target)) {
        setShowClusterFilter(false);
      }
    };

    if (showClusterFilter) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showClusterFilter]);

  // Filter companies (only for 2026)
  const filteredCompanies = companies
    .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    .filter((c) => {
      if (category === "all") return true;
      if (category === "internship + fte") {
        return c.type.toLowerCase().includes("internship + fte");
      }
      return c.type.toLowerCase() === category.toLowerCase();
    })
    .filter((c) => {
      if (cluster === "all") return true;
      // Handle null/undefined and trim whitespace for comparison
      const companyCluster = c.cluster ? c.cluster.trim() : null;
      const selectedCluster = cluster.trim();
      return companyCluster === selectedCluster;
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
      // Refresh companies list
      const res = await companyAPI.getAllCompanies();
      setCompanies(res.data);
    } catch (err) {
      console.error("❌ Error submitting company:", err);
      alert(MESSAGES.SUBMISSION_ERROR);
    }
  };

  // Year selection view
  if (selectedYear === null) {
    return (
      <div className="p-4 sm:p-6 bg-gradient-to-b from-indigo-100 via-white to-indigo-50 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-6 sm:mb-8 text-center">
            Company Statistics
          </h1>
          <p className="text-center text-gray-600 mb-8 sm:mb-12 text-sm sm:text-base md:text-lg">
            Select a year to view placement statistics
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[2024, 2025, 2026].map((year) => {
              const requiresAuth = year === 2024 || year === 2025;
              const isDisabled = requiresAuth && !user;
              
              return (
                <button
                  key={year}
                  onClick={() => {
                    if (requiresAuth && !user) {
                      alert("You must be logged in to view 2024 and 2025 statistics.");
                      return;
                    }
                    setSelectedYear(year);
                  }}
                  disabled={isDisabled}
                  className={`bg-white rounded-xl shadow-lg p-6 sm:p-8 transition-all duration-300 border-2 ${
                    isDisabled
                      ? "opacity-50 cursor-not-allowed border-gray-300"
                      : "hover:shadow-2xl hover:scale-105 border-transparent hover:border-indigo-400"
                  }`}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className={`rounded-full p-4 sm:p-5 mb-4 ${
                      isDisabled ? "bg-gray-100" : "bg-indigo-100"
                    }`}>
                      <FaCalendarAlt className={`text-3xl sm:text-4xl ${
                        isDisabled ? "text-gray-400" : "text-indigo-600"
                      }`} />
                    </div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                      {year} Stats
                    </h2>
                    <p className="text-gray-600 text-sm sm:text-base">
                      {year === 2026 ? "View Company Cards" : "View Statistics Table"}
                    </p>
                    {isDisabled && (
                      <p className="text-red-500 text-xs mt-2 font-medium">
                        Login Required
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Year stats table view (2024 or 2025)
  if (selectedYear === 2024 || selectedYear === 2025) {
    return (
      <div className="p-4 sm:p-6 bg-gradient-to-b from-indigo-100 via-white to-indigo-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {loadingYearStats ? (
            <div className="bg-white rounded-xl shadow-lg p-8 sm:p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading {selectedYear} statistics...</p>
            </div>
          ) : (
            <YearStatsTable
              year={selectedYear}
              data={yearStatsData}
              onBack={() => {
                setSelectedYear(null);
                setYearStatsData([]);
              }}
            />
          )}
        </div>
      </div>
    );
  }

  // Company cards view (2026)
  return (
    <div className="p-4 sm:p-6 bg-gradient-to-b from-indigo-100 via-white to-indigo-50 min-h-screen relative">
      <div className="mb-4 sm:mb-6">
        <button
          onClick={() => {
            setSelectedYear(null);
            setCompanies([]);
            setSearch("");
            setCategory("all");
            setCluster("all");
            setCurrentPage(1);
          }}
          className="mb-4 flex items-center text-indigo-600 hover:text-indigo-800 font-medium text-sm sm:text-base"
        >
          <FaArrowLeft className="mr-2" />
          Back to Year Selection
        </button>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex justify-center flex-1 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search companies..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full sm:w-1/2 lg:w-1/3 px-4 py-2 sm:py-3 border border-gray-300 
                         rounded-xl shadow-sm focus:outline-none focus:ring-2 
                         focus:ring-indigo-400 transition duration-200 text-sm sm:text-base"
            />
          </div>
          {/* Cluster Filter Dropdown */}
          <div className="relative" ref={clusterFilterRef}>
            <button
              onClick={() => setShowClusterFilter(!showClusterFilter)}
              className="px-4 py-2 sm:py-3 border border-gray-300 rounded-xl shadow-sm 
                         bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 
                         focus:ring-indigo-400 transition duration-200 text-sm sm:text-base 
                         text-gray-700 font-medium min-w-[200px] sm:min-w-[250px] flex items-center justify-between"
            >
              <span>
                {cluster === "all" 
                  ? "All Clusters" 
                  : cluster === "Computer Science and Engineering"
                  ? "CSE"
                  : cluster === "Electronics and Communication"
                  ? "ECE"
                  : cluster === "Mechanical Engineering"
                  ? "ME"
                  : cluster}
              </span>
              <svg
                className={`w-4 h-4 ml-2 transition-transform ${showClusterFilter ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showClusterFilter && (
              <div className="absolute right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg py-2 w-full min-w-[200px] sm:min-w-[250px] z-50">
                <button
                  onClick={() => {
                    setCluster("all");
                    setShowClusterFilter(false);
                    setCurrentPage(1);
                  }}
                  className={`w-full px-4 py-2 text-left hover:bg-indigo-100 ${
                    cluster === "all" ? "font-semibold bg-indigo-50" : ""
                  }`}
                >
                  All Clusters
                </button>
                <button
                  onClick={() => {
                    setCluster("Computer Science and Engineering");
                    setShowClusterFilter(false);
                    setCurrentPage(1);
                  }}
                  className={`w-full px-4 py-2 text-left hover:bg-indigo-100 ${
                    cluster === "Computer Science and Engineering" ? "font-semibold bg-indigo-50" : ""
                  }`}
                >
                  Computer Science and Engineering
                </button>
                <button
                  onClick={() => {
                    setCluster("Electronics and Communication");
                    setShowClusterFilter(false);
                    setCurrentPage(1);
                  }}
                  className={`w-full px-4 py-2 text-left hover:bg-indigo-100 ${
                    cluster === "Electronics and Communication" ? "font-semibold bg-indigo-50" : ""
                  }`}
                >
                  Electronics and Communication
                </button>
                <button
                  onClick={() => {
                    setCluster("Mechanical Engineering");
                    setShowClusterFilter(false);
                    setCurrentPage(1);
                  }}
                  className={`w-full px-4 py-2 text-left hover:bg-indigo-100 ${
                    cluster === "Mechanical Engineering" ? "font-semibold bg-indigo-50" : ""
                  }`}
                >
                  Mechanical Engineering
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentCompanies.length > 0 ? (
          currentCompanies.map((c) => (
            <CompanyCard
              key={c._id}
              company={c}
            />
          ))
        ) : (
          <p className="text-gray-500 col-span-full text-center">
            {cluster !== "all" 
              ? `No companies in ${cluster} cluster is available.`
              : "No companies found."}
          </p>
        )}
      </div>

      {filteredCompanies.length > companiesPerPage && (
        <div className="flex items-center justify-center gap-1 sm:gap-2 mt-4 sm:mt-6 flex-wrap px-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 sm:px-4 py-2 bg-indigo-500 text-white rounded-lg disabled:bg-gray-300 transition duration-200 text-sm sm:text-base"
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
                  className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition duration-200 text-sm sm:text-base ${
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
            className="px-3 sm:px-4 py-2 bg-indigo-500 text-white rounded-lg disabled:bg-gray-300 transition duration-200 text-sm sm:text-base"
          >
            Next
          </button>
        </div>
      )}

      <div className="fixed bottom-16 sm:bottom-20 right-4 sm:right-6 z-50 flex flex-col gap-3 sm:gap-4 items-end">
        <button
          onClick={() => setShowFilter((prev) => !prev)}
          className="bg-indigo-500 text-white p-3 sm:p-4 rounded-full shadow-lg hover:bg-indigo-600 transition duration-200"
          aria-label="Filter"
        >
          <FaFilter size={18} className="sm:w-5 sm:h-5" />
        </button>

        {user && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-green-500 text-white p-3 sm:p-4 rounded-full shadow-lg hover:bg-green-600 transition duration-200"
            aria-label="Add Company"
          >
            <FaPlus size={18} className="sm:w-5 sm:h-5" />
          </button>
        )}

        {showFilter && (
          <div className="absolute bottom-full mb-2 bg-white border border-gray-300 rounded-lg shadow-lg py-2 w-40 sm:w-48 flex flex-col right-0">
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
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="bg-blue-900 text-gray-300 p-4 sm:p-6 rounded-t-xl sm:rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="bg-white bg-opacity-20 p-1.5 sm:p-2 rounded-lg">
                    <FaBuilding className="text-lg sm:text-xl text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Add New Company</h2>
                    <p className="text-gray-300 text-xs sm:text-sm">Share your placement experience</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-300 hover:text-white hover:bg-white hover:bg-opacity-20 p-1.5 sm:p-2 rounded-lg transition duration-200"
                  aria-label="Close"
                >
                  <FaTimes className="text-lg sm:text-xl" />
                </button>
              </div>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <form id="company-form" onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information Section */}
                <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">
                    <FaBuilding className="mr-2 text-blue-900 text-sm sm:text-base" />
                    Basic Information
                  </h3>
                  <div className="space-y-3 sm:space-y-4">
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
                        className="w-full border border-gray-300 px-3 sm:px-4 py-2 sm:py-3 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition duration-200 text-sm sm:text-base"
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
                        className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition duration-200"
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
                        className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition duration-200"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Experience & Questions Section */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <FaEdit className="mr-2 text-blue-900" />
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
                                    className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 resize-vertical min-h-[100px] transition duration-200"
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
                                    className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition duration-200"
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
                            className="w-full flex items-center justify-center space-x-2 bg-blue-50 border-2 border-dashed border-blue-300 text-blue-900 hover:bg-blue-100 hover:border-blue-400 font-medium py-3 px-4 rounded-lg transition-all duration-200 group"
                          >
                            <div className="bg-blue-100 group-hover:bg-blue-200 p-1 rounded-full transition duration-200">
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
            <div className="bg-blue-900 px-6 py-4 rounded-b-2xl">
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
                  className="px-6 py-3 bg-white text-blue-900 rounded-lg font-medium hover:bg-gray-100 transition duration-200 shadow-lg"
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
