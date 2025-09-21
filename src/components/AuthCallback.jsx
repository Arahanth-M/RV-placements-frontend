// import { useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../utils/AuthContext';

// const AuthCallback = () => {
//   const navigate = useNavigate();
//   const { checkUser } = useAuth();

//   useEffect(() => {
//     const handleCallback = async () => {
//       // Check URL parameters for login success
//       const urlParams = new URLSearchParams(window.location.search);
//       if (urlParams.get('login') === 'success') {
//         // Refresh user data after successful login
//         await checkUser();
//         // Redirect to home or previous page
//         navigate('/', { replace: true });
//       }
//     };

//     handleCallback();
//   }, [checkUser, navigate]);

//   return (
//     <div className="flex justify-center items-center min-h-screen">
//       <div className="text-lg">Processing login...</div>
//     </div>
//   );
// };

// export default AuthCallback;
// import { useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../utils/AuthContext';
// import { authAPI } from '../utils/api';

// const AuthCallback = () => {
//   const navigate = useNavigate();
//   const { setUser } = useAuth();




// useEffect(() => {
//     const handleCallback = async () => {
//       const urlParams = new URLSearchParams(window.location.search);
  
//       if (urlParams.get('login') === 'success') {
//         try {
//           // Small delay so cookie attaches
//           setTimeout(async () => {
//             try {
//               const response = await authAPI.getCurrentUser();
//               setUser(response.data);
  
//               // 👇 Now that user is set, redirect and refresh once
//               navigate('/', { replace: true });
//               window.location.reload(); // refresh only once after login
//             } catch (err) {
//               console.error("Failed to fetch user after login", err);
//               navigate('/login', { replace: true });
//             }
//           }, 200);
//         } catch (err) {
//           console.error("Callback error", err);
//           navigate('/login', { replace: true });
//         }
//       } else {
//         navigate('/login', { replace: true });
//       }
//     };
  
//     handleCallback();
//   }, [navigate, setUser]);
  
  

//   return (
//     <div className="flex justify-center items-center min-h-screen">
//       <div className="text-lg">Processing login...</div>
//     </div>
//   );
// };

// export default AuthCallback;


import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth(); // CHANGE: Using refreshUser instead of setUser
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      
      if (urlParams.get('login') === 'success') {
        try {
          // CHANGE: Wait a bit longer for session to be established
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // CHANGE: Use refreshUser instead of manual API call
          const userData = await refreshUser();
          
          if (userData) {
            console.log('Login successful, user data:', userData);
            navigate('/', { replace: true });
          } else {
            console.error('No user data received after login');
            navigate('/login', { replace: true });
          }
        } catch (err) {
          console.error("Failed to fetch user after login", err);
          navigate('/login', { replace: true });
        }
      } else {
        console.log('Login was not successful or callback invalid');
        navigate('/login', { replace: true });
      }
      
      setIsProcessing(false);
    };

    handleCallback();
  }, [navigate, refreshUser]);

  if (isProcessing) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Processing login...</div>
      </div>
    );
  }

  return null;
};

export default AuthCallback;