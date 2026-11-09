import React, { useState } from 'react';
import { QuizLessonSection } from '../../types';
import { 
  CheckCircle2, 
  XCircle, 
  Award, 
  Sparkles, 
  RotateCcw, 
  HelpCircle,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface KnowledgeCheckProps {
  section: QuizLessonSection;
  onLessonCompleted?: (earnedXp: number) => void;
  isAlreadyCompleted?: boolean;
}

export const KnowledgeCheck: React.FC<KnowledgeCheckProps> = ({
  section,
  onLessonCompleted,
  isAlreadyCompleted = false
}) => {
  const { quizTitle, passThresholdPercent, questions, xpReward } = section;
  
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [claimedReward, setClaimedReward] = useState<boolean>(isAlreadyCompleted);

  const handleSelectAnswer = (qIdx: number, optionIdx: number) => {
    if (submitted) return;
    setUserAnswers(prev => ({
      ...prev,
      [qIdx]: optionIdx
    }));
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctAnswer) {
        correct += 1;
      }
    });
    return correct;
  };

  const handleSubmit = () => {
    setSubmitted(true);
    const score = calculateScore();
    const percent = Math.round((score / questions.length) * 100);

    if (percent >= passThresholdPercent) {
      try {
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
      } catch {
        // ignore
      }
    }
  };

  const handleClaim = () => {
    setClaimedReward(true);
    if (onLessonCompleted) {
      onLessonCompleted(xpReward);
    }
  };

  const handleRetry = () => {
    setUserAnswers({});
    setSubmitted(false);
  };

  const score = calculateScore();
  const percentage = Math.round((score / questions.length) * 100);
  const passed = percentage >= passThresholdPercent;
  const allAnswered = questions.every((_, idx) => userAnswers[idx] !== undefined);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Quiz Banner */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
              <Award size={12} />
              CompTIA Formative Assessment
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Pass Mark: {passThresholdPercent}%
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight mt-1">
            {quizTitle}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Validate your mastery of hardware components, teardown safety, and troubleshooting protocols.
          </p>
        </div>

        <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-center shrink-0">
          <div className="text-[10px] font-mono uppercase text-slate-400">Lesson XP Reward</div>
          <div className="text-base font-black text-emerald-400">+{xpReward} XP</div>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-6">
        {questions.map((q, qIdx) => {
          const selected = userAnswers[qIdx];
          const isCorrect = selected === q.correctAnswer;

          return (
            <div 
              key={q.id}
              className={`bg-[var(--bg-card)] border rounded-2xl p-6 md:p-8 space-y-4 shadow-sm transition-colors ${
                submitted 
                  ? isCorrect 
                    ? 'border-emerald-500/50 bg-emerald-950/10' 
                    : 'border-rose-500/50 bg-rose-950/10'
                  : 'border-[var(--border-color)]'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-base md:text-lg font-black text-white leading-snug">
                  <span className="text-cyan-400 font-mono mr-2">Q{qIdx + 1}.</span>
                  {q.question}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 shrink-0">
                  {q.examObjectiveRef}
                </span>
              </div>

              {/* Options */}
              <div className="space-y-2.5 pt-2">
                {q.options.map((opt, optIdx) => {
                  const isThisSelected = selected === optIdx;
                  const isThisCorrect = optIdx === q.correctAnswer;

                  let optionStyle = 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700';

                  if (submitted) {
                    if (isThisCorrect) {
                      optionStyle = 'bg-emerald-950/40 border-emerald-500 text-emerald-200 font-bold';
                    } else if (isThisSelected && !isCorrect) {
                      optionStyle = 'bg-rose-950/40 border-rose-500 text-rose-200 line-through';
                    } else {
                      optionStyle = 'bg-slate-900/30 border-slate-800 text-slate-500 opacity-60';
                    }
                  } else if (isThisSelected) {
                    optionStyle = 'bg-cyan-950/40 border-cyan-500 text-white font-bold shadow-sm';
                  }

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      disabled={submitted}
                      onClick={() => handleSelectAnswer(qIdx, optIdx)}
                      className={`w-full p-3.5 rounded-xl border text-left text-xs md:text-sm transition-all flex items-center justify-between ${optionStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full border border-slate-700 flex items-center justify-center text-[10px] font-mono font-bold shrink-0">
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span>{opt}</span>
                      </div>
                      {submitted && isThisCorrect && (
                        <CheckCircle2 size={16} className="text-emerald-400 shrink-0 ml-2" />
                      )}
                      {submitted && isThisSelected && !isCorrect && (
                        <XCircle size={16} className="text-rose-400 shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation on Submission */}
              {submitted && (
                <div className={`mt-4 p-4 rounded-xl border text-xs md:text-sm leading-relaxed ${
                  isCorrect 
                    ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-200' 
                    : 'bg-rose-950/30 border-rose-800/40 text-rose-200'
                }`}>
                  <span className="font-bold block mb-1">
                    {isCorrect ? '✓ Correct Explanation:' : '✗ Correction & Key Takeaway:'}
                  </span>
                  {q.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submission & Score Action Footer */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky bottom-4 shadow-2xl backdrop-blur-md">
        {!submitted ? (
          <>
            <div className="text-xs font-mono text-slate-400">
              {Object.keys(userAnswers).length} of {questions.length} questions answered
            </div>

            <button
              type="button"
              disabled={!allAnswered}
              onClick={handleSubmit}
              className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                allAnswered
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-slate-950 shadow-lg shadow-cyan-500/20 hover:opacity-95'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <span>Submit Assessment</span>
              <ArrowRight size={16} />
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <div className={`text-2xl font-black font-mono ${passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                {score} / {questions.length} ({percentage}%)
              </div>
              <div className="text-xs text-slate-300">
                {passed 
                  ? 'Congratulations! You passed this objective knowledge check.' 
                  : 'Score below pass mark. Review the explanations above and retry.'}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {!passed ? (
                <button
                  type="button"
                  onClick={handleRetry}
                  className="px-5 py-2.5 bg-slate-900 border border-slate-700 hover:text-white text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5"
                >
                  <RotateCcw size={14} />
                  <span>Retry Quiz</span>
                </button>
              ) : !claimedReward ? (
                <button
                  type="button"
                  onClick={handleClaim}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider hover:opacity-95 shadow-lg shadow-emerald-500/20 inline-flex items-center gap-2"
                >
                  <Sparkles size={16} />
                  <span>Complete Lesson & Claim +{xpReward} XP</span>
                </button>
              ) : (
                <div className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black uppercase flex items-center gap-2">
                  <ShieldCheck size={16} />
                  <span>Objective Mastered (+{xpReward} XP Earned)</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
