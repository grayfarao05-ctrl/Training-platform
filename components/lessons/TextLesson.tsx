import React, { useState } from 'react';
import { TextLessonSection } from '../../types';
import { 
  BookOpen, 
  Lightbulb, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Cpu, 
  Sparkles,
  Zap
} from 'lucide-react';

interface TextLessonProps {
  section: TextLessonSection;
  onComplete?: () => void;
}

export const TextLesson: React.FC<TextLessonProps> = ({ section }) => {
  const { content } = section;
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({});
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);

  const toggleExpand = (idx: number) => {
    setExpandedSections(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Lead Briefing */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900/30 via-slate-900/40 to-cyan-900/20 border border-blue-500/20 p-6 md:p-8 backdrop-blur-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0 text-blue-400">
            <BookOpen size={24} />
          </div>
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Technical Briefing
            </div>
            <p className="text-base md:text-lg text-slate-200 leading-relaxed font-medium">
              {content.lead}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="space-y-8">
        {content.sections.map((sec, idx) => (
          <div 
            key={idx} 
            className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 md:p-8 space-y-6 shadow-sm hover:border-slate-700 transition-colors"
          >
            <h3 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center text-xs font-mono font-bold">
                {idx + 1}
              </span>
              {sec.heading}
            </h3>

            <div className="space-y-4 text-slate-300 leading-relaxed text-sm md:text-base">
              {sec.body.map((paragraph, pIdx) => (
                <p key={pIdx}>{paragraph}</p>
              ))}
            </div>

            {/* Bullet Points */}
            {sec.bulletPoints && sec.bulletPoints.length > 0 && (
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800 space-y-2.5">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                  <Cpu size={14} className="text-cyan-400" />
                  Key Specifications & Characteristics:
                </div>
                {sec.bulletPoints.map((point, bIdx) => (
                  <div key={bIdx} className="flex items-start gap-2.5 text-xs md:text-sm text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 shrink-0" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Callout Box */}
            {sec.callout && (
              <div className={`rounded-xl p-5 border flex items-start gap-3.5 ${
                sec.callout.type === 'exam-tip'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                  : sec.callout.type === 'warning'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                  : sec.callout.type === 'pro-tip'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                  : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-200'
              }`}>
                <div className="mt-0.5 shrink-0">
                  {sec.callout.type === 'exam-tip' && <Lightbulb size={20} className="text-amber-400" />}
                  {sec.callout.type === 'warning' && <AlertTriangle size={20} className="text-rose-400" />}
                  {sec.callout.type === 'pro-tip' && <Zap size={20} className="text-emerald-400" />}
                  {sec.callout.type === 'definition' && <Sparkles size={20} className="text-indigo-400" />}
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-black uppercase tracking-wider">
                    {sec.callout.title}
                  </div>
                  <div className="text-xs md:text-sm leading-relaxed opacity-90">
                    {sec.callout.content}
                  </div>
                </div>
              </div>
            )}

            {/* Expandable Detail Accordion */}
            {sec.expandedDetails && (
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                <button
                  type="button"
                  onClick={() => toggleExpand(idx)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/40 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-cyan-400 font-mono">▸</span>
                    {sec.expandedDetails.summary}
                  </span>
                  {expandedSections[idx] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {expandedSections[idx] && (
                  <div className="px-4 py-3 border-t border-slate-800 text-xs md:text-sm text-slate-400 leading-relaxed bg-slate-900/30">
                    {sec.expandedDetails.details}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Technical Terminology Gloss */}
      {content.technicalTerms && content.technicalTerms.length > 0 && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 md:p-8 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Sparkles size={16} className="text-amber-400" />
              CompTIA Terminology Glossary
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">
              Click term for definition
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {content.technicalTerms.map((item, tIdx) => (
              <button
                key={tIdx}
                type="button"
                onClick={() => setSelectedTerm(selectedTerm === item.term ? null : item.term)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all border ${
                  selectedTerm === item.term
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm shadow-cyan-500/20'
                    : 'bg-slate-900/60 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                {item.term}
              </button>
            ))}
          </div>

          {selectedTerm && (
            <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-xs text-cyan-200 animate-in fade-in duration-200">
              <span className="font-bold font-mono text-cyan-300 block mb-1">
                {selectedTerm}:
              </span>
              {content.technicalTerms.find(t => t.term === selectedTerm)?.definition}
            </div>
          )}
        </div>
      )}

      {/* Key Takeaways */}
      {content.keyTakeaways && content.keyTakeaways.length > 0 && (
        <div className="bg-gradient-to-br from-emerald-950/30 via-slate-900/50 to-slate-950/70 border border-emerald-500/30 rounded-2xl p-6 md:p-8 space-y-4">
          <h4 className="text-sm font-black uppercase tracking-wider text-emerald-300 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-400" />
            Key Exam Takeaways
          </h4>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {content.keyTakeaways.map((takeaway, kIdx) => (
              <li 
                key={kIdx} 
                className="flex items-start gap-2.5 text-xs md:text-sm text-slate-200 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800"
              >
                <span className="text-emerald-400 font-bold shrink-0">✓</span>
                <span>{takeaway}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
