import React, { useState, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import {
  CourseId,
  LessonData,
  LessonSection,
  ObjectivePdf
} from '../../types';
import { storage, ref, getBytes } from '../../firebase';
import { compileCurriculumToInteractiveLesson } from '../../interactiveLessonCompiler';
import {
  Sparkles,
  FileText,
  Upload,
  Loader2,
  CheckCircle2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Layers,
  Wrench,
  Terminal,
  Cable,
  Wallet,
  Bot,
  Award,
  BookOpen,
  AlertCircle,
  Wand2
} from 'lucide-react';

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

interface AdminInteractiveStudioProps {
  courseId: CourseId;
  objectiveId: string;
  objectiveTitle: string;
  domainName: string;
  currentPdf: ObjectivePdf | null;
  interactiveLesson?: LessonData;
  onChangeInteractiveLesson: (lesson: LessonData | undefined) => void;
  accentHex?: string;
}

export const AdminInteractiveStudio: React.FC<AdminInteractiveStudioProps> = ({
  courseId,
  objectiveId,
  objectiveTitle,
  domainName,
  currentPdf,
  interactiveLesson,
  onChangeInteractiveLesson,
  accentHex = '#6366f1'
}) => {
  const [sourceText, setSourceText] = useState<string>('');
  const [isExtractingPdf, setIsExtractingPdf] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [studioStatus, setStudioStatus] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [expandedStageIdx, setExpandedStageIdx] = useState<number | null>(0);
  const localFileInputRef = useRef<HTMLInputElement>(null);

  // Helper to extract text from PDF ArrayBuffer using pdfjs-dist
  const extractTextFromPdfBuffer = async (buffer: ArrayBuffer | Uint8Array): Promise<string> => {
    const loadingTask = pdfjsLib.getDocument({ data: buffer });
    const pdf = await loadingTask.promise;
    const pageTexts: string[] = [];
    const maxPages = Math.min(pdf.numPages, 40);

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageStr = textContent.items
        .map((item: any) => item.str || '')
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (pageStr) {
        pageTexts.push(pageStr);
      }
    }
    return pageTexts.join('\n\n');
  };

  // Auto-extract text from the objective's already-attached Firebase PDF
  const handleExtractFromAttachedPdf = async () => {
    if (!currentPdf) return;
    setIsExtractingPdf(true);
    setStudioStatus({
      type: 'info',
      message: `Extracting curriculum text from "${currentPdf.fileName}"...`
    });

    try {
      let bytes: ArrayBuffer | Uint8Array | null = null;

      if (currentPdf.storagePath) {
        try {
          const storageRef = ref(storage, currentPdf.storagePath);
          bytes = await Promise.race([
            getBytes(storageRef),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Storage getBytes timeout')), 4500)
            )
          ]);
        } catch {
          // fallback to proxy/downloadURL below
        }
      }

      if (!bytes && currentPdf.downloadURL) {
        const isFirebaseUrl =
          currentPdf.downloadURL.includes('firebasestorage.googleapis.com') ||
          currentPdf.downloadURL.includes('storage.googleapis.com');
        const fetchUrl = isFirebaseUrl
          ? `/api/pdf-proxy?url=${encodeURIComponent(currentPdf.downloadURL)}`
          : currentPdf.downloadURL;
        const resp = await fetch(fetchUrl);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        bytes = await resp.arrayBuffer();
      }

      if (!bytes) {
        throw new Error('Could not read bytes from attached PDF.');
      }

      const extracted = await extractTextFromPdfBuffer(bytes);
      if (!extracted || extracted.trim().length < 20) {
        throw new Error('This PDF appears to be scanned images without selectable text. Please paste your lesson notes or upload a text/DOCX file.');
      }

      setSourceText(extracted);
      setStudioStatus({
        type: 'success',
        message: `Extracted ${extracted.length.toLocaleString()} characters from "${currentPdf.fileName}". Ready to generate Interactive Module!`
      });
    } catch (err: any) {
      setStudioStatus({
        type: 'error',
        message: err?.message || 'Failed to extract text from attached PDF.'
      });
    } finally {
      setIsExtractingPdf(false);
    }
  };

  // Extract text from a locally dropped/selected PDF, DOCX, or TXT/MD file
  const handleLocalFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsExtractingPdf(true);
    setStudioStatus({
      type: 'info',
      message: `Reading curriculum file "${file.name}"...`
    });

    try {
      const lower = file.name.toLowerCase();
      let extracted = '';

      if (lower.endsWith('.pdf') || file.type === 'application/pdf') {
        const buf = await file.arrayBuffer();
        extracted = await extractTextFromPdfBuffer(buf);
      } else if (lower.endsWith('.docx')) {
        const buf = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(buf);
        const xmlFile = zip.file('word/document.xml');
        if (!xmlFile) throw new Error('Invalid DOCX structure.');
        const xmlText = await xmlFile.async('string');
        extracted = xmlText
          .replace(/<\/w:p>/g, '\n\n')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      } else {
        extracted = await file.text();
      }

      if (!extracted || extracted.trim().length < 15) {
        throw new Error('No readable text found in the uploaded file.');
      }

      setSourceText(extracted);
      setStudioStatus({
        type: 'success',
        message: `Loaded ${extracted.length.toLocaleString()} characters from "${file.name}". Click "Generate Interactive Module" below!`
      });
    } catch (err: any) {
      setStudioStatus({
        type: 'error',
        message: err?.message || 'Could not extract text from file.'
      });
    } finally {
      setIsExtractingPdf(false);
      if (localFileInputRef.current) localFileInputRef.current.value = '';
    }
  };

  // Generate multi-stage Interactive Module strictly from the extracted curriculum text
  const handleGenerateModule = async () => {
    const cleanText = sourceText.trim();
    if (cleanText.length < 20) {
      setStudioStatus({
        type: 'error',
        message: 'Please extract text from your attached PDF (or upload/paste your curriculum notes) first so the Interactive Module matches your exact study material.'
      });
      return;
    }

    setIsGenerating(true);
    setStudioStatus({
      type: 'info',
      message: 'Synthesizing multi-stage interactive module (Briefing + Blueprint + Matcher + Hands-On Lab + Quiz) from your curriculum...'
    });

    try {
      let generated: LessonData | null = null;
      try {
        const response = await fetch('/api/ai/generate-interactive-lesson', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseId,
            objectiveId: objectiveId || '1.1',
            objectiveTitle: objectiveTitle || 'Interactive Module',
            domainName: domainName || 'Core Curriculum',
            sourceText: cleanText
          })
        });
        if (response.ok) {
          const data = await response.json();
          if (data && Array.isArray(data.sections) && data.sections.length >= 3) {
            generated = data as LessonData;
          }
        }
      } catch {
        // Fallback to local deterministic compiler
      }

      if (!generated) {
        generated = compileCurriculumToInteractiveLesson({
          courseId,
          objectiveId: objectiveId || '1.1',
          objectiveTitle: objectiveTitle || 'Interactive Module',
          domainName: domainName || 'Core Curriculum',
          sourceText: cleanText
        });
      }

      onChangeInteractiveLesson(generated);
      setExpandedStageIdx(0);
      setStudioStatus({
        type: 'success',
        message: `Generated ${generated.sections.length}-stage Interactive Module from your curriculum! Review or tweak any stage below, then click "Save Changes" at the bottom.`
      });
    } catch (err: any) {
      setStudioStatus({
        type: 'error',
        message: err?.message || 'Failed to generate interactive module.'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateSectionTitle = (idx: number, newTitle: string) => {
    if (!interactiveLesson) return;
    const nextSections = [...interactiveLesson.sections];
    nextSections[idx] = { ...nextSections[idx], title: newTitle };
    onChangeInteractiveLesson({ ...interactiveLesson, sections: nextSections });
  };

  const handleMoveStage = (idx: number, dir: 'up' | 'down') => {
    if (!interactiveLesson) return;
    const target = dir === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= interactiveLesson.sections.length) return;
    const nextSections = [...interactiveLesson.sections];
    const tmp = nextSections[idx];
    nextSections[idx] = nextSections[target];
    nextSections[target] = tmp;
    onChangeInteractiveLesson({ ...interactiveLesson, sections: nextSections });
  };

  const handleDeleteStage = (idx: number) => {
    if (!interactiveLesson) return;
    if (interactiveLesson.sections.length <= 1) return;
    const nextSections = interactiveLesson.sections.filter((_, i) => i !== idx);
    onChangeInteractiveLesson({ ...interactiveLesson, sections: nextSections });
  };

  const getStageIcon = (type: LessonSection['type']) => {
    switch (type) {
      case 'text': return <BookOpen size={14} className="text-blue-400" />;
      case 'diagram': return <Layers size={14} className="text-cyan-400" />;
      case 'matcher': return <Cable size={14} className="text-indigo-400" />;
      case 'lab': return <Wrench size={14} className="text-amber-400" />;
      case 'terminal': return <Terminal size={14} className="text-emerald-400" />;
      case 'finance-sim': return <Wallet size={14} className="text-emerald-400" />;
      case 'prompt-lab': return <Bot size={14} className="text-purple-400" />;
      case 'quiz': return <Award size={14} className="text-cyan-400" />;
      default: return <Sparkles size={14} className="text-indigo-400" />;
    }
  };

  return (
    <div className="bg-[var(--bg-surface)] border border-indigo-500/30 rounded-3xl p-6 md:p-8 space-y-6 relative overflow-hidden">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="p-2 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
              <Wand2 size={20} />
            </div>
            <h4 className="text-lg font-black uppercase tracking-tight text-[var(--text-main)]">
              AI Interactive Module Studio
            </h4>
            {interactiveLesson ? (
              <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1.5">
                <CheckCircle2 size={12} /> {interactiveLesson.sections.length} Interactive Stages Active (Replaces Static PDF)
              </span>
            ) : (
              <span className="bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-color)] text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
                No Interactive Module Yet
              </span>
            )}
          </div>
          <p className="text-[var(--text-muted)] text-xs mt-1.5">
            Automatically extract curriculum text from your uploaded PDF (or drop a PDF/DOCX/TXT file) to generate a multi-stage interactive lesson that completely replaces the static PDF reader.
          </p>
        </div>

        {interactiveLesson && (
          <button
            type="button"
            onClick={() => onChangeInteractiveLesson(undefined)}
            className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 self-start sm:self-auto shrink-0 cursor-pointer"
          >
            <Trash2 size={13} />
            <span>Remove Interactive Module</span>
          </button>
        )}
      </div>

      {/* Step 1: Ingest Curriculum Source Material */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label className="text-[10px] uppercase tracking-widest font-black text-[var(--text-muted)]">
            Step 1: Load Curriculum Source Text (Strictly Grounded in Your Notes/PDF)
          </label>

          <div className="flex flex-wrap items-center gap-2">
            {currentPdf && (
              <button
                type="button"
                disabled={isExtractingPdf}
                onClick={handleExtractFromAttachedPdf}
                className="px-3.5 py-2 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {isExtractingPdf ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <FileText size={13} />
                )}
                <span>Auto-Extract from Attached PDF ({currentPdf.fileName.slice(0, 22)})</span>
              </button>
            )}

            <input
              ref={localFileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.md"
              onChange={handleLocalFileImport}
              className="hidden"
            />
            <button
              type="button"
              disabled={isExtractingPdf}
              onClick={() => localFileInputRef.current?.click()}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[var(--text-main)] border border-[var(--border-color)] text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Upload size={13} />
              <span>Import PDF / DOCX / TXT</span>
            </button>
          </div>
        </div>

        <textarea
          value={sourceText}
          onChange={(e) => setSourceText(e.target.value)}
          rows={5}
          placeholder="Click 'Auto-Extract from Attached PDF' above, import a PDF/DOCX file, or paste your exact lesson curriculum notes here..."
          className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-3.5 text-xs font-mono text-[var(--text-main)] focus:border-indigo-500 transition-all resize-y"
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <span className="text-[11px] font-mono text-[var(--text-muted)]">
            {sourceText.trim().length > 0
              ? `${sourceText.trim().length.toLocaleString()} curriculum characters loaded`
              : 'Waiting for curriculum text...'}
          </span>

          <button
            type="button"
            disabled={isGenerating || isExtractingPdf}
            onClick={handleGenerateModule}
            className="px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wider text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            style={{ backgroundColor: accentHex }}
          >
            {isGenerating ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Compiling Interactive Stages...</span>
              </>
            ) : (
              <>
                <Sparkles size={15} />
                <span>
                  {interactiveLesson
                    ? 'Regenerate Interactive Module from Text'
                    : 'Generate Interactive Module from Curriculum'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Status Alert */}
      {studioStatus && (
        <div
          className={`p-4 rounded-2xl border text-xs font-medium flex items-center gap-3 ${
            studioStatus.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : studioStatus.type === 'error'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
          }`}
        >
          {studioStatus.type === 'success' ? (
            <CheckCircle2 size={16} className="shrink-0" />
          ) : (
            <AlertCircle size={16} className="shrink-0" />
          )}
          <span>{studioStatus.message}</span>
        </div>
      )}

      {/* Step 2: Live Stage Editor & Inspector */}
      {interactiveLesson && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] uppercase tracking-widest font-black text-[var(--text-muted)]">
              Step 2: Visual Stage Pipeline ({interactiveLesson.sections.length} Stages)
            </label>
            <span className="text-[10px] font-mono text-emerald-400">
              Guided Gate Enabled • Replaces Static PDF
            </span>
          </div>

          <div className="space-y-2.5">
            {interactiveLesson.sections.map((sec, idx) => {
              const isExpanded = expandedStageIdx === idx;
              return (
                <div
                  key={sec.id || idx}
                  className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden"
                >
                  <div className="p-3.5 px-4 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setExpandedStageIdx(isExpanded ? null : idx)}
                      className="flex items-center gap-2.5 text-left flex-1 min-w-0 cursor-pointer"
                    >
                      <span className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[11px] font-mono font-bold text-indigo-400 shrink-0">
                        {idx + 1}
                      </span>
                      {getStageIcon(sec.type)}
                      <span className="px-2 py-0.5 rounded bg-white/5 text-[9px] font-mono uppercase text-cyan-300 shrink-0">
                        {sec.type}
                      </span>
                      <span className="text-xs font-bold text-[var(--text-main)] truncate">
                        {sec.title}
                      </span>
                    </button>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMoveStage(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 disabled:opacity-30 cursor-pointer"
                        title="Move stage up"
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveStage(idx, 'down')}
                        disabled={idx === interactiveLesson.sections.length - 1}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 disabled:opacity-30 cursor-pointer"
                        title="Move stage down"
                      >
                        <ArrowDown size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteStage(idx)}
                        className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 cursor-pointer"
                        title="Remove stage"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-[var(--border-color)] space-y-3 bg-[var(--bg-surface)]/50">
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono uppercase text-[var(--text-muted)]">
                          Stage Title
                        </label>
                        <input
                          type="text"
                          value={sec.title}
                          onChange={(e) => handleUpdateSectionTitle(idx, e.target.value)}
                          className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-2.5 text-xs font-bold text-[var(--text-main)]"
                        />
                      </div>

                      {sec.type === 'text' && (
                        <div className="text-xs text-slate-400 space-y-1">
                          <div className="font-mono text-[10px] text-indigo-400">
                            Lead Summary ({sec.content.sections.length} Sub-sections, {sec.content.technicalTerms?.length || 0} Glossary Terms):
                          </div>
                          <p className="line-clamp-2 italic">"{sec.content.lead}"</p>
                        </div>
                      )}

                      {sec.type === 'diagram' && (
                        <div className="text-xs text-slate-400 font-mono">
                          Interactive Hotspots: {sec.hotspots.map(h => h.name).join(' • ')}
                        </div>
                      )}

                      {sec.type === 'matcher' && (
                        <div className="text-xs text-slate-400 font-mono">
                          Matching Pairs ({sec.pairs.length}): {sec.pairs.map(p => p.sourceLabel).join(' ↔ ')}
                        </div>
                      )}

                      {sec.type === 'lab' && (
                        <div className="text-xs text-slate-400 font-mono">
                          Workbench Steps ({sec.steps.length}): {sec.steps.map(s => s.instruction).join(' → ')}
                        </div>
                      )}

                      {sec.type === 'quiz' && (
                        <div className="text-xs text-slate-400 font-mono">
                          Formative Assessment: {sec.questions.length} Questions • Pass Threshold: {sec.passThresholdPercent}% • +{sec.xpReward} XP
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminInteractiveStudio;

