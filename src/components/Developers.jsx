import React from "react";
import { FaLinkedin, FaUser } from "react-icons/fa";

function Developers() {
  // Dummy data structure - you can replace this with actual data
  const developers = [
    {
      name: "Developer Name",
      photo: "https://via.placeholder.com/200x200?text=Photo",
      linkedinUrl: "https://linkedin.com/in/developer",
    },
    // Add more developers here as needed
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-100 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Developers</h1>
          <p className="text-lg text-gray-600">
            Meet the team behind the platform
          </p>
        </div>

        {/* Developers Grid */}
        {developers.length === 0 ? (
          <div className="text-center py-12">
            <FaUser className="mx-auto text-gray-400 text-6xl mb-4" />
            <p className="text-gray-600 text-lg">No developers added yet.</p>
            <p className="text-gray-500 mt-2">Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {developers.map((developer, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow text-center"
              >
                {/* Photo */}
                <div className="mb-4">
                  <img
                    src={developer.photo}
                    alt={developer.name}
                    className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-indigo-100"
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/200x200?text=Photo";
                    }}
                  />
                </div>

                {/* Name */}
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {developer.name}
                </h3>

                {/* LinkedIn Link */}
                {developer.linkedinUrl && (
                  <a
                    href={developer.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <FaLinkedin className="w-5 h-5 mr-2" />
                    LinkedIn Profile
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Developers;

