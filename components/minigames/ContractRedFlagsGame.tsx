import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  UserStats, CourseId, ContractCase, ContractClause, ContractRequiredItemKey,
  ContractFlagCategory, ContractVerdict, ReferenceFigures
} from '../../types';
import { db, auth, handleFirestoreError, OperationType } from '../../firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { updateUserActivity } from '../../statsService';
import { getCourseConfig } from '../../courseConfig';
import { useReducedMotionAndVisibility } from '../../animations';
import { 
  ArrowLeft, Clock, Award, Star, CheckCircle2, XCircle, 
  AlertCircle, ChevronRight, RotateCcw, Play, Check, X,
  HelpCircle, Sparkles, BookOpen, FileCheck, Layers, Zap,
  FileWarning, Scale, ChevronDown, ChevronUp, Flag, Lightbulb,
  ShieldCheck, ShieldAlert, AlertTriangle, Eye, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ContractPaper } from './ContractPaper';
import { 
  CONTRACT_REQUIRED_ITEMS, CONTRACT_FLAG_CATEGORIES, LESSON_TIPS,
  CONTRACT_FINAL_TIP, CONTRACT_FOOTER_NOTE, DEFAULT_REFERENCE_FIGURES,
  replaceFiguresPlaceholders, subscribeReferenceFigures
} from '../../referenceFiguresService';

interface ContractRedFlagsGameProps {
  userStats: UserStats;
  onBack: () => void;
  activeCourse?: CourseId;
}

type GamePhase = 'start' | 'scan' | 'missing' | 'verdict' | 'result';

