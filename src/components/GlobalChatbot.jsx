import React, { useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';

const GlobalChatbot = () => {
  const { user } = useAuth();

  useEffect(() => {
    // Only load chatbot for authenticated users
    if (!user) {
      // Hide chatbot if user logs out
      if (window.voiceflow && window.voiceflow.chat) {
        try {
          window.voiceflow.chat.close();
        } catch (error) {
          console.log('Chatbot already closed or not initialized');
        }
      }
      return;
    }

    // Check if script is already loaded
    if (window.voiceflow) {
      return;
    }

    // Load Voiceflow script using the exact code provided
    const script = document.createElement('script');
    script.type = 'text/javascript';
    
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
      // Cleanup script on unmount
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [user]);

  // This component doesn't render anything - Voiceflow handles the UI
  return null;
};

export default GlobalChatbot;
