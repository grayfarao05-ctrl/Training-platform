import React from 'react';
import { TestQuestion } from '../../types';
import { Check, CheckSquare, Square, CheckCircle2, XCircle } from 'lucide-react';

interface MultiQuestionProps {
  question: TestQuestion;
  value: number[] | undefined;
  onChange: (selectedIndexes: number[]) => void;
  onSubmitAnswer?: () => void;
  disabled?: boolean;
  showCorrectness?: boolean;
  isAnswered?: boolean;
}

export const MultiQuestion: React.FC<MultiQuestionProps> = ({
  question,
  value = [],
  onChange,
  onSubmitAnswer,
  disabled = false,
  showCorrectness = false,
  isAnswered = false
}) => {
  const options = question.options || [];
  const selectedList = Array.isArray(value) ? value : [];
  const correctList = question.correctAnswers || [];

  const handleToggle = (index: number) => {
    if (disabled) return;
    if (selectedList.includes(index)) {
      onChange(selectedList.filter(i => i !== index));
    } else {
      onChange([...selectedList, index]);
    }
  };

  return (
    <div className="space-y-4">
      {/* "Select all that apply" badge */}
      <div className="flex items-center gap-2 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider">
        <CheckSquare size={16} className="shrink-0" />
        <span>Select all that apply ({correctList.length > 0 ? `${correctList.length} correct options` : 'multiple options'})</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4" role="group" aria-label="Select all that apply">
        {options.map((opt, i) => {
          const isSelected = selectedList.includes(i);
          const isActuallyCorrect = correctList.includes(i);

          let cardStyle = "bg-[var(--bg-surface)] border-[var(--border-color)] text-[var(--text-main)] hover:border-indigo-500/50 hover:bg-white/5";

          if (isSelected) {
            cardStyle = "bg-indigo-500/15 border-indigo-500 text-[var(--text-main)] shadow-md";
          }

          if (showCorrectness) {
            if (isSelected && isActuallyCorrect) {
              cardStyle = "bg-emerald-500/15 border-emerald-500 text-emerald-400 shadow-md";
            } else if (isSelected && !isActuallyCorrect) {
              cardStyle = "bg-rose-500/15 border-rose-500 text-rose-400 shadow-md";
            } else if (!isSelected && isActuallyCorrect) {
              cardStyle = "bg-emerald-500/10 border-dashed border-emerald-500/60 text-emerald-400";
            } else {
              cardStyle = "bg-[var(--bg-surface)] border-[var(--border-color)] text-[var(--text-muted)] opacity-60";
            }
          }

          return (
            <button
              key={i}
              type="button"
              role="checkbox"
              aria-checked={isSelected}
              disabled={disabled}
              onClick={() => handleToggle(i)}
              className={`w-full text-left p-4 sm:p-5 rounded-2xl border-2 transition-all duration-200 flex items-center gap-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[var(--bg-card)] cursor-pointer disabled:cursor-default motion-reduce:transition-none ${cardStyle}`}
            >
              {/* Checkbox square indicator */}
              <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center shrink-0 font-bold transition-colors ${
                isSelected 
                  ? 'border-indigo-500 bg-indigo-500 text-white' 
                  : 'border-[var(--border-color)] text-[var(--text-muted)] bg-[var(--bg-card)]'
              }`}>
                {isSelected ? <Check size={16} strokeWidth={3} /> : <span className="text-xs font-mono">{String.fromCharCode(65 + i)}</span>}
              </div>

              <span className="text-sm font-medium leading-snug flex-1 select-text">
                {opt}
              </span>

              {showCorrectness && isActuallyCorrect && (
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 shrink-0">
                  Correct
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Confirm Selection Button in Practice Mode before locking */}
      {!disabled && !showCorrectness && onSubmitAnswer && (
        <div className="pt-4 flex justify-end">
          <button
            type="button"
            onClick={onSubmitAnswer}
            disabled={selectedList.length === 0}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Confirm Selection ({selectedList.length} selected)
          </button>
        </div>
      )}
    </div>
  );
};

export default MultiQuestion;
