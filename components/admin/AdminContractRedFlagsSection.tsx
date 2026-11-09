import React, { useState, useEffect } from 'react';
import { 
  ContractCase, ContractClause, ContractRequiredItemKey, ContractFlagCategory, 
  ContractVerdict, ReferenceFigures, CourseId, ContractLeaderboard 
} from '../../types';
import { getCourseConfig } from '../../courseConfig';
import { db, auth, handleFirestoreError, OperationType } from '../../firebase';
import { 
  collection, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp, query, where 
} from 'firebase/firestore';
import { 
  Scale, Plus, Edit3, Copy, Trash2, CheckCircle2, 
  AlertTriangle, Clock, FileText, ChevronRight, Check, X,
  Sparkles, BookOpen, FileWarning, ShieldAlert, CheckSquare, 
  Square, DollarSign, AlertOctagon, HelpCircle, Save, Settings,
  Loader2, Wand2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ContractPaper } from '../minigames/ContractPaper';
import { 
  CONTRACT_REQUIRED_ITEMS, CONTRACT_FLAG_CATEGORIES, subscribeReferenceFigures,
  saveReferenceFigures, DEFAULT_REFERENCE_FIGURES, replaceFiguresPlaceholders 
} from '../../referenceFiguresService';
import { generateAiContractCase } from '../../aiAdminService';

interface AdminContractRedFlagsSectionProps {
  course?: CourseId;
  showFeedback: (msg: string) => void;
}

const SAMPLE_CONTRACT_TEXT = `# 1. Parties and Job Title
The Employer agrees to appoint the Employee as Junior IT Support Technician.
The Employee agrees to perform all duties assigned by the director from time to time without limitation.

# 2. Remuneration & Deductions
The Employee shall be paid a monthly gross salary of R3,500 payable on or before the last business day of each month.
The Employer shall deduct R500 monthly for training materials and mandatory equipment maintenance.

# 3. Working Hours & Overtime
Normal working hours shall be Monday to Friday from 08h00 to 17h00.
The Employee agrees to work up to 15 hours of mandatory unpaid overtime per week as operational requirements dictate.

# 4. Leave Entitlements
The Employee is entitled to 15 working days annual leave per completed year of service.
Paid sick leave shall only be granted after completion of 24 months continuous employment.

# 5. Probation & Termination
Probation shall endure for an initial period of 12 months, during which the Employer may terminate employment on 24 hours notice.
The Employee agrees to sign blank wage slips in advance upon commencement.`;

