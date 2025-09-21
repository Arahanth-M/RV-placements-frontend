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
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';

const Header = () => {
  const { user, login, logout, loading } = useAuth(); // CHANGE: Added loading from context
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
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

          {/* Navigation Links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link
                to="/"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Home
              </Link>
              <Link
                to="/companystats"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Company Stats
              </Link>
              {user && (
                <Link
                  to="/internshipExperience"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Experiences
                </Link>
              )}
              <Link
                to="/contact"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Contact
              </Link>
              <Link
                to="/chatbot"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Chatbot
              </Link>
            </div>
          </div>

          {/* User Profile/Login */}
          <div className="flex items-center">
            {loading ? (
              // CHANGE: Show loading state while auth is being checked
              <div className="text-sm text-gray-500">Loading...</div>
            ) : user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {user.picture && (
                    <img
                      src={user.picture}
                      alt={user.username}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <span className="text-sm text-gray-700">{user.username}</span>
                </div>
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
    </header>
  );
};

export default Header;