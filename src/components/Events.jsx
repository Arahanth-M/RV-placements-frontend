import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { TENANT_BASE } from '../constants/tenant.js';
import { eventAPI } from '../utils/api';
import { useAuth } from '../utils/AuthContext';
import { FaCalendarAlt, FaCheck, FaExternalLinkAlt, FaSearch, FaTimes } from 'react-icons/fa';
import {
  PageBackButton,
  PageBackNavRow,
  PageHeroFontStyles,
  PageHeroHeader,
  pageShellInnerClass,
  pageShellOuterClassCompact,
} from "./PageBackNav.jsx";

/** Event type chips — theme tokens only (light + dark). */
const TAG_CHIP_BASE =
  'inline-block max-w-full rounded-full border px-2 py-0.5 text-[10px] font-semibold';

const TAG_STYLES = {
  default: `${TAG_CHIP_BASE} border-theme bg-theme-hero text-theme-secondary`,
  hackathon: `${TAG_CHIP_BASE} border-theme-accent/35 bg-theme-accent/10 text-theme-primary`,
  placement: `${TAG_CHIP_BASE} border-theme-accent/30 bg-theme-accent/8 text-theme-primary`,
  workshop: `${TAG_CHIP_BASE} border-theme bg-theme-nav/40 text-theme-secondary`,
  competition: `${TAG_CHIP_BASE} border-theme bg-theme-hero text-theme-primary`,
  'preplacement talk': `${TAG_CHIP_BASE} border-theme-accent/25 bg-theme-accent/6 text-theme-secondary`,
};

const getTagStyle = (type = '') => {
  const key = String(type ?? '').trim().toLowerCase();
  return TAG_STYLES[key] ?? TAG_STYLES.default;
};

/* ─── days-left helper ───────────────────────────────────────────────────── */
const getDaysLeft = (dateString) => {
  const deadline = new Date(dateString);
  deadline.setHours(23, 59, 59, 999);
  return Math.ceil((deadline - new Date()) / 86_400_000);
};

