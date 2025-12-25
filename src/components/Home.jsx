import React, { useState, useEffect } from "react";
import { companyAPI } from "../utils/api";
import homeImage5 from "../assets/home5.png";
import logo3 from "../assets/logo3.png";

function Home() {
  // Local image assets
  const images = [
    homeImage5,
    logo3,
  ];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [companyLogos, setCompanyLogos] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000); // 5 seconds delay

    return () => clearInterval(interval);
  }, [images.length]);

  // Fetch companies with logos from database
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await companyAPI.getAllCompanies();
        // Filter companies that have logos and are approved
        const companiesWithLogos = (res.data || [])
          .filter(company => company.logo && company.logo.trim() !== '')
          .slice(0, 6); // Limit to 6 companies for the marquee
        
        setCompanyLogos(companiesWithLogos);
      } catch (err) {
        console.error("❌ Error fetching companies for marquee:", err);
      }
    };
    fetchCompanies();
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#302C2C' }}>
      {/* Hero Section - Title on Left, Images on Right */}
      <div className="w-full py-8 sm:py-12 md:py-16 px-4 sm:px-6" style={{ backgroundColor: '#1a1a1a' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            {/* Left Side - Title and Description */}
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white mb-4 sm:mb-6">
                Welcome to RVCE Placement Dashboard
              </h1>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 leading-relaxed">
                Your ultimate destination for placement preparation. Gain access to 
                company insights, interview experiences, curated resources, and 
                guidance from seniors: Everything you need to land your dream 
                job or internship with confidence.
              </p>
            </div>

            {/* Right Side - Image Slideshow */}
            <div className="flex-1 w-full lg:w-auto">
              <div className="relative w-full flex items-center justify-center rounded-xl overflow-hidden" style={{ minHeight: '300px', maxHeight: '70vh', backgroundColor: '#2a2a2a' }}>
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
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 px-2">
            Challenges Students Face During Placements
          </h2>
          <div className="w-24 h-1 bg-blue-500 mx-auto"></div>
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
              className="rounded-2xl shadow-lg p-6 sm:p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
              style={{ backgroundColor: '#1a1a1a', border: '2px solid #126FA6' }}
            >
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">{point.icon}</div>
              <p className="text-base sm:text-lg text-gray-300 leading-relaxed">{point.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* What We Provide Section */}
      <div className="py-12 sm:py-16 md:py-20" style={{ backgroundColor: '#2a2a2a' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 px-2">
              What We Provide
            </h2>
            <div className="w-24 h-1 bg-blue-500 mx-auto"></div>
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
                className="rounded-2xl shadow-lg p-6 sm:p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                style={{ backgroundColor: '#1a1a1a', border: '2px solid #126FA6' }}
              >
                <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">{feature.icon}</div>
                <h3 className="text-lg sm:text-xl font-bold text-blue-400 mb-2 sm:mb-3">{feature.title}</h3>
                <p className="text-sm sm:text-base text-gray-300 leading-relaxed">{feature.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Company Logos Marquee Section */}
      {companyLogos.length > 0 && (
        <div className="py-8 sm:py-12 border-t border-b border-gray-600 overflow-hidden" style={{ backgroundColor: '#1a1a1a' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <h3 className="text-center text-xl sm:text-2xl font-bold text-white mb-6 sm:mb-8">
              Our Recruiters
            </h3>
            <div className="relative w-full overflow-hidden">
              <div className="flex animate-marquee whitespace-nowrap" style={{ width: 'max-content' }}>
                {/* First set of logos from database */}
                {companyLogos.map((company, idx) => (
                  <div
                    key={idx}
                    className="inline-flex items-center justify-center h-16 sm:h-20 w-32 sm:w-40 mx-4 sm:mx-6 rounded-lg shadow-sm border p-3 sm:p-4 hover:shadow-md transition-shadow flex-shrink-0"
                    style={{ backgroundColor: '#2a2a2a', border: '1px solid #126FA6' }}
                  >
                    <img
                      src={company.logo}
                      alt={company.name || "Company logo"}
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const fallback = e.target.parentElement.querySelector('.fallback-text');
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                    <div className="hidden fallback-text items-center justify-center text-gray-400 font-semibold text-sm">
                      {company.name || "Company"}
                    </div>
                  </div>
                ))}
                {/* Duplicate set for seamless loop */}
                {companyLogos.map((company, idx) => (
                  <div
                    key={`duplicate-${idx}`}
                    className="inline-flex items-center justify-center h-16 sm:h-20 w-32 sm:w-40 mx-4 sm:mx-6 rounded-lg shadow-sm border p-3 sm:p-4 hover:shadow-md transition-shadow flex-shrink-0"
                    style={{ backgroundColor: '#2a2a2a', border: '1px solid #126FA6' }}
                  >
                    <img
                      src={company.logo}
                      alt={company.name || "Company logo"}
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const fallback = e.target.parentElement.querySelector('.fallback-text');
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                    <div className="hidden fallback-text items-center justify-center text-gray-400 font-semibold text-sm">
                      {company.name || "Company"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Future Vision Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 px-2">
            Our Future Vision 🚀
          </h2>
          <div className="w-24 h-1 bg-blue-500 mx-auto"></div>
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
              className="rounded-2xl shadow-lg p-6 sm:p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
              style={{ backgroundColor: '#1a1a1a', border: '2px solid #126FA6' }}
            >
              <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">{plan.icon}</div>
              <h3 className="text-lg sm:text-xl font-bold text-blue-400 mb-2 sm:mb-3">{plan.title}</h3>
              <p className="text-sm sm:text-base text-gray-300 leading-relaxed">{plan.text}</p>
            </div>
          ))}
        </div>
      </div>

      
    </div>
  );
}

export default Home;
