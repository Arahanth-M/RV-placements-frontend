import React from 'react';

const CancellationRefund = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Cancellation and Refund Policy</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    <strong>Important Notice:</strong> All sales are final. No refunds will be provided for any purchases made on Last Minute Placement Prep.
                  </p>
                </div>
              </div>
            </div>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">No Refund Policy</h2>
              <p className="text-gray-700 mb-4">
                Once a purchase or subscription is made, it cannot be refunded or reversed under any circumstances. 
                Please review all details carefully before making a payment. This policy applies to all purchases, 
                including but not limited to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Course access or digital content</li>
                <li>AI roadmap generation or personalized learning plans</li>
                <li>Subscription or premium feature upgrades</li>
                <li>Resume analysis or other add-on services</li>
              </ul>
              <p className="text-gray-700 mb-4">
                By completing a transaction, you acknowledge and agree that you understand and accept this no-refund policy.
              </p>
            </section>

            

          </div>
        </div>
      </div>
    </div>
  );
};

export default CancellationRefund;
