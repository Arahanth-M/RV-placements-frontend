import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from './api';
import { CONFIG, BASE_URL } from './constants';

// Use a symbol to check if we're inside a provider
const AUTH_PROVIDER_SENTINEL = Symbol('AUTH_PROVIDER');

const AuthContext = createContext({
  user: null,
  isAdmin: false,
  loading: true,
  login: () => {},
  signup: () => {},
  logout: async () => {},
  checkUser: async () => {},
  setUser: () => {},
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
  const [loading, setLoading] = useState(true);

  // 7 hours in milliseconds
  const SESSION_DURATION = 7 * 60 * 60 * 1000; // 7 hours
  const LOGIN_TIMESTAMP_KEY = 'loginTimestamp';

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

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      // First check if session has expired
      if (isSessionExpired() && localStorage.getItem(LOGIN_TIMESTAMP_KEY)) {
        console.log('Session expired. Clearing user data.');
        clearLoginTimestamp();
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const response = await authAPI.getCurrentUser();
      if (response.data) {
        setUser(response.data);
        // Store login timestamp if not already stored (for existing sessions)
        if (!localStorage.getItem(LOGIN_TIMESTAMP_KEY)) {
          storeLoginTimestamp();
        }
        // Check admin status
        try {
          const adminResponse = await authAPI.isAdmin();
          setIsAdmin(adminResponse.data?.isAdmin || false);
        } catch (error) {
          setIsAdmin(false);
        }
      } else {
        setUser(null);
        setIsAdmin(false);
        clearLoginTimestamp();
      }
    } catch (error) {
      console.log('User not authenticated');
      setUser(null);
      setIsAdmin(false);
      clearLoginTimestamp();
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
      setUser(null);
      setIsAdmin(false);
      clearLoginTimestamp();
    } catch (error) {
      console.error('Logout failed:', error);
      setUser(null);
      setIsAdmin(false);
      clearLoginTimestamp();
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

  const refreshUser = async () => {
    setLoading(true);
    try {
      // Check if session has expired before refreshing
      if (isSessionExpired() && localStorage.getItem(LOGIN_TIMESTAMP_KEY)) {
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
        if (!localStorage.getItem(LOGIN_TIMESTAMP_KEY)) {
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

  const value = {
    user,
    isAdmin,
    loading,
    login,
    signup,
    logout,
    checkUser,
    setUser,
    refreshUser,
    _isProvider: true, // Mark that this is from a provider
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};