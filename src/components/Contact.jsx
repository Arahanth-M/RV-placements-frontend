import React from "react";
import { FaEnvelope, FaExternalLinkAlt, FaUniversity } from "react-icons/fa";

function Contact() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-100 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h1>
          <p className="text-lg text-gray-600">
            Get in touch with RVCE Placement Office
          </p>
        </div>

        {/* Contact Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Email Card */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="flex items-center mb-4">
              <div className="bg-indigo-100 rounded-full p-3 mr-4">
                <FaEnvelope className="w-6 h-6 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Email ID</h2>
            </div>
            <p className="text-gray-600 mb-4">Official RVCE Placement Email</p>
            <a
              href="mailto:placement@rvce.edu.in"
              className="text-indigo-600 hover:text-indigo-800 font-medium text-lg flex items-center"
            >
              placement@rvce.edu.in
              <FaExternalLinkAlt className="w-4 h-4 ml-2" />
            </a>
          </div>

          {/* Website Card */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="flex items-center mb-4">
              <div className="bg-indigo-100 rounded-full p-3 mr-4">
                <FaUniversity className="w-6 h-6 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">About RVCE Placement</h2>
            </div>
            <p className="text-gray-600 mb-4">Visit the official RVCE Placement website</p>
            <a
              href="https://rvce.edu.in/placement"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-800 font-medium text-lg flex items-center"
            >
              RVCE Placement Official Website
              <FaExternalLinkAlt className="w-4 h-4 ml-2" />
            </a>
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">RV College of Engineering</h3>
          <p className="text-gray-600 mb-2">
            <strong>Address:</strong> RV Vidyaniketan Post, Mysore Road, Bengaluru - 560059, Karnataka, India
          </p>
          <p className="text-gray-600">
            For placement-related queries, please contact the Placement Office through the official email or visit the placement website for more information.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Contact;
