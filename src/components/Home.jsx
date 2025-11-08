import React from "react";
import heroImage from "../assets/home5.png";

function Home() {
  return (
    <div className="bg-gradient-to-b from-indigo-100 via-white to-indigo-50 min-h-screen">
      {/* Full-width Hero Image Section */}
      <div className="relative w-full h-[70vh] min-h-[500px] overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            // Option 1: Use local image (uncomment the import above first)
            backgroundImage: `url(${heroImage})`,
            
            // Option 2: Use external URL (current - replace with your image URL)
           // backgroundImage: `url('https://images.unsplash.com/photo-1509062522246-3755977927d7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2128&q=80')`,
            
            // Option 3: Use public folder image (if image is in /public folder)
            // backgroundImage: `url('/images/hero-image.jpg')`,
          }}
        />
      </div>

      {/* Welcome Message Section - Below the Image */}
      <div className="w-full bg-white py-16 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-6">
            Welcome to RVCE Placement Dashboard
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 max-w-4xl mx-auto leading-relaxed">
            Your ultimate destination for placement preparation. Gain access to 
            company insights, interview experiences, curated resources, and 
            guidance from seniors: Everything you need to land your dream 
            job or internship with confidence.
          </p>
        </div>
      </div>

      {/* Challenges Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-blue-900 mb-4">
            Challenges Students Face During Placements
          </h2>
          <div className="w-24 h-1 bg-indigo-600 mx-auto"></div>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
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
              className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
            >
              <div className="text-4xl mb-4">{point.icon}</div>
              <p className="text-lg text-gray-700 leading-relaxed">{point.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* What We Provide Section */}
      <div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-indigo-100 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-blue-900 mb-4">
              What We Provide
            </h2>
            <div className="w-24 h-1 bg-indigo-600 mx-auto"></div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
              >
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-blue-900 mb-3">{feature.title}</h3>
                <p className="text-gray-700 leading-relaxed">{feature.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Future Vision Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-blue-900 mb-4">
            Our Future Vision 🚀
          </h2>
          <div className="w-24 h-1 bg-indigo-600 mx-auto"></div>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
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
              className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-indigo-100"
            >
              <div className="text-5xl mb-4">{plan.icon}</div>
              <h3 className="text-xl font-bold text-blue-900 mb-3">{plan.title}</h3>
              <p className="text-gray-700 leading-relaxed">{plan.text}</p>
            </div>
          ))}
        </div>
      </div>

      
    </div>
  );
}

export default Home;
