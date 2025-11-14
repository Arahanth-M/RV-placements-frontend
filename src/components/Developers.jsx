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
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">Our Developers</h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-600">
            Meet the team behind the platform
          </p>
        </div>

        {/* Developers Grid */}
        {developers.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <FaUser className="mx-auto text-gray-400 text-4xl sm:text-6xl mb-4" />
            <p className="text-gray-600 text-base sm:text-lg">No developers added yet.</p>
            <p className="text-gray-500 mt-2 text-sm sm:text-base">Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {developers.map((developer, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-shadow text-center"
              >
                {/* Photo */}
                <div className="mb-3 sm:mb-4">
                  <img
                    src={developer.photo}
                    alt={developer.name}
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-full mx-auto object-cover border-4 border-indigo-100"
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/200x200?text=Photo";
                    }}
                  />
                </div>

                {/* Name */}
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
                  {developer.name}
                </h3>

                {/* LinkedIn Link */}
                {developer.linkedinUrl && (
                  <a
                    href={developer.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm sm:text-base"
                  >
                    <FaLinkedin className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
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