export const ContractRedFlagsGame: React.FC<ContractRedFlagsGameProps> = ({
  userStats,
  onBack,
  activeCourse = 'matric-to-money'
}) => {
  const courseConfig = getCourseConfig(activeCourse);
  const { isReducedMotion } = useReducedMotionAndVisibility();
  const reduceMotion = Boolean(isReducedMotion);

  // Reference figures from Firestore
  const [referenceFigures, setReferenceFigures] = useState<ReferenceFigures | null>(DEFAULT_REFERENCE_FIGURES);
  useEffect(() => {
    const unsub = subscribeReferenceFigures(figs => {
      setReferenceFigures(figs || DEFAULT_REFERENCE_FIGURES);
    });
    return () => unsub();
  }, []);

  // Cases loaded from Firestore
  const [cases, setCases] = useState<ContractCase[]>([]);
  const [loadingCases, setLoadingCases] = useState(true);
  const [selectedCase, setSelectedCase] = useState<ContractCase | null>(null);

  // Game flow state
  const [phase, setPhase] = useState<GamePhase>('start');

  // Step 1: Scan state
  const [secondsLeft, setSecondsLeft] = useState(90);
  const [totalTimeSeconds, setTotalTimeSeconds] = useState(90);
  const [flaggedClauseIds, setFlaggedClauseIds] = useState<Set<string>>(new Set());
  const [wrongClauseIds, setWrongClauseIds] = useState<Set<string>>(new Set());
  const [wrongTaps, setWrongTaps] = useState(0);
  const [remainingHints, setRemainingHints] = useState(2);
  const [hintedClauseId, setHintedClauseId] = useState<string | null>(null);

  // Step 2: Missing items state
  const [selectedMissingItems, setSelectedMissingItems] = useState<Set<ContractRequiredItemKey>>(new Set());
  const [isContractDrawerOpen, setIsContractDrawerOpen] = useState(false);

  // Step 3: Verdict state
  const [chosenVerdict, setChosenVerdict] = useState<ContractVerdict | null>(null);

  // Toast & accessibility feedback
  const [activeToast, setActiveToast] = useState<{ message: string; type: 'correct' | 'wrong' | 'info' } | null>(null);
  const [ariaAnnouncement, setAriaAnnouncement] = useState('');

  // Results & XP
  const [xpAwarded, setXpAwarded] = useState<number | null>(null);
  const [isReplay, setIsReplay] = useState<boolean>(false);
  const hasSavedResultRef = useRef<boolean>(false);

  // Best stars saved locally
  const [bestStarsMap, setBestStarsMap] = useState<Record<string, number>>(() => {
    try {
      const stored = localStorage.getItem('itreal_contract_stars');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Timestamp-based timer refs
  const endTimeRef = useRef<number>(0);
  const timerRafRef = useRef<number | null>(null);

  // Load published cases
  useEffect(() => {
    setLoadingCases(true);
    const qCases = query(collection(db, 'contract_cases'), where('status', '==', 'published'));
    const unsubscribe = onSnapshot(
      qCases,
      (snapshot) => {
        const allPublished = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as ContractCase));
        const courseMatches = allPublished.filter(c => {
          if (activeCourse === 'matric-to-money') {
            return !c.course || c.course === 'matric-to-money';
          }
          return c.course === activeCourse;
        });
        const loaded = courseMatches.length > 0 ? courseMatches : allPublished;
        setCases(loaded);
        if (loaded.length > 0) {
          setSelectedCase(prev => (prev && loaded.some(c => c.id === prev.id) ? prev : loaded[0]));
        }
        setLoadingCases(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'contract_cases');
        setLoadingCases(false);
      }
    );
    return () => unsubscribe();
  }, [activeCourse]);

  // Clean timer on unmount
  useEffect(() => {
    return () => {
      if (timerRafRef.current) cancelAnimationFrame(timerRafRef.current);
    };
  }, []);

  // All planted flags in current case
  const allFlags = useMemo(() => {
    if (!selectedCase) return [];
    return selectedCase.clauses.filter(c => Boolean(c.flag)).map(c => ({
      clauseId: c.id,
      heading: c.heading,
      text: c.text,
      category: c.flag!.category,
      reason: c.flag!.reason
    }));
  }, [selectedCase]);

  const totalFlagsCount = allFlags.length;

  // Real timestamp timer loop
  const startTimer = (durationSeconds: number) => {
    setTotalTimeSeconds(durationSeconds);
    setSecondsLeft(durationSeconds);
    endTimeRef.current = Date.now() + durationSeconds * 1000;

    const tick = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000));
      setSecondsLeft(remaining);

      if (remaining <= 0) {
        advanceToMissingStep('time_up');
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
    setFlaggedClauseIds(new Set());
    setWrongClauseIds(new Set());
    setWrongTaps(0);
    setRemainingHints(2);
    setHintedClauseId(null);
    setSelectedMissingItems(new Set());
    setChosenVerdict(null);
    setActiveToast(null);
    setIsContractDrawerOpen(false);

    const timeLimit = selectedCase.timeLimitSeconds || 90;
    setPhase('scan');
    startTimer(timeLimit);
    setAriaAnnouncement(`Starting Contract Red Flags game for ${selectedCase.title}. Scan step active.`);
  };

  const advanceToMissingStep = (triggerReason?: 'all_flags' | 'done_button' | 'time_up') => {
    if (timerRafRef.current) cancelAnimationFrame(timerRafRef.current);
    setHintedClauseId(null);
    setPhase('missing');

    if (triggerReason === 'all_flags') {
      setActiveToast({ message: 'All red flags found! Proceeding to Step 2: Missing terms.', type: 'correct' });
      setAriaAnnouncement('All red flags identified! Now proceed to Step 2: identify missing contract terms.');
    } else if (triggerReason === 'time_up') {
      setActiveToast({ message: "Scan time's up! Proceeding to Step 2.", type: 'info' });
      setAriaAnnouncement('Time expired for clause scan. Proceeding to Step 2.');
    } else {
      setAriaAnnouncement('Scan step complete. Proceeding to Step 2: Missing terms.');
    }
  };

  const advanceToVerdictStep = () => {
    setPhase('verdict');
    setAriaAnnouncement('Proceeding to Step 3: Give your final verdict.');
  };

  // Tapping a clause in Step 1 (Scan)
  const handleClauseTap = (clause: ContractClause) => {
    if (phase !== 'scan') return;

    if (clause.flag) {
      if (flaggedClauseIds.has(clause.id)) return; // already flagged

      const newFlagged = new Set(flaggedClauseIds);
      newFlagged.add(clause.id);
      setFlaggedClauseIds(newFlagged);

      // If this was the hinted clause, clear hint
      if (hintedClauseId === clause.id) {
        setHintedClauseId(null);
      }

      const count = newFlagged.size;
      const toastMsg = clause.flag.reason || 'Red flag spotted!';
      setActiveToast({ message: toastMsg, type: 'correct' });
      setAriaAnnouncement(`Red flag found: ${clause.flag.category}. ${toastMsg}. Flagged ${count} of ${totalFlagsCount}.`);

      if (count >= totalFlagsCount) {
        setTimeout(() => {
          advanceToMissingStep('all_flags');
        }, 800);
      }
    } else {
      // Wrong tap
      setWrongTaps(prev => prev + 1);
      const newWrong = new Set(wrongClauseIds);
      newWrong.add(clause.id);
      setWrongClauseIds(newWrong);

      setActiveToast({ 
        message: 'No red flag in this clause. -25 points penalty.', 
        type: 'wrong' 
      });
      setAriaAnnouncement('Wrong tap: That clause is standard and not a red flag. 25 points lost.');

      setTimeout(() => {
        setWrongClauseIds(prev => {
          const c = new Set(prev);
          c.delete(clause.id);
          return c;
        });
      }, 600);
    }
  };

  // Use hint in Step 1
  const handleUseHint = () => {
    if (remainingHints <= 0 || phase !== 'scan' || !selectedCase) return;

    // Find first unflagged red flag clause
    const unflagged = selectedCase.clauses.find(c => Boolean(c.flag) && !flaggedClauseIds.has(c.id));
    if (!unflagged) {
      setActiveToast({ message: 'All red flags are already found!', type: 'info' });
      return;
    }

    setRemainingHints(prev => prev - 1);
    setHintedClauseId(unflagged.id);

    setActiveToast({ 
      message: 'Hint used (-30 pts): Look at the highlighted section!', 
      type: 'info' 
    });
    setAriaAnnouncement('Hint used. An unflagged clause has been highlighted on the agreement. 30 points penalty.');
  };

  // Step 2 toggle
  const toggleMissingItem = (key: ContractRequiredItemKey) => {
    setSelectedMissingItems(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Step 3 select verdict & complete
  const handleSelectVerdict = (verdict: ContractVerdict) => {
    setChosenVerdict(verdict);
    setPhase('result');
    setAriaAnnouncement(`Verdict submitted: ${verdict}. Reviewing results.`);
  };

  // ==========================================
  // Calculations: Score, Stars & Accuracy
  // ==========================================
  const flagsFoundCount = flaggedClauseIds.size;
  const allFlagsFound = totalFlagsCount > 0 && flagsFoundCount === totalFlagsCount;

  // Missing items evaluation
  const trueMissingItems = selectedCase?.missingItems || [];
  const totalTrueMissing = trueMissingItems.length;

  const correctMissingCount = useMemo(() => {
    let count = 0;
    selectedMissingItems.forEach(item => {
      if (trueMissingItems.includes(item)) count++;
    });
    return count;
  }, [selectedMissingItems, trueMissingItems]);

  const wrongMissingCount = useMemo(() => {
    let count = 0;
    selectedMissingItems.forEach(item => {
      if (!trueMissingItems.includes(item)) count++;
    });
    return count;
  }, [selectedMissingItems, trueMissingItems]);

  const missedMissingItems = useMemo(() => {
    return trueMissingItems.filter(item => !selectedMissingItems.has(item));
  }, [trueMissingItems, selectedMissingItems]);

  const hintsUsed = 2 - remainingHints;
  const isVerdictCorrect = chosenVerdict === selectedCase?.correctVerdict;

  // Score formula:
  // 100 per flag found
  // + 100 per missing item correctly ticked
  // - 25 per wrong tap
  // - 25 per wrongly ticked missing item
  // - 30 per hint used
  // + 50 for correct verdict
  // + 2 pts/sec remaining on scan step (only if all flags found)
  // Never below 0
  const timeBonus = allFlagsFound ? Math.max(0, secondsLeft * 2) : 0;
  const flagsScore = flagsFoundCount * 100;
  const missingScore = correctMissingCount * 100;
  const wrongTapsPenalty = wrongTaps * 25;
  const wrongMissingPenalty = wrongMissingCount * 25;
  const hintsPenalty = hintsUsed * 30;
  const verdictBonus = isVerdictCorrect ? 50 : 0;

  const baseCalculatedScore = (flagsScore + missingScore + verdictBonus) - (wrongTapsPenalty + wrongMissingPenalty + hintsPenalty);
  const finalScore = Math.max(0, baseCalculatedScore) + timeBonus;

  // Star Rating:
  // 3 stars = all flags found AND all missing items correct AND <= 1 wrong tap AND correct verdict
  // 2 stars = >= 70% of checkable items correct (flags + missing) AND correct verdict
  // otherwise 1 star
  const earnedStars = useMemo(() => {
    const totalCheckables = totalFlagsCount + totalTrueMissing;
    const userSuccessCheckables = flagsFoundCount + correctMissingCount;

    if (totalCheckables === 0) return 1;

    const allFlagsAndMissing = (flagsFoundCount === totalFlagsCount) && (correctMissingCount === totalTrueMissing) && (wrongMissingCount === 0);
    if (allFlagsAndMissing && wrongTaps <= 1 && isVerdictCorrect) {
      return 3;
    }

    const accuracyRatio = userSuccessCheckables / totalCheckables;
    if (accuracyRatio >= 0.70 && isVerdictCorrect) {
      return 2;
    }

    return 1;
  }, [flagsFoundCount, totalFlagsCount, correctMissingCount, totalTrueMissing, wrongMissingCount, wrongTaps, isVerdictCorrect]);

  // Persist best stars locally
  useEffect(() => {
    if (phase === 'result' && selectedCase?.id) {
      const currentBest = bestStarsMap[selectedCase.id] || 0;
      if (earnedStars > currentBest) {
        const next = { ...bestStarsMap, [selectedCase.id]: earnedStars };
        setBestStarsMap(next);
        try {
          localStorage.setItem('itreal_contract_stars', JSON.stringify(next));
        } catch {}
      }
    }
  }, [phase, selectedCase?.id, earnedStars]);

  // Award XP (10 XP per flag found + 10 XP per correctly ticked missing item, once per case per student) & save leaderboard
  useEffect(() => {
    if (phase !== 'result' || !selectedCase?.id || hasSavedResultRef.current) return;
    hasSavedResultRef.current = true;

    const saveStatsAndXp = async () => {
      // 1. XP calculation
      const userCompletedCases = (userStats?.arcadeCompleted?.['contract-red-flags'] || []) as string[];
      const isFirstTime = !userCompletedCases.includes(selectedCase.id!);
      setIsReplay(!isFirstTime);

      const xpEarned = isFirstTime ? (flagsFoundCount * 10) + (correctMissingCount * 10) : 0;
      setXpAwarded(xpEarned);

      if (isFirstTime && xpEarned > 0 && userStats?.uid) {
        try {
          const nextCompleted = [...userCompletedCases, selectedCase.id!];
          await updateUserActivity(xpEarned, 0.08, {
            arcadeCompleted: {
              ...(userStats.arcadeCompleted || {}),
              'contract-red-flags': nextCompleted
            }
          });
        } catch (err) {
          console.warn('Failed to award XP for Contract Red Flags:', err);
        }
      }

      // 2. Leaderboard payload
      try {
        const payload = {
          gameId: 'contract-red-flags',
          uid: userStats.uid,
          username: userStats.displayName || auth.currentUser?.email?.split('@')[0] || 'Unknown',
          score: finalScore,
          caseId: selectedCase.id!,
          caseTitle: selectedCase.title,
          stars: earnedStars,
          flagsFound: flagsFoundCount,
          totalFlags: totalFlagsCount,
          missingItemsCorrect: correctMissingCount,
          totalMissingItems: totalTrueMissing,
          wrongTaps,
          wrongTicks: wrongMissingCount,
          hintsUsed,
          verdictCorrect: isVerdictCorrect,
          timeRemaining: secondsLeft,
          course: activeCourse,
          timestamp: serverTimestamp()
        };

        await addDoc(collection(db, 'contract_leaderboard'), payload);
        await addDoc(collection(db, 'minigame_leaderboard'), payload);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'contract_leaderboard');
      }
    };

    saveStatsAndXp();
  }, [phase, selectedCase?.id, flagsFoundCount, totalFlagsCount, correctMissingCount, totalTrueMissing, wrongTaps, wrongMissingCount, hintsUsed, isVerdictCorrect, finalScore, earnedStars, secondsLeft, activeCourse, userStats]);

  // Next case finder
  const handleNextCase = () => {
    if (!selectedCase) return;
    const currentIndex = cases.findIndex(c => c.id === selectedCase.id);
    const nextCase = cases[(currentIndex + 1) % cases.length];
    setSelectedCase(nextCase);
    setPhase('start');
  };

  // Lesson tips extraction
  const relevantTips = useMemo(() => {
    if (!selectedCase) return [];
    const categoriesPresent = new Set<ContractFlagCategory>();
    selectedCase.clauses.forEach(c => {
      if (c.flag) categoriesPresent.add(c.flag.category);
    });
    selectedCase.missingItems.forEach(item => {
      categoriesPresent.add(item);
    });

    return Array.from(categoriesPresent).map(cat => {
      const rawTip = LESSON_TIPS[cat] || 'Inspect employment agreements closely.';
      const { text: processedTip, isFallback } = replaceFiguresPlaceholders(rawTip, referenceFigures);
      const catConfig = CONTRACT_FLAG_CATEGORIES.find(c => c.id === cat);
      return {
        category: cat,
        label: catConfig?.label || cat,
        tip: processedTip,
        isFallback
      };
    });
  }, [selectedCase, referenceFigures]);

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] p-4 md:p-8 flex flex-col items-center">
      {/* Accessibility live region */}
      <div className="sr-only" aria-live="assertive" aria-atomic="true">
        {ariaAnnouncement}
      </div>

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {activeToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-5 z-50 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border text-sm font-bold backdrop-blur-md max-w-md ${
              activeToast.type === 'correct'
                ? 'bg-rose-950/90 text-rose-100 border-rose-500 shadow-rose-900/30'
                : activeToast.type === 'wrong'
                ? 'bg-red-950/90 text-red-100 border-red-500 shadow-red-900/30'
                : 'bg-zinc-900/90 text-zinc-100 border-zinc-700 shadow-black/40'
            }`}
          >
            {activeToast.type === 'correct' ? (
              <Flag size={18} className="text-rose-400 fill-rose-400 shrink-0" />
            ) : activeToast.type === 'wrong' ? (
              <XCircle size={18} className="text-red-400 shrink-0" />
            ) : (
              <Lightbulb size={18} className="text-amber-400 shrink-0" />
            )}
            <span className="flex-1">{activeToast.message}</span>
            <button 
              type="button"
              onClick={() => setActiveToast(null)} 
              className="text-zinc-400 hover:text-white p-1"
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header Bar */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-rose-500 transition-colors text-[var(--text-main)] cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Arcade Hub</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-rose-500/10 text-rose-500 border border-rose-500/20">
            <Scale size={14} />
            Contract Red Flags • {courseConfig.shortLabel}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* PHASE 0: START SCREEN                                     */}
      {/* ========================================================= */}
      {phase === 'start' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-3xl space-y-6"
        >
          {/* Hero Banner */}
          <div className="bg-[var(--bg-card)] p-6 md:p-10 rounded-[2.5rem] border border-[var(--border-color)] shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
            
            <div className="relative space-y-5">
              <div className="flex items-center gap-3">
                <span className="p-3 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
                  <FileWarning size={28} />
                </span>
                <div>
                  <span className="text-xs font-black uppercase tracking-widest text-rose-500">
                    Arcade Mini-Game • Module 5
                  </span>
                  <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-[var(--text-main)]">
                    Contract Red Flags
                  </h1>
                </div>
              </div>

              <p className="text-sm md:text-base text-[var(--text-muted)] leading-relaxed">
                Before you sign any employment offer, you must be able to spot unlawful terms, missing statutory clauses, and verbal traps that violate South African labour law.
              </p>

              {/* 3-Step Guide */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-1">
                  <div className="flex items-center gap-2 text-rose-500 font-black text-xs uppercase tracking-wider">
                    <span className="w-5 h-5 rounded-full bg-rose-500/20 flex items-center justify-center text-[10px]">1</span>
                    Scan Red Flags
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    Tap illegal, unfair or suspicious clauses before the scan timer runs out.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-1">
                  <div className="flex items-center gap-2 text-amber-500 font-black text-xs uppercase tracking-wider">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[10px]">2</span>
                    Check Missing
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    Tick mandatory terms that are required by the BCEA but missing here.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-1">
                  <div className="flex items-center gap-2 text-blue-500 font-black text-xs uppercase tracking-wider">
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px]">3</span>
                    Give Verdict
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    Decide: Sign it, Ask first for amendments, or Don't sign at all.
                  </p>
                </div>
              </div>

              {/* Legal Disclaimer */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-xs text-amber-600 dark:text-amber-400">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>
                  <strong>Legal Notice:</strong> This is an educational exercise, not legal advice. Always confirm current rules on <strong>labour.gov.za</strong>.
                </span>
              </div>
            </div>
          </div>

          {/* Case Picker & Details */}
          {loadingCases ? (
            <div className="p-8 text-center text-[var(--text-muted)]">
              Loading contract cases...
            </div>
          ) : cases.length === 0 ? (
            <div className="bg-[var(--bg-card)] p-8 rounded-3xl border border-[var(--border-color)] text-center space-y-3">
              <Scale size={36} className="mx-auto text-[var(--text-muted)]" />
              <h3 className="text-lg font-bold">No published contract cases yet</h3>
              <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto">
                Contract cases are being prepared by your instructor in the Admin Hub. Check back shortly!
              </p>
            </div>
          ) : (
            <div className="bg-[var(--bg-card)] p-6 md:p-8 rounded-[2.5rem] border border-[var(--border-color)] shadow-xl space-y-6">
              {/* Select Case Header / Switcher */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">
                    Select Agreement Case ({cases.length} available)
                  </span>
                  {selectedCase?.id && bestStarsMap[selectedCase.id] && (
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                      Best: {'⭐'.repeat(bestStarsMap[selectedCase.id])}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {cases.map((c, i) => {
                    const isCurrent = selectedCase?.id === c.id;
                    const stars = c.id ? bestStarsMap[c.id] || 0 : 0;
                    return (
                      <button
                        key={c.id || i}
                        type="button"
                        onClick={() => setSelectedCase(c)}
                        className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                          isCurrent
                            ? 'bg-rose-500/10 border-rose-500 text-[var(--text-main)] shadow-sm'
                            : 'bg-[var(--bg-surface)] border-[var(--border-color)] text-[var(--text-muted)] hover:border-slate-400'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-rose-500">
                            Case #{i + 1}
                          </span>
                          {stars > 0 && (
                            <span className="text-xs font-bold text-amber-400">
                              {'★'.repeat(stars)}
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-bold line-clamp-1 text-[var(--text-main)]">
                          {c.title}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mt-1">
                          {c.difficulty} • {c.timeLimitSeconds || 90}s
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Case Summary Card */}
              {selectedCase && (
                <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-lg font-black text-[var(--text-main)]">
                      {selectedCase.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        selectedCase.difficulty === 'easy'
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          : selectedCase.difficulty === 'hard'
                          ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                          : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      }`}>
                        {selectedCase.difficulty}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center gap-1">
                        <Clock size={11} />
                        {selectedCase.timeLimitSeconds || 90}s Scan
                      </span>
                    </div>
                  </div>

                  {selectedCase.brief && (
                    <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs text-[var(--text-main)] italic">
                      "{selectedCase.brief}"
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-[var(--text-muted)] pt-1">
                    <span>{selectedCase.clauses.length} contract clauses to review</span>
                    <span>3 to 10 planted red flags</span>
                  </div>
                </div>
              )}

              {/* Start Button */}
              <button
                type="button"
                onClick={handleStartGame}
                disabled={!selectedCase}
                className="w-full min-h-[52px] py-4 px-6 rounded-2xl font-black text-base uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99]"
              >
                <Play size={18} />
                <span>Begin Contract Review</span>
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* ========================================================= */}
      {/* PHASE 1: STEP 1 - SCAN RED FLAGS (TIMED)                  */}
      {/* ========================================================= */}
      {phase === 'scan' && selectedCase && (
        <div className="w-full max-w-4xl space-y-4">
          {/* Top Sticky Status Bar */}
          <div className="sticky top-2 z-40 bg-[var(--bg-card)]/95 backdrop-blur-md p-4 rounded-2xl border border-[var(--border-color)] shadow-xl flex flex-wrap items-center justify-between gap-3">
            {/* Step info */}
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 font-black text-xs flex items-center justify-center border border-rose-500/20">
                1/3
              </span>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">
                  Step 1: Scan Red Flags
                </span>
                <h3 className="text-sm font-bold text-[var(--text-main)] line-clamp-1">
                  {selectedCase.title}
                </h3>
              </div>
            </div>

            {/* Middle: Timer & Flags counter */}
            <div className="flex items-center gap-3">
              {/* Countdown pill */}
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono font-black text-xs border ${
                secondsLeft <= 15
                  ? 'bg-red-500/20 text-red-500 border-red-500 animate-pulse'
                  : 'bg-[var(--bg-surface)] text-[var(--text-main)] border-[var(--border-color)]'
              }`}>
                <Clock size={13} />
                <span>{secondsLeft}s</span>
              </div>

              {/* Progress counter */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-rose-500/10 text-rose-500 border border-rose-500/20">
                <Flag size={13} className="fill-rose-500" />
                <span>Flagged {flaggedClauseIds.size} of {totalFlagsCount}</span>
              </div>
            </div>

            {/* Right: Hint & Done early buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleUseHint}
                disabled={remainingHints <= 0}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  remainingHints > 0
                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/30 hover:bg-amber-500/20'
                    : 'bg-zinc-800 text-zinc-500 border-zinc-700 cursor-not-allowed opacity-50'
                }`}
                title="Reveals one unflagged clause with a 30-point score deduction"
              >
                <Lightbulb size={13} />
                <span>Hint ({remainingHints})</span>
              </button>

              <button
                type="button"
                onClick={() => advanceToMissingStep('done_button')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition-opacity cursor-pointer"
              >
                <span>Done Scan</span>
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Real-time Timer Progress Bar */}
            <div className="w-full bg-[var(--bg-surface)] h-1.5 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  secondsLeft <= 15 ? 'bg-red-500' : 'bg-rose-500'
                }`}
                style={{ width: `${(secondsLeft / (totalTimeSeconds || 90)) * 100}%` }}
              />
            </div>
          </div>

          {/* Interactive Contract Paper */}
          <ContractPaper
            clauses={selectedCase.clauses}
            title={selectedCase.title}
            mode="play"
            flaggedClauseIds={flaggedClauseIds}
            wrongClauseIds={wrongClauseIds}
            hintedClauseId={hintedClauseId}
            onClauseTap={handleClauseTap}
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* PHASE 2: STEP 2 - MISSING REQUIRED TERMS (UNTIMED)        */}
      {/* ========================================================= */}
      {phase === 'missing' && selectedCase && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-3xl space-y-6"
        >
          {/* Header Card */}
          <div className="bg-[var(--bg-card)] p-6 md:p-8 rounded-[2.5rem] border border-[var(--border-color)] shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <ShieldCheck size={14} />
                Step 2 of 3 • Missing Required Terms
              </span>
              <span className="text-xs text-[var(--text-muted)] font-medium">
                Untimed • Take your time
              </span>
            </div>

            <h2 className="text-2xl font-black uppercase tracking-tight text-[var(--text-main)]">
              Which required terms are MISSING?
            </h2>

            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              Under South African labour law (BCEA Section 29), an employment contract must provide written particulars for key employment aspects. Tick every required item that is <strong>completely missing</strong> from this agreement.
            </p>

            {/* Collapsible Contract Drawer */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsContractDrawerOpen(!isContractDrawerOpen)}
                className="w-full p-3.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-amber-500 flex items-center justify-between text-xs font-bold text-[var(--text-main)] transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Eye size={15} className="text-amber-500" />
                  {isContractDrawerOpen ? 'Hide Contract Agreement' : 'Open Contract Agreement to Inspect'}
                </span>
                {isContractDrawerOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              <AnimatePresence>
                {isContractDrawerOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mt-3"
                  >
                    <div className="max-h-96 overflow-y-auto p-1 rounded-2xl border border-[var(--border-color)]">
                      <ContractPaper
                        clauses={selectedCase.clauses}
                        title={selectedCase.title}
                        mode="review"
                        flaggedClauseIds={flaggedClauseIds}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Missing Items Checklist */}
          <div className="bg-[var(--bg-card)] p-6 md:p-8 rounded-[2.5rem] border border-[var(--border-color)] shadow-xl space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-[var(--text-muted)]">
              Checklist of 7 Statutory Requirements
            </h3>

            <div className="space-y-3">
              {CONTRACT_REQUIRED_ITEMS.map((item) => {
                const isChecked = selectedMissingItems.has(item.key);
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => toggleMissingItem(item.key)}
                    className={`w-full p-4 rounded-2xl text-left border min-h-[56px] transition-all cursor-pointer flex items-center justify-between gap-4 select-none ${
                      isChecked
                        ? 'bg-amber-500/15 border-amber-500 text-[var(--text-main)] shadow-sm'
                        : 'bg-[var(--bg-surface)] border-[var(--border-color)] text-[var(--text-muted)] hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border transition-colors ${
                        isChecked 
                          ? 'bg-amber-500 border-amber-500 text-black' 
                          : 'border-slate-400 dark:border-zinc-600 bg-transparent'
                      }`}>
                        {isChecked && <Check size={14} className="stroke-[3]" />}
                      </div>
                      <div>
                        <span className="text-sm font-bold text-[var(--text-main)] block">
                          {item.label}
                        </span>
                        <span className="text-xs text-[var(--text-muted)] block mt-0.5">
                          {item.description}
                        </span>
                      </div>
                    </div>

                    <span className={`text-[10px] font-black uppercase tracking-wider shrink-0 px-2 py-0.5 rounded-md ${
                      isChecked ? 'bg-amber-500 text-black' : 'text-[var(--text-muted)]'
                    }`}>
                      {isChecked ? 'Flagged Missing' : 'Mark Missing'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Next Button */}
            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={advanceToVerdictStep}
                className="w-full sm:w-auto min-h-[48px] px-8 py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
              >
                <span>Proceed to Final Verdict</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ========================================================= */}
      {/* PHASE 3: STEP 3 - FINAL VERDICT (UNTIMED)                 */}
      {/* ========================================================= */}
      {phase === 'verdict' && selectedCase && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl space-y-6"
        >
          <div className="bg-[var(--bg-card)] p-6 md:p-10 rounded-[2.5rem] border border-[var(--border-color)] shadow-xl text-center space-y-4">
            <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-blue-500/10 text-blue-500 border border-blue-500/20">
              <Scale size={14} />
              Step 3 of 3 • Worker Recommendation
            </span>

            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-[var(--text-main)]">
              What is your final verdict?
            </h2>

            <p className="text-sm text-[var(--text-muted)] max-w-lg mx-auto">
              Based on the red flags you discovered ({flaggedClauseIds.size} flagged) and the missing terms you found ({selectedMissingItems.size} missing), what should the job seeker do?
            </p>
          </div>

          {/* 3 Verdict Choice Cards */}
          <div className="space-y-3.5">
            {/* Sign It */}
            <button
              type="button"
              onClick={() => handleSelectVerdict('sign')}
              className="w-full p-5 md:p-6 rounded-3xl bg-[var(--bg-card)] border-2 border-emerald-500/30 hover:border-emerald-500 hover:bg-emerald-500/5 transition-all cursor-pointer text-left flex items-start gap-4 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <CheckCircle2 size={24} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-[var(--text-main)] group-hover:text-emerald-500 transition-colors">
                    Sign it
                  </h3>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">
                    Compliant & Fair
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  The agreement complies with BCEA standards, contains no material red flags, and has all required statutory terms. Safe to accept and sign.
                </p>
              </div>
            </button>

            {/* Ask First */}
            <button
              type="button"
              onClick={() => handleSelectVerdict('ask-first')}
              className="w-full p-5 md:p-6 rounded-3xl bg-[var(--bg-card)] border-2 border-amber-500/30 hover:border-amber-500 hover:bg-amber-500/5 transition-all cursor-pointer text-left flex items-start gap-4 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <AlertTriangle size={24} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-[var(--text-main)] group-hover:text-amber-500 transition-colors">
                    Ask first
                  </h3>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500">
                    Clarify Before Signing
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Key terms are missing, vague or contradict what was promised verbally. The employee should ask for written clarification or addenda before putting pen to paper.
                </p>
              </div>
            </button>

            {/* Don't Sign */}
            <button
              type="button"
              onClick={() => handleSelectVerdict('dont-sign')}
              className="w-full p-5 md:p-6 rounded-3xl bg-[var(--bg-card)] border-2 border-rose-500/30 hover:border-rose-500 hover:bg-rose-500/5 transition-all cursor-pointer text-left flex items-start gap-4 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <ShieldAlert size={24} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-[var(--text-main)] group-hover:text-rose-500 transition-colors">
                    Don't sign
                  </h3>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500">
                    Unlawful / Dangerous
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Contains illegal provisions (e.g. pay below minimum wage, waiver of statutory rights, illegal deductions, or extreme penalties). Reject or insist on removal of unlawful clauses.
                </p>
              </div>
            </button>
          </div>
        </motion.div>
      )}

      {/* ========================================================= */}
      {/* PHASE 4: RESULT SCREEN                                    */}
      {/* ========================================================= */}
      {phase === 'result' && selectedCase && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-3xl space-y-6"
        >
          {/* Main Score & Star Banner */}
          <div className="bg-[var(--bg-card)] p-6 md:p-10 rounded-[2.5rem] border border-[var(--border-color)] shadow-2xl text-center space-y-4 relative overflow-hidden">
            <div className="flex justify-center gap-2 text-4xl">
              {[1, 2, 3].map((starNum) => (
                <span
                  key={starNum}
                  className={starNum <= earnedStars ? 'text-amber-400 drop-shadow-md' : 'text-slate-300 dark:text-zinc-700'}
                >
                  ★
                </span>
              ))}
            </div>

            <div className="space-y-1">
              <span className="text-xs font-black uppercase tracking-widest text-rose-500">
                Case Complete • {selectedCase.title}
              </span>
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-[var(--text-main)]">
                {finalScore} <span className="text-rose-500 text-2xl font-bold">PTS</span>
              </h2>
            </div>

            {/* XP Award Banner */}
            <div className="flex justify-center">
              {isReplay ? (
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black bg-zinc-800 text-zinc-300 border border-zinc-700">
                  <RotateCcw size={13} />
                  Replay — XP already awarded for this case
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black bg-amber-500/20 text-amber-500 border border-amber-500/30 animate-bounce">
                  <Award size={14} />
                  +{xpAwarded ?? 0} XP Earned!
                </span>
              )}
            </div>

            {/* High-level performance metric */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4">
              <div className="p-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)]">
                <span className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-wider block">
                  Red Flags
                </span>
                <span className="text-base font-black text-rose-500">
                  {flagsFoundCount}/{totalFlagsCount}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)]">
                <span className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-wider block">
                  Missing Terms
                </span>
                <span className="text-base font-black text-amber-500">
                  {correctMissingCount}/{totalTrueMissing}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)]">
                <span className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-wider block">
                  Verdict
                </span>
                <span className={`text-base font-black ${isVerdictCorrect ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {isVerdictCorrect ? 'Correct' : 'Incorrect'}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)]">
                <span className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-wider block">
                  Wrong Taps / Ticks
                </span>
                <span className="text-base font-black text-[var(--text-main)]">
                  {wrongTaps + wrongMissingCount}
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Score Calculation Breakdown */}
          <div className="bg-[var(--bg-card)] p-6 md:p-8 rounded-[2.5rem] border border-[var(--border-color)] shadow-xl space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">
              Score Calculation Breakdown
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-[var(--border-color)]">
                <span className="text-[var(--text-muted)]">
                  Red Flags Found ({flagsFoundCount} × 100)
                </span>
                <span className="font-bold text-emerald-500">+{flagsScore} pts</span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-[var(--border-color)]">
                <span className="text-[var(--text-muted)]">
                  Missing Terms Identified ({correctMissingCount} × 100)
                </span>
                <span className="font-bold text-emerald-500">+{missingScore} pts</span>
              </div>

              {wrongTapsPenalty > 0 && (
                <div className="flex justify-between items-center py-1.5 border-b border-[var(--border-color)]">
                  <span className="text-[var(--text-muted)]">
                    Wrong Clause Taps ({wrongTaps} × 25)
                  </span>
                  <span className="font-bold text-rose-500">-{wrongTapsPenalty} pts</span>
                </div>
              )}

              {wrongMissingPenalty > 0 && (
                <div className="flex justify-between items-center py-1.5 border-b border-[var(--border-color)]">
                  <span className="text-[var(--text-muted)]">
                    Incorrect Missing Ticks ({wrongMissingCount} × 25)
                  </span>
                  <span className="font-bold text-rose-500">-{wrongMissingPenalty} pts</span>
                </div>
              )}

              {hintsPenalty > 0 && (
                <div className="flex justify-between items-center py-1.5 border-b border-[var(--border-color)]">
                  <span className="text-[var(--text-muted)]">
                    Hints Used ({hintsUsed} × 30)
                  </span>
                  <span className="font-bold text-amber-500">-{hintsPenalty} pts</span>
                </div>
              )}

              <div className="flex justify-between items-center py-1.5 border-b border-[var(--border-color)]">
                <span className="text-[var(--text-muted)]">
                  Final Verdict Accuracy ({isVerdictCorrect ? 'Correct: +50' : 'Wrong: +0'})
                </span>
                <span className={`font-bold ${isVerdictCorrect ? 'text-emerald-500' : 'text-zinc-500'}`}>
                  +{verdictBonus} pts
                </span>
              </div>

              {timeBonus > 0 && (
                <div className="flex justify-between items-center py-1.5 border-b border-[var(--border-color)]">
                  <span className="text-[var(--text-muted)]">
                    Time Bonus ({secondsLeft}s left × 2 pts)
                  </span>
                  <span className="font-bold text-emerald-500">+{timeBonus} pts</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 font-black text-sm text-[var(--text-main)]">
                <span>Total Score</span>
                <span className="text-rose-500">{finalScore} pts</span>
              </div>
            </div>
          </div>

          {/* Planted Red Flags Audit Review */}
          <div className="bg-[var(--bg-card)] p-6 md:p-8 rounded-[2.5rem] border border-[var(--border-color)] shadow-xl space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center justify-between">
              <span>Red Flags Audit</span>
              <span>{flagsFoundCount}/{totalFlagsCount} Found</span>
            </h3>

            <div className="space-y-3">
              {allFlags.map((flag, idx) => {
                const wasFound = flaggedClauseIds.has(flag.clauseId);
                const catLabel = CONTRACT_FLAG_CATEGORIES.find(c => c.id === flag.category)?.label || flag.category;
                return (
                  <div 
                    key={flag.clauseId || idx}
                    className={`p-4 rounded-2xl border text-xs space-y-2 ${
                      wasFound
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-100'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black uppercase tracking-wider flex items-center gap-1.5">
                        {wasFound ? (
                          <CheckCircle2 size={14} className="text-emerald-500" />
                        ) : (
                          <AlertTriangle size={14} className="text-amber-500" />
                        )}
                        {wasFound ? 'Found' : 'Missed'}: {catLabel}
                      </span>
                      {flag.heading && (
                        <span className="text-[10px] opacity-75 font-mono">{flag.heading}</span>
                      )}
                    </div>
                    <p className="italic opacity-90">"{flag.text}"</p>
                    <div className="p-2 rounded-xl bg-black/5 dark:bg-white/5 font-medium">
                      <strong>Why it is a red flag:</strong> {flag.reason}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Missing Terms Audit Review */}
          <div className="bg-[var(--bg-card)] p-6 md:p-8 rounded-[2.5rem] border border-[var(--border-color)] shadow-xl space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">
              Missing Terms Review
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {CONTRACT_REQUIRED_ITEMS.map((item) => {
                const isActuallyMissing = trueMissingItems.includes(item.key);
                const userTicked = selectedMissingItems.has(item.key);

                let badge = 'text-[var(--text-muted)] bg-[var(--bg-surface)]';
                let statusText = 'Present in agreement';

                if (isActuallyMissing && userTicked) {
                  badge = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
                  statusText = 'Correctly spotted missing';
                } else if (isActuallyMissing && !userTicked) {
                  badge = 'text-amber-500 bg-amber-500/10 border-amber-500/20';
                  statusText = 'Missed! Was missing';
                } else if (!isActuallyMissing && userTicked) {
                  badge = 'text-rose-500 bg-rose-500/10 border-rose-500/20';
                  statusText = 'False alarm: actually present';
                }

                return (
                  <div key={item.key} className={`p-3 rounded-2xl border ${badge} text-xs flex flex-col justify-between`}>
                    <span className="font-bold">{item.label}</span>
                    <span className="text-[10px] font-black uppercase tracking-wider mt-1">{statusText}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Verdict Evaluation Review */}
          <div className="bg-[var(--bg-card)] p-6 md:p-8 rounded-[2.5rem] border border-[var(--border-color)] shadow-xl space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">
              Verdict Analysis
            </h3>

            <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span>Your verdict: <strong className="uppercase">{chosenVerdict}</strong></span>
                <span>Correct verdict: <strong className="uppercase text-rose-500">{selectedCase.correctVerdict}</strong></span>
              </div>
              <p className="text-[var(--text-muted)] leading-relaxed">
                {selectedCase.correctVerdict === 'dont-sign'
                  ? 'This contract contained unlawful clauses (such as illegal deductions, sub-minimum wage or statutory waivers). Signing this would severely jeopardize your legal protections.'
                  : selectedCase.correctVerdict === 'ask-first'
                  ? 'While not necessarily malicious, this contract omitted mandatory particulars or left key provisions vague. A worker should request written clarification or an addendum first.'
                  : 'The contract contains all statutory basics and does not infringe on your worker rights under the BCEA.'}
              </p>
            </div>
          </div>

          {/* Lesson Tips with Dynamic Reference Figures */}
          <div className="bg-[var(--bg-card)] p-6 md:p-8 rounded-[2.5rem] border border-[var(--border-color)] shadow-xl space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
              <Lightbulb size={14} className="text-amber-500" />
              Lesson Tips & Statutory Rules
            </h3>

            <div className="space-y-3">
              {relevantTips.map((tipItem, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-xs space-y-1">
                  <span className="font-bold text-rose-500 block uppercase tracking-wider text-[10px]">
                    {tipItem.label}
                  </span>
                  <p className="text-[var(--text-main)] leading-relaxed">
                    {tipItem.tip}
                  </p>
                </div>
              ))}

              {/* Final Summary Tip */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 font-medium">
                <strong>Remember:</strong> {CONTRACT_FINAL_TIP}
              </div>

              {/* Statutory Footnote */}
              <div className="text-[11px] text-[var(--text-muted)] italic text-center pt-2 flex items-center justify-center gap-1.5">
                <Info size={12} />
                <span>
                  {replaceFiguresPlaceholders(CONTRACT_FOOTER_NOTE, referenceFigures).text}
                </span>
              </div>
            </div>
          </div>

          {/* Action Navigation Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleStartGame}
              className="w-full sm:flex-1 min-h-[48px] py-3.5 px-6 rounded-2xl font-black text-sm uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
            >
              <RotateCcw size={16} />
              <span>Play Case Again</span>
            </button>

            {cases.length > 1 && (
              <button
                type="button"
                onClick={handleNextCase}
                className="w-full sm:flex-1 min-h-[48px] py-3.5 px-6 rounded-2xl font-black text-sm uppercase tracking-wider bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-rose-500 text-[var(--text-main)] flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <span>Next Case</span>
                <ChevronRight size={16} />
              </button>
            )}

            <button
              type="button"
              onClick={onBack}
              className="w-full sm:w-auto min-h-[48px] py-3.5 px-6 rounded-2xl font-black text-sm uppercase tracking-wider bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-slate-400 text-[var(--text-muted)] cursor-pointer"
            >
              Back to Arcade
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ContractRedFlagsGame;
