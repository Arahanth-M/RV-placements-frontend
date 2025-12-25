import React, { useState, useEffect, useCallback } from 'react';
import { leetcodeAPI } from '../utils/api';

const Leetcode = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('DSA');
  const [filters, setFilters] = useState({
    company: '',
    likelihood: '',
    search: '',
  });

  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (filters.company) params.company = filters.company;
      if (filters.likelihood) params.likelihood = filters.likelihood;
      if (filters.search) params.search = filters.search;
      if (selectedCategory) params.category = selectedCategory;

      const response = await leetcodeAPI.getAllQuestions(params);
      
      // Axios wraps the response in response.data
      const questionsData = response.data || [];
      
      if (questionsData.length === 0) {
        console.warn('⚠️ No questions returned from API');
      }
      
      setQuestions(questionsData);
    } catch (err) {
      console.error('Error fetching LeetCode questions:', err);
      console.error('Error details:', err.response?.data || err.message);
      setError('Failed to load questions. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [filters, selectedCategory]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const getLikelihoodColor = (likelihood) => {
    const likelihoodLower = likelihood?.toLowerCase() || '';
    if (likelihoodLower.includes('very likely')) {
      return 'bg-green-900/50 text-green-300';
    }
    if (likelihoodLower.includes('likely')) {
      return 'bg-red-900/50 text-red-300';
    }
    if (likelihoodLower.includes('moderate')) {
      return 'bg-yellow-900/50 text-yellow-300';
    }
    if (likelihoodLower.includes('rare')) {
      return 'bg-red-900/50 text-red-300';
    }
    if (likelihoodLower.includes('unlikely')) {
      return 'bg-green-900/50 text-green-300';
    }
    return 'bg-slate-700 text-slate-300';
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#302C2C' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4">
            LeetCode Questions
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-slate-400 max-w-3xl mx-auto mb-4 sm:mb-6 px-2">
            Curated collection of LeetCode problems asked by companies
          </p>
          
          {/* Category Buttons */}
          <div className="flex justify-center gap-2 sm:gap-4 mb-6 sm:mb-8 flex-wrap px-2">
            <button
              onClick={() => setSelectedCategory('DSA')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold transition text-sm sm:text-base ${
                selectedCategory === 'DSA'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              DSA
            </button>
            <button
              onClick={() => setSelectedCategory('SQL')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold transition text-sm sm:text-base ${
                selectedCategory === 'SQL'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              SQL
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            {/* Search */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1 sm:mb-2">
                Search
              </label>
              <input
                type="text"
                placeholder="Search by title or company..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full px-3 sm:px-4 py-2 border border-slate-600 rounded-lg bg-slate-800 text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
              />
            </div>

            {/* Company Filter */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1 sm:mb-2">
                Company
              </label>
              <input
                type="text"
                placeholder="Filter by company..."
                value={filters.company}
                onChange={(e) => handleFilterChange('company', e.target.value)}
                className="w-full px-3 sm:px-4 py-2 border border-slate-600 rounded-lg bg-slate-800 text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
              />
            </div>

            {/* Likelihood Filter */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1 sm:mb-2">
                Likelihood
              </label>
              <select
                value={filters.likelihood}
                onChange={(e) => handleFilterChange('likelihood', e.target.value)}
                className="w-full px-3 sm:px-4 py-2 border border-slate-600 rounded-lg bg-slate-800 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
              >
                <option value="">All</option>
                <option value="very likely">Very Likely</option>
                <option value="likely">Likely</option>
                <option value="moderate">Moderate</option>
                <option value="rare">Rare</option>
                <option value="unlikely">Unlikely</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400"></div>
            <p className="mt-4 text-slate-400">Loading questions...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-6 mb-8">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Questions List */}
        {!loading && !error && (
          <>
            <div className="mb-4 text-slate-400">
              <p className="text-sm sm:text-base md:text-lg">
                Showing <span className="font-bold text-white">{questions.length}</span> question{questions.length !== 1 ? 's' : ''}
              </p>
            </div>

            {questions.length === 0 ? (
              <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl shadow-lg p-8 sm:p-12 text-center">
                <p className="text-base sm:text-lg md:text-xl text-slate-300">
                  No questions found. Try adjusting your filters.
                </p>
              </div>
            ) : (
              <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <table className="min-w-full divide-y divide-slate-700">
                      <thead className="bg-slate-800/60">
                        <tr>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                            #
                          </th>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                            Problem Title
                          </th>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider hidden sm:table-cell">
                            Company
                          </th>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                            Likelihood
                          </th>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                            Link
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-slate-800/40 divide-y divide-slate-700">
                        {questions.map((question, index) => (
                          <tr key={question._id} className="hover:bg-slate-700/50 transition-colors">
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-slate-300">
                              {index + 1}
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-slate-300">
                              <div className="break-words">{question.title}</div>
                              <div className="sm:hidden text-xs text-slate-400 mt-1">{question.company}</div>
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-400 hidden sm:table-cell">
                              {question.company}
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${getLikelihoodColor(
                                  question.likelihood
                                )}`}
                              >
                                {question.likelihood}
                              </span>
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                              <a
                                href={question.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-400 hover:text-indigo-300 hover:underline font-medium inline-flex items-center"
                              >
                                Open
                                <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Leetcode;

