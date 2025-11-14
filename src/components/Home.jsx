import React, { useState, useEffect } from "react";

function Home() {
  // External image URLs
  const images = [
    "https://rvce.edu.in/wp-content/uploads/2025/11/plane.png",
    "https://rvce.edu.in/wp-content/uploads/2025/10/IMG_0701-copy.png",
  ];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000); // 5 seconds delay

    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="bg-gradient-to-b from-indigo-100 via-white to-indigo-50 min-h-screen">
      {/* Hero Section - Title on Left, Images on Right */}
      <div className="w-full bg-white py-8 sm:py-12 md:py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            {/* Left Side - Title and Description */}
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-gray-900 mb-4 sm:mb-6">
                Welcome to RVCE Placement Dashboard
              </h1>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-700 leading-relaxed">
                Your ultimate destination for placement preparation. Gain access to 
                company insights, interview experiences, curated resources, and 
                guidance from seniors: Everything you need to land your dream 
                job or internship with confidence.
              </p>
            </div>

            {/* Right Side - Image Slideshow */}
            <div className="flex-1 w-full lg:w-auto">
              <div className="relative w-full flex items-center justify-center bg-gray-100 rounded-xl overflow-hidden" style={{ minHeight: '300px', maxHeight: '70vh' }}>
                {images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`Slide ${index + 1}`}
                    className={`absolute transition-opacity duration-1000 ${
                      index === currentIndex ? 'opacity-100' : 'opacity-0'
                    }`}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '70vh',
                      width: 'auto',
                      height: 'auto',
                      objectFit: 'contain',
                      imageRendering: 'auto',
                      WebkitBackfaceVisibility: 'hidden',
                      backfaceVisibility: 'hidden',
                      transform: 'translateZ(0)',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Challenges Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-blue-900 mb-4 px-2">
            Challenges Students Face During Placements
          </h2>
          <div className="w-24 h-1 bg-indigo-600 mx-auto"></div>
        </div>
        <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {[
            {
              icon: "❓",
              text: "Students prepare well but don't know the exact type of questions companies ask.",
            },
            {
              icon: "🏢",
              text: "Lack of clarity about what a company does and its work culture.",
            },
            {
              icon: "💼",
              text: "Uncertainty about interview processes reduces confidence.",
            },
            {
              icon: "📊",
              text: "No clear idea about how many students were placed in each company previously.",
            },
          ].map((point, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
            >
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">{point.icon}</div>
              <p className="text-base sm:text-lg text-gray-700 leading-relaxed">{point.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* What We Provide Section */}
      <div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-indigo-100 py-12 sm:py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-blue-900 mb-4 px-2">
              What We Provide
            </h2>
            <div className="w-24 h-1 bg-indigo-600 mx-auto"></div>
          </div>
          <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                icon: "📝",
                title: "Curated Questions",
                text: "Company-wise placement questions (OA + Interviews).",
              },
              {
                icon: "🔍",
                title: "Company Insights",
                text: "Detailed insights into company profiles and offered roles.",
              },
              {
                icon: "📋",
                title: "Interview Breakdown",
                text: "Step-by-step breakdown of previous interview processes.",
              },
              {
                icon: "🤖",
                title: "AI Chatbot",
                text: "A chatbot to ask specific questions related to placement stats.",
              },
              {
                icon: "💡",
                title: "Internship Experiences",
                text: "Internship experiences of students who recently completed their internships in the corporate world.",
              },
              {
                icon: "➕",
                title: "Community Contributions",
                text: "Allow students to add company details they are familiar with, which will be approved and hosted on the platform.",
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
              >
                <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">{feature.icon}</div>
                <h3 className="text-lg sm:text-xl font-bold text-blue-900 mb-2 sm:mb-3">{feature.title}</h3>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">{feature.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Future Vision Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-blue-900 mb-4 px-2">
            Our Future Vision 🚀
          </h2>
          <div className="w-24 h-1 bg-indigo-600 mx-auto"></div>
        </div>
        <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {[
            {
              icon: "🎥",
              title: "Live Interactions",
              text: "Live interaction videos with seniors sharing experiences.",
            },
            {
              icon: "📚",
              title: "Curated Resources",
              text: "More curated notes & resources for cutting-edge tech.",
            },
            {
              icon: "🔄",
              title: "Continuous Updates",
              text: "Continuous feature updates to support student success.",
            },
          ].map((plan, idx) => (
            <div
              key={idx}
              className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl shadow-lg p-6 sm:p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-indigo-100"
            >
              <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">{plan.icon}</div>
              <h3 className="text-lg sm:text-xl font-bold text-blue-900 mb-2 sm:mb-3">{plan.title}</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">{plan.text}</p>
            </div>
          ))}
        </div>
      </div>

      
    </div>
  );
}

export default Home;
