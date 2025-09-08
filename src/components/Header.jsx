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
        const res = await axios.get(BASE_URL + "/auth/me", {
          withCredentials: true,
        });
        dispatch(addUser(res.data));
      } catch (err) {
        dispatch(removeUser());
      }
    }
    checkAuth();
  }, [dispatch]);

  // ✅ Logout
  const handleLogout = async () => {
    try {
      await axios.post(BASE_URL + "/logout", {}, { withCredentials: true });
      dispatch(removeUser());
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <header className="bg-blue-900 text-white shadow-md">
      <div className="container mx-auto flex justify-between items-center px-6 py-4">
        <div className="flex items-center space-x-3">
          <img
            src="src/assets/logo.png"
            alt="RVCE Logo"
            className="h-15 w-15 object-contain rounded-full"
          />
          <h1 className="text-2xl font-bold">Placed@RVCE</h1>
        </div>

        <nav className="space-x-6 font-medium">
          <Link to="/" className="hover:text-yellow-300 transition">
            Home
          </Link>
          <Link to="/companystats" className="hover:text-yellow-300 transition">
            Company Stats
          </Link>
          <Link
            to="/internshipExperience"
            className="hover:text-yellow-300 transition"
          >
            Internship
          </Link>
          <Link to="/contact" className="hover:text-yellow-300 transition">
            Feedback
          </Link>
          <Link to="/chatbot" className="hover:text-yellow-300 transition">
            Chatbot
          </Link>
          

          {user ? (
            <button
              onClick={handleLogout}
              className="hover:text-yellow-300 transition bg-transparent border-none cursor-pointer"
            >
              Logout
            </button>
          ) : (
            <Link to="/login" className="hover:text-yellow-300 transition">
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;
