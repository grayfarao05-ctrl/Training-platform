import React, { useEffect, useState } from 'react';
import { UserStats, TestResult, CourseId } from '../types';
import { TrendingUp, AlertTriangle, Zap, CheckCircle2, Award, ArrowLeft, History, Calendar, Target } from 'lucide-react';
import { db, collection, query, onSnapshot, handleFirestoreError, OperationType } from '../firebase';
import { RANKS } from '../constants';
import { getCourseConfig, getCourseProgress, filterByCourse } from '../courseConfig';
import { useTheme } from '../themeContext';

interface StudyEngagementChartProps {
  data: { day: string; hours: number }[];
  accentColor: string;
  isDark: boolean;
}

const StudyEngagementChart: React.FC<StudyEngagementChartProps> = ({ data, accentColor, isDark }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const rawMax = Math.max(...data.map(d => d.hours), 4);
  const roundedMax = Math.ceil(rawMax / 2) * 2;

  const width = 640;
  const height = 230;
  const padLeft = 40;
  const padRight = 24;
  const padTop = 20;
  const padBottom = 38;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const points = data.map((d, i) => {
    const x = padLeft + (i / Math.max(data.length - 1, 1)) * chartW;
    const y = padTop + chartH - (d.hours / roundedMax) * chartH;
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${padTop + chartH} L ${points[0].x} ${padTop + chartH} Z`
    : '';

  const yTicks = [0, roundedMax / 2, roundedMax];

  return (
    <div className="relative w-full h-full flex flex-col justify-center select-none">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto max-h-[260px] overflow-visible"
      >
        <defs>
          <linearGradient id="studyAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accentColor} stopOpacity={0.45} />
            <stop offset="95%" stopColor={accentColor} stopOpacity={0.02} />
          </linearGradient>
        </defs>

        {/* Horizontal gridlines */}
        {yTicks.map((tick, tIdx) => {
          const y = padTop + chartH - (tick / roundedMax) * chartH;
          return (
            <g key={`ytick-${tick}-${tIdx}`}>
              <line
                x1={padLeft}
                y1={y}
                x2={width - padRight}
                y2={y}
                stroke={isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}
                strokeDasharray="4 4"
              />
              <text
                x={padLeft - 10}
                y={y + 4}
                textAnchor="end"
                className="text-[11px] font-mono font-bold"
                fill={isDark ? 'rgba(255, 255, 255, 0.45)' : '#64748b'}
              >
                {tick}h
              </text>
            </g>
          );
        })}

        {/* Gradient fill area */}
        {areaD && <path d={areaD} fill="url(#studyAreaGrad)" />}

        {/* Line stroke */}
        {pathD && (
          <path
            d={pathD}
            fill="none"
            stroke={accentColor}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Interactive points */}
        {points.map((p, i) => {
          const isHovered = hoveredIdx === i;
          return (
            <g
              key={`chart-pt-${p.day}-${i}`}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {isHovered && (
                <line
                  x1={p.x}
                  y1={padTop}
                  x2={p.x}
                  y2={padTop + chartH}
                  stroke={accentColor}
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  opacity={0.7}
                />
              )}

              <circle
                cx={p.x}
                cy={p.y}
                r={isHovered ? 6 : 4}
                fill={isHovered ? '#ffffff' : accentColor}
                stroke={accentColor}
                strokeWidth={isHovered ? 3 : 2}
              />

              <text
                x={p.x}
                y={padTop + chartH + 20}
                textAnchor="middle"
                className="text-[11px] font-bold"
                fill={isHovered ? accentColor : (isDark ? 'rgba(255, 255, 255, 0.65)' : '#64748b')}
              >
                {p.day}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Floating tooltip */}
      {hoveredIdx !== null && points[hoveredIdx] && (
        <div
          className="absolute pointer-events-none -translate-x-1/2 -translate-y-full px-3 py-1.5 rounded-xl shadow-xl border text-xs font-black z-20 transition-all duration-75"
          style={{
            left: `${(points[hoveredIdx].x / width) * 100}%`,
            top: `${(points[hoveredIdx].y / height) * 100}%`,
            backgroundColor: isDark ? '#151c32' : '#ffffff',
            borderColor: isDark ? 'rgba(255,255,255,0.18)' : '#e2e8f0',
            color: isDark ? '#ffffff' : '#0f172a',
            marginTop: '-14px'
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-muted)] font-normal">{points[hoveredIdx].day}:</span>
            <span style={{ color: accentColor }} className="font-mono">{points[hoveredIdx].hours} hrs</span>
          </div>
        </div>
      )}
    </div>
  );
};

interface PerformanceProps {
  stats: UserStats;
  onBack: () => void;
  activeCourse?: CourseId;
}

const Performance: React.FC<PerformanceProps> = ({ stats, onBack, activeCourse = 'a-plus' }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [testHistory, setTestHistory] = useState<TestResult[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const courseConfig = getCourseConfig(activeCourse);
  const safeStats: UserStats = stats || ({} as UserStats);
  const courseProg = getCourseProgress(safeStats, activeCourse);
  const isNetworkPlus = activeCourse === 'network-plus';

  useEffect(() => {
    if (!safeStats?.uid) return;

    const resultsRef = collection(db, 'users', safeStats.uid, 'testResults');
    const q = query(resultsRef);
    
    const unsub = onSnapshot(q, (snap) => {
      const results = snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as TestResult));
      const filtered = filterByCourse(results, activeCourse);
      filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTestHistory(filtered);
    }, (err) => handleFirestoreError(err, OperationType.GET, `users/${safeStats.uid}/testResults`));

    const tasksRef = collection(db, 'users', safeStats.uid, 'todo');
    const qTasks = query(tasksRef);
    const unsubTasks = onSnapshot(qTasks, (snap) => {
      setTasks(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    }, (err) => handleFirestoreError(err, OperationType.GET, `users/${safeStats.uid}/todo`));

    return () => {
      unsub();
      unsubTasks();
    };
  }, [safeStats?.uid, activeCourse]);

  const activityHistory = safeStats?.activityHistory || [];
  const studyData = activityHistory.length > 0 
    ? activityHistory.slice(-7).map(day => ({ 
        day: day.date ? new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }) : 'Day', 
        hours: day.studyHours || 0 
      }))
    : [
        { day: 'Mon', hours: 0 },
        { day: 'Tue', hours: 0 },
        { day: 'Wed', hours: 0 },
        { day: 'Thu', hours: 0 },
        { day: 'Fri', hours: 0 },
        { day: 'Sat', hours: 0 },
        { day: 'Sun', hours: 0 },
      ];

  // Dynamic Domain Mastery Calculation based on active course
  const DOMAIN_PALETTE = ['#3b82f6', '#06b6d4', '#818cf8', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316', '#ef4444'];
  const activeCourseDomains = (courseConfig.domains || []).map((d, idx) => ({
    domainId: d.id,
    name: d.title || (d as any).name || 'Domain',
    fullName: d.title || (d as any).name || 'Domain',
    color: DOMAIN_PALETTE[idx % DOMAIN_PALETTE.length]
  }));

  const domainMastery = activeCourseDomains.map(d => {
    const domainTests = testHistory.filter(t => {
      const subj = (t.subject || '').toLowerCase();
      return subj.includes(d.name.toLowerCase()) || subj.includes(d.domainId.toLowerCase());
    });
    if (domainTests.length === 0) return { ...d, score: 0 };
    const avgScore = Math.round(domainTests.reduce((acc, t) => acc + t.score, 0) / domainTests.length);
    return { ...d, score: avgScore };
  });

  const weakAreasCount = domainMastery.filter(d => d.score > 0 && d.score < 70).length;

  const userXp = safeStats?.xp ?? 0;
  const currentRankIndex = RANKS.findIndex((r, idx) => 
    userXp >= r.minXp && (idx === RANKS.length - 1 || userXp < RANKS[idx + 1].minXp)
  );
  const currentRank = RANKS[currentRankIndex] || RANKS[0];
  const nextRank = RANKS[currentRankIndex + 1];

  const xpProgress = nextRank 
    ? Math.min(100, Math.round(((userXp - currentRank.minXp) / (nextRank.minXp - currentRank.minXp)) * 100))
    : 100;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const taskCompletionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="p-6 md:p-12 lg:p-16 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-300">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors group text-xs font-black uppercase tracking-wider"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        <span>Back to Dashboard</span>
      </button>

      <header className="saas-hero-card rounded-[2rem] p-8 md:p-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="portal-ray-core" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider px-3.5 py-1 rounded-full bg-indigo-500/15 text-indigo-200 border border-indigo-300/30">
              {courseConfig.name} ({courseConfig.badgeLabel})
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-2 tracking-tight leading-tight">
            Performance <span className="saas-gradient-word">Analytics</span>
          </h1>
          <p className="text-sm md:text-base text-slate-300/85 font-normal">
            Detailed insights into your {courseConfig.name} exam readiness and study trends.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-white px-6 md:px-8 py-4 rounded-2xl bg-indigo-500/15 border border-indigo-300/30 shadow-[0_0_24px_rgba(79,70,229,0.28),inset_0_1px_0_rgba(255,255,255,0.2)] w-fit backdrop-blur-md">
          <div className="text-right">
            <p className="text-[10px] uppercase font-bold tracking-widest text-indigo-200">Readiness Score</p>
            <p className="text-3xl font-extrabold font-mono">{courseProg.examReadiness}%</p>
          </div>
          <div className="saas-squircle-outer">
            <div className="saas-squircle-inner">
              <TrendingUp size={20} />
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Next Rank Progress */}
        <div className="lg:col-span-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 sm:p-8 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight text-[var(--text-main)]">Rank Progress</h3>
              <p className="text-xs text-[var(--text-muted)] font-bold">{currentRank.title} {nextRank && `→ ${nextRank.title}`}</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-2xl font-black text-cyan-400 font-mono">{stats.xp.toLocaleString()} XP</p>
              {nextRank && <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold">{nextRank.minXp.toLocaleString()} XP for next rank</p>}
            </div>
          </div>
          <div className="h-3 bg-[var(--bg-surface)] rounded-full overflow-hidden border border-[var(--border-color)]">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-1000 ease-out relative"
              style={{ width: `${xpProgress}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Study Time Chart */}
        <div className="lg:col-span-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 sm:p-8 shadow-md">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3 text-[var(--text-main)]">
              <Zap style={{ color: courseConfig.accentHex }} /> Study Engagement
            </h3>
            <div className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">Last 7 Days</div>
          </div>
          <div className="h-[280px] w-full flex items-center justify-center">
            <StudyEngagementChart data={studyData} accentColor={courseConfig.accentHex} isDark={isDark} />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="space-y-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 flex items-center gap-4 shadow-md">
            <div className="w-12 h-12 bg-blue-500/15 text-blue-400 rounded-2xl flex items-center justify-center shrink-0">
              <Target size={22} />
            </div>
            <div>
              <p className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-wider">Task Completion</p>
              <p className="text-2xl font-black text-[var(--text-main)] font-mono">{taskCompletionPercent}%</p>
              <p className="text-[10px] text-[var(--text-muted)] font-bold">{completedTasks} of {totalTasks} assigned tasks</p>
            </div>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 flex items-center gap-4 shadow-md">
            <div className="w-12 h-12 bg-amber-500/15 text-amber-400 rounded-2xl flex items-center justify-center shrink-0">
              <AlertTriangle size={22} />
            </div>
            <div>
              <p className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-wider">Focus Domains</p>
              <p className="text-2xl font-black text-[var(--text-main)] font-mono">{weakAreasCount} Domains</p>
              <p className="text-[10px] text-[var(--text-muted)] font-bold">Below 70% threshold</p>
            </div>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 shadow-md">
            <h4 className="font-black uppercase tracking-wider text-[10px] mb-4 text-rose-400">Critical Focus Required (&lt;70%)</h4>
            <div className="space-y-2">
              {domainMastery.filter(d => d.score > 0 && d.score < 70).length > 0 ? (
                domainMastery.filter(d => d.score > 0 && d.score < 70).map((domain) => (
                  <div key={domain.domainId} className="flex items-center justify-between text-xs font-black uppercase tracking-tight bg-[var(--bg-surface)] p-3 rounded-xl border border-[var(--border-color)]">
                    <span className="text-[var(--text-main)] truncate max-w-[170px]">{domain.name}</span>
                    <span className="text-rose-400 font-mono">{domain.score}%</span>
                  </div>
                ))
              ) : (
                <p className="text-[var(--text-muted)] text-xs italic font-medium py-2">
                  No critical weak areas identified. Great work!
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Test History with Mobile Scrolling Container */}
        <div className="lg:col-span-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 sm:p-8 shadow-md">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3 text-[var(--text-main)]">
              <History style={{ color: courseConfig.accentHex }} /> Recent Test History
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">
                  <th className="pb-3">Test Type</th>
                  <th className="pb-3">Subject</th>
                  <th className="pb-3">Score</th>
                  <th className="pb-3">XP Earned</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {testHistory.length > 0 ? (
                  testHistory.map((test) => (
                    <tr key={test.id} className="group hover:bg-[var(--bg-surface)] transition-colors">
                      <td className="py-3.5">
                        <div className="flex flex-col">
                          <span className="font-black uppercase text-xs text-[var(--text-main)]">{test.type}</span>
                          <span className="text-[10px] text-[var(--text-muted)] font-mono">
                            {new Date(test.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 text-xs font-bold text-[var(--text-muted)]">{test.subject || 'Mixed'}</td>
                      <td className="py-3.5 font-black text-sm text-[var(--text-main)] font-mono">{Math.round(test.score)}%</td>
                      <td className="py-3.5 font-black text-sm text-cyan-400 font-mono">+{test.xpEarned} XP</td>
                      <td className="py-3.5 text-xs font-mono text-[var(--text-muted)]">
                        {new Date(test.date).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 text-right">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          test.passed ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/15 text-red-400 border border-red-500/30'
                        }`}>
                          {test.passed ? 'PASS' : 'FAIL'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[var(--text-muted)] font-bold uppercase tracking-wider text-xs italic">
                      No test data available for this course yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Domain Mastery */}
        <div className="lg:col-span-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 sm:p-8 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3 text-[var(--text-main)]">
              <Award className="text-amber-400" /> Domain Mastery Breakdown
            </h3>
            <span className="text-xs font-bold text-[var(--text-muted)]">Target: 70%+ Exam Threshold</span>
          </div>
          <div className="space-y-4">
            {domainMastery.map((domain) => (
              <div key={domain.domainId} className="space-y-1.5 p-3.5 rounded-2xl bg-[var(--bg-surface)]/60 border border-[var(--border-color)]">
                <div className="flex items-center justify-between text-xs font-black uppercase tracking-tight">
                  <div className="flex items-center gap-2.5 truncate max-w-[75%]">
                    <span className="w-3 h-3 rounded-md shrink-0" style={{ backgroundColor: domain.color }} />
                    <span className="text-[var(--text-main)] truncate">{domain.name}</span>
                  </div>
                  <span className="font-mono font-black text-sm" style={{ color: domain.color }}>
                    {domain.score}%
                  </span>
                </div>
                <div className="h-3 bg-[var(--bg-card)] rounded-full overflow-hidden border border-[var(--border-color)]">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${Math.max(domain.score, domain.score > 0 ? 3 : 0)}%`,
                      backgroundColor: domain.color,
                      boxShadow: `0 0 10px ${domain.color}60`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Performance;
