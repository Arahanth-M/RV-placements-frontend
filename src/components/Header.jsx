// import React, { useEffect } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import axios from "axios";
// import { BASE_URL } from "../utils/constants";
// import { useDispatch, useSelector } from "react-redux";
// import { addUser, removeUser } from "../utils/userSlice";

// function Header() {
//   const user = useSelector((store) => store.user);
//   const dispatch = useDispatch();
//   const navigate = useNavigate();

  
//   useEffect(() => {
//     async function checkAuth() {
//       try {
//         const res = await axios.get(BASE_URL + "/auth/me", {
//           withCredentials: true,
//         });
//         dispatch(addUser(res.data));
//       } catch (err) {
//         dispatch(removeUser());
//       }
//     }
//     checkAuth();
//   }, [dispatch]);

//   // ✅ Logout
//   const handleLogout = async () => {
//     try {
//       await axios.post(BASE_URL + "/logout", {}, { withCredentials: true });
//       dispatch(removeUser());
//       navigate("/login");
//     } catch (err) {
//       console.error("Logout failed:", err);
//     }
//   };

//   return (
//     <header className="bg-blue-900 text-white shadow-md">
//       <div className="container mx-auto flex justify-between items-center px-6 py-4">
//         <div className="flex items-center space-x-3">
//           <img
//             src="src/assets/logo.png"
//             alt="RVCE Logo"
//             className="h-15 w-15 object-contain rounded-full"
//           />
//           <h1 className="text-2xl font-bold">Placed@RVCE</h1>
//         </div>

//         <nav className="space-x-6 font-medium">
//           <Link to="/" className="hover:text-yellow-300 transition">
//             Home
//           </Link>
//           <Link to="/companystats" className="hover:text-yellow-300 transition">
//             Company Stats
//           </Link>
//           <Link
//             to="/internshipExperience"
//             className="hover:text-yellow-300 transition"
//           >
//             Internship
//           </Link>
//           <Link to="/contact" className="hover:text-yellow-300 transition">
//             Feedback
//           </Link>
//           <Link to="/chatbot" className="hover:text-yellow-300 transition">
//             Chatbot
//           </Link>
          

//           {user ? (
//             <button
//               onClick={handleLogout}
//               className="hover:text-yellow-300 transition bg-transparent border-none cursor-pointer"
//             >
//               Logout
//             </button>
//           ) : (
//             <Link to="/login" className="hover:text-yellow-300 transition">
//               Login
//             </Link>
//           )}
//         </nav>
//       </div>
//     </header>
//   );
// }

// export default Header;

// import React, { useEffect } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import axios from "axios";
// import { BASE_URL } from "../utils/constants";
// import { useDispatch, useSelector } from "react-redux";
// import { addUser, removeUser } from "../utils/userSlice";

// function Header() {
//   const user = useSelector((store) => store.user);
//   const dispatch = useDispatch();
//   const navigate = useNavigate();

//   useEffect(() => {
//     async function checkAuth() {
//       try {
//         const res = await axios.get(BASE_URL + "/auth/me", {
//           withCredentials: true,
//         });
//         dispatch(addUser(res.data));
//       } catch (err) {
//         dispatch(removeUser());
//       }
//     }
//     checkAuth();
//   }, [dispatch]);

//   const handleLogout = async () => {
//     try {
//       await axios.post(BASE_URL + "/logout", {}, { withCredentials: true });
//       dispatch(removeUser());
//       navigate("/login");
//     } catch (err) {
//       console.error("Logout failed:", err);
//     }
//   };

//   return (
//     <header className="bg-blue-900 text-white shadow-md">
//       <div className="container mx-auto flex flex-col md:flex-row justify-between items-center px-6 py-4 space-y-4 md:space-y-0">
//         {/* Logo + Title */}
//         <div className="flex items-center space-x-3">
//           <img
//             src="src/assets/logo.png"
//             alt="RVCE Logo"
//             className="h-12 w-12 object-contain rounded-full"
//           />
//           <h1 className="text-xl md:text-2xl font-bold">Placed@RVCE</h1>
//         </div>

//         {/* Navigation */}
//         <nav className="flex flex-col md:flex-row items-center space-y-3 md:space-y-0 md:space-x-6 font-medium text-center">
//           <Link to="/" className="hover:text-yellow-300 transition">
//             Home
//           </Link>
//           <Link to="/companystats" className="hover:text-yellow-300 transition">
//             Company Stats
//           </Link>
//           <Link
//             to="/internshipExperience"
//             className="hover:text-yellow-300 transition"
//           >
//             Internship
//           </Link>
//           <Link to="/contact" className="hover:text-yellow-300 transition">
//             Feedback
//           </Link>
//           <Link to="/chatbot" className="hover:text-yellow-300 transition">
//             Chatbot
//           </Link>

