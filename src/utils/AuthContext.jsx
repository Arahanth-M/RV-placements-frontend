// import { createContext, useContext, useState, useEffect } from 'react';
// import { authAPI } from './api';

// const AuthContext = createContext();

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     checkUser();
//   }, []);

//   const checkUser = async () => {
//     try {
//       const response = await authAPI.getCurrentUser();
//       setUser(response.data);
//     } catch (error) {
//       console.log('User not authenticated');
//       setUser(null);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const login = () => {
//     window.location.href = 'http://localhost:7779/auth/google';
//   };

//   const logout = async () => {
//     try {
//       await authAPI.logout();
//       setUser(null);
//     } catch (error) {
//       console.error('Logout failed:', error);
//     }
//   };

//   const value = {
//     user,
//     loading,
//     login,
//     logout,
//     checkUser
//   };

//   return (
//     <AuthContext.Provider value={value}>
//       {children}
//     </AuthContext.Provider>
//   );
// };
import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from './api';
import { BASE_URL } from './constants';

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
      setUser(response.data);
    } catch (error) {
      console.log('User not authenticated');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = () => {
    window.location.href = BASE_URL + '/auth/google';
  };

  const logout = async () => {
    try {
      await authAPI.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    checkUser,
    setUser, // 👈 expose setUser for AuthCallback
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

