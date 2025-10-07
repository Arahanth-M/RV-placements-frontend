import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Introduction</h2>
              <p className="text-gray-700">
                Welcome to our platform (“we”, “our”, or “us”). This Privacy Policy explains how we collect, use, 
                and safeguard your information when you use our website and services designed to assist students 
                and professionals with placement preparation, resume analysis, personalized company roadmaps, 
                and AI-based learning tools.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Information We Collect</h2>
              <p className="text-gray-700 mb-4">
                We collect information you provide directly to us, as well as data collected automatically 
                when you interact with our platform.
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li><strong>Personal Information:</strong> Name, email address, and account details (via Google login or email-password registration).</li>
                <li><strong>Resume Data:</strong> When you upload your resume, we may extract skills, education, experience, and other job-relevant information for generating your personalized roadmap.</li>
                <li><strong>Usage Data:</strong> Interaction data such as pages visited, features used, and time spent on the platform.</li>
                <li><strong>Payment Information:</strong> Data processed securely through third-party gateways like Razorpay (we do not store your card or banking details).</li>
                <li><strong>Device & Log Data:</strong> Browser type, IP address, and device identifiers to ensure platform security and analytics.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">How We Use Your Information</h2>
              <p className="text-gray-700 mb-4">
                We use the collected data to provide, improve, and personalize your experience on our platform.
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Generate personalized learning or preparation roadmaps based on your resume and selected company.</li>
                <li>Enable account creation, authentication, and profile management.</li>
                <li>Process secure payments for premium or subscription-based services.</li>
                <li>Provide chatbot-based guidance and support using AI features.</li>
                <li>Send important updates, service information, and promotional offers (if opted-in).</li>
                <li>Improve platform functionality, analyze trends, and enhance user experience.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Information Sharing</h2>
              <p className="text-gray-700 mb-4">
                We respect your privacy. Your personal information will not be sold, rented, or shared with third parties 
                except in the following cases:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>With trusted third-party service providers (e.g., payment processors, analytics tools) that assist in operating our services.</li>
                <li>When required by law, regulation, or legal request.</li>
                <li>To protect the rights, property, or safety of our users and platform.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Data Security</h2>
              <p className="text-gray-700 mb-4">
                We use industry-standard security practices, including encryption (HTTPS/SSL), secure cloud storage, 
                and restricted database access, to protect your data from unauthorized access or misuse.  
                While we take all reasonable precautions, no digital system is 100% secure.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Your Rights and Choices</h2>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Access or update your account information at any time through your profile settings.</li>
                <li>Request deletion of your data by contacting us directly.</li>
                <li>Opt out of marketing communications through email preferences.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Third-Party Services</h2>
              <p className="text-gray-700 mb-4">
                Our platform integrates with third-party services such as Google Authentication, Razorpay, and AI APIs.  
                These services have their own privacy policies, and we recommend reviewing them to understand how 
                your data is managed by these providers.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Children’s Privacy</h2>
              <p className="text-gray-700 mb-4">
                Our platform is intended for users aged 16 and above. We do not knowingly collect information from 
                children under 16. If we learn that we have inadvertently collected such data, we will delete it promptly.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Changes to This Policy</h2>
              <p className="text-gray-700 mb-4">
                We may update this Privacy Policy periodically to reflect changes in our practices or legal requirements.  
                Updated versions will be posted on this page with a revised “Last Updated” date.
              </p>
            </section>

           
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
