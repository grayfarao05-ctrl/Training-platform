import React from 'react';
import { 
  Lock, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  BookOpen, 
  GraduationCap, 
  ChevronRight,
  ShieldCheck,
  Zap,
  Layers
} from 'lucide-react';
import { CourseId, UserStats, ViewState, CourseConfig, CourseDoc } from '../types';
import { COURSE_LIST, getCourseProgress, isCourseUnlocked } from '../courseConfig';
import { motion } from 'motion/react';
import { getCourseImage } from '../themeAssets';
import { Stagger, NetworkBackdrop } from '../animations';

interface MyCoursesViewProps {
  userStats: UserStats;
  activeCourse: CourseId;
  courses?: CourseConfig[];
  courseDocs?: CourseDoc[];
  onSelectCourse: (courseId: CourseId) => void;
  onOpenUnlockScreen: (courseId: CourseId) => void;
  onNavigateToDashboard: () => void;
}

export const MyCoursesView: React.FC<MyCoursesViewProps> = ({
  userStats,
  activeCourse,
  courses,
  courseDocs = [],
  onSelectCourse,
  onOpenUnlockScreen,
  onNavigateToDashboard
}) => {
  const isAdmin = userStats?.role === 'admin' || (userStats as any)?.isAdmin;
  const courseList = courses && courses.length > 0 ? courses : COURSE_LIST;

  const handleCourseAction = (courseId: CourseId, unlocked: boolean) => {
    if (unlocked) {
      onSelectCourse(courseId);
      onNavigateToDashboard();
    } else {
      onOpenUnlockScreen(courseId);
    }
  };

  return (
    <div className="p-6 md:p-12 lg:p-16 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="saas-hero-card rounded-[2rem] p-8 md:p-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="portal-ray-core" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/15 text-indigo-200 border border-indigo-300/30 text-xs font-bold uppercase tracking-wider mb-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
            <Layers size={13} className="text-indigo-300" />
            <span>Certification Hub</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white">
            <span>My </span>
            <span className="saas-gradient-word">Courses</span>
          </h1>
          <p className="text-slate-300/85 text-sm md:text-base mt-2 max-w-2xl font-normal leading-relaxed">
            Browse and switch between your enrolled IT certification pathways. Each course features isolated objectives, drills, simulations, and exam metrics.
          </p>
        </div>

        {isAdmin && (
          <div className="relative z-10 flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/15 border border-rose-500/35 text-rose-300 text-xs font-bold uppercase tracking-wider shrink-0">
            <ShieldCheck size={16} />
            <span>Admin All-Access Enabled</span>
          </div>
        )}
      </div>

      {/* Courses Grid */}
      <Stagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
        {courseList.map((course) => {
          const courseDoc = courseDocs.find(d => d.id === course.id);
          const isDraft = courseDoc?.status === 'draft';
          const isArchived = courseDoc?.status === 'archived';
          const requiresCode = courseDoc ? courseDoc.requiresCode : (course.id === 'network-plus');
          const isUnlocked = isAdmin || course.id === 'a-plus' || !requiresCode || isCourseUnlocked(userStats, course.id, requiresCode);
          const progress = getCourseProgress(userStats, course.id);
          const isCurrentActive = activeCourse === course.id;
          const hasStarted = (progress.examReadiness || 0) > 0 || (progress.completedObjectives || []).length > 0;
          const actionLabel = isUnlocked ? (hasStarted ? 'Resume' : 'Open') : 'Unlock';

          return (
            <div
              key={course.id}
              className={`saas-glass-card rounded-[2rem] overflow-hidden flex flex-col justify-between relative group ${
                isCurrentActive
                  ? '!border-indigo-400/55 shadow-[0_24px_60px_-12px_rgba(79,70,229,0.32)]'
                  : ''
              }`}
            >
              {/* 16:9 Photographic Course Banner */}
              <div className="relative aspect-[21/9] sm:aspect-video w-full overflow-hidden bg-slate-950">
                <img 
                  src={getCourseImage(course.id)} 
                  alt={course.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b0d19] via-transparent to-black/60" />

                {/* Soft Hero Tint Glow on hover */}
                <div 
                  className="absolute inset-0 opacity-20 pointer-events-none transition-opacity group-hover:opacity-35"
                  style={{ backgroundColor: `${course.accentHex}40`, mixBlendMode: 'color' }}
                />

                {/* Floating Dual Badges on Banner */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2 pointer-events-none">
                  <div className="flex items-center gap-2">
                    <span 
                      className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md border shadow-md"
                      style={{
                        backgroundColor: 'rgba(79, 70, 229, 0.32)',
                        color: '#ffffff',
                        borderColor: 'rgba(165, 180, 252, 0.5)'
                      }}
                    >
                      {course.badgeLabel || course.shortLabel || course.name}
                    </span>
                    {isDraft && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 backdrop-blur-md">
                        Draft
                      </span>
                    )}
                    {isArchived && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-500/20 text-slate-300 border border-slate-500/40 backdrop-blur-md">
                        Archived
                      </span>
                    )}
                  </div>

                  {isCurrentActive ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-indigo-200 bg-indigo-950/75 backdrop-blur-md border border-indigo-400/45 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse shadow-[0_0_8px_#818cf8]" />
                      Active Course
                    </span>
                  ) : !isUnlocked ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-amber-300 bg-black/60 backdrop-blur-md border border-amber-500/40 shadow-sm">
                      <Lock size={11} />
                      Locked
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-main)] mb-2 group-hover:text-indigo-300 transition-colors">
                    {course.name}
                  </h2>
                  <p className="text-[var(--text-muted)] text-sm sm:text-base leading-relaxed mb-6 font-normal">
                    {course.description || course.tagline}
                  </p>

                  {/* Progress Indicators */}
                  <div className="bg-white/[0.03] p-4 rounded-2xl border border-[var(--border-color)] space-y-3 mb-6">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                      <span className="text-[var(--text-muted)]">Exam Readiness</span>
                      <span className="text-[var(--text-main)] font-mono">{isUnlocked ? `${progress.examReadiness || 0}%` : '--'}</span>
                    </div>
                    <div className="h-2 w-full bg-black/50 rounded-full overflow-hidden border border-[var(--border-color)]">
                      <div 
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{ 
                          width: isUnlocked ? `${Math.min(100, progress.examReadiness || 0)}%` : '0%',
                          background: 'linear-gradient(90deg, #4F46E5, #818CF8)'
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] font-semibold">
                      <span>{course.domains.length} Core Domains</span>
                      <span>{progress.completedObjectives?.length || 0} Objectives Done</span>
                    </div>
                  </div>
                </div>

                {/* Action Button Footer */}
                <div className="pt-4 border-t border-[var(--border-color)] flex items-center justify-between gap-4">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {isUnlocked ? (isCurrentActive ? 'Currently Loaded' : 'Available') : 'Access Code Required'}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleCourseAction(course.id, isUnlocked)}
                    className={
                      isUnlocked
                        ? isCurrentActive
                          ? 'btn-primary px-6 h-[42px] text-xs uppercase tracking-wider'
                          : 'btn-soft px-6 h-[42px] text-xs uppercase tracking-wider'
                        : 'px-6 h-[42px] rounded-full font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center gap-2 cursor-pointer bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-[0_0_20px_rgba(251,191,36,0.35)]'
                    }
                  >
                    {!isUnlocked ? (
                      <>
                        <Lock size={14} />
                        <span>Unlock</span>
                      </>
                    ) : (
                      <>
                        <span>{actionLabel}</span>
                        <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Final Dashed "More Courses Coming Soon" Card */}
        <div className="saas-glass-card rounded-[2rem] !border-dashed p-8 flex flex-col justify-between items-center text-center min-h-[340px]">
          <div className="my-auto space-y-4 max-w-sm">
            <div className="saas-squircle-outer mx-auto">
              <div className="saas-squircle-inner">
                <Sparkles size={20} />
              </div>
            </div>
            <h3 className="text-2xl font-extrabold tracking-tight text-[var(--text-main)]">
              More Courses <span className="saas-gradient-word">Coming Soon</span>
            </h3>
            <p className="text-[var(--text-muted)] text-sm leading-relaxed font-normal">
              We are expanding the ITreal catalog with CompTIA Security+, Linux+, Cloud+, CySA+, and Cisco CCNA certifications.
            </p>
          </div>
          <div className="pt-6 w-full border-t border-[var(--border-color)]/50">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-300/70">
              Modular Curriculum System Active
            </span>
          </div>
        </div>
      </Stagger>
    </div>
  );
};

export default MyCoursesView;
