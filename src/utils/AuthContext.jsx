import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from './api';
import { CONFIG } from './constants';

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
    // ✅ Simple and consistent - force localhost for development
    const hostname = window.location.hostname;
    const baseUrl = (hostname === "localhost" || hostname === "127.0.0.1") 
      ? `http://localhost:${CONFIG.BACKEND_PORT}`
      : CONFIG.PRODUCTION_URL;
    
    const authUrl = `${baseUrl}/api/auth/google`;
    
    console.log('🚀 Redirecting to:', authUrl);
    console.log('🏠 Hostname detected:', hostname);
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