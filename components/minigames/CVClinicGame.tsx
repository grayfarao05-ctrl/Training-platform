import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  UserStats, CourseId, CVClinicCase, CVClinicLine, MistakeCategory 
} from '../../types';
import { db, auth, handleFirestoreError, OperationType } from '../../firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { updateUserActivity } from '../../statsService';
import { getCourseConfig } from '../../courseConfig';
import { useReducedMotionAndVisibility } from '../../animations';
import { 
  ArrowLeft, Clock, Award, Star, CheckCircle2, XCircle, 
  AlertCircle, ChevronRight, RotateCcw, Play, Check, X,
  HelpCircle, Sparkles, BookOpen, FileCheck, Layers, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CVPaper } from './CVPaper';

interface CVClinicGameProps {
  userStats: UserStats;
  onBack: () => void;
  activeCourse?: CourseId;
}

const LESSON_TIPS: Record<MistakeCategory, string> = {
  contact: 'Use a professional email with your name, like thabo.mokoena@gmail.com.',
  privacy: 'Leave off your ID number, street address, religion and marital status.',
  honesty: "Never list a certification you do not hold. Write 'In progress' if it is true.",
  format: 'Send a clean PDF named Firstname_Surname_CV.pdf.',
  spelling: 'Read your CV out loud, then ask someone else to read it.',
  content: 'Use action words, numbers and results, and tailor it to the job.',
};

type GamePhase = 'start' | 'playing' | 'result';

