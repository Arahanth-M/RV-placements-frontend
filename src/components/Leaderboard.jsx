import React, { useState, useEffect } from 'react';
import { leaderboardAPI } from '../utils/api';
import { useAuth } from '../utils/AuthContext';
import { FaTrophy, FaMedal, FaUser } from 'react-icons/fa';

const Leaderboard = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
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
    fetchLeaderboard();
  }, []);

  const getRankIcon = (rank) => {
    if (rank === 1) return <FaTrophy className="w-6 h-6 text-amber-400" />;
    if (rank === 2) return <FaMedal className="w-6 h-6 text-slate-300" />;
    if (rank === 3) return <FaMedal className="w-6 h-6 text-amber-700" />;
    return <span className="text-slate-400 font-bold w-6 text-center">{rank}</span>;
  };

  return (
    <div className="content-cards-page-theme min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-theme-app text-theme-primary">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-2">
            <FaTrophy className="text-amber-400" />
            Contributor Leaderboard
          </h1>
          <p className="text-sm sm:text-base text-slate-400">
            Top contributors who add questions and interview experiences to the platform. Add a question (+5 pts) or an interview experience (+10 pts) to climb the board.
          </p>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400"></div>
            <p className="mt-4 text-slate-400">Loading leaderboard...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-6 mb-8">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {leaderboard.length === 0 ? (
              <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl shadow-lg p-12 text-center">
                <FaTrophy className="mx-auto text-slate-600 text-6xl mb-4" />
                <p className="text-slate-300 text-lg">No contributors yet.</p>
                <p className="text-slate-400 mt-2">Be the first to contribute and earn points!</p>
              </div>
            ) : (
              <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl shadow-lg overflow-hidden">
                <ul className="divide-y divide-slate-700">
                  {leaderboard.map((entry) => (
                    <li
                      key={entry.userId}
                      className={`flex items-center gap-4 px-4 sm:px-6 py-4 hover:bg-slate-800/50 transition-colors ${
                        user && user.userId === entry.userId ? 'bg-indigo-900/20 border-l-4 border-indigo-500' : ''
                      }`}
                    >
                      <div className="flex-shrink-0 w-10 flex items-center justify-center">
                        {getRankIcon(entry.rank)}
                      </div>
                      <div className="flex-shrink-0">
                        {entry.picture ? (
                          <img
                            src={entry.picture}
                            alt={entry.username}
                            className="w-10 h-10 rounded-full object-cover border-2 border-slate-600"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                              e.target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center border-2 border-slate-600 ${entry.picture ? 'hidden' : ''}`}>
                          <FaUser className="w-5 h-5 text-slate-400" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-200 font-semibold truncate">
                          {entry.username}
                          {user && user.userId === entry.userId && (
                            <span className="ml-2 text-xs text-indigo-400 font-normal">(You)</span>
                          )}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-indigo-600/80 text-white">
                          {entry.points} pts
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
