import React, { useState, useEffect } from 'react';
import { eventAPI } from '../utils/api';
import { FaCalendarAlt, FaExternalLinkAlt } from 'react-icons/fa';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Sort events by deadline
  const sortedEvents = [...events].sort((a, b) => {
    return new Date(a.lastDateToRegister) - new Date(b.lastDateToRegister);
  });

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#302C2C' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
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
              <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <table className="min-w-full divide-y divide-slate-700">
                      <thead className="bg-slate-800/60">
                        <tr>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                            Event Title
                          </th>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                            Last Date
                          </th>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                            Link
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-slate-800/40 divide-y divide-slate-700">
                        {sortedEvents.map((event) => {
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
                                <a
                                  href={event.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center text-indigo-400 hover:text-indigo-300 font-medium text-xs sm:text-sm"
                                >
                                  <FaExternalLinkAlt className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                  Register
                                </a>
                              </td>
                            </tr>
                          );
                        })}
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

export default Events;

