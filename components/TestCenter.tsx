import React, { useState, useEffect } from 'react';
import { UserStats, ViewState, TestQuestion, Domain, CourseId } from '../types';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { doc, updateDoc, increment, arrayUnion, collection, onSnapshot, query } from 'firebase/firestore';
import { saveTestResult } from '../statsService';
import { ArrowLeft, Clock, Flag, CheckCircle2, XCircle, AlertCircle, BarChart3, RotateCcw, ShieldCheck, Cpu, Network, Menu, X, Loader2, BookOpen, Smartphone, Cloud, Settings as SettingsIcon, Shield, Layout } from 'lucide-react';
import { COMPTIA_DOMAINS } from '../constants';
import { getCourseConfig, filterByCourse, withCourse, resolveDomainTitle } from '../courseConfig';
import { motion, AnimatePresence } from 'motion/react';
import QuestionRenderer from './questions/QuestionRenderer';
import { isAnswerCorrect } from '../questionScoring';
import { scrollToTop } from '../scrollUtils';
import { NetworkBackdrop, GradientDrift, XPPop, CountUp } from '../animations';

interface TestCenterProps {
  userStats: UserStats;
  onBack: () => void;
  initialMode?: 'practice' | 'exam';
  activeCourse?: CourseId;
}

type ConfidenceLevel = 'Low' | 'Med' | 'High' | null;

interface AnswerState {
  value?: any;
  selectedOption: number | null;
  confidence: ConfidenceLevel;
  isCorrect: boolean | null;
}

