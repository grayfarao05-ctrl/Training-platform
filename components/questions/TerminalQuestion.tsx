import React, { useState, useEffect, useRef } from 'react';
import { TestQuestion } from '../../types';
import { normalizeAnswerText, isAnswerCorrect } from '../../questionScoring';
import { Terminal as TerminalIcon, HelpCircle, CheckCircle2, XCircle, Send } from 'lucide-react';

interface TerminalQuestionProps {
  question: TestQuestion;
  value: string | undefined;
  onChange: (val: string) => void;
  onSubmitAnswer?: () => void;
  disabled?: boolean;
  showCorrectness?: boolean;
}

export const TerminalQuestion: React.FC<TerminalQuestionProps> = ({
  question,
  value = '',
  onChange,
  onSubmitAnswer,
  disabled = false,
  showCorrectness = false
}) => {
  const [inputCommand, setInputCommand] = useState(value || '');
  const [showHint, setShowHint] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputCommand(value || '');
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputCommand(e.target.value);
    onChange(e.target.value);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || !inputCommand.trim()) return;
    if (onSubmitAnswer) {
      onSubmitAnswer();
    }
  };

  const isCorrect = isAnswerCorrect(question, value);
  const isWindowsPrompt = (question.prompt || '').toLowerCase().includes('windows') ||
                          (question.acceptedCommands || []).some(c => c.includes('\\') || c.toLowerCase().includes('ipconfig'));

  const promptPrefix = isWindowsPrompt ? 'C:\\>' : '$';

  return (
    <div className="space-y-4 max-w-3xl">
      {/* Terminal Prompt Instruction */}
      {question.prompt && (
        <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 flex items-center gap-2">
          <TerminalIcon size={16} className="text-emerald-400 shrink-0" />
          <span>{question.prompt}</span>
        </div>
      )}

      {/* Mini Command Line Box (reusing Command Line Challenge CRT look) */}
      <div 
        className="bg-black rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl font-mono text-xs sm:text-sm relative select-none"
        onClick={() => inputRef.current?.focus()}
      >
        {/* Terminal Titlebar with dots */}
        <div className="bg-zinc-900/90 border-b border-zinc-800 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
            <span className="text-[11px] font-bold text-zinc-400 ml-2 tracking-wider">
              bash / powershell session
            </span>
          </div>

          {question.hint && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowHint(prev => !prev);
              }}
              className="text-[10px] font-bold uppercase tracking-wider text-yellow-500/80 hover:text-yellow-400 flex items-center gap-1 transition-colors"
            >
              <HelpCircle size={12} /> {showHint ? 'Hide Hint' : 'Hint'}
            </button>
          )}
        </div>

        {/* Terminal Window Content */}
        <div className="p-4 sm:p-6 space-y-3 bg-black">
          {/* Optional Hint Line */}
          {showHint && question.hint && (
            <div className="text-yellow-400/90 italic text-xs bg-yellow-950/20 p-2.5 rounded border border-yellow-800/40">
              # HINT: {question.hint}
            </div>
          )}

          {/* Interactive or Answered Prompt Line */}
          <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold select-none">{promptPrefix}</span>
            <input
              ref={inputRef}
              type="text"
              value={inputCommand}
              onChange={handleInputChange}
              disabled={disabled}
              placeholder={disabled ? '' : 'type command and press Enter...'}
              autoComplete="off"
              spellCheck="false"
              className="flex-1 bg-transparent border-none outline-none text-white font-mono text-sm caret-emerald-400 disabled:opacity-80 focus:ring-0 p-0"
            />
            {!disabled && onSubmitAnswer && inputCommand.trim() && (
              <button
                type="submit"
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-black font-black text-[10px] uppercase tracking-wider rounded transition-colors flex items-center gap-1"
              >
                <span>Enter</span>
                <Send size={10} />
              </button>
            )}
          </form>

          {/* Simulated Output Display after answering */}
          {(showCorrectness || (disabled && value)) && (
            <div className="pt-2 border-t border-zinc-800/60 font-mono text-xs space-y-1 animate-in fade-in duration-150">
              {isCorrect ? (
                <>
                  <div className="text-emerald-400 font-bold">
                    [OK] {question.simulatedOutput || 'Command executed successfully (exit code 0).'}
                  </div>
                </>
              ) : (
                <div className="text-rose-400">
                  bash: command not recognized or syntax invalid.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Review Screen Command Comparison */}
      {showCorrectness && (
        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-2 text-xs">
          <div className="flex items-center gap-2">
            {isCorrect ? (
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            ) : (
              <XCircle size={16} className="text-rose-400 shrink-0" />
            )}
            <span className="font-bold uppercase tracking-wider text-[var(--text-main)]">
              {isCorrect ? 'Command Accepted!' : 'Command Verification:'}
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 pt-2 border-t border-[var(--border-color)] font-mono text-[11px]">
            <div>
              <span className="text-[var(--text-muted)] block text-[10px] uppercase tracking-wider mb-1">
                Your Input:
              </span>
              <span className={`p-2 rounded block ${isCorrect ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'}`}>
                {value ? `${promptPrefix} ${value}` : '(No command typed)'}
              </span>
            </div>

            <div>
              <span className="text-[var(--text-muted)] block text-[10px] uppercase tracking-wider mb-1">
                Accepted Command(s):
              </span>
              <div className="space-y-1">
                {(question.acceptedCommands || []).map((cmd, idx) => (
                  <span key={idx} className="p-1.5 px-2 rounded block bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {promptPrefix} {cmd}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TerminalQuestion;
