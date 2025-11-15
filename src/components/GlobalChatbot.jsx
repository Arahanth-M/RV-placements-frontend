import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';

const GlobalChatbot = () => {
  const { user } = useAuth();
  const location = useLocation();
  const scriptRef = useRef(null);
  const previousUserIdRef = useRef(null);

  // Check if we're on the 2026 stats page
  // CompanyStats component will set localStorage when selectedYear === 2026
  const [shouldShowChatbot, setShouldShowChatbot] = React.useState(false);

  const cleanupChatbot = () => {
    // Close chatbot if it's open
    if (window.voiceflow && window.voiceflow.chat) {
      try {
        window.voiceflow.chat.close();
      } catch (error) {
        console.log('Chatbot already closed or not initialized');
      }
    }

    // Clear chat history from localStorage
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes('voiceflow') || key.includes('vf-')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.log('Error clearing localStorage:', error);
    }

    // Clear sessionStorage
    try {
      const keys = Object.keys(sessionStorage);
      keys.forEach(key => {
        if (key.includes('voiceflow') || key.includes('vf-')) {
          sessionStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.log('Error clearing sessionStorage:', error);
    }

    // Remove Voiceflow widget from DOM
    const voiceflowWidget = document.querySelector('[data-voiceflow]');
    if (voiceflowWidget) {
      voiceflowWidget.remove();
    }

    // Remove any Voiceflow-related elements
    const voiceflowElements = document.querySelectorAll('[id*="voiceflow"], [class*="voiceflow"]');
    voiceflowElements.forEach(element => element.remove());

    // Clean up global Voiceflow object
    if (window.voiceflow) {
      delete window.voiceflow;
    }

    // Remove script if it exists
    if (scriptRef.current && document.head.contains(scriptRef.current)) {
      document.head.removeChild(scriptRef.current);
      scriptRef.current = null;
    }
  };

  useEffect(() => {
    // Check localStorage for selected year
    const checkSelectedYear = () => {
      const selectedYear = localStorage.getItem('companystats_selectedYear');
      const isOnCompanystatsPage = location.pathname === '/companystats';
      const shouldShow = isOnCompanystatsPage && selectedYear === '2026';
      setShouldShowChatbot(shouldShow);
      
      // If we're not on the right page or year, cleanup chatbot
      if (!shouldShow) {
        cleanupChatbot();
      }
    };

    checkSelectedYear();
    
    // Listen for storage changes (when CompanyStats updates the selected year)
    const handleStorageChange = () => {
      checkSelectedYear();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically in case of same-tab updates (localStorage events don't fire in same tab)
    const interval = setInterval(checkSelectedYear, 500);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
      // Cleanup when navigating away
      cleanupChatbot();
    };
  }, [location.pathname]);

  useEffect(() => {
    // Only load chatbot for authenticated users and only on 2026 stats page
    if (!user || !shouldShowChatbot) {
      // Clean up chatbot completely when user logs out or not on correct page
      cleanupChatbot();
      previousUserIdRef.current = null;
      return;
    }

    // Check if user has changed - if so, clear chat history and reload
    const currentUserId = user._id || user.email || user.userId;
    if (previousUserIdRef.current && previousUserIdRef.current !== currentUserId) {
      console.log('User changed, clearing chat history and reloading chatbot...');
      cleanupChatbot();
      // Reset the script reference so it can be reloaded
      scriptRef.current = null;
      // Clear the window.voiceflow to force reload
      if (window.voiceflow) {
        delete window.voiceflow;
      }
      // Update user ID reference
      previousUserIdRef.current = currentUserId;
      // Continue to load chatbot for new user (don't return)
    } else if (!previousUserIdRef.current) {
      // Set current user ID for first load
      previousUserIdRef.current = currentUserId;
    }

    // Check if script is already loaded for current user
    if (window.voiceflow && previousUserIdRef.current === currentUserId) {
      return;
    }

    // Load Voiceflow script using the exact code provided
    const script = document.createElement('script');
    script.type = 'text/javascript';
    scriptRef.current = script;
    
    script.onload = function() {
      // Clear any existing chat history before loading
      try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.includes('voiceflow') || key.includes('vf-')) {
            localStorage.removeItem(key);
          }
        });
      } catch (error) {
        console.log('Error clearing localStorage before load:', error);
      }

      // Load chatbot with user-specific session
      window.voiceflow.chat.load({
        verify: { projectID: '690f139d0e40171b6a2e06cc' },
        url: 'https://general-runtime.voiceflow.com',
        versionID: 'production',
        voice: {
          url: "https://runtime-api.voiceflow.com"
        },
        // Add user-specific session identifier to isolate conversations
        // This ensures each user gets their own isolated chat session
        session: {
          userID: user._id || user.email || user.userId || `user-${Date.now()}`,
        }
      });
    };
    
    script.src = "https://cdn.voiceflow.com/widget-next/bundle.mjs";
    
    // Insert script before the first script tag
    const firstScript = document.getElementsByTagName('script')[0];
    if (firstScript) {
      firstScript.parentNode.insertBefore(script, firstScript);
    } else {
      document.head.appendChild(script);
    }

    return () => {
      // Cleanup on unmount or user change
      cleanupChatbot();
    };
  }, [user, shouldShowChatbot]);

  // This component doesn't render anything - Voiceflow handles the UI
  return null;
};

export default GlobalChatbot;
