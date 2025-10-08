import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { BASE_URL } from './constants';

const PremiumContext = createContext();

export const usePremium = () => {
  const context = useContext(PremiumContext);
  if (!context) {
    throw new Error('usePremium must be used within a PremiumProvider');
  }
  return context;
};

export const PremiumProvider = ({ children }) => {
  const [isPremium, setIsPremium] = useState(false);
  const [membershipType, setMembershipType] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkPremiumStatus = async () => {
    try {
      console.log('Checking premium status...');
      const res = await axios.get(BASE_URL + "/api/payment/verify", {
        withCredentials: true,
      });
      
      console.log('Premium status response:', res.data);
      
      if (res.data.isPremium) {
        console.log('User is premium, setting status...');
        setIsPremium(true);
        setMembershipType("premium");
      } else {
        console.log('User is not premium');
        setIsPremium(false);
        setMembershipType(null);
      }
    } catch (error) {
      console.error('Error checking premium status:', error);
      setIsPremium(false);
      setMembershipType(null);
    } finally {
      setLoading(false);
    }
  };

  const hasVideoAccess = () => {
    return isPremium;
  };

  const hasChatbotAccess = () => {
    return isPremium;
  };

  const refreshPremiumStatus = async () => {
    setLoading(true);
    try {
      // First try the force refresh endpoint
      try {
        const refreshResponse = await axios.post(BASE_URL + "/api/payment/refresh-status", {}, {
          withCredentials: true,
        });
        
        console.log('Force refresh response:', refreshResponse.data);
        
        if (refreshResponse.data.success) {
          setIsPremium(refreshResponse.data.isPremium);
          setMembershipType(refreshResponse.data.membershipType);
          console.log('Premium status force refreshed:', { 
            isPremium: refreshResponse.data.isPremium, 
            membershipType: refreshResponse.data.membershipType 
          });
          return;
        }
      } catch (refreshError) {
        console.log('Force refresh failed, falling back to regular check:', refreshError);
      }
      
      // Fallback to regular check
      await checkPremiumStatus();
      console.log('Premium status refreshed:', { isPremium, membershipType });
    } catch (error) {
      console.error('Error refreshing premium status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkPremiumStatus();
  }, []);

  const value = {
    isPremium,
    membershipType,
    loading,
    hasVideoAccess,
    hasChatbotAccess,
    refreshPremiumStatus,
  };

  return (
    <PremiumContext.Provider value={value}>
      {children}
    </PremiumContext.Provider>
  );
};
