import React from 'react';
import { Play, BookOpen, ChevronRight, Award, Sparkles, CheckCircle2 } from 'lucide-react';
import { Objective, CourseId, UserStats, ViewState, Domain } from '../types';
import { getCourseConfig, getCourseProgress } from '../courseConfig';
import { getCourseImage } from '../themeAssets';
import { motion } from 'motion/react';
import { CircuitBackdrop, NetworkBackdrop, CountUp, FillBar } from '../animations';

interface HeroSectionProps {
  onLearnMore: (obj: Objective) => void;
  activeCourse?: CourseId;
  userStats?: UserStats | null;
  onViewChange?: (view: ViewState) => void;
  domains?: Domain[];
}

const HeroSection: React.FC<HeroSectionProps> = ({ 
  onLearnMore, 
  activeCourse = 'a-plus', 
  userStats, 
  onViewChange,
  domains = []
}) => {
  const courseConfig = getCourseConfig(activeCourse);
  const progress = getCourseProgress(userStats, activeCourse);
  const examReadiness = progress.examReadiness || 0;
  const completedIds = progress.completedObjectives || [];

  // Count total objectives across merged domains
  const allObjectives = domains.flatMap(d => d.objectives || []);
  const totalObjectives = allObjectives.length;
  const hasProgress = completedIds.length > 0 || examReadiness > 0;

  // Determine the next objective to resume or start
  const nextObjective = allObjectives.find(o => !completedIds.includes(o.id)) || allObjectives[0] || {
    id: '1.1',
    title: `${courseConfig.shortLabel} Fundamentals`,
    domain: courseConfig.domains[0]?.name || 'Core Domain',
    exam: courseConfig.shortLabel,
    description: courseConfig.description,
    course: activeCourse
  };

  const handlePrimaryAction = () => {
    if (nextObjective) {
      onLearnMore(nextObjective);
    } else if (onViewChange) {
      onViewChange('objectives');
    }
  };

  const handleBrowseContent = () => {
    if (onViewChange) {
      onViewChange('objectives');
    }
  };

  return (
    <div className="px-6 md:px-12 lg:px-24 pt-8 pb-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="saas-hero-card rounded-[28px] md:rounded-[34px] text-white p-8 md:p-12 lg:p-14 transition-all"
      >
        {/* Volumetric Top-Left Ray & Course Accent Nebula */}
        <div className="portal-ray-core" />
        <div 
          aria-hidden="true"
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-[110px] pointer-events-none opacity-30 bg-indigo-500"
        />
        <div 
          aria-hidden="true"
          className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full blur-[100px] pointer-events-none opacity-20"
          style={{ backgroundColor: courseConfig.accentHex || '#6366F1' }}
        />

        {/* Content Layout */}
        <div className="relative z-10 max-w-3xl space-y-6">
          {/* Track Chip */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/15 border border-indigo-300/30 text-indigo-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] backdrop-blur-md">
              {courseConfig.badgeLabel} Track
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-white bg-gradient-to-r from-indigo-600 to-violet-600 border border-indigo-300/40 shadow-[0_0_16px_rgba(79,70,229,0.5)]">
              <Sparkles size={12} className="text-indigo-200" />
              Active Pathway
            </span>
          </div>

          {/* Heading & Tagline */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.06] text-white">
              <span className="saas-gradient-word">{courseConfig.name}</span>
            </h1>
            <p className="text-slate-300/90 text-sm sm:text-base md:text-lg max-w-2xl font-normal leading-relaxed">
              {courseConfig.description || courseConfig.tagline}
            </p>
          </div>

          {/* Progress Strip */}
          <div className="max-w-xl bg-white/[0.04] backdrop-blur-xl p-4 sm:p-5 rounded-2xl border border-indigo-300/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] space-y-3">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
              <span className="text-indigo-200 flex items-center gap-2">
                <Award size={15} className="text-indigo-400" /> Exam Readiness
              </span>
              <span className="text-white font-mono text-sm font-bold">
                <CountUp value={examReadiness} suffix="%" />
              </span>
            </div>
            
            <FillBar value={examReadiness} color="#818CF8" />

            <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
              <span>
                {completedIds.length} of {totalObjectives > 0 ? totalObjectives : 'all'} objectives completed
              </span>
              <span className="text-indigo-300 font-bold">
                {hasProgress ? `Next: ${nextObjective.id} ${nextObjective.title}` : 'Ready to start'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={handlePrimaryAction}
              className="btn-primary px-8 h-[48px] text-xs uppercase tracking-wider"
            >
              <Play size={16} fill="currentColor" />
              <span>{hasProgress ? 'Continue Learning' : 'Start Your First Lesson'}</span>
            </button>

            <button
              onClick={handleBrowseContent}
              className="btn-soft px-6 h-[48px] text-xs uppercase tracking-wider"
            >
              <BookOpen size={16} className="text-indigo-300" />
              <span>Browse Objectives</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default HeroSection;
