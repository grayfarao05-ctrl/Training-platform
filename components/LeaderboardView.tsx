import React, { useState, useEffect } from 'react';
import { db, collection, query, orderBy, onSnapshot } from '../firebase';
import { LeaderboardEntry, UserStats } from '../types';
import { RANKS, calculateLevel } from '../constants';
import { Users, Crown, Trophy, Medal, ArrowLeft } from 'lucide-react';
import { Stagger, NetworkBackdrop, GradientDrift } from '../animations';

interface LeaderboardViewProps {
  stats: UserStats;
  onBack: () => void;
}

const LeaderboardView: React.FC<LeaderboardViewProps> = ({ stats, onBack }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isAdmin = stats.role === 'admin';
    const collectionName = isAdmin ? 'users' : 'leaderboard';
    const q = query(collection(db, collectionName), orderBy('xp', 'desc'));
    
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs
        .map(doc => {
          const d = doc.data();
          if (isAdmin) {
            if (d.status === 'deleted') return null;
            const rankIndex = RANKS.findIndex((r, idx) => 
              (d.xp || 0) >= r.minXp && (idx === RANKS.length - 1 || (d.xp || 0) < RANKS[idx + 1].minXp)
            );
            const rank = RANKS[rankIndex] || RANKS[0];
            return {
              uid: doc.id,
              displayName: d.displayName || d.email?.split('@')[0] || 'Anonymous',
              photoURL: d.photoURL || null,
              xp: d.xp || 0,
              level: calculateLevel(d.xp || 0),
              rank: rank.title,
              rankTitle: rank.title,
              rankColor: rank.color,
              updatedAt: d.updatedAt || new Date().toISOString()
            } as LeaderboardEntry;
          }
          return d as LeaderboardEntry;
        })
        .filter((entry): entry is LeaderboardEntry => entry !== null);
      setEntries(data);
      setLoading(false);
    });
    return () => unsub();
  }, [stats.role]);

  const userRankIndex = entries.findIndex(e => e.uid === stats.uid);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8 animate-in fade-in duration-300">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors group text-xs font-black uppercase tracking-wider"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        <span>Back to Dashboard</span>
      </button>

      {/* Top Hero Section */}
      <div className="saas-hero-card rounded-[2rem] text-white p-8 md:p-10">
        <div className="portal-ray-core" />
        <NetworkBackdrop accentColor="#818cf8" />
        <GradientDrift primaryColor="#4f46e5" secondaryColor="#818cf8" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-2">
              Hall of <span className="saas-gradient-word">Fame</span>
            </h1>
            <p className="text-slate-300 font-medium text-xs sm:text-sm">
              Student rankings and achievement standing across ITreal
            </p>
          </div>
          
          {userRankIndex !== -1 && (
            <div className="bg-white/[0.05] border border-indigo-300/30 p-4 rounded-2xl flex items-center gap-4 shadow-md backdrop-blur-md">
              <div className="saas-squircle-outer">
                <div className="saas-squircle-inner font-mono font-extrabold text-base">
                  #{userRankIndex + 1}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">Your Current Rank</p>
                <p className="text-sm font-extrabold text-white tracking-tight">Out of {entries.length} Students</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="saas-glass-card rounded-[2rem] overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[580px]">
            <div className="grid grid-cols-12 gap-4 p-5 border-b border-[var(--border-color)] bg-[var(--bg-surface)] text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">
              <div className="col-span-2 sm:col-span-1">Pos</div>
              <div className="col-span-6 sm:col-span-6">Student</div>
              <div className="col-span-2 sm:col-span-3">Tier</div>
              <div className="col-span-2 sm:col-span-2 text-right">Total XP</div>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Loading rankings...</p>
              </div>
            ) : (
              <Stagger className="divide-y divide-[var(--border-color)]">
                {entries.map((entry, idx) => {
                  const isUser = entry.uid === stats.uid;
                  return (
                    <div 
                      key={entry.uid}
                      className={`grid grid-cols-12 gap-4 p-5 items-center transition-all duration-200 hover:-translate-y-[2px] hover:shadow-md focus-within:-translate-y-[2px] ${
                        isUser 
                          ? 'bg-indigo-500/10 font-bold' 
                          : 'hover:bg-[var(--bg-surface)]'
                      }`}
                    >
                      <div className="col-span-2 sm:col-span-1">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs font-mono ${
                          idx === 0 ? 'bg-amber-400 text-slate-950 font-black shadow-md' :
                          idx === 1 ? 'bg-slate-300 text-slate-950 font-black' :
                          idx === 2 ? 'bg-amber-700 text-white font-black' :
                          'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-color)]'
                        }`}>
                          {idx + 1}
                        </div>
                      </div>

                      <div className="col-span-6 sm:col-span-6 flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                          {entry.photoURL ? (
                            <img src={entry.photoURL} alt="" className="w-10 h-10 rounded-xl object-cover border border-[var(--border-color)]" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-[var(--bg-surface)] flex items-center justify-center border border-[var(--border-color)] text-[var(--text-muted)]">
                              <Users size={16} />
                            </div>
                          )}
                          {idx === 0 && (
                            <div className="absolute -top-1.5 -right-1.5 bg-amber-400 text-slate-950 rounded-full p-1 shadow-md">
                              <Crown size={10} />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-black text-[var(--text-main)] uppercase tracking-tight flex items-center gap-2 truncate">
                            <span>{entry.displayName}</span>
                            {isUser && (
                              <span className="text-[9px] bg-indigo-600 text-white px-1.5 py-0.5 rounded font-black uppercase tracking-wider shrink-0">You</span>
                            )}
                          </h4>
                          <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider">Level {calculateLevel(entry.xp)}</p>
                        </div>
                      </div>

                      <div className="col-span-2 sm:col-span-3">
                        <span className="text-xs font-bold text-[var(--text-muted)] truncate block">
                          {entry.rank || entry.rankTitle}
                        </span>
                      </div>

                      <div className="col-span-2 sm:col-span-2 text-right">
                        <span className="font-mono font-black text-sm text-cyan-400">
                          {entry.xp.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </Stagger>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardView;
