import React, { useState, useEffect } from 'react';
import { PromptLabLessonSection } from '../../types';
import { 
  Sparkles, 
  ShieldAlert, 
  CheckCircle2, 
  Bot, 
  Sliders, 
  AlertTriangle, 
  RotateCcw,
  ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PromptLabSimulatorProps {
  section: PromptLabLessonSection;
  onRewardXP?: (xp: number) => void;
  onStageComplete?: () => void;
}

export const PromptLabSimulator: React.FC<PromptLabSimulatorProps> = ({
  section,
  onRewardXP,
  onStageComplete
}) => {
  const {
    labTitle,
    scenarioBrief,
    baseWeakPrompt,
    weakOutputPreview,
    optimalOutputPreview,
    toggles,
    outputAuditSegments,
    xpReward
  } = section;

  const [activeToggleIds, setActiveToggleIds] = useState<string[]>([]);
  const [flaggedSegmentIds, setFlaggedSegmentIds] = useState<string[]>([]);
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);
  const [xpClaimed, setXpClaimed] = useState<boolean>(false);

  // Calculate Prompt Engineering Score (base 20% + sum of active toggles)
  const promptScore = Math.max(
    0,
    Math.min(
      100,
      20 +
        activeToggleIds.reduce((acc, id) => {
          const t = toggles.find(item => item.id === id);
          return acc + (t ? t.qualityBoost : 0);
        }, 0)
    )
  );

  // Check if all optimal toggles are enabled and no non-optimal toggles are enabled
  const allOptimalSelected = toggles
    .filter(t => t.isOptimal)
    .every(t => activeToggleIds.includes(t.id));
  const anyBadToggleSelected = toggles
    .filter(t => !t.isOptimal)
    .some(t => activeToggleIds.includes(t.id));

  const isPromptEngineered = (allOptimalSelected && !anyBadToggleSelected) || promptScore >= 85;

  // Check if all red-flag segments in Part 2 are flagged (and no clean segments falsely flagged)
  const requiredRedFlagIds = outputAuditSegments.filter(s => s.isRedFlag).map(s => s.id);
  const allRedFlagsFound =
    requiredRedFlagIds.length === 0 ||
    (requiredRedFlagIds.every(id => flaggedSegmentIds.includes(id)) &&
      flaggedSegmentIds.every(id => requiredRedFlagIds.includes(id)));

  const isStageComplete = isPromptEngineered && allRedFlagsFound;

  useEffect(() => {
    if (isStageComplete) {
      if (!xpClaimed && onRewardXP) {
        onRewardXP(xpReward);
        setXpClaimed(true);
        try {
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        } catch {
          // ignore
        }
      }
      if (onStageComplete) {
        onStageComplete();
      }
    }
  }, [isStageComplete, xpClaimed, onRewardXP, xpReward, onStageComplete]);

  const handleToggleBlock = (id: string) => {
    const target = toggles.find(t => t.id === id);
    if (!target) return;
    setLastFeedback(target.feedback);
    setActiveToggleIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSegmentClick = (id: string) => {
    const seg = outputAuditSegments.find(s => s.id === id);
    if (seg?.explanation) {
      setLastFeedback(seg.explanation);
    }
    setFlaggedSegmentIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const assembledPrompt = [
    baseWeakPrompt,
    ...toggles
      .filter(t => activeToggleIds.includes(t.id))
      .map(t => t.promptSnippet)
  ].join('\n\n');

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="bg-[#0B0D19]/90 border border-white/10 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
              <Bot size={12} />
              Interactive AI Prompt & POPIA Verification Sandbox
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Prompt Precision: {promptScore}%
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight mt-1">
            {labTitle}
          </h2>
          <p className="text-xs md:text-sm text-slate-300 mt-1">{scenarioBrief}</p>
        </div>

        <button
          type="button"
          onClick={() => {
            setActiveToggleIds([]);
            setFlaggedSegmentIds([]);
            setLastFeedback(null);
          }}
          className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 bg-white/5 border border-white/10 text-slate-300 hover:text-white transition-colors self-start md:self-auto shrink-0 cursor-pointer"
        >
          <RotateCcw size={14} />
          <span>Reset Sandbox</span>
        </button>
      </div>

      {/* Part 1: Prompt Engineering Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 6 Cols: Guardrail & Context Toggles */}
        <div className="lg:col-span-6 bg-[#0B0D19]/95 border border-white/10 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sliders size={16} className="text-cyan-400" />
              <span className="text-xs font-black uppercase tracking-wider text-white">
                1. Toggle Structured Prompt Blocks (Avoid POPIA / Vague Traps)
              </span>
            </div>
            <span className={`text-xs font-mono font-black ${isPromptEngineered ? 'text-emerald-400' : 'text-amber-400'}`}>
              Score: {promptScore}% / 85%+
            </span>
          </div>

          <div className="space-y-2.5">
            {toggles.map((t) => {
              const isSelected = activeToggleIds.includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleToggleBlock(t.id)}
                  className={`w-full p-4 rounded-2xl border text-left transition-all flex items-start justify-between gap-3 cursor-pointer ${
                    isSelected
                      ? t.isOptimal
                        ? 'bg-emerald-950/30 border-emerald-500/60 text-white'
                        : 'bg-rose-950/40 border-rose-500/60 text-rose-200'
                      : 'bg-slate-900/60 border-white/10 text-slate-300 hover:border-indigo-500/40'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-mono uppercase text-cyan-300">
                        {t.category}
                      </span>
                      <span className="text-xs md:text-sm font-black">{t.label}</span>
                    </div>
                    <p className="text-[11px] font-mono text-slate-400 line-clamp-2">
                      "{t.promptSnippet}"
                    </p>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold shrink-0 ${
                      isSelected
                        ? t.isOptimal
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-rose-500 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isSelected ? (t.isOptimal ? `+${t.qualityBoost}%` : `${t.qualityBoost}%`) : 'Toggle'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 6 Cols: Live Assembled Prompt & Real-Time Output Comparator */}
        <div className="lg:col-span-6 bg-[#060913] border border-white/10 rounded-3xl p-6 space-y-4 shadow-2xl">
          <div className="space-y-2">
            <div className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-bold">
              Live Assembled System Prompt
            </div>
            <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-200 whitespace-pre-wrap leading-relaxed max-h-44 overflow-y-auto">
              {assembledPrompt}
            </pre>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                Simulated Model Response Preview
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  isPromptEngineered
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
              >
                {isPromptEngineered ? 'Production-Grade Output' : 'Generic / Unverified Output'}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-[#0B1020] border border-indigo-500/25 text-xs md:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
              {isPromptEngineered ? optimalOutputPreview : weakOutputPreview}
            </div>
          </div>
        </div>
      </div>

      {/* Part 2: Hallucination & POPIA Red-Flag Inspector */}
      {outputAuditSegments.length > 0 && (
        <div className="bg-[#0B0D19]/95 border border-white/10 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <ShieldAlert size={16} className="text-rose-400" />
                <span className="text-xs font-black uppercase tracking-wider text-white">
                  2. Human-in-the-Loop Verification — Click to Flag Hallucinations or POPIA Breaches
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Inspect the AI draft sentences below. Click ONLY the sentences that contain fabricated facts or POPIA privacy violations ({requiredRedFlagIds.length} red flag{requiredRedFlagIds.length === 1 ? '' : 's'} hidden).
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-xl text-xs font-mono font-bold border self-start sm:self-auto ${
                allRedFlagsFound
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
              }`}
            >
              {allRedFlagsFound ? '✓ Audit Verified' : 'Audit Pending'}
            </span>
          </div>

          <div className="space-y-2.5">
            {outputAuditSegments.map((seg) => {
              const isFlagged = flaggedSegmentIds.includes(seg.id);
              return (
                <button
                  key={seg.id}
                  type="button"
                  onClick={() => handleSegmentClick(seg.id)}
                  className={`w-full p-3.5 rounded-2xl border text-left text-xs md:text-sm transition-all flex items-center justify-between gap-4 cursor-pointer ${
                    isFlagged
                      ? seg.isRedFlag
                        ? 'bg-emerald-950/35 border-emerald-500 text-emerald-200 font-bold'
                        : 'bg-rose-950/40 border-rose-500 text-rose-200'
                      : 'bg-slate-900/60 border-white/10 text-slate-200 hover:border-indigo-500/40'
                  }`}
                >
                  <span>"{seg.text}"</span>
                  <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 shrink-0">
                    {isFlagged
                      ? seg.isRedFlag
                        ? `✓ Red Flag Caught (${seg.flagType || 'Issue'})`
                        : '✗ False Alarm (Valid Line)'
                      : 'Click to Flag'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {lastFeedback && (
        <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 text-xs text-indigo-200 flex items-center gap-3">
          <Sparkles size={16} className="text-indigo-400 shrink-0" />
          <span>{lastFeedback}</span>
        </div>
      )}

      {isStageComplete && (
        <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-1.5 animate-in zoom-in-95">
          <ShieldCheck size={28} className="text-emerald-400 mx-auto" />
          <div className="text-base font-black text-white uppercase">
            Prompt Engineering & Verification Complete (+{xpReward} XP)
          </div>
          <p className="text-xs text-slate-300">
            You engineered a structured, POPIA-compliant prompt and caught every AI red flag. Next stage unlocked!
          </p>
        </div>
      )}
    </div>
  );
};
export default PromptLabSimulator;

