import React from 'react';
import { TestQuestion } from '../../types';

interface ChoiceQuestionProps {
  question: TestQuestion;
  value: number | null | undefined;
  onChange: (optionIndex: number) => void;
  disabled?: boolean;
  showCorrectness?: boolean;
}

export const ChoiceQuestion: React.FC<ChoiceQuestionProps> = ({
  question,
  value,
  onChange,
  disabled = false,
  showCorrectness = false
}) => {
  const options = question.options || [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4" role="radiogroup" aria-label="Question options">
      {options.map((opt, i) => {
        const isSelected = value === i;
        const isCorrectAnswer = i === question.correctAnswer;

        let cardStyle = "bg-[var(--bg-surface)] border-[var(--border-color)] text-[var(--text-main)] hover:border-indigo-500/50 hover:bg-white/5";

        if (isSelected) {
          cardStyle = "bg-indigo-500/15 border-indigo-500 text-[var(--text-main)] shadow-md";
        }

        if (showCorrectness) {
          if (isCorrectAnswer) {
            cardStyle = "bg-emerald-500/15 border-emerald-500 text-emerald-400 shadow-md";
          } else if (isSelected && !isCorrectAnswer) {
            cardStyle = "bg-rose-500/15 border-rose-500 text-rose-400 shadow-md";
          } else {
            cardStyle = "bg-[var(--bg-surface)] border-[var(--border-color)] text-[var(--text-muted)] opacity-60";
          }
        }

        return (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={disabled}
            onClick={() => onChange(i)}
            className={`w-full text-left p-4 sm:p-5 rounded-2xl border-2 transition-all duration-200 flex items-center gap-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[var(--bg-card)] cursor-pointer disabled:cursor-default motion-reduce:transition-none ${cardStyle}`}
          >
            <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 font-bold text-xs ${
              isSelected || (isCorrectAnswer && showCorrectness)
                ? 'border-current bg-current text-[var(--bg-card)]'
                : 'border-[var(--border-color)] text-[var(--text-muted)]'
            }`}>
              {String.fromCharCode(65 + i)}
            </div>
            <span className="text-sm font-medium leading-snug flex-1 select-text">
              {opt}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default ChoiceQuestion;
