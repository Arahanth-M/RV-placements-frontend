import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventAPI } from '../utils/api';
import { useAuth } from '../utils/AuthContext';
import { FaCalendarAlt, FaExternalLinkAlt } from 'react-icons/fa';

const Events = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const navigate = useNavigate();

 

  useEffect(() => {
    fetchEvents();
  }, [user?.betaAccess]);

  const fetchEvents = async () => {
    if (user?.betaAccess === false) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const response = await eventAPI.getAllEvents();
      setEvents(response.data || []);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  const handleBack = () => {
  navigate('/');
};

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isExpired = (eventDate) => {
    const deadline = new Date(eventDate);
    const endOfDay = new Date(deadline);
    endOfDay.setHours(23, 59, 59, 999);
    return endOfDay < new Date();
  };

 

  // Sort events by deadline
  const sortedEvents = [...events].sort((a, b) => {
    return new Date(a.lastDateToRegister) - new Date(b.lastDateToRegister);
  });

  const upcomingEventsCount = sortedEvents.filter((event) => !isExpired(event.lastDateToRegister)).length;
  const expiredEventsCount = sortedEvents.filter((event) => isExpired(event.lastDateToRegister)).length;

  const filteredEvents = sortedEvents.filter((event) => {
    if (activeFilter === 'upcoming') return !isExpired(event.lastDateToRegister);
    if (activeFilter === 'expired') return isExpired(event.lastDateToRegister);
    return true;
  });

  return (
    <div className="events-page-theme min-h-screen pt-3 sm:pt-4 pb-8 sm:pb-10 px-4 sm:px-6 lg:px-8 bg-theme-app text-theme-primary">
      <div className="max-w-7xl mx-auto">
         {/* Back Button */}
      <div className="mb-2 flex items-center justify-between gap-2 flex-wrap">
        <button
          type="button"
          onClick={handleBack}
          className="back-nav-clear-sidebar flex items-center back-link-theme text-sm sm:text-base transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>
      </div>
        {/* Header */}
        <div className="mb-5 sm:mb-6 text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">Events</h1>
          <p className="text-sm sm:text-base text-slate-400">Stay updated with off-campus placements, hackathons, and other important events</p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400"></div>
            <p className="mt-4 text-slate-400">Loading events...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-6 mb-8">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Events Table */}
        {!loading && !error && (
          <>
            {sortedEvents.length === 0 ? (
              <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl shadow-lg p-12 text-center">
                <FaCalendarAlt className="mx-auto text-slate-600 text-6xl mb-4" />
                <p className="text-slate-300 text-lg">No events found.</p>
                <p className="text-slate-400 mt-2">Check back later for new events!</p>
              </div>
            ) : (
              <div className="max-w-5xl mx-auto w-full">
                <div className="mb-3 sm:mb-4 flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setActiveFilter('all')}
                    className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                      activeFilter === 'all'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    All ({sortedEvents.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFilter('upcoming')}
                    className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                      activeFilter === 'upcoming'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    Upcoming ({upcomingEventsCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFilter('expired')}
                    className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                      activeFilter === 'expired'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    Expired ({expiredEventsCount})
                  </button>
                </div>
               <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <table className="min-w-full table-fixed divide-y divide-slate-700">
                      <thead className="bg-slate-800/60">
                        <tr>
                          <th className="w-[38%] px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                            Event Title
                          </th>
                          <th className="w-[32%] px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                            Last Date
                          </th>
                          <th className="w-[30%] px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                            Link
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-slate-800/40 divide-y divide-slate-700">
                        {filteredEvents.map((event) => {
                          const expired = isExpired(event.lastDateToRegister);
                          return (
                            <tr
                              key={event._id}
                              className="hover:bg-slate-700/50"
                            >
                              <td className="px-3 sm:px-6 py-3 sm:py-4">
                                <div className="text-xs sm:text-sm font-medium text-slate-300">
                                  {event.title}
                                </div>
                              </td>

                              <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                <div className="flex items-center text-xs sm:text-sm text-slate-400">
                                  <FaCalendarAlt className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-indigo-400 flex-shrink-0" />
                                  <span className="truncate">{formatDate(event.lastDateToRegister)}</span>
                                </div>
                              </td>

                               <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                  {expired ? (
                                    <span className="inline-flex items-center text-slate-500 font-medium text-xs sm:text-sm cursor-not-allowed">
                                      <FaExternalLinkAlt className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                      Registration Closed
                                    </span>
                                  ) : (
                                    <a
                                      href={event.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center text-indigo-400 hover:text-indigo-300 font-medium text-xs sm:text-sm"
                                    >
                                      <FaExternalLinkAlt className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                      Register
                                    </a>
                                  )}
                                    
                                    
                                  
                                
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
                {filteredEvents.length === 0 && (
                  <div className="px-6 py-8 text-center text-slate-400 text-sm border-t border-slate-700">
                    No events found for the selected filter.
                  </div>
                )}
              </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Events;