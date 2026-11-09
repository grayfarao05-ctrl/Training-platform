import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Layers, 
  Megaphone, 
  Briefcase, 
  Newspaper, 
  Trophy, 
  ChevronRight, 
  ExternalLink as ExternalLinkIcon, 
  Pin, 
  Calendar, 
  MapPin, 
  Clock, 
  ArrowRight,
  Sparkles,
  Award,
  Compass,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  UserStats, 
  Announcement, 
  Vacancy, 
  NewsItem, 
  LeaderboardEntry, 
  CourseDoc, 
  Objective, 
  CourseId, 
  ViewState 
} from '../types';
import { getCourseConfig } from '../courseConfig';
import { getVacancyImage, getNewsImage } from '../themeAssets';

interface HomePageProps {
  userStats: UserStats;
  courseDocs: CourseDoc[];
  allObjectives: Objective[];
  onNavigate: (view: ViewState) => void;
  onResumeLearning: (courseId: CourseId, objective?: Objective | null) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  userStats,
  courseDocs,
  allObjectives,
  onNavigate,
  onResumeLearning
}) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [leaderboardTop, setLeaderboardTop] = useState<LeaderboardEntry[]>([]);
  const [loadingContent, setLoadingContent] = useState(true);

  const firstName = userStats.displayName ? userStats.displayName.trim().split(' ')[0] : 'Student';

  // 1. Subscribe to announcements
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'announcements'), (snap) => {
      const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement));
      setAnnouncements(items);
    }, (err) => console.error('Error fetching announcements:', err));

    return () => unsub();
  }, []);

  // 2. Subscribe to vacancies
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'vacancies'), (snap) => {
      const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vacancy));
      setVacancies(items);
    }, (err) => console.error('Error fetching vacancies:', err));

    return () => unsub();
  }, []);

  // 3. Subscribe to news_items
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'news_items'), (snap) => {
      const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as NewsItem));
      setNewsItems(items);
    }, (err) => console.error('Error fetching news_items:', err));

    return () => unsub();
  }, []);

  // 4. Subscribe to top 5 leaderboard
  useEffect(() => {
    const isUserAdmin = userStats.role === 'admin';
    const collName = isUserAdmin ? 'users' : 'leaderboard';
    const q = query(collection(db, collName), orderBy('xp', 'desc'), limit(5));

    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map(doc => {
        const d = doc.data();
        return {
          uid: doc.id,
          displayName: d.displayName || d.email?.split('@')[0] || 'Anonymous',
          photoURL: d.photoURL || null,
          xp: d.xp || 0,
          level: d.level || 0,
          rank: d.rank || 'Novice',
          rankTitle: d.rankTitle || d.rank || 'Novice',
          rankColor: d.rankColor || '#06b6d4',
          updatedAt: d.updatedAt || new Date().toISOString()
        } as LeaderboardEntry;
      });
      setLeaderboardTop(items);
      setLoadingContent(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'leaderboard');
      setLoadingContent(false);
    });

    return () => unsub();
  }, [userStats.role]);

  // Determine last opened course & objective from progress
  const resolveLastProgress = () => {
    const unlockedCourses: string[] = (userStats.unlockedCourses as string[]) || ['a-plus'];

    // 1. If explicit lastOpenedCourse & lastOpenedObjectiveId exist
    if (userStats.lastOpenedCourse && userStats.lastOpenedObjectiveId) {
      const targetObj = allObjectives.find(o => o.id === userStats.lastOpenedObjectiveId);
      return {
        courseId: userStats.lastOpenedCourse,
        objective: targetObj || null,
        objectiveTitle: targetObj?.title || userStats.lastOpenedObjectiveTitle || `Objective ${userStats.lastOpenedObjectiveId}`
      };
    }

    // 2. Check materialsRead
    if (userStats.materialsRead && userStats.materialsRead.length > 0) {
      const lastObjId = userStats.materialsRead[userStats.materialsRead.length - 1];
      const targetObj = allObjectives.find(o => o.id === lastObjId);
      const courseId = targetObj?.course || (unlockedCourses[0] as CourseId) || 'a-plus';
      return {
        courseId,
        objective: targetObj || null,
        objectiveTitle: targetObj?.title || `Objective ${lastObjId}`
      };
    }

    // 3. Check completedObjectives
    if (userStats.completedObjectives && userStats.completedObjectives.length > 0) {
      const lastObjId = userStats.completedObjectives[userStats.completedObjectives.length - 1];
      const targetObj = allObjectives.find(o => o.id === lastObjId);
      const courseId = targetObj?.course || (unlockedCourses[0] as CourseId) || 'a-plus';
      return {
        courseId,
        objective: targetObj || null,
        objectiveTitle: targetObj?.title || `Objective ${lastObjId}`
      };
    }

    // 4. Check courseProgress map
    if (userStats.courseProgress) {
      for (const [cId, prog] of Object.entries(userStats.courseProgress)) {
        if (prog?.completedObjectives && prog.completedObjectives.length > 0) {
          const lastObjId = prog.completedObjectives[prog.completedObjectives.length - 1];
          const targetObj = allObjectives.find(o => o.id === lastObjId);
          return {
            courseId: cId as CourseId,
            objective: targetObj || null,
            objectiveTitle: targetObj?.title || `Objective ${lastObjId}`
          };
        }
      }
    }

    return null;
  };

  const lastProgress = resolveLastProgress();
  const lastCourseConfig = lastProgress ? getCourseConfig(lastProgress.courseId) : null;

  // Filter announcements for this user
  const userUnlockedCourses = new Set<string>((userStats.unlockedCourses as string[]) || ['a-plus']);
  const filteredAnnouncements = announcements
    .filter(a => {
      if (a.expiresAt) {
        const exp = new Date(a.expiresAt).getTime();
        if (!isNaN(exp) && exp < Date.now()) return false;
      }
      if (userStats.role === 'admin') return true;
      if (a.audience === 'all') return true;
      return userUnlockedCourses.has(a.audience);
    })
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
      const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    })
    .slice(0, 5);

  const getTodayDateStr = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const todayStr = getTodayDateStr();

  const activeVacancies = vacancies
    .filter(v => {
      const st = (v.status || 'open').toLowerCase();
      if (st !== 'open') return false;
      if (!v.closingDate) return true;
      const closingDateOnly = v.closingDate.includes('T') ? v.closingDate.split('T')[0] : v.closingDate.trim();
      return closingDateOnly >= todayStr;
    })
    .sort((a, b) => {
      const dateA = a.closingDate ? (a.closingDate.includes('T') ? a.closingDate.split('T')[0] : a.closingDate.trim()) : '9999-12-31';
      const dateB = b.closingDate ? (b.closingDate.includes('T') ? b.closingDate.split('T')[0] : b.closingDate.trim()) : '9999-12-31';
      return dateA.localeCompare(dateB);
    });

  const getDaysRemainingText = (closingDateStr: string) => {
    if (!closingDateStr) return '';
    const dateOnly = closingDateStr.includes('T') ? closingDateStr.split('T')[0] : closingDateStr.trim();
    if (dateOnly === todayStr) return 'Closes today';

    const [cy, cm, cd] = dateOnly.split('-').map(Number);
    const [ty, tm, td] = todayStr.split('-').map(Number);
    if (!cy || !cm || !cd || !ty || !tm || !td) return '';

    const closingUtc = Date.UTC(cy, cm - 1, cd);
    const todayUtc = Date.UTC(ty, tm - 1, td);
    const diffDays = Math.round((closingUtc - todayUtc) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return 'Closes today';
    if (diffDays === 1) return 'Closes tomorrow';
    return `Closes in ${diffDays} days`;
  };

  const getVacancyTypeBadge = (type: string) => {
    switch (type) {
      case 'learnership':
        return { label: 'Learnership', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
      case 'internship':
        return { label: 'Internship', color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' };
      case 'junior-role':
        return { label: 'Junior Role', color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30' };
      case 'contract':
        return { label: 'Contract', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
      default:
        return { label: 'Opportunity', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' };
    }
  };

  const sortedNewsItems = [...newsItems]
    .sort((a, b) => {
      const timeA = new Date(a.publishedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.publishedAt || b.createdAt || 0).getTime();
      return timeB - timeA;
    })
    .slice(0, 6);

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* 1. Header Hero with Dark SaaS Volumetric Rays & Glass */}
      <div className="saas-hero-card rounded-[2rem] p-6 sm:p-10">
        <div className="portal-ray-core" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-violet-600/15 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-300/30 text-indigo-200 text-[10px] font-bold uppercase tracking-widest mb-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
              <Compass size={12} className="text-indigo-300" />
              <span>Student Command Center • Western Cape</span>
            </div>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
              Welcome back, <span className="saas-gradient-word">{firstName}</span>
            </h1>
            <p className="text-slate-300/85 text-xs sm:text-sm mt-2 font-medium max-w-2xl leading-relaxed">
              Stay up to date with cohort announcements, Western Cape tech vacancies, industry news, and competitive student rankings.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('my-courses')}
              className="btn-soft text-xs uppercase tracking-wider px-5 h-[44px]"
            >
              <BookOpen size={14} className="text-indigo-300" />
              <span>All Courses</span>
            </button>
            <button
              onClick={() => onNavigate('leaderboard')}
              className="btn-primary text-xs uppercase tracking-wider px-5 h-[44px]"
            >
              <Trophy size={14} />
              <span>Rankings</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Resume Learning Card */}
      <div className="saas-glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />

        {lastProgress && lastCourseConfig ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
            <div className="space-y-3 min-w-0">
              <div className="flex items-center gap-2.5">
                <span 
                  className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm backdrop-blur-sm"
                  style={{
                    backgroundColor: 'rgba(79, 70, 229, 0.18)',
                    color: '#C7D2FE',
                    borderColor: 'rgba(165, 180, 252, 0.35)'
                  }}
                >
                  {lastCourseConfig.name}
                </span>
                <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest flex items-center gap-1">
                  <Sparkles size={12} className="text-indigo-400" />
                  <span>Next Step Ready</span>
                </span>
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-[var(--text-main)] tracking-tight truncate">
                  {lastProgress.objectiveTitle}
                </h3>
                {lastProgress.objective && (
                  <p className="text-xs text-[var(--text-muted)] font-medium mt-1">
                    Domain: <span className="text-indigo-200 font-semibold">{lastProgress.objective.domain}</span>
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onResumeLearning(lastProgress.courseId, lastProgress.objective)}
              className="btn-primary px-6 h-[48px] text-xs uppercase tracking-wider shrink-0"
            >
              <span>Resume Learning</span>
              <ChevronRight size={16} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">
                Start Your First Milestone
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold text-[var(--text-main)] tracking-tight">
                Explore Available <span className="saas-gradient-word">Courses</span>
              </h3>
              <p className="text-[var(--text-muted)] text-xs sm:text-sm max-w-xl font-medium leading-relaxed">
                Choose CompTIA A+ Core 1 & Core 2, CompTIA Network+, or our free Matric to Money bootcamp to begin.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('my-courses')}
              className="btn-primary px-6 h-[48px] text-xs uppercase tracking-wider shrink-0"
            >
              <span>Explore My Courses</span>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* 3. Main Grid: Announcements + Vacancies + News (Left 2 cols) & Leaderboard (Right 1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Announcements Widget */}
          <div className="saas-glass-card rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
              <div className="flex items-center gap-3.5">
                <div className="saas-squircle-outer">
                  <div className="saas-squircle-inner">
                    <Megaphone size={17} />
                  </div>
                </div>
                <div>
                  <h2 className="text-base font-extrabold tracking-tight text-[var(--text-main)]">
                    Cohort Announcements
                  </h2>
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                    Updates & Academy Bulletins
                  </span>
                </div>
              </div>
            </div>

            {filteredAnnouncements.length === 0 ? (
              <div className="py-12 text-center text-[var(--text-muted)] space-y-2 bg-white/[0.02] rounded-2xl border border-[var(--border-color)]">
                <Megaphone size={26} className="mx-auto opacity-40 text-indigo-400" />
                <p className="text-xs font-bold uppercase tracking-wider">Nothing posted yet</p>
                <p className="text-[11px] text-[var(--text-muted)]">Check back soon for notifications from your instructors.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAnnouncements.map((item) => (
                  <div 
                    key={item.id}
                    className="p-5 rounded-2xl bg-white/[0.03] border border-[var(--border-color)] hover:border-indigo-400/40 space-y-2.5 transition-all"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {item.pinned && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            <Pin size={10} /> Pinned
                          </span>
                        )}
                        {item.audience !== 'all' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-indigo-500/15 text-indigo-300 border border-indigo-400/30">
                            {item.audience.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)] font-bold">
                        {item.createdAt?.toDate 
                          ? item.createdAt.toDate().toLocaleDateString('en-ZA')
                          : item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-ZA') : ''}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-[var(--text-main)] tracking-tight">
                      {item.title}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] font-medium leading-relaxed whitespace-pre-line">
                      {item.body}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Career Vacancies Widget */}
          <div className="saas-glass-card rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
              <div className="flex items-center gap-3.5">
                <div className="saas-squircle-outer">
                  <div className="saas-squircle-inner">
                    <Briefcase size={17} />
                  </div>
                </div>
                <div>
                  <h2 className="text-base font-extrabold tracking-tight text-[var(--text-main)]">
                    Western Cape Tech Vacancies
                  </h2>
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                    Learnerships, Internships & Junior Roles (ZAR / R)
                  </span>
                </div>
              </div>
            </div>

            {activeVacancies.length === 0 ? (
              <div className="py-12 text-center text-[var(--text-muted)] space-y-2 bg-white/[0.02] rounded-2xl border border-[var(--border-color)]">
                <Briefcase size={26} className="mx-auto opacity-40 text-indigo-400" />
                <p className="text-xs font-bold uppercase tracking-wider">Nothing posted yet</p>
                <p className="text-[11px] text-[var(--text-muted)]">Verified employer listings and learnerships will appear here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeVacancies.map((vac) => {
                  const typeBadge = getVacancyTypeBadge(vac.type);
                  const closingText = getDaysRemainingText(vac.closingDate);
                  const imgUrl = getVacancyImage(vac.type);
                  return (
                    <div 
                      key={vac.id}
                      className="group overflow-hidden rounded-2xl bg-white/[0.03] border border-[var(--border-color)] hover:border-indigo-400/45 transition-all duration-300 flex flex-col justify-between shadow-md"
                    >
                      {/* Image Banner */}
                      <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                        <img 
                          src={imgUrl} 
                          alt={vac.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0d19] via-transparent to-black/40" />
                        
                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider backdrop-blur-md shadow border ${typeBadge.color}`}>
                            {typeBadge.label}
                          </span>
                          {closingText && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-black/80 backdrop-blur-md text-amber-300 border border-amber-500/40 shadow">
                              <Clock size={10} /> {closingText}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                        <div className="space-y-1.5">
                          <h3 className="text-sm font-bold text-[var(--text-main)] tracking-tight group-hover:text-indigo-300 transition-colors line-clamp-1">
                            {vac.title}
                          </h3>
                          <p className="text-xs font-bold text-indigo-300">
                            {vac.company}
                          </p>

                          <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-medium">
                            <MapPin size={12} className="shrink-0 text-slate-400" />
                            <span className="truncate">{vac.location}</span>
                          </div>

                          {vac.applyInfo && (
                            <p className="text-xs text-[var(--text-muted)] font-medium leading-relaxed whitespace-pre-line border-t border-[var(--border-color)] pt-2 line-clamp-2">
                              {vac.applyInfo}
                            </p>
                          )}
                        </div>

                        {vac.applyUrl && (
                          <div className="pt-3 border-t border-[var(--border-color)]">
                            <a 
                              href={vac.applyUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-300 hover:text-white transition-colors cursor-pointer"
                            >
                              <span>Apply Now</span>
                              <ExternalLinkIcon size={12} />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Industry News Widget */}
          <div className="saas-glass-card rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
              <div className="flex items-center gap-3.5">
                <div className="saas-squircle-outer">
                  <div className="saas-squircle-inner">
                    <Newspaper size={17} />
                  </div>
                </div>
                <div>
                  <h2 className="text-base font-extrabold tracking-tight text-[var(--text-main)]">
                    Industry News & Tech Briefings
                  </h2>
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                    South African & Global IT Updates
                  </span>
                </div>
              </div>
            </div>

            {sortedNewsItems.length === 0 ? (
              <div className="py-12 text-center text-[var(--text-muted)] space-y-2 bg-white/[0.02] rounded-2xl border border-[var(--border-color)]">
                <Newspaper size={26} className="mx-auto opacity-40 text-indigo-400" />
                <p className="text-xs font-bold uppercase tracking-wider">Nothing posted yet</p>
                <p className="text-[11px] text-[var(--text-muted)]">Industry articles and certifications briefings will appear here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sortedNewsItems.map((news, idx) => {
                  const imgUrl = getNewsImage(idx);
                  return (
                    <div 
                      key={news.id}
                      className="group overflow-hidden rounded-2xl bg-white/[0.03] border border-[var(--border-color)] hover:border-indigo-400/45 transition-all duration-300 flex flex-col justify-between shadow-md"
                    >
                      <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                        <img 
                          src={imgUrl} 
                          alt={news.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0d19] via-transparent to-black/40" />
                        
                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
                          <span className="px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-indigo-500/25 text-indigo-200 border border-indigo-400/40 backdrop-blur-md shadow">
                            {news.sourceName || 'Tech Briefing'}
                          </span>
                          {news.publishedAt && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-black/80 backdrop-blur-md text-[var(--text-muted)] border border-white/10 shadow">
                              {new Date(news.publishedAt).toLocaleDateString('en-ZA')}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                        <div className="space-y-1.5">
                          <h3 className="text-sm font-bold text-[var(--text-main)] leading-snug group-hover:text-indigo-300 transition-colors line-clamp-2">
                            {news.title}
                          </h3>
                          {news.note && (
                            <p className="text-xs text-[var(--text-muted)] font-medium leading-relaxed whitespace-pre-line line-clamp-2">
                              {news.note}
                            </p>
                          )}
                        </div>

                        <div className="pt-3 border-t border-[var(--border-color)]">
                          <a 
                            href={news.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-300 hover:text-white transition-colors cursor-pointer"
                          >
                            <span>Read Article</span>
                            <ExternalLinkIcon size={12} />
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Leaderboard Top 5 */}
        <div className="space-y-8">
          <div className="saas-glass-card rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
              <div className="flex items-center gap-3.5">
                <div className="saas-squircle-outer">
                  <div className="saas-squircle-inner">
                    <Trophy size={17} />
                  </div>
                </div>
                <div>
                  <h2 className="text-base font-extrabold tracking-tight text-[var(--text-main)]">
                    Top 5 Students
                  </h2>
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                    Global Academy Standings
                  </span>
                </div>
              </div>
            </div>

            {leaderboardTop.length === 0 ? (
              <div className="py-12 text-center text-[var(--text-muted)] space-y-2 bg-white/[0.02] rounded-2xl border border-[var(--border-color)]">
                <Trophy size={26} className="mx-auto opacity-40 text-indigo-400" />
                <p className="text-xs font-bold uppercase tracking-wider">Nothing posted yet</p>
                <p className="text-[11px] text-[var(--text-muted)]">Complete lessons to earn XP and claim the top ranking.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {leaderboardTop.map((entry, index) => {
                  const rankNum = index + 1;
                  const rankBadgeColor = 
                    rankNum === 1 ? 'bg-amber-400 text-black shadow-amber-400/30' :
                    rankNum === 2 ? 'bg-slate-300 text-black shadow-slate-300/30' :
                    rankNum === 3 ? 'bg-amber-700 text-white shadow-amber-700/30' :
                    'bg-white/[0.05] text-[var(--text-muted)] border border-[var(--border-color)]';

                  return (
                    <div 
                      key={entry.uid}
                      className="p-3.5 rounded-2xl bg-white/[0.03] border border-[var(--border-color)] hover:border-indigo-400/40 flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 shadow-sm ${rankBadgeColor}`}>
                          {rankNum}
                        </div>
                        {entry.photoURL ? (
                          <img 
                            src={entry.photoURL} 
                            alt={entry.displayName} 
                            className="w-9 h-9 rounded-xl object-cover shrink-0 border border-[var(--border-color)]"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-b from-indigo-500 to-indigo-700 border border-indigo-300/30 flex items-center justify-center font-bold text-xs text-white shrink-0">
                            {entry.displayName.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[var(--text-main)] truncate tracking-tight">
                            {entry.displayName}
                          </p>
                          <span 
                            className="text-[10px] font-semibold truncate block"
                            style={{ color: entry.rankColor || 'var(--text-muted)' }}
                          >
                            {entry.rankTitle || entry.rank}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-extrabold text-indigo-300 block">
                          {entry.xp.toLocaleString()} XP
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)] font-semibold">
                          Lvl {entry.level || 1}
                        </span>
                      </div>
                    </div>
                  );
                })}

                <div className="pt-3 border-t border-[var(--border-color)]">
                  <button
                    type="button"
                    onClick={() => onNavigate('leaderboard')}
                    className="w-full btn-soft h-[42px] text-xs uppercase tracking-wider"
                  >
                    <span>Full Leaderboard</span>
                    <ArrowRight size={13} className="text-indigo-300" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
