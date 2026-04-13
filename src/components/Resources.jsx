import React, { useState, useMemo, useRef, useEffect } from 'react';
import { resourceCategories, iconMap } from '../data/resourcesData';
import { useNavigate } from 'react-router-dom';


const colorMap = [
  { icon: '#7C3AED', pillBg: '#ede9fe', pillText: '#5B21B6' },
  { icon: '#0369A1', pillBg: '#e0f2fe', pillText: '#075985' },
  { icon: '#059669', pillBg: '#ecfdf5', pillText: '#047857' },
  { icon: '#A16207', pillBg: '#fef9c3', pillText: '#854D0E' },
  { icon: '#9D174D', pillBg: '#fdf2f8', pillText: '#831843' },
  { icon: '#BE123C', pillBg: '#fff1f2', pillText: '#9F1239' },
];

const TYPE_FILTERS = ['All', 'Free', 'Affiliate'];

const Resources = () => {
  const [search, setSearch]         = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);
  const suggestRef = useRef(null);

  const getIcon = (iconName) => {
    const IconComponent = iconMap[iconName];
    return IconComponent ? <IconComponent /> : null;
  };

  // Category suggestions filtered by what user is typing
  const categorySuggestions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return resourceCategories.map((c) => c.title);
    return resourceCategories
      .map((c) => c.title)
      .filter((t) => t.toLowerCase().includes(q));
  }, [search]);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e) => {
      if (
        searchRef.current && !searchRef.current.contains(e.target) &&
        suggestRef.current && !suggestRef.current.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return resourceCategories
      .map((category) => {
        const resources = category.resources.filter((r) => {
          const matchesType =
            typeFilter === 'All' ||
            (typeFilter === 'Free' && !r.affiliate) ||
            (typeFilter === 'Affiliate' && r.affiliate);
          const matchesSearch =
            !q ||
            r.name.toLowerCase().includes(q) ||
            category.title.toLowerCase().includes(q);
          return matchesType && matchesSearch;
        });
        return { ...category, resources };
      })
      .filter((cat) => cat.resources.length > 0);
  }, [search, typeFilter]);

  const totalResults = filtered.reduce((acc, c) => acc + c.resources.length, 0);
  const isFiltering  = search.trim() !== '' || typeFilter !== 'All';

  const navigate = useNavigate();
  const handleBack = () => navigate('/');

  const highlight = (text) => {
    const q = search.trim();
    if (!q) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark style={{
          background: 'rgba(99,102,241,0.18)',
          color: '#818CF8',
          borderRadius: '3px',
          padding: '0 2px',
        }}>
          {text.slice(idx, idx + q.length)}
        </mark>
        {text.slice(idx + q.length)}
      </>
    );
  };

  const clearAll = () => {
    setSearch('');
    setTypeFilter('All');
    setShowSuggestions(false);
  };

  const applySuggestion = (title) => {
    setSearch(title);
    setShowSuggestions(false);
  };

  return (
    <div className="events-page-theme min-h-screen py-8 sm:py-10 px-4 sm:px-6 lg:px-8 bg-theme-app text-theme-primary">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=DM+Serif+Display:ital@0;1&display=swap');

        .res-font { font-family: 'DM Sans', 'Helvetica Neue', sans-serif; }

        /* ── Search box ── */
        .res-search-input {
          width: 100%;
          border-radius: 12px;
          padding: 13px 16px 13px 48px;
          font-size: 16px;
          font-family: inherit;
          outline: none;
          transition: border-color 0.2s;
        }
        .res-search-input:focus { border-color: #6366F1 !important; }

        /* ── Suggestions dropdown ── */
        .res-suggestions {
          position: absolute;
          top: calc(100% + 6px);
          left: 0; right: 0;
          border-radius: 12px;
          z-index: 50;
          overflow: hidden;
          box-shadow: 0 8px 30px rgba(0,0,0,0.18);
        }
        .res-suggest-item {
          display: flex; align-items: center; gap: 10px;
          padding: 11px 16px;
          font-size: 15px;
          cursor: pointer;
          transition: background 0.13s;
        }

        /* ── Type filter chips ── */
        .res-chip {
          font-size: 15px; font-weight: 500;
          padding: 10px 22px; border-radius: 10px;
          cursor: pointer; transition: all 0.18s;
          white-space: nowrap; font-family: inherit;
          border: 1px solid;
        }

        /* ── Card ── */
        .res-card {
          border-radius: 16px; overflow: hidden;
          display: flex; flex-direction: column;
          transition: transform 0.25s, box-shadow 0.25s;
        }
        .res-card:hover { transform: translateY(-3px); }

        /* ── Resource row ── */
        .res-row {
          display: flex; align-items: center; gap: 10px;
          padding: 12px 0;
        }
        .res-row:hover .res-link-text { color: #818CF8 !important; }
        .res-row:hover .res-arrow { opacity: 1 !important; }

        /* ── Grid ── */
        .res-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
        }
        @media (max-width: 1024px) { .res-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px)  {
          .res-grid { grid-template-columns: 1fr; }
          .res-controls { flex-direction: column !important; }
          .res-chips { width: 100%; }
          .res-chip { flex: 1; text-align: center; }
        }
      `}</style>

      <div className="max-w-7xl mx-auto res-font">
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
        <div className="mb-8 sm:mb-10 text-center">
          <p style={{
            fontSize: '13px', fontWeight: 600, letterSpacing: '0.13em',
            textTransform: 'uppercase', color: '#6366F1', marginBottom: '0.75rem',
          }}>
            Placement prep
          </p>
          <h1 style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 'clamp(2.2rem, 5vw, 3.4rem)',
            fontWeight: 400, lineHeight: 1.13, marginBottom: '1rem',
          }}
            className="text-theme-primary"
          >
            Study <em style={{ color: '#818CF8', fontStyle: 'italic' }}>Resources</em>
          </h1>
          <p className="text-slate-400" style={{ fontSize: '17px', maxWidth: '520px', margin: '0 auto', lineHeight: 1.7 }}>
            Curated collection of resources to help you ace technical interviews and excel in your career
          </p>

          
        </div>

        {/* ── Controls ── */}
        <div className="res-controls" style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap' }}>

          {/* Search with suggestions */}
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            {/* Search icon */}
            <span style={{
              position: 'absolute', left: '15px', top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '18px', lineHeight: 1, pointerEvents: 'none',
            }} className="text-slate-400">⌕</span>

            <input
              ref={searchRef}
              className="res-search-input bg-slate-800/60 border border-slate-700 text-slate-200"
              type="text"
              placeholder="Search by resource name or category…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              autoComplete="off"
              style={{ paddingRight: search ? '42px' : '16px' }}
            />
            {/* Clear ×  button — only when there's a value */}
            {search && (
              <button
                onMouseDown={(e) => { e.preventDefault(); setSearch(''); setShowSuggestions(false); }}
                style={{
                  position: 'absolute', right: '12px', top: '50%',
                  transform: 'translateY(-50%)',
                  width: '22px', height: '22px', borderRadius: '50%',
                  background: 'rgba(148,163,184,0.15)',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px', lineHeight: 1, color: '#94A3B8',
                  transition: 'background 0.15s, color 0.15s',
                  fontFamily: 'inherit',
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(148,163,184,0.28)'; e.currentTarget.style.color = '#e2e8f0'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(148,163,184,0.15)'; e.currentTarget.style.color = '#94A3B8'; }}
                title="Clear search"
              >
                ✕
              </button>
            )}

            {/* Category suggestions dropdown */}
            {showSuggestions && categorySuggestions.length > 0 && (
              <div ref={suggestRef} className="res-suggestions bg-slate-800 border border-slate-700">
                <div style={{ padding: '8px 16px 6px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }} className="text-slate-500">
                  Categories
                </div>
                {categorySuggestions.map((title, i) => {
                  const origIdx = resourceCategories.findIndex((c) => c.title === title);
                  const pal = colorMap[origIdx % colorMap.length];
                  return (
                    <div
                      key={title}
                      className="res-suggest-item text-slate-300 hover:bg-slate-700/60"
                      onMouseDown={() => applySuggestion(title)}
                    >
                      <span style={{
                        width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                        background: pal.icon + '22', color: pal.icon,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13,
                      }}>
                        {getIcon(resourceCategories[origIdx]?.icon)}
                      </span>
                      <span>{title}</span>
                      <span style={{ marginLeft: 'auto', fontSize: '12px' }} className="text-slate-600">
                        {resourceCategories[origIdx]?.resources?.length} resources
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Type filter chips */}
          <div className="res-chips" style={{ display: 'flex', gap: '8px', flexShrink: 0, paddingTop: '1px' }}>
            {TYPE_FILTERS.map((f) => {
              const isActive = typeFilter === f;
              const activeStyle = isActive
                ? f === 'All'
                  ? { background: '#4F46E5', borderColor: '#4F46E5', color: '#fff' }
                  : f === 'Free'
                    ? { background: '#14361E', borderColor: '#166534', color: '#4ADE80' }
                    : { background: '#3B2506', borderColor: '#92400E', color: '#FBB543' }
                : {};
              return (
                <button
                  key={f}
                  className="res-chip border-slate-700 bg-slate-800/60 text-slate-400"
                  style={activeStyle}
                  onClick={() => setTypeFilter(f)}
                >
                  {f}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Result bar ── */}
        {isFiltering && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', marginBottom: '1.5rem' }} className="text-slate-400">
            <span style={{
              width: 8, height: 8, borderRadius: '50%', flexShrink: 0, display: 'inline-block',
              background: totalResults > 0 ? '#4ADE80' : '#EF4444',
            }} />
            <span>
              {totalResults > 0
                ? `${totalResults} resource${totalResults !== 1 ? 's' : ''} found`
                : 'No results found'}
            </span>
            {search.trim() && (
              <span className="text-slate-500">
                {' '}for "<span style={{ color: '#818CF8' }}>{search.trim()}</span>"
              </span>
            )}
            <button
              onClick={clearAll}
              style={{
                marginLeft: 'auto', fontSize: '15px', fontWeight: 500,
                color: '#6366F1', background: 'none', border: 'none',
                cursor: 'pointer', fontFamily: 'inherit', padding: 0,
                textDecoration: 'underline', textUnderlineOffset: '3px',
              }}
            >
              Clear all
            </button>
          </div>
        )}

        {/* ── Grid ── */}
        <div className="res-grid">
          {filtered.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '5rem 2rem' }}>
              <span style={{ fontSize: '44px', display: 'block', marginBottom: '1.25rem' }}>🔍</span>
              <div style={{ fontSize: '20px', fontWeight: 500, marginBottom: '0.5rem' }} className="text-slate-400">No resources match your filters</div>
              <div style={{ fontSize: '16px' }} className="text-slate-500">Try a different keyword, category, or reset the filters</div>
            </div>
          ) : (
            filtered.map((category) => {
              const origIdx = resourceCategories.findIndex((c) => c.id === category.id);
              const pal = colorMap[origIdx % colorMap.length];
              return (
                <div key={category.id} className="res-card bg-slate-900/70 border border-slate-800">
                  {/* Card header */}
                  <div style={{
                    padding: '1.25rem 1.5rem 1.05rem',
                    display: 'flex', alignItems: 'center', gap: '14px',
                  }} className="border-b border-slate-800">
                    <div style={{
                      width: 46, height: 46, borderRadius: 11, flexShrink: 0,
                      background: pal.icon + '22', color: pal.icon,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 20,
                    }}>
                      {getIcon(category.icon)}
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 500, flex: 1, minWidth: 0, lineHeight: 1.3 }} className="text-slate-200">
                      {category.title}
                    </div>
                    <div style={{
                      flexShrink: 0, fontSize: '13px', fontWeight: 500,
                      padding: '3px 11px', borderRadius: '20px',
                    }} className="bg-slate-800 text-slate-500">
                      {category.resources.length}
                    </div>
                  </div>

                  {/* Card body */}
                  <div style={{ padding: '0.5rem 1.5rem 1.4rem', flex: 1 }}>
                    {category.resources.map((resource, rIdx) => (
                      <div
                        key={resource.id}
                        className="res-row"
                        style={{ borderBottom: rIdx < category.resources.length - 1 ? '1px solid' : 'none' }}
                      >
                        <style>{`.res-row { border-color: rgba(51,65,85,0.5); }`}</style>
                        <span style={{
                          fontSize: '11px', fontWeight: 600,
                          padding: '3px 10px', borderRadius: '20px',
                          flexShrink: 0, letterSpacing: '0.04em', textTransform: 'uppercase',
                          ...(resource.affiliate
                            ? { background: '#3B2506', color: '#FBB543' }
                            : { background: '#14361E', color: '#4ADE80' }),
                        }}>
                          {resource.affiliate ? 'Affiliate' : 'Free'}
                        </span>
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="res-link-text text-slate-400"
                          style={{ fontSize: '16px', textDecoration: 'none', lineHeight: 1.45, transition: 'color 0.15s', flex: 1, minWidth: 0 }}
                        >
                          {highlight(resource.name)}
                        </a>
                        <span
                          className="res-arrow"
                          style={{ flexShrink: 0, opacity: 0, fontSize: '13px', color: '#6366F1', transition: 'opacity 0.15s', marginLeft: 'auto' }}
                        >
                          ↗
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Disclaimer ── */}
        <div className="bg-slate-900/70 border border-slate-800"
          style={{
            marginTop: '2.5rem', borderRadius: '14px',
            padding: '1.4rem 1.6rem', maxWidth: '720px',
            marginLeft: 'auto', marginRight: 'auto',
            display: 'flex', gap: '16px', alignItems: 'flex-start',
          }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: 9,
            background: '#3B2506', color: '#FBB543',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, fontSize: 16,
          }}>📝</div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 500, marginBottom: '6px' }} className="text-slate-300">
              Affiliate link disclaimer
            </div>
            <p className="text-slate-500" style={{ fontSize: '14px', lineHeight: 1.7 }}>
              Some links are affiliate links — we may earn a small commission at no extra cost to you.
              This helps us maintain and improve the platform. All resources are selected based on
              educational value and quality.
            </p>
          </div>
        </div>

        {/* ── CTA ── */}
        <div className="bg-slate-900/70 border border-slate-800"
          style={{ marginTop: '2.5rem', borderRadius: '16px', padding: '3rem', textAlign: 'center' }}
        >
          <h2
            style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontWeight: 400, fontSize: '2rem', marginBottom: '0.6rem',
            }}
            className="text-white"
          >
            Ready to start learning?
          </h2>
          <p className="text-slate-400" style={{ fontSize: '16px', marginBottom: '1.75rem', lineHeight: 1.65 }}>
            Begin your journey with these carefully curated resources and boost your placement preparation
          </p>
          <a
            href="/companystats"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: '#4F46E5', color: '#fff',
              fontSize: '16px', fontWeight: 500,
              padding: '12px 28px', borderRadius: '10px',
              textDecoration: 'none', transition: 'background 0.2s',
              fontFamily: 'inherit',
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#4338CA'}
            onMouseOut={(e) => e.currentTarget.style.background = '#4F46E5'}
          >
            Explore company stats <span style={{ fontSize: '18px' }}>→</span>
          </a>
        </div>

      </div>
    </div>
  );
};

export default Resources;