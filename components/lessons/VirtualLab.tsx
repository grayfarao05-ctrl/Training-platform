import React, { useState, useMemo, useEffect } from 'react';
import { VirtualLabSection } from '../../types';
import { 
  Wrench, 
  ShieldAlert, 
  CheckCircle2, 
  RotateCcw, 
  Sparkles, 
  Zap, 
  Cpu, 
  HardDrive,
  Crosshair,
  Hand,
  AlertTriangle,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface VirtualLabProps {
  section: VirtualLabSection;
  onRewardXP?: (xp: number) => void;
  onStageComplete?: () => void;
}

const DEFAULT_HOTSPOT_COORDS: { x: number; y: number; zone: string }[] = [
  { x: 24, y: 26, zone: 'Primary Power / Battery Interlock' },
  { x: 52, y: 34, zone: 'Retention Latch / Fastener Assembly' },
  { x: 74, y: 42, zone: 'Interface Socket / Bus Connector' },
  { x: 38, y: 66, zone: 'Secondary Module / Thermal Pad' },
  { x: 66, y: 72, zone: 'Diagnostic Verification Point' },
  { x: 50, y: 50, zone: 'Central System Bus' }
];

export const VirtualLab: React.FC<VirtualLabProps> = ({ section, onRewardXP, onStageComplete }) => {
  const { labTitle, goal, hardwareSubject, prerequisites, steps, successMessage, xpReward } = section;
  
  // Build the tool dock from the steps' required tools + standard distractor/tech tools
  const toolKit = useMemo(() => {
    const stepTools = steps
      .map(s => (s.toolRequired && s.toolRequired.trim() ? s.toolRequired.trim() : 'Technician Hands / ESD Safe'))
      .filter(Boolean);
    const defaults = [
      'ESD Wrist Strap',
      'Phillips #0 Screwdriver',
      'Plastic Spudger',
      'Technician Hands / ESD Safe'
    ];
    return Array.from(new Set([...stepTools, ...defaults]));
  }, [steps]);

  const [completedStepIds, setCompletedStepIds] = useState<string[]>([]);
  const [equippedTool, setEquippedTool] = useState<string | null>(toolKit[0] || null);
  const [activeFeedback, setActiveFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  } | null>(null);
  const [rewardClaimed, setRewardClaimed] = useState<boolean>(false);
  const [pulsingErrorStepId, setPulsingErrorStepId] = useState<string | null>(null);

  const currentStepIndex = completedStepIds.length;
  const activeStep = steps[currentStepIndex];
  const isAllDone = completedStepIds.length === steps.length;

  useEffect(() => {
    if (isAllDone && onStageComplete) {
      onStageComplete();
    }
  }, [isAllDone, onStageComplete]);

  // Required tool for the current active step
  const getRequiredToolForStep = (stepIdx: number): string => {
    const step = steps[stepIdx];
    if (!step) return 'Technician Hands / ESD Safe';
    return step.toolRequired && step.toolRequired.trim()
      ? step.toolRequired.trim()
      : 'Technician Hands / ESD Safe';
  };

  const handleHotspotClick = (stepIdx: number) => {
    const clickedStep = steps[stepIdx];
    if (!clickedStep) return;

    // Already completed step
    if (completedStepIds.includes(clickedStep.id)) {
      setActiveFeedback({
        type: 'info',
        title: `Step ${stepIdx + 1} Already Verified`,
        message: clickedStep.feedbackOnSuccess
      });
      return;
    }

    // Clicked out of order!
    if (stepIdx !== currentStepIndex) {
      setPulsingErrorStepId(clickedStep.id);
      setTimeout(() => setPulsingErrorStepId(null), 900);
      setActiveFeedback({
        type: 'error',
        title: 'Procedural Sequence Violation!',
        message: `You attempted Step ${stepIdx + 1} ("${clickedStep.instruction}") before completing Step ${currentStepIndex + 1} ("${activeStep?.instruction}"). Always follow strict ESD & teardown sequence!`
      });
      return;
    }

    // Check if the right tool is equipped
    const requiredTool = getRequiredToolForStep(stepIdx);
    if (equippedTool !== requiredTool) {
      setPulsingErrorStepId(clickedStep.id);
      setTimeout(() => setPulsingErrorStepId(null), 900);
      setActiveFeedback({
        type: 'error',
        title: 'Incorrect Tool Equipped!',
        message: `You tried to use "${equippedTool || 'No Tool'}" on "${clickedStep.instruction}". Equip "${requiredTool}" from the Technician Tool Dock first, then click the target hotspot.`
      });
      return;
    }

    // Success!
    const nextCompleted = [...completedStepIds, clickedStep.id];
    setCompletedStepIds(nextCompleted);
    setActiveFeedback({
      type: 'success',
      title: `Step ${stepIdx + 1} Executed with ${requiredTool}`,
      message: clickedStep.feedbackOnSuccess
    });

    // Auto-Completion celebration
    if (nextCompleted.length === steps.length) {
      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // ignore
      }
      if (!rewardClaimed && onRewardXP) {
        onRewardXP(xpReward);
        setRewardClaimed(true);
      }
      if (onStageComplete) {
        onStageComplete();
      }
    }
  };

  const resetLab = () => {
    setCompletedStepIds([]);
    setActiveFeedback(null);
    setEquippedTool(toolKit[0] || null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Lab Header */}
      <div className="bg-[#0B0D19]/90 border border-white/10 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
              <Wrench size={12} />
              Interactive Workbench 2.0
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Target: {hardwareSubject}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              +{xpReward} XP Lab Bounty
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight mt-1.5">
            {labTitle}
          </h2>
          <p className="text-xs md:text-sm text-slate-300 mt-1">
            <span className="text-indigo-400 font-bold">Mission Goal:</span> {goal}
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] font-mono uppercase text-slate-400">Workbench Progress</div>
            <div className="text-sm font-black text-indigo-400">
              {completedStepIds.length} / {steps.length} Verified
            </div>
          </div>

          <button
            type="button"
            onClick={resetLab}
            className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>Reset Bench</span>
          </button>
        </div>
      </div>

      {/* Step 1 Instruction Banner: Click-to-Equip Tool Dock */}
      <div className="bg-[#0B0D19]/90 border border-indigo-500/25 rounded-2xl p-5 space-y-3 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center text-xs font-black">
              1
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-white">
              Technician Tool Dock — Click a tool to equip it
            </span>
          </div>
          <div className="text-xs font-mono text-indigo-300 flex items-center gap-1.5">
            <Hand size={13} className="text-cyan-400" />
            <span>Equipped in Hand:</span>
            <span className="px-2.5 py-0.5 rounded-lg bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 font-bold">
              {equippedTool || 'None'}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5 pt-1">
          {toolKit.map((tool) => {
            const isEquipped = equippedTool === tool;
            const isNeededNow = !isAllDone && getRequiredToolForStep(currentStepIndex) === tool;
            return (
              <button
                key={tool}
                type="button"
                onClick={() => setEquippedTool(tool)}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
                  isEquipped
                    ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white border-cyan-400 shadow-lg shadow-indigo-500/25 scale-[1.02]'
                    : 'bg-slate-950/90 text-slate-300 border-white/10 hover:border-indigo-500/50 hover:text-white'
                }`}
              >
                <Wrench size={14} className={isEquipped ? 'text-white' : 'text-indigo-400'} />
                <span>{tool}</span>
                {isNeededNow && !isEquipped && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" title="Recommended for current step" />
                )}
                {isEquipped && (
                  <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-black/30 text-cyan-200 font-mono">
                    Equipped
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Columns: Interactive Hardware Canvas with Target Hotspots */}
        <div className="lg:col-span-7 bg-[#060913] border border-white/10 rounded-3xl p-5 md:p-6 flex flex-col justify-between relative overflow-hidden min-h-[460px] shadow-2xl">
          {/* Top Canvas Bar */}
          <div className="flex items-center justify-between z-10 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 flex items-center justify-center text-xs font-black">
                2
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                Click the Target Hotspot on the Hardware Canvas
              </span>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold">
              ESD MAT GROUNDED
            </span>
          </div>

          {/* Interactive Hardware Blueprint SVG + Clickable Hotspots */}
          <div className="relative w-full aspect-[16/10] bg-[#040710] rounded-2xl border border-indigo-500/20 overflow-hidden shadow-inner">
            <svg
              viewBox="0 0 800 500"
              className="w-full h-full select-none opacity-85"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern id="benchGrid" width="32" height="32" patternUnits="userSpaceOnUse">
                  <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#1e293b" strokeWidth="0.7" />
                </pattern>
                <linearGradient id="boardSurface" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0f172a" />
                  <stop offset="100%" stopColor="#090d16" />
                </linearGradient>
              </defs>

              <rect width="800" height="500" fill="url(#benchGrid)" />

              {/* Anti-static mat perimeter */}
              <rect x="35" y="25" width="730" height="450" rx="20" fill="url(#boardSurface)" stroke="#334155" strokeWidth="2" />
              <rect x="55" y="45" width="690" height="410" rx="12" fill="#060b16" stroke="#1e293b" strokeWidth="1.5" strokeDasharray="6,4" />

              {/* Hardware Subsystem Zones */}
              {/* Zone 1: Power / Battery Interlock */}
              <g transform="translate(85, 70)">
                <rect x="0" y="0" width="210" height="120" rx="10" fill="#111827" stroke="#3b82f6" strokeWidth="1.5" />
                <text x="15" y="24" fill="#60a5fa" fontSize="11" fontFamily="monospace" fontWeight="bold">
                  PWR_INTERLOCK / BATTERY
                </text>
                <rect x="20" y="40" width="170" height="60" rx="6" fill="#030712" stroke="#1f2937" />
                <line x1="40" y1="70" x2="170" y2="70" stroke="#ef4444" strokeWidth="2" strokeDasharray="4,4" />
              </g>

              {/* Zone 2: Central Processor / Retention Assembly */}
              <g transform="translate(325, 85)">
                <rect x="0" y="0" width="190" height="160" rx="12" fill="#0f172a" stroke="#6366f1" strokeWidth="2" />
                <rect x="35" y="35" width="120" height="90" rx="8" fill="#1e1b4b" stroke="#818cf8" strokeWidth="1.5" />
                <text x="95" y="84" fill="#c7d2fe" fontSize="11" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                  CORE SOCKET / BAY
                </text>
              </g>

              {/* Zone 3: High-Speed Interface / Bus Slots */}
              <g transform="translate(545, 95)">
                <rect x="0" y="0" width="175" height="210" rx="10" fill="#0f172a" stroke="#06b6d4" strokeWidth="1.5" />
                <rect x="22" y="35" width="38" height="150" rx="4" fill="#083344" stroke="#22d3ee" />
                <rect x="75" y="35" width="38" height="150" rx="4" fill="#083344" stroke="#22d3ee" />
                <rect x="128" y="35" width="28" height="150" rx="4" fill="#164e63" stroke="#38bdf8" />
                <text x="87" y="22" fill="#67e8f9" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                  EXPANSION / I/O BUS
                </text>
              </g>

              {/* Zone 4: Secondary Module / Storage / Cooling */}
              <g transform="translate(135, 245)">
                <rect x="0" y="0" width="360" height="165" rx="10" fill="#0f172a" stroke="#10b981" strokeWidth="1.5" />
                <rect x="25" y="35" width="145" height="105" rx="6" fill="#022c22" stroke="#34d399" strokeWidth="1" />
                <rect x="195" y="35" width="140" height="105" rx="6" fill="#064e3b" stroke="#10b981" strokeWidth="1" />
                <text x="180" y="22" fill="#6ee7b7" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                  THERMAL / STORAGE / MODULE ARRAY
                </text>
              </g>

              {/* Copper Bus Traces */}
              <g stroke="#38bdf8" strokeWidth="1.5" opacity="0.35" fill="none">
                <path d="M 295 130 L 325 130" />
                <path d="M 515 165 L 545 165" />
                <path d="M 420 245 L 420 275 L 495 275" />
                <path d="M 495 330 L 630 330 L 630 305" />
              </g>
            </svg>

            {/* Interactive Target Hotspots Mapped to Each Lab Step */}
            {steps.map((step, idx) => {
              const fallback = DEFAULT_HOTSPOT_COORDS[idx % DEFAULT_HOTSPOT_COORDS.length];
              const x = step.targetX ?? fallback.x;
              const y = step.targetY ?? fallback.y;
              const zoneName = step.targetZoneLabel || fallback.zone;
              const isDone = completedStepIds.includes(step.id);
              const isCurrent = idx === currentStepIndex;
              const isErrorPulse = pulsingErrorStepId === step.id;
              const reqTool = getRequiredToolForStep(idx);

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => handleHotspotClick(idx)}
                  style={{ left: `${x}%`, top: `${y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group focus:outline-none z-20 cursor-pointer"
                  title={`Step ${idx + 1}: ${step.instruction}`}
                >
                  {/* Outer Radar Pulse for Current Active Target */}
                  {isCurrent && (
                    <span className="absolute -inset-3 rounded-full bg-cyan-400/35 animate-ping pointer-events-none" />
                  )}

                  {/* Pin Button */}
                  <div
                    className={`relative px-3 py-1.5 rounded-full flex items-center gap-1.5 font-mono text-xs font-black transition-all border-2 shadow-xl ${
                      isErrorPulse
                        ? 'bg-rose-600 text-white border-white scale-125'
                        : isDone
                        ? 'bg-emerald-500 text-slate-950 border-emerald-200 scale-100'
                        : isCurrent
                        ? 'bg-gradient-to-r from-indigo-600 to-cyan-500 text-white border-white scale-110 shadow-cyan-500/40'
                        : 'bg-slate-900/95 text-slate-400 border-slate-600 hover:border-cyan-400 hover:text-white'
                    }`}
                  >
                    {isDone ? (
                      <Check size={13} strokeWidth={3} />
                    ) : (
                      <Crosshair size={13} className={isCurrent ? 'animate-spin' : ''} />
                    )}
                    <span>#{idx + 1}</span>
                  </div>

                  {/* Hover / Active Label Pill */}
                  <div
                    className={`mt-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono whitespace-nowrap border backdrop-blur-md transition-all pointer-events-none ${
                      isDone
                        ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-300'
                        : isCurrent
                        ? 'bg-slate-950/95 border-cyan-500/60 text-cyan-200 shadow-lg'
                        : 'bg-slate-950/85 border-white/10 text-slate-400 opacity-80 group-hover:opacity-100'
                    }`}
                  >
                    <div className="font-bold">{zoneName}</div>
                    <div className="text-[9px] opacity-80">Tool: {reqTool}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Live Diagnostic & Safety Telemetry Bar */}
          <div className="mt-4 z-10">
            {activeFeedback ? (
              <div
                className={`p-4 rounded-2xl border text-xs flex items-start gap-3 animate-in fade-in duration-200 ${
                  activeFeedback.type === 'success'
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                    : activeFeedback.type === 'error'
                    ? 'bg-rose-950/50 border-rose-500/50 text-rose-200'
                    : 'bg-indigo-950/40 border-indigo-500/40 text-indigo-200'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {activeFeedback.type === 'success' && <CheckCircle2 size={18} className="text-emerald-400" />}
                  {activeFeedback.type === 'error' && <AlertTriangle size={18} className="text-rose-400" />}
                  {activeFeedback.type === 'info' && <Sparkles size={18} className="text-indigo-400" />}
                </div>
                <div className="space-y-1">
                  <div className="font-black uppercase tracking-wider text-[11px]">
                    {activeFeedback.title}
                  </div>
                  <p className="leading-relaxed opacity-95">{activeFeedback.message}</p>
                </div>
              </div>
            ) : activeStep ? (
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400">
                    Active Step #{currentStepIndex + 1} Target Instruction
                  </div>
                  <div className="text-xs md:text-sm font-bold text-white">
                    Equip <span className="text-cyan-300 underline decoration-cyan-500/50">{getRequiredToolForStep(currentStepIndex)}</span> and click Hotspot <span className="text-indigo-300 font-mono">#{currentStepIndex + 1}</span> on the workbench.
                  </div>
                </div>
                {activeStep.safetyWarning && (
                  <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] max-w-xs shrink-0">
                    <ShieldAlert size={16} className="text-amber-400 shrink-0" />
                    <span className="line-clamp-2">{activeStep.safetyWarning}</span>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>

        {/* Right 5 Columns: Procedural Checklist & Status */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-mono uppercase tracking-wider text-slate-400 px-1 flex items-center justify-between">
            <span>Standard Operating Procedure (SOP)</span>
            <span className="text-indigo-400 font-bold">Guided Gate Active</span>
          </div>

          {steps.map((step, sIdx) => {
            const isCompleted = completedStepIds.includes(step.id);
            const isCurrent = sIdx === currentStepIndex;
            const reqTool = getRequiredToolForStep(sIdx);

            return (
              <div
                key={step.id}
                onClick={() => {
                  if (isCurrent) {
                    setEquippedTool(reqTool);
                  }
                }}
                className={`p-4 rounded-2xl border transition-all ${
                  isCompleted
                    ? 'bg-emerald-950/20 border-emerald-500/40'
                    : isCurrent
                    ? 'bg-[#0F1326] border-indigo-500/60 shadow-lg shadow-indigo-500/10 cursor-pointer'
                    : 'bg-slate-900/30 border-white/5 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-black shrink-0 mt-0.5 ${
                        isCompleted
                          ? 'bg-emerald-500 text-slate-950'
                          : isCurrent
                          ? 'bg-indigo-500 text-white'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {isCompleted ? '✓' : sIdx + 1}
                    </div>
                    <div>
                      <h4 className={`text-sm font-black ${isCompleted ? 'text-emerald-300' : 'text-white'}`}>
                        {step.instruction}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {step.detail}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-2.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-mono border ${
                            equippedTool === reqTool && isCurrent
                              ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 font-bold'
                              : 'bg-slate-950 border-white/10 text-slate-300'
                          }`}
                        >
                          <Wrench size={10} className="text-indigo-400" />
                          Required Tool: {reqTool}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/25 text-[10px] font-mono text-indigo-300">
                          <Crosshair size={10} />
                          Hotspot #{sIdx + 1}
                        </span>
                      </div>

                      {step.safetyWarning && isCurrent && (
                        <div className="mt-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-[11px] flex items-center gap-2">
                          <ShieldAlert size={14} className="text-amber-400 shrink-0" />
                          <span>{step.safetyWarning}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {isAllDone && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/60 via-slate-900 to-indigo-950/40 border border-emerald-500/50 text-center space-y-2 animate-in zoom-in-95 duration-300">
              <Sparkles size={26} className="text-emerald-400 mx-auto" />
              <h4 className="text-base font-black text-white uppercase tracking-tight">
                Workbench Verification Complete!
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">{successMessage}</p>
              <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold">
                +{xpReward} XP Awarded • Next Stage Unlocked
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default VirtualLab;
