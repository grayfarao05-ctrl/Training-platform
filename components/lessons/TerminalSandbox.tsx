import React, { useState, useRef, useEffect } from 'react';
import { TerminalLessonSection } from '../../types';
import { 
  Terminal as TerminalIcon, 
  CheckCircle2, 
  RotateCcw, 
  HelpCircle, 
  Sparkles, 
  ChevronRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TerminalSandboxProps {
  section: TerminalLessonSection;
  onRewardXP?: (xp: number) => void;
  onStageComplete?: () => void;
}

interface LogLine {
  id: string;
  type: 'command' | 'output' | 'error' | 'success' | 'system';
  text: string;
}

export const TerminalSandbox: React.FC<TerminalSandboxProps> = ({
  section,
  onRewardXP,
  onStageComplete
}) => {
  const { terminalTitle, environmentLabel, promptPrefix, briefing, tasks, xpReward } = section;

  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [inputCmd, setInputCmd] = useState<string>('');
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyCursor, setHistoryCursor] = useState<number>(-1);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [xpClaimed, setXpClaimed] = useState<boolean>(false);
  const [logs, setLogs] = useState<LogLine[]>([
    {
      id: 'init-1',
      type: 'system',
      text: `${environmentLabel} — Interactive Diagnostic Shell Initialized.`
    },
    {
      id: 'init-2',
      type: 'system',
      text: `Type the exact diagnostic command required for the active task below (or type "hint" / "clear").`
    }
  ]);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentTaskIdx = completedTaskIds.length;
  const activeTask = tasks[currentTaskIdx];
  const isAllDone = completedTaskIds.length === tasks.length;

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
    if (isAllDone && onStageComplete) {
      onStageComplete();
    }
  }, [isAllDone, onStageComplete]);

  const normalizeCommand = (cmd: string) =>
    cmd.trim().replace(/\s+/g, ' ').toLowerCase();

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = inputCmd.trim();
    if (!raw) return;

    const nextHistory = [raw, ...cmdHistory];
    setCmdHistory(nextHistory);
    setHistoryCursor(-1);
    setInputCmd('');

    const cmdLog: LogLine = {
      id: `cmd-${Date.now()}`,
      type: 'command',
      text: `${promptPrefix} ${raw}`
    };

    const normalized = normalizeCommand(raw);

    if (normalized === 'clear' || normalized === 'cls') {
      setLogs([]);
      return;
    }

    if (normalized === 'hint' || normalized === 'help') {
      setLogs(prev => [
        ...prev,
        cmdLog,
        {
          id: `hint-${Date.now()}`,
          type: 'system',
          text: activeTask
            ? `[TECH HINT]: ${activeTask.hint}`
            : 'All terminal tasks in this lab have been completed!'
        }
      ]);
      setShowHint(true);
      return;
    }

    if (!activeTask) {
      setLogs(prev => [
        ...prev,
        cmdLog,
        {
          id: `done-${Date.now()}`,
          type: 'success',
          text: 'All diagnostic tasks are already verified. Proceed to the next stage!'
        }
      ]);
      return;
    }

    const isMatch = activeTask.expectedCommands.some(
      expected => normalizeCommand(expected) === normalized
    );

    if (isMatch) {
      const nextCompleted = [...completedTaskIds, activeTask.id];
      setCompletedTaskIds(nextCompleted);
      setShowHint(false);

      setLogs(prev => [
        ...prev,
        cmdLog,
        {
          id: `out-${Date.now()}`,
          type: 'output',
          text: activeTask.commandOutput
        },
        {
          id: `ok-${Date.now()}`,
          type: 'success',
          text: `✓ TASK ${currentTaskIdx + 1} VERIFIED: ${activeTask.explanation}`
        }
      ]);

      if (nextCompleted.length === tasks.length) {
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
      setLogs(prev => [
        ...prev,
        cmdLog,
        {
          id: `err-${Date.now()}`,
          type: 'error',
          text: `Command "${raw}" did not satisfy Task #${currentTaskIdx + 1}. Check your syntax/flags carefully (or type "hint").`
        }
      ]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (cmdHistory.length === 0) return;
      const nextIdx = Math.min(historyCursor + 1, cmdHistory.length - 1);
      setHistoryCursor(nextIdx);
      setInputCmd(cmdHistory[nextIdx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyCursor <= 0) {
        setHistoryCursor(-1);
        setInputCmd('');
      } else {
        const nextIdx = historyCursor - 1;
        setHistoryCursor(nextIdx);
        setInputCmd(cmdHistory[nextIdx]);
      }
    }
  };

  const resetTerminal = () => {
    setCompletedTaskIds([]);
    setInputCmd('');
    setShowHint(false);
    setLogs([
      {
        id: `reset-${Date.now()}`,
        type: 'system',
        text: `${environmentLabel} — Session Reset. Ready for Task #1.`
      }
    ]);
    inputRef.current?.focus();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-[#0B0D19]/90 border border-white/10 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <TerminalIcon size={12} />
              Live CLI Sandbox (Strict Syntax)
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {environmentLabel}
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight mt-1">
            {terminalTitle}
          </h2>
          <p className="text-xs md:text-sm text-slate-300 mt-1">{briefing}</p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] font-mono uppercase text-slate-400">Tasks Executed</div>
            <div className="text-sm font-black text-emerald-400">
              {completedTaskIds.length} / {tasks.length} Verified
            </div>
          </div>
          <button
            type="button"
            onClick={resetTerminal}
            className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 bg-white/5 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>Reset Shell</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Cols: Interactive Terminal Emulator */}
        <div
          onClick={() => inputRef.current?.focus()}
          className="lg:col-span-7 bg-[#04070E] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col min-h-[440px] cursor-text"
        >
          {/* Terminal Window Chrome */}
          <div className="bg-[#0B101E] border-b border-slate-800 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 text-xs font-mono text-slate-400 font-bold">
                {environmentLabel}
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowHint(!showHint);
              }}
              className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-mono flex items-center gap-1 hover:bg-amber-500/20 cursor-pointer"
            >
              <HelpCircle size={12} />
              <span>{showHint ? 'Hide Syntax Hint' : 'Show Syntax Hint'}</span>
            </button>
          </div>

          {/* Active Prompt Mission Banner inside Terminal */}
          {activeTask && (
            <div className="bg-indigo-950/35 border-b border-indigo-500/30 px-5 py-3.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-300 font-bold">
                  Active CLI Objective #{currentTaskIdx + 1} of {tasks.length}
                </span>
                <span className="text-[10px] font-mono text-emerald-400">
                  Strict Command Typing Required
                </span>
              </div>
              <p className="text-xs md:text-sm font-bold text-white">
                {activeTask.promptInstruction}
              </p>
              {showHint && (
                <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs font-mono mt-1">
                  Hint: {activeTask.hint}
                </div>
              )}
            </div>
          )}

          {/* Scrollable Output Buffer */}
          <div className="flex-1 p-5 font-mono text-xs md:text-sm space-y-3 overflow-y-auto max-h-[340px]">
            {logs.map((line) => (
              <div
                key={line.id}
                className={`whitespace-pre-wrap leading-relaxed ${
                  line.type === 'command'
                    ? 'text-cyan-300 font-bold'
                    : line.type === 'output'
                    ? 'text-slate-300 pl-3 border-l-2 border-slate-700'
                    : line.type === 'success'
                    ? 'text-emerald-400 font-bold bg-emerald-950/30 p-3 rounded-xl border border-emerald-500/30'
                    : line.type === 'error'
                    ? 'text-rose-400 bg-rose-950/30 p-2.5 rounded-xl border border-rose-500/30'
                    : 'text-slate-400 italic'
                }`}
              >
                {line.text}
              </div>
            ))}
            <div ref={terminalEndRef} />
          </div>

          {/* Command Input Prompt */}
          <form
            onSubmit={handleCommandSubmit}
            className="bg-[#080D1A] border-t border-slate-800 px-4 py-3.5 flex items-center gap-2"
          >
            <span className="font-mono text-xs md:text-sm text-emerald-400 font-bold shrink-0">
              {promptPrefix}
            </span>
            <input
              ref={inputRef}
              type="text"
              value={inputCmd}
              onChange={(e) => setInputCmd(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isAllDone}
              placeholder={
                isAllDone
                  ? 'All CLI tasks verified!'
                  : 'Type exact command here and press Enter...'
              }
              autoFocus
              spellCheck={false}
              autoComplete="off"
              className="flex-1 bg-transparent text-white font-mono text-xs md:text-sm focus:outline-none placeholder:text-slate-600"
            />
            <button
              type="submit"
              disabled={isAllDone || !inputCmd.trim()}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-mono font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              Execute
            </button>
          </form>
        </div>

        {/* Right 5 Cols: Task Progression Queue */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-mono uppercase tracking-wider text-slate-400 px-1">
            Terminal Verification Checklist
          </div>

          {tasks.map((t, idx) => {
            const isDone = completedTaskIds.includes(t.id);
            const isCurrent = idx === currentTaskIdx;

            return (
              <div
                key={t.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isDone
                    ? 'bg-emerald-950/20 border-emerald-500/40'
                    : isCurrent
                    ? 'bg-[#0F1326] border-cyan-500/60 shadow-lg'
                    : 'bg-slate-900/30 border-white/5 opacity-60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono text-xs font-black shrink-0 mt-0.5 ${
                      isDone
                        ? 'bg-emerald-500 text-slate-950'
                        : isCurrent
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isDone ? '✓' : idx + 1}
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <h4 className={`text-xs md:text-sm font-bold ${isDone ? 'text-emerald-300' : 'text-white'}`}>
                      {t.promptInstruction}
                    </h4>
                    {isDone && (
                      <div className="space-y-1 pt-1">
                        <div className="inline-block px-2 py-0.5 rounded bg-slate-950 border border-emerald-500/30 font-mono text-[11px] text-emerald-300">
                          $ {t.expectedCommands[0]}
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {t.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {isAllDone && (
            <div className="p-5 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 text-center space-y-2 animate-in zoom-in-95">
              <ShieldCheck size={28} className="text-emerald-400 mx-auto" />
              <div className="text-sm font-black uppercase text-white">
                CLI Diagnostics Mastered (+{xpReward} XP)
              </div>
              <p className="text-xs text-slate-300">
                All required commands executed with 100% syntax accuracy. Next stage unlocked!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default TerminalSandbox;

