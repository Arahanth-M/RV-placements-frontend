// import { Link, useNavigate } from 'react-router-dom';
// import { useAuth } from '../utils/AuthContext';

// const Header = () => {
//   const { user, login, logout } = useAuth();
//   const navigate = useNavigate();

//   const handleLogout = async () => {
//     await logout();
//     navigate('/');
//   };

//   return (
//     <header className="bg-white shadow-lg fixed top-0 left-0 right-0 z-50">
//       <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="flex justify-between items-center h-16">
//           {/* Logo */}
//           <div className="flex-shrink-0">
//             <Link to="/" className="text-2xl font-bold text-blue-600">
//               CompanyTracker
//             </Link>
//           </div>

//           {/* Navigation Links */}
//           <div className="hidden md:block">
//             <div className="ml-10 flex items-baseline space-x-4">
//               <Link
//                 to="/"
//                 className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
//               >
//                 Home
//               </Link>
//               <Link
//                 to="/companystats"
//                 className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
//               >
//                 Company Stats
//               </Link>
//               {user && (
//                 <>
//                   <Link
//                     to="/internshipExperience"
//                     className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
//                   >
//                     Experiences
//                   </Link>
//                 </>
//               )}
//               <Link
//                 to="/contact"
//                 className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
//               >
//                 Contact
//               </Link>
//               <Link
//                 to="/chatbot"
//                 className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
//               >
//                 Chatbot
//               </Link>
//             </div>
//           </div>

//           {/* User Profile/Login */}
//           <div className="flex items-center">
//             {user ? (
//               <div className="flex items-center space-x-4">
//                 <div className="flex items-center space-x-2">
//                   {user.picture && (
//                     <img
//                       src={user.picture}
//                       alt={user.username}
//                       className="w-8 h-8 rounded-full"
//                     />
//                   )}
//                   <span className="text-sm text-gray-700">{user.username}</span>
//                 </div>
//                 <button
//                   onClick={handleLogout}
//                   className="bg-red-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-600"
//                 >
//                   Logout
//                 </button>
//               </div>
//             ) : (
//               <button
//                 onClick={login}
//                 className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-600"
//               >
//                 Login
//               </button>
//             )}
//           </div>
//         </div>
//       </nav>
//     </header>
//   );
// };

// export default Header;

// Header.jsx - UPDATED (Added better loading state)
// import { Link, useNavigate } from 'react-router-dom';
// import { useAuth } from '../utils/AuthContext';

// const Header = () => {
//   const { user, login, logout, loading } = useAuth(); // CHANGE: Added loading from context
//   const navigate = useNavigate();

//   const handleLogout = async () => {
//     await logout();
//     navigate('/');
//   };

//   return (
//     <header className="bg-white shadow-lg fixed top-0 left-0 right-0 z-50">
//       <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="flex justify-between items-center h-16">
//           {/* Logo */}
//           <div className="flex-shrink-0">
//             <Link to="/" className="text-2xl font-bold text-blue-600">
//               CompanyTracker
//             </Link>
//           </div>

//           {/* Navigation Links */}
//           <div className="hidden md:block">
//             <div className="ml-10 flex items-baseline space-x-4">
//               <Link
//                 to="/"
//                 className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
//               >
//                 Home
//               </Link>
//               <Link
//                 to="/companystats"
//                 className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
//               >
//                 Company Stats
//               </Link>
//               {user && (
//                 <Link
//                   to="/internshipExperience"
//                   className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
//                 >
//                   Experiences
//                 </Link>
//               )}
//               <Link
//                 to="/contact"
//                 className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
//               >
//                 Contact
//               </Link>
//               <Link
//                 to="/chatbot"
//                 className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
//               >
//                 Chatbot
//               </Link>
//               <Link
//                 to="/premium"
//                 className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
//               >Premium</Link>
//             </div>
//           </div>

//           {/* User Profile/Login */}
//           <div className="flex items-center">
//             {loading ? (
//               // CHANGE: Show loading state while auth is being checked
//               <div className="text-sm text-gray-500">Loading...</div>
//             ) : user ? (
//               <div className="flex items-center space-x-4">
//                 <div className="flex items-center space-x-2">
//                   {user.picture && (
//                     <img
//                       src={user.picture}
//                       alt={user.username}
//                       className="w-8 h-8 rounded-full"
//                     />
//                   )}
//                   <span className="text-sm text-gray-700">{user.username}</span>
//                 </div>
//                 <button
//                   onClick={handleLogout}
//                   className="bg-red-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-600"
//                 >
//                   Logout
//                 </button>
//               </div>
//             ) : (
//               <button
//                 onClick={login}
//                 className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-600"
//               >
//                 Login
//               </button>
//             )}
//           </div>
          
//         </div>
//       </nav>
//     </header>
//   );
// };

// export default Header;

import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../utils/AuthContext";
import { useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";

const Header = () => {
  const { user, login, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className="bg-white shadow-lg fixed top-0 left-0 right-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="text-2xl font-bold text-blue-600">
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
              <Link to="/premium" className="nav-link">Premium</Link>
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
              <div className="flex items-center space-x-4">
                {user.picture && (
                  <img
                    src={user.picture}
                    alt={user.username}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span className="text-sm text-gray-700">{user.username}</span>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-600"
                >
                  Logout
                </button>
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
          <Link to="/premium" className="block nav-link">Premium</Link>

          <div className="mt-4">
            {loading ? (
              <div className="text-sm text-gray-500">Loading...</div>
            ) : user ? (
              <div className="flex flex-col space-y-2">
                {user.picture && (
                  <img
                    src={user.picture}
                    alt={user.username}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span className="text-sm text-gray-700">{user.username}</span>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-600"
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
