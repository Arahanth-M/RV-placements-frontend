import { useNavigate } from "react-router-dom";
import { useAuth } from "../utils/AuthContext";
import { useState, useEffect, useRef } from "react";
import NotificationBell from "./NotificationBell";

const Header = () => {
  const { user, studentData, login, signup, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showLoginMenu, setShowLoginMenu] = useState(false);
  const accountMenuRef = useRef(null);
  const loginMenuRef = useRef(null);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) {
        setShowAccountMenu(false);
      }
      if (loginMenuRef.current && !loginMenuRef.current.contains(event.target)) {
        setShowLoginMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  return (
    <header className="fixed top-0 right-0 z-50 p-4">
      <div className="flex items-center space-x-4">
        {/* Notification Bell - only show when user is logged in */}
        {user && <NotificationBell />}
        
        {loading ? (
          <div className="text-sm text-slate-300">Loading...</div>
        ) : user ? (
          <div className="flex items-center space-x-4 relative" ref={accountMenuRef}>
            <div 
              className="cursor-pointer rounded-full hover:ring-2 hover:ring-gray-300 transition-all"
              onClick={() => setShowAccountMenu(!showAccountMenu)}
              title="Account Menu"
            >
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.username}
                  className="w-10 h-10 rounded-full border-2 border-gray-200"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-400 border-2 border-gray-200 flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                  </span>
                </div>
              )}
            </div>
            
            {showAccountMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-slate-800 border border-slate-700 rounded-md shadow-lg z-50">
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
        ) : (
          <div className="relative" ref={loginMenuRef}>
            <button
              onClick={() => setShowLoginMenu(!showLoginMenu)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 flex items-center shadow-md"
            >
              Login
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showLoginMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-slate-700 rounded-md shadow-lg z-50">
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
    </header>
  );
};

export default Header;
