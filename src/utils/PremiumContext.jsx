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
      const res = await axios.get(BASE_URL + "/premium/verify", {
        withCredentials: true,
      });
      
      if (res.data.isPremium) {
        setIsPremium(true);
        setMembershipType(res.data.membershipType || 'silver'); // Default to silver if not specified
      } else {
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
    return isPremium && (membershipType === 'silver' || membershipType === 'gold');
  };

  const hasChatbotAccess = () => {
    return isPremium && membershipType === 'gold';
  };

  const refreshPremiumStatus = () => {
    setLoading(true);
    checkPremiumStatus();
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
