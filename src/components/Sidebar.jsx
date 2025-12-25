import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../utils/AuthContext";
import { useState, useEffect, useRef } from "react";
import { FaHome, FaGraduationCap, FaUserShield, FaEnvelope, FaChartBar, FaBook, FaCode, FaComments, FaBriefcase, FaTachometerAlt, FaCalendarAlt, FaExclamationCircle, FaBars } from "react-icons/fa";
import { adminAPI, eventAPI } from "../utils/api";
import logo from "../assets/logo2.png";
import NotificationBell from "./NotificationBell";

const Sidebar = () => {
  const { user, isAdmin, studentData, login, signup, logout, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [showStudentsCornerMenu, setShowStudentsCornerMenu] = useState(false);
  const [showAdminsCornerMenu, setShowAdminsCornerMenu] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showLoginMenu, setShowLoginMenu] = useState(false);
  const [hasPendingItems, setHasPendingItems] = useState(false);
  const [hasNewEvents, setHasNewEvents] = useState(false);
  const sidebarRef = useRef(null);
  const hoverZoneRef = useRef(null);
  const hamburgerRef = useRef(null);
  const studentsCornerMenuRef = useRef(null);
  const adminsCornerMenuRef = useRef(null);
  const accountMenuRef = useRef(null);
  const loginMenuRef = useRef(null);

  const handleLogout = async () => {
    await logout();
    navigate("/");
    setIsVisible(false);
  };

  // Check for pending items (submissions or companies) when admin is logged in
  useEffect(() => {
    if (!isAdmin || !user) {
      setHasPendingItems(false);
      return;
    }

    const checkPendingItems = async () => {
      try {
        const stats = await adminAPI.getStats();
        const hasPending = (stats.data?.pendingSubmissions > 0) || (stats.data?.pendingCompanies > 0);
        setHasPendingItems(hasPending);
      } catch (error) {
        console.error("Error checking pending items:", error);
        setHasPendingItems(false);
      }
    };

    checkPendingItems();
    const interval = setInterval(checkPendingItems, 10000);
    return () => clearInterval(interval);
  }, [isAdmin, user]);

  // Check for new events when user is logged in
  useEffect(() => {
    if (!user) {
      setHasNewEvents(false);
      return;
    }

    const checkNewEvents = async () => {
      try {
        const response = await eventAPI.getAllEvents();
        const events = response.data || [];
        
        if (events.length === 0) {
          setHasNewEvents(false);
          return;
        }

        const latestEvent = events.reduce((latest, event) => {
          const eventDate = new Date(event.createdAt || event.updatedAt);
          const latestDate = new Date(latest.createdAt || latest.updatedAt);
          return eventDate > latestDate ? event : latest;
        }, events[0]);

        const latestEventTimestamp = new Date(latestEvent.createdAt || latestEvent.updatedAt).getTime();
        const storageKey = user && user.userId ? `lastSeenEventTimestamp_${user.userId}` : 'lastSeenEventTimestamp';
        const lastSeenTimestamp = sessionStorage.getItem(storageKey);
        
        if (!lastSeenTimestamp) {
          sessionStorage.setItem(storageKey, String(latestEventTimestamp));
          setHasNewEvents(false);
        } else {
          const hasNew = latestEventTimestamp > parseInt(lastSeenTimestamp);
          setHasNewEvents(hasNew);
        }
      } catch (error) {
        console.error("Error checking new events:", error);
        setHasNewEvents(false);
      }
    };

    checkNewEvents();
    const interval = setInterval(checkNewEvents, 15000);
    return () => clearInterval(interval);
  }, [user]);

  // Mark events as seen when user visits the events page
  useEffect(() => {
    if (location.pathname === '/events' && user) {
      const checkAndMarkAsSeen = async () => {
        try {
          const response = await eventAPI.getAllEvents();
          const events = response.data || [];
          
          if (events.length > 0) {
            const latestEvent = events.reduce((latest, event) => {
              const eventDate = new Date(event.createdAt || event.updatedAt);
              const latestDate = new Date(latest.createdAt || latest.updatedAt);
              return eventDate > latestDate ? event : latest;
            }, events[0]);

            const latestEventTimestamp = new Date(latestEvent.createdAt || latestEvent.updatedAt).getTime();
            const storageKey = user && user.userId ? `lastSeenEventTimestamp_${user.userId}` : 'lastSeenEventTimestamp';
            sessionStorage.setItem(storageKey, String(latestEventTimestamp));
            setHasNewEvents(false);
          }
        } catch (error) {
          console.error("Error marking events as seen:", error);
        }
      };

      const timeout = setTimeout(checkAndMarkAsSeen, 500);
      return () => clearTimeout(timeout);
    }
  }, [location.pathname, user]);

  // Handle hover zone, hamburger icon, and sidebar visibility
  useEffect(() => {
    let hideTimeout = null;

    const handleMouseEnter = () => {
      if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
      }
      setIsVisible(true);
    };

    const handleMouseLeave = () => {
      // Delay hiding to allow moving to submenu
      hideTimeout = setTimeout(() => {
        setIsVisible(false);
      }, 300);
    };

    const hoverZone = hoverZoneRef.current;
    const hamburger = hamburgerRef.current;
    const sidebar = sidebarRef.current;

    if (hoverZone) {
      hoverZone.addEventListener('mouseenter', handleMouseEnter);
      hoverZone.addEventListener('mouseleave', handleMouseLeave);
    }

    if (hamburger) {
      hamburger.addEventListener('mouseenter', handleMouseEnter);
      hamburger.addEventListener('mouseleave', handleMouseLeave);
    }

    if (sidebar) {
      sidebar.addEventListener('mouseenter', handleMouseEnter);
      sidebar.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      if (hoverZone) {
        hoverZone.removeEventListener('mouseenter', handleMouseEnter);
        hoverZone.removeEventListener('mouseleave', handleMouseLeave);
      }
      if (hamburger) {
        hamburger.removeEventListener('mouseenter', handleMouseEnter);
        hamburger.removeEventListener('mouseleave', handleMouseLeave);
      }
      if (sidebar) {
        sidebar.removeEventListener('mouseenter', handleMouseEnter);
        sidebar.removeEventListener('mouseleave', handleMouseLeave);
      }
      if (hideTimeout) clearTimeout(hideTimeout);
    };
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (studentsCornerMenuRef.current && !studentsCornerMenuRef.current.contains(event.target)) {
        setShowStudentsCornerMenu(false);
      }
      if (adminsCornerMenuRef.current && !adminsCornerMenuRef.current.contains(event.target)) {
        setShowAdminsCornerMenu(false);
      }
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) {
        setShowAccountMenu(false);
      }
      if (loginMenuRef.current && !loginMenuRef.current.contains(event.target)) {
        setShowLoginMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {/* Notification Bell at top right - only show when user is logged in */}
      {user && (
        <div 
          className="fixed top-4 right-4 z-50"
          style={{ pointerEvents: 'auto' }}
        >
          <NotificationBell />
        </div>
      )}

      {/* Hamburger icon indicator at top left */}
      <div
        ref={hamburgerRef}
        className="fixed top-4 left-4 z-40 p-2 bg-slate-800 border border-slate-700 rounded-md shadow-lg cursor-pointer hover:bg-slate-700 transition-colors"
        title="Hover to open sidebar"
      >
        <FaBars className="w-5 h-5 text-slate-200" />
      </div>

      {/* Hover zone - invisible trigger area on the left edge (excludes top right area) */}
      <div
        ref={hoverZoneRef}
        className="fixed left-0 top-0 bottom-0 w-12 z-40"
        style={{ 
          pointerEvents: 'auto',
          // Exclude right side to prevent interference with notification bell
          right: 'auto'
        }}
      />

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`fixed left-0 top-0 bottom-0 w-64 z-40 transition-transform duration-300 ease-in-out bg-slate-900 ${
          isVisible ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ 
          boxShadow: isVisible ? '2px 0 10px rgba(0,0,0,0.3)' : 'none'
        }}
      >
        <div className="h-full flex flex-col overflow-y-auto">
          {/* Logo */}
          <div className="p-4 border-b border-slate-700 bg-white">
            <Link to="/" className="flex items-center" onClick={() => setIsVisible(false)}>
              <img 
                src={logo} 
                alt="CompanyTracker Logo" 
                className="max-h-12 max-w-28 w-auto h-auto object-contain hover:opacity-80 transition-opacity duration-200"  
              />
            </Link>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 p-4 space-y-2">
            <Link 
              to="/" 
              className="nav-link flex items-center text-slate-300 hover:text-white hover:bg-slate-800 px-3 py-2 rounded-md transition-colors"
              onClick={() => setIsVisible(false)}
            >
              <FaHome className="w-5 h-5 mr-3" />
              Home
            </Link>

            <Link 
              to="/events" 
              className="nav-link flex items-center text-slate-300 hover:text-white hover:bg-slate-800 px-3 py-2 rounded-md transition-colors relative"
              onClick={() => setIsVisible(false)}
            >
              <FaCalendarAlt className="w-5 h-5 mr-3" />
              Events
              {hasNewEvents && (
                <FaExclamationCircle className="w-4 h-4 ml-2 text-red-400 animate-pulse" title="New events posted" />
              )}
            </Link>

            {/* Students Corner */}
            <div className="relative" ref={studentsCornerMenuRef}>
              <button
                onClick={() => setShowStudentsCornerMenu(!showStudentsCornerMenu)}
                className="w-full nav-link flex items-center justify-between text-slate-300 hover:text-white hover:bg-slate-800 px-3 py-2 rounded-md transition-colors"
              >
                <div className="flex items-center">
                  <FaGraduationCap className="w-5 h-5 mr-3" />
                  Students Corner
                </div>
                <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showStudentsCornerMenu ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                </svg>
              </button>
              
              {showStudentsCornerMenu && (
                <div className="ml-4 mt-1 space-y-1">
                  <Link
                    to="/companystats"
                    onClick={() => {
                      setShowStudentsCornerMenu(false);
                      setIsVisible(false);
                    }}
                    className="block nav-link text-sm flex items-center text-slate-300 hover:text-white hover:bg-slate-800 px-3 py-2 rounded-md transition-colors"
                  >
                    <FaChartBar className="w-4 h-4 mr-2" />
                    Company Stats
                  </Link>
                  <Link
                    to="/resources"
                    onClick={() => {
                      setShowStudentsCornerMenu(false);
                      setIsVisible(false);
                    }}
                    className="block nav-link text-sm flex items-center text-slate-300 hover:text-white hover:bg-slate-800 px-3 py-2 rounded-md transition-colors"
                  >
                    <FaBook className="w-4 h-4 mr-2" />
                    Resources
                  </Link>
                  <Link
                    to="/leetcode"
                    onClick={() => {
                      setShowStudentsCornerMenu(false);
                      setIsVisible(false);
                    }}
                    className="block nav-link text-sm flex items-center text-slate-300 hover:text-white hover:bg-slate-800 px-3 py-2 rounded-md transition-colors"
                  >
                    <FaCode className="w-4 h-4 mr-2" />
                    Leetcode
                  </Link>
                  <Link
                    to="/feedback"
                    onClick={() => {
                      setShowStudentsCornerMenu(false);
                      setIsVisible(false);
                    }}
                    className="block nav-link text-sm flex items-center text-slate-300 hover:text-white hover:bg-slate-800 px-3 py-2 rounded-md transition-colors"
                  >
                    <FaComments className="w-4 h-4 mr-2" />
                    Feedback
                  </Link>
                  <Link
                    to="/internshipExperience"
                    onClick={() => {
                      setShowStudentsCornerMenu(false);
                      setIsVisible(false);
                    }}
                    className="block nav-link text-sm flex items-center text-slate-300 hover:text-white hover:bg-slate-800 px-3 py-2 rounded-md transition-colors"
                  >
                    <FaBriefcase className="w-4 h-4 mr-2" />
                    Experiences
                  </Link>
                </div>
              )}
            </div>

            {/* Admins Corner */}
            {isAdmin && (
              <div className="relative" ref={adminsCornerMenuRef}>
                <button
                  onClick={() => setShowAdminsCornerMenu(!showAdminsCornerMenu)}
                  className="w-full nav-link flex items-center justify-between text-slate-300 hover:text-white hover:bg-slate-800 px-3 py-2 rounded-md transition-colors relative"
                >
                  <div className="flex items-center">
                    <FaUserShield className="w-5 h-5 mr-3" />
                    Admins Corner
                    {hasPendingItems && (
                      <FaExclamationCircle className="w-4 h-4 ml-2 text-red-400 animate-pulse" title="Pending items require action" />
                    )}
                  </div>
                  <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showAdminsCornerMenu ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                  </svg>
                </button>
                
                {showAdminsCornerMenu && (
                  <div className="ml-4 mt-1 space-y-1">
                    <Link
                      to="/admin/dashboard"
                      onClick={() => {
                        setShowAdminsCornerMenu(false);
                        setIsVisible(false);
                      }}
                      className="block nav-link text-sm flex items-center text-slate-300 hover:text-white hover:bg-slate-800 px-3 py-2 rounded-md transition-colors"
                    >
                      <FaTachometerAlt className="w-4 h-4 mr-2" />
                      Dashboard
                    </Link>
                  </div>
                )}
              </div>
            )}

            <Link 
              to="/contact" 
              className="nav-link flex items-center text-slate-300 hover:text-white hover:bg-slate-800 px-3 py-2 rounded-md transition-colors"
              onClick={() => setIsVisible(false)}
            >
              <FaEnvelope className="w-5 h-5 mr-3" />
              Contact
            </Link>
          </nav>

          {/* Login/Profile Section at Bottom */}
          <div className="p-4 border-t border-slate-700">
            {loading ? (
              <div className="text-sm text-slate-300">Loading...</div>
            ) : user ? (
              <>
                <div className="relative" ref={accountMenuRef}>
                  <div 
                    className="flex items-center space-x-3 cursor-pointer px-3 py-2 rounded-md hover:bg-slate-800 transition-colors"
                    onClick={() => setShowAccountMenu(!showAccountMenu)}
                    title="Account Menu"
                  >
                    {user.picture ? (
                      <img
                        src={user.picture}
                        alt={user.username}
                        className="w-10 h-10 rounded-full border-2 border-slate-600"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-700 border-2 border-slate-600 flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-slate-200 font-medium truncate">{user.username}</div>
                      <div 
                        className="text-xs text-slate-400 truncate cursor-pointer hover:text-indigo-400 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowAccountMenu(!showAccountMenu);
                        }}
                      >
                        {user.email}
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-slate-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showAccountMenu ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                    </svg>
                  </div>
                  
                  {showAccountMenu && (
                    <div className="absolute top-full left-0 mt-2 w-full bg-slate-800 border border-slate-700 rounded-md shadow-lg z-50 md:bottom-full md:top-auto md:mt-0 md:mb-2">
                      <div className="py-1">
                        <div 
                          className="px-4 py-2 text-sm text-slate-400 border-b border-slate-700 break-words cursor-pointer hover:text-indigo-400 hover:bg-slate-700 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (studentData) {
                              setShowAccountMenu(false);
                              navigate('/profile');
                            }
                          }}
                        >
                          {user.email}
                        </div>
                        {studentData && (
                          <button
                            onClick={() => {
                              setShowAccountMenu(false);
                              navigate('/profile');
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
                          >
                            View Profile
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setShowAccountMenu(false);
                            signup();
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
                        >
                          Switch Account
                        </button>
                        <button
                          onClick={() => {
                            setShowAccountMenu(false);
                            handleLogout();
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-700 transition-colors"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
              </div>
              </>
            ) : (
              <div className="relative" ref={loginMenuRef}>
                <button
                  onClick={() => setShowLoginMenu(!showLoginMenu)}
                  className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 flex items-center justify-center transition-colors"
                >
                  Login
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showLoginMenu ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                  </svg>
                </button>
                
                {showLoginMenu && (
                  <div className="absolute bottom-full left-0 mb-2 w-full bg-slate-800 border border-slate-700 rounded-md shadow-lg z-50">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowLoginMenu(false);
                          login(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-700"
                      >
                        Login as Student
                      </button>
                      <button
                        onClick={() => {
                          setShowLoginMenu(false);
                          login(true);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-700"
                      >
                        Login as Admin
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

