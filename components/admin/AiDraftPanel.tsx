import React, { useState } from 'react';
import { QuestionType, AiQuestionDraft, CourseId } from '../../types';
import { generateAiQuestion } from '../../aiAdminService';
import { 
  Sparkles, 
  Loader2, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  Image as ImageIcon, 
  CheckSquare, 
  FileText, 
  Link2, 
  ListOrdered, 
  Terminal, 
  ChevronDown, 
  ChevronUp, 
  Info
} from 'lucide-react';

interface AiDraftPanelProps {
  currentType: QuestionType;
  course: CourseId;
  courseName?: string;
  courseDescription?: string;
  domainId?: string;
  domainName?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  onUseDraft: (draft: AiQuestionDraft) => void;
  accentColor?: string;
}

const TYPE_ICONS: Record<QuestionType, any> = {
  choice: HelpCircle,
  image: ImageIcon,
  multi: CheckSquare,
  fill: FileText,
  match: Link2,
  order: ListOrdered,
  terminal: Terminal,
};

const TYPE_LABELS: Record<QuestionType, string> = {
  choice: 'Multiple Choice',
  image: 'Diagram / Image',
  multi: 'Multi-Select',
  fill: 'Fill-in-the-Blank',
  match: 'Matching Pairs',
  order: 'Sequence Ordering',
  terminal: 'CLI Simulation',
};

