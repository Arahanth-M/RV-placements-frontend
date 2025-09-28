import React from "react";

function Home() {
  return (
    <div className="bg-gradient-to-b from-indigo-100 via-white to-indigo-50 min-h-screen">
      
      <div className="text-center px-6 py-20">
        <h1 className="text-6xl font-extrabold text-blue-950 mb-6 drop-shadow-lg">
          Welcome to Last Minute Placement Prep App 🎓
        </h1>
        <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
          Your ultimate destination for placement preparation. Gain access to 
          company insights, interview experiences, curated resources, and 
          guidance from seniors : Everything you need to land your dream 
          job or internship with confidence.  
        </p>
      </div>

     
      <div className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-4xl font-bold text-blue-900 mb-8 text-center">
          Challenges Students Face During Placements
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          {[
            "Students prepare well but don’t know the exact type of questions companies ask.",
            "Lack of clarity about what a company does and its work culture.",
            "Uncertainty about interview processes reduces confidence.",
            "No clear idea about how many students were placed in each company previously.",
          ].map((point, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl shadow-md p-6 hover:shadow-xl transition duration-300"
            >
              <p className="text-lg text-gray-700">{point}</p>
            </div>
          ))}
        </div>
      </div>

     
      <div className="bg-indigo-50 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-blue-900 mb-8 text-center">
            What We Provide
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              "Curated company-wise placement questions (OA + Interviews).",
              "Detailed insights into company profiles and offered roles.",
              "Step-by-step breakdown of previous interview processes.",
              "A chatbot to ask specific questions related to placement stats",
              "Internship experiences of students who recently completed their internships in the cooperate world",
              "Allow students to add in company details they are familiar with, which will be approved and hosted on the platform "
            ].map((feature, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl shadow-md p-6 hover:shadow-xl transition duration-300"
              >
                <p className="text-lg text-gray-700">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      
      <div className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-4xl font-bold text-blue-900 mb-8 text-center">
          Our Future Vision 🚀
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          {[
            
            "Live interaction videos with seniors sharing experiences.",
            "More curated notes & resources for cutting-edge tech.",
            "Continuous feature updates to support student success.",
          ].map((plan, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl shadow-md p-6 hover:shadow-xl transition duration-300"
            >
              <p className="text-lg text-gray-700">{plan}</p>
            </div>
          ))}
        </div>
      </div>

      
    </div>
  );
}

export default Home;
