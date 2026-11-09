import React, { useEffect, useState, useMemo } from 'react';
import { TestQuestion } from '../../types';
import { ArrowUp, ArrowDown, CheckCircle2, XCircle, ListOrdered } from 'lucide-react';

interface OrderQuestionProps {
  question: TestQuestion;
  value: string[] | undefined;
  onChange: (orderedSteps: string[]) => void;
  onSubmitAnswer?: () => void;
  disabled?: boolean;
  showCorrectness?: boolean;
}

export const OrderQuestion: React.FC<OrderQuestionProps> = ({
  question,
  value,
  onChange,
  onSubmitAnswer,
  disabled = false,
  showCorrectness = false
}) => {
  const correctSteps = question.steps || [];

  // Deterministically scramble initial steps if student has not answered yet
  const initialScramble = useMemo(() => {
    const list = [...correctSteps];
    const seed = (question.id || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 17);
    for (let i = list.length - 1; i > 0; i--) {
      const j = (seed * (i + 3)) % (i + 1);
      [list[i], list[j]] = [list[j], list[i]];
    }
    // If by chance scrambled is equal to correct and length > 1, swap first two
    if (list.length > 1 && list.every((item, i) => item === correctSteps[i])) {
      [list[0], list[1]] = [list[1], list[0]];
    }
    return list;
  }, [correctSteps, question.id]);

  const currentOrder = useMemo(() => {
    if (Array.isArray(value) && value.length === correctSteps.length) {
      return value;
    }
    return initialScramble;
  }, [value, correctSteps.length, initialScramble]);

  // Synchronize initial order to parent if none yet
  useEffect(() => {
    if (!value && initialScramble.length > 0) {
      onChange(initialScramble);
    }
  }, [value, initialScramble, onChange]);

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (disabled) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentOrder.length) return;

    const updated = [...currentOrder];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    onChange(updated);
  };

  const isAllCorrect = currentOrder.length > 0 && currentOrder.every((step, i) => step === correctSteps[i]);

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Helper header */}
      <div className="flex items-center gap-2 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider">
        <ListOrdered size={16} className="shrink-0" />
        <span>Use Up and Down buttons to arrange the steps in the correct chronological order</span>
      </div>

      {/* Ordered List of Steps */}
      <div className="space-y-3" role="list" aria-label="Step ordering">
        {currentOrder.map((step, idx) => {
          const isStepCorrect = showCorrectness && step === correctSteps[idx];

          let rowStyle = "bg-[var(--bg-surface)] border-[var(--border-color)] text-[var(--text-main)]";
          if (showCorrectness) {
            rowStyle = isStepCorrect 
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/40 text-rose-300';
          }

          return (
            <div
              key={`step-${step}-${idx}`}
              className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 shadow-sm ${rowStyle}`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="w-8 h-8 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] font-mono text-xs font-black flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <span className="text-sm font-semibold leading-snug break-words">
                  {step}
                </span>
              </div>

              {/* Up/Down Button Controls (Native Touch & Keyboard accessible) */}
              {!disabled && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => moveItem(idx, 'up')}
                    disabled={idx === 0}
                    aria-label={`Move "${step}" up`}
                    className="p-2 rounded-xl bg-[var(--bg-card)] hover:bg-white/10 disabled:opacity-20 disabled:hover:bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    title="Move up"
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(idx, 'down')}
                    disabled={idx === currentOrder.length - 1}
                    aria-label={`Move "${step}" down`}
                    className="p-2 rounded-xl bg-[var(--bg-card)] hover:bg-white/10 disabled:opacity-20 disabled:hover:bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    title="Move down"
                  >
                    <ArrowDown size={16} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Confirm Button in Practice Mode */}
      {!disabled && !showCorrectness && onSubmitAnswer && (
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onSubmitAnswer}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Confirm Order
          </button>
        </div>
      )}

      {/* Review Screen Correct Order Comparison */}
      {showCorrectness && (
        <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-3 text-xs">
          <div className="flex items-center gap-2">
            {isAllCorrect ? (
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            ) : (
              <XCircle size={16} className="text-rose-400 shrink-0" />
            )}
            <h4 className="font-bold uppercase tracking-wider text-[var(--text-main)]">
              {isAllCorrect ? 'Perfect Sequence!' : 'Sequence Comparison:'}
            </h4>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-[var(--border-color)] font-mono text-[11px]">
            <div>
              <span className="text-[var(--text-muted)] block text-[10px] uppercase tracking-wider mb-2 font-sans font-bold">
                Your Order:
              </span>
              <ol className="space-y-1.5 list-decimal list-inside">
                {currentOrder.map((st, i) => (
                  <li 
                    key={i} 
                    className={`p-1.5 rounded ${st === correctSteps[i] ? 'text-emerald-300 bg-emerald-500/10' : 'text-rose-300 bg-rose-500/10'}`}
                  >
                    {st}
                  </li>
                ))}
              </ol>
            </div>

            <div>
              <span className="text-[var(--text-muted)] block text-[10px] uppercase tracking-wider mb-2 font-sans font-bold">
                Correct Sequence:
              </span>
              <ol className="space-y-1.5 list-decimal list-inside text-emerald-400">
                {correctSteps.map((st, i) => (
                  <li key={i} className="p-1.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                    {st}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderQuestion;