//           {user ? (
//             <button
//               onClick={handleLogout}
//               className="hover:text-yellow-300 transition bg-transparent border-none cursor-pointer"
//             >
//               Logout
//             </button>
//           ) : (
//             <Link to="/login" className="hover:text-yellow-300 transition">
//               Login
//             </Link>
//           )}
//         </nav>
//       </div>
//     </header>
//   );
// }

// export default Header;

// import React, { useEffect } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import axios from "axios";
// import { BASE_URL } from "../utils/constants";
// import { useDispatch, useSelector } from "react-redux";
// import { addUser, removeUser } from "../utils/userSlice";

// function Header() {
//   const user = useSelector((store) => store.user);
//   const dispatch = useDispatch();
//   const navigate = useNavigate();

//   useEffect(() => {
//     async function checkAuth() {
//       try {
//         const res = await axios.get(BASE_URL + "/auth/me", {
//           withCredentials: true,
//         });
//         dispatch(addUser(res.data));
//       } catch (err) {
//         dispatch(removeUser());
//       }
//     }
//     checkAuth();
//   }, [dispatch]);

//   const handleLogout = async () => {
//     try {
//       await axios.post(BASE_URL + "/logout", {}, { withCredentials: true });
//       dispatch(removeUser());
//       navigate("/login");
//     } catch (err) {
//       console.error("Logout failed:", err);
//     }
//   };

//   return (
//     <header className="bg-blue-900 text-white shadow-md">
//       <div className="container mx-auto flex flex-col md:flex-row justify-between items-center px-6 py-4">
        
//         {/* Logo + Title (always left) */}
//         <div className="flex items-center space-x-3 self-start md:self-center">
          
//           <h1 className="text-xl md:text-2xl font-bold">Placed@RVCE</h1>
//         </div>

//         {/* Navigation (right side) */}
//         <nav className="flex flex-col md:flex-row md:items-center md:space-x-6 font-medium mt-4 md:mt-0 text-center md:text-right w-full md:w-auto">
//           <Link to="/" className="hover:text-yellow-300 transition">
//             Home
//           </Link>
//           <Link to="/companystats" className="hover:text-yellow-300 transition">
//             Company Stats
//           </Link>
//           <Link
//             to="/internshipExperience"
//             className="hover:text-yellow-300 transition"
//           >
//             Internship
//           </Link>
//           <Link to="/contact" className="hover:text-yellow-300 transition">
//             Feedback
//           </Link>
//           <Link to="/chatbot" className="hover:text-yellow-300 transition">
//             Chatbot
//           </Link>

//           {user ? (
//             <button
//               onClick={handleLogout}
//               className="hover:text-yellow-300 transition bg-transparent border-none cursor-pointer"
//             >
//               Logout
//             </button>
//           ) : (
//             <Link to="/login" className="hover:text-yellow-300 transition">
//               Login
//             </Link>
//           )}
//         </nav>
//       </div>
//     </header>
//   );
// }

// export default Header;

// import React, { useEffect } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import axios from "axios";
// import { BASE_URL } from "../utils/constants";
// import { useDispatch, useSelector } from "react-redux";
// import { addUser, removeUser } from "../utils/userSlice";

// function Header() {
//   const user = useSelector((store) => store.user);
//   const dispatch = useDispatch();
//   const navigate = useNavigate();

//   useEffect(() => {
//     async function checkAuth() {
//       try {
//         const res = await axios.get(BASE_URL + "/auth/me", {
//           withCredentials: true,
//         });
//         dispatch(addUser(res.data));
//       } catch (err) {
//         dispatch(removeUser());
//       }
//     }
//     checkAuth();
//   }, [dispatch]);

//   const handleLogout = async () => {
//     try {
//       await axios.post(BASE_URL + "/logout", {}, { withCredentials: true });
//       dispatch(removeUser());
//       navigate("/login");
//     } catch (err) {
//       console.error("Logout failed:", err);
//     }
//   };

//   return (
//     <header className="bg-blue-900 text-white shadow-md w-full">
//       {/* Constrain the inner content so it doesn't cause overflow */}
//       <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row items-center justify-between px-4 sm:px-6 py-4">
//         {/* Left: Logo + Title */}
//         <div className="flex items-center space-x-3 min-w-0">
//           {/* If you have a logo, uncomment and use the img below.
//               Otherwise the title alone will work fine. */}
//           {/* <img
//             src="src/assets/logo.png"
//             alt="RVCE Logo"
//             className="h-10 w-10 object-contain rounded-full"
//           /> */}
//           <h1 className="text-xl md:text-2xl font-bold truncate">Placed@RVCE</h1>
//         </div>

