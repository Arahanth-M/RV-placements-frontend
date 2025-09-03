import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { removeUser } from "../utils/userSlice";
import { useDispatch, useSelector } from "react-redux"; 
import { BASE_URL } from "../utils/constants";
import axios from "axios";

function Header() {
  const user = useSelector((store) => store.user); 
  const dispatch = useDispatch();
  const navigate = useNavigate();

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
          <Link to="/about" className="hover:text-yellow-300 transition">
            About Us
          </Link>
          <Link to="/contact" className="hover:text-yellow-300 transition">
            Contact Us
          </Link>
          <Link to="/chatbot" className="hover:text-yellow-300 transition">
            Chatbot
          </Link>
          <Link to="/resources" className="hover:text-yellow-300 transition">
            Resources
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
