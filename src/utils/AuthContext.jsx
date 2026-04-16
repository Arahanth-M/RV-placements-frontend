import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from './api';
import { BASE_URL } from './constants';

// Use a symbol to check if we're inside a provider
const AUTH_PROVIDER_SENTINEL = Symbol('AUTH_PROVIDER');

const AuthContext = createContext({
  user: null,
  isAdmin: false,
  studentData: null,
  loading: true,
  login: () => {},
  signup: () => {},
  logout: async () => {},
  checkUser: async () => {},
  setUser: () => {},
  setStudentData: () => {},
  refreshUser: async () => null,
  _isProvider: false, // Sentinel to check if inside provider
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  // Check if we're inside a provider by checking the sentinel value
  if (!context || context._isProvider !== true) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  // Remove the sentinel from the returned value
  const { _isProvider, ...authContext } = context;
  return authContext;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);

  // 7 hours in milliseconds
  const SESSION_DURATION = 7 * 60 * 60 * 1000; // 7 hours
  const LOGIN_TIMESTAMP_KEY = 'loginTimestamp';
  const LAST_USER_KEY = 'lastUser';
  const LAST_USER_IS_ADMIN_KEY = 'lastUserIsAdmin';

  // Check if session has expired
  const isSessionExpired = () => {
    const loginTimestamp = localStorage.getItem(LOGIN_TIMESTAMP_KEY);
    if (!loginTimestamp) return true;
    
    const loginTime = parseInt(loginTimestamp, 10);
    const currentTime = Date.now();
    const elapsedTime = currentTime - loginTime;
    
    return elapsedTime >= SESSION_DURATION;
  };

  // Store login timestamp
  const storeLoginTimestamp = () => {
    localStorage.setItem(LOGIN_TIMESTAMP_KEY, Date.now().toString());
  };

  // Clear login timestamp
  const clearLoginTimestamp = () => {
    localStorage.removeItem(LOGIN_TIMESTAMP_KEY);
  };

  // Load student data from localStorage when user changes
  useEffect(() => {
    if (user) {
      const userId = user.userId || user._id;
      const studentDataKey = userId ? `studentData_${userId}` : null;
      const storedStudentData = studentDataKey ? localStorage.getItem(studentDataKey) : null;
      
      if (storedStudentData) {
        try {
          const parsedData = JSON.parse(storedStudentData);
          setStudentData(parsedData);
        } catch (err) {
          console.error('Error parsing stored student data:', err);
          if (studentDataKey) localStorage.removeItem(studentDataKey);
        }
      } else {
        // Clear student data if user changes and no data found
        setStudentData(null);
      }
    } else {
      // Clear student data when user logs out
      setStudentData(null);
    }
  }, [user]);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      // If we're offline, fall back to last-known user for read-only/offline mode
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        const storedUser = localStorage.getItem(LAST_USER_KEY);
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            const storedIsAdmin = localStorage.getItem(LAST_USER_IS_ADMIN_KEY);
            // In offline mode, treat user as non-admin to avoid admin writes
            const offlineIsAdmin = storedIsAdmin ? JSON.parse(storedIsAdmin) === true : false;
            setIsAdmin(offlineIsAdmin && false);
          } catch {
            setUser(null);
            setIsAdmin(false);
          }
        } else {
          setUser(null);
          setIsAdmin(false);
        }
        setLoading(false);
        return;
      }

      // First check if session has expired
      if (isSessionExpired() && localStorage.getItem(LOGIN_TIMESTAMP_KEY)) {
        console.log('Session expired. Clearing user data.');
        clearLoginTimestamp();
        setUser(null);
        setIsAdmin(false);
        localStorage.removeItem(LAST_USER_KEY);
        localStorage.removeItem(LAST_USER_IS_ADMIN_KEY);
        setLoading(false);
        return;
      }

      const response = await authAPI.getCurrentUser();
      if (response.data) {
        setUser(response.data);
        // Persist last-known user for offline read-only mode
        localStorage.setItem(LAST_USER_KEY, JSON.stringify(response.data));
        // Store login timestamp if not already stored (for existing sessions)
        if (!localStorage.getItem(LOGIN_TIMESTAMP_KEY)) {
          storeLoginTimestamp();
        }
        // Check admin status
        try {
          const adminResponse = await authAPI.isAdmin();
          const adminFlag = adminResponse.data?.isAdmin || false;
          setIsAdmin(adminFlag);
          localStorage.setItem(LAST_USER_IS_ADMIN_KEY, JSON.stringify(adminFlag));
        } catch (error) {
          setIsAdmin(false);
          localStorage.setItem(LAST_USER_IS_ADMIN_KEY, JSON.stringify(false));
        }
      } else {
        setUser(null);
        setIsAdmin(false);
        clearLoginTimestamp();
        localStorage.removeItem(LAST_USER_KEY);
        localStorage.removeItem(LAST_USER_IS_ADMIN_KEY);
      }
    } catch (error) {
      console.log('User not authenticated');
      setUser(null);
      setIsAdmin(false);
      clearLoginTimestamp();
      localStorage.removeItem(LAST_USER_KEY);
      localStorage.removeItem(LAST_USER_IS_ADMIN_KEY);
    } finally {
      setLoading(false);
    }
  };

  const login = (isAdmin = false) => {
    // ✅ Use consistent BASE_URL for all API calls
    const authUrl = isAdmin 
      ? `${BASE_URL}/api/auth/google/admin`
      : `${BASE_URL}/api/auth/google`;
    
    console.log('🚀 Redirecting to login:', authUrl);
    console.log('🏠 Hostname detected:', window.location.hostname);
    window.location.href = authUrl;
  };

  const signup = () => {
    // ✅ Use signup endpoint that forces account selection
    const authUrl = `${BASE_URL}/api/auth/google/signup`;
    
    console.log('🚀 Redirecting to signup:', authUrl);
    console.log('🏠 Hostname detected:', window.location.hostname);
    window.location.href = authUrl;
  };

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
      
      // Clear user-specific sessionStorage items
      const keysToRemove = [
        'companystats_selectedYear',
        'companystats_search',
        'companystats_category',
        'companystats_cluster',
        'companystats_dream_page',
        'companystats_open_dream_page',
        'companystats_placement_tier',
        'companystats_page',
        'fromCompanyCards'
      ];
      
      // Remove all user-specific sessionStorage keys
      Object.keys(sessionStorage).forEach(key => {
        keysToRemove.forEach(baseKey => {
          if (key.startsWith(baseKey)) {
            sessionStorage.removeItem(key);
          }
        });
      });
      
      // Clear ALL student data keys from localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('studentData')) {
          localStorage.removeItem(key);
        }
      });
      setStudentData(null);
      setUser(null);
      setIsAdmin(false);
      clearLoginTimestamp();
      localStorage.removeItem(LAST_USER_KEY);
      localStorage.removeItem(LAST_USER_IS_ADMIN_KEY);
    } catch (error) {
      console.error('Logout failed:', error);
      
      // Clear sessionStorage even if logout API call fails
      const keysToRemove = [
        'companystats_selectedYear',
        'companystats_search',
        'companystats_category',
        'companystats_cluster',
        'companystats_dream_page',
        'companystats_open_dream_page',
        'companystats_placement_tier',
        'companystats_page',
        'fromCompanyCards'
      ];
      
      Object.keys(sessionStorage).forEach(key => {
        keysToRemove.forEach(baseKey => {
          if (key.startsWith(baseKey)) {
            sessionStorage.removeItem(key);
          }
        });
      });
      
      // Clear ALL student data keys from localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('studentData')) {
          localStorage.removeItem(key);
        }
      });
      setStudentData(null);
      setUser(null);
      setIsAdmin(false);
      clearLoginTimestamp();
      localStorage.removeItem(LAST_USER_KEY);
      localStorage.removeItem(LAST_USER_IS_ADMIN_KEY);
    }
  }, []);

  // Check session expiry and logout if needed
  const checkSessionExpiry = useCallback(async () => {
    if (user && isSessionExpired()) {
      console.log('Session expired after 7 hours. Logging out...');
      await logout();
      // Optionally show a message to the user
      alert('Your session has expired after 7 hours for security purposes. Please login again.');
    }
  }, [user, logout]);

  // Set up periodic session expiry check (every 5 minutes)
  useEffect(() => {
    if (!user) return;

    // Check immediately
    checkSessionExpiry();

    // Set up interval to check every 5 minutes
    const intervalId = setInterval(() => {
      checkSessionExpiry();
    }, 5 * 60 * 1000); // Check every 5 minutes

    // Check session when page becomes visible (user switches back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkSessionExpiry();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, checkSessionExpiry]);

  const refreshUser = async (options = {}) => {
    const force = options?.force === true;
    setLoading(true);
    try {
      // If offline, reuse last-known user rather than calling API
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        const storedUser = localStorage.getItem(LAST_USER_KEY);
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            const storedIsAdmin = localStorage.getItem(LAST_USER_IS_ADMIN_KEY);
            const offlineIsAdmin = storedIsAdmin ? JSON.parse(storedIsAdmin) === true : false;
            setIsAdmin(offlineIsAdmin && false);
          } catch {
            setUser(null);
            setIsAdmin(false);
          }
        } else {
          setUser(null);
          setIsAdmin(false);
        }
        setLoading(false);
        return null;
      }

      // Check if session has expired before refreshing
      if (!force && isSessionExpired() && localStorage.getItem(LOGIN_TIMESTAMP_KEY)) {
        console.log('Session expired. Logging out...');
        clearLoginTimestamp();
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
        return null;
      }

      const response = await authAPI.getCurrentUser();
      if (response.data) {
        setUser(response.data);
        // Store login timestamp only if it doesn't exist (fresh login)
        // This prevents resetting the timer on manual refreshes
        if (force || !localStorage.getItem(LOGIN_TIMESTAMP_KEY)) {
          storeLoginTimestamp();
        }
        // Check admin status
        try {
          const adminResponse = await authAPI.isAdmin();
          setIsAdmin(adminResponse.data?.isAdmin || false);
        } catch (error) {
          setIsAdmin(false);
        }
        return response.data;
      } else {
        setUser(null);
        setIsAdmin(false);
        clearLoginTimestamp();
        return null;
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      setUser(null);
      setIsAdmin(false);
      clearLoginTimestamp();
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Wrapper for setStudentData that also updates localStorage (user-specific)
  const handleSetStudentData = useCallback((data) => {
    setStudentData(data);
    if (data && user) {
      const userId = user.userId || user._id;
      const studentDataKey = userId ? `studentData_${userId}` : 'studentData';
      const dataString = JSON.stringify(data);
      localStorage.setItem(studentDataKey, dataString);
      // Also store in generic key for backward compatibility
      localStorage.setItem('studentData', dataString);
    } else {
      // Clear both user-specific and generic keys
      if (user) {
        const userId = user.userId || user._id;
        const studentDataKey = userId ? `studentData_${userId}` : 'studentData';
        localStorage.removeItem(studentDataKey);
      }
      localStorage.removeItem('studentData');
    }
  }, [user]);

  const value = {
    user,
    isAdmin,
    studentData,
    loading,
    login,
    signup,
    logout,
    checkUser,
    setUser,
    setStudentData: handleSetStudentData,
    refreshUser,
    _isProvider: true, // Mark that this is from a provider
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};