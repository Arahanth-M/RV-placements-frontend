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
    <div className="events-page-theme pt-3 sm:pt-4 pb-8 sm:pb-10 px-4 sm:px-6 lg:px-8 bg-theme-app text-theme-primary">
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
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-theme-primary mb-2">Events</h1>
          <p className="text-sm sm:text-base text-theme-secondary">Stay updated with off-campus placements, hackathons, and other important events</p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div
              className="inline-block h-12 w-12 animate-spin rounded-full border-2 border-solid border-[var(--border)] border-t-[var(--accent)]"
              role="status"
              aria-label="Loading"
            />
            <p className="mt-4 text-theme-secondary">Loading events...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="events-error-banner rounded-lg p-6 mb-8">
            <p className="text-sm sm:text-base font-medium">{error}</p>
          </div>
        )}

        {/* Events Table */}
        {!loading && !error && (
          <>
            {sortedEvents.length === 0 ? (
              <div className="bg-theme-card border border-theme rounded-xl shadow-lg p-12 text-center">
                <FaCalendarAlt className="mx-auto text-theme-muted text-6xl mb-4" aria-hidden />
                <p className="text-theme-primary text-lg font-medium">No events found.</p>
                <p className="text-theme-secondary mt-2">Check back later for new events!</p>
              </div>
            ) : (
              <div className="max-w-5xl mx-auto w-full min-w-0">
                <div className="mb-3 sm:mb-4 flex justify-center sm:justify-start">
                  <div
                    className="flex flex-wrap justify-center gap-1.5 sm:gap-2 p-1 bg-theme-card border border-theme rounded-xl w-full max-w-full sm:w-fit"
                    role="tablist"
                    aria-label="Filter events"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeFilter === 'all'}
                      onClick={() => setActiveFilter('all')}
                      className={`px-2.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 flex-1 sm:flex-none min-w-0 sm:min-w-0 ${
                        activeFilter === 'all'
                          ? 'bg-theme-hero text-theme-accent shadow-md'
                          : 'text-theme-secondary hover:text-theme-primary hover:bg-theme-nav'
                      }`}
                    >
                      All ({sortedEvents.length})
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeFilter === 'upcoming'}
                      onClick={() => setActiveFilter('upcoming')}
                      className={`px-2.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 flex-1 sm:flex-none min-w-0 sm:min-w-0 ${
                        activeFilter === 'upcoming'
                          ? 'bg-theme-hero text-theme-accent shadow-md'
                          : 'text-theme-secondary hover:text-theme-primary hover:bg-theme-nav'
                      }`}
                    >
                      Upcoming ({upcomingEventsCount})
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeFilter === 'expired'}
                      onClick={() => setActiveFilter('expired')}
                      className={`px-2.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 flex-1 sm:flex-none min-w-0 sm:min-w-0 ${
                        activeFilter === 'expired'
                          ? 'bg-theme-hero text-theme-accent shadow-md'
                          : 'text-theme-secondary hover:text-theme-primary hover:bg-theme-nav'
                      }`}
                    >
                      Expired ({expiredEventsCount})
                    </button>
                  </div>
                </div>
               <div className="bg-theme-card border border-theme rounded-xl shadow-lg overflow-hidden w-full min-w-0">
                {filteredEvents.length === 0 ? (
                  <div className="px-4 sm:px-6 py-10 sm:py-12 text-center text-theme-secondary text-sm">
                    No events found for the selected filter.
                  </div>
                ) : (
                  <>
                    {/* Mobile: compact stacked cards */}
                    <div className="md:hidden p-2 sm:p-4 space-y-1.5 w-full min-w-0">
                      {filteredEvents.map((event) => {
                        const expired = isExpired(event.lastDateToRegister);
                        return (
                          <div
                            key={event._id}
                            className="rounded-lg border border-theme bg-theme-hero px-2.5 py-2 sm:p-3.5 space-y-1 sm:space-y-1.5 w-full min-w-0"
                          >
                            <h3 className="text-sm font-semibold text-theme-primary break-words leading-tight">
                              {event.title}
                            </h3>
                            <div className="flex items-start gap-1.5 text-[11px] sm:text-xs text-theme-secondary leading-snug">
                              <FaCalendarAlt className="w-3 h-3 mt-px text-theme-accent shrink-0" aria-hidden />
                              <span className="break-words">{formatDate(event.lastDateToRegister)}</span>
                            </div>
                            <div className="pt-0">
                              {expired ? (
                                <span className="inline-flex items-center gap-2 text-theme-muted font-medium text-xs">
                                  <FaExternalLinkAlt className="w-3.5 h-3.5 shrink-0" aria-hidden />
                                  Registration Closed
                                </span>
                              ) : (
                                <a
                                  href={event.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 text-theme-accent hover:opacity-90 font-medium text-sm underline-offset-2 hover:underline"
                                >
                                  <FaExternalLinkAlt className="w-3.5 h-3.5 shrink-0" aria-hidden />
                                  Register
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {/* Tablet/desktop: table — auto column widths + compact rows (avoids fixed % stretching) */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full min-w-[560px] table-auto divide-y divide-[var(--border)]">
                          <thead className="bg-theme-hero">
                            <tr>
                              <th className="min-w-0 px-4 lg:px-6 py-2.5 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                                Event Title
                              </th>
                              <th className="whitespace-nowrap px-4 lg:px-6 py-2.5 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                                Last Date
                              </th>
                              <th className="w-px whitespace-nowrap px-4 lg:px-6 py-2.5 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                                Link
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-theme-card divide-y divide-[var(--border)]">
                            {filteredEvents.map((event) => {
                              const expired = isExpired(event.lastDateToRegister);
                              return (
                                <tr
                                  key={event._id}
                                  className="hover:bg-theme-nav/80 [&_td]:align-top"
                                >
                                  <td className="min-w-0 px-4 lg:px-6 py-2">
                                    <div className="text-sm font-medium text-theme-primary break-words leading-snug">
                                      {event.title}
                                    </div>
                                  </td>

                                  <td className="whitespace-nowrap px-4 lg:px-6 py-2">
                                    <div className="flex items-start gap-2 text-sm text-theme-secondary">
                                      <FaCalendarAlt className="w-4 h-4 mt-0.5 text-theme-accent flex-shrink-0" aria-hidden />
                                      <span>{formatDate(event.lastDateToRegister)}</span>
                                    </div>
                                  </td>

                                  <td className="whitespace-nowrap px-4 lg:px-6 py-2">
                                    {expired ? (
                                      <span className="inline-flex items-center text-theme-muted font-medium text-sm cursor-not-allowed">
                                        <FaExternalLinkAlt className="w-4 h-4 mr-2 shrink-0" aria-hidden />
                                        Registration Closed
                                      </span>
                                    ) : (
                                      <a
                                        href={event.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center text-theme-accent hover:opacity-90 font-medium text-sm underline-offset-2 hover:underline"
                                      >
                                        <FaExternalLinkAlt className="w-4 h-4 mr-2" />
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
                  </>
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