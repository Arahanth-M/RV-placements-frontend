import React, { useEffect, useRef } from 'react';
import { useAuth } from '../utils/AuthContext';

const GlobalChatbot = () => {
  const { user } = useAuth();
  const scriptRef = useRef(null);

  const cleanupChatbot = () => {
    // Close chatbot if it's open
    if (window.voiceflow && window.voiceflow.chat) {
      try {
        window.voiceflow.chat.close();
      } catch (error) {
        console.log('Chatbot already closed or not initialized');
      }
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
    // Only load chatbot for authenticated users
    if (!user) {
      // Clean up chatbot completely when user logs out
      cleanupChatbot();
      return;
    }

    // Check if script is already loaded
    if (window.voiceflow) {
      return;
    }

    // Load Voiceflow script using the exact code provided
    const script = document.createElement('script');
    script.type = 'text/javascript';
    scriptRef.current = script;
    
    script.onload = function() {
      window.voiceflow.chat.load({
        verify: { projectID: '68ebb4863370adf431e18e5b' },
        url: 'https://general-runtime.voiceflow.com',
        versionID: 'production',
        voice: {
          url: "https://runtime-api.voiceflow.com"
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
      // Cleanup on unmount
      cleanupChatbot();
    };
  }, [user]);

  // This component doesn't render anything - Voiceflow handles the UI
  return null;
};

export default GlobalChatbot;
