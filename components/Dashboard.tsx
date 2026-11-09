import React, { useState, useEffect } from 'react';
import { User, UserStats, Objective, Domain, ViewState, ExternalLink, CourseId } from '../types';
import { COMPTIA_DOMAINS, calculateLevel, RANKS } from '../constants';
import { getCourseProgress, getCourseConfig, filterByCourse } from '../courseConfig';
import DashboardHero from './DashboardHero';
import BossChallengeCard from './BossChallengeCard';
import XPBreakdownWidget from './XPBreakdownWidget';
import CommunityLibrary from './CommunityLibrary';
import ArcadeRow from './ArcadeRow';
import { 
  Trophy, 
  Target, 
  Zap, 
  Clock, 
  Link as LinkIcon, 
  XCircle, 
  ExternalLink as ExternalLinkIcon,
  ChevronRight,
  Phone,
  Mail,
  GraduationCap
} from 'lucide-react';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Stagger, CountUp, FillBar } from '../animations';

interface DashboardProps {
  domains: Domain[];
  stats: UserStats | null;
  onObjectiveClick: (obj: Objective) => void;
  onViewChange: (view: ViewState) => void;
  activeCourse?: CourseId;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  domains, 
  stats, 
  onObjectiveClick, 
  onViewChange, 
  activeCourse = 'a-plus' 
}) => {
  const [externalLinks, setExternalLinks] = useState<ExternalLink[]>([]);
  const [showLinksModal, setShowLinksModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const courseConfig = getCourseConfig(activeCourse);
  const courseProg = getCourseProgress(stats, activeCourse);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'external_links'), (snapshot) => {
      const allLinks = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ExternalLink));
      setExternalLinks(filterByCourse(allLinks, activeCourse));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'external_links'));
    return () => unsubscribe();
  }, [activeCourse]);

  if (!stats) {
    return (
      <div className="min-h-screen bg-[var(--bg-app)] flex items-center justify-center">
        <div className="text-[var(--text-main)] font-black uppercase tracking-widest animate-pulse">Loading Stats...</div>
      </div>
    );
  }

  const currentLevel = calculateLevel(stats.xp);
  const currentRank = RANKS[currentLevel] || RANKS[0];

  return (
    <div className="pb-32 bg-[var(--bg-app)] text-[var(--text-main)] min-h-screen transition-colors duration-200">
      {/* 1. Gradient Hero Card for Active Course */}
      <DashboardHero 
        onLearnMore={onObjectiveClick} 
        activeCourse={activeCourse}
        userStats={stats}
        onViewChange={onViewChange}
        domains={domains}
      />

      <div className="px-6 md:px-12 lg:px-24 pt-6 space-y-12">
        {/* 2. Stat Cards Row */}
        <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {/* Streak Card */}
          <div className="saas-glass-card p-6 rounded-3xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="saas-squircle-outer">
                <div className="saas-squircle-inner">
                  <Zap size={18} />
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Current Streak</div>
                <div className="text-2xl font-extrabold text-[var(--text-main)] font-mono">
                  <CountUp value={stats.streak} suffix=" Days" />
                </div>
              </div>
            </div>
            <FillBar value={Math.min(100, Math.max(10, stats.streak * 10))} color="#818CF8" heightClass="h-1.5" />
          </div>

          {/* XP & Level Card */}
          <div className="saas-glass-card p-6 rounded-3xl relative overflow-hidden group">
            <div className="flex items-center gap-4 mb-3">
              <div className="saas-squircle-outer">
                <div className="saas-squircle-inner">
                  <Trophy size={18} />
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Total XP</div>
                <div className="text-2xl font-extrabold text-[var(--text-main)] font-mono">
                  <CountUp value={stats.xp} />
                </div>
              </div>
            </div>
            <div className="pt-3 border-t border-[var(--border-color)] flex items-baseline justify-between">
              <div>
                <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">Tech Level</span>
                <span className="text-xl font-extrabold saas-gradient-word font-mono">
                  LVL <CountUp value={currentLevel} prefix="0" />
                </span>
              </div>
              <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider truncate max-w-[120px] text-right">
                {currentRank.title}
              </span>
            </div>
          </div>

          {/* Exam Readiness Card */}
          <div className="saas-glass-card p-6 rounded-3xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="saas-squircle-outer">
                <div className="saas-squircle-inner">
                  <Target size={18} />
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Exam Readiness</div>
                <div className="text-2xl font-extrabold text-[var(--text-main)] font-mono">
                  <CountUp value={courseProg.examReadiness} suffix="%" />
                </div>
              </div>
            </div>
            <FillBar value={courseProg.examReadiness} color="#6366F1" heightClass="h-1.5" />
          </div>

          {/* Study Time Card */}
          <div className="saas-glass-card p-6 rounded-3xl">
            <div className="flex items-center gap-4 mb-3">
              <div className="saas-squircle-outer">
                <div className="saas-squircle-inner">
                  <Clock size={18} />
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Study Time</div>
                <div className="text-2xl font-extrabold text-[var(--text-main)] font-mono">
                  <CountUp 
                    value={Math.round((stats.activityHistory?.reduce((acc, day) => acc + (day.studyHours || 0), 0) || 0) * 10)} 
                    formatter={(val) => `${(val / 10).toFixed(1)}h`}
                  />
                </div>
              </div>
            </div>
            <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider pt-2 border-t border-[var(--border-color)]">
              This Week Logged
            </div>
          </div>

          {/* External Links / Resources */}
          <div 
            onClick={() => setShowLinksModal(true)}
            className="saas-glass-card p-6 rounded-3xl cursor-pointer group"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="saas-squircle-outer group-hover:scale-105 transition-transform">
                <div className="saas-squircle-inner">
                  <LinkIcon size={18} />
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Resources</div>
                <div className="text-xl font-extrabold text-[var(--text-main)] tracking-tight">Study Vault</div>
              </div>
            </div>
            <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider pt-2 border-t border-[var(--border-color)] flex items-center justify-between">
              <span>View Materials</span>
              <ChevronRight size={13} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Stagger>

        {/* 3. Main Dashboard Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Arcade Grid & Community Library */}
          <div className="lg:col-span-2 space-y-12">
            <ArcadeRow userStats={stats} onViewChange={onViewChange} activeCourse={activeCourse} />
            <CommunityLibrary userStats={stats} activeCourse={activeCourse} />
          </div>

          {/* Right Column: Instructor Card & XP Breakdown */}
          <div className="hidden lg:block space-y-6">
            <SidebarContent stats={stats} activeCourse={activeCourse} />
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-[85%] max-w-sm bg-[var(--bg-surface)] border-l border-[var(--border-color)] z-[101] lg:hidden p-6 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tighter">
                  Stats & <span className="text-indigo-400">Goals</span>
                </h2>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 bg-[var(--bg-card)] rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)]"
                >
                  <XCircle size={22} />
                </button>
              </div>
              <div className="space-y-6">
                <SidebarContent stats={stats} activeCourse={activeCourse} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Sidebar Handle */}
      <motion.button
        initial={{ x: 100 }}
        animate={{ x: 0 }}
        whileHover={{ x: -4 }}
        onClick={() => setIsSidebarOpen(true)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-[90] lg:hidden flex items-center gap-2 bg-indigo-600 text-white py-4 px-2.5 rounded-l-2xl shadow-xl shadow-indigo-600/30 group"
      >
        <div className="flex flex-col items-center gap-1.5">
          <ChevronRight className="rotate-180 group-hover:scale-110 transition-transform" size={18} />
          <div className="[writing-mode:vertical-lr] rotate-180 text-[10px] font-black uppercase tracking-[0.2em]">Stats</div>
        </div>
      </motion.button>

      {/* External Links Modal */}
      <AnimatePresence>
        {showLinksModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLinksModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative w-full max-w-2xl bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-8 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-surface)]">
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight text-[var(--text-main)]">
                    External <span style={{ color: courseConfig.accentHex }}>Resources</span>
                  </h2>
                  <p className="text-[var(--text-muted)] text-xs uppercase tracking-wider font-bold mt-1">
                    Curated materials for {courseConfig.name}
                  </p>
                </div>
                <button 
                  onClick={() => setShowLinksModal(false)} 
                  className="p-2.5 bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-xl transition-all border border-[var(--border-color)]"
                >
                  <XCircle size={22} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-4">
                {externalLinks.length > 0 ? (
                  externalLinks.map(link => (
                    <a 
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-6 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl hover:border-indigo-500/40 transition-all group shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1.5 min-w-0">
                          <h3 className="text-lg font-black uppercase tracking-tight text-[var(--text-main)] group-hover:text-cyan-400 transition-colors truncate">
                            {link.label}
                          </h3>
                          <p className="text-[var(--text-muted)] text-xs leading-relaxed">
                            {link.description || 'Verified course resource link.'}
                          </p>
                          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--text-muted)] pt-2">
                            <LinkIcon size={12} />
                            <span className="truncate max-w-[280px]">{link.url}</span>
                          </div>
                        </div>
                        <div className="p-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl text-[var(--text-muted)] group-hover:text-cyan-400 group-hover:border-cyan-500/30 transition-all shrink-0">
                          <ExternalLinkIcon size={18} />
                        </div>
                      </div>
                    </a>
                  ))
                ) : (
                  <div className="py-20 text-center">
                    <LinkIcon size={44} className="mx-auto text-[var(--text-muted)] mb-4 opacity-30" />
                    <p className="text-[var(--text-muted)] font-bold uppercase tracking-wider text-xs">
                      No external links configured for this course yet.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SidebarContent: React.FC<{ stats: UserStats; activeCourse?: CourseId }> = ({ stats, activeCourse = 'a-plus' }) => {
  const courseConfig = getCourseConfig(activeCourse);

  return (
    <>
      {/* "Your Instructor" Card */}
      <motion.div 
        whileHover={{ y: -3 }}
        className="saas-glass-card p-6 rounded-3xl relative overflow-hidden"
      >
        <div 
          aria-hidden="true" 
          className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-[50px] opacity-25 pointer-events-none bg-indigo-500"
        />
        
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300 flex items-center gap-1.5">
            <GraduationCap size={13} className="text-indigo-400" />
            Your Instructor
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            Online
          </span>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <div className="saas-squircle-outer">
            <div className="saas-squircle-inner font-extrabold text-sm">
              GF
            </div>
          </div>
          <div className="min-w-0">
            <h4 className="text-base font-extrabold tracking-tight text-[var(--text-main)] truncate">
              Gray Farao
            </h4>
            <p className="text-xs text-[var(--text-muted)] font-semibold">
              Lead Certification Tutor
            </p>
          </div>
        </div>

        <div className="space-y-2 pt-3 border-t border-[var(--border-color)]">
          <a 
            href="tel:0761542903"
            className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] hover:bg-indigo-500/10 hover:border-indigo-400/40 border border-[var(--border-color)] transition-colors group text-xs"
          >
            <div className="flex items-center gap-2 text-[var(--text-muted)] group-hover:text-[var(--text-main)] font-medium">
              <Phone size={13} className="text-indigo-400" />
              <span>Direct Phone</span>
            </div>
            <span className="font-mono font-bold text-[var(--text-main)]">076 154 2903</span>
          </a>

          <a 
            href="mailto:grayfarao05@gmail.com"
            className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] hover:bg-indigo-500/10 hover:border-indigo-400/40 border border-[var(--border-color)] transition-colors group text-xs"
          >
            <div className="flex items-center gap-2 text-[var(--text-muted)] group-hover:text-[var(--text-main)] font-medium">
              <Mail size={13} className="text-indigo-400" />
              <span>Secure Email</span>
            </div>
            <span className="font-mono font-bold text-[var(--text-main)] truncate max-w-[150px]">grayfarao05@gmail.com</span>
          </a>
        </div>
      </motion.div>

      <XPBreakdownWidget 
        userXP={stats.xp} 
        breakdown={{
          modules: Math.floor(stats.xp * 0.4),
          tests: Math.floor(stats.xp * 0.3),
          tasks: Math.floor(stats.xp * 0.2),
          bosses: Math.floor(stats.xp * 0.1)
        }} 
      />

      <BossChallengeCard userStats={stats} activeCourse={activeCourse} />

      {/* Daily Goal Card */}
      <motion.div 
        whileHover={{ y: -3 }}
        className="saas-glass-card p-6 rounded-3xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-extrabold text-[var(--text-main)] tracking-tight">Daily Goal</h3>
          <span className="text-xs font-extrabold text-indigo-300">75%</span>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-lg border border-indigo-400/50 bg-indigo-500/20 flex items-center justify-center shrink-0">
              <div className="w-2 h-2 rounded-sm bg-indigo-400 shadow-[0_0_8px_#818cf8]" />
            </div>
            <span className="text-xs font-medium text-[var(--text-main)]">Complete 3 Objectives</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-lg border border-[var(--border-color)] flex items-center justify-center shrink-0" />
            <span className="text-xs font-medium text-[var(--text-muted)] line-through">Pass 1 Mock Exam</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-lg border border-indigo-400/50 bg-indigo-500/20 flex items-center justify-center shrink-0">
              <div className="w-2 h-2 rounded-sm bg-indigo-400 shadow-[0_0_8px_#818cf8]" />
            </div>
            <span className="text-xs font-medium text-[var(--text-main)]">Study for 1 Hour</span>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default Dashboard;
