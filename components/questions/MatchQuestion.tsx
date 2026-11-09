import React, { useState, useMemo } from 'react';
import { TestQuestion, MatchPair } from '../../types';
import { Link2, Unlink, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';

interface MatchQuestionProps {
  question: TestQuestion;
  value: Record<string, string> | undefined;
  onChange: (val: Record<string, string>) => void;
  onSubmitAnswer?: () => void;
  disabled?: boolean;
  showCorrectness?: boolean;
}

export const MatchQuestion: React.FC<MatchQuestionProps> = ({
  question,
  value = {},
  onChange,
  onSubmitAnswer,
  disabled = false,
  showCorrectness = false
}) => {
  const pairs: MatchPair[] = question.pairs || [];
  const currentMatches: Record<string, string> = value || {};

  // Selected left item waiting to be paired with a right item
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);

  // Deterministically shuffle the right column based on question.id so it doesn't change on every render
  const shuffledRight = useMemo(() => {
    const rights = pairs.map(p => p.right);
    // Simple deterministic pseudo-shuffle based on question id length/char codes
    const seed = (question.id || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 42);
    const copy = [...rights];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = (seed * (i + 1)) % (i + 1);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }, [pairs, question.id]);

  const handleLeftClick = (leftText: string) => {
    if (disabled) return;
    if (selectedLeft === leftText) {
      setSelectedLeft(null);
    } else {
      setSelectedLeft(leftText);
    }
  };

  const handleRightClick = (rightText: string) => {
    if (disabled) return;
    if (!selectedLeft) return;

    // Create or update match
    const updated = { ...currentMatches };
    
    // If another left item was already mapped to this right item, remove old mapping
    Object.keys(updated).forEach(k => {
      if (updated[k] === rightText) {
        delete updated[k];
      }
    });

    updated[selectedLeft] = rightText;
    onChange(updated);
    setSelectedLeft(null);
  };

  const handleUnpair = (leftText: string) => {
    if (disabled) return;
    const updated = { ...currentMatches };
    delete updated[leftText];
    onChange(updated);
    if (selectedLeft === leftText) setSelectedLeft(null);
  };

  const handleReset = () => {
    if (disabled) return;
    onChange({});
    setSelectedLeft(null);
  };

  const allPaired = pairs.length > 0 && pairs.every(p => Boolean(currentMatches[p.left]));

  // Color palette for paired badges
  const PAIR_COLORS = [
    'border-cyan-500 bg-cyan-500/15 text-cyan-300',
    'border-emerald-500 bg-emerald-500/15 text-emerald-300',
    'border-amber-500 bg-amber-500/15 text-amber-300',
    'border-purple-500 bg-purple-500/15 text-purple-300',
    'border-pink-500 bg-pink-500/15 text-pink-300',
    'border-blue-500 bg-blue-500/15 text-blue-300',
    'border-teal-500 bg-teal-500/15 text-teal-300',
    'border-orange-500 bg-orange-500/15 text-orange-300',
  ];

  const getPairColorIndex = (leftText: string) => {
    const idx = pairs.findIndex(p => p.left === leftText);
    return idx >= 0 ? idx % PAIR_COLORS.length : 0;
  };

  return (
    <div className="space-y-6">
      {/* Instructions header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs">
        <span className="text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-2">
          <Link2 size={16} /> Tap an item on the left, then tap its match on the right.
        </span>
        {!disabled && !showCorrectness && Object.keys(currentMatches).length > 0 && (
          <button
            type="button"
            onClick={handleReset}
            className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] hover:text-white flex items-center gap-1 transition-colors"
          >
            <RotateCcw size={12} /> Reset
          </button>
        )}
      </div>

      {/* Two Column Layout for Touch & Keyboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Left Column: Prompts */}
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] px-1">
            Column A (Tap to select)
          </h3>
          <div className="space-y-2.5">
            {pairs.map((pair, idx) => {
              const matchedRight = currentMatches[pair.left];
              const isSelected = selectedLeft === pair.left;
              const colorClass = matchedRight ? PAIR_COLORS[getPairColorIndex(pair.left)] : '';

              return (
                <div
                  key={`left-${idx}`}
                  onClick={() => handleLeftClick(pair.left)}
                  className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    isSelected 
                      ? 'border-indigo-400 bg-indigo-500/20 shadow-lg ring-2 ring-indigo-400' 
                      : matchedRight 
                      ? `${colorClass} shadow-sm` 
                      : 'bg-[var(--bg-surface)] border-[var(--border-color)] hover:border-indigo-500/40 text-[var(--text-main)]'
                  } ${disabled ? 'cursor-default' : ''}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] font-mono text-xs font-black flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-semibold leading-snug break-words">
                      {pair.left}
                    </span>
                  </div>

                  {matchedRight && !disabled && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnpair(pair.left);
                      }}
                      className="p-1 text-[var(--text-muted)] hover:text-rose-400 transition-colors"
                      title="Unpair"
                    >
                      <Unlink size={15} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Targets */}
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] px-1">
            Column B (Tap to link)
          </h3>
          <div className="space-y-2.5">
            {shuffledRight.map((rightText, idx) => {
              const linkedLeft = Object.keys(currentMatches).find(k => currentMatches[k] === rightText);
              const colorClass = linkedLeft ? PAIR_COLORS[getPairColorIndex(linkedLeft)] : '';

              return (
                <div
                  key={`right-${idx}`}
                  onClick={() => handleRightClick(rightText)}
                  className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 select-none ${
                    selectedLeft
                      ? 'cursor-pointer hover:border-indigo-400 hover:bg-white/5 border-dashed border-indigo-500/50'
                      : 'cursor-pointer'
                  } ${
                    linkedLeft 
                      ? `${colorClass} shadow-sm border-solid` 
                      : 'bg-[var(--bg-surface)] border-[var(--border-color)] hover:border-indigo-500/40 text-[var(--text-main)]'
                  } ${disabled ? 'cursor-default' : ''}`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="w-6 h-6 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] font-mono text-xs font-black flex items-center justify-center shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="text-sm font-semibold leading-snug break-words">
                      {rightText}
                    </span>
                  </div>

                  {linkedLeft && (
                    <span className="text-[10px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded bg-black/40 border border-white/10 shrink-0">
                      Linked
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Confirm Button in Practice Mode */}
      {!disabled && !showCorrectness && onSubmitAnswer && (
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onSubmitAnswer}
            disabled={!allPaired}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Confirm Matches ({Object.keys(currentMatches).length}/{pairs.length})
          </button>
        </div>
      )}

      {/* Review Screen Detailed Match Report */}
      {showCorrectness && (
        <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-3 text-xs">
          <h4 className="font-bold uppercase tracking-wider text-[var(--text-main)] border-b border-[var(--border-color)] pb-2 flex items-center gap-2">
            <Link2 size={15} className="text-indigo-400" /> Matching Breakdown
          </h4>

          <div className="space-y-2">
            {pairs.map((pair, idx) => {
              const studentChoice = currentMatches[pair.left];
              const isMatchCorrect = studentChoice === pair.right;

              return (
                <div 
                  key={idx}
                  className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                    isMatchCorrect 
                      ? 'bg-emerald-500/10 border-emerald-500/30' 
                      : 'bg-rose-500/10 border-rose-500/30'
                  }`}
                >
                  <div className="flex items-center gap-2 font-medium">
                    {isMatchCorrect ? (
                      <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle size={16} className="text-rose-400 shrink-0" />
                    )}
                    <span className="font-bold text-[var(--text-main)]">{pair.left}</span>
                  </div>

                  <div className="text-xs font-mono flex items-center gap-3">
                    <span className={isMatchCorrect ? 'text-emerald-300 font-bold' : 'text-rose-300'}>
                      Your link: {studentChoice || '(Unmatched)'}
                    </span>
                    {!isMatchCorrect && (
                      <span className="text-emerald-400 font-bold">
                        Correct: {pair.right}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchQuestion;
