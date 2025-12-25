

import React from "react";
import ReactPlayer from "react-player";
import { usePremium } from "../../utils/PremiumContext";
import { useAuth } from "../../utils/AuthContext";
import { Link } from "react-router-dom";

function VideoTab({ videoUrl }) {
  const { user } = useAuth();
  const { hasVideoAccess, isPremium } = usePremium();

  if (!videoUrl) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-slate-200">
        <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl p-6">
          <p className="text-slate-400">No video available for this company</p>
        </div>
      </div>
    );
  }

  // Check if user is logged in first
  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-slate-200">
        <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl p-6">
          <div className="text-center py-8">
            <div className="mb-6">
              <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-200 mb-2">Login Required</h3>
              <p className="text-slate-400 mb-4">
                Please sign in to access company videos and premium features.
              </p>
            </div>
            
            <div className="bg-orange-900/30 border border-orange-700 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-orange-300 mb-2">Sign in to continue</h4>
              <div className="text-sm text-orange-200 space-y-2">
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                  <span>Access to all company videos</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                  <span>Premium features and AI Chatbot</span>
                </div>
              </div>
            </div>

            <Link 
              to="/login" 
              className="inline-flex items-center px-6 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Sign In to Continue
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Check if user has video access (only after login)
  if (!hasVideoAccess()) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-slate-200">
        <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl p-6">
          <div className="text-center py-8">
            <div className="mb-6">
              <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-200 mb-2">Premium Video Content</h3>
              <p className="text-slate-400 mb-4">
                This company video is available for premium members only.
              </p>
            </div>
            
            <div className="bg-indigo-900/30 border border-indigo-700 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-indigo-300 mb-2">Get Premium Access</h4>
              <div className="text-sm text-indigo-200 space-y-2">
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
                  <span>Premium Plan: Access to all company videos + AI Chatbot</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  <span>Complete placement preparation suite for ₹300</span>
                </div>
              </div>
            </div>

            {/* PAYMENT GATEWAY INTEGRATION - COMMENTED OUT */}
            {/* <Link 
              to="/premium" 
              className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              Upgrade to Premium
            </Link> */}
            <p className="text-slate-400">Premium access is currently unavailable.</p>
          </div>
        </div>
      </div>
    );
  }

  console.log(videoUrl);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-slate-200">
      <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-indigo-400">Company Video</h2>
          <div className="flex items-center bg-green-600 text-white px-3 py-1 rounded-full text-sm">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Premium Member
          </div>
        </div>
        <div className="flex justify-center">
          <video
            src={videoUrl}
            controls
            width="720"
            height="400"
            crossOrigin="anonymous"
          />
        </div>
      </div>
    </div>
  );
}

export default VideoTab;
