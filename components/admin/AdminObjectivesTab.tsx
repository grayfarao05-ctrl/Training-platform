import React, { useState, useEffect, useRef } from 'react';
import { Objective, PracticeQuestion, CourseId, ObjectivePdf, CourseDoc } from '../../types';
import { getCourseConfig, withCourse, resolveDomainTitle } from '../../courseConfig';
import { subscribeCourses, courseDocToConfig } from '../../coursesService';
import { db, auth, OperationType, handleFirestoreError } from '../../firebase';
import { doc, setDoc, deleteDoc, deleteField } from 'firebase/firestore';
import { getInteractiveLesson } from '../lessons/sampleLessons';
import { AdminInteractiveStudio } from './AdminInteractiveStudio';
import { 
  subscribeAllObjectivePdfs, 
  subscribeObjectivePdf, 
  uploadObjectivePdf, 
  removeObjectivePdf,
  getObjectivePdfDocId,
  getPdfForObjective
} from '../../objectivePdfsService';
import { 
  Plus, 
  Save, 
  Trash2, 
  ChevronRight, 
  XCircle, 
  Loader2, 
  Layout, 
  FileText, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle,
  FileCheck2,
  RefreshCw,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminObjectivesTabProps {
  objectives: Objective[];
  onDeleteObjective: (id: string, title: string) => void;
  setAdminFeedback: (msg: string | null) => void;
  editingObjective: Partial<Objective> | null;
  setEditingObjective: React.Dispatch<React.SetStateAction<Partial<Objective> | null>>;
  course?: CourseId;
  courses?: CourseDoc[];
  onNavigateToCourses?: () => void;
}

export const AdminObjectivesTab: React.FC<AdminObjectivesTabProps> = ({
  objectives,
  onDeleteObjective,
  setAdminFeedback,
  editingObjective,
  setEditingObjective,
  course = 'a-plus',
  courses: propsCourses,
  onNavigateToCourses
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [pdfMap, setPdfMap] = useState<Record<string, ObjectivePdf>>({});
  const [currentPdf, setCurrentPdf] = useState<ObjectivePdf | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live Firestore courses subscription with built-in fallback
  const [courseDocs, setCourseDocs] = useState<CourseDoc[]>(propsCourses || []);

  useEffect(() => {
    if (propsCourses && propsCourses.length > 0) {
      setCourseDocs(propsCourses);
    }
  }, [propsCourses]);

  useEffect(() => {
    const unsub = subscribeCourses((docs) => setCourseDocs(docs));
    return () => unsub();
  }, []);

  const activeCourseDoc = courseDocs.find(c => c.id === course);
  const courseConfig = activeCourseDoc ? courseDocToConfig(activeCourseDoc) : getCourseConfig(course);

  // Domains sourced from selected course document with stable id and name
  const availableDomains = activeCourseDoc?.domains && activeCourseDoc.domains.length > 0
    ? activeCourseDoc.domains.map(d => ({ id: d.id, name: d.name, title: d.name }))
    : courseConfig.domains.map(d => ({ id: d.id, name: d.title || d.name, title: d.title || d.name }));

  // Changing the selected course resets the domain field
  useEffect(() => {
    if (editingObjective) {
      setEditingObjective(prev => prev ? { ...prev, domain: '', course } : null);
    }
  }, [course]);

  const vaultObjectives = courseConfig.domains.flatMap(d => d.objectives || []);
  const allCourseObjectives = Array.from(
    new Map([
      ...vaultObjectives.map(o => [o.id, o] as [string, Objective]),
      ...objectives.map(o => [o.id, o] as [string, Objective])
    ]).values()
  );

  // Subscribe to all objective PDFs to display badges in the list
  useEffect(() => {
    const unsubscribe = subscribeAllObjectivePdfs((map) => {
      setPdfMap(map);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to the currently edited objective's PDF with course isolation
  useEffect(() => {
    if (!editingObjective?.id) {
      setCurrentPdf(null);
      return;
    }
    // Set initial from map if available using course-isolated lookup
    setCurrentPdf(getPdfForObjective(pdfMap, course, editingObjective.id));

    const unsubscribe = subscribeObjectivePdf(editingObjective.id, course, (pdf) => {
      setCurrentPdf(pdf);
    });
    return () => unsubscribe();
  }, [editingObjective?.id, course, pdfMap]);

  const handleSaveObjective = async () => {
    if (!editingObjective?.id?.trim() || !editingObjective.title?.trim()) {
      setAdminFeedback('Objective ID and Title are required.');
      setTimeout(() => setAdminFeedback(null), 3000);
      return;
    }
    if (!editingObjective.domain) {
      setAdminFeedback('Please select a domain for this objective.');
      setTimeout(() => setAdminFeedback(null), 3000);
      return;
    }

    setIsSaving(true);
    try {
      const cleanId = editingObjective.id.trim();
      const courseId = course || 'a-plus';
      const docId = (editingObjective as any).docId || `${courseId}_${cleanId}`;
      const objRef = doc(db, 'objectives', docId);
      const payload: any = {
        ...editingObjective,
        id: cleanId,
        docId,
        course: courseId,
        title: editingObjective.title.trim(),
        domain: editingObjective.domain,
        description: editingObjective.description || '',
        lastUpdated: new Date().toISOString()
      };

      // Only include exam for A+ course; omit for all other courses
      if (courseId === 'a-plus') {
        payload.exam = editingObjective.exam || 'Core 1';
      } else {
        delete payload.exam;
      }

      if (editingObjective.interactiveLesson) {
        payload.interactiveLesson = JSON.parse(JSON.stringify(editingObjective.interactiveLesson));
      } else {
        payload.interactiveLesson = deleteField();
      }

      await setDoc(objRef, withCourse(payload, courseId), { merge: true });

      // Clean up legacy colliding un-prefixed document if it exists under bare cleanId
      if (docId !== cleanId) {
        try {
          await deleteDoc(doc(db, 'objectives', cleanId));
        } catch {
          // ignore
        }
      }

      setEditingObjective(null);
      setAdminFeedback('Objective saved successfully!');
      setTimeout(() => setAdminFeedback(null), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `objectives/${editingObjective.id}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePdfFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingObjective?.id) return;

    if (!auth.currentUser) {
      setPdfError('You must be signed in as an administrator to upload PDFs.');
      setTimeout(() => setPdfError(null), 4000);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setPdfError('Only PDF files are allowed.');
      setTimeout(() => setPdfError(null), 4000);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > 30 * 1024 * 1024) {
      setPdfError('File size exceeds the 30 MB limit.');
      setTimeout(() => setPdfError(null), 4000);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploadingPdf(true);
    setPdfError(null);
    setUploadProgress(0);

    try {
      const savedPdf = await uploadObjectivePdf(
        file,
        editingObjective.id,
        course,
        auth.currentUser.uid,
        (percent) => setUploadProgress(percent),
        currentPdf?.storagePath
      );
      setCurrentPdf(savedPdf);
      setAdminFeedback(currentPdf ? 'PDF replaced successfully!' : 'PDF attached successfully!');
      setTimeout(() => setAdminFeedback(null), 3000);
    } catch (err: any) {
      setPdfError(err?.message || 'Failed to upload PDF.');
      setTimeout(() => setPdfError(null), 4000);
    } finally {
      setIsUploadingPdf(false);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePdf = async () => {
    if (!editingObjective?.id || !currentPdf) return;
    try {
      await removeObjectivePdf(editingObjective.id, course, currentPdf.storagePath);
      setCurrentPdf(null);
      setAdminFeedback('PDF removed successfully!');
      setTimeout(() => setAdminFeedback(null), 3000);
    } catch (err: any) {
      setPdfError(err?.message || 'Failed to remove PDF.');
      setTimeout(() => setPdfError(null), 4000);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleAddQuestion = () => {
    if (!editingObjective) return;
    const newQuestion: PracticeQuestion = {
      id: `q-${Date.now()}`,
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: '',
      objectiveId: editingObjective.id || ''
    };
    setEditingObjective({
      ...editingObjective,
      questions: [...(editingObjective.questions || []), newQuestion]
    });
  };

  const handleUpdateQuestion = (index: number, updates: Partial<PracticeQuestion>) => {
    if (!editingObjective || !editingObjective.questions) return;
    const newQuestions = [...editingObjective.questions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    setEditingObjective({ ...editingObjective, questions: newQuestions });
  };

  const handleRemoveQuestion = (index: number) => {
    if (!editingObjective || !editingObjective.questions) return;
    const newQuestions = editingObjective.questions.filter((_, i) => i !== index);
    setEditingObjective({ ...editingObjective, questions: newQuestions });
  };

  return (
    <>
      <motion.div 
        key="objectives"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[var(--bg-card)] p-6 md:p-8 rounded-[2rem] border border-[var(--border-color)] flex flex-col justify-center shadow-sm">
            <label className="text-[10px] uppercase tracking-widest font-black text-[var(--text-muted)] block mb-4">
              Select Objective to Edit
            </label>
            <div className="relative">
              <select 
                onChange={(e) => {
                  const selectedId = e.target.value;
                  const existing = allCourseObjectives.find(o => o.id === selectedId);
                  if (existing) {
                    setEditingObjective(existing);
                  }
                }}
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-4 md:p-5 text-[var(--text-main)] focus:border-indigo-500 transition-all appearance-none font-bold pr-12 text-sm"
                value=""
              >
                <option value="" disabled>Choose an objective to edit...</option>
                {allCourseObjectives.map(obj => {
                  const hasPdf = Boolean(getPdfForObjective(pdfMap, course, obj.id));
                  return (
                    <option key={obj.id} value={obj.id}>
                      {obj.id} - {obj.title} {hasPdf ? '• [PDF Attached]' : ''}
                    </option>
                  );
                })}
              </select>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)]">
                <ChevronRight size={20} className="rotate-90" />
              </div>
            </div>
          </div>

          <button 
            type="button"
            onClick={() => {
              const firstDomain = availableDomains[0];
              setEditingObjective({ 
                id: '', 
                title: '', 
                domain: firstDomain ? firstDomain.id : '', 
                description: '', 
                ...(course === 'a-plus' ? { exam: 'Core 1' } : {}), 
                components: [], 
                questions: [], 
                course 
              });
            }}
            className="h-full py-6 border-2 border-dashed border-[var(--border-color)] rounded-[2rem] flex flex-col items-center justify-center gap-3 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-indigo-500 transition-all font-black uppercase tracking-widest text-xs min-h-[140px] bg-[var(--bg-card)]/50 cursor-pointer"
          >
            <Plus size={32} className="mb-2" style={{ color: courseConfig.accentHex }} /> 
            Initialize New Module
          </button>
        </div>

        <div className="bg-[var(--bg-card)] p-6 md:p-10 rounded-[2rem] border border-[var(--border-color)] shadow-sm">
          <h3 className="text-2xl font-black uppercase tracking-tighter mb-8 flex items-center gap-3 text-[var(--text-main)]">
            <Layout size={24} style={{ color: courseConfig.accentHex }} />
            {courseConfig.shortLabel} Objectives <span style={{ color: courseConfig.accentHex }}>List</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allCourseObjectives.length === 0 ? (
              <div className="col-span-full p-12 text-center border-2 border-dashed border-[var(--border-color)] rounded-3xl bg-[var(--bg-surface)]">
                <p className="text-[var(--text-muted)] font-bold text-sm mb-2">No objectives created for {courseConfig.name} yet.</p>
                <p className="text-[var(--text-muted)] text-xs">Click "Initialize New Module" above to add an objective to any domain and attach its PDF.</p>
              </div>
            ) : (
              allCourseObjectives.map(obj => {
                const isInitialized = objectives.some(o => o.id === obj.id);
                const hasPdf = Boolean(getPdfForObjective(pdfMap, course, obj.id));
                const hasInteractive = Boolean(obj.interactiveLesson || getInteractiveLesson(course, obj.id, obj.domain));
                
                return (
                  <button 
                    key={obj.id}
                    onClick={() => setEditingObjective(obj)}
                    className="flex items-center justify-between p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-indigo-500/50 transition-all group text-left shadow-sm"
                  >
                    <div className="flex-1 pr-2">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: isInitialized ? courseConfig.accentHex : undefined }}>
                          {obj.id}
                        </span>
                        {isInitialized && (
                          <span 
                            className="text-white text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter"
                            style={{ backgroundColor: courseConfig.accentHex }}
                          >
                            Live
                          </span>
                        )}
                        {hasInteractive && (
                          <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter flex items-center gap-1">
                            <Sparkles size={9} /> Interactive Module
                          </span>
                        )}
                        {hasPdf ? (
                          <span className="bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter flex items-center gap-1">
                            <FileCheck2 size={9} /> PDF Attached
                          </span>
                        ) : (
                          <span className="bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-color)] text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">
                            No PDF
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-bold text-[var(--text-main)] group-hover:text-indigo-500 transition-colors line-clamp-1">
                        {obj.title}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] font-medium block mt-0.5">
                        {resolveDomainTitle(obj.domain, availableDomains)}
                      </span>
                    </div>
                    <ChevronRight size={16} className="text-[var(--text-muted)] group-hover:text-indigo-500 transition-colors shrink-0" />
                  </button>
                );
              })
            )}
          </div>
        </div>
      </motion.div>

      {/* Objective Editor Modal */}
      <AnimatePresence>
        {editingObjective && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingObjective(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 md:p-10 border-b border-[var(--border-color)] flex items-center justify-between">
                <div>
                  <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-[var(--text-main)]">
                    {editingObjective.id ? 'Edit' : 'Create'} <span style={{ color: courseConfig.accentHex }}>Objective</span>
                  </h2>
                  <p className="text-[var(--text-muted)] text-[10px] uppercase tracking-widest font-bold mt-2">
                    Configure objective metadata and attach study PDF material
                  </p>
                </div>
                <button onClick={() => setEditingObjective(null)} className="p-3 bg-[var(--bg-surface)] hover:bg-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-2xl transition-all border border-[var(--border-color)]">
                  <XCircle size={22} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8">
                <div className={`grid ${course === 'a-plus' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'} gap-6`}>
                  <div className="space-y-3">
                    <label className="text-[10px] uppercase tracking-widest font-black text-[var(--text-muted)]">
                      Objective ID (e.g., 1.1)
                    </label>
                    <input 
                      type="text" 
                      value={editingObjective.id || ''}
                      onChange={(e) => setEditingObjective({...editingObjective, id: e.target.value})}
                      className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-4 text-[var(--text-main)] focus:border-indigo-500 transition-all font-mono text-sm"
                    />
                  </div>
                  {course === 'a-plus' && (
                    <div className="space-y-3">
                      <label className="text-[10px] uppercase tracking-widest font-black text-[var(--text-muted)]">
                        Exam Part
                      </label>
                      <select 
                        value={editingObjective.exam || 'Core 1'}
                        onChange={(e) => setEditingObjective({...editingObjective, exam: e.target.value as any})}
                        className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-4 text-[var(--text-main)] focus:border-indigo-500 transition-all text-sm font-semibold"
                      >
                        <option value="Core 1">Core 1 (220-1101)</option>
                        <option value="Core 2">Core 2 (220-1102)</option>
                        <option value="General">General / All Parts</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] uppercase tracking-widest font-black text-[var(--text-muted)]">
                    Module Title
                  </label>
                  <input 
                    type="text" 
                    value={editingObjective.title || ''}
                    onChange={(e) => setEditingObjective({...editingObjective, title: e.target.value})}
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-4 text-[var(--text-main)] focus:border-indigo-500 transition-all text-lg font-black uppercase tracking-tight"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] uppercase tracking-widest font-black text-[var(--text-muted)]">
                    Domain
                  </label>
                  {availableDomains.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <span>This course has no domains yet. Add them in the Courses tab.</span>
                      {onNavigateToCourses && (
                        <button 
                          type="button"
                          onClick={() => {
                            setEditingObjective(null);
                            onNavigateToCourses();
                          }}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black uppercase tracking-wider text-[10px] hover:bg-amber-400 transition-colors shrink-0 self-start sm:self-auto cursor-pointer"
                        >
                          Go to Courses Tab
                        </button>
                      )}
                    </div>
                  ) : (
                    <select 
                      value={editingObjective.domain || ''}
                      onChange={(e) => {
                        setEditingObjective({
                          ...editingObjective, 
                          domain: e.target.value
                        });
                      }}
                      className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-4 text-[var(--text-main)] focus:border-indigo-500 transition-all font-bold text-sm cursor-pointer"
                    >
                      <option value="" disabled>Select a domain...</option>
                      {availableDomains.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] uppercase tracking-widest font-black text-[var(--text-muted)]">
                    Description
                  </label>
                  <textarea 
                    value={editingObjective.description || ''}
                    onChange={(e) => setEditingObjective({...editingObjective, description: e.target.value})}
                    rows={3}
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-4 text-[var(--text-main)] focus:border-indigo-500 transition-all resize-none text-sm"
                  />
                </div>

                {/* PDF Study Material Section */}
                <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-3xl p-6 md:p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <FileText style={{ color: courseConfig.accentHex }} size={22} />
                        <h4 className="text-lg font-black uppercase tracking-tight text-[var(--text-main)]">
                          Objective PDF Material
                        </h4>
                        {currentPdf ? (
                          <span className="bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1.5">
                            <CheckCircle2 size={12} /> PDF uploaded
                          </span>
                        ) : (
                          <span className="bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-color)] text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
                            No PDF
                          </span>
                        )}
                      </div>
                      <p className="text-[var(--text-muted)] text-xs mt-1">
                        Attached PDF material is rendered directly inside the student reader with canvas streaming.
                      </p>
                      {!editingObjective.id && (
                        <p className="text-[11px] text-amber-500 font-semibold mt-2 flex items-center gap-1.5">
                          <AlertCircle size={13} className="shrink-0" /> Enter an Objective ID above (e.g. 1.1) to enable PDF upload.
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <input 
                        type="file"
                        ref={fileInputRef}
                        accept="application/pdf"
                        onChange={handlePdfFileSelect}
                        className="hidden"
                      />

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingPdf || !editingObjective.id}
                        className="px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-white shadow-md transition-all flex items-center gap-2 disabled:opacity-50 hover:opacity-90"
                        style={{ backgroundColor: courseConfig.accentHex }}
                      >
                        {isUploadingPdf ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            <span>Uploading...</span>
                          </>
                        ) : currentPdf ? (
                          <>
                            <RefreshCw size={14} />
                            <span>Replace PDF</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud size={14} />
                            <span>Upload PDF</span>
                          </>
                        )}
                      </button>

                      {currentPdf && (
                        <button
                          type="button"
                          onClick={handleRemovePdf}
                          disabled={isUploadingPdf}
                          className="px-4 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                          <Trash2 size={14} />
                          <span>Remove PDF</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Upload Progress Bar */}
                  {uploadProgress !== null && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                        <span>Uploading file...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="h-2 w-full bg-[var(--bg-card)] rounded-full overflow-hidden border border-[var(--border-color)]">
                        <motion.div 
                          className="h-full bg-indigo-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadProgress}%` }}
                          transition={{ duration: 0.2 }}
                        />
                      </div>
                    </div>
                  )}

                  {/* PDF Error Display */}
                  {pdfError && (
                    <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-rose-500 text-xs font-bold">
                      <AlertCircle size={16} className="shrink-0" />
                      <span>{pdfError}</span>
                    </div>
                  )}

                  {/* Attached PDF Details */}
                  {currentPdf ? (
                    <div className="p-4 md:p-5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-500 shrink-0">
                          <FileText size={20} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[var(--text-main)] text-sm font-bold truncate">
                            {currentPdf.fileName}
                          </p>
                          <p className="text-[var(--text-muted)] text-[10px] uppercase tracking-wider font-semibold mt-0.5">
                            {formatFileSize(currentPdf.sizeBytes)} • Uploaded {new Date(currentPdf.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-[10px] font-mono text-[var(--text-muted)] break-all bg-[var(--bg-surface)] px-3 py-1.5 rounded-lg border border-[var(--border-color)]">
                        Storage: {currentPdf.storagePath.split('/').pop()}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 border-2 border-dashed border-[var(--border-color)] rounded-2xl">
                      <p className="text-xs text-[var(--text-muted)] font-semibold">
                        {!editingObjective.id 
                          ? 'Please set an Objective ID above before uploading a PDF.' 
                          : 'No PDF attached to this objective. Click "Upload PDF" above to attach material (max 30 MB).'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Phase 3: AI Interactive Module Studio */}
                <AdminInteractiveStudio
                  courseId={course}
                  objectiveId={editingObjective.id || '1.1'}
                  objectiveTitle={editingObjective.title || 'Interactive Module'}
                  domainName={resolveDomainTitle(editingObjective.domain || '', availableDomains)}
                  currentPdf={currentPdf}
                  interactiveLesson={
                    editingObjective.interactiveLesson ||
                    (editingObjective.id
                      ? getInteractiveLesson(course, editingObjective.id, editingObjective.domain) || undefined
                      : undefined)
                  }
                  onChangeInteractiveLesson={(nextLesson) =>
                    setEditingObjective(prev => (prev ? { ...prev, interactiveLesson: nextLesson } : null))
                  }
                  accentHex={courseConfig.accentHex}
                />

                {/* Practice Questions Section */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase tracking-widest font-black text-[var(--text-muted)]">
                      Practice Questions
                    </label>
                    <button 
                      type="button"
                      onClick={handleAddQuestion}
                      className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest transition-colors hover:opacity-80"
                      style={{ color: courseConfig.accentHex }}
                    >
                      <Plus size={14} /> Add Question
                    </button>
                  </div>

                  <div className="space-y-5">
                    {editingObjective.questions?.map((q, qIndex) => (
                      <div key={q.id || qIndex} className="bg-[var(--bg-surface)] p-5 md:p-6 rounded-2xl border border-[var(--border-color)] space-y-4 relative group">
                        <button 
                          type="button"
                          onClick={() => handleRemoveQuestion(qIndex)}
                          className="absolute top-5 right-5 text-[var(--text-muted)] hover:text-rose-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>

                        <div className="space-y-2">
                          <label className="text-[9px] uppercase tracking-widest font-black text-[var(--text-muted)]">
                            Question Text
                          </label>
                          <textarea 
                            value={q.question}
                            onChange={(e) => handleUpdateQuestion(qIndex, { question: e.target.value })}
                            className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-3 text-[var(--text-main)] focus:border-indigo-500 transition-all resize-none text-sm"
                            rows={2}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {q.options.map((opt, oIndex) => (
                            <div key={oIndex} className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <label className="text-[9px] uppercase tracking-widest font-black text-[var(--text-muted)]">
                                  Option {oIndex + 1}
                                </label>
                                <button 
                                  type="button"
                                  onClick={() => handleUpdateQuestion(qIndex, { correctAnswer: oIndex })}
                                  className={`text-[8px] uppercase tracking-widest font-black px-2 py-1 rounded transition-colors ${
                                    q.correctAnswer === oIndex ? 'bg-emerald-600 text-white' : 'bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-color)]'
                                  }`}
                                >
                                  Correct
                                </button>
                              </div>
                              <input 
                                type="text" 
                                value={opt}
                                onChange={(e) => {
                                  const newOptions = [...q.options];
                                  newOptions[oIndex] = e.target.value;
                                  handleUpdateQuestion(qIndex, { options: newOptions });
                                }}
                                className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-2.5 text-xs text-[var(--text-main)] focus:border-indigo-500 transition-all"
                              />
                            </div>
                          ))}
                        </div>

                        <div className="space-y-2">
                          <label className="text-[9px] uppercase tracking-widest font-black text-[var(--text-muted)]">
                            Explanation
                          </label>
                          <textarea 
                            value={q.explanation}
                            onChange={(e) => handleUpdateQuestion(qIndex, { explanation: e.target.value })}
                            className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-3 text-xs text-[var(--text-main)] focus:border-indigo-500 transition-all resize-none"
                            rows={2}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 md:p-8 bg-[var(--bg-surface)] border-t border-[var(--border-color)] flex justify-between items-center gap-4">
                {editingObjective.id && (
                  <button 
                    type="button"
                    onClick={() => {
                      if (editingObjective.id) {
                        const targetId = (editingObjective as any).docId || `${course}_${editingObjective.id.trim()}`;
                        onDeleteObjective(targetId, editingObjective.title || '');
                      }
                    }}
                    className="px-5 md:px-6 py-3 bg-rose-500/10 text-rose-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-500/20 transition-all flex items-center gap-2 border border-rose-500/20"
                  >
                    <Trash2 size={15} />
                    Delete Module
                  </button>
                )}
                <div className="flex gap-3 ml-auto">
                  <button 
                    type="button"
                    onClick={() => setEditingObjective(null)}
                    className="px-5 md:px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button"
                    onClick={handleSaveObjective}
                    disabled={isSaving}
                    className="px-6 md:px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-white shadow-md transition-all flex items-center gap-2 disabled:opacity-50 hover:opacity-90"
                    style={{ backgroundColor: courseConfig.accentHex }}
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={15} />}
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AdminObjectivesTab;
