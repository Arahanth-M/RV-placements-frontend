import React, { useState } from 'react';
import { FaTimes, FaSpinner, FaCheck, FaCheckCircle } from 'react-icons/fa';
import { placementAPI } from '../utils/api';

const PlacementForm = ({ companyName, companyId, onSuccess, onClose, isRequired }) => {
  const [formData, setFormData] = useState({
    onlineQuestions: [''],
    interviewQuestions: [''],
    interviewProcess: ['']
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleArrayChange = (field, index, value) => {
    const updatedArray = [...formData[field]];
    updatedArray[index] = value;
    setFormData({ ...formData, [field]: updatedArray });
    setError('');
  };

  const addField = (field) => {
    setFormData({
      ...formData,
      [field]: [...formData[field], '']
    });
  };

  const removeField = (field, index) => {
    if (formData[field].length > 1) {
      const updatedArray = formData[field].filter((_, i) => i !== index);
      setFormData({ ...formData, [field]: updatedArray });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Filter out empty strings
    const onlineQuestions = formData.onlineQuestions.filter(q => q.trim() !== '');
    const interviewQuestions = formData.interviewQuestions.filter(q => q.trim() !== '');
    const interviewProcess = formData.interviewProcess.filter(p => p.trim() !== '');

    // Validate that at least one field has data
    if (onlineQuestions.length === 0 && interviewQuestions.length === 0 && interviewProcess.length === 0) {
      setError('Please fill at least one field');
      return;
    }

    setLoading(true);
    try {
      const response = await placementAPI.submitPlacementData(companyId, {
        onlineQuestions,
        interviewQuestions,
        interviewProcess
      });
      
      // Store that form has been submitted
      localStorage.setItem(`placementFormSubmitted_${companyId}`, 'true');
      
      setSubmitted(true);
      
      // Wait a moment to show success message, then call onSuccess
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
      }, 2000);
    } catch (err) {
      console.error('Error submitting placement form:', err);
      setError(err.response?.data?.error || 'Failed to submit form. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}>
      <div className="bg-slate-900/95 backdrop-blur border border-slate-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-indigo-400 mb-2">
                Placement Form
              </h2>
              <p className="text-slate-300 text-sm sm:text-base">
                Share your experience with {companyName}
              </p>
            </div>
            {!isRequired && (
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-lg"
                title="Close"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          {submitted ? (
            <div className="text-center py-8">
              <div className="bg-green-900/50 border border-green-700 rounded-lg p-6 mb-4">
                <FaCheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-green-400 mb-2">Submission Successful!</h3>
                <p className="text-slate-300">
                  Your placement form has been submitted and is pending admin approval.
                  You will be notified once it's approved.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
            {/* Online Questions */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Online Assessment Questions
              </label>
              {formData.onlineQuestions.map((question, index) => (
                <div key={index} className="mb-3 flex gap-2">
                  <textarea
                    value={question}
                    onChange={(e) => handleArrayChange('onlineQuestions', index, e.target.value)}
                    placeholder="Enter online assessment question..."
                    className="flex-1 px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg 
                             text-white placeholder-slate-400 focus:outline-none 
                             focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                             resize-none"
                    rows="3"
                  />
                  {formData.onlineQuestions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeField('onlineQuestions', index)}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      <FaTimes />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addField('onlineQuestions')}
                className="text-sm text-indigo-400 hover:text-indigo-300"
              >
                + Add another question
              </button>
            </div>

            {/* Interview Questions */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Interview Questions
              </label>
              {formData.interviewQuestions.map((question, index) => (
                <div key={index} className="mb-3 flex gap-2">
                  <textarea
                    value={question}
                    onChange={(e) => handleArrayChange('interviewQuestions', index, e.target.value)}
                    placeholder="Enter interview question..."
                    className="flex-1 px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg 
                             text-white placeholder-slate-400 focus:outline-none 
                             focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                             resize-none"
                    rows="3"
                  />
                  {formData.interviewQuestions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeField('interviewQuestions', index)}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      <FaTimes />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addField('interviewQuestions')}
                className="text-sm text-indigo-400 hover:text-indigo-300"
              >
                + Add another question
              </button>
            </div>

            {/* Interview Process */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Interview Process
              </label>
              {formData.interviewProcess.map((process, index) => (
                <div key={index} className="mb-3 flex gap-2">
                  <textarea
                    value={process}
                    onChange={(e) => handleArrayChange('interviewProcess', index, e.target.value)}
                    placeholder="Describe the interview process..."
                    className="flex-1 px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg 
                             text-white placeholder-slate-400 focus:outline-none 
                             focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                             resize-none"
                    rows="3"
                  />
                  {formData.interviewProcess.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeField('interviewProcess', index)}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      <FaTimes />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addField('interviewProcess')}
                className="text-sm text-indigo-400 hover:text-indigo-300"
              >
                + Add another step
              </button>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 
                         text-white font-semibold rounded-lg transition-colors 
                         disabled:bg-slate-700 disabled:cursor-not-allowed 
                         flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <FaCheck className="mr-1" />
                    Submit
                  </>
                )}
              </button>
              {!isRequired && (
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 
                           text-white font-semibold rounded-lg transition-colors 
                           disabled:bg-slate-800 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlacementForm;

