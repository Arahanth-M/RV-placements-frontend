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
// import { createContext, useContext, useState, useEffect } from 'react';
// import { authAPI } from './api';
// import { BASE_URL } from './constants';

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
//     window.location.href = BASE_URL + '/auth/google';
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
//     checkUser,
//     setUser, // 👈 expose setUser for AuthCallback
//   };

//   return (
//     <AuthContext.Provider value={value}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// import { createContext, useContext, useState, useEffect } from 'react';
// import { authAPI } from './api';
// import { BASE_URL } from './constants';

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
//       if (response.data) {
//         setUser(response.data);
//       } else {
//         setUser(null);
//       }
//     } catch (error) {
//       console.log('User not authenticated');
//       setUser(null);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const login = () => {
//     window.location.href = BASE_URL + '/auth/google';
//   };

//   const logout = async () => {
//     try {
//       await authAPI.logout();
//       setUser(null);
//     } catch (error) {
//       console.error('Logout failed:', error);
//       // Still set user to null even if logout request fails
//       setUser(null);
//     }
//   };

//   // CHANGE: Added refreshUser method for post-login user fetch
//   const refreshUser = async () => {
//     setLoading(true);
//     try {
//       const response = await authAPI.getCurrentUser();
//       if (response.data) {
//         setUser(response.data);
//         return response.data;
//       } else {
//         setUser(null);
//         return null;
//       }
//     } catch (error) {
//       console.error('Failed to refresh user:', error);
//       setUser(null);
//       return null;
//     } finally {
//       setLoading(false);
//     }
//   };

//   const value = {
//     user,
//     loading,
//     login,
//     logout,
//     checkUser,
//     setUser,
//     refreshUser, // CHANGE: Added refreshUser to context
//   };

//   return (
//     <AuthContext.Provider value={value}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from './api';

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
    
    const baseUrl = window.location.hostname === "localhost"
      ? "http://localhost:7779"
      : "http://lastminuteplacementprep.in";
    
    window.location.href = `${baseUrl}/api/auth/google`;
  };

  const logout = async () => {
    try {
      await authAPI.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      // Still set user to null even if logout request fails
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