export const AdminContractRedFlagsSection: React.FC<AdminContractRedFlagsSectionProps> = ({
  course = 'matric-to-money',
  showFeedback
}) => {
  const courseConfig = getCourseConfig(course);

  // Cases state
  const [cases, setCases] = useState<ContractCase[]>([]);
  const [loadingCases, setLoadingCases] = useState(true);
  const [courseFilter, setCourseFilter] = useState<'all' | CourseId>('all');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingCaseId, setEditingCaseId] = useState<string | null>(null);
  const [activeEditorTab, setActiveEditorTab] = useState<'editor' | 'preview'>('editor');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Reference figures state
  const [figures, setFigures] = useState<ReferenceFigures | null>(null);
  const [isFiguresOpen, setIsFiguresOpen] = useState(false);
  const [minWageInput, setMinWageInput] = useState<number>(DEFAULT_REFERENCE_FIGURES.minimumWageHourly);
  const [minWageFromInput, setMinWageFromInput] = useState<string>(DEFAULT_REFERENCE_FIGURES.minimumWageFrom);
  const [uifRateInput, setUifRateInput] = useState<number>(DEFAULT_REFERENCE_FIGURES.uifRatePercent);
  const [checkedOnInput, setCheckedOnInput] = useState<string>(DEFAULT_REFERENCE_FIGURES.checkedOn);
  const [sourceInput, setSourceInput] = useState<string>(DEFAULT_REFERENCE_FIGURES.source);
  const [savingFigures, setSavingFigures] = useState(false);

  // Editor form state
  const [title, setTitle] = useState('');
  const [brief, setBrief] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [timeLimitSeconds, setTimeLimitSeconds] = useState(90);
  const [caseCourse, setCaseCourse] = useState<CourseId>('matric-to-money');
  const [rawText, setRawText] = useState('');
  const [clauses, setClauses] = useState<ContractClause[]>([]);
  const [missingItems, setMissingItems] = useState<ContractRequiredItemKey[]>([]);
  const [correctVerdict, setCorrectVerdict] = useState<ContractVerdict>('dont-sign');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [saving, setSaving] = useState(false);

  // Contract Leaderboard Top 5
  const [leaderboard, setLeaderboard] = useState<ContractLeaderboard[]>([]);

  // AI Generator Modal state
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState('Entry-Level IT Support Technician');
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleGenerateAiCase = async () => {
    setIsAiGenerating(true);
    setAiError(null);
    try {
      const generated = await generateAiContractCase({
        difficulty: aiDifficulty,
        topic: aiTopic,
        minWage: figures?.minimumWageHourly ?? DEFAULT_REFERENCE_FIGURES.minimumWageHourly,
      });

      setEditingCaseId(null);
      setCaseCourse('matric-to-money');
      setTitle((generated.title || 'Draft Contract Case').slice(0, 80));
      setBrief((generated.brief || '').slice(0, 200));
      setDifficulty(generated.difficulty || aiDifficulty);
      setTimeLimitSeconds(generated.timeLimitSeconds || 90);
      setClauses(generated.clauses || []);
      setMissingItems(generated.missingItems || []);
      setCorrectVerdict(generated.correctVerdict || 'dont-sign');
      setStatus('draft');

      // Reconstruct raw text so rawText box and parser remain synchronized
      const reconstructedText = (generated.clauses || []).map(c => {
        return c.heading ? `# ${c.heading}\n${c.text}` : c.text;
      }).join('\n\n');
      setRawText(reconstructedText);

      setIsAiModalOpen(false);
      setIsEditorOpen(true);
      setActiveEditorTab('editor');
      showFeedback('AI generated draft contract case loaded into editor!');
    } catch (err: any) {
      setAiError(err?.message || 'Failed to generate contract case');
    } finally {
      setIsAiGenerating(false);
    }
  };

  // 1. Subscribe to contract_cases
  useEffect(() => {
    setLoadingCases(true);
    const unsubscribe = onSnapshot(
      collection(db, 'contract_cases'),
      (snapshot) => {
        const docs = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as ContractCase));
        setCases(docs);
        setLoadingCases(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'contract_cases');
        setLoadingCases(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // 2. Subscribe to reference figures
  useEffect(() => {
    const unsubscribe = subscribeReferenceFigures((loaded) => {
      setFigures(loaded);
      if (loaded) {
        setMinWageInput(loaded.minimumWageHourly);
        setMinWageFromInput(loaded.minimumWageFrom);
        setUifRateInput(loaded.uifRatePercent);
        setCheckedOnInput(loaded.checkedOn);
        setSourceInput(loaded.source);
      }
    });
    return () => unsubscribe();
  }, []);

  // 3. Subscribe to contract_leaderboard
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'contract_leaderboard'),
      (snapshot) => {
        const docs = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as ContractLeaderboard));
        setLeaderboard(docs);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'contract_leaderboard');
      }
    );
    return () => unsubscribe();
  }, []);

  // Save Reference Figures
  const handleSaveFigures = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingFigures(true);
    try {
      const payload: ReferenceFigures = {
        minimumWageHourly: Number(minWageInput) || DEFAULT_REFERENCE_FIGURES.minimumWageHourly,
        minimumWageFrom: minWageFromInput.trim() || DEFAULT_REFERENCE_FIGURES.minimumWageFrom,
        uifRatePercent: Number(uifRateInput) || DEFAULT_REFERENCE_FIGURES.uifRatePercent,
        checkedOn: checkedOnInput.trim() || DEFAULT_REFERENCE_FIGURES.checkedOn,
        source: sourceInput.trim() || DEFAULT_REFERENCE_FIGURES.source
      };
      await saveReferenceFigures(payload);
      showFeedback('Reference statutory figures saved successfully!');
      setIsFiguresOpen(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'reference_figures/main');
    } finally {
      setSavingFigures(false);
    }
  };

  // Move a case to another course
  const handleChangeCaseCourse = async (c: ContractCase, newCourse: CourseId) => {
    if (!c.id) return;
    try {
      await setDoc(doc(db, 'contract_cases', c.id), { course: newCourse }, { merge: true });
      showFeedback(`Case "${c.title}" moved to ${newCourse === 'matric-to-money' ? 'Matric to Money' : newCourse}!`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'contract_cases');
    }
  };

  // Move all non-matric cases to matric-to-money
  const handleMoveAllToMatric = async () => {
    const nonMatric = cases.filter(c => c.course !== 'matric-to-money');
    try {
      for (const c of nonMatric) {
        if (c.id) {
          await setDoc(doc(db, 'contract_cases', c.id), { course: 'matric-to-money' }, { merge: true });
        }
      }
      showFeedback(`Successfully moved ${nonMatric.length} case(s) to Matric to Money!`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'contract_cases');
    }
  };

  // Toggle status
  const handleToggleStatus = async (c: ContractCase) => {
    if (!c.id) return;
    try {
      const nextStatus = c.status === 'published' ? 'draft' : 'published';
      await setDoc(doc(db, 'contract_cases', c.id), { status: nextStatus }, { merge: true });
      showFeedback(`Contract case status changed to ${nextStatus}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'contract_cases');
    }
  };

  // Duplicate case
  const handleDuplicateCase = async (c: ContractCase) => {
    try {
      const newDocId = `contract_${Date.now()}`;
      const duplicated: ContractCase = {
        ...c,
        title: `Copy of ${c.title}`.slice(0, 80),
        status: 'draft',
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser?.email || auth.currentUser?.uid || 'admin'
      };
      await setDoc(doc(db, 'contract_cases', newDocId), duplicated);
      showFeedback(`Case duplicated as draft: "${duplicated.title}"`);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'contract_cases');
    }
  };

  // Delete case
  const handleDeleteCase = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'contract_cases', id));
      showFeedback('Contract case deleted successfully.');
      setConfirmDeleteId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `contract_cases/${id}`);
    }
  };

  // Parse raw text into clauses
  const parseRawContractText = (textToParse: string) => {
    const lines = textToParse.split('\n').map(l => l.trim()).filter(Boolean);
    const parsed: ContractClause[] = [];
    let currentHeading = '';

    lines.forEach((line, idx) => {
      if (line.startsWith('#')) {
        currentHeading = line.replace(/^#+\s*/, '').trim().slice(0, 60);
      } else {
        parsed.push({
          id: `clause_${Date.now()}_${idx}`,
          heading: currentHeading || undefined,
          text: line.slice(0, 300)
        });
      }
    });

    setClauses(parsed);
    showFeedback(`Parsed ${parsed.length} clauses from text.`);
  };

  // Open editor for new case
  const handleAddNew = () => {
    setEditingCaseId(null);
    setTitle('');
    setBrief('');
    setDifficulty('medium');
    setTimeLimitSeconds(90);
    setCaseCourse('matric-to-money');
    setRawText(SAMPLE_CONTRACT_TEXT);
    setMissingItems(['uif']);
    setCorrectVerdict('dont-sign');
    setStatus('draft');
    parseRawContractText(SAMPLE_CONTRACT_TEXT);
    setActiveEditorTab('editor');
    setIsEditorOpen(true);
  };

  // Open editor for existing case
  const handleEditCase = (c: ContractCase) => {
    setEditingCaseId(c.id || null);
    setTitle(c.title || '');
    setBrief(c.brief || '');
    setDifficulty(c.difficulty || 'medium');
    setTimeLimitSeconds(c.timeLimitSeconds || 90);
    setCaseCourse(c.course || 'matric-to-money');
    setClauses(c.clauses || []);
    setMissingItems(c.missingItems || []);
    setCorrectVerdict(c.correctVerdict || 'dont-sign');
    setStatus(c.status || 'draft');

    // Reconstruct raw text
    const textLines: string[] = [];
    let lastHeading = '';
    (c.clauses || []).forEach(cl => {
      if (cl.heading && cl.heading !== lastHeading) {
        textLines.push(`\n# ${cl.heading}`);
        lastHeading = cl.heading;
      }
      textLines.push(cl.text);
    });
    setRawText(textLines.join('\n').trim());
    setActiveEditorTab('editor');
    setIsEditorOpen(true);
  };

  // Toggle clause red flag
  const handleToggleClauseFlag = (idx: number) => {
    setClauses(prev => {
      const next = [...prev];
      const target = { ...next[idx] };
      if (target.flag) {
        delete target.flag;
      } else {
        target.flag = { category: 'pay', reason: '' };
      }
      next[idx] = target;
      return next;
    });
  };

  // Update clause red flag field
  const handleUpdateClauseFlag = (idx: number, field: 'category' | 'reason', val: string) => {
    setClauses(prev => {
      const next = [...prev];
      const target = { ...next[idx] };
      if (!target.flag) {
        target.flag = { category: 'pay', reason: '' };
      }
      if (field === 'category') {
        target.flag = { ...target.flag, category: val as ContractFlagCategory };
      } else {
        target.flag = { ...target.flag, reason: val.slice(0, 200) };
      }
      next[idx] = target;
      return next;
    });
  };

  // Toggle missing items
  const handleToggleMissingItem = (key: ContractRequiredItemKey) => {
    setMissingItems(prev => {
      if (prev.includes(key)) {
        return prev.filter(k => k !== key);
      }
      if (prev.length >= 5) {
        showFeedback('At most 5 missing items allowed per case.');
        return prev;
      }
      return [...prev, key];
    });
  };

  // Validation
  const flagCount = clauses.filter(c => Boolean(c.flag)).length;
  const validationErrors: string[] = [];
  if (!title.trim()) validationErrors.push('Title is required (max 80 chars).');
  if (title.length > 80) validationErrors.push('Title must be at most 80 characters.');
  if (brief.length > 200) validationErrors.push('Brief must be at most 200 characters.');
  if (clauses.length < 8) validationErrors.push(`At least 8 clauses are required (currently ${clauses.length}).`);
  if (clauses.length > 25) validationErrors.push(`At most 25 clauses allowed (currently ${clauses.length}).`);
  if (flagCount < 2 || flagCount > 8) {
    validationErrors.push(`Must have between 2 and 8 red flag clauses (currently ${flagCount}).`);
  }
  if (missingItems.length > 5) {
    validationErrors.push(`At most 5 missing items allowed (currently ${missingItems.length}).`);
  }
  const emptyReasons = clauses.filter(c => c.flag && !c.flag.reason.trim());
  if (emptyReasons.length > 0) {
    validationErrors.push('All red flag clauses must have an explanation reason.');
  }

  // Conflict warning: missing item category matches flagged clause category
  const conflictWarnings = missingItems.filter(m => 
    clauses.some(c => c.flag?.category === m)
  );

  const isValidToSave = validationErrors.length === 0;

  // Save case
  const handleSaveCase = async (targetStatus?: 'draft' | 'published') => {
    if (!isValidToSave && targetStatus === 'published') return;
    setSaving(true);
    try {
      const finalStatus = targetStatus || status;
      const caseDocId = editingCaseId || `contract_${Date.now()}`;
      const payload: ContractCase = {
        course: caseCourse,
        title: title.trim().slice(0, 80),
        brief: brief.trim().slice(0, 200),
        difficulty,
        timeLimitSeconds: Number(timeLimitSeconds) || 90,
        clauses,
        missingItems,
        correctVerdict,
        status: finalStatus,
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser?.email || auth.currentUser?.uid || 'admin'
      };

      await setDoc(doc(db, 'contract_cases', caseDocId), payload, { merge: true });
      showFeedback(`Contract case saved as ${finalStatus}!`);
      setIsEditorOpen(false);
    } catch (err) {
      handleFirestoreError(err, editingCaseId ? OperationType.UPDATE : OperationType.CREATE, 'contract_cases');
    } finally {
      setSaving(false);
    }
  };

  const displayedCases = courseFilter === 'all'
    ? cases
    : cases.filter(c => (c.course || 'matric-to-money') === courseFilter);

  const matricCasesCount = cases.filter(c => !c.course || c.course === 'matric-to-money').length;
  const aPlusCasesCount = cases.filter(c => c.course === 'a-plus').length;

  return (
    <div className="space-y-10">
      {/* SECTION: REFERENCE FIGURES ACCORDION / CARD */}
      <div className="bg-[var(--bg-card)] p-6 md:p-8 rounded-[2rem] border border-[var(--border-color)] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Scale size={24} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xl font-black uppercase tracking-tight text-[var(--text-main)]">
                  Statutory Reference Figures
                </h4>
                {figures ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Active
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Using Fallback Defaults
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--text-muted)] font-medium">
                Official labour figures automatically injected into case tips and student guidance via placeholders.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsFiguresOpen(!isFiguresOpen)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs bg-[var(--bg-surface)] hover:bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] transition-colors cursor-pointer"
          >
            <Settings size={14} />
            <span>{isFiguresOpen ? 'Close Settings' : 'Edit Figures'}</span>
          </button>
        </div>

        {/* Current Figures Quick Preview Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)]">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Minimum Wage</div>
            <div className="text-base font-black font-mono text-emerald-400 mt-0.5">
              R{(figures?.minimumWageHourly ?? DEFAULT_REFERENCE_FIGURES.minimumWageHourly).toFixed(2)}/hr
            </div>
            <div className="text-[10px] text-[var(--text-muted)]">from {figures?.minimumWageFrom ?? DEFAULT_REFERENCE_FIGURES.minimumWageFrom}</div>
          </div>

          <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)]">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">UIF Rate</div>
            <div className="text-base font-black font-mono text-indigo-400 mt-0.5">
              {(figures?.uifRatePercent ?? DEFAULT_REFERENCE_FIGURES.uifRatePercent)}%
            </div>
            <div className="text-[10px] text-[var(--text-muted)]">Employee contribution</div>
          </div>

          <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)]">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Checked On</div>
            <div className="text-base font-black font-mono text-[var(--text-main)] mt-0.5">
              {figures?.checkedOn ?? DEFAULT_REFERENCE_FIGURES.checkedOn}
            </div>
            <div className="text-[10px] text-[var(--text-muted)]">Gazette status</div>
          </div>

          <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)]">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Source</div>
            <div className="text-base font-black font-mono text-cyan-400 mt-0.5 truncate">
              {figures?.source ?? DEFAULT_REFERENCE_FIGURES.source}
            </div>
            <div className="text-[10px] text-[var(--text-muted)]">Official portal</div>
          </div>
        </div>

        {/* Editable Figures Drawer */}
        <AnimatePresence>
          {isFiguresOpen && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleSaveFigures}
              className="pt-4 border-t border-[var(--border-color)] space-y-4 overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label htmlFor="min-wage-hourly" className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Minimum Wage Hourly (Rand) *
                  </label>
                  <input
                    id="min-wage-hourly"
                    type="number"
                    step="0.01"
                    min="0"
                    value={minWageInput}
                    onChange={(e) => setMinWageInput(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-sm font-mono font-bold text-[var(--text-main)]"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="min-wage-from" className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Effective From Date *
                  </label>
                  <input
                    id="min-wage-from"
                    type="text"
                    value={minWageFromInput}
                    onChange={(e) => setMinWageFromInput(e.target.value)}
                    placeholder="e.g. 1 March 2026"
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-sm font-bold text-[var(--text-main)]"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="uif-rate" className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    UIF Rate Percent (%) *
                  </label>
                  <input
                    id="uif-rate"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={uifRateInput}
                    onChange={(e) => setUifRateInput(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-sm font-mono font-bold text-[var(--text-main)]"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="checked-on" className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Last Checked On *
                  </label>
                  <input
                    id="checked-on"
                    type="text"
                    value={checkedOnInput}
                    onChange={(e) => setCheckedOnInput(e.target.value)}
                    placeholder="e.g. October 2026"
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-sm font-bold text-[var(--text-main)]"
                    required
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label htmlFor="source-url" className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Official Reference Source *
                  </label>
                  <input
                    id="source-url"
                    type="text"
                    value={sourceInput}
                    onChange={(e) => setSourceInput(e.target.value)}
                    placeholder="e.g. labour.gov.za"
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-sm font-bold text-[var(--text-main)]"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFiguresOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingFigures}
                  className="px-5 py-2 rounded-xl font-bold uppercase tracking-wider text-xs bg-amber-500 hover:bg-amber-400 text-black flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Save size={14} />
                  <span>{savingFigures ? 'Saving...' : 'Save Figures'}</span>
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      {/* SECTION: CONTRACT RED FLAGS CASES */}
      <div className="bg-[var(--bg-card)] p-6 md:p-10 rounded-[2rem] border border-[var(--border-color)] shadow-sm space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border-color)]">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
                <FileWarning size={26} />
              </span>
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tight text-[var(--text-main)]">
                  Contract Red Flags Cases
                </h3>
                <p className="text-xs text-[var(--text-muted)] font-medium">
                  Author real-world mock employment contracts for {courseConfig.name} (Module 5)
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setAiError(null);
                setIsAiModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl font-black uppercase tracking-wider text-xs bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white shadow-lg shadow-rose-950/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Sparkles size={16} />
              AI Draft Case
            </button>

            <button
              type="button"
              onClick={handleAddNew}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-black uppercase tracking-wider text-xs bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Plus size={16} />
              Create Contract Case
            </button>
          </div>
        </div>

        {/* Filter Bar */}
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
                  ? 'bg-rose-600 text-white shadow'
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
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              Matric to Money ({matricCasesCount})
            </button>
            <button
              type="button"
              onClick={() => setCourseFilter('a-plus')}
              className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                courseFilter === 'a-plus'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              CompTIA A+ ({aPlusCasesCount})
            </button>
          </div>

          {cases.some(c => c.course === 'a-plus') && (
            <button
              type="button"
              onClick={handleMoveAllToMatric}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles size={13} />
              <span>Move A+ contracts to Matric to Money</span>
            </button>
          )}
        </div>

        {/* Notice if cases are assigned to A+ */}
        {cases.some(c => c.course === 'a-plus' && c.status === 'published') && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4 text-xs text-amber-300">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="shrink-0 text-amber-400" />
              <span>
                <strong>Notice:</strong> You have published contract cases tagged as <em>CompTIA A+</em>. To show them on the <strong>Matric to Money</strong> arcade row, click below.
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
            Loading Contract Red Flags cases...
          </div>
        ) : displayedCases.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-[var(--border-color)] bg-[var(--bg-surface)]">
            <BookOpen size={40} className="mx-auto text-[var(--text-muted)] mb-3 opacity-60" />
            <h4 className="text-base font-bold text-[var(--text-main)] mb-1">No Contract Cases Found</h4>
            <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto mb-5">
              Create your first employment agreement case. Students will scan for red flags, spot missing statutory terms, and render a verdict!
            </p>
            <button
              type="button"
              onClick={handleAddNew}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-rose-600 text-white hover:bg-rose-500 transition-colors cursor-pointer"
            >
              <Plus size={14} /> Add First Contract Case
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {displayedCases.map((c) => {
              const totalClauses = c.clauses?.length || 0;
              const flags = (c.clauses || []).filter(cl => Boolean(cl.flag)).length;
              const missingCount = c.missingItems?.length || 0;
              const isMatric = !c.course || c.course === 'matric-to-money';

              return (
                <div 
                  key={c.id}
                  className="bg-[var(--bg-surface)] rounded-2xl p-5 border border-[var(--border-color)] flex flex-col justify-between hover:border-rose-500/40 transition-colors shadow-sm"
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
                        <Clock size={12} /> {c.timeLimitSeconds}s scan
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

                    {/* Verdict & Metrics row */}
                    <div className="space-y-2 pt-2 border-t border-[var(--border-color)] text-xs text-[var(--text-muted)]">
                      <div className="flex items-center justify-between">
                        <span>Correct Verdict:</span>
                        <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${
                          c.correctVerdict === 'sign'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : c.correctVerdict === 'ask-first'
                            ? 'bg-amber-500/15 text-amber-400'
                            : 'bg-rose-500/15 text-rose-400'
                        }`}>
                          {c.correctVerdict === 'sign' ? 'Sign it' : c.correctVerdict === 'ask-first' ? 'Ask first' : "Don't sign"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--border-color)] font-medium capitalize">
                          {c.difficulty}
                        </span>
                        <span>•</span>
                        <span>{totalClauses} clauses</span>
                        <span>•</span>
                        <span className="text-rose-500 font-bold">{flags} flags</span>
                        <span>•</span>
                        <span className="text-amber-400 font-bold">{missingCount} missing</span>
                      </div>
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
                          className="p-2 rounded-lg text-[var(--text-muted)] hover:text-rose-500 hover:bg-[var(--bg-card)] transition-colors cursor-pointer"
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

      {/* CONFIRM DELETE MODAL */}
      <AnimatePresence>
        {confirmDeleteId && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 max-w-sm w-full space-y-4 text-center shadow-2xl"
            >
              <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
                <Trash2 size={24} />
              </div>
              <h4 className="text-lg font-black text-[var(--text-main)] uppercase tracking-tight">
                Delete Contract Case?
              </h4>
              <p className="text-xs text-[var(--text-muted)]">
                This action cannot be undone. Students will no longer see or play this contract case.
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-[var(--bg-surface)] hover:bg-[var(--bg-card)] border border-[var(--border-color)]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteCase(confirmDeleteId)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                  <span className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                    <FileWarning size={22} />
                  </span>
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight text-[var(--text-main)]">
                      {editingCaseId ? 'Edit Contract Red Flags Case' : 'New Contract Red Flags Case'}
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
                          ? 'bg-rose-600 text-white shadow'
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
                          ? 'bg-rose-600 text-white shadow'
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

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-8 flex-1">
                {activeEditorTab === 'editor' ? (
                  <div className="space-y-8">
                    {/* Top Case Parameters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Assigned Course */}
                      <div className="space-y-1.5 md:col-span-2">
                        <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                          <label htmlFor="contract-case-course">Assigned Course *</label>
                          <span className="text-[10px] font-bold text-emerald-400">
                            Featured on this course's arcade row
                          </span>
                        </div>
                        <select
                          id="contract-case-course"
                          value={caseCourse}
                          onChange={(e) => setCaseCourse(e.target.value as CourseId)}
                          className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] text-sm font-bold focus:outline-none focus:border-rose-500"
                        >
                          <option value="matric-to-money">Matric to Money (Free Course - Recommended)</option>
                          <option value="a-plus">CompTIA A+</option>
                          <option value="network-plus">CompTIA Network+</option>
                        </select>
                      </div>

                      {/* Title */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                          <label htmlFor="contract-title">Contract Title *</label>
                          <span className={title.length > 80 ? 'text-rose-500 font-bold' : ''}>
                            {title.length}/80
                          </span>
                        </div>
                        <input
                          id="contract-title"
                          type="text"
                          maxLength={80}
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="e.g. Junior IT Support Agreement - TechCorp"
                          className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] text-sm focus:outline-none focus:border-rose-500"
                        />
                      </div>

                      {/* Brief */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                          <label htmlFor="contract-brief">Student Brief / Scenario Hint</label>
                          <span className={brief.length > 200 ? 'text-rose-500 font-bold' : ''}>
                            {brief.length}/200
                          </span>
                        </div>
                        <input
                          id="contract-brief"
                          type="text"
                          maxLength={200}
                          value={brief}
                          onChange={(e) => setBrief(e.target.value)}
                          placeholder="e.g. Your first job offer from a small IT company in Randburg."
                          className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] text-sm focus:outline-none focus:border-rose-500"
                        />
                      </div>

                      {/* Difficulty */}
                      <div className="space-y-1.5">
                        <label htmlFor="contract-diff" className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                          Difficulty
                        </label>
                        <select
                          id="contract-diff"
                          value={difficulty}
                          onChange={(e) => setDifficulty(e.target.value as any)}
                          className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] text-sm focus:outline-none focus:border-rose-500"
                        >
                          <option value="easy">Easy (Obvious red flags & missing terms)</option>
                          <option value="medium">Medium (Standard real-world mix)</option>
                          <option value="hard">Hard (Subtle BCEA traps & fine print clauses)</option>
                        </select>
                      </div>

                      {/* Scan Timer */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                          <label htmlFor="contract-timer">Scan Timer Limit (Seconds)</label>
                          <span className="font-mono text-rose-500 font-bold">{timeLimitSeconds}s</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            id="contract-timer"
                            type="range"
                            min={45}
                            max={240}
                            step={5}
                            value={timeLimitSeconds}
                            onChange={(e) => setTimeLimitSeconds(Number(e.target.value))}
                            className="flex-1 accent-rose-500 cursor-pointer"
                          />
                          <input
                            type="number"
                            min={45}
                            max={240}
                            value={timeLimitSeconds}
                            onChange={(e) => setTimeLimitSeconds(Number(e.target.value))}
                            className="w-20 px-3 py-2 text-center rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-sm font-bold text-[var(--text-main)]"
                          />
                        </div>
                      </div>

                      {/* Correct Verdict */}
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                          Correct Verdict (Step 3) *
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                          <button
                            type="button"
                            onClick={() => setCorrectVerdict('sign')}
                            className={`py-3 px-4 rounded-xl border text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                              correctVerdict === 'sign'
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500 shadow-md'
                                : 'bg-[var(--bg-surface)] border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                            }`}
                          >
                            Sign it (Safe)
                          </button>
                          <button
                            type="button"
                            onClick={() => setCorrectVerdict('ask-first')}
                            className={`py-3 px-4 rounded-xl border text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                              correctVerdict === 'ask-first'
                                ? 'bg-amber-500/20 text-amber-400 border-amber-500 shadow-md'
                                : 'bg-[var(--bg-surface)] border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                            }`}
                          >
                            Ask first (Clarify terms)
                          </button>
                          <button
                            type="button"
                            onClick={() => setCorrectVerdict('dont-sign')}
                            className={`py-3 px-4 rounded-xl border text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                              correctVerdict === 'dont-sign'
                                ? 'bg-rose-500/20 text-rose-400 border-rose-500 shadow-md'
                                : 'bg-[var(--bg-surface)] border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                            }`}
                          >
                            Don't sign (Illegal / Predatory)
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Missing Required Items Selection (Step 2 Key) */}
                    <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-black uppercase tracking-tight text-[var(--text-main)] flex items-center gap-2">
                            <CheckSquare size={16} className="text-amber-400" />
                            Missing Required Items (Key for Step 2)
                          </h4>
                          <p className="text-xs text-[var(--text-muted)]">
                            Select which mandatory statutory terms are <strong>omitted entirely</strong> from this agreement (max 5).
                          </p>
                        </div>
                        <span className="text-xs font-bold text-amber-400">
                          {missingItems.length}/5 selected
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                        {CONTRACT_REQUIRED_ITEMS.map((item) => {
                          const isSelected = missingItems.includes(item.key);
                          return (
                            <button
                              key={item.key}
                              type="button"
                              onClick={() => handleToggleMissingItem(item.key)}
                              className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-sm'
                                  : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                              }`}
                            >
                              <span className="mt-0.5 shrink-0 text-amber-400">
                                {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                              </span>
                              <div>
                                <div className="text-xs font-bold text-[var(--text-main)]">{item.label}</div>
                                <div className="text-[10px] text-[var(--text-muted)] line-clamp-1">{item.description}</div>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Conflict Warning */}
                      {conflictWarnings.length > 0 && (
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2">
                          <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-400" />
                          <div>
                            <strong>Logical Warning:</strong> You have marked{' '}
                            <em>{conflictWarnings.join(', ')}</em> as missing, but there is also a clause flagged with that category below. In an employment contract, an item is usually either omitted OR present with an illegal clause.
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Paste Contract Box */}
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <label htmlFor="raw-contract-text" className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                            Paste Agreement Text
                          </label>
                          <span className="text-xs text-[var(--text-muted)]">
                            One clause per row. Rows starting with '#' become section headings.
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setRawText(SAMPLE_CONTRACT_TEXT);
                              parseRawContractText(SAMPLE_CONTRACT_TEXT);
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--bg-surface)] hover:bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)]"
                          >
                            Load Sample Contract
                          </button>
                          <button
                            type="button"
                            onClick={() => parseRawContractText(rawText)}
                            className="px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white"
                          >
                            Parse Text
                          </button>
                        </div>
                      </div>

                      <textarea
                        id="raw-contract-text"
                        rows={6}
                        value={rawText}
                        onChange={(e) => setRawText(e.target.value)}
                        placeholder="Paste agreement text here..."
                        className="w-full p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] text-xs font-mono focus:outline-none focus:border-rose-500"
                      />
                    </div>

                    {/* Clauses & Flag Annotator */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-black uppercase tracking-tight text-[var(--text-main)] flex items-center gap-2">
                            <AlertOctagon size={16} className="text-rose-500" />
                            Annotate Red Flag Clauses ({flagCount} Flags Planted)
                          </h4>
                          <p className="text-xs text-[var(--text-muted)]">
                            Toggle which clauses violate South African labour law (BCEA) and assign reasons.
                          </p>
                        </div>
                        <span className={`text-xs font-bold ${flagCount >= 2 && flagCount <= 8 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {flagCount}/8 flags (2-8 required)
                        </span>
                      </div>

                      <div className="space-y-3">
                        {clauses.map((clause, idx) => {
                          const isFlagged = Boolean(clause.flag);
                          return (
                            <div
                              key={clause.id}
                              className={`p-4 rounded-2xl border transition-all space-y-3 ${
                                isFlagged
                                  ? 'bg-rose-500/5 border-rose-500/50 shadow-sm'
                                  : 'bg-[var(--bg-surface)] border-[var(--border-color)]'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1 flex-1">
                                  {clause.heading && (
                                    <div className="text-[11px] font-black uppercase tracking-wider text-rose-500">
                                      {clause.heading}
                                    </div>
                                  )}
                                  <div className="text-sm text-[var(--text-main)] font-normal leading-relaxed">
                                    <span className="text-[10px] font-mono text-[var(--text-muted)] mr-2">
                                      §{idx + 1}
                                    </span>
                                    {clause.text}
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleToggleClauseFlag(idx)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                                    isFlagged
                                      ? 'bg-rose-600 text-white shadow-sm'
                                      : 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                                  }`}
                                >
                                  <FileWarning size={13} />
                                  <span>{isFlagged ? 'Red Flag' : 'Mark Flag'}</span>
                                </button>
                              </div>

                              {/* Flag Category & Reason Configuration */}
                              {isFlagged && clause.flag && (
                                <div className="pt-3 border-t border-rose-500/20 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in duration-200">
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-wider text-rose-400">
                                      Flag Category *
                                    </label>
                                    <select
                                      value={clause.flag.category}
                                      onChange={(e) => handleUpdateClauseFlag(idx, 'category', e.target.value)}
                                      className="w-full px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-rose-500/30 text-[var(--text-main)] text-xs font-bold focus:outline-none"
                                    >
                                      {CONTRACT_FLAG_CATEGORIES.map(cat => (
                                        <option key={cat.id} value={cat.id}>
                                          {cat.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  <div className="space-y-1 sm:col-span-2">
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-rose-400">
                                      <span>Reason / Explanation (shown on tap) *</span>
                                      <span className={clause.flag.reason.length > 200 ? 'text-red-500' : ''}>
                                        {clause.flag.reason.length}/200
                                      </span>
                                    </div>
                                    <input
                                      type="text"
                                      maxLength={200}
                                      value={clause.flag.reason}
                                      onChange={(e) => handleUpdateClauseFlag(idx, 'reason', e.target.value)}
                                      placeholder="e.g. Mandatory unpaid overtime violates BCEA Section 10."
                                      className="w-full px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-rose-500/30 text-[var(--text-main)] text-xs focus:outline-none"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Validation Feedback */}
                    {validationErrors.length > 0 && (
                      <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs space-y-1">
                        <div className="font-bold uppercase tracking-wider flex items-center gap-1.5">
                          <AlertTriangle size={14} /> Validation Requirements Not Met:
                        </div>
                        <ul className="list-disc list-inside space-y-0.5 pl-2 text-[11px]">
                          {validationErrors.map((err, i) => (
                            <li key={i}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Live Preview Tab */
                  <div className="space-y-4">
                    <div className="text-xs text-[var(--text-muted)] flex items-center justify-between">
                      <span>Exact representation shown to students during gameplay:</span>
                      <span className="font-mono">{clauses.length} clauses • {flagCount} red flags</span>
                    </div>
                    <ContractPaper
                      clauses={clauses}
                      title={title || 'Sample Employment Agreement'}
                      mode="preview"
                    />
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-[var(--border-color)] bg-[var(--bg-surface)] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleSaveCase('draft')}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] hover:bg-[var(--bg-surface)] cursor-pointer"
                  >
                    Save as Draft
                  </button>

                  <button
                    type="button"
                    disabled={saving || !isValidToSave}
                    onClick={() => handleSaveCase('published')}
                    className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {saving ? 'Publishing...' : 'Publish Case'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Case Generator Modal */}
      <AnimatePresence>
        {isAiModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl space-y-6 relative"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
                    <Sparkles size={20} />
                  </span>
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tight text-[var(--text-main)]">
                      AI Contract Case Drafter
                    </h3>
                    <p className="text-xs text-[var(--text-muted)]">
                      Generate a realistic employment agreement scenario with planted BCEA red flags.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(false)}
                  disabled={isAiGenerating}
                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-white hover:bg-white/10"
                >
                  <X size={18} />
                </button>
              </div>

              {aiError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 font-medium">
                  {aiError}
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Role / Company Scenario
                  </label>
                  <input
                    type="text"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    placeholder="e.g. Junior IT Support Technician at a Logistics Company"
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-sm font-bold text-[var(--text-main)] focus:outline-none focus:border-rose-500"
                    disabled={isAiGenerating}
                  />
                  <span className="text-[10px] text-[var(--text-muted)]">
                    Tip: Try roles like "Fibre Installer", "Call Centre Agent", or "Junior Helpdesk Technician".
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
                        onClick={() => setAiDifficulty(diff)}
                        disabled={isAiGenerating}
                        className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
                          aiDifficulty === diff
                            ? 'bg-rose-600 border-rose-500 text-white shadow-md'
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
                    <li>8 to 14 structured agreement clauses</li>
                    <li>2 to 5 realistic BCEA red flags (overtime, unlawful deductions, verbal promises)</li>
                    <li>Missing statutory items & recommended verdict</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(false)}
                  disabled={isAiGenerating}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleGenerateAiCase}
                  disabled={isAiGenerating || !aiTopic.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 disabled:opacity-50 cursor-pointer"
                >
                  {isAiGenerating ? (
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
    </div>
  );
};
