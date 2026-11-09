import React, { useState, useCallback } from 'react';
import { Objective, UserStats, CourseId, LessonData, LessonSection } from '../../types';
import { TextLesson } from './TextLesson';
import { InteractiveDiagram } from './InteractiveDiagram';
import { ThreeDViewer } from './ThreeDViewer';
import { AnimatedLesson } from './AnimatedLesson';
import { VirtualLab } from './VirtualLab';
import { TerminalSandbox } from './TerminalSandbox';
import { InteractiveMatcher } from './InteractiveMatcher';
import { ZarFinanceSimulator } from './ZarFinanceSimulator';
import { PromptLabSimulator } from './PromptLabSimulator';
import { ScenarioExercise } from './ScenarioExercise';
import { KnowledgeCheck } from './KnowledgeCheck';
import { getInteractiveLesson } from './sampleLessons';
import { db, doc, updateDoc, arrayUnion, increment } from '../../firebase';

const PDFReader = React.lazy(() => import('../PDFReader'));
import { 
  ArrowLeft, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Award,
  Layers,
  BookOpen,
  Box,
  Activity,
  Wrench,
  Stethoscope,
  HelpCircle,
  Loader2,
  Terminal,
  Cable,
  Wallet,
  Bot,
  Lock
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface LessonRendererProps {
  objective: Objective;
  userStats: UserStats;
  onBack: () => void;
  activeCourse?: CourseId;
}

const GATED_SECTION_TYPES = new Set<LessonSection['type']>([
  'lab',
  'terminal',
  'matcher',
  'finance-sim',
  'prompt-lab',
  'scenario',
  'quiz'
]);

export const LessonRenderer: React.FC<LessonRendererProps> = ({
  objective,
  userStats,
  onBack,
  activeCourse = 'a-plus'
}) => {
  // Check if this objective has an interactive lesson defined either on the objective in Firestore or in the registry
  const interactiveData: LessonData | null = 
    objective.interactiveLesson || 
    getInteractiveLesson(activeCourse, objective.id, objective.domain);

  const [activeSectionIdx, setActiveSectionIdx] = useState<number>(0);
  const [completedSectionIds, setCompletedSectionIds] = useState<string[]>([]);
  const [xpEarnedInSession, setXpEarnedInSession] = useState<number>(0);

  const isCompleted = userStats.completedObjectives?.includes(objective.id) || false;

  const markSectionCompleted = useCallback((sectionId: string) => {
    setCompletedSectionIds(prev => (prev.includes(sectionId) ? prev : [...prev, sectionId]));
  }, []);

  // When an Interactive Module exists, it completely replaces the static PDF view.
  // Only fall back to PDFReader when no interactive module exists for this objective.
  if (!interactiveData) {
    return (
      <div className="relative">
        <React.Suspense fallback={
          <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-cyan-400 gap-3">
            <Loader2 className="animate-spin" size={32} />
            <p className="text-xs font-black uppercase tracking-wider text-slate-400">Loading document viewer...</p>
          </div>
        }>
          <PDFReader
            objective={objective}
            userStats={userStats}
            onBack={onBack}
            activeCourse={activeCourse}
          />
        </React.Suspense>
      </div>
    );
  }

  const { sections, title, domainName, badgeLabel } = interactiveData;
  const currentSection: LessonSection = sections[activeSectionIdx] || sections[0];

  const isCurrentSectionGated = GATED_SECTION_TYPES.has(currentSection.type);
  const isCurrentGateUnlocked =
    !isCurrentSectionGated ||
    completedSectionIds.includes(currentSection.id) ||
    isCompleted;

  const handleRewardXP = async (amount: number) => {
    setXpEarnedInSession(prev => prev + amount);
    if (!userStats.uid) return;

    try {
      const userRef = doc(db, 'users', userStats.uid);
      await updateDoc(userRef, {
        xp: increment(amount),
        lastStudyDate: new Date().toISOString()
      });
    } catch (err) {
      console.warn("Could not award lesson XP:", err);
    }
  };

  const handleLessonCompleted = async (finalXp: number) => {
    markSectionCompleted(currentSection.id);
    handleRewardXP(finalXp);

    if (!userStats.uid) return;

    try {
      const userRef = doc(db, 'users', userStats.uid);
      await updateDoc(userRef, {
        completedObjectives: arrayUnion(objective.id),
        [`courseProgress.${activeCourse}.completedObjectives`]: arrayUnion(objective.id)
      });
      try {
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
      } catch {
        // ignore
      }
    } catch (err) {
      console.warn("Could not mark objective completed in database:", err);
    }
  };

  const handleNextSection = () => {
    if (!isCurrentGateUnlocked) return;
    markSectionCompleted(currentSection.id);
    if (activeSectionIdx < sections.length - 1) {
      setActiveSectionIdx(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevSection = () => {
    if (activeSectionIdx > 0) {
      setActiveSectionIdx(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const canJumpToStage = (targetIdx: number): boolean => {
    if (targetIdx <= activeSectionIdx || isCompleted) return true;
    // Check if all gated stages prior to targetIdx have been completed
    for (let i = 0; i < targetIdx; i++) {
      const sec = sections[i];
      if (GATED_SECTION_TYPES.has(sec.type) && !completedSectionIds.includes(sec.id)) {
        return false;
      }
    }
    return true;
  };

  const getSectionIcon = (type: LessonSection['type']) => {
    switch (type) {
      case 'text': return <BookOpen size={14} />;
      case 'diagram': return <Layers size={14} />;
      case '3d-model': return <Box size={14} />;
      case 'animation': return <Activity size={14} />;
      case 'lab': return <Wrench size={14} />;
      case 'terminal': return <Terminal size={14} />;
      case 'matcher': return <Cable size={14} />;
      case 'finance-sim': return <Wallet size={14} />;
      case 'prompt-lab': return <Bot size={14} />;
      case 'scenario': return <Stethoscope size={14} />;
      case 'quiz': return <Award size={14} />;
      default: return <HelpCircle size={14} />;
    }
  };

  const progressPercentage = Math.round(
    ((completedSectionIds.length + (!isCurrentSectionGated ? 1 : 0)) / sections.length) * 100
  );

  return (
    <div className="fixed inset-0 z-50 bg-[#020308] overflow-y-auto flex flex-col transition-colors selection:bg-indigo-500 selection:text-white">
      {/* Ambient Dark SaaS Volumetric Glow */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(99,102,241,0.18),transparent)] z-0" />

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#050711]/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4 shadow-lg">
        {/* Left: Back button & Title */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="p-2 sm:p-2.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
            aria-label="Back to curriculum"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {badgeLabel}
              </span>
              <span className="text-[11px] text-slate-400 truncate hidden sm:inline">
                {domainName}
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-black text-white truncate uppercase tracking-tight mt-0.5">
              {objective.id}: {title}
            </h1>
          </div>
        </div>

        {/* Right: Interactive Engine Status & Session XP */}
        <div className="flex items-center gap-3 shrink-0">
          {xpEarnedInSession > 0 && (
            <div className="px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5">
              <Sparkles size={13} />
              <span>+{xpEarnedInSession} XP</span>
            </div>
          )}

          <div className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-200 text-xs font-black uppercase tracking-wider">
            <Sparkles size={13} className="text-cyan-400" />
            <span>Interactive Lab Engine</span>
          </div>

          {isCompleted && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-black uppercase tracking-wider">
              <CheckCircle2 size={14} />
              <span>Mastered</span>
            </div>
          )}
        </div>
      </header>

      {/* Progress & Section Nav Bar (With Guided Gate Locks) */}
      <nav className="relative z-30 bg-[#070A16]/90 border-b border-white/10 px-4 sm:px-8 py-2.5 flex items-center justify-between gap-4 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-2 min-w-max">
          {sections.map((sec, idx) => {
            const isActive = idx === activeSectionIdx;
            const isDone = completedSectionIds.includes(sec.id);
            const isUnlocked = canJumpToStage(idx);

            return (
              <button
                key={sec.id}
                type="button"
                disabled={!isUnlocked}
                onClick={() => {
                  if (!isUnlocked) return;
                  if (!isCurrentSectionGated) {
                    markSectionCompleted(currentSection.id);
                  }
                  setActiveSectionIdx(idx);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600/40 to-cyan-600/30 text-white border-cyan-400/60 shadow-md cursor-default'
                    : isDone
                    ? 'bg-emerald-950/30 text-emerald-300 border-emerald-500/30 hover:bg-emerald-950/50 cursor-pointer'
                    : isUnlocked
                    ? 'bg-white/[0.03] text-slate-300 border-white/10 hover:text-white hover:bg-white/[0.07] cursor-pointer'
                    : 'bg-slate-950/50 text-slate-600 border-white/5 opacity-60 cursor-not-allowed'
                }`}
                title={!isUnlocked ? 'Complete the current interactive stage to unlock' : sec.title}
              >
                <span>{getSectionIcon(sec.type)}</span>
                <span>{idx + 1}. {sec.title.split(':')[0]}</span>
                {isDone ? (
                  <CheckCircle2 size={12} className="text-emerald-400" />
                ) : !isUnlocked ? (
                  <Lock size={11} className="text-slate-500" />
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Progress indicator */}
        <div className="hidden lg:flex items-center gap-3 shrink-0">
          <div className="w-28 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(12, progressPercentage))}%` }}
            />
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Stage {activeSectionIdx + 1}/{sections.length}
          </span>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 p-4 sm:p-8 md:p-10 max-w-7xl mx-auto w-full space-y-10">
        {currentSection.type === 'text' && (
          <TextLesson section={currentSection} />
        )}

        {currentSection.type === 'diagram' && (
          <InteractiveDiagram
            section={currentSection}
            onStageComplete={() => markSectionCompleted(currentSection.id)}
          />
        )}

        {currentSection.type === '3d-model' && (
          <ThreeDViewer section={currentSection} />
        )}

        {currentSection.type === 'animation' && (
          <AnimatedLesson section={currentSection} />
        )}

        {currentSection.type === 'lab' && (
          <VirtualLab
            section={currentSection}
            onRewardXP={handleRewardXP}
            onStageComplete={() => markSectionCompleted(currentSection.id)}
          />
        )}

        {currentSection.type === 'terminal' && (
          <TerminalSandbox
            section={currentSection}
            onRewardXP={handleRewardXP}
            onStageComplete={() => markSectionCompleted(currentSection.id)}
          />
        )}

        {currentSection.type === 'matcher' && (
          <InteractiveMatcher
            section={currentSection}
            onRewardXP={handleRewardXP}
            onStageComplete={() => markSectionCompleted(currentSection.id)}
          />
        )}

        {currentSection.type === 'finance-sim' && (
          <ZarFinanceSimulator
            section={currentSection}
            onRewardXP={handleRewardXP}
            onStageComplete={() => markSectionCompleted(currentSection.id)}
          />
        )}

        {currentSection.type === 'prompt-lab' && (
          <PromptLabSimulator
            section={currentSection}
            onRewardXP={handleRewardXP}
            onStageComplete={() => markSectionCompleted(currentSection.id)}
          />
        )}

        {currentSection.type === 'scenario' && (
          <ScenarioExercise
            section={currentSection}
            onRewardXP={handleRewardXP}
            onStageComplete={() => markSectionCompleted(currentSection.id)}
          />
        )}

        {currentSection.type === 'quiz' && (
          <KnowledgeCheck
            section={currentSection}
            onLessonCompleted={handleLessonCompleted}
            isAlreadyCompleted={isCompleted}
          />
        )}
      </main>

      {/* Bottom Sticky Step Navigation with Guided Gate */}
      <footer className="sticky bottom-0 z-40 bg-[#050711]/95 backdrop-blur-xl border-t border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4 shadow-2xl">
        <button
          type="button"
          onClick={handlePrevSection}
          disabled={activeSectionIdx === 0}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 border transition-all ${
            activeSectionIdx > 0
              ? 'bg-white/5 border-white/10 text-white hover:bg-white/10 cursor-pointer'
              : 'opacity-40 cursor-not-allowed text-slate-600 border-transparent'
          }`}
        >
          <ChevronLeft size={16} />
          <span>Previous Stage</span>
        </button>

        <div className="text-center hidden sm:block">
          <div className="flex items-center justify-center gap-2">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              Stage {activeSectionIdx + 1} of {sections.length}
            </span>
            {isCurrentSectionGated && (
              <span
                className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase border flex items-center gap-1 ${
                  isCurrentGateUnlocked
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                }`}
              >
                {isCurrentGateUnlocked ? (
                  <>
                    <CheckCircle2 size={10} />
                    <span>Task Verified</span>
                  </>
                ) : (
                  <>
                    <Lock size={10} />
                    <span>Complete Interactive Task to Unlock Next</span>
                  </>
                )}
              </span>
            )}
          </div>
          <div className="text-xs font-bold text-white line-clamp-1 mt-0.5">{currentSection.title}</div>
        </div>

        {activeSectionIdx < sections.length - 1 ? (
          <button
            type="button"
            disabled={!isCurrentGateUnlocked}
            onClick={handleNextSection}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
              isCurrentGateUnlocked
                ? 'bg-gradient-to-r from-indigo-600 to-cyan-500 text-white hover:opacity-95 shadow-lg shadow-indigo-500/25 cursor-pointer'
                : 'bg-slate-900 border border-white/10 text-slate-500 cursor-not-allowed'
            }`}
          >
            {!isCurrentGateUnlocked && <Lock size={14} />}
            <span>{isCurrentGateUnlocked ? 'Next Stage' : 'Complete Task First'}</span>
            <ChevronRight size={16} />
          </button>
        ) : (
          <button
            type="button"
            disabled={!isCurrentGateUnlocked}
            onClick={onBack}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
              isCurrentGateUnlocked
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 cursor-pointer'
                : 'bg-slate-900 border border-white/10 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isCurrentGateUnlocked ? <CheckCircle2 size={16} /> : <Lock size={14} />}
            <span>{isCurrentGateUnlocked ? 'Finish Lesson' : 'Pass Assessment First'}</span>
          </button>
        )}
      </footer>
    </div>
  );
};

export default LessonRenderer;
