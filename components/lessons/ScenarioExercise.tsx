import React, { useState } from 'react';
import { ScenarioLessonSection, ScenarioChoice } from '../../types';
import { 
  Stethoscope, 
  Thermometer, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle, 
  RotateCcw, 
  ShieldAlert, 
  Flame, 
  Wind, 
  Monitor, 
  Cpu, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ScenarioExerciseProps {
  section: ScenarioLessonSection;
  onRewardXP?: (xp: number) => void;
  onStageComplete?: () => void;
}

export const ScenarioExercise: React.FC<ScenarioExerciseProps> = ({ section, onRewardXP, onStageComplete }) => {
  const { caseTitle, clientName, deviceModel, initialProblemDescription, startStepId, steps } = section;
  
  const [currentStepId, setCurrentStepId] = useState<string>(startStepId);
  const [history, setHistory] = useState<{
    stepTitle: string;
    choiceLabel: string;
    feedback: string;
    isResolved?: boolean;
    isFatal?: boolean;
  }[]>([]);
  const [isResolved, setIsResolved] = useState(false);
  const [isFatal, setIsFatal] = useState(false);

  const currentStep = steps[currentStepId] || steps[startStepId];

  const handleSelectChoice = (choice: ScenarioChoice) => {
    const newEntry = {
      stepTitle: currentStep.title,
      choiceLabel: choice.label,
      feedback: choice.feedback,
      isResolved: choice.isResolved,
      isFatal: choice.isFatal
    };

    setHistory(prev => [...prev, newEntry]);

    if (choice.isResolved) {
      setIsResolved(true);
      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } catch {
        // ignore
      }
      if (onRewardXP) {
        onRewardXP(150);
      }
      if (onStageComplete) {
        onStageComplete();
      }
    } else if (choice.isFatal) {
      setIsFatal(true);
    } else if (choice.nextStepId && steps[choice.nextStepId]) {
      setCurrentStepId(choice.nextStepId);
    }
  };

  const restartScenario = () => {
    setCurrentStepId(startStepId);
    setHistory([]);
    setIsResolved(false);
    setIsFatal(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center gap-1">
              <Stethoscope size={12} />
              CompTIA 6-Step Troubleshooting Simulation
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Field Scenario Lab
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight mt-1">
            {caseTitle}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Client: <span className="text-slate-200 font-bold">{clientName}</span> • Target: <span className="text-slate-200 font-bold">{deviceModel}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={restartScenario}
          className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 bg-slate-900 border border-slate-700 text-slate-300 hover:text-white transition-colors self-start md:self-auto shrink-0"
        >
          <RotateCcw size={14} />
          <span>Restart Case</span>
        </button>
      </div>

      {/* Initial Client Statement Briefing */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/30">
          <HelpCircle size={20} />
        </div>
        <div className="space-y-1">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-purple-300">
            Initial Work Order & Symptom Description:
          </div>
          <p className="text-xs md:text-sm text-slate-200 leading-relaxed font-medium">
            "{initialProblemDescription}"
          </p>
        </div>
      </div>

      {/* System Telemetry Dashboard */}
      {currentStep && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
            <Cpu size={20} className="text-cyan-400" />
            <div>
              <div className="text-[10px] font-mono uppercase text-slate-500">Power State</div>
              <div className="text-xs font-bold font-mono text-white capitalize">{currentStep.systemState.power}</div>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
            <Thermometer size={20} className={currentStep.systemState.tempReading?.includes('9') ? 'text-rose-500 animate-pulse' : 'text-amber-400'} />
            <div>
              <div className="text-[10px] font-mono uppercase text-slate-500">Thermal Probe</div>
              <div className="text-xs font-bold font-mono text-rose-400">{currentStep.systemState.tempReading || 'Normal (42°C)'}</div>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
            <Wind size={20} className="text-blue-400" />
            <div>
              <div className="text-[10px] font-mono uppercase text-slate-500">Fan Acoustic</div>
              <div className="text-xs font-bold font-mono text-white capitalize">{currentStep.systemState.fan}</div>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
            <Monitor size={20} className="text-indigo-400" />
            <div>
              <div className="text-[10px] font-mono uppercase text-slate-500">Display State</div>
              <div className="text-xs font-bold font-mono text-white capitalize">{currentStep.systemState.screen}</div>
            </div>
          </div>
        </div>
      )}

      {/* Active Diagnostic Step & Decision Matrix */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 space-y-6 shadow-xl">
        {!isResolved && !isFatal ? (
          <>
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                Step: {currentStep.title}
              </span>
              <h3 className="text-lg md:text-xl font-black text-white mt-1 leading-snug">
                {currentStep.scenarioText}
              </h3>
            </div>

            {currentStep.customerStatement && (
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 text-xs text-slate-300 italic">
                "{currentStep.customerStatement}"
              </div>
            )}

            {/* Diagnostic Choices */}
            <div className="space-y-3 pt-2">
              <div className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
                Select Your Diagnostic Action:
              </div>

              <div className="grid grid-cols-1 gap-3">
                {currentStep.diagnosticOptions.map((choice) => (
                  <button
                    key={choice.id}
                    type="button"
                    onClick={() => handleSelectChoice(choice)}
                    className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-cyan-500/60 hover:bg-slate-800/80 text-left transition-all group flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <div className="text-xs md:text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {choice.label}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {choice.actionDescription}
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all shrink-0 ml-3" />
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : isResolved ? (
          <div className="text-center py-8 space-y-4 animate-in zoom-in-95">
            <CheckCircle2 size={48} className="text-emerald-400 mx-auto" />
            <h3 className="text-2xl font-black uppercase text-white tracking-tight">
              Root Cause Resolved & Verified!
            </h3>
            <p className="text-xs md:text-sm text-slate-300 max-w-lg mx-auto">
              You correctly followed the CompTIA A+ diagnostic methodology, pinpointed the defect, performed the repair safely, and verified system stability under stress testing.
            </p>
            <div className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold text-xs">
              +150 Diagnostic XP Awarded
            </div>
          </div>
        ) : (
          <div className="text-center py-8 space-y-4 animate-in zoom-in-95">
            <ShieldAlert size={48} className="text-rose-500 mx-auto" />
            <h3 className="text-2xl font-black uppercase text-rose-400 tracking-tight">
              Incorrect Action / Hazardous Diagnosis
            </h3>
            <p className="text-xs md:text-sm text-slate-300 max-w-lg mx-auto">
              This action could result in permanent hardware destruction, data loss, or safety hazards. Review the technician log below to learn why.
            </p>
            <button
              type="button"
              onClick={restartScenario}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-wider inline-flex items-center gap-2"
            >
              <RotateCcw size={14} />
              Retry Diagnostic Tree
            </button>
          </div>
        )}

        {/* Technician Action Log History */}
        {history.length > 0 && (
          <div className="pt-6 border-t border-slate-800 space-y-3">
            <div className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
              Technician Incident Log:
            </div>
            {history.map((entry, hIdx) => (
              <div 
                key={hIdx} 
                className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                  entry.isResolved
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                    : entry.isFatal
                    ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="font-bold text-slate-400">Action #{hIdx + 1}: {entry.choiceLabel}</span>
                  <span>{entry.stepTitle}</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  {entry.feedback}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
