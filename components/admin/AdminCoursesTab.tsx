import React, { useState, useEffect } from 'react';
import { 
  CourseDoc, 
  CourseDomainItem, 
  CourseStatus, 
  Objective 
} from '../../types';
import { 
  db, 
  auth, 
  OperationType, 
  handleFirestoreError 
} from '../../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where 
} from 'firebase/firestore';
import { 
  setupBuiltInCourses,
  subscribeCourses
} from '../../coursesService';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Archive, 
  Globe, 
  EyeOff, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  ArrowUp, 
  ArrowDown, 
  Sparkles, 
  Loader2, 
  Palette, 
  Layers, 
  ShieldAlert,
  GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminCoursesTabProps {
  courses?: CourseDoc[];
  allObjectives?: Objective[];
  setAdminFeedback?: (msg: string | null) => void;
  onSelectManagingCourse?: (courseId: string) => void;
  onSelectCourse?: (courseId: string) => void;
}

// WCAG relative luminance calculation for contrast with white (#FFFFFF)
function calculateContrastWithWhite(hexColor: string): number {
  if (!/^#[0-9A-Fa-f]{6}$/.test(hexColor)) return 1.0;
  
  const r = parseInt(hexColor.slice(1, 3), 16) / 255;
  const g = parseInt(hexColor.slice(3, 5), 16) / 255;
  const b = parseInt(hexColor.slice(5, 7), 16) / 255;

  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const L = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  
  // Contrast ratio with white (luminance 1.0)
  return (1.0 + 0.05) / (L + 0.05);
}

const PRESET_ACCENTS = [
  '#dc2626', // Red (4.5:1+)
  '#b91c1c', // Darker Red
  '#2563eb', // Blue
  '#1d4ed8', // Darker Blue
  '#4f46e5', // Indigo
  '#4338ca', // Deep Indigo
  '#7c3aed', // Violet
  '#6d28d9', // Deep Violet
  '#059669', // Emerald
  '#047857', // Forest
  '#0891b2', // Cyan Dark
  '#d97706', // Amber Dark
  '#c026d3', // Fuchsia
  '#be123c', // Rose
];

export const AdminCoursesTab: React.FC<AdminCoursesTabProps> = ({
  courses: propsCourses,
  allObjectives = [],
  setAdminFeedback = () => {},
  onSelectManagingCourse,
  onSelectCourse
}) => {
  const [localCourses, setLocalCourses] = useState<CourseDoc[]>([]);

  useEffect(() => {
    if (!propsCourses) {
      const unsub = subscribeCourses((docs) => setLocalCourses(docs));
      return () => unsub();
    }
  }, [propsCourses]);

  const courses = propsCourses ?? localCourses;
  const handleSelectManaging = onSelectManagingCourse || onSelectCourse;
  const [editingCourse, setEditingCourse] = useState<Partial<CourseDoc> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteBlockReason, setDeleteBlockReason] = useState<{ courseId: string; reason: string } | null>(null);
  const [checkingDeleteId, setCheckingDeleteId] = useState<string | null>(null);

  const openNewCourseModal = () => {
    setIsNew(true);
    setFormError(null);
    setEditingCourse({
      id: '',
      name: '',
      shortLabel: '',
      description: '',
      accentColor: '#4f46e5',
      domains: [
        { id: `dom_${Date.now().toString(36)}_1`, name: 'Domain 1: Core Concepts' }
      ],
      requiresCode: true,
      status: 'draft',
      order: courses.length + 1
    });
  };

  const openEditCourseModal = (course: CourseDoc) => {
    setIsNew(false);
    setFormError(null);
    setEditingCourse({
      ...course,
      domains: course.domains ? [...course.domains] : []
    });
  };

  const handleNameChange = (name: string) => {
    if (!editingCourse) return;
    const updated: Partial<CourseDoc> = { ...editingCourse, name };
    // Auto-generate slug while creating new course
    if (isNew) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 30);
      updated.id = slug;
    }
    setEditingCourse(updated);
  };

  const handleAddDomain = () => {
    if (!editingCourse) return;
    const currentDomains = editingCourse.domains || [];
    if (currentDomains.length >= 12) {
      setFormError('Courses can have at most 12 domains.');
      return;
    }
    const newId = `dom_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    setEditingCourse({
      ...editingCourse,
      domains: [
        ...currentDomains,
        { id: newId, name: `Domain ${currentDomains.length + 1}` }
      ]
    });
  };

  const handleDomainNameChange = (index: number, newName: string) => {
    if (!editingCourse || !editingCourse.domains) return;
    const next = [...editingCourse.domains];
    next[index] = { ...next[index], name: newName };
    setEditingCourse({ ...editingCourse, domains: next });
  };

  const handleMoveDomain = (index: number, direction: 'up' | 'down') => {
    if (!editingCourse || !editingCourse.domains) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= editingCourse.domains.length) return;
    const next = [...editingCourse.domains];
    const temp = next[index];
    next[index] = next[targetIdx];
    next[targetIdx] = temp;
    setEditingCourse({ ...editingCourse, domains: next });
  };

  const handleRemoveDomain = (index: number) => {
    if (!editingCourse || !editingCourse.domains) return;
    const domainToRemove = editingCourse.domains[index];
    
    // Check if domain has objectives assigned
    if (!isNew && editingCourse.id && domainToRemove) {
      const assignedCount = allObjectives.filter(o => 
        (o.course === editingCourse.id || (!o.course && editingCourse.id === 'a-plus')) &&
        (o.domain === domainToRemove.name || o.domain === domainToRemove.id)
      ).length;

      if (assignedCount > 0) {
        setFormError(`Cannot remove domain "${domainToRemove.name}": ${assignedCount} objective(s) are currently assigned to it. Reassign or delete those objectives first.`);
        return;
      }
    }

    if (editingCourse.domains.length <= 1) {
      setFormError('A course must have at least 1 domain.');
      return;
    }

    const next = editingCourse.domains.filter((_, i) => i !== index);
    setEditingCourse({ ...editingCourse, domains: next });
    setFormError(null);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;

    setFormError(null);

    const id = (editingCourse.id || '').trim().toLowerCase();
    const name = (editingCourse.name || '').trim();
    const shortLabel = (editingCourse.shortLabel || '').trim();
    const description = (editingCourse.description || '').trim();
    const accentColor = (editingCourse.accentColor || '').trim();
    const domains = editingCourse.domains || [];

    // Validations
    if (!/^[a-z0-9-]{3,30}$/.test(id)) {
      setFormError('Course ID must be 3-30 lowercase alphanumeric characters and hyphens only (e.g. "security-plus").');
      return;
    }

    if (name.length < 2 || name.length > 60) {
      setFormError('Course name must be between 2 and 60 characters.');
      return;
    }

    if (!shortLabel || shortLabel.length > 20) {
      setFormError('Short label is required (e.g. "Sec+") and must be under 20 characters.');
      return;
    }

    if (!/^#[0-9A-Fa-f]{6}$/.test(accentColor)) {
      setFormError('Accent color must be a valid 6-character hex code (e.g. #4f46e5).');
      return;
    }

    // Contrast Check: Must have at least 4.5:1 contrast against white text
    const contrastRatio = calculateContrastWithWhite(accentColor);
    if (contrastRatio < 4.5) {
      setFormError(`Accent color ${accentColor} has a contrast ratio of ${contrastRatio.toFixed(2)}:1 with white text. WCAG AA requires at least 4.5:1. Please pick a darker shade.`);
      return;
    }

    if (domains.length === 0) {
      setFormError('A course must have at least one domain.');
      return;
    }

    if (domains.length > 12) {
      setFormError('A course can have at most 12 domains.');
      return;
    }

    if (domains.some(d => !d.name.trim())) {
      setFormError('All domains must have a valid name.');
      return;
    }

    // Check unique ID for new course
    if (isNew && courses.some(c => c.id === id)) {
      setFormError(`A course with ID "${id}" already exists. Please choose a different ID.`);
      return;
    }

    setIsSaving(true);
    try {
      const payload: CourseDoc = {
        id,
        name,
        shortLabel,
        description,
        accentColor,
        domains: domains.map(d => ({ id: d.id, name: d.name.trim() })),
        requiresCode: !!editingCourse.requiresCode,
        status: editingCourse.status || 'draft',
        order: Number(editingCourse.order) || (courses.length + 1),
        createdAt: editingCourse.createdAt || new Date().toISOString(),
        createdBy: editingCourse.createdBy || auth.currentUser?.uid || 'admin'
      };

      await setDoc(doc(db, 'courses', id), payload, { merge: true });

      setAdminFeedback(isNew ? `Course "${name}" created successfully!` : `Course "${name}" updated!`);
      setTimeout(() => setAdminFeedback(null), 3500);
      setEditingCourse(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `courses/${id}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (course: CourseDoc, newStatus: CourseStatus) => {
    try {
      await updateDoc(doc(db, 'courses', course.id), { status: newStatus });
      setAdminFeedback(`Course "${course.name}" status set to ${newStatus.toUpperCase()}`);
      setTimeout(() => setAdminFeedback(null), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `courses/${course.id}`);
    }
  };

  const handleDeleteCourse = async (course: CourseDoc) => {
    setCheckingDeleteId(course.id);
    setDeleteBlockReason(null);

    try {
      // Check content in objectives, questions, test_questions, objective_pdfs, unlock_codes, boss_challenges
      const collectionsToCheck = [
        { name: 'objectives', label: 'Objectives' },
        { name: 'questions', label: 'Student Inquiries' },
        { name: 'test_questions', label: 'Test Questions' },
        { name: 'objective_pdfs', label: 'Objective PDFs' },
        { name: 'unlock_codes', label: 'Unlock Codes' },
        { name: 'boss_challenges', label: 'Boss Challenges' }
      ];

      const findings: string[] = [];

      for (const col of collectionsToCheck) {
        const qSnap = await getDocs(query(collection(db, col.name), where('course', '==', course.id)));
        if (!qSnap.empty) {
          findings.push(`${qSnap.size} ${col.label}`);
        }
      }

      if (findings.length > 0) {
        setDeleteBlockReason({
          courseId: course.id,
          reason: `Cannot delete "${course.name}": It contains ${findings.join(', ')}. To preserve system integrity, you can Archive this course to hide it from students without deleting existing content.`
        });
        setCheckingDeleteId(null);
        return;
      }

      // Safe to delete!
      if (window.confirm(`Are you sure you want to permanently delete course "${course.name}" (${course.id})? This action cannot be undone.`)) {
        await deleteDoc(doc(db, 'courses', course.id));
        setAdminFeedback(`Course "${course.name}" permanently deleted.`);
        setTimeout(() => setAdminFeedback(null), 3500);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `courses/${course.id}`);
    } finally {
      setCheckingDeleteId(null);
    }
  };

  const handleSeedBuiltIns = async () => {
    setIsSeeding(true);
    try {
      const res = await setupBuiltInCourses(auth.currentUser?.uid);
      if (res.created.length > 0) {
        setAdminFeedback(`Created built-in course documents: ${res.created.join(', ')}`);
      } else {
        setAdminFeedback(`Built-in courses (A+ and Network+) already exist in Firestore.`);
      }
      setTimeout(() => setAdminFeedback(null), 4000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'courses');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <motion.div
      key="courses-tab"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-[var(--bg-card)] p-6 md:p-8 rounded-[2rem] border border-[var(--border-color)] shadow-sm">
        <div>
          <div className="flex items-center gap-2.5 text-xs font-black uppercase tracking-wider text-indigo-400 mb-1">
            <GraduationCap size={16} />
            <span>Course Catalog Engine</span>
          </div>
          <h3 className="text-2xl font-black uppercase tracking-tight text-[var(--text-main)]">
            Curriculum & Courses
          </h3>
          <p className="text-[var(--text-muted)] text-xs md:text-sm mt-1">
            Create and manage certification tracks, configure syllabus domains, and toggle access codes.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleSeedBuiltIns}
            disabled={isSeeding}
            className="px-4 py-3 bg-[var(--bg-panel)] hover:bg-[var(--hover-bg)] text-[var(--text-main)] border border-[var(--border-color)] rounded-xl font-bold uppercase tracking-wider text-xs flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
            title="Creates A+ and Network+ Firestore documents only if missing (never overwrites)"
          >
            {isSeeding ? <Loader2 size={15} className="animate-spin text-indigo-500" /> : <Sparkles size={15} className="text-indigo-500" />}
            <span>Sync Built-in Courses</span>
          </button>

          <button
            onClick={openNewCourseModal}
            className="px-5 py-3 bg-[var(--accent)] hover:opacity-90 text-white rounded-xl font-black uppercase tracking-wider text-xs flex items-center gap-2 transition-all shadow-md shadow-[var(--accent-glow)]"
          >
            <Plus size={16} />
            <span>Add Course</span>
          </button>
        </div>
      </div>

      {/* Delete blocked notice */}
      {deleteBlockReason && (
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start justify-between gap-4 text-amber-400 animate-in fade-in">
          <div className="flex items-start gap-3">
            <ShieldAlert size={20} className="shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-amber-300">Deletion Blocked</h4>
              <p className="text-xs leading-relaxed font-medium">{deleteBlockReason.reason}</p>
            </div>
          </div>
          <button
            onClick={() => setDeleteBlockReason(null)}
            className="text-amber-400 hover:text-white p-1"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Courses Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => {
          const contrast = calculateContrastWithWhite(course.accentColor || '#6366f1');
          return (
            <div
              key={course.id}
              className="bg-[var(--bg-card)] border border-[var(--border-color)] p-6 md:p-7 rounded-3xl flex flex-col justify-between shadow-sm hover:border-[var(--border-strong)] transition-all group relative overflow-hidden"
            >
              {/* Top Accent bar */}
              <div 
                className="absolute top-0 left-0 right-0 h-1.5"
                style={{ backgroundColor: course.accentColor || '#6366f1' }}
              />

              <div>
                {/* Header Row: Swatch, ID, Badges */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                      style={{ backgroundColor: course.accentColor || '#6366f1' }}
                      title={`Hex: ${course.accentColor} (Contrast: ${contrast.toFixed(1)}:1)`}
                    />
                    <span className="font-mono text-xs font-bold text-[var(--text-muted)]">
                      {course.id}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {course.status === 'published' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        <Globe size={10} /> Published
                      </span>
                    ) : course.status === 'archived' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
                        <Archive size={10} /> Archived
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                        <EyeOff size={10} /> Draft
                      </span>
                    )}

                    {course.requiresCode ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1" title="Requires unlock code">
                        <Lock size={10} /> Code
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-500/10 text-slate-400 border border-slate-500/20 flex items-center gap-1" title="Open to all students">
                        <Unlock size={10} /> Open
                      </span>
                    )}
                  </div>
                </div>

                {/* Course Title and Label */}
                <div className="space-y-1 mb-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xl font-bold tracking-tight text-[var(--text-main)]">
                      {course.name}
                    </h4>
                    <span 
                      className="px-2.5 py-1 rounded-lg text-xs font-black uppercase text-white shadow-sm"
                      style={{ backgroundColor: course.accentColor || '#6366f1' }}
                    >
                      {course.shortLabel}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                    {course.description || 'No description provided.'}
                  </p>
                </div>

                {/* Domains Count & Order */}
                <div className="bg-[var(--bg-surface)] p-3 rounded-2xl border border-[var(--border-color)] flex items-center justify-between text-xs font-semibold text-[var(--text-muted)] mb-5">
                  <div className="flex items-center gap-1.5">
                    <Layers size={14} className="text-indigo-400" />
                    <span>{(course.domains || []).length} Domains</span>
                  </div>
                  <div className="text-[11px]">
                    Order #{course.order || 0}
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-[var(--border-color)] flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditCourseModal(course)}
                    className="p-2 bg-[var(--bg-panel)] hover:bg-[var(--hover-bg)] text-[var(--text-main)] border border-[var(--border-color)] rounded-xl transition-all"
                    title="Edit Course Details"
                  >
                    <Edit3 size={14} />
                  </button>

                  {/* Status Toggle Quick Buttons */}
                  {course.status !== 'published' && (
                    <button
                      onClick={() => handleStatusChange(course, 'published')}
                      className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-[11px] font-bold uppercase transition-all"
                      title="Publish course for students"
                    >
                      Publish
                    </button>
                  )}

                  {course.status === 'published' && (
                    <button
                      onClick={() => handleStatusChange(course, 'draft')}
                      className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-[11px] font-bold uppercase transition-all"
                      title="Unpublish (revert to Draft)"
                    >
                      Unpublish
                    </button>
                  )}

                  {course.status !== 'archived' && (
                    <button
                      onClick={() => handleStatusChange(course, 'archived')}
                      className="p-2 bg-[var(--bg-panel)] hover:bg-rose-500/15 text-[var(--text-muted)] hover:text-rose-400 border border-[var(--border-color)] rounded-xl transition-all"
                      title="Archive course"
                    >
                      <Archive size={14} />
                    </button>
                  )}

                  {course.status === 'archived' && (
                    <button
                      onClick={() => handleStatusChange(course, 'draft')}
                      className="px-2.5 py-1.5 bg-[var(--bg-panel)] hover:bg-[var(--hover-bg)] text-[var(--text-main)] border border-[var(--border-color)] rounded-xl text-[11px] font-bold uppercase transition-all"
                      title="Restore to Draft"
                    >
                      Restore
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {handleSelectManaging && (
                    <button
                      onClick={() => handleSelectManaging(course.id)}
                      className="text-xs font-bold text-[var(--accent)] hover:opacity-80 transition-opacity cursor-pointer px-2 py-1 rounded-lg hover:bg-white/5"
                    >
                      Manage &rarr;
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteCourse(course)}
                    disabled={checkingDeleteId === course.id}
                    className="p-2 bg-[var(--bg-panel)] hover:bg-rose-500/15 text-[var(--text-muted)] hover:text-rose-500 border border-[var(--border-color)] rounded-xl transition-all disabled:opacity-50"
                    title="Delete Course (only allowed if 0 content items exist)"
                  >
                    {checkingDeleteId === course.id ? (
                      <Loader2 size={14} className="animate-spin text-rose-500" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Course Modal */}
      <AnimatePresence>
        {editingCourse && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in">
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl w-full max-w-2xl my-8 overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between p-6 border-b border-[var(--border-color)]">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: editingCourse.accentColor || '#6366f1' }}
                  >
                    <GraduationCap size={18} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold tracking-tight text-[var(--text-main)]">
                      {isNew ? 'Add New Course' : `Edit Course: ${editingCourse.name}`}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)]">
                      {isNew ? 'Create a brand new certification curriculum track' : `Course ID: ${editingCourse.id}`}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setEditingCourse(null)}
                  className="p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-xl transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveCourse} className="p-6 md:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
                {formError && (
                  <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-start gap-2.5">
                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Course Name & Short Label */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Course Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editingCourse.name || ''}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="e.g. CompTIA Security+"
                      className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl py-3 px-4 text-sm font-semibold text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:border-indigo-500 outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Short Label <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editingCourse.shortLabel || ''}
                      onChange={(e) => setEditingCourse({ ...editingCourse, shortLabel: e.target.value })}
                      placeholder="e.g. Sec+"
                      className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl py-3 px-4 text-sm font-bold text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:border-indigo-500 outline-none uppercase"
                    />
                  </div>
                </div>

                {/* ID (Slug) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Course ID (Slug) <span className="text-rose-500">*</span>
                    </label>
                    {!isNew && (
                      <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
                        <Lock size={11} /> Locked after creation
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    disabled={!isNew}
                    value={editingCourse.id || ''}
                    onChange={(e) => setEditingCourse({ ...editingCourse, id: e.target.value.toLowerCase().trim() })}
                    placeholder="e.g. security-plus"
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl py-3 px-4 text-sm font-mono text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:border-indigo-500 outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Lowercase letters, numbers, and hyphens only (3-30 chars). Used in database paths and unlock codes.
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Course Description
                  </label>
                  <textarea
                    rows={2}
                    value={editingCourse.description || ''}
                    onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })}
                    placeholder="Brief description of skills, domains, and certification track..."
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-3 text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:border-indigo-500 outline-none resize-none"
                  />
                </div>

                {/* Accent Color with Live WCAG Contrast Ratio Check */}
                <div className="bg-[var(--bg-surface)] p-5 rounded-2xl border border-[var(--border-color)] space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Palette size={16} className="text-indigo-400" />
                      <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">
                        Accent Color & Contrast Verification
                      </label>
                    </div>

                    {/* Live Contrast Meter */}
                    {(() => {
                      const color = editingCourse.accentColor || '#6366f1';
                      const contrast = calculateContrastWithWhite(color);
                      const isPassing = contrast >= 4.5;
                      return (
                        <div className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 border ${
                          isPassing 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}>
                          {isPassing ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                          <span>{contrast.toFixed(2)}:1 {isPassing ? 'Pass (WCAG AA)' : 'Fail (< 4.5:1)'}</span>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={editingCourse.accentColor || '#6366f1'}
                      onChange={(e) => setEditingCourse({ ...editingCourse, accentColor: e.target.value })}
                      className="w-12 h-12 rounded-xl border border-[var(--border-color)] cursor-pointer bg-transparent p-1"
                    />
                    <input
                      type="text"
                      value={editingCourse.accentColor || ''}
                      onChange={(e) => setEditingCourse({ ...editingCourse, accentColor: e.target.value })}
                      placeholder="#4F46E5"
                      className="w-36 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl py-2 px-3 text-sm font-mono text-[var(--text-main)] uppercase"
                    />
                    <div 
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm flex items-center gap-2"
                      style={{ backgroundColor: editingCourse.accentColor || '#6366f1' }}
                    >
                      <span>Preview Text on Accent</span>
                    </div>
                  </div>

                  {/* Quick Preset Swatches */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] text-[var(--text-muted)] font-medium">Quick compliant swatches:</span>
                    <div className="flex items-center gap-2 flex-wrap">
                      {PRESET_ACCENTS.map((hex) => (
                        <button
                          key={hex}
                          type="button"
                          onClick={() => setEditingCourse({ ...editingCourse, accentColor: hex })}
                          className={`w-7 h-7 rounded-lg transition-transform hover:scale-110 border ${
                            editingCourse.accentColor === hex ? 'ring-2 ring-indigo-400 scale-110 border-white' : 'border-white/20'
                          }`}
                          style={{ backgroundColor: hex }}
                          title={`Select ${hex}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Status, Order, and Requires Code */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Publish Status
                    </label>
                    <select
                      value={editingCourse.status || 'draft'}
                      onChange={(e) => setEditingCourse({ ...editingCourse, status: e.target.value as CourseStatus })}
                      className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl py-3 px-3 text-sm font-semibold text-[var(--text-main)] outline-none"
                    >
                      <option value="draft">Draft (Admin Only)</option>
                      <option value="published">Published (Students Visible)</option>
                      <option value="archived">Archived (Hidden)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Display Order #
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={editingCourse.order || 1}
                      onChange={(e) => setEditingCourse({ ...editingCourse, order: parseInt(e.target.value) || 1 })}
                      className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl py-3 px-3 text-sm font-semibold text-[var(--text-main)] outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Access Restriction
                    </label>
                    <button
                      type="button"
                      onClick={() => setEditingCourse({ ...editingCourse, requiresCode: !editingCourse.requiresCode })}
                      className={`w-full py-3 px-3 rounded-xl border text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 ${
                        editingCourse.requiresCode
                          ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      }`}
                    >
                      {editingCourse.requiresCode ? (
                        <>
                          <Lock size={14} /> Requires Code
                        </>
                      ) : (
                        <>
                          <Unlock size={14} /> Open to All
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Domains Syllabus Editor */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--text-main)]">
                        Syllabus Domains ({(editingCourse.domains || []).length} / 12)
                      </h4>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        Order in this list dictates the sequence of domains on the student dashboard.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddDomain}
                      disabled={(editingCourse.domains || []).length >= 12}
                      className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all disabled:opacity-40"
                    >
                      <Plus size={13} /> Add Domain
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                    {(editingCourse.domains || []).map((dom, idx) => (
                      <div 
                        key={dom.id}
                        className="flex items-center gap-2 bg-[var(--bg-surface)] p-2.5 rounded-xl border border-[var(--border-color)]"
                      >
                        <span className="w-6 text-center font-mono text-xs font-bold text-[var(--text-muted)]">
                          #{idx + 1}
                        </span>

                        <input
                          type="text"
                          required
                          value={dom.name}
                          onChange={(e) => handleDomainNameChange(idx, e.target.value)}
                          placeholder="Domain name e.g. Network Security"
                          className="flex-1 bg-transparent text-sm font-medium text-[var(--text-main)] outline-none border-b border-transparent focus:border-indigo-500 px-1 py-0.5"
                        />

                        <span className="text-[10px] font-mono text-[var(--text-muted)] px-2">
                          ID: {dom.id}
                        </span>

                        {/* Reorder Buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveDomain(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1 hover:bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-[var(--text-main)] rounded transition-colors disabled:opacity-30"
                            title="Move Up"
                          >
                            <ArrowUp size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveDomain(idx, 'down')}
                            disabled={idx === (editingCourse.domains?.length || 0) - 1}
                            className="p-1 hover:bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-[var(--text-main)] rounded transition-colors disabled:opacity-30"
                            title="Move Down"
                          >
                            <ArrowDown size={13} />
                          </button>
                        </div>

                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveDomain(idx)}
                          className="p-1 text-[var(--text-muted)] hover:text-rose-500 rounded transition-colors"
                          title="Remove Domain"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Form Footer */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
                  <button
                    type="button"
                    onClick={() => setEditingCourse(null)}
                    className="px-5 py-2.5 bg-[var(--bg-panel)] hover:bg-[var(--hover-bg)] text-[var(--text-main)] border border-[var(--border-color)] rounded-xl font-bold uppercase tracking-wider text-xs transition-all"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-[var(--accent)] hover:opacity-90 text-white rounded-xl font-bold uppercase tracking-wider text-xs transition-all shadow-md shadow-[var(--accent-glow)] flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 size={15} className="animate-spin" /> : null}
                    <span>{isNew ? 'Create Course' : 'Save Changes'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdminCoursesTab;
