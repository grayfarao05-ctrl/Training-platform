import React, { useState, useEffect } from 'react';
import { 
  MinigameLeaderboard, MatchMakerHighscore, CliLeaderboard, CourseId, 
  CVClinicCase, CVClinicSection, CVClinicLine, MistakeCategory, CVClinicLeaderboard,
  ContractLeaderboard
} from '../../types';
import { getCourseConfig, filterByCourse } from '../../courseConfig';
import { db, auth, handleFirestoreError, OperationType } from '../../firebase';
import { 
  collection, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp 
} from 'firebase/firestore';
import { 
  Gamepad2, Plus, Edit3, Copy, Trash2, CheckCircle2, 
  AlertTriangle, Clock, FileText, ChevronRight, Check, X,
  FileCheck, Sparkles, BookOpen, FileWarning, Scale, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CVPaper } from '../minigames/CVPaper';
import { AdminContractRedFlagsSection } from './AdminContractRedFlagsSection';
import { generateAiCvCase } from '../../aiAdminService';

interface AdminArcadeTabProps {
  trioLeaderboard: MatchMakerHighscore[];
  leaderboard: MinigameLeaderboard[];
  cliLeaderboard: CliLeaderboard[];
  course?: CourseId;
  setAdminFeedback?: (msg: string | null) => void;
}

const MISTAKE_CATEGORIES: { id: MistakeCategory; label: string; tip: string }[] = [
  { id: 'contact', label: 'Contact Details', tip: 'Professional email, valid phone number' },
  { id: 'privacy', label: 'Privacy & Personal Info', tip: 'No ID number, street address, marital status' },
  { id: 'honesty', label: 'Honesty & Integrity', tip: 'No false certifications, accurate dates' },
  { id: 'format', label: 'File & Format', tip: 'Clean PDF, Firstname_Surname_CV.pdf' },
  { id: 'spelling', label: 'Spelling & Grammar', tip: 'Typo-free, consistent punctuation' },
  { id: 'content', label: 'Content & Impact', tip: 'Action verbs, tailored to role, no fluff' },
];

const SAMPLE_MATRIC_CV_TEXT = `# File
Thabo_Mokoena_Draft_CV_Final(1).docx

# Personal Information
Full Name: Thabo Mokoena
ID Number: 030514 5298 089
Residential Address: 42 Palm Avenue, Protea Glen, Soweto, 1818
Email: thabo_the_coolest99@yahoo.com
Mobile: +27 72 555 1234
Marital Status: Single | Religion: Christian

# Professional Summary
Hardworking matric graduate with strong interpersonal and computer skills. Motivated to excel in entry-level technology and administrative roles.

# Education
National Senior Certificate (Matric) - Completed with Bachelor's Pass
Meadowlands Secondary School | 2021 - 2025

# Certifications & Skills
CompTIA A+ Certified - Mastered Hardware and Networking
Proficient in Microsoft Office (Word, Excel, PowerPoint)
Good verbal communication and teamwork

# Work Experience
Sales Assistant (Part-Time) | Cash & Carry Soweto
Assisted customers with electronics purchases and handled till transactions.`;

