import React, { useState } from 'react';
import { FileText, CheckCircle2, XCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import type { CVClinicSection, CVClinicLine, MistakeCategory } from '../../types';

interface CVPaperProps {
  sections: CVClinicSection[];
  mode?: 'preview' | 'play' | 'review';
  foundLineIds?: Set<string>;
  wrongLineIds?: Set<string>;
  revealedMissedLineIds?: Set<string>;
  onLineTap?: (line: CVClinicLine, sectionHeading: string) => void;
  disabled?: boolean;
  highlightMistakesInPreview?: boolean;
}

const CATEGORY_COLORS: Record<MistakeCategory, { bg: string; text: string; border: string }> = {
  contact: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/30' },
  privacy: { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/30' },
  honesty: { bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500/30' },
  format: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/30' },
  spelling: { bg: 'bg-teal-500/10', text: 'text-teal-600 dark:text-teal-400', border: 'border-teal-500/30' },
  content: { bg: 'bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-500/30' },
};

export const CVPaper: React.FC<CVPaperProps> = ({
  sections,
  mode = 'preview',
  foundLineIds = new Set(),
  wrongLineIds = new Set(),
  revealedMissedLineIds = new Set(),
  onLineTap,
  disabled = false,
  highlightMistakesInPreview = true
}) => {
  const [showAdminKey, setShowAdminKey] = useState(highlightMistakesInPreview);

  // Extract section with heading "File" for top file chip attachment
  const fileSection = sections.find(s => s.heading.trim().toLowerCase() === 'file');
  const mainSections = sections.filter(s => s.heading.trim().toLowerCase() !== 'file');

  const renderLine = (line: CVClinicLine, sectionHeading: string, isFileChip = false) => {
    const isFound = foundLineIds.has(line.id);
    const isWrong = wrongLineIds.has(line.id);
    const isMissed = revealedMissedLineIds.has(line.id);
    const isMistake = Boolean(line.mistake);
    const isInteractive = mode === 'play' && !disabled;

    if (isFileChip) {
      return (
        <button
          key={line.id}
          type="button"
          onClick={() => isInteractive && onLineTap?.(line, sectionHeading)}
          disabled={!isInteractive || isFound}
          aria-pressed={isFound}
          className={`min-h-[44px] w-full sm:w-auto inline-flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all text-left select-none ${
            isFound
              ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-semibold shadow-sm'
              : isWrong
              ? 'bg-rose-500/20 border-rose-500 text-rose-700 dark:text-rose-300 animate-shake'
              : isMissed
              ? 'bg-amber-500/20 border-amber-500 text-amber-800 dark:text-amber-200'
              : mode === 'preview' && showAdminKey && isMistake
              ? 'bg-amber-500/10 border-amber-500/40 text-amber-800 dark:text-amber-300'
              : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200'
          } ${isInteractive ? 'cursor-pointer active:scale-[0.98]' : 'cursor-default'}`}
        >
          <FileText size={18} className="shrink-0 text-slate-500 dark:text-slate-400" />
          <span className="font-mono text-xs sm:text-sm tracking-tight break-all flex-1">{line.text}</span>
          {isFound && <CheckCircle2 size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400" />}
          {isWrong && <XCircle size={16} className="shrink-0 text-rose-600 dark:text-rose-400" />}
          {isMissed && <AlertCircle size={16} className="shrink-0 text-amber-600 dark:text-amber-400" />}

          {mode === 'preview' && showAdminKey && line.mistake && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30">
              Mistake ({line.mistake.category})
            </span>
          )}
        </button>
      );
    }

    return (
      <button
        key={line.id}
        type="button"
        onClick={() => isInteractive && onLineTap?.(line, sectionHeading)}
        disabled={!isInteractive || isFound}
        aria-pressed={isFound}
        className={`w-full text-left min-h-[44px] px-3.5 py-2.5 rounded-xl border text-sm transition-all flex flex-col justify-center select-none ${
          isFound
            ? 'bg-emerald-500/15 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-medium shadow-sm'
            : isWrong
            ? 'bg-rose-500/20 border-rose-500 text-rose-900 dark:text-rose-200 animate-shake'
            : isMissed
            ? 'bg-amber-500/20 border-amber-500 text-amber-900 dark:text-amber-200'
            : mode === 'preview' && showAdminKey && isMistake
            ? 'bg-rose-500/5 border-rose-500/40 text-slate-900 dark:text-slate-100'
            : 'bg-transparent border-transparent hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:border-slate-200 dark:hover:border-slate-700/60 text-slate-800 dark:text-slate-200'
        } ${isInteractive ? 'cursor-pointer active:scale-[0.99]' : 'cursor-default'}`}
      >
        <div className="flex items-center justify-between gap-3 w-full">
          <span className="leading-relaxed break-words flex-1 text-left">{line.text}</span>
          <div className="shrink-0 flex items-center gap-1.5">
            {isFound && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={16} />
                <span className="sr-only">Mistake identified</span>
              </span>
            )}
            {isWrong && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400">
                <XCircle size={16} />
                <span className="sr-only">Wrong tap</span>
              </span>
            )}
            {isMissed && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                <AlertCircle size={16} />
                <span className="sr-only">Missed mistake</span>
              </span>
            )}
          </div>
        </div>

        {/* Admin preview annotations */}
        {mode === 'preview' && showAdminKey && line.mistake && (
          <div className="mt-1.5 pt-1 border-t border-rose-200 dark:border-rose-900/50 flex flex-wrap items-center gap-2 text-xs">
            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${CATEGORY_COLORS[line.mistake.category].bg} ${CATEGORY_COLORS[line.mistake.category].text} ${CATEGORY_COLORS[line.mistake.category].border}`}>
              {line.mistake.category}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 italic">
              {line.mistake.reason}
            </span>
          </div>
        )}

        {/* Review mode explanation for missed or found mistakes */}
        {mode === 'review' && (isFound || isMissed) && line.mistake && (
          <div className="mt-2 text-xs pt-1.5 border-t border-current/10 flex items-start gap-1.5 opacity-90">
            <span className="font-semibold uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10">
              {line.mistake.category}
            </span>
            <span className="text-xs leading-normal">{line.mistake.reason}</span>
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="relative">
      {/* Admin preview toggle */}
      {mode === 'preview' && (
        <div className="mb-4 flex items-center justify-between bg-slate-100 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Live Preview Mode
          </span>
          <button
            type="button"
            onClick={() => setShowAdminKey(!showAdminKey)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 shadow-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
          >
            {showAdminKey ? <EyeOff size={14} /> : <Eye size={14} />}
            {showAdminKey ? 'Hide Mistake Annotations' : 'Show Mistake Annotations'}
          </button>
        </div>
      )}

      {/* Clean White Paper Card */}
      <article 
        aria-label="Curriculum Vitae Document"
        className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-xl max-w-2xl mx-auto transition-colors"
      >
        {/* Top File Chip Section (if present) */}
        {fileSection && fileSection.lines.length > 0 && (
          <div className="mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              Attached Resume File
            </div>
            <div className="space-y-2">
              {fileSection.lines.map(line => renderLine(line, 'File', true))}
            </div>
          </div>
        )}

        {/* Main CV Sections */}
        <div className="space-y-6">
          {mainSections.map((sec, secIdx) => (
            <section key={secIdx} className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 pb-1 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span>{sec.heading}</span>
                <span className="text-[10px] font-mono text-slate-400">
                  {sec.lines.length} {sec.lines.length === 1 ? 'item' : 'items'}
                </span>
              </h4>
              <div className="space-y-1">
                {sec.lines.map(line => renderLine(line, sec.heading))}
              </div>
            </section>
          ))}
          {mainSections.length === 0 && (
            <p className="text-center text-slate-400 italic py-8 text-sm">
              No CV content sections yet. Paste CV text or add sections above.
            </p>
          )}
        </div>

        {/* Paper watermark/footer */}
        <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-widest font-mono select-none">
          <span>CV Clinic Document</span>
          <span>ITreal Arcade</span>
        </div>
      </article>
    </div>
  );
};

export default CVPaper;