const TestCenter: React.FC<TestCenterProps> = ({ userStats, onBack, initialMode = 'practice', activeCourse = 'a-plus' }) => {
  const [mode, setMode] = useState<'practice' | 'exam' | 'setup' | 'domain-drill'>(initialMode === 'practice' ? 'setup' : 'exam');
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(90 * 60); // 90 minutes for exam
  const [isFinished, setIsFinished] = useState(false);
  const [streak, setStreak] = useState(0);
  const [showStreakToast, setShowStreakToast] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [questionsError, setQuestionsError] = useState<string | null>(null);
  const [retryTrigger, setRetryTrigger] = useState(0);
  const [lastEarnedXp, setLastEarnedXp] = useState<number | null>(null);

  const courseConfig = getCourseConfig(activeCourse);
  const isNetworkPlus = activeCourse === 'network-plus';

  const displayQuestions = React.useMemo(() => {
    if (selectedDomain) {
      return questions.filter(q => {
        if (q.domain === selectedDomain) return true;
        const matched = courseConfig.domains.find(d => d.id === selectedDomain || d.title === selectedDomain);
        if (matched) {
          return q.domain === matched.id || q.domain === matched.title;
        }
        return false;
      });
    }
    return questions;
  }, [questions, selectedDomain, courseConfig.domains]);

  useEffect(() => {
    setLoadingQuestions(true);
    setQuestionsError(null);
    const q = query(collection(db, 'test_questions'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedQuestions = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as TestQuestion));
      const courseQuestions = filterByCourse(fetchedQuestions, activeCourse);
      setQuestions(courseQuestions);
      setQuestionsError(null);
      setLoadingQuestions(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'test_questions');
      setQuestions([]);
      setQuestionsError("Couldn't load questions, try again");
      setLoadingQuestions(false);
    });

    return () => unsubscribe();
  }, [activeCourse, retryTrigger]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (mode === 'exam' && !isFinished && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [mode, isFinished, timeLeft]);

  // Always reset scroll to top on test mode, question, or review view changes
  useEffect(() => {
    scrollToTop();
  }, [mode, isFinished, reviewMode, currentQuestionIndex]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentQ = displayQuestions[currentQuestionIndex];
  const currentAnswer = currentQ ? (answers[currentQ.id] || { value: undefined, selectedOption: null, confidence: null, isCorrect: null }) : { value: undefined, selectedOption: null, confidence: null, isCorrect: null };
  const currentAnswerValue = currentAnswer.value !== undefined ? currentAnswer.value : currentAnswer.selectedOption;
  const isCurrentAnswered = currentAnswerValue !== undefined && currentAnswerValue !== null;

  const handleAnswer = (answerVal: any, isSubmit: boolean = false) => {
    if (!currentQ) return;
    const isAnsweredAlready = currentAnswer.value !== undefined && currentAnswer.value !== null && currentAnswer.isCorrect !== null;
    if (isAnsweredAlready && mode === 'practice' && !reviewMode) return; // Locked in practice mode
    if (reviewMode) return;

    const correct = isAnswerCorrect(currentQ, answerVal);
    const isInstantType = !currentQ.type || currentQ.type === 'choice' || currentQ.type === 'image';
    const shouldGradeNow = mode === 'practice' && (isInstantType || isSubmit);

    setAnswers(prev => ({
      ...prev,
      [currentQ.id]: {
        ...prev[currentQ.id],
        value: answerVal,
        selectedOption: typeof answerVal === 'number' ? answerVal : null,
        isCorrect: shouldGradeNow ? correct : (prev[currentQ.id]?.isCorrect ?? null)
      }
    }));

    if (shouldGradeNow) {
      if (correct) {
        const newStreak = streak + 1;
        setStreak(newStreak);
        if (newStreak % 5 === 0) {
          setShowStreakToast(true);
          setTimeout(() => setShowStreakToast(false), 3000);
        }
      } else {
        setStreak(0);
      }
    }
  };

  const handleSelectOption = (optionIndex: number) => {
    handleAnswer(optionIndex, true);
  };

  const handleSetConfidence = (level: ConfidenceLevel) => {
    if (reviewMode || !currentQ) return;
    setAnswers(prev => ({
      ...prev,
      [currentQ.id]: {
        ...prev[currentQ.id],
        confidence: level
      }
    }));
  };

  const toggleFlag = () => {
    if (!currentQ) return;
    setFlagged(prev => ({ ...prev, [currentQ.id]: !prev[currentQ.id] }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < displayQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsFinished(true);
    setReviewMode(false);
    
    // Calculate score using pure all-or-nothing isAnswerCorrect function
    let correctCount = 0;
    const answersMap: Record<string, any> = {};

    displayQuestions.forEach(q => {
      const ans = answers[q.id];
      const val = ans ? (ans.value !== undefined ? ans.value : ans.selectedOption) : null;
      answersMap[q.id] = val;
      if (ans && isAnswerCorrect(q, val)) {
        correctCount++;
      }
    });

    const scorePercentage = Math.round((correctCount / displayQuestions.length) * 100);
    const passed = scorePercentage >= 75;

    const earnedXp = mode === 'exam' ? correctCount * 10 : correctCount * 5;
    if (earnedXp > 0) {
      setLastEarnedXp(earnedXp);
    } else {
      setLastEarnedXp(null);
    }

    // Save to Firestore if exam mode
    if (mode === 'exam' && auth.currentUser) {
      try {
        await saveTestResult(withCourse({
          objectiveId: 'exam-simulation',
          score: scorePercentage,
          percentage: scorePercentage,
          totalQuestions: displayQuestions.length,
          correctAnswers: correctCount,
          answers: answersMap,
          type: 'Exam Simulation',
          subject: 'Mixed',
          xpEarned: earnedXp,
          passed: passed
        }, activeCourse));
      } catch (err) {
        console.error("Failed to save exam results", err);
      }
    } else if (mode === 'practice' && auth.currentUser) {
      try {
        await saveTestResult(withCourse({
          objectiveId: selectedDomain ? `drill-${selectedDomain.toLowerCase().replace(/\s+/g, '-')}` : 'practice-session',
          score: scorePercentage,
          percentage: scorePercentage,
          totalQuestions: displayQuestions.length,
          correctAnswers: correctCount,
          answers: answersMap,
          type: selectedDomain ? 'Domain Drill' : 'Practice Session',
          subject: selectedDomain || 'Mixed',
          xpEarned: earnedXp,
          passed: passed
        }, activeCourse));
      } catch (err) {
        console.error("Failed to save practice results", err);
      }
    }
  };

  const getCategoryStats = () => {
    const stats: Record<string, { total: number, correct: number }> = {};

    displayQuestions.forEach(q => {
      const domainName = resolveDomainTitle(q.domain, courseConfig.domains) || q.domain || 'General';
      if (!stats[domainName]) {
        stats[domainName] = { total: 0, correct: 0 };
      }
      stats[domainName].total++;
      const ans = answers[q.id];
      const val = ans ? (ans.value !== undefined ? ans.value : ans.selectedOption) : null;
      if (ans && isAnswerCorrect(q, val)) {
        stats[domainName].correct++;
      }
    });

    return stats;
  };

  const startDomainDrill = (domainTitle: string) => {
    setSelectedDomain(domainTitle);
    setMode('practice');
    setCurrentQuestionIndex(0);
    setAnswers({});
  };

  if (loadingQuestions) {
    return (
      <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] flex flex-col items-center justify-center p-6">
        <Loader2 className="w-10 h-10 animate-spin mb-4" style={{ color: courseConfig.accentHex }} />
        <p className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">Loading questions...</p>
      </div>
    );
  }

  if (questionsError) {
    return (
      <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] flex items-center justify-center p-6">
        <div className="bg-[var(--bg-card)] p-8 md:p-10 rounded-3xl max-w-md w-full border border-[var(--border-color)] shadow-2xl text-center">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
          <h2 className="text-xl font-black uppercase tracking-tight text-[var(--text-main)] mb-2">Couldn't load questions, try again</h2>
          <p className="text-sm text-[var(--text-muted)] mb-6">There was a problem loading the questions from Firestore. Please check your connection and retry.</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setLoadingQuestions(true);
                setQuestionsError(null);
                setRetryTrigger(prev => prev + 1);
              }}
              className="px-6 py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs text-white transition-opacity hover:opacity-90 shadow-sm"
              style={{ backgroundColor: courseConfig.accentHex }}
            >
              Retry
            </button>
            <button
              onClick={onBack}
              className="px-6 py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-white border border-[var(--border-color)] transition-colors shadow-sm"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] flex items-center justify-center p-6">
        <div className="bg-[var(--bg-card)] p-8 md:p-10 rounded-3xl max-w-md w-full border border-[var(--border-color)] shadow-2xl text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-4" style={{ color: courseConfig.accentHex }} />
          <h2 className="text-xl font-black uppercase tracking-tight text-[var(--text-main)] mb-2">No questions available yet</h2>
          <p className="text-sm text-[var(--text-muted)] mb-6">There are currently no test questions uploaded for {courseConfig.name}. Please check back later or contact an administrator.</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setLoadingQuestions(true);
                setQuestionsError(null);
                setRetryTrigger(prev => prev + 1);
              }}
              className="px-6 py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs text-white transition-opacity hover:opacity-90 shadow-sm"
              style={{ backgroundColor: courseConfig.accentHex }}
            >
              Retry
            </button>
            <button
              onClick={onBack}
              className="px-6 py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-white border border-[var(--border-color)] transition-colors shadow-sm"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (displayQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] flex items-center justify-center p-6">
        <div className="bg-[var(--bg-card)] p-8 md:p-10 rounded-3xl max-w-md w-full border border-[var(--border-color)] shadow-2xl text-center">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-black uppercase tracking-tight text-[var(--text-main)] mb-2">No questions available yet</h2>
          <p className="text-sm text-[var(--text-muted)] mb-6">No questions found for the domain &quot;{selectedDomain}&quot;.</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setSelectedDomain(null);
                setMode('setup');
              }}
              className="px-6 py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs text-white transition-opacity hover:opacity-90 shadow-sm"
              style={{ backgroundColor: courseConfig.accentHex }}
            >
              Choose Domain
            </button>
            <button
              onClick={onBack}
              className="px-6 py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-white border border-[var(--border-color)] transition-colors shadow-sm"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'setup') {
    return (
      <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] flex items-center justify-center p-6 overflow-y-auto">
        <div className="saas-hero-card p-8 md:p-12 rounded-[2rem] max-w-4xl w-full my-12 relative overflow-hidden">
          <div className="portal-ray-core" />
          <NetworkBackdrop accentColor="#818cf8" />
          <GradientDrift primaryColor="#4f46e5" secondaryColor="#818cf8" />
          <div className="relative z-10 flex justify-between items-center mb-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider px-3.5 py-1 rounded-full bg-indigo-500/15 text-indigo-200 border border-indigo-300/30">
                  {courseConfig.name} ({courseConfig.badgeLabel})
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
                Test <span className="saas-gradient-word">Center</span>
              </h1>
            </div>
            <button onClick={onBack} className="btn-soft px-4 h-[38px] text-xs uppercase tracking-wider">
              Cancel
            </button>
          </div>

          <div className="relative z-10 grid md:grid-cols-2 gap-6 mb-12">
            <button 
              onClick={() => setMode('practice')}
              className="saas-glass-card p-8 rounded-3xl text-left group relative overflow-hidden cursor-pointer"
            >
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <CheckCircle2 size={80} />
              </div>
              <div className="saas-squircle-outer mb-6 group-hover:scale-105 transition-transform">
                <div className="saas-squircle-inner">
                  <CheckCircle2 size={20} />
                </div>
              </div>
              <h2 className="text-xl font-extrabold text-[var(--text-main)] tracking-tight mb-2">Practice Mode</h2>
              <p className="text-[var(--text-muted)] text-sm leading-relaxed">Instant feedback, technical explanations, and streak tracking. Perfect for learning.</p>
            </button>
            <button 
              onClick={() => setMode('exam')}
              className="saas-glass-card p-8 rounded-3xl text-left group relative overflow-hidden cursor-pointer"
            >
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <Clock size={80} />
              </div>
              <div className="saas-squircle-outer mb-6 group-hover:scale-105 transition-transform">
                <div className="saas-squircle-inner">
                  <Clock size={20} />
                </div>
              </div>
              <h2 className="text-xl font-extrabold text-[var(--text-main)] tracking-tight mb-2">Exam Simulation</h2>
              <p className="text-[var(--text-muted)] text-sm leading-relaxed">Timed 90-minute full exam with 20 questions. Test your knowledge under realistic conditions.</p>
            </button>
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-black uppercase tracking-tight text-[var(--text-main)] flex items-center gap-3">
              <BarChart3 style={{ color: courseConfig.accentHex }} size={20} />
              Domain Specific <span style={{ color: courseConfig.accentHex }}>Drills</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {courseConfig.domains.map(domain => {
                let Icon = BookOpen;
                if (domain.title.includes('Mobile')) Icon = Smartphone;
                if (domain.title.includes('Networking')) Icon = Network;
                if (domain.title.includes('Hardware')) Icon = Cpu;
                if (domain.title.includes('Virtualization')) Icon = Cloud;
                if (domain.title.includes('Troubleshooting') || domain.title.includes('Operations')) Icon = SettingsIcon;
                if (domain.title.includes('Operating') || domain.title.includes('Implementation')) Icon = Layout;
                if (domain.title.includes('Security')) Icon = Shield;

                return (
                  <button 
                    key={domain.id}
                    onClick={() => startDomainDrill(domain.title)}
                    className="bg-[var(--bg-surface)] p-5 rounded-2xl border border-[var(--border-color)] hover:border-indigo-500/50 transition-all text-left group flex items-center gap-4 shadow-sm"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] group-hover:text-indigo-500 transition-colors shrink-0">
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] block mb-0.5">{domain.exam}</span>
                      <h4 className="text-sm font-bold text-[var(--text-main)] group-hover:text-indigo-500 transition-colors truncate">{domain.title}</h4>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isFinished && !reviewMode) {
    const stats = getCategoryStats();
    let correctCount = 0;
    Object.values(stats).forEach(s => correctCount += s.correct);
    const scorePercentage = Math.round((correctCount / displayQuestions.length) * 100);
    const passed = scorePercentage >= 75;

    return (
      <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] p-4 md:p-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[var(--bg-card)] rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 border border-[var(--border-color)] shadow-2xl relative overflow-hidden">
            <div 
              className="absolute top-0 left-0 w-full h-2" 
              style={{ backgroundColor: passed ? '#22c55e' : courseConfig.accentHex }}
            />
            
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 mb-8 md:mb-12">
              {/* Circular Progress */}
              <div className="relative w-32 h-32 md:w-48 md:h-48 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" className="text-[var(--border-color)]" strokeWidth="10" />
                  <circle 
                    cx="50" cy="50" r="45" fill="none" 
                    stroke={passed ? "#22C55E" : courseConfig.accentHex} 
                    strokeWidth="10" 
                    strokeDasharray={`${scorePercentage * 2.83} 283`}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl md:text-5xl font-black tracking-tighter text-[var(--text-main)] font-mono">
                    <CountUp value={scorePercentage} suffix="%" />
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-bold mt-1">Score</span>
                </div>
              </div>

              <div>
                {lastEarnedXp && (
                  <div className="mb-3">
                    <XPPop amount={lastEarnedXp} />
                  </div>
                )}
                <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-3 text-[var(--text-main)]">
                  {passed ? 'Exam Passed' : 'Exam Failed'}
                </h1>
                <p className="text-[var(--text-muted)] text-base md:text-lg mb-6 leading-relaxed">
                  You answered {correctCount} out of {displayQuestions.length} questions correctly. 
                  {passed ? ' Great job! You are ready for the real thing.' : ' Keep studying and try again.'}
                </p>
                <div className="flex flex-wrap gap-4">
                  <button 
                    onClick={() => setReviewMode(true)}
                    className="bg-[var(--bg-surface)] hover:bg-white/10 text-[var(--text-main)] border border-[var(--border-color)] px-6 py-3 rounded-2xl font-black uppercase tracking-wider text-xs transition-colors shadow-sm"
                  >
                    Review Mode
                  </button>
                  <button 
                    onClick={onBack}
                    style={{ backgroundColor: courseConfig.accentHex }}
                    className="text-white px-6 py-3 rounded-2xl font-black uppercase tracking-wider text-xs transition-all hover:brightness-110 shadow-lg"
                  >
                    Exit to Dashboard
                  </button>
                </div>
              </div>
            </div>

            <h3 className="text-lg font-black uppercase tracking-tight mb-6 border-b border-[var(--border-color)] pb-3 text-[var(--text-main)]">Category Breakdown</h3>
            <div className="space-y-6">
              {Object.entries(stats).map(([category, data]) => {
                const percent = Math.round((data.correct / data.total) * 100) || 0;
                let icon = <Cpu className="w-5 h-5" />;
                if (category === 'Networking') icon = <Network className="w-5 h-5" />;
                if (category === 'Security') icon = <ShieldCheck className="w-5 h-5" />;

                return (
                  <div key={category}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-300">
                        {icon} {category}
                      </div>
                      <span className="text-sm font-black">{data.correct}/{data.total} ({percent}%)</span>
                    </div>
                    <div className="h-3 bg-black rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${percent >= 75 ? 'bg-green-500' : percent >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).filter(k => {
    const a = answers[k];
    return a && ((a.value !== undefined && a.value !== null) || (a.selectedOption !== null && a.selectedOption !== undefined));
  }).length;

  if (loadingQuestions) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <Loader2 className="text-red-600 animate-spin" size={48} />
      </div>
    );
  }

  if (displayQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-[#141414] flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className={courseConfig.textColor} size={64} />
        <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">
          {activeCourse !== 'a-plus' ? `No ${courseConfig.name} questions yet` : 'No Questions Found'}
        </h2>
        <p className="text-gray-400 mb-8 max-w-md">
          {activeCourse !== 'a-plus' 
            ? `Practice questions and exam simulations for ${courseConfig.name} will be added soon.` 
            : "We couldn't find any questions for the selected domain. Please try a different domain or check back later."}
        </p>
        <button 
          onClick={() => { setMode('setup'); setSelectedDomain(null); }}
          style={{ backgroundColor: courseConfig.accentHex }}
          className="text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-sm transition-opacity hover:opacity-90"
        >
          Back to Setup
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-[var(--bg-surface)] border-b border-[var(--border-color)] h-16 flex items-center justify-between px-4 md:px-6 shadow-sm">
        <div className="flex items-center gap-3 md:gap-4">
          <button className="lg:hidden text-[var(--text-muted)] hover:text-[var(--text-main)]" onClick={() => setIsDrawerOpen(true)}>
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-3">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs text-white shadow-sm"
              style={{ backgroundColor: courseConfig.accentHex }}
            >
              {courseConfig.shortLabel}
            </div>
            <span 
              className="font-black text-sm md:text-base tracking-tight uppercase"
              style={{ color: courseConfig.accentHex }}
            >
              {courseConfig.name} • Test Center
            </span>
          </div>
          <div className="hidden md:block w-px h-5 bg-[var(--border-color)]" />
          <span className="hidden md:inline text-[var(--text-muted)] font-bold uppercase tracking-wider text-xs">
            {mode === 'practice' ? 'Practice Drill' : 'Exam Simulation'} {reviewMode && '(Review)'}
          </span>
        </div>
        <div className="flex items-center gap-4 md:gap-6">
          {mode === 'exam' && !reviewMode && (
            <div className={`flex items-center gap-2 font-mono font-black text-base ${timeLeft < 300 ? 'text-rose-500 animate-pulse' : 'text-[var(--text-main)]'}`}>
              <Clock size={16} />
              {formatTime(timeLeft)}
            </div>
          )}
          <button onClick={onBack} className="text-[var(--text-muted)] hover:text-[var(--text-main)] uppercase tracking-wider text-xs font-black transition-colors">
            Exit
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar Content Render Function */}
        {(() => {
          const SidebarContent = () => (
            <>
              <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center lg:block bg-[var(--bg-surface)]">
                <div className="w-full">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Progress</span>
                    <span className="text-sm font-black text-[var(--text-main)] font-mono">{answeredCount}/{displayQuestions.length}</span>
                  </div>
                  <div className="h-2 bg-[var(--bg-card)] rounded-full overflow-hidden border border-[var(--border-color)]">
                    <div 
                      className="h-full transition-all duration-500 rounded-full" 
                      style={{ 
                        width: `${(answeredCount / displayQuestions.length) * 100}%`,
                        backgroundColor: courseConfig.accentHex 
                      }} 
                    />
                  </div>
                </div>
                <button className="lg:hidden ml-4 text-[var(--text-muted)] hover:text-[var(--text-main)] shrink-0" onClick={() => setIsDrawerOpen(false)}>
                  <X size={22} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-[var(--bg-surface)]">
                <div className="flex flex-wrap gap-2 md:gap-3 justify-center">
                  {displayQuestions.map((q, i) => {
                    const isCurrent = i === currentQuestionIndex;
                    const ans = answers[q.id];
                    const val = ans ? (ans.value !== undefined ? ans.value : ans.selectedOption) : null;
                    const isAnswered = val !== undefined && val !== null;
                    const isFlagged = flagged[q.id];
                    
                    let bgColor = 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-muted)]';
                    if (isCurrent) bgColor = 'border-indigo-500 bg-indigo-500/15 text-indigo-400 shadow-md font-bold';
                    else if (isAnswered) {
                      if (reviewMode || mode === 'practice') {
                        if (isAnswerCorrect(q, val)) bgColor = 'bg-emerald-500/15 border-emerald-500 text-emerald-400 font-bold';
                        else bgColor = 'bg-rose-500/15 border-rose-500 text-rose-400 font-bold';
                      } else {
                        bgColor = 'bg-[var(--bg-card)] border-indigo-400 text-[var(--text-main)] font-bold';
                      }
                    }

                    return (
                      <button
                        key={q.id}
                        onClick={() => { setCurrentQuestionIndex(i); setIsDrawerOpen(false); }}
                        className={`relative w-10 h-10 md:w-11 md:h-11 rounded-xl border flex items-center justify-center font-black text-xs transition-all hover:scale-105 ${bgColor}`}
                      >
                        {i + 1}
                        {isFlagged && (
                          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-[var(--bg-card)]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          );

          return (
            <>
              {/* Desktop Sidebar */}
              <aside className="w-[250px] bg-[var(--bg-surface)] border-r border-[var(--border-color)] flex-col hidden lg:flex shrink-0">
                <SidebarContent />
              </aside>

              {/* Mobile Drawer */}
              <AnimatePresence>
                {isDrawerOpen && (
                  <>
                    <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="fixed inset-0 bg-black/70 z-[60] lg:hidden backdrop-blur-sm" 
                      onClick={() => setIsDrawerOpen(false)} 
                    />
                    <motion.aside 
                      initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                      transition={{ type: 'tween', duration: 0.3 }}
                      className="fixed inset-y-0 left-0 w-72 bg-[var(--bg-surface)] border-r border-[var(--border-color)] flex flex-col z-[70] lg:hidden shadow-2xl"
                    >
                      <SidebarContent />
                    </motion.aside>
                  </>
                )}
              </AnimatePresence>
            </>
          );
        })()}

        {/* Main Focus Area & Footer Wrapper */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 bg-[var(--bg-app)] relative">
          <AnimatePresence mode="wait">
            <motion.div 
              key={currentQ.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="max-w-3xl mx-auto"
            >
              <QuestionRenderer
                question={currentQ}
                questionNumber={currentQuestionIndex + 1}
                totalQuestions={displayQuestions.length}
                value={currentAnswerValue}
                onChange={(val) => handleAnswer(val, false)}
                onSubmitAnswer={() => handleAnswer(currentAnswerValue, true)}
                mode={mode}
                reviewMode={reviewMode}
                isAnswered={isCurrentAnswered}
                isCorrect={currentAnswer.isCorrect}
                accentColor={courseConfig.accentHex}
              />

              {/* Confidence Selector */}
              {isCurrentAnswered && !reviewMode && (
                <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border-color)] animate-in fade-in slide-in-from-bottom-4 shadow-sm">
                  <p className="text-center text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4">
                    Confidence Level
                  </p>
                  <div className="flex justify-center gap-3">
                    {(['Low', 'Med', 'High'] as ConfidenceLevel[]).map(level => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => handleSetConfidence(level)}
                        className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          currentAnswer.confidence === level
                            ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-md shadow-[var(--accent-glow)]'
                            : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:text-[var(--text-main)]'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Technical Explanation Panel (Practice Mode or Review Mode) */}
              {((mode === 'practice' && isCurrentAnswered) || reviewMode) && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl p-6 border ${
                    currentAnswer.isCorrect
                      ? 'bg-emerald-500/10 border-emerald-500/30' 
                      : 'bg-rose-500/10 border-rose-500/30'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    {currentAnswer.isCorrect ? (
                      <CheckCircle2 className="text-emerald-500 w-5 h-5 shrink-0" />
                    ) : (
                      <XCircle className="text-rose-500 w-5 h-5 shrink-0" />
                    )}
                    <h3 className="text-base font-bold tracking-tight text-[var(--text-main)]">Technical Explanation</h3>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed font-normal">{currentQ.explanation}</p>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Bottom Action Bar */}
        <footer className="sticky bottom-0 z-50 bg-[var(--bg-card)]/95 backdrop-blur-md border-t border-[var(--border-color)] p-4 px-4 md:px-6 flex justify-between items-center shadow-lg">
          <button 
            onClick={handlePrev}
            disabled={currentQuestionIndex === 0}
            className="px-4 md:px-6 py-2.5 rounded-xl font-bold uppercase tracking-wider text-[11px] md:text-xs transition-colors disabled:opacity-30 disabled:cursor-not-allowed bg-[var(--bg-panel)] hover:bg-[var(--hover-bg)] text-[var(--text-main)] border border-[var(--border-color)]"
          >
            Prev<span className="hidden sm:inline">ious</span>
          </button>
          
          <button 
            onClick={toggleFlag}
            className={`flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-xl font-bold uppercase tracking-wider text-[11px] md:text-xs transition-colors border ${
              flagged[currentQ.id] 
                ? 'bg-amber-500/15 border-amber-500 text-amber-500' 
                : 'bg-[var(--bg-panel)] border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:text-[var(--text-main)]'
            }`}
          >
            <Flag size={15} /> <span className="hidden sm:inline">{flagged[currentQ.id] ? 'Flagged' : 'Flag for Review'}</span>
          </button>

          {currentQuestionIndex === displayQuestions.length - 1 ? (
            <button 
              onClick={handleSubmit}
              className="px-6 md:px-8 py-2.5 rounded-xl font-bold uppercase tracking-wider text-[11px] md:text-xs transition-all bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30"
            >
              Submit<span className="hidden sm:inline"> Exam</span>
            </button>
          ) : (
            <button 
              onClick={handleNext}
              className="px-6 md:px-8 py-2.5 rounded-xl font-bold uppercase tracking-wider text-[11px] md:text-xs transition-colors bg-[var(--accent)] text-white hover:opacity-90 shadow-md shadow-[var(--accent-glow)]"
            >
              Next
            </button>
          )}
        </footer>
      </div>
    </div>

    {/* Streak Toast */}
      <AnimatePresence>
        {showStreakToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] bg-green-500 text-black px-6 py-3 rounded-full font-black uppercase tracking-widest text-sm shadow-[0_0_30px_rgba(34,197,94,0.5)] flex items-center gap-3"
          >
            🔥 {streak} Correct Streak!
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}} />
    </div>
  );
};

export default TestCenter;
