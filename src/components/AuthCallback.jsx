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
    // Show success message
    if (signup) {
      alert('Welcome! Your account has been created successfully.');
    }
    
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
      <div className="flex justify-center items-center min-h-screen" style={{ backgroundColor: '#302C2C' }}>
        <div className="text-lg text-white">Processing login...</div>
      </div>
    );
  }

  return null;
};

export default AuthCallback;