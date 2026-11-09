import React, { useState, useEffect, useRef } from 'react';
import { AnimationLessonSection } from '../../types';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  SkipBack, 
  Activity, 
  Flame, 
  Wind, 
  Gauge, 
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface AnimatedLessonProps {
  section: AnimationLessonSection;
}

export const AnimatedLesson: React.FC<AnimatedLessonProps> = ({ section }) => {
  const { title, description, steps } = section;
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2>(1);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const activeStep = steps[currentStepIdx] || steps[0];

  useEffect(() => {
    if (isPlaying) {
      const delay = (4000 / playbackSpeed);
      timerRef.current = setTimeout(() => {
        setCurrentStepIdx(prev => (prev + 1) % steps.length);
      }, delay);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentStepIdx, playbackSpeed, steps.length]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const stepForward = () => {
    setIsPlaying(false);
    setCurrentStepIdx(prev => (prev + 1) % steps.length);
  };
  const stepBack = () => {
    setIsPlaying(false);
    setCurrentStepIdx(prev => (prev - 1 + steps.length) % steps.length);
  };
  const restart = () => {
    setCurrentStepIdx(0);
    setIsPlaying(true);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Title & Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--bg-card)] border border-[var(--border-color)] p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
              <Activity size={12} />
              Animated Technical Demonstration
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Step {currentStepIdx + 1} of {steps.length}
            </span>
          </div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight mt-1">
            {title}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {description}
          </p>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 bg-slate-900/80 border border-slate-800 p-1.5 rounded-xl">
          <button
            type="button"
            onClick={stepBack}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Previous step"
          >
            <SkipBack size={16} />
          </button>

          <button
            type="button"
            onClick={togglePlay}
            className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold flex items-center gap-1.5 transition-colors"
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            <span className="text-xs">{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          <button
            type="button"
            onClick={stepForward}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Next step"
          >
            <SkipForward size={16} />
          </button>

          <button
            type="button"
            onClick={restart}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Restart animation"
          >
            <RotateCcw size={16} />
          </button>

          <button
            type="button"
            onClick={() => setPlaybackSpeed(playbackSpeed === 1 ? 2 : 1)}
            className="px-2 py-1 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            {playbackSpeed}x
          </button>
        </div>
      </div>

      {/* Main Visual Stage */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-2xl">
        {/* Animated Heat Pipe & Phase Change Vector Canvas */}
        <div className="relative aspect-[16/8] w-full bg-[#070d18] rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
          <svg
            viewBox="0 0 800 400"
            className="w-full h-full select-none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="heatGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="40%" stopColor="#f59e0b" />
                <stop offset="70%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>
              <linearGradient id="vaporGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#fca5a5" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.3" />
              </linearGradient>
            </defs>

            {/* Background Grid */}
            <pattern id="animGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <rect width="20" height="20" fill="none" stroke="#101c30" strokeWidth="0.5" />
            </pattern>
            <rect width="800" height="400" fill="url(#animGrid)" />

            {/* Left Heat Source: CPU Die */}
            <g transform="translate(60, 140)">
              <rect x="0" y="0" width="130" height="120" rx="8" fill="#1e293b" stroke="#334155" strokeWidth="2" />
              <rect x="15" y="15" width="100" height="90" rx="6" fill="#0f172a" />
              <circle cx="65" cy="60" r="30" fill={currentStepIdx === 0 || currentStepIdx === 1 ? '#ef4444' : '#b91c1c'} opacity="0.8">
                <animate attributeName="r" values="28;34;28" dur="2s" repeatCount="indefinite" />
              </circle>
              <text x="65" y="55" fill="#ffffff" fontSize="13" fontFamily="monospace" textAnchor="middle" fontWeight="black">
                CPU DIE
              </text>
              <text x="65" y="73" fill="#fca5a5" fontSize="10" fontFamily="monospace" textAnchor="middle">
                TDP: 45W - 85°C
              </text>
              <text x="65" y="105" fill="#f59e0b" fontSize="8" fontFamily="sans-serif" textAnchor="middle">
                (Heat Generation)
              </text>
            </g>

            {/* Copper Heatpipe Enclosure */}
            <g transform="translate(190, 165)">
              {/* Outer Copper Pipe */}
              <rect x="0" y="0" width="440" height="70" rx="35" fill="none" stroke="url(#heatGradient)" strokeWidth="16" />
              {/* Inner Hollow Vapor Cavity */}
              <rect x="5" y="5" width="430" height="60" rx="30" fill="#090f1d" stroke="#1e293b" strokeWidth="2" />
              
              {/* Wick Structure Layer (Internal Capillary Mesh) */}
              <line x1="20" y1="12" x2="420" y2="12" stroke="#d97706" strokeWidth="3" strokeDasharray="4,2" />
              <line x1="20" y1="58" x2="420" y2="58" stroke="#0284c7" strokeWidth="3" strokeDasharray="4,2" />

              {/* Vapor Molecules Floating to the Right (Evaporation) */}
              <g opacity={currentStepIdx >= 1 ? '1' : '0.3'}>
                <circle cx="60" cy="35" r="5" fill="#ef4444">
                  <animate attributeName="cx" values="60;380" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="fill" values="#ef4444;#f59e0b;#38bdf8" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle cx="120" cy="25" r="4" fill="#f59e0b">
                  <animate attributeName="cx" values="120;400" dur="2.2s" repeatCount="indefinite" />
                  <animate attributeName="fill" values="#ef4444;#f59e0b;#38bdf8" dur="2.2s" repeatCount="indefinite" />
                </circle>
                <circle cx="90" cy="45" r="4.5" fill="#f97316">
                  <animate attributeName="cx" values="90;360" dur="1.8s" repeatCount="indefinite" />
                  <animate attributeName="fill" values="#ef4444;#f59e0b;#38bdf8" dur="1.8s" repeatCount="indefinite" />
                </circle>
              </g>

              {/* Liquid Condensate Flowing Back to Left along Sintered Wick (Capillary Action) */}
              <g opacity={currentStepIdx >= 2 ? '1' : '0.3'}>
                <circle cx="390" cy="58" r="3.5" fill="#38bdf8">
                  <animate attributeName="cx" values="390;40" dur="2.5s" repeatCount="indefinite" />
                </circle>
                <circle cx="300" cy="58" r="3" fill="#0284c7">
                  <animate attributeName="cx" values="300;30" dur="2.7s" repeatCount="indefinite" />
                </circle>
                <circle cx="200" cy="12" r="3" fill="#38bdf8">
                  <animate attributeName="cx" values="380;40" dur="3s" repeatCount="indefinite" />
                </circle>
              </g>

              {/* Directional Indicator Labels */}
              <text x="215" y="32" fill="#fca5a5" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                HOT VAPOR → (Convection to Fins)
              </text>
              <text x="215" y="52" fill="#7dd3fc" fontSize="9" fontFamily="monospace" textAnchor="middle">
                ← COOLED LIQUID (Capillary Wick Return)
              </text>
            </g>

            {/* Right Cooling Assembly: Heatsink Fins + Centrifugal Exhaust Fan */}
            <g transform="translate(630, 110)">
              {/* Aluminum Fin Stack */}
              <g stroke="#94a3b8" strokeWidth="2.5">
                {[0, 10, 20, 30, 40, 50, 60].map((yOff) => (
                  <line key={yOff} x1="0" y1={30 + yOff} x2="35" y2={30 + yOff} />
                ))}
              </g>
              <text x="17" y="20" fill="#94a3b8" fontSize="8" fontFamily="monospace" textAnchor="middle">
                FIN STACK
              </text>

              {/* Centrifugal Blower Fan */}
              <circle cx="95" cy="90" r="50" fill="#0f172a" stroke="#38bdf8" strokeWidth="3" />
              <circle cx="95" cy="90" r="42" fill="#1e293b" />
              <g transform="translate(95, 90)">
                <circle cx="0" cy="0" r="14" fill="#38bdf8" />
                {/* Fan Blades Rotating */}
                <g>
                  <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="0.8s" repeatCount="indefinite" />
                  <path d="M 0 -38 L 10 -20 L -10 -20 Z" fill="#94a3b8" />
                  <path d="M 38 0 L 20 10 L 20 -10 Z" fill="#94a3b8" />
                  <path d="M 0 38 L -10 20 L 10 20 Z" fill="#94a3b8" />
                  <path d="M -38 0 L -20 -10 L -20 10 Z" fill="#94a3b8" />
                </g>
              </g>

              {/* Exhaust Air Stream */}
              <g opacity={currentStepIdx === 2 || currentStepIdx === 3 ? '1' : '0.4'}>
                <path d="M 145 75 Q 165 70 180 60" fill="none" stroke="#38bdf8" strokeWidth="3" strokeDasharray="6,4">
                  <animate attributeName="stroke-dashoffset" values="20;0" dur="0.5s" repeatCount="indefinite" />
                </path>
                <path d="M 145 90 Q 165 90 185 90" fill="none" stroke="#38bdf8" strokeWidth="3" strokeDasharray="6,4">
                  <animate attributeName="stroke-dashoffset" values="20;0" dur="0.5s" repeatCount="indefinite" />
                </path>
                <path d="M 145 105 Q 165 110 180 120" fill="none" stroke="#38bdf8" strokeWidth="3" strokeDasharray="6,4">
                  <animate attributeName="stroke-dashoffset" values="20;0" dur="0.5s" repeatCount="indefinite" />
                </path>
                <text x="160" y="145" fill="#38bdf8" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                  HEAT EXHAUST
                </text>
              </g>
            </g>
          </svg>

          {/* Real-Time Phase Status Badge on Canvas */}
          <div className="absolute bottom-4 left-4 bg-slate-950/90 border border-slate-800 backdrop-blur-md px-4 py-2 rounded-xl flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <div className="text-xs font-mono">
              <span className="text-slate-400">Target Element: </span>
              <span className="text-cyan-300 font-bold">{activeStep.highlightedElement}</span>
            </div>
            {activeStep.metrics && (
              <div className="text-xs font-mono border-l border-slate-800 pl-3">
                <span className="text-slate-400">{activeStep.metrics.label}: </span>
                <span className="text-emerald-400 font-black">{activeStep.metrics.value}</span>
              </div>
            )}
          </div>
        </div>

        {/* Step Breakdown Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-6">
          {steps.map((step, sIdx) => {
            const isCurrent = sIdx === currentStepIdx;
            return (
              <button
                key={sIdx}
                type="button"
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentStepIdx(sIdx);
                }}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  isCurrent
                    ? 'bg-cyan-950/40 border-cyan-500/60 shadow-lg shadow-cyan-500/10'
                    : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[10px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                    isCurrent ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}>
                    Stage 0{step.stepNumber}
                  </span>
                  {isCurrent && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />}
                </div>
                <div className="text-xs font-bold text-white line-clamp-1">
                  {step.label}
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Stage Technical Explanation */}
        <div className="mt-6 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2">
            <div className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Sparkles size={14} />
              Phase Mechanics Breakdown (Stage {activeStep.stepNumber}: {activeStep.label})
            </div>
            <p className="text-sm md:text-base text-slate-200 leading-relaxed font-medium">
              {activeStep.description}
            </p>
          </div>

          <div className="shrink-0 bg-slate-900/80 p-4 rounded-xl border border-slate-800 min-w-[200px] text-center">
            <div className="text-[10px] font-mono uppercase text-slate-400">CompTIA Exam Rule:</div>
            <div className="text-xs font-bold text-amber-300 mt-1">
              "Thermal paste bridges microscopic air gaps between die and heatpipe"
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
