import React from 'react';

const Feedback = () => {
  // Placeholder Google Forms URLs - Replace with actual form URLs
  const form1Url = "https://docs.google.com/forms/d/e/1FAIpQLSfqe1Y_8bFdOfp6_NL1U948vBMTZRpFbYn5nUkLeQxY4-PvDA/viewform?pli=1";
  const form2Url = "https://docs.google.com/forms/d/e/1FAIpQLScK4_tn14N7T1WLOQF-ZD_HpcSajyMDtkp1exA4weBsTdsCqQ/viewform";

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#302C2C' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Share Your Experience
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            Help us improve by sharing your feedback and experiences
          </p>
        </div>

        {/* Feedback Forms */}
        <div className="space-y-8">
          {/* Form 1 */}
          <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="w-12 h-12 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <h2 className="text-2xl font-semibold text-indigo-400">
                  Placement Experience Form
                </h2>
                <p className="text-slate-400 mt-1">
                  Share your overall experience and suggestions
                </p>
              </div>
            </div>
            <a
              href={form1Url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors duration-200 mt-4"
            >
              Fill Out Form 1
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

          {/* Form 2 */}
          <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <h2 className="text-2xl font-semibold text-indigo-400">
                  Internship Experience Form
                </h2>
                <p className="text-slate-400 mt-1">
                  Share your interview experiences and insights
                </p>
              </div>
            </div>
            <a
              href={form2Url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors duration-200 mt-4"
            >
              Fill Out Form 2
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-indigo-900/30 border border-indigo-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-indigo-400 mb-2">
            💡 Why Your Feedback Matters
          </h3>
          <p className="text-slate-300 text-sm">
            Your feedback helps us improve our platform, add better resources, and create a more valuable experience 
            for all students. We appreciate every response and use it to make continuous improvements.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Feedback;

