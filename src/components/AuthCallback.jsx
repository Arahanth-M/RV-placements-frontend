import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { studentAPI } from '../utils/api';

const PLACEMENT_POPUP_FRESH_LOGIN_KEY = 'placementPopupFreshLogin';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { refreshUser, setStudentData } = useAuth(); 
  const [isProcessing, setIsProcessing] = useState(true);
  const [userData, setUserData] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      
      if (urlParams.get('login') === 'success' || urlParams.get('signup') === 'success') {
        try {
          // Cookie/JWT propagation can be slightly delayed after OAuth redirect.
          // Retry briefly before treating auth as failed.
          let fetchedUserData = null;
          const maxAttempts = 5;
          for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
            fetchedUserData = await refreshUser({ force: true });
            if (fetchedUserData) break;
            await new Promise((resolve) => setTimeout(resolve, 350));
          }
          
          if (fetchedUserData) {
            const signupFlag = urlParams.get('signup') === 'success';
            const adminFlag = urlParams.get('admin') === 'true';
            
            setUserData(fetchedUserData);
            setIsSignup(signupFlag);
            setIsAdmin(adminFlag);
            
            console.log(`${signupFlag ? 'Signup' : 'Login'} successful, user data:`, fetchedUserData);
            
            // Skip student data fetch for admin users
            if (adminFlag) {
              handleLoginComplete(fetchedUserData, signupFlag, adminFlag);
              return;
            }
            
            // Fetch student profile strictly by authenticated email
            await fetchStudentProfileByEmail(fetchedUserData, signupFlag, adminFlag);
          } else {
            console.error('No user data received after authentication');
            navigate('/', { replace: true });
            setIsProcessing(false);
          }
        } catch (err) {
          console.error("Failed to fetch user after authentication", err);
          navigate('/', { replace: true });
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
        navigate('/', { replace: true });
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [navigate, refreshUser]);

  // Strictly email-based profile fetch — no name matching
  const fetchStudentProfileByEmail = async (user, signup, admin) => {
    try {
      const userId = user?.userId || user?._id;
      console.log(`📡 [AuthCallback] Fetching profile by email for user: ${user?.email}`);
      
      const profileRes = await studentAPI.getProfile();
      
      if (profileRes.data) {
        console.log(`✅ [AuthCallback] Profile loaded: ${profileRes.data.Name} -> ${profileRes.data.Company}`);
        
        // Store strictly with user-specific key
        if (userId) {
          localStorage.setItem(`studentData_${userId}`, JSON.stringify(profileRes.data));
        }
        
        if (setStudentData) {
          setStudentData(profileRes.data);
        }
      } else {
        console.warn('⚠️ [AuthCallback] No profile data returned');
      }
    } catch (err) {
      console.error('❌ [AuthCallback] Profile fetch failed:', err.message);
      // Proceed without student data — user can still use other features
    }
    
    handleLoginComplete(user, signup, admin);
  };

  const handleLoginComplete = (user, signup, admin) => {
    if (admin) {
      sessionStorage.removeItem(PLACEMENT_POPUP_FRESH_LOGIN_KEY);
    } else {
      sessionStorage.setItem(PLACEMENT_POPUP_FRESH_LOGIN_KEY, '1');
    }

    if (admin) {
      window.location.replace('/admin/dashboard');
    } else {
      window.location.replace('/');
    }
    setIsProcessing(false);
  };

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-theme-app">
        <div className="w-full py-6 sm:py-10 md:py-14 px-4 sm:px-6 bg-theme-hero">
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

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16">
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