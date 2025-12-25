import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import CompanyCard from "../components/CompanyCard";
import YearStatsTable from "../components/YearStatsTable";
import { BASE_URL, MESSAGES } from "../utils/constants";
import { FaFilter, FaPlus, FaCalendarAlt, FaBuilding, FaChartBar, FaBriefcase, FaUsers, FaArrowLeft } from "react-icons/fa";
import { useAuth } from "../utils/AuthContext";
import { companyAPI, yearStatsAPI } from "../utils/api";
import PlacementForm from "./PlacementForm";

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
  const [showPlacementForm, setShowPlacementForm] = useState(false);
  const [placementCompanyId, setPlacementCompanyId] = useState(null);
  const [placementCompanyName, setPlacementCompanyName] = useState('');

  const companiesPerPage = 6;
  const navigate = useNavigate();
  const location = useLocation();
  const { user, studentData } = useAuth();
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

  // Calculate statistics for 2026
  const stats = {
    totalCompanies: (companies || []).length,
    all: (companies || []).length,
    fte: (companies || []).filter(c => c && c.type && c.type.toLowerCase() === "fte").length,
    internshipPlusFte: (companies || []).filter(c => c && c.type && c.type.toLowerCase().includes("internship + fte")).length,
    onlyInternship: (companies || []).filter(c => c && c.type && c.type.toLowerCase().includes("only internship")).length,
  };

  // Handle + button click - show placement form for user's placed company
  const handlePlusButtonClick = async () => {
    if (!user || !studentData) {
      alert('Please login and verify your USN to access this feature.');
      return;
    }

    // Get placed company from student data
    const placedCompanyField = studentData.Company || 
                               studentData['Placed Company'] || 
                               studentData['Company Name'] ||
                               studentData.company ||
                               studentData.placedCompany ||
                               studentData.PlacedCompany;

    if (!placedCompanyField) {
      alert('You are not placed in any company. This form is only for placed students.');
      return;
    }

    try {
      // Fetch companies if not already loaded
      let companiesList = companies || [];
      if (companiesList.length === 0) {
        const res = await companyAPI.getAllCompanies();
        companiesList = res.data || [];
      }

      // Find company by name
      const company = companiesList.find(c => 
        c.name && c.name.toLowerCase().trim() === placedCompanyField.toString().toLowerCase().trim()
      );

      if (company) {
        setPlacementCompanyId(company._id);
        setPlacementCompanyName(company.name);
        setShowPlacementForm(true);
      } else {
        alert(`Company "${placedCompanyField}" not found in the system. Please contact support.`);
      }
    } catch (err) {
      console.error('Error finding company:', err);
      alert('Error finding your placed company. Please try again.');
    }
  };

  // Check if user is new and show placement form
  useEffect(() => {
    const checkNewUserPlacement = async () => {
      if (!user || !studentData) return;
      
      // Check if user is new (created within last 5 minutes)
      const isNewUser = user.isNewUser === true;
      
      if (isNewUser) {
        // Get placed company from student data
        const placedCompanyField = studentData.Company || 
                                   studentData['Placed Company'] || 
                                   studentData['Company Name'] ||
                                   studentData.company ||
                                   studentData.placedCompany ||
                                   studentData.PlacedCompany;

        if (placedCompanyField) {
          try {
            // Always fetch companies to ensure we have the latest data
            const res = await companyAPI.getAllCompanies();
            const companiesList = res.data || [];

            // Find company by name
            const company = companiesList.find(c => 
              c.name && c.name.toLowerCase().trim() === placedCompanyField.toString().toLowerCase().trim()
            );

            if (company) {
              // Check if form already submitted
              const submittedKey = `placementFormSubmitted_${company._id}`;
              const isSubmitted = localStorage.getItem(submittedKey) === 'true';
              
              if (!isSubmitted) {
                setPlacementCompanyId(company._id);
                setPlacementCompanyName(company.name);
                setShowPlacementForm(true);
              }
            }
          } catch (err) {
            console.error('Error checking new user placement:', err);
          }
        }
      }
    };

    checkNewUserPlacement();
  }, [user, studentData]);

  // Year selection view
  if (selectedYear === null) {
    return (
      <div className="p-6 sm:p-8 min-h-screen" style={{ backgroundColor: '#302C2C' }}>
        <div className="max-w-7xl mx-auto">
          {/* Year Selection Cards */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Select Year</h2>
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
                  className={`rounded-xl shadow-lg p-6 sm:p-8 transition-all duration-300 border-2 ${
                    isDisabled
                      ? "opacity-50 cursor-not-allowed border-gray-600"
                      : "hover:shadow-2xl hover:scale-105 border-transparent hover:border-blue-500"
                  }`}
                  style={{
                    backgroundColor: isDisabled ? '#1a1a1a' : '#1a1a1a'
                  }}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className={`rounded-full p-4 sm:p-5 mb-4 ${
                      isDisabled ? "bg-gray-700" : "bg-blue-900"
                    }`}>
                      <FaCalendarAlt className={`text-3xl sm:text-4xl ${
                        isDisabled ? "text-gray-500" : "text-blue-300"
                      }`} />
                    </div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2">
                      {year} Stats
                    </h2>
                    <p className="text-gray-300 text-sm sm:text-base">
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
      </div>
    );
  }

  // Year stats table view (2024 or 2025)
  if (selectedYear === 2024 || selectedYear === 2025) {
    return (
      <div className="p-4 sm:p-6 min-h-screen" style={{ backgroundColor: '#302C2C' }}>
        <div className="max-w-7xl mx-auto">
          {loadingYearStats ? (
            <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl shadow-lg p-8 sm:p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto mb-4"></div>
              <p className="text-slate-400">Loading {selectedYear} statistics...</p>
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
    <div className="p-4 sm:p-6 min-h-screen relative" style={{ backgroundColor: '#302C2C' }}>
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
          className="mb-4 flex items-center text-blue-400 hover:text-blue-300 font-medium text-sm sm:text-base ml-16 sm:ml-20"
        >
          <FaArrowLeft className="mr-2" />
          Back to Year Selection
        </button>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <div className="w-full sm:w-auto sm:max-w-md">
          <input
            type="text"
            placeholder="Search companies..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
              className="w-full px-4 py-2 sm:py-3 border border-slate-600 
                       rounded-xl shadow-sm focus:outline-none focus:ring-2 
                         focus:ring-indigo-500 transition duration-200 text-sm sm:text-base bg-slate-800 text-white placeholder-slate-400"
          />
        </div>
          {/* Cluster Filter Dropdown */}
          <div className="relative w-full sm:w-auto" ref={clusterFilterRef}>
            <button
              onClick={() => setShowClusterFilter(!showClusterFilter)}
              className="w-full sm:w-auto px-4 py-2 sm:py-3 border border-slate-600 rounded-xl shadow-sm 
                         bg-slate-800 hover:bg-slate-700 focus:outline-none focus:ring-2 
                         focus:ring-indigo-500 transition duration-200 text-sm sm:text-base 
                         text-white font-medium min-w-[200px] sm:min-w-[250px] flex items-center justify-between"
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
              <div className="absolute right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-lg py-2 w-full min-w-[200px] sm:min-w-[250px] z-50">
                <button
                  onClick={() => {
                    setCluster("all");
                    setShowClusterFilter(false);
                    setCurrentPage(1);
                  }}
                  className={`w-full px-4 py-2 text-left hover:bg-slate-700 text-slate-300 ${
                    cluster === "all" ? "font-semibold bg-slate-700 text-white" : ""
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
                  className={`w-full px-4 py-2 text-left hover:bg-slate-700 text-slate-300 ${
                    cluster === "Computer Science and Engineering" ? "font-semibold bg-slate-700 text-white" : ""
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
                  className={`w-full px-4 py-2 text-left hover:bg-slate-700 text-slate-300 ${
                    cluster === "Electronics and Communication" ? "font-semibold bg-slate-700 text-white" : ""
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
                  className={`w-full px-4 py-2 text-left hover:bg-slate-700 text-slate-300 ${
                    cluster === "Mechanical Engineering" ? "font-semibold bg-slate-700 text-white" : ""
                  }`}
                >
                  Mechanical Engineering
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="max-w-7xl mx-auto mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
            {/* Total Companies */}
            <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm sm:text-base font-semibold text-slate-400">Total Companies</h3>
                <FaBuilding className="text-indigo-400 text-lg sm:text-xl" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-white">{stats.totalCompanies}</p>
            </div>

            {/* All */}
            <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm sm:text-base font-semibold text-slate-400">All</h3>
                <FaChartBar className="text-indigo-400 text-lg sm:text-xl" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-white">{stats.all}</p>
            </div>

            {/* Only Internship */}
            <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm sm:text-base font-semibold text-slate-400">Only Internship</h3>
                <FaBriefcase className="text-indigo-400 text-lg sm:text-xl" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-white">{stats.onlyInternship}</p>
            </div>

            {/* Internship + FTE */}
            <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm sm:text-base font-semibold text-slate-400">Internship + FTE</h3>
                <FaUsers className="text-indigo-400 text-lg sm:text-xl" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-white">{stats.internshipPlusFte}</p>
            </div>

            {/* Only FTE */}
            <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm sm:text-base font-semibold text-slate-400">Only FTE</h3>
                <FaBriefcase className="text-indigo-400 text-lg sm:text-xl" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-white">{stats.fte}</p>
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
          <p className="text-gray-400 col-span-full text-center">
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
            className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-600 transition duration-200 text-sm sm:text-base"
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
                  return <span key={`ellipsis-${pageNum}`} className="px-2 text-gray-400">...</span>;
                }
                if (pageNum === totalPages - 1 && currentPage < totalPages - 3) {
                  return <span key={`ellipsis-${pageNum}`} className="px-2 text-gray-400">...</span>;
                }
                return null;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition duration-200 text-sm sm:text-base ${
                    pageNum === currentPage
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
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
            className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-600 transition duration-200 text-sm sm:text-base"
          >
            Next
          </button>
        </div>
      )}

      <div className="fixed bottom-16 sm:bottom-20 right-4 sm:right-6 z-50 flex flex-col gap-3 sm:gap-4 items-end">
        <button
          onClick={() => setShowFilter((prev) => !prev)}
          className="bg-indigo-600 text-white p-3 sm:p-4 rounded-full shadow-lg hover:bg-indigo-700 transition duration-200"
          aria-label="Filter"
        >
          <FaFilter size={18} className="sm:w-5 sm:h-5" />
        </button>

        {user && (
          <button
            onClick={handlePlusButtonClick}
            className="bg-green-500 text-white p-3 sm:p-4 rounded-full shadow-lg hover:bg-green-600 transition duration-200"
            aria-label="Fill Placement Form"
            title="Fill Placement Form"
          >
            <FaPlus size={18} className="sm:w-5 sm:h-5" />
          </button>
        )}

        {showFilter && (
          <div className="absolute bottom-full mb-2 bg-slate-800 border border-slate-700 rounded-lg shadow-lg py-2 w-40 sm:w-48 flex flex-col right-0">
            <button
              onClick={() => {
                setCategory("all");
                setShowFilter(false);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 text-left hover:bg-slate-700 text-slate-300 ${
                category === "all" ? "font-semibold bg-slate-700 text-white" : ""
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
              className={`px-4 py-2 text-left hover:bg-slate-700 text-slate-300 ${
                category === "fte" ? "font-semibold bg-slate-700 text-white" : ""
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
              className={`px-4 py-2 text-left hover:bg-slate-700 text-slate-300 ${
                category === "internship + fte" ? "font-semibold bg-slate-700 text-white" : ""
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
              className={`px-4 py-2 text-left hover:bg-slate-700 text-slate-300 ${
                category === "only internship(6 months)" ? "font-semibold bg-slate-700 text-white" : ""
              }`}
            >
              Only Internship
            </button>
          </div>
        )}
      </div>

      {/* Placement Form */}
      {showPlacementForm && placementCompanyId && placementCompanyName && (
        <PlacementForm
          companyName={placementCompanyName}
          companyId={placementCompanyId}
          onSuccess={() => {
            setShowPlacementForm(false);
            // Refresh companies list
            companyAPI.getAllCompanies().then(res => {
              setCompanies(res.data);
            });
          }}
          onClose={() => setShowPlacementForm(false)}
          isRequired={false}
        />
      )}
    </div>
  );
}

export default CompanyStats;
