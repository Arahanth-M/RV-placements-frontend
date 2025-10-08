import axios from "axios";
import { useEffect, useState } from "react";
import { BASE_URL } from "../utils/constants";
import { usePremium } from "../utils/PremiumContext";

const Premium = () => {
  const { isPremium, refreshPremiumStatus } = usePremium();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const handleBuyClick = async () => {
    setIsProcessing(true);
    try {
      const order = await axios.post(BASE_URL + "/api/payment/create", {}, {
        withCredentials: true
      });

      const { amount, keyId, currency, notes, orderId } = order.data;

  const options = {
    key: keyId, 
    amount,
    currency,
        name: 'CompanyTracker',
        description: 'Premium Membership - Ultimate placement prep',
    order_id: orderId, 
    prefill: {
          name: notes.firstName + ' ' + notes.lastName,
      email: notes.emailId,
      contact: '9999999999'
    },
    theme: {
          color: '#3B82F6'
        },
        handler: async function (response) {
          // Payment successful, verify payment and refresh premium status
          try {
            console.log('Payment successful, verifying...', response);
            
            // Call the manual verification endpoint
            const verifyResponse = await axios.post(BASE_URL + "/payment/verify", {
              payment_id: response.razorpay_payment_id,
              order_id: response.razorpay_order_id
            }, {
              withCredentials: true
            });

            console.log('Payment verification response:', verifyResponse.data);

            // Refresh premium status multiple times to ensure it's updated
            await refreshPremiumStatus();
            
            // Wait a bit and refresh again to ensure the backend has processed
            setTimeout(async () => {
              await refreshPremiumStatus();
            }, 1000);
            
            // Set success state
            setPaymentSuccess(true);
            setIsProcessing(false);
            
            // Show success message
            alert('Payment successful! Welcome to premium membership. You now have access to all videos and the AI chatbot.');
            
            // Force a hard refresh to ensure all components get the updated status
            setTimeout(() => {
              window.location.href = window.location.href;
            }, 2000);
          } catch (error) {
            console.error('Payment verification error:', error);
            // Even if verification fails, try to refresh status multiple times
            try {
              await refreshPremiumStatus();
              setTimeout(async () => {
                await refreshPremiumStatus();
              }, 1000);
            } catch (refreshError) {
              console.error('Status refresh error:', refreshError);
            }
            alert('Payment successful! Please refresh the page to see your premium features.');
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
      setIsProcessing(false);
    }
  };

  // Show payment success message
  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-8">
              <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Payment Successful! 🎉
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              Welcome to <span className="font-semibold text-blue-600">Premium membership</span>!
            </p>
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Premium Benefits</h2>
              <div className="space-y-3">
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-lg">Access to all company videos</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-lg">AI-powered placement assistant</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-lg">Premium company insights</span>
                </div>
              </div>
            </div>
            <p className="text-gray-500">
              Redirecting you to explore your premium features...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isPremium) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to Premium! 🎉
            </h1>
            <p className="text-xl text-gray-600 mb-2">
              You have access to all premium features
            </p>
            <p className="text-gray-500">
              Thank you for supporting CompanyTracker. Enjoy your premium experience!
            </p>
            
            <div className="mt-6">
              <button
                onClick={refreshPremiumStatus}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh Status
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Premium Benefits</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">🎥 Video Access</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Access to all company videos
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Premium company insights
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">🤖 AI Assistant</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    AI-powered placement assistant
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Real-time placement insights
          </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Get Premium Access
          </h1>
          <p className="text-xl text-gray-600">
            Unlock all premium features for complete placement preparation
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">Premium Plan</h3>
            <div className="text-5xl font-bold text-blue-600 mb-2">₹3</div>
            <p className="text-gray-500">Complete placement preparation suite</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800">🎥 Video Features</h4>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>All company videos</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Premium insights</span>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800">🤖 AI Assistant</h4>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>AI chatbot access</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Real-time insights</span>
                </li>
              </ul>
            </div>
          </div>

          <button
            onClick={handleBuyClick}
            disabled={isProcessing}
            className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing...' : 'Get Premium Access - ₹3'}
          </button>

          <div className="text-center mt-6">
            <p className="text-gray-500 text-sm">
              Secure payment powered by Razorpay • No refunds provided as per our policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
  };
  
  export default Premium;
  