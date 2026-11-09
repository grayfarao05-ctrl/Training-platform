import React from 'react';
import { TestQuestion } from '../../types';
import { CheckCircle2, XCircle, AlertCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QuestionShellProps {
  question: TestQuestion;
  questionNumber: number;
  totalQuestions: number;
  isAnswered: boolean;
  isCorrect: boolean | null;
  showFeedback: boolean;
  accentColor: string;
  children: React.ReactNode;
}

export const QuestionShell: React.FC<QuestionShellProps> = ({
  question,
  questionNumber,
  totalQuestions,
  isAnswered,
  isCorrect,
  showFeedback,
  accentColor,
  children
}) => {
  const progressPercent = Math.round((questionNumber / totalQuestions) * 100);

  return (
    <div className="space-y-6 w-full">
      {/* Top Meta Bar & Progress Track */}
      <div className="bg-[var(--bg-card)] rounded-2xl p-4 md:p-5 border border-[var(--border-color)] shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span 
              className="font-black uppercase tracking-tight text-sm md:text-base font-mono"
              style={{ color: accentColor }}
            >
              Question {questionNumber}
            </span>
            <span className="text-[var(--text-muted)] font-mono text-xs">
              / {totalQuestions}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {question.domain && (
              <span className="px-3 py-1 bg-[var(--bg-surface)] rounded-full text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] border border-[var(--border-color)]">
                {question.domain}
              </span>
            )}
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
              question.difficulty === 'Easy'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : question.difficulty === 'Hard'
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>
              {question.difficulty || 'Medium'}
            </span>
            {question.type && question.type !== 'choice' && (
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                {question.type === 'multi' ? 'Multi-Select' :
                 question.type === 'image' ? 'Diagram' :
                 question.type === 'fill' ? 'Fill-in' :
                 question.type === 'match' ? 'Matching' :
                 question.type === 'order' ? 'Sequence' :
                 question.type === 'terminal' ? 'CLI Command' : question.type}
              </span>
            )}
          </div>
        </div>

        {/* Accessible Progress Bar */}
        <div 
          role="progressbar" 
          aria-valuenow={questionNumber} 
          aria-valuemin={1} 
          aria-valuemax={totalQuestions}
          aria-label={`Question ${questionNumber} of ${totalQuestions}`}
          className="h-2 bg-[var(--bg-surface)] rounded-full overflow-hidden border border-[var(--border-color)]"
        >
          <div 
            className="h-full rounded-full transition-all duration-300 ease-out motion-reduce:transition-none"
            style={{ width: `${progressPercent}%`, backgroundColor: accentColor }}
          />
        </div>
      </div>

      {/* Main Question Card */}
      <div className="bg-[var(--bg-card)] rounded-3xl p-6 md:p-10 border border-[var(--border-color)] shadow-xl relative overflow-hidden">
        {/* Animated Feedback Banner (Practice Mode Immediate Feedback) */}
        <AnimatePresence>
          {showFeedback && isCorrect !== null && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={`mb-6 p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                isCorrect 
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-md shadow-emerald-500/10' 
                  : 'bg-rose-500/15 border-rose-500/40 text-rose-400 shadow-md shadow-rose-500/10'
              }`}
            >
              <div className="flex items-center gap-2.5 font-black uppercase text-xs tracking-wider">
                {isCorrect ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                    <span>Correct Answer! (+1 mark)</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 shrink-0 text-rose-400" />
                    <span>Incorrect Answer (0 marks)</span>
                  </>
                )}
              </div>
              <span className="text-[10px] uppercase tracking-widest font-mono opacity-80">
                {isCorrect ? 'Well done' : 'Review below'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Question Text - Always plain text (never HTML) */}
        <h2 className="text-lg md:text-2xl font-bold leading-relaxed text-[var(--text-main)] mb-6 select-text whitespace-pre-wrap">
          {question.text}
        </h2>

        {/* Interactive Question Input Body */}
        <div className="mt-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default QuestionShell;
