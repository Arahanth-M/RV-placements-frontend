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
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { authAPI } from '../utils/api';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();

//   useEffect(() => {
//     const handleCallback = async () => {
//       const urlParams = new URLSearchParams(window.location.search);

//       if (urlParams.get('login') === 'success') {
//         try {
//           // ✅ Immediately fetch current user and update context
//           const response = await authAPI.getCurrentUser();
//           setUser(response.data);

//           // Redirect after setting user
//           navigate('/', { replace: true });
//         } catch (err) {
//           console.error("Failed to fetch user after login", err);
//           navigate('/login', { replace: true });
//         }
//       } else {
//         navigate('/login', { replace: true });
//       }
//     };

//     handleCallback();
//   }, [navigate, setUser]);

useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
  
      if (urlParams.get('login') === 'success') {
        try {
          // Small delay so cookie attaches
          setTimeout(async () => {
            try {
              const response = await authAPI.getCurrentUser();
              setUser(response.data);
  
              // 👇 Now that user is set, redirect and refresh once
              navigate('/', { replace: true });
              window.location.reload(); // refresh only once after login
            } catch (err) {
              console.error("Failed to fetch user after login", err);
              navigate('/login', { replace: true });
            }
          }, 200);
        } catch (err) {
          console.error("Callback error", err);
          navigate('/login', { replace: true });
        }
      } else {
        navigate('/login', { replace: true });
      }
    };
  
    handleCallback();
  }, [navigate, setUser]);
  
  

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-lg">Processing login...</div>
    </div>
  );
};

export default AuthCallback;