export const CVClinicGame: React.FC<CVClinicGameProps> = ({
  userStats,
  onBack,
  activeCourse = 'matric-to-money'
}) => {
  const courseConfig = getCourseConfig(activeCourse);
  const { isReducedMotion } = useReducedMotionAndVisibility();
  const reduceMotion = Boolean(isReducedMotion);


  // Cases loaded from Firestore
  const [cases, setCases] = useState<CVClinicCase[]>([]);
  const [loadingCases, setLoadingCases] = useState(true);
  const [selectedCase, setSelectedCase] = useState<CVClinicCase | null>(null);

  // Game state
  const [phase, setPhase] = useState<GamePhase>('start');
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [totalTimeSeconds, setTotalTimeSeconds] = useState(60);
  const [foundLineIds, setFoundLineIds] = useState<Set<string>>(new Set());
  const [wrongLineIds, setWrongLineIds] = useState<Set<string>>(new Set());
  const [wrongTaps, setWrongTaps] = useState(0);

  // Toast & accessibility feedback
  const [activeToast, setActiveToast] = useState<{ message: string; type: 'correct' | 'wrong' } | null>(null);
  const [ariaAnnouncement, setAriaAnnouncement] = useState('');

  // XP & Replay status
  const [xpAwarded, setXpAwarded] = useState<number | null>(null);
  const [isReplay, setIsReplay] = useState<boolean>(false);
  const hasSavedResultRef = useRef<boolean>(false);

  // Best stars per case stored locally
  const [bestStarsMap, setBestStarsMap] = useState<Record<string, number>>(() => {
    try {
      const stored = localStorage.getItem('itreal_cv_clinic_stars');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Timestamp-based timer refs
  const endTimeRef = useRef<number>(0);
  const timerRafRef = useRef<number | null>(null);

  // Load published cases for active course
  useEffect(() => {
    setLoadingCases(true);
    const qCases = query(collection(db, 'cv_clinic_cases'), where('status', '==', 'published'));
    const unsubscribe = onSnapshot(
      qCases,
      (snapshot) => {
        const allPublished = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as CVClinicCase));
        const courseMatches = allPublished.filter(c => {
          if (activeCourse === 'matric-to-money') {
            return !c.course || c.course === 'matric-to-money';
          }
          return c.course === activeCourse;
        });
        // If no course match for this specific course, fall back to all published cases so student/admin is never blocked
        const loaded = courseMatches.length > 0 ? courseMatches : allPublished;
        setCases(loaded);
        if (loaded.length > 0) {
          setSelectedCase(prev => (prev && loaded.some(c => c.id === prev.id) ? prev : loaded[0]));
        }
        setLoadingCases(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'cv_clinic_cases');
        setLoadingCases(false);
      }
    );
    return () => unsubscribe();
  }, [activeCourse]);

  // All mistakes planted in the selected case
  const allMistakes = useMemo(() => {
    if (!selectedCase) return [];
    return selectedCase.sections.flatMap(s => 
      s.lines.filter(l => Boolean(l.mistake)).map(l => ({
        lineId: l.id,
        text: l.text,
        section: s.heading,
        category: l.mistake!.category,
        reason: l.mistake!.reason
      }))
    );
  }, [selectedCase]);

  const totalMistakesCount = allMistakes.length;

  // Clean timer on unmount
  useEffect(() => {
    return () => {
      if (timerRafRef.current) cancelAnimationFrame(timerRafRef.current);
    };
  }, []);

  // Timer loop driven by real timestamps
  const startTimer = (durationSeconds: number) => {
    setTotalTimeSeconds(durationSeconds);
    setSecondsLeft(durationSeconds);
    endTimeRef.current = Date.now() + durationSeconds * 1000;

    const tick = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000));
      setSecondsLeft(remaining);

      if (remaining <= 0) {
        handleEndGame('time_up');
      } else {
        timerRafRef.current = requestAnimationFrame(tick);
      }
    };

    if (timerRafRef.current) cancelAnimationFrame(timerRafRef.current);
    timerRafRef.current = requestAnimationFrame(tick);
  };

  const handleStartGame = () => {
    if (!selectedCase) return;
    hasSavedResultRef.current = false;
    setXpAwarded(null);
    setIsReplay(false);
    setFoundLineIds(new Set());
    setWrongLineIds(new Set());
    setWrongTaps(0);
    setActiveToast(null);
    setPhase('playing');
    setAriaAnnouncement(`Game started. Find the mistakes in ${selectedCase.title}.`);
    startTimer(selectedCase.timeLimitSeconds || 60);
  };

  const handleEndGame = (reason: 'all_found' | 'done_early' | 'time_up') => {
    if (timerRafRef.current) {
      cancelAnimationFrame(timerRafRef.current);
      timerRafRef.current = null;
    }
    setPhase('result');

    if (reason === 'all_found') {
      setAriaAnnouncement('Fantastic! You found all the mistakes!');
    } else if (reason === 'time_up') {
      setAriaAnnouncement('Time is up! Check your results.');
    } else {
      setAriaAnnouncement('Game finished. Reviewing your score.');
    }
  };

  // Line interaction during play
  const handleLineTap = (line: CVClinicLine, sectionHeading: string) => {
    if (phase !== 'playing') return;

    if (line.mistake) {
      // Real mistake found
      if (foundLineIds.has(line.id)) return; // already found

      const newFound = new Set(foundLineIds);
      newFound.add(line.id);
      setFoundLineIds(newFound);

      const foundCount = newFound.size;
      const toastMsg = line.mistake.reason || 'Great spot! Mistake identified.';
      setActiveToast({ message: toastMsg, type: 'correct' });
      setAriaAnnouncement(`Mistake found: ${line.mistake.category}. ${toastMsg}. Found ${foundCount} of ${totalMistakesCount}.`);

      // Check if all mistakes found
      if (foundCount >= totalMistakesCount) {
        setTimeout(() => {
          handleEndGame('all_found');
        }, 800);
      }
    } else {
      // Wrong tap
      setWrongTaps(prev => prev + 1);
      const newWrong = new Set(wrongLineIds);
      newWrong.add(line.id);
      setWrongLineIds(newWrong);

      setActiveToast({ 
        message: 'No mistake here! -25 points penalty.', 
        type: 'wrong' 
      });
      setAriaAnnouncement('Wrong tap! That line has no mistake. 25 points lost.');

      // Clear shake after brief moment
      setTimeout(() => {
        setWrongLineIds(prev => {
          const c = new Set(prev);
          c.delete(line.id);
          return c;
        });
      }, 600);
    }
  };

  // Score & Star calculations
  const mistakesFoundCount = foundLineIds.size;
  const allFound = totalMistakesCount > 0 && mistakesFoundCount === totalMistakesCount;
  const timeBonus = allFound ? Math.max(0, secondsLeft * 2) : 0;
  const rawScore = (mistakesFoundCount * 100) - (wrongTaps * 25);
  const finalScore = Math.max(0, rawScore) + timeBonus;

  // Star Rating:
  // 3 stars = all found and at most 1 wrong tap
  // 2 stars = at least 70% found
  // otherwise 1 star
  const earnedStars = useMemo(() => {
    if (totalMistakesCount === 0) return 1;
    if (allFound && wrongTaps <= 1) return 3;
    if ((mistakesFoundCount / totalMistakesCount) >= 0.7) return 2;
    return 1;
  }, [allFound, wrongTaps, mistakesFoundCount, totalMistakesCount]);

  // Persist best stars locally
  useEffect(() => {
    if (phase === 'result' && selectedCase?.id) {
      const currentBest = bestStarsMap[selectedCase.id] || 0;
      if (earnedStars > currentBest) {
        const next = { ...bestStarsMap, [selectedCase.id]: earnedStars };
        setBestStarsMap(next);
        try {
          localStorage.setItem('itreal_cv_clinic_stars', JSON.stringify(next));
        } catch {}
      }
    }
  }, [phase, selectedCase?.id, earnedStars]);

  // Award XP (10 XP per mistake found, once per case per student) and post to Leaderboard
  useEffect(() => {
    if (phase !== 'result' || !selectedCase?.id || hasSavedResultRef.current) return;
    hasSavedResultRef.current = true;

    const saveStatsAndXp = async () => {
      // 1. XP calculation: 10 XP per mistake found, awarded once per case per student
      const userCompletedCases = (userStats?.arcadeCompleted?.['cv-clinic'] || []) as string[];
      const isFirstTime = !userCompletedCases.includes(selectedCase.id!);
      setIsReplay(!isFirstTime);

      const xpEarned = isFirstTime ? mistakesFoundCount * 10 : 0;
      setXpAwarded(xpEarned);

      if (isFirstTime && xpEarned > 0 && userStats?.uid) {
        try {
          const nextCompleted = [...userCompletedCases, selectedCase.id!];
          await updateUserActivity(xpEarned, 0.05, {
            arcadeCompleted: {
              ...(userStats.arcadeCompleted || {}),
              'cv-clinic': nextCompleted
            }
          });
        } catch (err) {
          console.warn('Failed to award XP for CV Clinic:', err);
        }
      }

      // 2. Write to leaderboards
      try {
        const payload = {
          gameId: 'cv-clinic',
          uid: userStats.uid,
          username: userStats.displayName || auth.currentUser?.email?.split('@')[0] || 'Unknown',
          score: finalScore,
          caseId: selectedCase.id!,
          caseTitle: selectedCase.title,
          stars: earnedStars,
          mistakesFound: mistakesFoundCount,
          totalMistakes: totalMistakesCount,
          wrongTaps,
          timeRemaining: secondsLeft,
          course: activeCourse,
          timestamp: serverTimestamp()
        };

        await addDoc(collection(db, 'cv_clinic_leaderboard'), payload);
        await addDoc(collection(db, 'minigame_leaderboard'), payload);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'cv_clinic_leaderboard');
      }
    };

    saveStatsAndXp();
  }, [phase, selectedCase?.id, mistakesFoundCount, finalScore, earnedStars, totalMistakesCount, wrongTaps, secondsLeft, activeCourse, userStats]);


  // Missed mistakes list
  const missedMistakes = useMemo(() => {
    return allMistakes.filter(m => !foundLineIds.has(m.lineId));
  }, [allMistakes, foundLineIds]);

  // Categories of missed mistakes to generate Module 1 tips
  const missedCategories = useMemo(() => {
    const cats = new Set<MistakeCategory>();
    missedMistakes.forEach(m => cats.add(m.category));
    return Array.from(cats);
  }, [missedMistakes]);

  // Next case helper
  const handleNextCase = () => {
    if (!selectedCase) return;
    const currentIdx = cases.findIndex(c => c.id === selectedCase.id);
    const nextIdx = (currentIdx + 1) % cases.length;
    setSelectedCase(cases[nextIdx]);
    setPhase('start');
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-6">
      {/* ARIA Live Region for accessibility announcements */}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
      >
        {ariaAnnouncement}
      </div>

      {/* Top Header & Navigation */}
      <header className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)] border border-[var(--border-color)] transition-all"
        >
          <ArrowLeft size={16} /> Back to Arcade
        </button>

        <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-muted)]">
          <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
            <FileCheck size={16} />
          </span>
          <span className="uppercase tracking-wider">{courseConfig.shortLabel} CV Clinic</span>
        </div>
      </header>

      {/* NO PUBLISHED CASES AVAILABLE STATE */}
      {!loadingCases && cases.length === 0 && (
        <div className="bg-[var(--bg-card)] rounded-[2rem] p-10 text-center border border-[var(--border-color)] shadow-xl max-w-lg mx-auto space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/20">
            <BookOpen size={32} />
          </div>
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight text-[var(--text-main)]">
              CV Clinic Coming Soon
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-2 leading-relaxed">
              No sample CV cases are published for {courseConfig.name} yet. Check back soon or visit the Admin Hub to author the first case!
            </p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      )}

      {/* CASE PICKER STRIP (Shown on start screen if multiple cases exist) */}
      {phase === 'start' && cases.length > 1 && (
        <div className="bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border-color)]">
          <div className="text-[11px] font-black uppercase tracking-wider text-[var(--text-muted)] mb-3 flex items-center gap-1.5">
            <Layers size={14} /> Available CV Clinic Cases ({cases.length})
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {cases.map((c) => {
              const isSelected = selectedCase?.id === c.id;
              const stars = c.id ? bestStarsMap[c.id] || 0 : 0;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCase(c)}
                  className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-emerald-500/10 border-emerald-500 shadow-sm'
                      : 'bg-[var(--bg-surface)] border-[var(--border-color)] hover:border-emerald-500/30'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] capitalize">
                        {c.difficulty}
                      </span>
                      {stars > 0 && (
                        <div className="flex items-center gap-0.5 text-amber-400">
                          {[1, 2, 3].map(st => (
                            <Star 
                              key={st} 
                              size={12} 
                              className={st <= stars ? 'fill-amber-400 text-amber-400' : 'text-slate-400'} 
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-[var(--text-main)] line-clamp-1">
                      {c.title}
                    </h4>
                  </div>
                  <div className="mt-2 text-[10px] text-[var(--text-muted)] font-mono flex items-center gap-2">
                    <Clock size={11} /> {c.timeLimitSeconds}s
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* PHASE 1: START SCREEN */}
      {phase === 'start' && selectedCase && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--bg-card)] rounded-[2rem] p-6 sm:p-10 border border-[var(--border-color)] shadow-xl space-y-8 max-w-2xl mx-auto"
        >
          {/* Header */}
          <div className="text-center space-y-3">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 inline-block capitalize">
              {selectedCase.difficulty} Level
            </span>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[var(--text-main)]">
              {selectedCase.title}
            </h2>
            {selectedCase.brief && (
              <p className="text-sm text-[var(--text-muted)] italic max-w-lg mx-auto bg-[var(--bg-surface)] p-3 rounded-xl border border-[var(--border-color)]">
                "{selectedCase.brief}"
              </p>
            )}
          </div>

          {/* Quick Specs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[var(--bg-surface)] p-4 rounded-xl border border-[var(--border-color)] text-center">
              <div className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">Time Limit</div>
              <div className="text-xl font-black text-emerald-500 font-mono mt-0.5">{selectedCase.timeLimitSeconds}s</div>
            </div>
            <div className="bg-[var(--bg-surface)] p-4 rounded-xl border border-[var(--border-color)] text-center">
              <div className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">Target</div>
              <div className="text-xl font-black text-[var(--text-main)] mt-0.5">{totalMistakesCount} Mistakes</div>
            </div>
          </div>

          {/* How to Play Card */}
          <div className="bg-[var(--bg-surface)] p-5 rounded-2xl border border-[var(--border-color)] space-y-3">
            <div className="text-xs font-black uppercase tracking-wider text-[var(--text-main)] flex items-center gap-2">
              <HelpCircle size={15} className="text-emerald-500" /> How to Play
            </div>
            <ul className="text-xs text-[var(--text-muted)] space-y-2 list-none">
              <li className="flex items-start gap-2">
                <Check size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                <span>Read the CV carefully line by line (including the file name chip at the top).</span>
              </li>
              <li className="flex items-start gap-2">
                <Check size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                <span>Tap every planted mistake before the timer expires (+100 pts each).</span>
              </li>
              <li className="flex items-start gap-2">
                <X size={14} className="text-rose-500 shrink-0 mt-0.5" />
                <span>Be careful: tapping a correct line costs a wrong tap penalty (-25 pts).</span>
              </li>
              <li className="flex items-start gap-2">
                <Sparkles size={14} className="text-amber-500 shrink-0 mt-0.5" />
                <span>Find all mistakes to earn a speed bonus (+2 pts/sec remaining) and 3 stars!</span>
              </li>
            </ul>
          </div>

          {/* Start CTA */}
          <button
            type="button"
            onClick={handleStartGame}
            className="w-full py-4 rounded-2xl font-black uppercase tracking-wider text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play size={18} /> Start Clinic
          </button>
        </motion.div>
      )}

      {/* PHASE 2: PLAY SCREEN */}
      {phase === 'playing' && selectedCase && (
        <div className="space-y-6">
          {/* Active Status Bar */}
          <div className="sticky top-4 z-30 bg-[var(--bg-card)]/90 backdrop-blur-md rounded-2xl p-4 border border-[var(--border-color)] shadow-lg max-w-2xl mx-auto space-y-3">
            <div className="flex items-center justify-between gap-4">
              {/* Progress Count */}
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <CheckCircle2 size={18} />
                </span>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">Progress</div>
                  <div className="text-sm font-black text-[var(--text-main)]">
                    Found {mistakesFoundCount} of {totalMistakesCount}
                  </div>
                </div>
              </div>

              {/* Wrong taps counter */}
              <div className="flex items-center gap-1.5 text-xs text-rose-500 font-bold">
                <XCircle size={15} />
                <span>{wrongTaps} wrong</span>
              </div>

              {/* Countdown Timer */}
              <div className="flex items-center gap-2">
                <Clock size={18} className={secondsLeft <= 10 ? 'text-rose-500 animate-pulse' : 'text-emerald-500'} />
                <span className={`text-base font-black font-mono ${secondsLeft <= 10 ? 'text-rose-500 font-bold' : 'text-[var(--text-main)]'}`}>
                  {secondsLeft}s
                </span>
              </div>

              {/* Done Button */}
              <button
                type="button"
                onClick={() => handleEndGame('done_early')}
                className="px-3.5 py-1.5 rounded-xl border border-[var(--border-color)] text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>

            {/* Countdown Progress Bar */}
            <div className="w-full bg-[var(--bg-surface)] h-2 rounded-full overflow-hidden border border-[var(--border-color)]">
              <div 
                className={`h-full transition-all duration-300 ${
                  secondsLeft <= 10 ? 'bg-rose-500' : secondsLeft <= 25 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${(secondsLeft / totalTimeSeconds) * 100}%` }}
              />
            </div>

            {/* Brief note reminder */}
            {selectedCase.brief && (
              <div className="text-[11px] text-[var(--text-muted)] italic text-center border-t border-[var(--border-color)] pt-1.5">
                Note: {selectedCase.brief}
              </div>
            )}
          </div>

          {/* Feedback Toast */}
          <AnimatePresence>
            {activeToast && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`max-w-md mx-auto p-3 rounded-xl border text-xs font-bold flex items-center gap-2.5 shadow-lg select-none ${
                  activeToast.type === 'correct'
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-800 dark:text-emerald-200'
                    : 'bg-rose-500/15 border-rose-500 text-rose-800 dark:text-rose-200'
                }`}
              >
                {activeToast.type === 'correct' ? (
                  <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <XCircle size={16} className="text-rose-600 dark:text-rose-400 shrink-0" />
                )}
                <span className="leading-tight">{activeToast.message}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* The Interactive Paper CV */}
          <CVPaper
            sections={selectedCase.sections}
            mode="play"
            foundLineIds={foundLineIds}
            wrongLineIds={wrongLineIds}
            onLineTap={handleLineTap}
          />
        </div>
      )}

      {/* PHASE 3: RESULT SCREEN */}
      {phase === 'result' && selectedCase && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[var(--bg-card)] rounded-[2rem] p-6 sm:p-10 border border-[var(--border-color)] shadow-xl space-y-8 max-w-2xl mx-auto"
        >
          {/* Header & Stars */}
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3].map((starNum) => (
                <motion.div
                  key={starNum}
                  initial={reduceMotion ? {} : { scale: 0 }}
                  animate={reduceMotion ? {} : { scale: 1 }}
                  transition={{ delay: starNum * 0.15 }}
                >
                  <Star 
                    size={36} 
                    className={starNum <= earnedStars ? 'fill-amber-400 text-amber-400 drop-shadow-md' : 'text-slate-300 dark:text-slate-700'} 
                  />
                </motion.div>
              ))}
            </div>

            <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[var(--text-main)]">
              {earnedStars === 3 ? 'Mastery! All Mistakes Cleared' : earnedStars === 2 ? 'Great Job! Solid Review' : 'Good Effort! Keep Practicing'}
            </h3>

            <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
              {earnedStars === 3
                ? 'You caught every planted mistake with sharp precision. Your recruitment eye is razor sharp!'
                : earnedStars === 2
                ? 'You spotted the majority of critical flaws. Review the missed items below to get full mastery.'
                : 'Take another look through the lesson tips below to learn the key CV conventions.'}
            </p>
          </div>

          {/* XP & Replay Award Status */}
          <div className="flex justify-center">
            {xpAwarded !== null && xpAwarded > 0 ? (
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-black text-xs uppercase tracking-wider shadow-sm">
                <Zap size={15} className="fill-emerald-500 text-emerald-500" />
                <span>+{xpAwarded} XP Earned (First Case Completion!)</span>
              </div>
            ) : isReplay ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-muted)] font-bold text-xs uppercase tracking-wider">
                <span>Score & Stars Recorded (Replay — XP awarded once per case)</span>
              </div>
            ) : null}
          </div>

          {/* Score & Key Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[var(--bg-surface)] p-3.5 rounded-xl border border-[var(--border-color)] text-center">
              <div className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">Score</div>
              <div className="text-2xl font-black text-emerald-500 font-mono mt-0.5">{finalScore}</div>
            </div>
            <div className="bg-[var(--bg-surface)] p-3.5 rounded-xl border border-[var(--border-color)] text-center">
              <div className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">Mistakes Found</div>
              <div className="text-xl font-black text-[var(--text-main)] mt-0.5">
                {mistakesFoundCount}/{totalMistakesCount}
              </div>
            </div>
            <div className="bg-[var(--bg-surface)] p-3.5 rounded-xl border border-[var(--border-color)] text-center">
              <div className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">Wrong Taps</div>
              <div className="text-xl font-black text-rose-500 mt-0.5">{wrongTaps}</div>
            </div>
            <div className="bg-[var(--bg-surface)] p-3.5 rounded-xl border border-[var(--border-color)] text-center">
              <div className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">Time Left</div>
              <div className="text-xl font-black text-emerald-500 font-mono mt-0.5">{secondsLeft}s</div>
            </div>
          </div>

          {/* Found Mistakes List */}
          {mistakesFoundCount > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 size={15} /> Mistakes Spotted ({mistakesFoundCount})
              </div>
              <div className="space-y-2">
                {allMistakes.filter(m => foundLineIds.has(m.lineId)).map((m) => (
                  <div key={m.lineId} className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-1">
                    <div className="font-bold text-[var(--text-main)] flex items-center justify-between">
                      <span>"{m.text}"</span>
                      <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                        {m.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)]">{m.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Missed Mistakes List */}
          {missedMistakes.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <AlertCircle size={15} /> Mistakes You Missed ({missedMistakes.length})
              </div>
              <div className="space-y-2">
                {missedMistakes.map((m) => (
                  <div key={m.lineId} className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1">
                    <div className="font-bold text-[var(--text-main)] flex items-center justify-between">
                      <span>"{m.text}"</span>
                      <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300">
                        {m.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-800 dark:text-amber-200">{m.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Module 1 Lesson Tips for Missed Categories */}
          {missedCategories.length > 0 && (
            <div className="bg-[var(--bg-surface)] p-5 rounded-2xl border border-[var(--border-color)] space-y-3">
              <div className="text-xs font-black uppercase tracking-wider text-[var(--text-main)] flex items-center gap-2">
                <BookOpen size={16} className="text-emerald-500" /> Module 1 CV Lessons
              </div>
              <div className="space-y-2.5">
                {missedCategories.map(cat => (
                  <div key={cat} className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500 block">
                      {cat.toUpperCase()} RULE:
                    </span>
                    <p className="text-xs text-[var(--text-main)] leading-relaxed">
                      {LESSON_TIPS[cat]}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleStartGame}
              className="w-full sm:flex-1 py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw size={16} /> Play Again
            </button>
            {cases.length > 1 && (
              <button
                type="button"
                onClick={handleNextCase}
                className="w-full sm:flex-1 py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] hover:border-emerald-500/50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Next Case</span>
                <ChevronRight size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={onBack}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
            >
              Back to Arcade
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CVClinicGame;
