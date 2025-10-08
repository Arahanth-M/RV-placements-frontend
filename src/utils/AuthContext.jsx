import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from './api';
import { CONFIG, BASE_URL } from './constants';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      if (response.data) {
        setUser(response.data);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.log('User not authenticated');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = () => {
    // ✅ Use consistent BASE_URL for all API calls
    const authUrl = `${BASE_URL}/api/auth/google`;
    
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

  const logout = async () => {
    try {
      await authAPI.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      setUser(null);
    }
  };

  const refreshUser = async () => {
    setLoading(true);
    try {
      const response = await authAPI.getCurrentUser();
      if (response.data) {
        setUser(response.data);
        return response.data;
      } else {
        setUser(null);
        return null;
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    checkUser,
    setUser,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};