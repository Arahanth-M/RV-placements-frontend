import React from 'react';

const TermsConditions = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms and Conditions</h1>

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Acceptance of Terms</h2>
              <p className="text-gray-700 mb-4">
                By accessing and using our website (“we”, “our”, or “us”), you agree to comply with and be bound 
                by these Terms and Conditions. If you do not agree with any part of these terms, you must not use 
                this platform or any related services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Use License</h2>
              <p className="text-gray-700 mb-4">
                Permission is granted to temporarily access and use the materials on our website for personal, 
                non-commercial, and educational purposes only. You may view, interact, and learn from the content, 
                but you are not permitted to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Republish, redistribute, copy, or duplicate the content or code.</li>
                <li>Take screenshots, recordings, or export data from the platform for commercial resale or redistribution.</li>
                <li>Sell, lease, or sub-license any part of the platform’s material.</li>
                <li>Use the content for developing or promoting a competing service.</li>
              </ul>
              <p className="text-gray-700 mb-4">
                This license shall automatically terminate if you violate any of these restrictions, and may be terminated 
                by us at any time without notice.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">User Responsibilities</h2>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Users must provide only accurate, truthful, and up-to-date information while registering or adding data.</li>
                <li>Do not submit false, misleading, or plagiarized content, including questions, company details, or feedback.</li>
                <li>You are solely responsible for any data or content you upload, including resumes or company-related insights.</li>
                <li>We reserve the right to remove content that violates our guidelines or legal standards.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Disclaimer</h2>
              <p className="text-gray-700 mb-4">
                The information and tools provided on our platform are intended for educational and preparatory purposes only. 
                We do not guarantee placement, job offers, or interview outcomes. All materials are provided on an “as is” basis 
                without any express or implied warranties.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Limitations</h2>
              <p className="text-gray-700 mb-4">
                In no event shall our platform, developers, or affiliates be liable for any damages (including loss of data, 
                profit, or business interruption) arising from the use or inability to use the materials or services provided, 
                even if we have been notified of the possibility of such damages.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Intellectual Property Rights</h2>
              <p className="text-gray-700 mb-4">
                All content, including text, code, design elements, graphics, and features, are owned or licensed by us. 
                Unauthorized copying, distribution, or reproduction is strictly prohibited and may result in legal action.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Prohibited Actions</h2>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Do not share, resell, or distribute the learning content, AI responses, or company insights.</li>
                <li>Do not attempt to reverse-engineer, scrape, or extract platform data.</li>
                <li>Do not upload harmful, malicious, or copyrighted content without authorization.</li>
                <li>Do not use bots or automated scripts to interact with the platform.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Modifications</h2>
              <p className="text-gray-700 mb-4">
                We may revise these Terms and Conditions at any time without prior notice. By continuing to use the platform 
                after updates, you agree to the revised terms. We encourage you to review this page periodically.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Governing Law</h2>
              <p className="text-gray-700 mb-4">
                These terms shall be governed and construed in accordance with the laws of India, without regard to its 
                conflict of law provisions.
              </p>
            </section>

            
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsConditions;
