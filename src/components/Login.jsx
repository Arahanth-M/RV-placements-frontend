import { useState } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { addUser } from "../utils/userSlice";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../utils/constants";

const Login = () => {
  const [emailId, setEmailId] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isLoginForm, setIsLoginForm] = useState(true);
  const [error, setError] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await axios.post(
        BASE_URL + "/login",
        { emailId, password },
        { withCredentials: true }
      );
      dispatch(addUser(res.data));
      navigate("/");
    } catch (err) {
      setError(err?.response?.data || "Something went wrong");
    }
  };

  const handleSignUp = async () => {
    try {
      const res = await axios.post(
        BASE_URL + "/signup",
        { firstName, lastName, emailId, password },
        { withCredentials: true }
      );
      dispatch(addUser(res.data.data));
      navigate("/");
    } catch (err) {
      setError(err?.response?.data || "Something went wrong");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          {isLoginForm ? "Login" : "Sign Up"}
        </h2>

        <div className="space-y-4">
          {!isLoginForm && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email ID
            </label>
            <input
              type="email"
              value={emailId}
              onChange={(e) => setEmailId(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
            />
          </div>
        </div>

        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

        <div className="mt-6">
          <button
            onClick={isLoginForm ? handleLogin : handleSignUp}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md shadow hover:bg-blue-700 transition"
          >
            {isLoginForm ? "Login" : "Sign Up"}
          </button>
        </div>

        <p
          className="text-center text-sm text-gray-600 mt-4 cursor-pointer hover:underline"
          onClick={() => setIsLoginForm((value) => !value)}
        >
          {isLoginForm
            ? "New User? Signup Here"
            : "Existing User? Login Here"}
        </p>
      </div>
    </div>
  );
};

export default Login;


// // src/pages/Login.jsx (or wherever your file is)
// import { useEffect, useState } from "react";
// import axios from "axios";
// import { useDispatch } from "react-redux";
// import { addUser } from "../utils/userSlice";
// import { useNavigate } from "react-router-dom";
// import { BASE_URL } from "../utils/constants";

// const Login = () => {
//   const [emailId, setEmailId] = useState("");
//   const [password, setPassword] = useState("");
//   const [firstName, setFirstName] = useState("");
//   const [lastName, setLastName] = useState("");
//   const [isLoginForm, setIsLoginForm] = useState(true);
//   const [error, setError] = useState("");
//   const dispatch = useDispatch();
//   const navigate = useNavigate();

//   const handleLogin = async () => {
//     try {
//       const res = await axios.post(
//         BASE_URL + "/login",
//         { emailId, password },
//         { withCredentials: true }
//       );
//       dispatch(addUser(res.data));
//       navigate("/");
//     } catch (err) {
//       setError(err?.response?.data || "Something went wrong");
//     }
//   };

//   const handleSignUp = async () => {
//     try {
//       const res = await axios.post(
//         BASE_URL + "/signup",
//         { firstName, lastName, emailId, password },
//         { withCredentials: true }
//       );
//       dispatch(addUser(res.data.data));
//       navigate("/");
//     } catch (err) {
//       setError(err?.response?.data || "Something went wrong");
//     }
//   };

  
//   const handleGoogleResponse = async (response) => {
//     try {
//       // response.credential is the ID token
//       const res = await axios.post(
//         BASE_URL + "api/auth/google",
//         { idToken: response.credential },
//         { withCredentials: true }
//       );
//       dispatch(addUser(res.data));
//       navigate("/");
//     } catch (err) {
//       console.error("Google sign-in error:", err);
//       setError(err?.response?.data?.message || "Google sign-in failed");
//     }
//   };

//   useEffect(() => {
//     // Wait for the GIS script to load
//     const tryInit = () => {
//       if (!window.google || !window.google.accounts) return;
//       window.google.accounts.id.initialize({
//         client_id: "319138363144-ubi4r2p9lkta6g3839bkoshdbdft1plu.apps.googleusercontent.com",
//         callback: handleGoogleResponse,
//         auto_select: false,
//       });
//       window.google.accounts.id.renderButton(
//         document.getElementById("googleBtn"),
//         { theme: "outline", size: "large", shape: "pill", width: 300 }
//       );
//     };

//     // Try init immediately and also check again a bit later (script may not be ready instantly)
//     tryInit();
//     const t = setInterval(() => {
//       tryInit();
//     }, 300);
//     // stop trying after a while
//     setTimeout(() => clearInterval(t), 3000);

//     return () => clearInterval(t);
//   }, []);

//   return (
//     <div className="flex justify-center items-center min-h-screen bg-gray-100 px-4">
//       <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8">
//         <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
//           {isLoginForm ? "Login" : "Sign Up"}
//         </h2>

//         <div className="space-y-4">
//           {!isLoginForm && (
//             <>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">
//                   First Name
//                 </label>
//                 <input
//                   type="text"
//                   value={firstName}
//                   onChange={(e) => setFirstName(e.target.value)}
//                   className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">
//                   Last Name
//                 </label>
//                 <input
//                   type="text"
//                   value={lastName}
//                   onChange={(e) => setLastName(e.target.value)}
//                   className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
//                 />
//               </div>
//             </>
//           )}

//           <div>
//             <label className="block text-sm font-medium text-gray-700">
//               Email ID
//             </label>
//             <input
//               type="email"
//               value={emailId}
//               onChange={(e) => setEmailId(e.target.value)}
//               className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700">
//               Password
//             </label>
//             <input
//               type="password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
//             />
//           </div>
//         </div>

//         {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

//         <div className="mt-6">
//           <button
//             onClick={isLoginForm ? handleLogin : handleSignUp}
//             className="w-full bg-blue-600 text-white py-2 px-4 rounded-md shadow hover:bg-blue-700 transition"
//           >
//             {isLoginForm ? "Login" : "Sign Up"}
//           </button>
//         </div>

//         {/* Divider */}
//         <div className="flex items-center my-6">
//           <div className="flex-grow h-px bg-gray-200" />
//           <span className="px-3 text-gray-500 text-sm">or</span>
//           <div className="flex-grow h-px bg-gray-200" />
//         </div>

//         {/* GOOGLE BUTTON TARGET */}
//         <div id="googleBtn" className="flex justify-center" />

//         <p
//           className="text-center text-sm text-gray-600 mt-6 cursor-pointer hover:underline"
//           onClick={() => setIsLoginForm((value) => !value)}
//         >
//           {isLoginForm ? "New User? Signup Here" : "Existing User? Login Here"}
//         </p>
//       </div>
//     </div>
//   );
// };

// export default Login;
