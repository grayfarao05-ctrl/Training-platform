import React, { useState } from 'react';
import { 
  FileText, Flag, CheckCircle2, XCircle, AlertTriangle, Eye, EyeOff, 
  Sparkles, ShieldAlert, Award, FileWarning
} from 'lucide-react';
import type { ContractClause, ContractFlagCategory } from '../../types';
import { CONTRACT_FLAG_CATEGORIES } from '../../referenceFiguresService';

interface ContractPaperProps {
  clauses: ContractClause[];
  title?: string;
  mode?: 'preview' | 'play' | 'review';
  flaggedClauseIds?: Set<string>;
  wrongClauseIds?: Set<string>;
  revealedMissedClauseIds?: Set<string>;
  hintedClauseId?: string | null;
  onClauseTap?: (clause: ContractClause) => void;
  disabled?: boolean;
  highlightFlagsInPreview?: boolean;
  className?: string;
}

const CATEGORY_MAP = new Map(CONTRACT_FLAG_CATEGORIES.map(c => [c.id, c.label]));

export const ContractPaper: React.FC<ContractPaperProps> = ({
  clauses,
  title = 'Standard Employment Agreement',
  mode = 'preview',
  flaggedClauseIds = new Set(),
  wrongClauseIds = new Set(),
  revealedMissedClauseIds = new Set(),
  hintedClauseId = null,
  onClauseTap,
  disabled = false,
  highlightFlagsInPreview = true,
  className = ''
}) => {
  const [showAdminKey, setShowAdminKey] = useState(highlightFlagsInPreview);
  const isInteractive = mode === 'play' && !disabled;

  return (
    <div className={`relative bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-xl overflow-hidden transition-colors ${className}`}>
      {/* Paper Top Accent & Watermark */}
      <div className="h-2.5 bg-gradient-to-r from-red-600 via-amber-500 to-rose-600 w-full" />

      {/* Admin Preview Switch */}
      {mode === 'preview' && (
        <div className="px-6 py-2.5 bg-slate-100 dark:bg-zinc-900/90 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between text-xs">
          <span className="font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 flex items-center gap-1.5">
            <ShieldAlert size={14} className="text-red-500" />
            Contract Live Inspection
          </span>
          <button
            type="button"
            onClick={() => setShowAdminKey(!showAdminKey)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-xs bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 hover:text-red-600 transition-colors cursor-pointer"
          >
            {showAdminKey ? <EyeOff size={13} /> : <Eye size={13} />}
            <span>{showAdminKey ? 'Hide Red Flag Tags' : 'Reveal Red Flag Tags'}</span>
          </button>
        </div>
      )}

      {/* Document Header */}
      <div className="p-6 md:p-8 border-b border-slate-200 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/40 text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
          <FileText size={12} />
          Republic of South Africa • BCEA Standard
        </div>
        <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
          {title}
        </h2>
        <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium max-w-xl mx-auto">
          Agreement of Employment entered into between the Employer and Employee pursuant to the Basic Conditions of Employment Act.
        </p>
      </div>

      {/* Clauses Container */}
      <div className="p-4 sm:p-6 md:p-8 space-y-4">
        {clauses.map((clause, idx) => {
          const isFlagged = flaggedClauseIds.has(clause.id);
          const isWrong = wrongClauseIds.has(clause.id);
          const isMissed = revealedMissedClauseIds.has(clause.id);
          const isHinted = hintedClauseId === clause.id;
          const hasRedFlag = Boolean(clause.flag);

          // Detect small print clause
          const isSmallPrint = clause.heading?.toLowerCase().includes('fine print') || 
                               clause.heading?.toLowerCase().includes('small print') || 
                               clause.heading?.toLowerCase().includes('miscellaneous') ||
                               clause.heading?.toLowerCase().includes('indemnity');

          let stateStyles = 'bg-slate-50/80 hover:bg-slate-100 dark:bg-zinc-900/50 dark:hover:bg-zinc-900 border-slate-200 dark:border-zinc-800/70 text-slate-800 dark:text-zinc-200';

          if (isFlagged) {
            stateStyles = 'bg-rose-500/15 border-rose-500 dark:border-rose-400 text-rose-950 dark:text-rose-100 font-medium shadow-md shadow-rose-950/10';
          } else if (isWrong) {
            stateStyles = 'bg-red-500/20 border-red-500 text-red-900 dark:text-red-200 animate-shake';
          } else if (isMissed) {
            stateStyles = 'bg-amber-500/20 border-amber-500 text-amber-950 dark:text-amber-100';
          } else if (isHinted) {
            stateStyles = 'bg-amber-400/25 border-amber-400 ring-4 ring-amber-400/30 text-amber-950 dark:text-amber-100 animate-pulse';
          } else if (mode === 'preview' && showAdminKey && hasRedFlag) {
            stateStyles = 'bg-rose-500/10 border-rose-400/50 text-slate-900 dark:text-zinc-100';
          }

          return (
            <div key={clause.id} className="space-y-1">
              {clause.heading && (
                <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 pt-2 px-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    {clause.heading}
                  </span>
                  {mode === 'preview' && showAdminKey && clause.flag && (
                    <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                      FLAG: {CATEGORY_MAP.get(clause.flag.category) || clause.flag.category}
                    </span>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={() => isInteractive && onClauseTap?.(clause)}
                disabled={!isInteractive || isFlagged}
                aria-pressed={isFlagged}
                aria-label={`Clause ${idx + 1}: ${clause.text.slice(0, 40)}`}
                className={`w-full text-left min-h-[44px] p-4 rounded-2xl border transition-all flex flex-col justify-between relative group select-none ${stateStyles} ${
                  isInteractive ? 'cursor-pointer active:scale-[0.99]' : 'cursor-default'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-[11px] font-mono font-bold text-slate-400 dark:text-zinc-500 shrink-0 mt-0.5">
                      §{idx + 1}
                    </span>
                    <p className={`leading-relaxed text-left break-words ${isSmallPrint ? 'text-xs text-slate-600 dark:text-zinc-400 italic' : 'text-sm font-normal'}`}>
                      {clause.text}
                    </p>
                  </div>

                  {/* Indicator Icon */}
                  <div className="shrink-0 flex items-center gap-1.5 pt-0.5">
                    {isFlagged && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-rose-600 text-white shadow-sm">
                        <Flag size={12} className="fill-white" />
                        <span>Flagged</span>
                      </span>
                    )}
                    {isWrong && (
                      <XCircle size={18} className="text-red-500 animate-spin" />
                    )}
                    {isMissed && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-black">
                        <AlertTriangle size={11} /> Missed
                      </span>
                    )}
                    {isHinted && !isFlagged && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-black animate-bounce">
                        <Sparkles size={11} /> Hint
                      </span>
                    )}
                  </div>
                </div>

                {/* Reason Explanation in Review or Preview Mode */}
                {((mode === 'preview' && showAdminKey && clause.flag) || (isMissed && clause.flag) || (isFlagged && mode === 'review' && clause.flag)) && (
                  <div className="mt-3 pt-2.5 border-t border-rose-300/40 dark:border-rose-900/40 flex items-center justify-between text-xs text-rose-700 dark:text-rose-300 font-medium">
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle size={13} className="shrink-0 text-rose-500" />
                      <strong>Why this is a red flag:</strong> {clause.flag.reason}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-rose-500/10 font-bold uppercase text-[9px] shrink-0 ml-2">
                      {clause.flag.category}
                    </span>
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Signature Section Footer */}
      <div className="p-6 md:p-8 bg-slate-50 dark:bg-zinc-900/60 border-t border-slate-200 dark:border-zinc-800">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs text-slate-500 dark:text-zinc-400">
          <div className="space-y-2">
            <div className="h-0.5 bg-slate-300 dark:bg-zinc-700 w-3/4" />
            <p className="font-bold uppercase tracking-wider text-[10px] text-slate-700 dark:text-zinc-300">
              For and on behalf of Employer
            </p>
            <p className="font-mono text-[10px]">Authorised Signature & Company Stamp</p>
          </div>
          <div className="space-y-2">
            <div className="h-0.5 bg-slate-300 dark:bg-zinc-700 w-3/4" />
            <p className="font-bold uppercase tracking-wider text-[10px] text-slate-700 dark:text-zinc-300">
              Employee Signature
            </p>
            <p className="font-mono text-[10px]">Read, Understood & Agreed</p>
          </div>
        </div>
      </div>
    </div>
  );
};