const Events = () => {
  const { user, isAdmin } = useAuth();
  const [events, setEvents]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery]   = useState('');
  const [registeredIds, setRegisteredIds] = useState(() => new Set());
  const [registeringId, setRegisteringId] = useState(null);
  const navigate = useNavigate();

  const canUsePortalRegistration =
    Boolean(user) && !isAdmin && user?.betaAccess !== false;

  /* ── data fetching ── */
  const loadMyRegistrations = useCallback(async () => {
    if (!canUsePortalRegistration) { setRegisteredIds(new Set()); return; }
    try {
      const res = await eventAPI.getMyRegistrations();
      const ids = res.data?.registeredEventIds;
      setRegisteredIds(new Set(Array.isArray(ids) ? ids.map(String) : []));
    } catch (err) {
      console.error('Error loading event registrations:', err);
    }
  }, [canUsePortalRegistration]);

  useEffect(() => { fetchEvents(); },            [user?.betaAccess]);
  useEffect(() => { loadMyRegistrations(); },    [loadMyRegistrations]);

  const fetchEvents = async () => {
    if (user?.betaAccess === false) { setLoading(false); return; }
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

  /* ── registration ── */
  const handleMarkRegistered = async (eventId) => {
    if (!canUsePortalRegistration || registeringId) return;
    setRegisteringId(eventId);
    try {
      const res = await eventAPI.registerForEvent(eventId);
      const ids = res.data?.registeredEventIds;
      setRegisteredIds(new Set(Array.isArray(ids) ? ids.map(String) : []));
    } catch (err) {
      const msg = err.response?.data?.error ||
        'Could not save registration. Try again or contact support.';
      alert(msg);
    } finally {
      setRegisteringId(null);
    }
  };

  const handleBack = () => navigate(TENANT_BASE);

  /* ── formatting ── */
  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

  const isExpired = (eventDate) => {
    const end = new Date(eventDate);
    end.setHours(23, 59, 59, 999);
    return end < new Date();
  };

  /* ── portal registration cell ── */
  const renderPortalRegistration = (event, { compact = false } = {}) => {
    const idStr   = String(event._id);
    const expired = isExpired(event.lastDateToRegister);

    if (!user) {
      if (expired) return <span className="text-theme-muted text-xs" aria-hidden>—</span>;
      return (
        <span className={`text-theme-muted ${compact ? 'text-[11px]' : 'text-xs'}`}>
          Sign in to record
        </span>
      );
    }

    if (isAdmin || !canUsePortalRegistration)
      return <span className="text-theme-muted text-xs">—</span>;

    if (registeredIds.has(idStr)) return (
      <span className={`inline-flex items-center gap-1.5 font-medium text-theme-accent ${compact ? 'text-xs' : 'text-sm'}`}>
        <FaCheck className="shrink-0" aria-hidden />
        Registered
      </span>
    );

    if (expired) return (
      <span className={`text-theme-muted ${compact ? 'text-xs' : 'text-sm'}`}>
        Not registered
      </span>
    );

    return (
      <button
        type="button"
        onClick={() => handleMarkRegistered(idStr)}
        disabled={registeringId === idStr}
        className={`rounded-lg border border-theme-accent/60 bg-theme-accent/15 px-2.5 py-1.5 font-semibold text-theme-accent hover:bg-theme-accent/25 transition-colors disabled:opacity-50 ${compact ? 'text-xs' : 'text-sm'}`}
      >
        {registeringId === idStr ? 'Saving…' : 'Mark registered'}
      </button>
    );
  };

  /* ── derived lists ── */
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.lastDateToRegister) - new Date(b.lastDateToRegister)
  );

  const upcomingCount  = sortedEvents.filter(e => !isExpired(e.lastDateToRegister)).length;
  const expiredCount   = sortedEvents.filter(e =>  isExpired(e.lastDateToRegister)).length;
  const registeredCount = registeredIds.size;

  const filteredEvents = sortedEvents
    .filter(e => {
      if (activeFilter === 'upcoming') return !isExpired(e.lastDateToRegister);
      if (activeFilter === 'expired')  return  isExpired(e.lastDateToRegister);
      return true;
    })
    .filter(e => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        e.title?.toLowerCase().includes(q) ||
        e.organizer?.toLowerCase().includes(q) ||
        e.type?.toLowerCase().includes(q)
      );
    });

  /* ════════════════════════════════════════════════════════════════════════ */
  return (
    <div className={`events-page-theme ${pageShellOuterClassCompact}`}>
      <PageHeroFontStyles />
      <div className={pageShellInnerClass}>
        <PageBackNavRow>
          <PageBackButton onClick={handleBack} label="Back" />
        </PageBackNavRow>

        <div data-tour="events-hero">
        <PageHeroHeader subtitle='Stay updated with placements, hackathons, and other important events. After you register, use "Mark registered" to keep track of events you have signed up for.'>
          Events
        </PageHeroHeader>
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div className="text-center py-12">
            <div
              className="inline-block h-12 w-12 animate-spin rounded-full border-2 border-solid border-[var(--border)] border-t-[var(--accent)]"
              role="status"
              aria-label="Loading"
            />
            <p className="mt-4 text-theme-secondary">Loading events…</p>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="events-error-banner rounded-lg p-6 mb-8">
            <p className="text-sm sm:text-base font-medium">{error}</p>
          </div>
        )}

        {/* ── Content ── */}
        {!loading && !error && (
          <div className="max-w-5xl mx-auto w-full min-w-0 space-y-4" data-tour="events-loaded">
            {/* ── Stat cards ── */}
            <div className="grid grid-cols-3 gap-3" data-tour="events-stats">
              {[
                { label: 'Total events', value: sortedEvents.length, color: 'text-theme-accent' },
                { label: 'Upcoming', value: upcomingCount, color: 'text-theme-primary' },
                {
                  label: "You've registered",
                  value: canUsePortalRegistration ? registeredCount : '—',
                  color: 'text-theme-primary',
                },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  className="bg-theme-card border border-theme rounded-xl px-4 py-3"
                >
                  <p className="text-xs text-theme-secondary mb-1">{label}</p>
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* ── Search + filter row ── */}
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center" data-tour="events-filters">
                  {/* Search */}
                  <div className="relative flex-1">
                    <FaSearch
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted text-xs"
                      aria-hidden
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search events…"
                      aria-label="Search events"
                      className="w-full pl-8 pr-8 py-2 text-sm rounded-lg border border-theme bg-theme-card text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-accent/40"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-primary"
                        aria-label="Clear search"
                      >
                        <FaTimes className="text-xs" />
                      </button>
                    )}
                  </div>

                  {/* Filter tabs */}
                  <div
                    className="flex flex-wrap gap-1.5 p-1 bg-theme-card border border-theme rounded-xl w-full sm:w-fit"
                    role="tablist"
                    aria-label="Filter events"
                  >
                    {[
                      { key: 'all',      label: `All (${sortedEvents.length})` },
                      { key: 'upcoming', label: `Upcoming (${upcomingCount})` },
                      { key: 'expired',  label: `Expired (${expiredCount})` },
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        type="button"
                        role="tab"
                        aria-selected={activeFilter === key}
                        onClick={() => setActiveFilter(key)}
                        className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 flex-1 sm:flex-none ${
                          activeFilter === key
                            ? 'bg-theme-hero text-theme-accent shadow-sm'
                            : 'text-theme-secondary hover:text-theme-primary hover:bg-theme-nav'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Table / cards ── */}
                <div className="bg-theme-card border border-theme rounded-xl shadow-sm overflow-hidden w-full min-w-0" data-tour="events-list">
                  {sortedEvents.length === 0 ? (
                    <div className="px-4 sm:px-6 py-10 sm:py-12 text-center">
                      <FaCalendarAlt className="mx-auto text-theme-muted text-5xl mb-3" aria-hidden />
                      <p className="text-theme-primary text-lg font-medium">No events found.</p>
                      <p className="text-theme-secondary mt-2 text-sm">Check back later for new events!</p>
                    </div>
                  ) : filteredEvents.length === 0 ? (
                    <div className="px-4 sm:px-6 py-10 sm:py-12 text-center text-theme-secondary text-sm">
                      No events match your search or filter.
                    </div>
                  ) : (
                    <>
                      {/* ── Mobile cards ── */}
                      <div className="md:hidden p-2 sm:p-4 space-y-2 w-full min-w-0">
                        {filteredEvents.map((event) => {
                          const expired  = isExpired(event.lastDateToRegister);
                          const daysLeft = getDaysLeft(event.lastDateToRegister);
                          const urgent   = !expired && daysLeft <= 7;

                          return (
                            <div
                              key={event._id}
                              className={`rounded-lg border border-theme bg-theme-hero px-3 py-3 space-y-1.5 w-full min-w-0 transition-opacity ${expired ? 'opacity-60' : ''}`}
                            >
                              <h3 className="text-base font-semibold text-theme-primary break-words leading-tight">
                                {event.title}
                              </h3>

                              {event.organizer && (
                                <p className="text-xs text-theme-secondary">{event.organizer}</p>
                              )}

                              {event.type && (
                                <span
                                  className={`inline-block w-fit max-w-full text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 ${getTagStyle(event.type)}`}
                                >
                                  {event.type}
                                </span>
                              )}

                              {/* date */}
                              <div className="flex items-center gap-1.5 text-sm text-theme-secondary">
                                <FaCalendarAlt className="w-3.5 h-3.5 text-theme-accent shrink-0" aria-hidden />
                                <span>{formatDate(event.lastDateToRegister)}</span>
                                {urgent && (
                                  <span className="ml-1 text-[10px] font-semibold text-orange-500 dark:text-orange-400">
                                    {daysLeft === 0 ? 'Today!' : `${daysLeft}d left`}
                                  </span>
                                )}
                              </div>

                              {/* actions */}
                              <div className="pt-1 flex flex-col gap-2">
                                {expired ? (
                                  <span className="inline-flex items-center gap-2 text-theme-muted text-sm">
                                    <FaExternalLinkAlt className="w-3.5 h-3.5 shrink-0" aria-hidden />
                                    Registration closed
                                  </span>
                                ) : (
                                  <a
                                    href={event.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-theme-accent hover:opacity-90 font-medium text-sm underline-offset-2 hover:underline w-fit"
                                  >
                                    <FaExternalLinkAlt className="w-3.5 h-3.5 shrink-0" aria-hidden />
                                    Open registration
                                  </a>
                                )}
                                <div className="pt-0.5 border-t border-theme/60">
                                  <p className="text-[10px] uppercase tracking-wide text-theme-muted mb-1">
                                    On this portal
                                  </p>
                                  {renderPortalRegistration(event, { compact: true })}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* ── Desktop table ── */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full min-w-0">
                          <colgroup>
                            <col style={{ width: '34%' }} />
                            <col style={{ width: '22%' }} />
                            <col style={{ width: '22%' }} />
                            <col style={{ width: '22%' }} />
                          </colgroup>
                          <thead className="bg-theme-hero">
                            <tr>
                              {['Event title', 'Last date', 'Link', 'Status'].map(h => (
                                <th
                                  key={h}
                                  className="px-4 lg:px-6 py-2.5 text-left text-xs font-medium text-theme-muted uppercase tracking-wider whitespace-nowrap first:min-w-0"
                                >
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-theme-card divide-y divide-[var(--border)]">
                            {filteredEvents.map((event) => {
                              const expired  = isExpired(event.lastDateToRegister);
                              const daysLeft = getDaysLeft(event.lastDateToRegister);
                              const urgent   = !expired && daysLeft <= 7;

                              return (
                                <tr
                                  key={event._id}
                                  className={`hover:bg-theme-nav/80 [&_td]:align-top transition-opacity ${expired ? 'opacity-60' : ''}`}
                                >
                                  {/* Title, organizer, then type badge */}
                                  <td className="min-w-0 px-4 lg:px-6 py-3">
                                    <div className="text-base font-semibold text-theme-primary break-words leading-snug">
                                      {event.title}
                                    </div>
                                    {event.organizer && (
                                      <p className="text-xs text-theme-secondary mt-0.5">{event.organizer}</p>
                                    )}
                                    {event.type && (
                                      <span
                                        className={`inline-block w-fit max-w-full mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${getTagStyle(event.type)}`}
                                      >
                                        {event.type}
                                      </span>
                                    )}
                                  </td>

                                  {/* Date + urgency */}
                                  <td className="whitespace-nowrap px-4 lg:px-6 py-3">
                                    <div className="flex items-center gap-2 text-sm text-theme-secondary">
                                      <FaCalendarAlt
                                        className="w-[1rem] h-[1rem] text-theme-accent shrink-0"
                                        aria-hidden
                                      />
                                      <span>{formatDate(event.lastDateToRegister)}</span>
                                    </div>
                                    {urgent && (
                                      <p className="text-[11px] font-semibold text-orange-500 dark:text-orange-400 mt-0.5 ml-6">
                                        {daysLeft === 0 ? 'Due today!' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}
                                      </p>
                                    )}
                                  </td>

                                  {/* Link */}
                                  <td className="min-w-0 px-4 lg:px-6 py-3">
                                    {expired ? (
                                      <span className="inline-flex items-center text-theme-muted text-sm cursor-not-allowed">
                                        <FaExternalLinkAlt className="w-[0.875rem] h-[0.875rem] mr-2 shrink-0" aria-hidden />
                                        Registration closed
                                      </span>
                                    ) : (
                                      <a
                                        href={event.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center text-theme-accent hover:opacity-90 font-medium text-sm underline-offset-2 hover:underline break-words"
                                      >
                                        <FaExternalLinkAlt className="w-[0.875rem] h-[0.875rem] mr-2 shrink-0" />
                                        Open registration
                                      </a>
                                    )}
                                  </td>

                                  {/* Portal */}
                                  <td className="min-w-0 whitespace-nowrap px-4 lg:px-6 py-3">
                                    {renderPortalRegistration(event)}
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
      </div>
    </div>
  );
};

export default Events;