export const AdminArcadeTab: React.FC<AdminArcadeTabProps> = ({
  trioLeaderboard,
  leaderboard,
  cliLeaderboard,
  course = 'a-plus',
  setAdminFeedback
}) => {
  const courseConfig = getCourseConfig(course);
  const filteredTrio = filterByCourse(trioLeaderboard, course);
  const filteredLeaderboard = filterByCourse(leaderboard, course);
  const filteredCli = filterByCourse(cliLeaderboard, course);

  // CV Clinic cases state
  const [cases, setCases] = useState<CVClinicCase[]>([]);
  const [loadingCases, setLoadingCases] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingCaseId, setEditingCaseId] = useState<string | null>(null);
  const [activeEditorTab, setActiveEditorTab] = useState<'editor' | 'preview'>('editor');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Case editor form state
  const [caseCourse, setCaseCourse] = useState<CourseId>(course || 'matric-to-money');
  const [courseFilter, setCourseFilter] = useState<'all' | CourseId>('all');
  const [title, setTitle] = useState('');
  const [brief, setBrief] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [timeLimitSeconds, setTimeLimitSeconds] = useState(60);
  const [rawCvText, setRawCvText] = useState('');
  const [sections, setSections] = useState<CVClinicSection[]>([]);
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [localFeedback, setLocalFeedback] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // AI CV Generator Modal state
  const [isAiCvModalOpen, setIsAiCvModalOpen] = useState(false);
  const [aiCvRole, setAiCvRole] = useState('Entry-Level IT Support Technician');
  const [aiCvDifficulty, setAiCvDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [isAiCvGenerating, setIsAiCvGenerating] = useState(false);
  const [aiCvError, setAiCvError] = useState<string | null>(null);

  const handleGenerateAiCv = async () => {
    setIsAiCvGenerating(true);
    setAiCvError(null);
    try {
      const generated = await generateAiCvCase({
        difficulty: aiCvDifficulty,
        candidateRole: aiCvRole,
      });

      setEditingCaseId(null);
      setCaseCourse('matric-to-money');
      setTitle((generated.title || 'Draft CV Case').slice(0, 80));
      setBrief((generated.brief || '').slice(0, 200));
      setDifficulty(generated.difficulty || aiCvDifficulty);
      setTimeLimitSeconds(generated.timeLimitSeconds || 60);
      setSections(generated.sections || []);
      setStatus('draft');

      const raw = (generated.sections || []).map(sec => {
        const linesStr = sec.lines.map(l => l.text).join('\n');
        return `# ${sec.heading}\n${linesStr}`;
      }).join('\n\n');
      setRawCvText(raw);

      setIsAiCvModalOpen(false);
      setIsEditorOpen(true);
      setActiveEditorTab('editor');
      showFeedback('AI generated draft CV case loaded into editor!');
    } catch (err: any) {
      setAiCvError(err?.message || 'Failed to generate CV case');
    } finally {
      setIsAiCvGenerating(false);
    }
  };

  // Subscribe to cv_clinic_cases
  useEffect(() => {
    setLoadingCases(true);
    const unsubscribe = onSnapshot(
      collection(db, 'cv_clinic_cases'),
      (snapshot) => {
        const docs = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as CVClinicCase));
        setCases(docs);
        setLoadingCases(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'cv_clinic_cases');
        setLoadingCases(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const [cvLeaderboard, setCvLeaderboard] = useState<CVClinicLeaderboard[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'cv_clinic_leaderboard'),
      (snapshot) => {
        const docs = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as CVClinicLeaderboard));
        setCvLeaderboard(docs);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'cv_clinic_leaderboard');
      }
    );
    return () => unsubscribe();
  }, []);

  const [contractLeaderboard, setContractLeaderboard] = useState<ContractLeaderboard[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'contract_leaderboard'),
      (snapshot) => {
        const docs = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as ContractLeaderboard));
        setContractLeaderboard(docs);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'contract_leaderboard');
      }
    );
    return () => unsubscribe();
  }, []);

  const courseCases = cases.filter(c => c.course === course);

  const showFeedback = (msg: string) => {
    if (setAdminFeedback) {
      setAdminFeedback(msg);
    } else {
      setLocalFeedback(msg);
      setTimeout(() => setLocalFeedback(null), 4000);
    }
  };

  // Move a case to another course
  const handleChangeCaseCourse = async (c: CVClinicCase, newCourse: CourseId) => {
    if (!c.id) return;
    try {
      await setDoc(doc(db, 'cv_clinic_cases', c.id), { course: newCourse }, { merge: true });
      showFeedback(`Case "${c.title}" moved to ${newCourse === 'matric-to-money' ? 'Matric to Money' : 'CompTIA ' + newCourse.toUpperCase()}!`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'cv_clinic_cases');
    }
  };

  // Move all non-matric cases to matric-to-money
  const handleMoveAllToMatric = async () => {
    const nonMatric = cases.filter(c => c.course !== 'matric-to-money');
    try {
      for (const c of nonMatric) {
        if (c.id) {
          await setDoc(doc(db, 'cv_clinic_cases', c.id), { course: 'matric-to-money' }, { merge: true });
        }
      }
      showFeedback(`Successfully moved ${nonMatric.length} case(s) to Matric to Money!`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'cv_clinic_cases');
    }
  };

  // Open editor for a new case
  const handleAddNew = () => {
    setEditingCaseId(null);
    setCaseCourse('matric-to-money');
    setTitle('');
    setBrief('');
    setDifficulty('medium');
    setTimeLimitSeconds(60);
    setRawCvText('');
    setSections([]);
    setStatus('draft');
    setActiveEditorTab('editor');
    setIsEditorOpen(true);
  };

  // Open editor for an existing case
  const handleEditCase = (c: CVClinicCase) => {
    setEditingCaseId(c.id || null);
    setCaseCourse(c.course || 'matric-to-money');
    setTitle(c.title || '');
    setBrief(c.brief || '');
    setDifficulty(c.difficulty || 'medium');
    setTimeLimitSeconds(c.timeLimitSeconds || 60);
    setSections(c.sections || []);
    setStatus(c.status || 'draft');

    // Reconstruct raw text from sections
    const linesOfText: string[] = [];
    (c.sections || []).forEach(sec => {
      linesOfText.push(`# ${sec.heading}`);
      sec.lines.forEach(l => linesOfText.push(l.text));
      linesOfText.push('');
    });
    setRawCvText(linesOfText.join('\n').trim());
    setActiveEditorTab('editor');
    setIsEditorOpen(true);
  };

  // Duplicate an existing case
  const handleDuplicateCase = async (c: CVClinicCase) => {
    try {
      const newDocId = `case_${Date.now()}`;
      const duplicated: CVClinicCase = {
        ...c,
        title: `Copy of ${c.title}`.slice(0, 80),
        status: 'draft',
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser?.email || auth.currentUser?.uid || 'admin'
      };
      await setDoc(doc(db, 'cv_clinic_cases', newDocId), duplicated);
      showFeedback(`Case duplicated as draft: "${duplicated.title}"`);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'cv_clinic_cases');
    }
  };

  // Quick toggle publish/draft status
  const handleToggleStatus = async (c: CVClinicCase) => {
    if (!c.id) return;
    try {
      const nextStatus = c.status === 'published' ? 'draft' : 'published';
      await setDoc(doc(db, 'cv_clinic_cases', c.id), { status: nextStatus }, { merge: true });
      showFeedback(`Case status changed to ${nextStatus}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `cv_clinic_cases/${c.id}`);
    }
  };

  // Delete case
  const handleDeleteCase = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'cv_clinic_cases', id));
      setConfirmDeleteId(null);
      showFeedback('CV Clinic case deleted.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `cv_clinic_cases/${id}`);
    }
  };

  // Parse raw pasted text into sections and lines
  const parsePastedText = (text: string) => {
    const rawLines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (rawLines.length === 0) {
      setSections([]);
      return;
    }

    // Preserve existing mistakes by matching line text if available
    const existingMistakesByText = new Map<string, { category: MistakeCategory; reason: string }>();
    sections.forEach(sec => {
      sec.lines.forEach(line => {
        if (line.mistake) {
          existingMistakesByText.set(line.text.trim(), line.mistake);
        }
      });
    });

    const parsedSections: CVClinicSection[] = [];
    let currentHeading = 'File';
    let currentLines: CVClinicLine[] = [];

    rawLines.forEach((lineStr, idx) => {
      if (lineStr.startsWith('#')) {
        if (currentLines.length > 0) {
          parsedSections.push({ heading: currentHeading, lines: currentLines });
          currentLines = [];
        }
        currentHeading = lineStr.replace(/^#+\s*/, '').trim() || 'Section';
      } else {
        const trimmed = lineStr.slice(0, 200);
        const existingMistake = existingMistakesByText.get(trimmed);
        currentLines.push({
          id: `line_${idx}_${Date.now()}`,
          text: trimmed,
          mistake: existingMistake
        });
      }
    });

    if (currentLines.length > 0) {
      parsedSections.push({ heading: currentHeading, lines: currentLines });
    }

    setSections(parsedSections);
  };

  // Toggle mistake on a specific line
  const handleToggleMistake = (secIdx: number, lineIdx: number) => {
    setSections(prev => {
      const copy = JSON.parse(JSON.stringify(prev)) as CVClinicSection[];
      const line = copy[secIdx].lines[lineIdx];
      if (line.mistake) {
        delete line.mistake;
      } else {
        line.mistake = {
          category: 'privacy',
          reason: ''
        };
      }
      return copy;
    });
  };

  // Update mistake category or reason
  const handleUpdateMistake = (
    secIdx: number, 
    lineIdx: number, 
    field: 'category' | 'reason', 
    val: string
  ) => {
    setSections(prev => {
      const copy = JSON.parse(JSON.stringify(prev)) as CVClinicSection[];
      const line = copy[secIdx].lines[lineIdx];
      if (!line.mistake) {
        line.mistake = { category: 'privacy', reason: '' };
      }
      if (field === 'category') {
        line.mistake.category = val as MistakeCategory;
      } else {
        line.mistake.reason = val.slice(0, 160);
      }
      return copy;
    });
  };

  // Calculations for validation
  const totalLines = sections.reduce((acc, s) => acc + s.lines.length, 0);
  const totalSections = sections.length;
  const mistakesList = sections.flatMap(s => s.lines.filter(l => Boolean(l.mistake)));
  const totalMistakes = mistakesList.length;

  const validationErrors: string[] = [];
  if (!title.trim()) validationErrors.push('Title is required (max 80 chars).');
  if (title.length > 80) validationErrors.push('Title must be at most 80 characters.');
  if (brief.length > 200) validationErrors.push('Brief must be at most 200 characters.');
  if (totalSections === 0 || totalSections > 12) validationErrors.push(`Must have between 1 and 12 sections (currently ${totalSections}).`);
  if (totalLines < 8) validationErrors.push(`At least 8 lines are required (currently ${totalLines}).`);
  if (totalLines > 40) validationErrors.push(`At most 40 lines are allowed per case (currently ${totalLines}).`);
  if (totalMistakes < 3 || totalMistakes > 10) {
    validationErrors.push(`Must have between 3 and 10 planted mistakes (currently ${totalMistakes}).`);
  }

  // Check that all mistake reasons are filled
  const emptyReasons = mistakesList.some(m => !m.mistake?.reason.trim());
  if (emptyReasons) {
    validationErrors.push('All planted mistakes must have an explanation reason (max 160 chars).');
  }

  const isValidToSave = validationErrors.length === 0;

  // Save case to Firestore
  const handleSaveCase = async (targetStatus?: 'draft' | 'published') => {
    if (!isValidToSave && targetStatus === 'published') return;
    setSaving(true);
    try {
      const finalStatus = targetStatus || status;
      const caseDocId = editingCaseId || `case_${Date.now()}`;
      const payload: CVClinicCase = {
        course: caseCourse,
        title: title.trim().slice(0, 80),
        brief: brief.trim().slice(0, 200),
        difficulty,
        timeLimitSeconds: Number(timeLimitSeconds) || 60,
        sections,
        status: finalStatus,
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser?.email || auth.currentUser?.uid || 'admin'
      };

      await setDoc(doc(db, 'cv_clinic_cases', caseDocId), payload, { merge: true });
      showFeedback(`CV Clinic case saved as ${finalStatus}!`);
      setIsEditorOpen(false);
    } catch (err) {
      handleFirestoreError(err, editingCaseId ? OperationType.UPDATE : OperationType.CREATE, 'cv_clinic_cases');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div 
      key="arcade"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-12"
    >
      {/* CV CLINIC CASES SECTION */}
      <div className="bg-[var(--bg-card)] p-6 md:p-10 rounded-[2rem] border border-[var(--border-color)] shadow-sm space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border-color)]">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <FileCheck size={26} />
              </span>
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tight text-[var(--text-main)]">
                  CV Clinic Cases
                </h3>
                <p className="text-xs text-[var(--text-muted)] font-medium">
                  Author real-world sample CVs with planted mistakes for {courseConfig.name} ({courseConfig.shortLabel})
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setAiCvError(null);
                setIsAiCvModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl font-black uppercase tracking-wider text-xs bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white shadow-lg shadow-emerald-950/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Sparkles size={16} />
              AI Draft CV
            </button>

            <button
              type="button"
              onClick={handleAddNew}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-black uppercase tracking-wider text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Plus size={16} />
              Create New Case
            </button>
          </div>
        </div>

        {/* Course Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)]">
            <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] px-2">
              Filter:
            </span>
            <button
              type="button"
              onClick={() => setCourseFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                courseFilter === 'all'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              All Cases ({cases.length})
            </button>
            <button
              type="button"
              onClick={() => setCourseFilter('matric-to-money')}
              className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                courseFilter === 'matric-to-money'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              Matric to Money ({cases.filter(c => !c.course || c.course === 'matric-to-money').length})
            </button>
            <button
              type="button"
              onClick={() => setCourseFilter('a-plus')}
              className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                courseFilter === 'a-plus'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              CompTIA A+ ({cases.filter(c => c.course === 'a-plus').length})
            </button>
          </div>

          {cases.some(c => c.course === 'a-plus') && (
            <button
              type="button"
              onClick={handleMoveAllToMatric}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles size={13} />
              <span>Move A+ cases to Matric to Money</span>
            </button>
          )}
        </div>

        {/* Notice if cases are assigned to A+ */}
        {cases.some(c => c.course === 'a-plus' && c.status === 'published') && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4 text-xs text-amber-300">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="shrink-0 text-amber-400" />
              <span>
                <strong>Notice:</strong> You have published case(s) tagged as <em>CompTIA A+</em>. If you want them displayed on the <strong>Matric to Money</strong> dashboard, click "Move to Matric to Money" below.
              </span>
            </div>
            <button
              type="button"
              onClick={handleMoveAllToMatric}
              className="px-3 py-1.5 rounded-lg bg-amber-500 text-black font-bold text-xs uppercase tracking-wider hover:bg-amber-400 shrink-0 cursor-pointer"
            >
              Fix Now
            </button>
          </div>
        )}

        {/* Cases List */}
        {loadingCases ? (
          <div className="py-12 text-center text-sm text-[var(--text-muted)] italic">
            Loading CV Clinic cases...
          </div>
        ) : (courseFilter === 'all' ? cases : cases.filter(c => (c.course || 'matric-to-money') === courseFilter)).length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-[var(--border-color)] bg-[var(--bg-surface)]">
            <BookOpen size={40} className="mx-auto text-[var(--text-muted)] mb-3 opacity-60" />
            <h4 className="text-base font-bold text-[var(--text-main)] mb-1">No CV Clinic Cases Found</h4>
            <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto mb-5">
              {courseFilter === 'all' 
                ? 'Create the first sample CV case. Students will find and tap planted mistakes against the clock!' 
                : `No cases assigned to ${courseFilter === 'matric-to-money' ? 'Matric to Money' : courseFilter}. Create one or change filter to "All Cases".`}
            </p>
            <button
              type="button"
              onClick={handleAddNew}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-600 text-white hover:bg-emerald-500 transition-colors cursor-pointer"
            >
              <Plus size={14} /> Add First Case
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {(courseFilter === 'all' ? cases : cases.filter(c => (c.course || 'matric-to-money') === courseFilter)).map((c) => {
              const linesCount = (c.sections || []).reduce((acc, s) => acc + (s.lines?.length || 0), 0);
              const mistakeCount = (c.sections || []).flatMap(s => (s.lines || []).filter(l => Boolean(l.mistake))).length;
              const isMatric = !c.course || c.course === 'matric-to-money';
              return (
                <div 
                  key={c.id}
                  className="bg-[var(--bg-surface)] rounded-2xl p-5 border border-[var(--border-color)] flex flex-col justify-between hover:border-emerald-500/40 transition-colors shadow-sm"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          c.status === 'published'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                        }`}>
                          {c.status}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          isMatric 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {isMatric ? 'Matric to Money' : 'CompTIA A+'}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-[var(--text-muted)] flex items-center gap-1">
                        <Clock size={12} /> {c.timeLimitSeconds}s
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-base text-[var(--text-main)] leading-snug line-clamp-1">
                        {c.title}
                      </h4>
                      {c.brief && (
                        <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2 italic">
                          "{c.brief}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-color)] text-xs text-[var(--text-muted)]">
                      <span className="px-2 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--border-color)] font-medium capitalize">
                        {c.difficulty}
                      </span>
                      <span>•</span>
                      <span>{linesCount} lines</span>
                      <span>•</span>
                      <span className="text-emerald-500 font-bold">{mistakeCount} mistakes</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 pt-3 border-t border-[var(--border-color)] space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(c)}
                        className="text-[11px] font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
                      >
                        {c.status === 'published' ? 'Unpublish' : 'Publish'}
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleDuplicateCase(c)}
                          title="Duplicate case"
                          className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)] transition-colors cursor-pointer"
                        >
                          <Copy size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditCase(c)}
                          title="Edit case"
                          className="p-2 rounded-lg text-[var(--text-muted)] hover:text-emerald-500 hover:bg-[var(--bg-card)] transition-colors cursor-pointer"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(c.id || null)}
                          title="Delete case"
                          className="p-2 rounded-lg text-[var(--text-muted)] hover:text-rose-500 hover:bg-[var(--bg-card)] transition-colors cursor-pointer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Quick Move Button */}
                    <div className="pt-1.5 border-t border-[var(--border-color)]/50 flex items-center justify-between text-[10px]">
                      <span className="text-[var(--text-muted)]">Move to:</span>
                      {isMatric ? (
                        <button
                          type="button"
                          onClick={() => handleChangeCaseCourse(c, 'a-plus')}
                          className="text-red-400 hover:underline font-bold cursor-pointer"
                        >
                          CompTIA A+
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleChangeCaseCourse(c, 'matric-to-money')}
                          className="text-emerald-400 hover:underline font-bold cursor-pointer"
                        >
                          Matric to Money (Recommended)
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CONTRACT RED FLAGS CASES SECTION & REFERENCE FIGURES */}
      <AdminContractRedFlagsSection course={course} showFeedback={showFeedback} />

      {/* CASE EDITOR MODAL */}
      <AnimatePresence>
        {isEditorOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2rem] w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between shrink-0 bg-[var(--bg-surface)]">
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                    <FileCheck size={22} />
                  </span>
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight text-[var(--text-main)]">
                      {editingCaseId ? 'Edit CV Clinic Case' : 'New CV Clinic Case'}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)]">
                      Course: <span className="font-bold text-emerald-400">{getCourseConfig(caseCourse).name}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex bg-[var(--bg-card)] p-1 rounded-xl border border-[var(--border-color)]">
                    <button
                      type="button"
                      onClick={() => setActiveEditorTab('editor')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                        activeEditorTab === 'editor'
                          ? 'bg-emerald-600 text-white shadow'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      Editor
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveEditorTab('preview')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                        activeEditorTab === 'preview'
                          ? 'bg-emerald-600 text-white shadow'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      Live Preview
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditorOpen(false)}
                    className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-8 flex-1">
                {activeEditorTab === 'editor' ? (
                  <div className="space-y-8">
                    {/* Top Case Parameters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Assigned Course */}
                      <div className="space-y-1.5 md:col-span-2">
                        <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                          <label htmlFor="case-course-select">Assigned Course *</label>
                          <span className="text-[10px] font-bold text-emerald-400">
                            Featured on this course's arcade row
                          </span>
                        </div>
                        <select
                          id="case-course-select"
                          value={caseCourse}
                          onChange={(e) => setCaseCourse(e.target.value as CourseId)}
                          className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] text-sm font-bold focus:outline-none focus:border-emerald-500"
                        >
                          <option value="matric-to-money">Matric to Money (Free Course - Recommended)</option>
                          <option value="a-plus">CompTIA A+</option>
                          <option value="network-plus">CompTIA Network+</option>
                        </select>
                      </div>

                      {/* Title */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                          <label htmlFor="case-title">Case Title *</label>
                          <span className={title.length > 80 ? 'text-rose-500 font-bold' : ''}>
                            {title.length}/80
                          </span>
                        </div>
                        <input
                          id="case-title"
                          type="text"
                          maxLength={80}
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="e.g. Thabo's Entry-Level Tech CV"
                          className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] text-sm focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      {/* Brief */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                          <label htmlFor="case-brief">Student Brief / Hint</label>
                          <span className={brief.length > 200 ? 'text-rose-500 font-bold' : ''}>
                            {brief.length}/200
                          </span>
                        </div>
                        <input
                          id="case-brief"
                          type="text"
                          maxLength={200}
                          value={brief}
                          onChange={(e) => setBrief(e.target.value)}
                          placeholder="e.g. Thabo has not written his exam yet."
                          className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] text-sm focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      {/* Difficulty */}
                      <div className="space-y-1.5">
                        <label htmlFor="case-diff" className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                          Difficulty
                        </label>
                        <select
                          id="case-diff"
                          value={difficulty}
                          onChange={(e) => setDifficulty(e.target.value as any)}
                          className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] text-sm focus:outline-none focus:border-emerald-500"
                        >
                          <option value="easy">Easy (More obvious mistakes)</option>
                          <option value="medium">Medium (Standard real-world mix)</option>
                          <option value="hard">Hard (Subtle formatting & honesty traps)</option>
                        </select>
                      </div>

                      {/* Timer Limit */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                          <label htmlFor="case-timer">Timer Limit (Seconds)</label>
                          <span className="font-mono text-emerald-500 font-bold">{timeLimitSeconds}s</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            id="case-timer"
                            type="range"
                            min={30}
                            max={180}
                            step={5}
                            value={timeLimitSeconds}
                            onChange={(e) => setTimeLimitSeconds(Number(e.target.value))}
                            className="flex-1 accent-emerald-500 cursor-pointer"
                          />
                          <input
                            type="number"
                            min={30}
                            max={180}
                            value={timeLimitSeconds}
                            onChange={(e) => setTimeLimitSeconds(Number(e.target.value))}
                            className="w-20 px-3 py-2 text-center rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-sm font-bold text-[var(--text-main)]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Paste CV Text Box */}
                    <div className="space-y-2 p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)]">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <label htmlFor="paste-cv-text" className="text-xs font-black uppercase tracking-wider text-[var(--text-main)] flex items-center gap-2">
                            <FileText size={16} className="text-emerald-500" />
                            Paste CV Text (One line per row)
                          </label>
                          <p className="text-[11px] text-[var(--text-muted)]">
                            Rows starting with <code className="text-emerald-500 font-bold">#</code> create section headings. Use <code className="text-emerald-500 font-bold"># File</code> for the resume filename chip.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setRawCvText(SAMPLE_MATRIC_CV_TEXT);
                              parsePastedText(SAMPLE_MATRIC_CV_TEXT);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                          >
                            <Sparkles size={13} className="text-amber-500" /> Load Sample Text
                          </button>
                          <button
                            type="button"
                            onClick={() => parsePastedText(rawCvText)}
                            className="px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                          >
                            Parse Lines
                          </button>
                        </div>
                      </div>

                      <textarea
                        id="paste-cv-text"
                        rows={6}
                        value={rawCvText}
                        onChange={(e) => setRawCvText(e.target.value)}
                        placeholder={`# File\nThabo_CV.docx\n\n# Personal Details\nThabo Mokoena\nID Number: 030514 5298 089\n...`}
                        className="w-full p-3 font-mono text-xs rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] focus:outline-none focus:border-emerald-500 leading-relaxed"
                      />
                    </div>

                    {/* Interactive Lines Editor */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-black uppercase tracking-wider text-[var(--text-main)]">
                            Planted Mistake Annotator
                          </h4>
                          <p className="text-xs text-[var(--text-muted)]">
                            Toggle "This is a mistake" for 3 to 10 lines. Add a category and learning reason.
                          </p>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className={`font-bold ${totalLines >= 8 && totalLines <= 40 ? 'text-emerald-500' : 'text-amber-500'}`}>
                            {totalLines} lines (need 8-40)
                          </span>
                          <span>•</span>
                          <span className={`font-bold ${totalMistakes >= 3 && totalMistakes <= 10 ? 'text-emerald-500' : 'text-amber-500'}`}>
                            {totalMistakes} mistakes (need 3-10)
                          </span>
                        </div>
                      </div>

                      {sections.length === 0 ? (
                        <div className="py-8 text-center text-xs text-[var(--text-muted)] italic border border-[var(--border-color)] rounded-xl bg-[var(--bg-surface)]">
                          No lines parsed yet. Paste CV text above and click "Parse Lines".
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {sections.map((sec, secIdx) => (
                            <div key={secIdx} className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-3">
                              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
                                <span className="text-xs font-black uppercase tracking-wider text-emerald-500 flex items-center gap-2">
                                  <ChevronRight size={14} />
                                  Section: {sec.heading}
                                </span>
                                <span className="text-[11px] font-mono text-[var(--text-muted)]">
                                  {sec.lines.length} lines
                                </span>
                              </div>

                              <div className="space-y-2.5">
                                {sec.lines.map((line, lineIdx) => {
                                  const isMistake = Boolean(line.mistake);
                                  return (
                                    <div 
                                      key={line.id}
                                      className={`p-3 rounded-xl border transition-all ${
                                        isMistake 
                                          ? 'bg-rose-500/5 border-rose-500/40' 
                                          : 'bg-[var(--bg-card)] border-[var(--border-color)]'
                                      }`}
                                    >
                                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex-1 text-sm font-medium text-[var(--text-main)] break-words">
                                          {line.text}
                                        </div>

                                        <label className="shrink-0 flex items-center gap-2 cursor-pointer select-none">
                                          <input
                                            type="checkbox"
                                            checked={isMistake}
                                            onChange={() => handleToggleMistake(secIdx, lineIdx)}
                                            className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
                                          />
                                          <span className={`text-xs font-bold uppercase tracking-wider ${
                                            isMistake ? 'text-rose-500' : 'text-[var(--text-muted)]'
                                          }`}>
                                            This is a mistake
                                          </span>
                                        </label>
                                      </div>

                                      {/* Mistake Configuration Fields */}
                                      {isMistake && (
                                        <div className="mt-3 pt-3 border-t border-rose-500/20 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                          <div>
                                            <label className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] block mb-1">
                                              Category
                                            </label>
                                            <select
                                              value={line.mistake?.category || 'privacy'}
                                              onChange={(e) => handleUpdateMistake(secIdx, lineIdx, 'category', e.target.value)}
                                              className="w-full px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)] text-xs text-[var(--text-main)] font-semibold focus:outline-none focus:border-rose-500"
                                            >
                                              {MISTAKE_CATEGORIES.map(cat => (
                                                <option key={cat.id} value={cat.id}>
                                                  {cat.label}
                                                </option>
                                              ))}
                                            </select>
                                          </div>

                                          <div className="sm:col-span-2">
                                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] mb-1">
                                              <label>Reason / Lesson Feedback *</label>
                                              <span className={(line.mistake?.reason.length || 0) > 160 ? 'text-rose-500 font-bold' : ''}>
                                                {line.mistake?.reason.length || 0}/160
                                              </span>
                                            </div>
                                            <input
                                              type="text"
                                              maxLength={160}
                                              value={line.mistake?.reason || ''}
                                              onChange={(e) => handleUpdateMistake(secIdx, lineIdx, 'reason', e.target.value)}
                                              placeholder="e.g. Leave off your ID number and street address for privacy protection."
                                              className="w-full px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)] text-xs text-[var(--text-main)] focus:outline-none focus:border-rose-500"
                                            />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* LIVE PREVIEW TAB */
                  <div className="space-y-4">
                    <div className="text-center max-w-md mx-auto mb-4">
                      <h4 className="text-base font-bold text-[var(--text-main)]">Student Play Screen Preview</h4>
                      <p className="text-xs text-[var(--text-muted)]">
                        Here is how students will see and interact with this case on phone or desktop.
                      </p>
                    </div>
                    <CVPaper sections={sections} mode="preview" highlightMistakesInPreview={true} />
                  </div>
                )}

                {/* Validation Warnings */}
                {validationErrors.length > 0 && (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertTriangle size={15} /> Please resolve the following before publishing:
                    </div>
                    <ul className="list-disc list-inside space-y-0.5 ml-1">
                      {validationErrors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 sm:p-6 border-t border-[var(--border-color)] flex flex-col sm:flex-row items-center justify-between gap-3 bg-[var(--bg-surface)] shrink-0">
                <div className="text-xs text-[var(--text-muted)] font-medium">
                  {isValidToSave ? (
                    <span className="text-emerald-500 font-bold flex items-center gap-1">
                      <CheckCircle2 size={14} /> Ready to save or publish!
                    </span>
                  ) : (
                    <span>{validationErrors.length} requirement(s) pending</span>
                  )}
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setIsEditorOpen(false)}
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-[var(--border-color)] text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleSaveCase('draft')}
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 text-xs font-black uppercase tracking-wider transition-colors disabled:opacity-50"
                  >
                    Save as Draft
                  </button>
                  <button
                    type="button"
                    disabled={saving || !isValidToSave}
                    onClick={() => handleSaveCase('published')}
                    className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-600/30 transition-all"
                  >
                    {saving ? 'Saving...' : 'Publish Case'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {confirmDeleteId && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl"
            >
              <div className="flex items-center gap-3 text-rose-500">
                <AlertTriangle size={24} />
                <h4 className="font-black text-base uppercase tracking-tight">Delete Case?</h4>
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Are you sure you want to permanently delete this CV Clinic case? This cannot be undone.
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteCase(confirmDeleteId)}
                  className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI CV Generator Modal */}
      <AnimatePresence>
        {isAiCvModalOpen && (
          <div className="fixed inset-0 z-[130] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl space-y-6 relative"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    <Sparkles size={20} />
                  </span>
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tight text-[var(--text-main)]">
                      AI CV Case Drafter
                    </h3>
                    <p className="text-xs text-[var(--text-muted)]">
                      Generate a realistic sample CV with planted South African mistakes for students to spot.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAiCvModalOpen(false)}
                  disabled={isAiCvGenerating}
                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-white hover:bg-white/10"
                >
                  <X size={18} />
                </button>
              </div>

              {aiCvError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 font-medium">
                  {aiCvError}
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Target Candidate Role
                  </label>
                  <input
                    type="text"
                    value={aiCvRole}
                    onChange={(e) => setAiCvRole(e.target.value)}
                    placeholder="e.g. Junior IT Support & Desktop Technician"
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-sm font-bold text-[var(--text-main)] focus:outline-none focus:border-emerald-500"
                    disabled={isAiCvGenerating}
                  />
                  <span className="text-[10px] text-[var(--text-muted)]">
                    Tip: Try roles like "Junior Web Developer", "IT Store Assistant", or "Matriculant Office Clerk".
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Difficulty Level
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['easy', 'medium', 'hard'] as const).map((diff) => (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => setAiCvDifficulty(diff)}
                        disabled={isAiCvGenerating}
                        className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
                          aiCvDifficulty === diff
                            ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                            : 'bg-[var(--bg-surface)] border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                        }`}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-xs text-[var(--text-muted)] space-y-1">
                  <span className="font-bold text-[var(--text-main)] block">What Gemini will generate:</span>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                    <li>Complete parsed sections (# File, # Personal Information, # Education, etc.)</li>
                    <li>3 to 7 planted mistakes (POPIA privacy, false credentials, typos, bad file format)</li>
                    <li>Pre-configured category dropdowns and explanations for immediate student preview</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAiCvModalOpen(false)}
                  disabled={isAiCvGenerating}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleGenerateAiCv}
                  disabled={isAiCvGenerating || !aiCvRole.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 disabled:opacity-50 cursor-pointer"
                >
                  {isAiCvGenerating ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Drafting with Gemini...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>Generate Draft</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Local Feedback Toast */}
      <AnimatePresence>
        {localFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-6 right-6 z-[140] bg-emerald-600 text-white px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider shadow-xl flex items-center gap-2"
          >
            <Check size={16} />
            {localFeedback}
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEADERBOARDS SECTION (Existing Arcade Leaderboards) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Match the Trio Leaderboard */}
        <div className="bg-[var(--bg-card)] p-6 md:p-10 rounded-[2rem] border border-[var(--border-color)] shadow-sm">
          <h3 className="text-2xl font-black uppercase tracking-tighter mb-6 flex items-center gap-3 text-[var(--text-main)]">
            <Gamepad2 size={24} className="text-emerald-500" />
            Match the Trio <span className="text-emerald-500">Top 5</span>
          </h3>
          <div className="space-y-3">
            {filteredTrio
              .filter(l => l.time > 0)
              .sort((a, b) => a.time - b.time)
              .slice(0, 5)
              .map((entry, i) => (
                <div key={entry.id} className="flex items-center justify-between bg-[var(--bg-surface)] p-4 rounded-xl border border-[var(--border-color)]">
                  <div className="flex items-center gap-4">
                    <span className="text-[var(--text-muted)] font-black italic">#0{i+1}</span>
                    <span className="font-bold text-sm uppercase tracking-tight text-[var(--text-main)]">{entry.username}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-black text-emerald-500 text-sm">{entry.time}s</span>
                    <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">{entry.turns} turns</span>
                  </div>
                </div>
              ))}
            {filteredTrio.length === 0 && (
              <p className="text-[var(--text-muted)] italic text-sm">No scores yet for {courseConfig.shortLabel}.</p>
            )}
          </div>
        </div>

        {/* Subnet Speed-Run Leaderboard */}
        <div className="bg-[var(--bg-card)] p-6 md:p-10 rounded-[2rem] border border-[var(--border-color)] shadow-sm">
          <h3 className="text-2xl font-black uppercase tracking-tighter mb-6 flex items-center gap-3 text-[var(--text-main)]">
            <Gamepad2 size={24} className="text-blue-500" />
            Subnet Speed-Run <span className="text-blue-500">Top 5</span>
          </h3>
          <div className="space-y-3">
            {filteredLeaderboard
              .filter(l => l.gameId === 'subnet-speed-run' && l.score > 0)
              .sort((a, b) => b.score - a.score)
              .slice(0, 5)
              .map((entry, i) => (
                <div key={entry.id} className="flex items-center justify-between bg-[var(--bg-surface)] p-4 rounded-xl border border-[var(--border-color)]">
                  <div className="flex items-center gap-4">
                    <span className="text-[var(--text-muted)] font-black italic">#0{i+1}</span>
                    <span className="font-bold text-sm uppercase tracking-tight text-[var(--text-main)]">{entry.username}</span>
                  </div>
                  <span className="font-black text-blue-500 text-sm">{entry.score} Streak</span>
                </div>
              ))}
            {filteredLeaderboard.filter(l => l.gameId === 'subnet-speed-run').length === 0 && (
              <p className="text-[var(--text-muted)] italic text-sm">No scores yet for {courseConfig.shortLabel}.</p>
            )}
          </div>
        </div>

        {/* CLI Challenge Leaderboard */}
        <div className="bg-[var(--bg-card)] p-6 md:p-10 rounded-[2rem] border border-[var(--border-color)] shadow-sm">
          <h3 className="text-2xl font-black uppercase tracking-tighter mb-6 flex items-center gap-3 text-[var(--text-main)]">
            <Gamepad2 size={24} className="text-amber-500" />
            CLI Challenge <span className="text-amber-500">Top 5</span>
          </h3>
          <div className="space-y-3">
            {filteredCli
              .filter(l => l.streak > 0)
              .sort((a, b) => b.streak - a.streak)
              .slice(0, 5)
              .map((entry, i) => (
                <div key={entry.id} className="flex items-center justify-between bg-[var(--bg-surface)] p-4 rounded-xl border border-[var(--border-color)]">
                  <div className="flex items-center gap-4">
                    <span className="text-[var(--text-muted)] font-black italic">#0{i+1}</span>
                    <span className="font-bold text-sm uppercase tracking-tight text-[var(--text-main)]">{entry.username}</span>
                  </div>
                  <span className="font-black text-amber-500 text-sm">{entry.streak} Streak</span>
                </div>
              ))}
            {filteredCli.length === 0 && (
              <p className="text-[var(--text-muted)] italic text-sm">No scores yet for {courseConfig.shortLabel}.</p>
            )}
          </div>
        </div>

        {/* CV Clinic Leaderboard */}
        <div className="bg-[var(--bg-card)] p-6 md:p-10 rounded-[2rem] border border-[var(--border-color)] shadow-sm">
          <h3 className="text-2xl font-black uppercase tracking-tighter mb-6 flex items-center gap-3 text-[var(--text-main)]">
            <FileCheck size={24} className="text-emerald-500" />
            CV Clinic <span className="text-emerald-500">Top 5</span>
          </h3>
          <div className="space-y-3">
            {filterByCourse(cvLeaderboard, course)
              .sort((a, b) => b.score - a.score)
              .slice(0, 5)
              .map((entry, i) => (
                <div key={entry.id || i} className="flex items-center justify-between bg-[var(--bg-surface)] p-4 rounded-xl border border-[var(--border-color)]">
                  <div className="flex items-center gap-4">
                    <span className="text-[var(--text-muted)] font-black italic">#0{i+1}</span>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm uppercase tracking-tight text-[var(--text-main)]">{entry.username}</span>
                      <span className="text-[10px] text-[var(--text-muted)]">{entry.caseTitle}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-black text-emerald-500 text-sm">{entry.score} pts</span>
                    <span className="text-[10px] text-amber-400 font-bold tracking-widest">
                      {'⭐'.repeat(entry.stars || 1)}
                    </span>
                  </div>
                </div>
              ))}
            {filterByCourse(cvLeaderboard, course).length === 0 && (
              <p className="text-[var(--text-muted)] italic text-sm">No scores yet for {courseConfig.shortLabel}.</p>
            )}
          </div>
        </div>

        {/* Contract Red Flags Leaderboard */}
        <div className="bg-[var(--bg-card)] p-6 md:p-10 rounded-[2rem] border border-[var(--border-color)] shadow-sm">
          <h3 className="text-2xl font-black uppercase tracking-tighter mb-6 flex items-center gap-3 text-[var(--text-main)]">
            <Scale size={24} className="text-rose-500" />
            Contract Red Flags <span className="text-rose-500">Top 5</span>
          </h3>
          <div className="space-y-3">
            {filterByCourse(contractLeaderboard, course)
              .sort((a, b) => b.score - a.score)
              .slice(0, 5)
              .map((entry, i) => (
                <div key={entry.id || i} className="flex items-center justify-between bg-[var(--bg-surface)] p-4 rounded-xl border border-[var(--border-color)]">
                  <div className="flex items-center gap-4">
                    <span className="text-[var(--text-muted)] font-black italic">#0{i+1}</span>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm uppercase tracking-tight text-[var(--text-main)]">{entry.username}</span>
                      <span className="text-[10px] text-[var(--text-muted)]">{entry.caseTitle}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-black text-rose-500 text-sm">{entry.score} pts</span>
                    <span className="text-[10px] text-amber-400 font-bold tracking-widest">
                      {'⭐'.repeat(entry.stars || 1)}
                    </span>
                  </div>
                </div>
              ))}
            {filterByCourse(contractLeaderboard, course).length === 0 && (
              <p className="text-[var(--text-muted)] italic text-sm">No scores yet for {courseConfig.shortLabel}.</p>
            )}
          </div>
        </div>


        {/* Most Active Players */}
        <div className="bg-[var(--bg-card)] p-6 md:p-10 rounded-[2rem] border border-[var(--border-color)] shadow-sm">
          <h3 className="text-2xl font-black uppercase tracking-tighter mb-6 text-[var(--text-main)]">
            Most <span style={{ color: courseConfig.accentHex }}>Active {courseConfig.shortLabel} Players</span>
          </h3>
          <div className="space-y-3">
            {Object.entries(
              filteredLeaderboard.reduce((acc, entry) => {
                acc[entry.username] = (acc[entry.username] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            )
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([username, count], i) => (
                <div key={`${username}-${i}`} className="flex items-center justify-between bg-[var(--bg-surface)] p-4 rounded-xl border border-[var(--border-color)]">
                  <div className="flex items-center gap-4">
                    <span className="text-[var(--text-muted)] font-black italic">#0{i+1}</span>
                    <span className="font-bold text-sm uppercase tracking-tight text-[var(--text-main)]">{username}</span>
                  </div>
                  <span className="font-black text-[var(--text-muted)] text-sm">{count} Games Played</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminArcadeTab;
