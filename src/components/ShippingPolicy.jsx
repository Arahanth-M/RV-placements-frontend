import React from 'react';

const ShippingPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Shipping Policy</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Digital Services</h2>
              <p className="text-gray-700 mb-4">
                CompanyTracker provides digital services and content that are delivered electronically. 
                As such, traditional shipping methods do not apply to our services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Service Delivery</h2>
              <p className="text-gray-700 mb-4">
                Upon successful payment and account activation, you will have immediate access to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
               
                <li>Company statistics and insights</li>
                <li>Interview preparation resources</li>
                <li>Chatbot assistance and support</li>
                
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Access Timeframe</h2>
              <p className="text-gray-700 mb-4">
                Digital services are typically available within 24 hours of successful payment processing. 
                In rare cases where technical issues occur, access may be delayed up to 48 hours.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Account Activation</h2>
              <p className="text-gray-700 mb-4">
                Your premium account will be automatically activated upon successful payment. 
                You will receive a confirmation email with access instructions and login details.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Technical Requirements</h2>
              <p className="text-gray-700 mb-4">
                To access our digital services, you will need:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>A stable internet connection</li>
                <li>A modern web browser (Chrome, Firefox, Safari, Edge)</li>
                <li>JavaScript enabled in your browser</li>
                <li>A valid email address for account verification</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Support</h2>
              <p className="text-gray-700 mb-4">
                If you experience any issues accessing your digital services, please contact our 
                support team immediately. We are committed to resolving access issues promptly.
              </p>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingPolicy;
