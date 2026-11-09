import React, { useState, useEffect } from 'react';
import { TestQuestion } from '../../types';
import { normalizeAnswerText, isAnswerCorrect } from '../../questionScoring';
import { CheckCircle2, XCircle, Send } from 'lucide-react';

interface FillQuestionProps {
  question: TestQuestion;
  value: string | undefined;
  onChange: (val: string) => void;
  onSubmitAnswer?: () => void;
  disabled?: boolean;
  showCorrectness?: boolean;
}

export const FillQuestion: React.FC<FillQuestionProps> = ({
  question,
  value = '',
  onChange,
  onSubmitAnswer,
  disabled = false,
  showCorrectness = false
}) => {
  const [localInput, setLocalInput] = useState(value || '');

  useEffect(() => {
    setLocalInput(value || '');
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalInput(e.target.value);
    onChange(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !disabled && onSubmitAnswer && localInput.trim()) {
      e.preventDefault();
      onSubmitAnswer();
    }
  };

  const isCorrect = isAnswerCorrect(question, value);

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="space-y-2">
        <label 
          htmlFor={`fill-${question.id}`}
          className="block text-xs font-black uppercase tracking-wider text-[var(--text-muted)]"
        >
          Type your answer:
        </label>
        
        <div className="relative flex items-center">
          <input
            id={`fill-${question.id}`}
            type="text"
            value={localInput}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Type answer here..."
            autoComplete="off"
            spellCheck="false"
            className={`w-full p-4 md:p-5 rounded-2xl bg-[var(--bg-surface)] border-2 text-[var(--text-main)] font-medium text-base transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[var(--bg-card)] disabled:opacity-75 ${
              showCorrectness
                ? isCorrect
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                  : 'border-rose-500 bg-rose-500/10 text-rose-400'
                : 'border-[var(--border-color)] focus:border-indigo-500'
            }`}
          />

          {!disabled && onSubmitAnswer && (
            <button
              type="button"
              onClick={onSubmitAnswer}
              disabled={!localInput.trim()}
              className="absolute right-3 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <span>Submit</span>
              <Send size={13} />
            </button>
          )}
        </div>

        {question.caseSensitive && (
          <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider mt-1">
            * Note: Answer is case-sensitive
          </p>
        )}
      </div>

      {/* Review Mode Comparison Panel */}
      {showCorrectness && (
        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-2 text-xs">
          <div className="flex items-center gap-2">
            {isCorrect ? (
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            ) : (
              <XCircle size={16} className="text-rose-400 shrink-0" />
            )}
            <span className="font-bold uppercase tracking-wider text-[var(--text-main)]">
              {isCorrect ? 'Correct!' : 'Answer check:'}
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 pt-2 border-t border-[var(--border-color)] font-mono text-[11px]">
            <div>
              <span className="text-[var(--text-muted)] block text-[10px] uppercase tracking-wider mb-1">Your Answer:</span>
              <span className={`p-2 rounded block ${isCorrect ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'}`}>
                {value ? `"${value}"` : '(No answer given)'}
              </span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] block text-[10px] uppercase tracking-wider mb-1">Accepted Answers:</span>
              <div className="space-y-1">
                {(question.acceptedAnswers || []).map((ans, idx) => (
                  <span key={idx} className="p-1.5 px-2 rounded block bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    "{ans}"
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FillQuestion;
