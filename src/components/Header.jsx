import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../utils/AuthContext";
import { useState, useEffect, useRef } from "react";
import { FaBars, FaTimes } from "react-icons/fa";

const Header = () => {
  const { user, login, signup, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const accountMenuRef = useRef(null);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  // Close account menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) {
        setShowAccountMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-white shadow-lg fixed top-0 left-0 right-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="text-2xl font-bold text-blue-800">
              CompanyTracker
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link to="/" className="nav-link">Home</Link>
              <Link to="/companystats" className="nav-link">Company Stats</Link>
              {user && <Link to="/internshipExperience" className="nav-link">Experiences</Link>}
              <Link to="/contact" className="nav-link">Contact</Link>
              <Link to="/chatbot" className="nav-link">Chatbot</Link>
              <Link to="/premium" className="nav-link">
                {user ? 'Premium' : 'Get Premium'}
              </Link>
            </div>
          </div>

          {/* Mobile Hamburger */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 focus:outline-none"
            >
              {isOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
            </button>
          </div>

          {/* User Profile/Login */}
          <div className="hidden md:flex items-center">
            {loading ? (
              <div className="text-sm text-gray-500">Loading...</div>
            ) : user ? (
              <div className="flex items-center space-x-4 relative" ref={accountMenuRef}>
                <div 
                  className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded-md"
                  onClick={() => setShowAccountMenu(!showAccountMenu)}
                >
                  {user.picture && (
                    <img
                      src={user.picture}
                      alt={user.username}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <span className="text-sm text-gray-700">{user.username}</span>
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                
                {showAccountMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                    <div className="py-1">
                      <div className="px-4 py-2 text-sm text-gray-500 border-b">
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
              <button
                onClick={login}
                className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-600"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Dropdown Menu */}
      {isOpen && (
        <div className="md:hidden bg-white shadow-lg px-4 pb-4 space-y-2">
          <Link to="/" className="block nav-link">Home</Link>
          <Link to="/companystats" className="block nav-link">Company Stats</Link>
          {user && <Link to="/internshipExperience" className="block nav-link">Experiences</Link>}
          <Link to="/contact" className="block nav-link">Contact</Link>
          <Link to="/chatbot" className="block nav-link">Chatbot</Link>
          <Link to="/premium" className="block nav-link">
            {user ? 'Premium' : 'Get Premium'}
          </Link>

          <div className="mt-4">
            {loading ? (
              <div className="text-sm text-gray-500">Loading...</div>
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
                    <span className="text-sm text-gray-700">{user.username}</span>
                    <span className="text-xs text-gray-500">{user.email}</span>
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
              <button
                onClick={login}
                className="w-full bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-600"
              >
                Login
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