//         {/* Right: Navigation
//             - on mobile: stack vertically and align to right (items-end)
//             - on md+: show inline row and center vertically
//         */}
//         <nav className="flex flex-col md:flex-row items-end md:items-center mt-3 md:mt-0 space-y-2 md:space-y-0 md:space-x-6 font-medium w-full md:w-auto min-w-0">
//           <Link
//             to="/"
//             className="block md:inline-block hover:text-yellow-300 transition truncate text-right md:text-left w-full md:w-auto"
//           >
//             Home
//           </Link>

//           <Link
//             to="/companystats"
//             className="block md:inline-block hover:text-yellow-300 transition truncate text-right md:text-left w-full md:w-auto"
//           >
//             Company Stats
//           </Link>

//           <Link
//             to="/internshipExperience"
//             className="block md:inline-block hover:text-yellow-300 transition truncate text-right md:text-left w-full md:w-auto"
//           >
//             Internship
//           </Link>

//           <Link
//             to="/contact"
//             className="block md:inline-block hover:text-yellow-300 transition truncate text-right md:text-left w-full md:w-auto"
//           >
//             Feedback
//           </Link>

//           <Link
//             to="/chatbot"
//             className="block md:inline-block hover:text-yellow-300 transition truncate text-right md:text-left w-full md:w-auto"
//           >
//             Chatbot
//           </Link>

//           {user ? (
//             <button
//               onClick={handleLogout}
//               className="block md:inline-block hover:text-yellow-300 transition bg-transparent border-none cursor-pointer text-right md:text-left w-full md:w-auto"
//             >
//               Logout
//             </button>
//           ) : (
//             <Link
//               to="/login"
//               className="block md:inline-block hover:text-yellow-300 transition truncate text-right md:text-left w-full md:w-auto"
//             >
//               Login
//             </Link>
//           )}
//         </nav>
//       </div>
//     </header>
//   );
// }

// export default Header;
// src/components/Header.jsx
import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { useDispatch, useSelector } from "react-redux";
import { addUser, removeUser } from "../utils/userSlice";

function Header() {
  const user = useSelector((store) => store.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await axios.get(`${BASE_URL}/auth/me`, { withCredentials: true });
        dispatch(addUser(res.data));
      } catch {
        dispatch(removeUser());
      }
    }
    checkAuth();
  }, [dispatch]);

  const handleLogout = async () => {
    try {
      await axios.post(`${BASE_URL}/logout`, {}, { withCredentials: true });
      dispatch(removeUser());
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    // fixed so header stays visible even if page is scrolled horizontally
    <header className="fixed inset-x-0 top-0 z-50 bg-blue-900 text-white shadow-md">
      <div className="max-w-screen-xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3 md:py-4">
        {/* Left: Logo + Title */}
        <div className="flex items-center space-x-3 min-w-0">
          {/* Optional logo - uncomment if available */}
          {/* <img src="/src/assets/logo.png" alt="RVCE Logo" className="h-10 w-10 object-contain rounded-full" /> */}
          <h1 className="text-xl md:text-2xl font-bold truncate">Placed@RVCE</h1>
        </div>

        {/* Right: Navigation */}
        <nav className="flex flex-col md:flex-row items-end md:items-center mt-3 md:mt-0 space-y-2 md:space-y-0 md:space-x-6 font-medium w-full md:w-auto min-w-0">
          <Link to="/" className="block md:inline-block hover:text-yellow-300 transition truncate text-right md:text-left w-full md:w-auto">Home</Link>
          <Link to="/companystats" className="block md:inline-block hover:text-yellow-300 transition truncate text-right md:text-left w-full md:w-auto">Company Stats</Link>
          <Link to="/internshipExperience" className="block md:inline-block hover:text-yellow-300 transition truncate text-right md:text-left w-full md:w-auto">Internship</Link>
          <Link to="/contact" className="block md:inline-block hover:text-yellow-300 transition truncate text-right md:text-left w-full md:w-auto">Feedback</Link>
          <Link to="/chatbot" className="block md:inline-block hover:text-yellow-300 transition truncate text-right md:text-left w-full md:w-auto">Chatbot</Link>

          {user ? (
            <button onClick={handleLogout} className="block md:inline-block hover:text-yellow-300 transition bg-transparent border-none cursor-pointer text-right md:text-left w-full md:w-auto">
              Logout
            </button>
          ) : (
            <Link to="/login" className="block md:inline-block hover:text-yellow-300 transition truncate text-right md:text-left w-full md:w-auto">Login</Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;
