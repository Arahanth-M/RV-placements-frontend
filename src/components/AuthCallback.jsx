import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { authAPI, studentAPI } from '../utils/api';

const PLACEMENT_POPUP_FRESH_LOGIN_KEY = 'placementPopupFreshLogin';
const LOGIN_REDIRECT_PATH_KEY = "loginRedirectPath";
const LOGIN_INTENT_KEY = "loginIntent";
const LOGIN_INTENT_SPC = "spc";

const AuthCallback = () => {
  const navigate = useNavigate();
  const { refreshUser, setStudentData } = useAuth(); 
  const [isProcessing, setIsProcessing] = useState(true);
  const [accessDeniedMessage, setAccessDeniedMessage] = useState("");
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      
      if (urlParams.get('login') === 'success' || urlParams.get('signup') === 'success') {
        try {
          // Give the JWT cookie a brief moment to settle after the OAuth redirect,
          // then fetch the authenticated user once without retrying.
          await new Promise((resolve) => setTimeout(resolve, 100));
          const fetchedUserData = await refreshUser();
          
          if (fetchedUserData) {
            const loginIntent = sessionStorage.getItem(LOGIN_INTENT_KEY);
            const signupFlag = urlParams.get('signup') === 'success';
            const adminFlag = urlParams.get('admin') === 'true';

            if (loginIntent === LOGIN_INTENT_SPC) {
              const currentUserResponse = await authAPI.getCurrentUser();
              const spcUser = currentUserResponse?.data || null;

              if (!spcUser || spcUser.role !== LOGIN_INTENT_SPC) {
                sessionStorage.removeItem(LOGIN_INTENT_KEY);
                sessionStorage.removeItem(PLACEMENT_POPUP_FRESH_LOGIN_KEY);
                setAccessDeniedMessage("Not authorized as SPC");
                setIsProcessing(false);
                return;
              }
            }
            
            console.log(`${signupFlag ? 'Signup' : 'Login'} successful, user data:`, fetchedUserData);
            
            // Skip student data fetch for admin users
            if (adminFlag) {
              handleLoginComplete(fetchedUserData, signupFlag, adminFlag, loginIntent);
              return;
            }
            
            // Fetch student profile strictly by authenticated email
            await fetchStudentProfileByEmail(fetchedUserData, signupFlag, adminFlag, loginIntent);
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
  const fetchStudentProfileByEmail = async (user, signup, admin, loginIntent) => {
    try {
      const userId = user?.userId || user?._id;
      console.log(`📡 [AuthCallback] Fetching profile by email for user: ${user?.email}`);
      
      const profileRes = await studentAPI.getProfile();
      
      if (profileRes.data) {
        console.log(`✅ [AuthCallback] Profile loaded for ${user?.email}`);
        
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
      if (setStudentData) {
        setStudentData(null);
      }
      // Proceed without student data — user can still use other features
    }
    
    handleLoginComplete(user, signup, admin, loginIntent);
  };

  const handleLoginComplete = (user, signup, admin, loginIntent) => {
    sessionStorage.removeItem(LOGIN_INTENT_KEY);
    if (admin) {
      sessionStorage.removeItem(PLACEMENT_POPUP_FRESH_LOGIN_KEY);
    } else {
      sessionStorage.setItem(PLACEMENT_POPUP_FRESH_LOGIN_KEY, '1');
    }

    if (admin) {
      window.location.replace('/admin/dashboard');
    } else if (loginIntent === LOGIN_INTENT_SPC) {
      sessionStorage.removeItem(LOGIN_REDIRECT_PATH_KEY);
      window.location.replace('/spc-dashboard');
    } else {
      const storedRedirect = sessionStorage.getItem(LOGIN_REDIRECT_PATH_KEY);
      const safeRedirect =
        storedRedirect && storedRedirect.startsWith("/") ? storedRedirect : "/";
      sessionStorage.removeItem(LOGIN_REDIRECT_PATH_KEY);
      window.location.replace(safeRedirect);
    }
    setIsProcessing(false);
  };

  if (accessDeniedMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-app px-4">
        <div className="max-w-md w-full bg-theme-card border border-theme rounded-3xl p-8 text-center shadow-2xl">
          <h2 className="text-2xl font-bold text-red-600 mb-3">Access denied</h2>
          <p className="text-sm text-theme-secondary">{accessDeniedMessage}</p>
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => navigate("/", { replace: true })}
              className="rounded-xl bg-theme-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Back to students corner
            </button>
          </div>
        </div>
      </div>
    );
  }

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