export const AiDraftPanel: React.FC<AiDraftPanelProps> = ({
  currentType,
  course,
  courseName = 'CompTIA A+',
  courseDescription = '',
  domainId = '',
  domainName = 'General Objectives',
  difficulty = 'Medium',
  onUseDraft,
  accentColor = '#6366f1',
}) => {
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState<number>(3);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<AiQuestionDraft[]>([]);
  const [droppedCount, setDroppedCount] = useState<number>(0);
  const [isPanelExpanded, setIsPanelExpanded] = useState(true);

  const CurrentIcon = TYPE_ICONS[currentType] || HelpCircle;

  const handleGenerate = async (singleDraftIndex?: number) => {
    setIsGenerating(true);
    setError(null);
    try {
      const requestedCount = singleDraftIndex !== undefined ? 1 : count;
      const res = await generateAiQuestion({
        questionType: currentType,
        course,
        courseName,
        courseDescription,
        domain: domainName,
        domainId,
        domainTitle: domainName,
        difficulty,
        topic: topic.trim().slice(0, 500),
        count: requestedCount,
      });

      if (singleDraftIndex !== undefined && res.drafts.length > 0) {
        // Replace single draft
        setDrafts(prev => {
          const next = [...prev];
          next[singleDraftIndex] = res.drafts[0];
          return next;
        });
      } else {
        setDrafts(res.drafts || []);
        setDroppedCount(res.droppedCount || 0);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to draft question with AI. Please check your connection.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm transition-all">
      {/* Panel Header */}
      <div 
        onClick={() => setIsPanelExpanded(!isPanelExpanded)}
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors select-none"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-main)]">
                Draft with AI
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center gap-1">
                <CurrentIcon size={10} />
                {TYPE_LABELS[currentType]}
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">
              Generates type-aware diagnostic scenarios in plain South African English
            </p>
          </div>
        </div>

        <button 
          type="button"
          className="text-[var(--text-muted)] hover:text-white p-1"
          title={isPanelExpanded ? 'Collapse panel' : 'Expand panel'}
        >
          {isPanelExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Expanded Controls */}
      {isPanelExpanded && (
        <div className="p-4 pt-0 space-y-4 border-t border-[var(--border-color)]/60">
          {error && (
            <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
            {/* Topic input */}
            <div className="md:col-span-3 space-y-1">
              <div className="flex items-center justify-between text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                <span>Topic or Notes (Optional)</span>
                <span>{topic.length}/500</span>
              </div>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value.slice(0, 500))}
                disabled={isGenerating}
                placeholder={`e.g. Troubleshooting RAM beep codes, loadshedding battery backups, or ${TYPE_LABELS[currentType]} scenarios...`}
                className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Count Selector */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
                Drafts Count
              </label>
              <select
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                disabled={isGenerating}
                className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs font-bold text-[var(--text-main)] focus:outline-none focus:border-indigo-500"
              >
                <option value={1}>1 Draft</option>
                <option value={2}>2 Drafts</option>
                <option value={3}>3 Drafts</option>
                <option value={4}>4 Drafts</option>
                <option value={5}>5 Drafts</option>
              </select>
            </div>
          </div>

          {/* Trigger button */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5">
              <Info size={12} />
              Drafts use the active question type ({TYPE_LABELS[currentType]})
            </span>

            <button
              type="button"
              onClick={() => handleGenerate()}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-white shadow-md transition-all disabled:opacity-50 cursor-pointer"
              style={{ backgroundColor: accentColor }}
            >
              {isGenerating ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Drafting {count} {TYPE_LABELS[currentType]} questions...</span>
                </>
              ) : (
                <>
                  <Sparkles size={13} />
                  <span>Draft with AI</span>
                </>
              )}
            </button>
          </div>

          {/* Dropped Count Notice */}
          {droppedCount > 0 && (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
              Note: {droppedCount} draft(s) did not satisfy validation rules and were dropped automatically.
            </div>
          )}

          {/* Generated Draft Cards */}
          {drafts.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-[var(--border-color)]/60">
              <div className="flex items-center justify-between text-xs font-bold text-[var(--text-muted)]">
                <span>Available AI Drafts ({drafts.length})</span>
                <button
                  type="button"
                  onClick={() => setDrafts([])}
                  className="text-[10px] text-gray-400 hover:text-white uppercase tracking-wider"
                >
                  Clear Drafts
                </button>
              </div>

              <div className="space-y-3 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
                {drafts.map((draft, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-indigo-500/40 transition-colors space-y-3"
                  >
                    {/* Card Top */}
                    <div className="flex items-center justify-between text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                      <span className="flex items-center gap-1.5 text-indigo-400">
                        <Sparkles size={11} />
                        Draft #{idx + 1} • {TYPE_LABELS[draft.type || currentType]}
                      </span>
                      <span>Difficulty: {draft.difficulty || difficulty}</span>
                    </div>

                    {/* Question Stem */}
                    <p className="text-xs font-semibold text-[var(--text-main)] leading-relaxed">
                      {draft.question}
                    </p>

                    {/* Type-Specific Student Layout Preview */}

                    {/* Choice Preview */}
                    {draft.type === 'choice' && Array.isArray((draft as any).options) && (
                      <div className="space-y-1.5 pl-2 border-l-2 border-indigo-500/30">
                        {(draft as any).options.map((opt: string, optIdx: number) => {
                          const isCorrect = (draft as any).correctAnswer === optIdx;
                          return (
                            <div
                              key={optIdx}
                              className={`text-[11px] p-2 rounded-lg flex items-center justify-between ${
                                isCorrect 
                                  ? 'bg-emerald-500/10 text-emerald-300 font-bold border border-emerald-500/20' 
                                  : 'text-[var(--text-muted)] bg-[var(--bg-surface)]'
                              }`}
                            >
                              <span>{String.fromCharCode(65 + optIdx)}. {opt}</span>
                              {isCorrect && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 uppercase tracking-wider">
                                  Correct
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Multi-Select Preview */}
                    {draft.type === 'multi' && Array.isArray((draft as any).options) && (
                      <div className="space-y-1.5 pl-2 border-l-2 border-indigo-500/30">
                        {(draft as any).options.map((opt: string, optIdx: number) => {
                          const isCorrect = Array.isArray((draft as any).correctAnswers) && (draft as any).correctAnswers.includes(optIdx);
                          return (
                            <div
                              key={optIdx}
                              className={`text-[11px] p-2 rounded-lg flex items-center justify-between ${
                                isCorrect 
                                  ? 'bg-emerald-500/10 text-emerald-300 font-bold border border-emerald-500/20' 
                                  : 'text-[var(--text-muted)] bg-[var(--bg-surface)]'
                              }`}
                            >
                              <span>☐ {opt}</span>
                              {isCorrect && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 uppercase tracking-wider">
                                  Correct Option
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Fill-in-the-Blank Preview */}
                    {draft.type === 'fill' && Array.isArray((draft as any).acceptedAnswers) && (
                      <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] text-[11px] space-y-1">
                        <span className="text-[9px] uppercase tracking-wider font-bold text-[var(--text-muted)] block">
                          Accepted Answers:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {(draft as any).acceptedAnswers.map((ans: string, aIdx: number) => (
                            <span key={aIdx} className="px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 font-mono text-[10px]">
                              "{ans}"
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Matching Pairs Preview */}
                    {draft.type === 'match' && Array.isArray((draft as any).pairs) && (
                      <div className="space-y-1 pl-2 border-l-2 border-indigo-500/30">
                        <span className="text-[9px] uppercase tracking-wider font-bold text-[var(--text-muted)] block mb-1">
                          Association Pairs:
                        </span>
                        {(draft as any).pairs.map((p: any, pIdx: number) => (
                          <div key={pIdx} className="text-[11px] flex items-center justify-between bg-[var(--bg-surface)] p-2 rounded-lg">
                            <span className="font-semibold text-white">{p.left}</span>
                            <span className="text-gray-500 px-2">↔</span>
                            <span className="text-indigo-300">{p.right}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Sequence Ordering Preview */}
                    {draft.type === 'order' && Array.isArray((draft as any).steps) && (
                      <div className="space-y-1 pl-2 border-l-2 border-indigo-500/30">
                        <span className="text-[9px] uppercase tracking-wider font-bold text-[var(--text-muted)] block mb-1">
                          Correct Sequence Order:
                        </span>
                        {(draft as any).steps.map((st: string, stIdx: number) => (
                          <div key={stIdx} className="text-[11px] flex items-center gap-2 bg-[var(--bg-surface)] p-2 rounded-lg">
                            <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                              {stIdx + 1}
                            </span>
                            <span className="text-[var(--text-main)]">{st}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Image / Diagram Preview */}
                    {draft.type === 'image' && (
                      <div className="p-3 rounded-lg bg-[var(--bg-surface)] text-[11px] space-y-2">
                        <div className="p-2 rounded bg-black/40 border border-cyan-500/20 text-cyan-300 text-[10px]">
                          <strong>Diagram Concept:</strong> {(draft as any).imageIdea}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          <strong>Alt text:</strong> {(draft as any).altText}
                        </div>
                        <div className="space-y-1">
                          {(draft as any).options?.map((opt: string, optIdx: number) => {
                            const isCorrect = (draft as any).correctAnswer === optIdx;
                            return (
                              <div
                                key={optIdx}
                                className={`text-[10px] p-1.5 rounded flex items-center justify-between ${
                                  isCorrect ? 'bg-emerald-500/10 text-emerald-300 font-bold' : 'text-gray-400'
                                }`}
                              >
                                <span>{String.fromCharCode(65 + optIdx)}. {opt}</span>
                                {isCorrect && <span>✓ Correct</span>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* CLI / Terminal Preview */}
                    {draft.type === 'terminal' && (
                      <div className="p-3 rounded-xl bg-black/90 font-mono text-[11px] space-y-2 border border-green-500/20 text-green-400">
                        <div className="text-[10px] text-gray-400">
                          $ <span className="text-white font-bold">{(draft as any).acceptedCommands?.[0] || 'command'}</span>
                        </div>
                        <pre className="text-[10px] text-gray-300 whitespace-pre-wrap font-mono p-2 bg-black rounded border border-white/5">
                          {(draft as any).simulatedOutput}
                        </pre>
                        <div className="text-[10px] text-amber-300/80">
                          <strong>Student Hint:</strong> {(draft as any).hint}
                        </div>
                      </div>
                    )}

                    {/* Technical Explanation */}
                    {draft.explanation && (
                      <div className="text-[11px] text-[var(--text-muted)] bg-[var(--bg-surface)] p-2.5 rounded-lg border border-[var(--border-color)]">
                        <span className="font-bold text-[var(--text-main)] block mb-0.5">Explanation:</span>
                        {draft.explanation}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-color)]">
                      <button
                        type="button"
                        onClick={() => handleGenerate(idx)}
                        disabled={isGenerating}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-[var(--text-muted)] hover:text-white bg-[var(--bg-surface)] hover:bg-white/10 transition-colors flex items-center gap-1.5"
                      >
                        <RefreshCw size={11} className={isGenerating ? 'animate-spin' : ''} />
                        Redraft
                      </button>

                      <button
                        type="button"
                        onClick={() => onUseDraft(draft)}
                        className="px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5 shadow-sm"
                      >
                        <CheckCircle2 size={12} />
                        Use This
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
