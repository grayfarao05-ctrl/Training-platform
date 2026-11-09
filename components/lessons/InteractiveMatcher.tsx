import React, { useState, useMemo, useEffect } from 'react';
import { MatcherLessonSection } from '../../types';
import { 
  Cable, 
  CheckCircle2, 
  RotateCcw, 
  Sparkles, 
  ArrowRight, 
  AlertTriangle,
  Link2
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface InteractiveMatcherProps {
  section: MatcherLessonSection;
  onRewardXP?: (xp: number) => void;
  onStageComplete?: () => void;
}

export const InteractiveMatcher: React.FC<InteractiveMatcherProps> = ({
  section,
  onRewardXP,
  onStageComplete
}) => {
  const { matcherTitle, description, pairs, xpReward } = section;

  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(pairs[0]?.id || null);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [xpClaimed, setXpClaimed] = useState<boolean>(false);

  // Deterministically shuffle targets based on pair IDs so order isn't 1:1
  const shuffledTargets = useMemo(() => {
    const arr = [...pairs];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = (i * 7 + 3) % (i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [pairs]);

  const isAllMatched = matchedIds.length === pairs.length;

  useEffect(() => {
    if (isAllMatched && onStageComplete) {
      onStageComplete();
    }
  }, [isAllMatched, onStageComplete]);

  const handleTargetClick = (targetPairId: string) => {
    if (matchedIds.includes(targetPairId)) return;

    if (!selectedSourceId) {
      setFeedback({
        type: 'error',
        message: 'Select an item on the left first, then click its matching target socket on the right.'
      });
      return;
    }

    const sourceItem = pairs.find(p => p.id === selectedSourceId);
    const targetItem = pairs.find(p => p.id === targetPairId);

    if (selectedSourceId === targetPairId && sourceItem) {
      const nextMatched = [...matchedIds, targetPairId];
      setMatchedIds(nextMatched);
      setFeedback({
        type: 'success',
        message: `✓ Connected ${sourceItem.sourceLabel} → ${sourceItem.targetLabel}: ${sourceItem.explanation}`
      });

      // Auto-select next unmatched source item
      const nextUnmatched = pairs.find(p => !nextMatched.includes(p.id));
      setSelectedSourceId(nextUnmatched?.id || null);

      if (nextMatched.length === pairs.length) {
        try {
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        } catch {
          // ignore
        }
        if (!xpClaimed && onRewardXP) {
          onRewardXP(xpReward);
          setXpClaimed(true);
        }
        if (onStageComplete) {
          onStageComplete();
        }
      }
    } else {
      setFeedback({
        type: 'error',
        message: `Mismatch! "${sourceItem?.sourceLabel}" does not connect to "${targetItem?.targetLabel}". Check the technical specification and try again.`
      });
    }
  };

  const resetMatcher = () => {
    setMatchedIds([]);
    setSelectedSourceId(pairs[0]?.id || null);
    setFeedback(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-[#0B0D19]/90 border border-white/10 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5">
              <Cable size={12} />
              Interactive Specification Matcher
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {matchedIds.length} / {pairs.length} Connected
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight mt-1">
            {matcherTitle}
          </h2>
          <p className="text-xs md:text-sm text-slate-300 mt-1">{description}</p>
        </div>

        <button
          type="button"
          onClick={resetMatcher}
          className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 bg-white/5 border border-white/10 text-slate-300 hover:text-white transition-colors self-start md:self-auto shrink-0 cursor-pointer"
        >
          <RotateCcw size={14} />
          <span>Reset Connections</span>
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs md:text-sm flex items-start gap-3 animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle size={18} className="text-rose-400 shrink-0 mt-0.5" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Two-Column Interactive Patch Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left 5 Cols: Source Connectors / Protocols / Steps */}
        <div className="md:col-span-5 space-y-3">
          <div className="text-xs font-mono uppercase tracking-wider text-indigo-300 font-bold px-1">
            1. Click Source Component to Equip
          </div>
          {pairs.map((pair, idx) => {
            const isMatched = matchedIds.includes(pair.id);
            const isSelected = selectedSourceId === pair.id;

            return (
              <button
                key={pair.id}
                type="button"
                disabled={isMatched}
                onClick={() => setSelectedSourceId(pair.id)}
                className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                  isMatched
                    ? 'bg-emerald-950/25 border-emerald-500/40 text-emerald-300 opacity-75 cursor-default'
                    : isSelected
                    ? 'bg-gradient-to-r from-indigo-600/30 to-cyan-600/20 border-cyan-400 text-white shadow-lg shadow-cyan-500/15 scale-[1.01]'
                    : 'bg-[#0B0D19] border-white/10 text-slate-300 hover:border-indigo-500/50'
                }`}
              >
                <div className="space-y-1">
                  {pair.sourceCategory && (
                    <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 block">
                      {pair.sourceCategory}
                    </span>
                  )}
                  <div className="text-sm font-black">
                    {idx + 1}. {pair.sourceLabel}
                  </div>
                </div>
                {isMatched ? (
                  <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                ) : (
                  <ArrowRight
                    size={16}
                    className={isSelected ? 'text-cyan-400 translate-x-1 transition-transform' : 'text-slate-600'}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Right 7 Cols: Target Sockets & Technical Specs */}
        <div className="md:col-span-7 space-y-3">
          <div className="text-xs font-mono uppercase tracking-wider text-cyan-300 font-bold px-1">
            2. Click Matching Target Specification Socket
          </div>
          {shuffledTargets.map((target) => {
            const isMatched = matchedIds.includes(target.id);

            return (
              <button
                key={target.id}
                type="button"
                disabled={isMatched}
                onClick={() => handleTargetClick(target.id)}
                className={`w-full p-4 rounded-2xl border text-left transition-all flex items-start justify-between gap-4 cursor-pointer ${
                  isMatched
                    ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200 cursor-default'
                    : 'bg-[#080B14] border-white/10 hover:border-cyan-400/60 hover:bg-[#0D1324] text-slate-200'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Link2 size={14} className={isMatched ? 'text-emerald-400' : 'text-indigo-400'} />
                    <span className="text-xs md:text-sm font-black text-white">
                      {target.targetLabel}
                    </span>
                    {isMatched && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                        Linked: {target.sourceLabel}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-mono">
                    {target.targetSpec}
                  </p>
                </div>

                <div
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-mono uppercase tracking-wider shrink-0 border ${
                    isMatched
                      ? 'bg-emerald-500 text-slate-950 border-emerald-300 font-black'
                      : 'bg-slate-900 text-cyan-300 border-cyan-500/30'
                  }`}
                >
                  {isMatched ? 'Verified' : 'Snap Here'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {isAllMatched && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/50 via-slate-900 to-indigo-950/40 border border-emerald-500/40 text-center space-y-2 animate-in zoom-in-95">
          <Sparkles size={26} className="text-emerald-400 mx-auto" />
          <h3 className="text-lg font-black text-white uppercase">
            All Specifications Patched & Verified (+{xpReward} XP)
          </h3>
          <p className="text-xs text-slate-300">
            Stage mastery verified. You can now advance to the next stage!
          </p>
        </div>
      )}
    </div>
  );
};
export default InteractiveMatcher;

