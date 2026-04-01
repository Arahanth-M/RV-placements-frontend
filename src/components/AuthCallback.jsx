import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { studentAPI } from '../utils/api';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { refreshUser, setStudentData } = useAuth(); 
  const [isProcessing, setIsProcessing] = useState(true);
  const [userData, setUserData] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSignup, setIsSignup] = useState(false);

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      
      if (urlParams.get('login') === 'success' || urlParams.get('signup') === 'success') {
        try {
          await new Promise(resolve => setTimeout(resolve, 500));
          const fetchedUserData = await refreshUser();
          
          if (fetchedUserData) {
            const signupFlag = urlParams.get('signup') === 'success';
            const adminFlag = urlParams.get('admin') === 'true';
            
            setUserData(fetchedUserData);
            setIsSignup(signupFlag);
            setIsAdmin(adminFlag);
            
            console.log(`${signupFlag ? 'Signup' : 'Login'} successful, user data:`, fetchedUserData);
            
            // Skip USN entry for admin users
            if (adminFlag) {
              handleLoginComplete(fetchedUserData, signupFlag, adminFlag);
              return;
            }
            
            // Try to fetch student data using Google username
            const googleUsername = fetchedUserData.username || fetchedUserData.displayName || '';
            const userId = fetchedUserData.userId || fetchedUserData._id;
            const studentDataKey = userId ? `studentData_${userId}` : 'studentData';
            const storedStudentData = localStorage.getItem(studentDataKey);
            
            if (storedStudentData) {
              // User already has student data stored, load it
              try {
                const parsedData = JSON.parse(storedStudentData);
                if (setStudentData) {
                  setStudentData(parsedData);
                }
                localStorage.setItem('studentData', storedStudentData);
                handleLoginComplete(fetchedUserData, signupFlag, adminFlag);
              } catch (err) {
                console.error('Error parsing stored student data:', err);
                // If parsing fails, try to fetch by username
                await fetchStudentDataByUsername(googleUsername, fetchedUserData, signupFlag, adminFlag);
              }
            } else if (googleUsername) {
              // No stored data, try to fetch by Google username
              await fetchStudentDataByUsername(googleUsername, fetchedUserData, signupFlag, adminFlag);
            } else {
              // No username available, proceed without student data
              handleLoginComplete(fetchedUserData, signupFlag, adminFlag);
            }
          } else {
            console.error('No user data received after authentication');
            navigate('/login', { replace: true });
            setIsProcessing(false);
          }
        } catch (err) {
          console.error("Failed to fetch user after authentication", err);
          navigate('/login', { replace: true });
          setIsProcessing(false);
        }
      } else if (urlParams.get('login') === 'failed') {
        const reason = urlParams.get('reason');
        if (reason === 'domain') {
          alert('Please login using your official college email (rvce.edu.in).');
        } else if (reason === 'not_allowed') {
          alert('Sign-in is restricted. This account is not authorized to use the app right now.');
        } else if (reason === 'not_found') {
          alert('User not found. You do not exist in the student database.');
        } else if (reason === 'not_admin') {
          alert('Access denied. Only admin can access this area.');
        } else {
          console.log('Authentication failed');
          alert('Authentication failed. Please try again.');
        }
        navigate('/', { replace: true });
        setIsProcessing(false);
      } else {
        console.log('Authentication callback invalid');
        navigate('/login', { replace: true });
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [navigate, refreshUser]);

  const fetchStudentDataByUsername = async (username, user, signup, admin) => {
    try {
      const response = await studentAPI.getStudentByName(username);
      if (response.data) {
        // Store student data in localStorage (user-specific) and context
        const userId = user?.userId || user?._id;
        const studentDataKey = userId ? `studentData_${userId}` : 'studentData';
        const studentDataString = JSON.stringify(response.data);
        
        // Store in user-specific key
        localStorage.setItem(studentDataKey, studentDataString);
        // Also store in generic key for backward compatibility
        localStorage.setItem('studentData', studentDataString);
        
        if (setStudentData) {
          setStudentData(response.data);
        }
        
        handleLoginComplete(user, signup, admin);
      } else {
        // Student data not found, proceed without it
        handleLoginComplete(user, signup, admin);
      }
    } catch (err) {
      console.error('Error fetching student data by username:', err);
      // If fetch fails, proceed without student data
      handleLoginComplete(user, signup, admin);
    }
  };

  const handleLoginComplete = (user, signup, admin) => {
    // Redirect admin to admin dashboard
    if (admin) {
      navigate('/admin/dashboard', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
    setIsProcessing(false);
  };

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-theme-app">
        <div className="w-full py-8 sm:py-12 md:py-16 px-4 sm:px-6 bg-theme-hero">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
              <div className="flex-1 w-full space-y-4">
                <div className="shimmer-box h-12 sm:h-14 md:h-16 w-full rounded-xl" />
                <div className="shimmer-box h-6 sm:h-7 w-[92%] rounded-lg" />
                <div className="shimmer-box h-6 sm:h-7 w-[85%] rounded-lg" />
              </div>
              <div className="flex-1 w-full">
                <div className="shimmer-box w-full rounded-xl" style={{ minHeight: '300px', maxHeight: '70vh' }} />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20">
          <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="bg-theme-card border-2 border-theme-accent rounded-2xl p-6 sm:p-8 space-y-3">
                <div className="shimmer-box h-10 w-10 rounded-full" />
                <div className="shimmer-box h-5 w-3/4 rounded-md" />
                <div className="shimmer-box h-4 w-full rounded-md" />
                <div className="shimmer-box h-4 w-[90%] rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default AuthCallback;