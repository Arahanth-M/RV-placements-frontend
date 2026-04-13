import React, { useState, useEffect, useRef } from 'react';
import { leaderboardAPI } from '../utils/api';
import { useAuth } from '../utils/AuthContext';
import { FaTrophy, FaMedal, FaUser, FaRedo, FaSearch, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';


/* ─── helpers ─────────────────────────────────────────────── */
const TIME_FILTERS = ['All Time', 'This Month', 'This Week'];

const podiumMeta = [
  { border: '#F59E0B', label: '1st', ptsBg: 'rgba(245,158,11,0.15)', ptsColor: '#D97706' },
  { border: '#94A3B8', label: '2nd', ptsBg: 'rgba(148,163,184,0.15)', ptsColor: '#64748B' },
];

/* ─── Skeleton row ─────────────────────────────────────────── */
const SkeletonRow = () => (
  <li className="flex items-center gap-4 px-4 sm:px-6 py-4 animate-pulse">
    <div className="w-8 h-8 rounded-full bg-slate-700/60 flex-shrink-0" />
    <div className="w-10 h-10 rounded-full bg-slate-700/60 flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-3.5 bg-slate-700/60 rounded w-1/3" />
      <div className="h-2.5 bg-slate-700/40 rounded w-1/5" />
    </div>
    <div className="w-16 h-7 rounded-full bg-slate-700/60" />
  </li>
);

/* ─── Avatar with fallback ─────────────────────────────────── */
const Avatar = ({ src, alt, size = 64, border }) => {
  const [imgError, setImgError] = useState(false);
  const iconSize = size * 0.44;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `2px solid ${border}`,
      overflow: 'hidden', background: '#334155',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      {src && !imgError
        ? <img
            src={src}
            alt={alt}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={() => setImgError(true)}
          />
        : <FaUser style={{ width: iconSize, height: iconSize, color: '#94A3B8' }} />
      }
    </div>
  );
};

/* ─── Podium card (top 2) ──────────────────────────────────── */
const PodiumCard = ({ entry, rank, isCurrentUser }) => {
  const meta = podiumMeta[rank - 1] || podiumMeta[1];
  const RankIcon = rank === 1
    ? () => <FaTrophy className="w-5 h-5" style={{ color: '#F59E0B' }} />
    : () => <FaMedal className="w-5 h-5" style={{ color: '#94A3B8' }} />;

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '1.25rem',
        borderRadius: '16px',
        border: `1.5px solid ${meta.border}`,
        background: 'var(--bg-card)',
        backdropFilter: 'blur(8px)',
        boxShadow: `0 8px 24px rgba(15,23,42,0.08)`,
        transition: 'transform 0.25s',
        outline: isCurrentUser ? '2px solid #6366F1' : 'none',
        outlineOffset: '2px',
        minWidth: 0,
      }}
      onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
      onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
      aria-label={`Rank ${rank}: ${entry.username}, ${entry.points} points`}
    >
      {isCurrentUser && (
        <span style={{
          position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
          fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
          background: '#4F46E5', color: '#fff', padding: '2px 10px', borderRadius: '999px',
          whiteSpace: 'nowrap',
        }}>You</span>
      )}

      {/* Rank badge */}
      <span style={{
        position: 'absolute', top: '10px', right: '10px',
        fontSize: '11px', fontWeight: 700,
        padding: '2px 8px', borderRadius: '999px',
        background: meta.ptsBg, color: meta.ptsColor,
        border: `1px solid ${meta.border}44`,
      }}>{meta.label}</span>

      {/* Avatar */}
      <div style={{ position: 'relative', marginBottom: '10px', marginTop: '8px' }}>
        <Avatar src={entry.picture} alt={entry.username} size={64} border={meta.border} />
        <div style={{ position: 'absolute', bottom: '-8px', left: '50%', transform: 'translateX(-50%)' }}>
          <RankIcon />
        </div>
      </div>

      <p style={{ marginTop: '12px', fontWeight: 600, fontSize: '14px', color: '#E2E8F0', textAlign: 'center', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {entry.username}
      </p>

      <span style={{
        marginTop: '8px', display: 'inline-flex', alignItems: 'center',
        padding: '4px 12px', borderRadius: '999px', fontSize: '14px', fontWeight: 700,
        background: meta.ptsBg, color: meta.ptsColor,
      }}>
        {entry.points} pts
      </span>

      {(entry.questionsAdded || entry.experiencesAdded) && (
        <p style={{ marginTop: 8, fontSize: 11, color: '#64748B', textAlign: 'center', lineHeight: 1.5 }}>
          {entry.questionsAdded
            ? <span>{entry.questionsAdded} Q{entry.questionsAdded !== 1 ? 's' : ''}</span>
            : null}
          {entry.questionsAdded && entry.experiencesAdded
            ? <span style={{ margin: '0 4px', opacity: 0.4 }}>·</span>
            : null}
          {entry.experiencesAdded
            ? <span>{entry.experiencesAdded} Exp{entry.experiencesAdded !== 1 ? 's' : ''}</span>
            : null}
        </p>
      )}
    </div>
  );
};

