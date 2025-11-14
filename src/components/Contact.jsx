import React from "react";
import { FaEnvelope, FaExternalLinkAlt, FaUniversity } from "react-icons/fa";

function Contact() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-100 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">Contact Us</h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-600">
            Get in touch with RVCE Placement Office
          </p>
        </div>

        {/* Contact Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Email Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 hover:shadow-xl transition-shadow">
            <div className="flex items-center mb-3 sm:mb-4">
              <div className="bg-indigo-100 rounded-full p-2 sm:p-3 mr-3 sm:mr-4">
                <FaEnvelope className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Email ID</h2>
            </div>
            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">Official RVCE Placement Email</p>
            <a
              href="mailto:placement@rvce.edu.in"
              className="text-indigo-600 hover:text-indigo-800 font-medium text-sm sm:text-base md:text-lg flex items-center break-all"
            >
              placement@rvce.edu.in
              <FaExternalLinkAlt className="w-3 h-3 sm:w-4 sm:h-4 ml-2 flex-shrink-0" />
            </a>
          </div>

          {/* Website Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 hover:shadow-xl transition-shadow">
            <div className="flex items-center mb-3 sm:mb-4">
              <div className="bg-indigo-100 rounded-full p-2 sm:p-3 mr-3 sm:mr-4">
                <FaUniversity className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">About RVCE Placement</h2>
            </div>
            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">Visit the official RVCE Placement website</p>
            <a
              href="https://rvce.edu.in/placement"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-800 font-medium text-sm sm:text-base md:text-lg flex items-center break-all"
            >
              RVCE Placement Official Website
              <FaExternalLinkAlt className="w-3 h-3 sm:w-4 sm:h-4 ml-2 flex-shrink-0" />
            </a>
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">RV College of Engineering</h3>
          <p className="text-sm sm:text-base text-gray-600 mb-2">
            <strong>Address:</strong> RV Vidyaniketan Post, Mysore Road, Bengaluru - 560059, Karnataka, India
          </p>
          <p className="text-sm sm:text-base text-gray-600">
            For placement-related queries, please contact the Placement Office through the official email or visit the placement website for more information.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Contact;
