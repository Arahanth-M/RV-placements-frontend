import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../utils/AuthContext";
import { useState, useEffect, useRef } from "react";
import { FaBars, FaTimes, FaHome, FaGraduationCap, FaUserShield, FaEnvelope, FaChartBar, FaBook, FaCode, FaComments, FaBriefcase, FaTachometerAlt } from "react-icons/fa";
import logo from "../assets/logo2.png";

const Header = () => {
  const { user, login, signup, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showStudentsCornerMenu, setShowStudentsCornerMenu] = useState(false);
  const [showAdminsCornerMenu, setShowAdminsCornerMenu] = useState(false);
  const [showLoginMenu, setShowLoginMenu] = useState(false);
  const accountMenuRef = useRef(null);
  const studentsCornerMenuRef = useRef(null);
  const adminsCornerMenuRef = useRef(null);
  const loginMenuRef = useRef(null);
  
  const ADMIN_EMAIL = "arahanthm.cs22@rvce.edu.in";
  const isAdmin = user && user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleAdminsCornerClick = () => {
    // Always show dropdown, similar to Students Corner
    setShowAdminsCornerMenu(!showAdminsCornerMenu);
  };

  // Close account menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) {
        setShowAccountMenu(false);
      }
      if (studentsCornerMenuRef.current && !studentsCornerMenuRef.current.contains(event.target)) {
        setShowStudentsCornerMenu(false);
      }
      if (loginMenuRef.current && !loginMenuRef.current.contains(event.target)) {
        setShowLoginMenu(false);
      }
      if (adminsCornerMenuRef.current && !adminsCornerMenuRef.current.contains(event.target)) {
        setShowAdminsCornerMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="shadow-lg fixed top-0 left-0 right-0 z-50" style={{ backgroundColor: '#6B9ADB' }}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center">
              <img 
                src={logo} 
                alt="CompanyTracker Logo" 
                className="max-h-14 max-w-32 w-auto h-auto object-contain hover:opacity-80 transition-opacity duration-200"  
              />
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link to="/" className="nav-link flex items-center text-gray-300 hover:text-white">
                <FaHome className="w-4 h-4 mr-1.5" />
                Home
              </Link>
              <div className="relative" ref={studentsCornerMenuRef}>
                <button
                  onClick={() => setShowStudentsCornerMenu(!showStudentsCornerMenu)}
                  className="nav-link flex items-center text-gray-300 hover:text-white"
                >
                  <FaGraduationCap className="w-4 h-4 mr-1.5" />
                  Students Corner
                  <svg className="w-4 h-4 ml-1 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showStudentsCornerMenu && (
                  <div className="absolute left-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                    <div className="py-1">
                      <Link
                        to="/companystats"
                        onClick={() => setShowStudentsCornerMenu(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <FaChartBar className="w-4 h-4 mr-2" />
                        Company Stats
                      </Link>
                      <Link
                        to="/resources"
                        onClick={() => setShowStudentsCornerMenu(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <FaBook className="w-4 h-4 mr-2" />
                        Resources
                      </Link>
                      <Link
                        to="/leetcode"
                        onClick={() => setShowStudentsCornerMenu(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <FaCode className="w-4 h-4 mr-2" />
                        Leetcode
                      </Link>
                      <Link
                        to="/feedback"
                        onClick={() => setShowStudentsCornerMenu(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <FaComments className="w-4 h-4 mr-2" />
                        Feedback
                      </Link>
                      <Link
                        to="/internshipExperience"
                        onClick={() => setShowStudentsCornerMenu(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <FaBriefcase className="w-4 h-4 mr-2" />
                        Experiences
                      </Link>
                    </div>
                  </div>
                )}
              </div>
              <div className="relative" ref={adminsCornerMenuRef}>
                <button
                  onClick={handleAdminsCornerClick}
                  className="nav-link flex items-center text-gray-300 hover:text-white"
                >
                  <FaUserShield className="w-4 h-4 mr-1.5" />
                  Admins Corner
                  <svg className="w-4 h-4 ml-1 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showAdminsCornerMenu && (
                  <div className="absolute left-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                    <div className="py-1">
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setShowAdminsCornerMenu(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <FaTachometerAlt className="w-4 h-4 mr-2" />
                        Dashboard
                      </Link>
                    </div>
                  </div>
                )}
              </div>
              <Link to="/contact" className="nav-link flex items-center text-gray-300 hover:text-white">
                <FaEnvelope className="w-4 h-4 mr-1.5" />
                Contact
              </Link>
              {/* PAYMENT GATEWAY INTEGRATION - COMMENTED OUT */}
              {/* <Link to="/premium" className="nav-link">
                {user ? 'Premium' : 'Get Premium'}
              </Link> */}
            </div>
          </div>

          {/* Mobile Hamburger */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-300 hover:text-white focus:outline-none"
            >
              {isOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
            </button>
          </div>

          {/* User Profile/Login */}
          <div className="hidden md:flex items-center">
            {loading ? (
              <div className="text-sm text-gray-300">Loading...</div>
            ) : user ? (
              <div className="flex items-center space-x-4 relative" ref={accountMenuRef}>
                <div 
                  className="flex items-center space-x-2 cursor-pointer px-2 py-1 rounded-md hover:opacity-80"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                  onClick={() => setShowAccountMenu(!showAccountMenu)}
                >
                  {user.picture && (
                    <img
                      src={user.picture}
                      alt={user.username}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <span className="text-sm text-gray-300">{user.username}</span>
                  <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                
                {showAccountMenu && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                    <div className="py-1">
                      <div className="px-4 py-2 text-sm text-gray-500 border-b break-words">
                        {user.email}
                      </div>
                      <button
                        onClick={() => {
                          setShowAccountMenu(false);
                          signup();
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Switch Account
                      </button>
                      <button
                        onClick={() => {
                          setShowAccountMenu(false);
                          handleLogout();
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative" ref={loginMenuRef}>
                <button
                  onClick={() => setShowLoginMenu(!showLoginMenu)}
                  className="bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-600 flex items-center"
                >
                  Login
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showLoginMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowLoginMenu(false);
                          login(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Login as Student
                      </button>
                      <button
                        onClick={() => {
                          setShowLoginMenu(false);
                          login(true);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
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
      </nav>

      {/* Mobile Dropdown Menu */}
      {isOpen && (
        <div className="md:hidden shadow-lg px-4 pb-4 space-y-2" style={{ backgroundColor: '#6B9ADB' }}>
          <Link to="/" className="block nav-link flex items-center text-gray-300 hover:text-white">
            <FaHome className="w-4 h-4 mr-2" />
            Home
          </Link>
          <div className="space-y-1">
            <button
              onClick={() => setShowStudentsCornerMenu(!showStudentsCornerMenu)}
              className="w-full text-left nav-link flex items-center justify-between text-gray-300 hover:text-white"
            >
              <div className="flex items-center">
                <FaGraduationCap className="w-4 h-4 mr-2" />
                Students Corner
              </div>
              <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showStudentsCornerMenu ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
              </svg>
            </button>
            {showStudentsCornerMenu && (
              <div className="pl-4 space-y-1">
                <Link to="/companystats" onClick={() => setIsOpen(false)} className="block nav-link text-sm flex items-center text-gray-300 hover:text-white">
                  <FaChartBar className="w-4 h-4 mr-2" />
                  Company Stats
                </Link>
                <Link to="/resources" onClick={() => setIsOpen(false)} className="block nav-link text-sm flex items-center text-gray-300 hover:text-white">
                  <FaBook className="w-4 h-4 mr-2" />
                  Resources
                </Link>
                <Link to="/leetcode" onClick={() => setIsOpen(false)} className="block nav-link text-sm flex items-center text-gray-300 hover:text-white">
                  <FaCode className="w-4 h-4 mr-2" />
                  Leetcode
                </Link>
                <Link to="/feedback" onClick={() => setIsOpen(false)} className="block nav-link text-sm flex items-center text-gray-300 hover:text-white">
                  <FaComments className="w-4 h-4 mr-2" />
                  Feedback
                </Link>
                <Link to="/internshipExperience" onClick={() => setIsOpen(false)} className="block nav-link text-sm flex items-center text-gray-300 hover:text-white">
                  <FaBriefcase className="w-4 h-4 mr-2" />
                  Experiences
                </Link>
              </div>
            )}
          </div>
          <div className="space-y-1">
            <button
              onClick={() => setShowAdminsCornerMenu(!showAdminsCornerMenu)}
              className="w-full text-left nav-link flex items-center justify-between text-gray-300 hover:text-white"
            >
              <div className="flex items-center">
                <FaUserShield className="w-4 h-4 mr-2" />
                Admins Corner
              </div>
              <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showAdminsCornerMenu ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
              </svg>
            </button>
            {showAdminsCornerMenu && (
              <div className="pl-4 space-y-1">
                <Link to="/admin/dashboard" onClick={() => setIsOpen(false)} className="block nav-link text-sm flex items-center text-gray-300 hover:text-white">
                  <FaTachometerAlt className="w-4 h-4 mr-2" />
                  Dashboard
                </Link>
              </div>
            )}
          </div>
          <Link to="/contact" className="block nav-link flex items-center text-gray-300 hover:text-white">
            <FaEnvelope className="w-4 h-4 mr-2" />
            Contact
          </Link>
          {/* PAYMENT GATEWAY INTEGRATION - COMMENTED OUT */}
          {/* <Link to="/premium" className="block nav-link">
            {user ? 'Premium' : 'Get Premium'}
          </Link> */}

          <div className="mt-4">
            {loading ? (
              <div className="text-sm text-gray-300">Loading...</div>
            ) : user ? (
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  {user.picture && (
                    <img
                      src={user.picture}
                      alt={user.username}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-300">{user.username}</span>
                    <span className="text-xs text-gray-400">{user.email}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    signup();
                  }}
                  className="w-full bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-600"
                >
                  Switch Account
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    handleLogout();
                  }}
                  className="w-full bg-red-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-600"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    login(false);
                  }}
                  className="w-full bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-600"
                >
                  Login as Student
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    login(true);
                  }}
                  className="w-full bg-indigo-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-600"
                >
                  Login as Admin
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