/* ─── Main component ───────────────────────────────────────── */
const Leaderboard = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [timeFilter, setTimeFilter]   = useState('All Time');
  const [search, setSearch]           = useState('');
  const [showAll, setShowAll]         = useState(false);
  const myRowRef = useRef(null);

  const PAGE_SIZE = 10;

  const fetchLeaderboard = async () => {
    if (user?.betaAccess === false) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const response = await leaderboardAPI.getLeaderboard();
      setLeaderboard(response.data || []);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to load leaderboard. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeaderboard(); }, [user?.betaAccess]);

  /* ── derived data ── */
  const filtered = leaderboard.filter((e) =>
    e.username?.toLowerCase().includes(search.toLowerCase())
  );

  // TOP 2 in podium cards, rest (rank 3+) in the list below
  const top2    = search ? [] : filtered.slice(0, 2);
  const rest    = search ? filtered : filtered.slice(2); // FIX: was slice(3), must match top2
  const visible = showAll ? rest : rest.slice(0, PAGE_SIZE);

  const currentUserEntry = leaderboard.find((e) => user && e.userId === user.userId);
  const currentUserRank  = currentUserEntry ? leaderboard.indexOf(currentUserEntry) + 1 : null;
  const currentUserInView = filtered
    .slice(0, showAll ? filtered.length : PAGE_SIZE + 2)
    .some((e) => user && e.userId === user.userId);

  const scrollToMe = () => myRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  const getRankIcon = (rank) => {
    if (rank === 1) return <FaTrophy style={{ width: 20, height: 20, color: '#F59E0B' }} />;
    if (rank === 2) return <FaMedal  style={{ width: 20, height: 20, color: '#94A3B8' }} />;
    if (rank === 3) return <FaMedal  style={{ width: 20, height: 20, color: '#B45309' }} />;
    return <span style={{ color: '#475569', fontWeight: 700, fontSize: 14, width: 24, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{rank}</span>;
  };

  const navigate = useNavigate();
  const handleBack = () => navigate(-1);

  const panelStyle = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    backdropFilter: 'blur(8px)',
    boxShadow: '0 12px 32px rgba(15,23,42,0.08)',
  };

  return (
    <div className="events-page-theme min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-theme-app text-theme-primary">
      <style>{`
        @keyframes lb-fade-in {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .lb-entry { animation: lb-fade-in 0.35s ease both; }
        @keyframes lb-pulse-ring {
          0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.35); }
          50%       { box-shadow: 0 0 0 6px rgba(99,102,241,0); }
        }
        .lb-you-pulse { animation: lb-pulse-ring 2.5s ease infinite; }
        .lb-row-hover:hover { background: rgba(79,70,229,0.08) !important; }
        .lb-search-input { outline: none; width: 100%; }
        .lb-search-input:focus { border-color: #6366F1 !important; }
        .lb-chip { cursor: pointer; transition: all 0.18s; white-space: nowrap; font-family: inherit; }
        .lb-chip:hover { border-color: #6366F1 !important; color: #818CF8 !important; }
      `}</style>

      <div style={{ maxWidth: 896, margin: '0 auto' }}>

        {/* Back Button */}
        <div className="mb-4 flex items-center justify-between gap-2 flex-wrap">
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

        {/* ── Header ── */}
        <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.6rem,4vw,2.4rem)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
              <FaTrophy style={{ color: '#F59E0B' }} />
              Contributor Leaderboard
            </h1>
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'nowrap' }}>
              Top contributors who add questions and interview experiences to the platform.
            </p>
          </div>

          <button
            onClick={fetchLeaderboard}
            disabled={loading}
            style={{
              marginLeft: 'auto',
              flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 14, color: 'var(--text-primary)',
              border: '1px solid var(--border)', background: 'var(--bg-hero)',
              padding: '8px 16px', borderRadius: 10,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', transition: 'all 0.18s',
            }}
            onMouseOver={(e) => { e.currentTarget.style.color = '#E2E8F0'; }}
            onMouseOut={(e)  => { e.currentTarget.style.color = 'var(--text-primary)'; }}
          >
            <FaRedo style={{ width: 13, height: 13 }} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* ── Points legend ── */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24, justifyContent: 'center' }}>
          {[
            { dot: '#818CF8', label: 'Add a question', pts: '+5 pts', ptsColor: '#818CF8' },
            { dot: '#A78BFA', label: 'Add an experience', pts: '+10 pts', ptsColor: '#A78BFA' },
          ].map(({ dot, label, pts, ptsColor }) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '8px 16px', fontSize: 14, color: 'var(--text-secondary)',
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: dot, display: 'inline-block' }} />
              {label}
              <span style={{ fontWeight: 700, color: ptsColor, marginLeft: 4 }}>{pts}</span>
            </div>
          ))}
        </div>

        {/* ── Time filter + Search ── */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{
            display: 'flex', gap: 6,
            background: 'var(--bg-hero)', border: '1px solid var(--border)',
            padding: 4, borderRadius: 12,
          }}>
            {TIME_FILTERS.map((f) => (
              <button
                key={f}
                className="lb-chip"
                onClick={() => setTimeFilter(f)}
                style={{
                  padding: '6px 16px', borderRadius: 9, fontSize: 14, fontWeight: 500,
                  border: 'none',
                  background: timeFilter === f ? 'var(--accent)' : 'transparent',
                  color: timeFilter === f ? '#fff' : 'var(--text-secondary)',
                  boxShadow: timeFilter === f ? '0 2px 6px rgba(79,70,229,0.25)' : 'none',
                }}
              >
                {f}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <FaSearch style={{
              position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
              color: '#475569', width: 13, height: 13, pointerEvents: 'none',
            }} />
            <input
              className="lb-search-input"
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setShowAll(false); }}
              placeholder="Search by username…"
              style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 10, paddingLeft: 36, paddingRight: search ? 36 : 14,
                paddingTop: 9, paddingBottom: 9,
                fontSize: 14, color: 'var(--text-primary)',
                fontFamily: 'inherit', transition: 'border-color 0.2s',
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#475569', display: 'flex', alignItems: 'center',
                  transition: 'color 0.15s',
                }}
                onMouseOver={(e) => e.currentTarget.style.color = '#94A3B8'}
                onMouseOut={(e)  => e.currentTarget.style.color = '#475569'}
              >
                <FaTimes style={{ width: 11, height: 11 }} />
              </button>
            )}
          </div>
        </div>

        {/* ── Loading skeleton ── */}
        {loading && (
          <div style={panelStyle}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16, padding: 16, marginBottom: 8 }}>
              {[1,2].map((i) => (
                <div key={i} style={{ height: 160, borderRadius: 16, background: 'var(--bg-hero)' }} className="animate-pulse" />
              ))}
            </div>
            <ul>{Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}</ul>
          </div>
        )}

        {/* ── Error state ── */}
        {error && (
          <div style={{
            background: 'rgba(127,29,29,0.25)', border: '1px solid #991B1B',
            borderRadius: 12, padding: '20px 24px', marginBottom: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <p style={{ color: '#FCA5A5', fontSize: 15 }}>{error}</p>
            <button
              onClick={fetchLeaderboard}
              style={{
                flexShrink: 0, marginLeft: 16, fontSize: 14, color: '#FCA5A5',
                border: '1px solid #991B1B', background: 'none',
                padding: '6px 14px', borderRadius: 9, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
              }}
            >
              <FaRedo style={{ width: 12, height: 12 }} /> Retry
            </button>
          </div>
        )}

        {/* ── Content ── */}
        {!loading && !error && (
          <>
            {filtered.length === 0 ? (
              <div style={{ ...panelStyle, padding: '5rem 2rem', textAlign: 'center' }}>
                <FaTrophy style={{ fontSize: 56, color: 'var(--accent-secondary)', display: 'block', margin: '0 auto 16px' }} />
                {search
                  ? <p style={{ color: '#94A3B8', fontSize: 18 }}>No users matching "<span style={{ color: '#818CF8' }}>{search}</span>"</p>
                  : <>
                      <p style={{ color: '#94A3B8', fontSize: 18 }}>No contributors yet.</p>
                      <p style={{ color: '#475569', marginTop: 8 }}>Be the first to contribute and earn points!</p>
                    </>
                }
              </div>
            ) : (
              <div style={panelStyle}>

                {/* ── Podium top 2 ── */}
                {top2.length > 0 && (
                  <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: top2.length === 1 ? '280px' : '1fr 1fr',
                      gap: 16,
                      maxWidth: top2.length === 1 ? 280 : 'none',
                      margin: '0 auto',
                    }}>
                      {top2.map((entry) => (
                        <div
                          key={entry.userId}
                          className="lb-entry"
                          style={{ animationDelay: `${(entry.rank - 1) * 80}ms` }}
                          ref={user && entry.userId === user.userId ? myRowRef : null}
                        >
                          <PodiumCard entry={entry} rank={entry.rank} isCurrentUser={!!(user && entry.userId === user.userId)} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── List rows (rank 3 onwards) ── */}
                {visible.length > 0 && (
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                    {visible.map((entry, idx) => {
                      const isMe = !!(user && entry.userId === user.userId);
                      return (
                        <li
                          key={entry.userId}
                          ref={isMe ? myRowRef : null}
                          className={`lb-entry lb-row-hover ${isMe ? 'lb-you-pulse' : ''}`}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 16,
                            padding: '14px 24px',
                            borderBottom: idx < visible.length - 1 ? '1px solid var(--border)' : 'none',
                            animationDelay: `${idx * 40}ms`,
                            background: isMe ? 'rgba(99,102,241,0.08)' : 'transparent',
                            borderLeft: isMe ? '4px solid #6366F1' : '4px solid transparent',
                            transition: 'background 0.15s',
                          }}
                        >
                          {/* rank */}
                          <div style={{ flexShrink: 0, width: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {getRankIcon(entry.rank)}
                          </div>

                          {/* avatar */}
                          <div style={{ flexShrink: 0, position: 'relative' }}>
                            <Avatar
                              src={entry.picture}
                              alt={entry.username}
                              size={40}
                              border={isMe ? '#6366F1' : 'var(--border)'}
                            />
                            {isMe && (
                              <span style={{
                                position: 'absolute', bottom: -3, right: -3,
                                width: 16, height: 16, borderRadius: '50%',
                                background: '#6366F1', border: '2px solid #0F172A',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 7, color: '#fff', fontWeight: 700,
                              }}>★</span>
                            )}
                          </div>

                          {/* name */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{
                              fontWeight: 600, fontSize: 14,
                              color: isMe ? '#A5B4FC' : 'var(--text-primary)',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {entry.username}
                              {isMe && (
                                <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 400, color: '#818CF8', background: 'rgba(99,102,241,0.15)', padding: '1px 8px', borderRadius: 999 }}>
                                  You
                                </span>
                              )}
                            </p>
                            {(entry.questionsAdded || entry.experiencesAdded) && (
                              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                                {entry.questionsAdded ? `${entry.questionsAdded} question${entry.questionsAdded !== 1 ? 's' : ''}` : ''}
                                {entry.questionsAdded && entry.experiencesAdded ? ' · ' : ''}
                                {entry.experiencesAdded ? `${entry.experiencesAdded} experience${entry.experiencesAdded !== 1 ? 's' : ''}` : ''}
                              </p>
                            )}
                          </div>

                          {/* points */}
                          <span style={{
                            flexShrink: 0, display: 'inline-flex', alignItems: 'center',
                            padding: '4px 12px', borderRadius: 999, fontSize: 14, fontWeight: 700,
                            background: isMe ? 'rgba(99,102,241,0.7)' : 'var(--bg-hero)',
                            color: isMe ? '#fff' : 'var(--text-secondary)',
                            border: isMe ? 'none' : '1px solid var(--border)',
                          }}>
                            {entry.points} pts
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {/* ── Show more ── */}
                {rest.length > PAGE_SIZE && (
                  <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                    <button
                      onClick={() => setShowAll(!showAll)}
                      style={{
                        fontSize: 14, fontWeight: 500, color: 'var(--accent-secondary)',
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontFamily: 'inherit', transition: 'color 0.15s',
                      }}
                      onMouseOver={(e) => e.currentTarget.style.color = '#A5B4FC'}
                      onMouseOut={(e)  => e.currentTarget.style.color = 'var(--accent-secondary)'}
                    >
                      {showAll ? '↑ Show less' : `↓ Show all ${rest.length} entries`}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── Sticky "Your rank" bar ── */}
            {currentUserEntry && !currentUserInView && (
              <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 50, width: 'calc(100% - 2rem)', maxWidth: 360 }}>
                <div style={{
                  background: 'var(--bg-card)', backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(99,102,241,0.45)', borderRadius: 18,
                  padding: '12px 20px', boxShadow: '0 8px 32px rgba(15,23,42,0.12)',
                  display: 'flex', alignItems: 'center', gap: 14,
                }}>
                  <Avatar src={currentUserEntry.picture} alt="You" size={36} border="#6366F1" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 11, color: '#818CF8', fontWeight: 500 }}>Your rank</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                      #{currentUserRank} · {currentUserEntry.points} pts
                    </p>
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

export default Leaderboard;