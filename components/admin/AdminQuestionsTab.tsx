import React, { useState, useEffect, useRef } from 'react';
import { TestQuestion, QuestionType, MatchPair, CourseId, CourseDoc } from '../../types';
import { getCourseConfig, withCourse, resolveDomainTitle } from '../../courseConfig';
import { subscribeCourses, courseDocToConfig } from '../../coursesService';
import { db, storage, auth, OperationType, handleFirestoreError, ref, uploadBytesResumable, getDownloadURL, deleteObject } from '../../firebase';
import { collection, doc, setDoc, addDoc } from 'firebase/firestore';
import { 
  HelpCircle, 
  Plus, 
  Edit3, 
  Trash2, 
  ChevronRight, 
  XCircle, 
  Loader2, 
  Save, 
  Copy, 
  Eye, 
  Image as ImageIcon, 
  CheckSquare, 
  FileText, 
  Link2, 
  ListOrdered, 
  Terminal, 
  ArrowUp, 
  ArrowDown, 
  Upload, 
  AlertCircle,
  X,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import QuestionRenderer from '../questions/QuestionRenderer';
import { isAnswerCorrect } from '../../questionScoring';
import { generateAiQuestion } from '../../aiAdminService';
import { AiDraftPanel } from './AiDraftPanel';
import { AiQuestionDraft } from '../../types';

interface AdminQuestionsTabProps {
  testQuestions: TestQuestion[];
  onDeleteQuestion: (id: string, text: string) => void;
  setAdminFeedback: (msg: string | null) => void;
  course?: CourseId;
  courses?: CourseDoc[];
  onNavigateToCourses?: () => void;
}

const QUESTION_TYPES: { id: QuestionType; label: string; icon: any; description: string }[] = [
  { id: 'choice', label: 'Multiple Choice', icon: HelpCircle, description: 'Single correct answer from options' },
  { id: 'image', label: 'Diagram / Image', icon: ImageIcon, description: 'Image with multiple choice options' },
  { id: 'multi', label: 'Multi-Select', icon: CheckSquare, description: 'Select all that apply with multiple correct answers' },
  { id: 'fill', label: 'Fill-in-the-Blank', icon: FileText, description: 'Text box with accepted string answers' },
  { id: 'match', label: 'Matching Pairs', icon: Link2, description: 'Two columns to connect items' },
  { id: 'order', label: 'Sequence Ordering', icon: ListOrdered, description: 'Arrange steps in correct sequence' },
  { id: 'terminal', label: 'CLI Simulation', icon: Terminal, description: 'Command line challenge with simulated output' },
];

export const AdminQuestionsTab: React.FC<AdminQuestionsTabProps> = ({
  testQuestions,
  onDeleteQuestion,
  setAdminFeedback,
  course = 'a-plus',
  courses: propsCourses,
  onNavigateToCourses
}) => {
  const [editingQuestion, setEditingQuestion] = useState<Partial<TestQuestion> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [previewAnswer, setPreviewAnswer] = useState<any>(undefined);
  const [formError, setFormError] = useState<string | null>(null);

  // Image Upload state
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
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

  const availableDomains = activeCourseDoc?.domains && activeCourseDoc.domains.length > 0
    ? activeCourseDoc.domains.map(d => ({ id: d.id, name: d.name, title: d.name }))
    : courseConfig.domains.map(d => ({ id: d.id, name: d.title || d.name, title: d.title || d.name }));

  // AI Question Drafting & Type-aware State
  const [isAiAccuracyConfirmed, setIsAiAccuracyConfirmed] = useState(false);
  const [pendingTypeSwitch, setPendingTypeSwitch] = useState<{ newType: QuestionType; oldType: QuestionType } | null>(null);
  const [isRedrafting, setIsRedrafting] = useState(false);

  // Apply a selected AI draft card to the current editor form
  const applyDraftToForm = (draft: AiQuestionDraft) => {
    const baseDomain = editingQuestion?.domain || availableDomains[0]?.id || '';
    const baseDifficulty = (draft.difficulty as any) || editingQuestion?.difficulty || 'Medium';
    const base = {
      id: editingQuestion?.id || '',
      text: draft.question,
      type: draft.type,
      domain: baseDomain,
      difficulty: baseDifficulty,
      explanation: draft.explanation || '',
      course,
      aiDrafted: true,
      imageIdea: (draft as any).imageIdea
    };

    switch (draft.type) {
      case 'choice':
        setEditingQuestion({
          ...base,
          type: 'choice',
          options: [...((draft as any).options || ['', '', '', ''])],
          correctAnswer: (draft as any).correctAnswer ?? 0
        });
        break;

      case 'multi':
        setEditingQuestion({
          ...base,
          type: 'multi',
          options: [...((draft as any).options || ['', '', '', ''])],
          correctAnswers: [...((draft as any).correctAnswers || [0, 1])]
        });
        break;

      case 'fill':
        setEditingQuestion({
          ...base,
          type: 'fill',
          acceptedAnswers: [...((draft as any).acceptedAnswers || [''])],
          caseSensitive: false
        });
        break;

      case 'match':
        setEditingQuestion({
          ...base,
          type: 'match',
          pairs: ((draft as any).pairs || []).map((p: any) => ({ left: p.left, right: p.right }))
        });
        break;

      case 'order':
        setEditingQuestion({
          ...base,
          type: 'order',
          steps: [...((draft as any).steps || ['', '', '', ''])]
        });
        break;

      case 'image':
        setEditingQuestion({
          ...base,
          type: 'image',
          options: [...((draft as any).options || ['', '', '', ''])],
          correctAnswer: (draft as any).correctAnswer ?? 0,
          imageAlt: (draft as any).altText || '',
          imageUrl: editingQuestion?.imageUrl || '',
          imagePath: editingQuestion?.imagePath || '',
          imageIdea: (draft as any).imageIdea || ''
        });
        break;

      case 'terminal':
        setEditingQuestion({
          ...base,
          type: 'terminal',
          prompt: draft.question,
          acceptedCommands: [...((draft as any).acceptedCommands || [''])],
          simulatedOutput: (draft as any).simulatedOutput || '',
          hint: (draft as any).hint || ''
        });
        break;
    }

    setIsAiAccuracyConfirmed(false);
    setFormError(null);
    setPendingTypeSwitch(null);
    setAdminFeedback(`AI draft applied to ${QUESTION_TYPES.find(t => t.id === draft.type)?.label} editor. Please check before saving.`);
    setTimeout(() => setAdminFeedback(null), 3000);
  };

  // Convert existing question text into a new question type via AI
  const handleRedraftAsNewType = async (newType: QuestionType) => {
    setIsRedrafting(true);
    setFormError(null);
    try {
      const activeDomain = availableDomains.find(d => d.id === editingQuestion?.domain) || availableDomains[0];
      const sourceTopic = editingQuestion?.text?.trim() || '';
      const res = await generateAiQuestion({
        questionType: newType,
        course,
        courseName: courseConfig.name,
        courseDescription: courseConfig.description,
        domain: activeDomain?.name || 'General Objectives',
        domainId: activeDomain?.id,
        domainTitle: activeDomain?.name,
        difficulty: editingQuestion?.difficulty || 'Medium',
        topic: sourceTopic.slice(0, 500),
        count: 1
      });

      if (res.drafts && res.drafts.length > 0) {
        applyDraftToForm(res.drafts[0]);
      } else {
        const templated = createDefaultQuestion(newType);
        setEditingQuestion({
          ...templated,
          id: editingQuestion?.id,
          domain: editingQuestion?.domain,
          difficulty: editingQuestion?.difficulty,
          course,
          aiDrafted: true
        });
        setIsAiAccuracyConfirmed(false);
      }
      setPendingTypeSwitch(null);
      setAdminFeedback(`Redrafted question as ${QUESTION_TYPES.find(t => t.id === newType)?.label}!`);
      setTimeout(() => setAdminFeedback(null), 3000);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to redraft question in new type.');
    } finally {
      setIsRedrafting(false);
    }
  };

  // Start with an empty template for the new type, asking if text exists
  const handleStartEmptyNewType = (newType: QuestionType) => {
    const hasText = Boolean(
      editingQuestion?.text?.trim() ||
      editingQuestion?.explanation?.trim() ||
      (editingQuestion?.options && editingQuestion.options.some(o => o?.trim())) ||
      (editingQuestion?.steps && editingQuestion.steps.some(s => s?.trim())) ||
      (editingQuestion?.pairs && editingQuestion.pairs.some(p => p.left?.trim() || p.right?.trim())) ||
      (editingQuestion?.acceptedAnswers && editingQuestion.acceptedAnswers.some(a => a?.trim())) ||
      (editingQuestion?.acceptedCommands && editingQuestion.acceptedCommands.some(c => c?.trim()))
    );

    if (hasText) {
      const targetLabel = QUESTION_TYPES.find(t => t.id === newType)?.label || newType;
      const confirmed = window.confirm(`Are you sure you want to clear existing question text and start an empty ${targetLabel} question?`);
      if (!confirmed) return;
    }

    const templated = createDefaultQuestion(newType);
    setEditingQuestion({
      ...templated,
      id: editingQuestion?.id,
      domain: editingQuestion?.domain,
      difficulty: editingQuestion?.difficulty,
      course,
      aiDrafted: false
    });
    setIsAiAccuracyConfirmed(false);
    setPendingTypeSwitch(null);
  };

  // Helper to initialize clean default template by question type
  const createDefaultQuestion = (type: QuestionType = 'choice'): Partial<TestQuestion> => {
    const firstDomain = availableDomains[0]?.id || '';
    const base = {
      id: '',
      type,
      text: '',
      domain: firstDomain,
      difficulty: 'Medium' as const,
      explanation: '',
      course
    };

    switch (type) {
      case 'image':
        return {
          ...base,
          imageUrl: '',
          imageAlt: '',
          options: ['', '', '', ''],
          correctAnswer: 0
        };
      case 'multi':
        return {
          ...base,
          options: ['', '', '', ''],
          correctAnswers: [0]
        };
      case 'fill':
        return {
          ...base,
          acceptedAnswers: [''],
          caseSensitive: false
        };
      case 'match':
        return {
          ...base,
          pairs: [
            { left: '', right: '' },
            { left: '', right: '' }
          ]
        };
      case 'order':
        return {
          ...base,
          steps: ['', '', '']
        };
      case 'terminal':
        return {
          ...base,
          prompt: 'Enter the command to check connectivity to the host at 192.168.1.1:',
          acceptedCommands: ['ping 192.168.1.1'],
          simulatedOutput: 'Pinging 192.168.1.1 with 32 bytes of data:\nReply from 192.168.1.1: bytes=32 time=2ms TTL=64',
          hint: 'Use the standard ICMP connectivity test command.'
        };
      case 'choice':
      default:
        return {
          ...base,
          options: ['', '', '', ''],
          correctAnswer: 0
        };
    }
  };

  const handleDuplicate = (q: TestQuestion) => {
    setEditingQuestion({
      ...q,
      id: '',
      text: `${q.text} (Copy)`
    });
    setActiveTab('editor');
    setPreviewAnswer(undefined);
    setFormError(null);
    setAdminFeedback('Duplicated question loaded. Make your changes and save.');
  };

  // Image Upload Handler
  const handleImageFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingQuestion) return;

    // Validate type: JPEG, PNG, WebP only
    const allowedMime = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const isImageExt = /\.(jpe?g|png|webp)$/i.test(file.name);
    if (!allowedMime.includes(file.type.toLowerCase()) && !isImageExt) {
      setFormError('Invalid image format. Only JPEG, PNG, and WebP are allowed.');
      return;
    }

    // Validate size: max 2 MB
    if (file.size > 2 * 1024 * 1024) {
      setFormError('Image exceeds the 2 MB limit (max 2 MB).');
      return;
    }

    setFormError(null);
    setIsUploadingImage(true);
    setUploadProgress(0);

    // If replacing an existing image, delete the old file
    if (editingQuestion.imagePath) {
      try {
        await deleteObject(ref(storage, editingQuestion.imagePath));
      } catch (err) {
        console.warn('Failed to delete previous image from storage:', err);
      }
    }

    const adminUid = auth.currentUser?.uid || 'admin';
    const random32Hex = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]/g, '_');
    const primaryStoragePath = `question_images/${adminUid}/${random32Hex}_${safeName}`;
    const fallbackStoragePath = `resources/question_images/${random32Hex}_${safeName}`;
    const normalizedContentType = file.type || (file.name.endsWith('.png') ? 'image/png' : file.name.endsWith('.webp') ? 'image/webp' : 'image/jpeg');

    const startUpload = (storagePath: string, isFallback: boolean = false) => {
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, file, {
        contentType: normalizedContentType
      });

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setUploadProgress(progress);
        },
        (error: any) => {
          // If the primary question_images path is unauthorized (storage rules not yet published in console),
          // seamlessly retry using the pre-authorized resources/ path
          if (!isFallback && (error?.code === 'storage/unauthorized' || String(error).includes('storage/unauthorized'))) {
            console.warn('Primary storage path unauthorized; switching to pre-authorized fallback path...');
            startUpload(fallbackStoragePath, true);
            return;
          }

          console.error('Image upload failed:', error);
          const errorMsg = error?.code === 'storage/unauthorized'
            ? 'Firebase Storage unauthorized. Please ensure updated storage.rules are published in your Firebase Console (Storage > Rules).'
            : 'Failed to upload image. Please try again.';
          setFormError(errorMsg);
          setIsUploadingImage(false);
          setUploadProgress(null);
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            setEditingQuestion(prev => prev ? ({
              ...prev,
              imageUrl: downloadUrl,
              imagePath: storagePath
            }) : null);
          } catch (err) {
            console.error('Failed to get download URL:', err);
            setFormError('Image was uploaded but failed to retrieve its public URL.');
          } finally {
            setIsUploadingImage(false);
            setUploadProgress(null);
          }
        }
      );
    };

    startUpload(primaryStoragePath, false);
  };

  const handleRemoveImage = async () => {
    if (!editingQuestion) return;
    if (editingQuestion.imagePath) {
      try {
        await deleteObject(ref(storage, editingQuestion.imagePath));
      } catch (err) {
        console.warn('Failed to delete storage file:', err);
      }
    }
    setEditingQuestion({
      ...editingQuestion,
      imageUrl: undefined,
      imagePath: undefined,
      imageAlt: ''
    });
  };

  // Validation
  const validateQuestion = (q: Partial<TestQuestion>): string | null => {
    if (!q.text?.trim()) return 'Question text is required.';
    if (!q.domain) return 'Please select a domain.';

    const type: QuestionType = q.type || 'choice';

    if (type === 'choice') {
      const opts = (q.options || []).map(o => o.trim()).filter(Boolean);
      if (opts.length < 2) return 'Multiple Choice requires at least 2 non-empty options.';
      if (q.correctAnswer === undefined || q.correctAnswer < 0 || q.correctAnswer >= (q.options || []).length) {
        return 'Please mark one option as the correct answer.';
      }
    }

    if (type === 'image') {
      if (!q.imageUrl) return 'Please upload an image/diagram.';
      if (!q.imageAlt?.trim()) return 'Image alt text is required for accessibility.';
      const opts = (q.options || []).map(o => o.trim()).filter(Boolean);
      if (opts.length < 2) return 'Diagram questions require at least 2 non-empty options.';
      if (q.correctAnswer === undefined || q.correctAnswer < 0 || q.correctAnswer >= (q.options || []).length) {
        return 'Please mark one option as the correct answer.';
      }
    }

    if (type === 'multi') {
      const opts = (q.options || []).map(o => o.trim()).filter(Boolean);
      if (opts.length < 2) return 'Multi-Select requires at least 2 non-empty options.';
      if (!Array.isArray(q.correctAnswers) || q.correctAnswers.length === 0) {
        return 'Please check at least one correct option for Multi-Select.';
      }
    }

    if (type === 'fill') {
      const accepted = (q.acceptedAnswers || []).map(a => a.trim()).filter(Boolean);
      if (accepted.length === 0) return 'Fill-in-the-blank requires at least 1 accepted answer.';
    }

    if (type === 'match') {
      const pairs = q.pairs || [];
      if (pairs.length < 2) return 'Matching requires at least 2 pairs.';
      for (let i = 0; i < pairs.length; i++) {
        if (!pairs[i].left?.trim() || !pairs[i].right?.trim()) {
          return `Pair #${i + 1} has an empty field. Both Left and Right must be filled.`;
        }
      }
    }

    if (type === 'order') {
      const steps = (q.steps || []).map(s => s.trim()).filter(Boolean);
      if (steps.length < 3) return 'Sequence ordering requires at least 3 steps.';
    }

    if (type === 'terminal') {
      if (!q.prompt?.trim()) return 'Terminal prompt / instructions are required.';
      const cmds = (q.acceptedCommands || []).map(c => c.trim()).filter(Boolean);
      if (cmds.length === 0) return 'At least one accepted command is required.';
    }

    return null;
  };

  const handleSaveTestQuestion = async () => {
    if (editingQuestion.aiDrafted && !isAiAccuracyConfirmed) {
      setFormError('Please confirm that you have checked this answer is correct before saving.');
      return;
    }

    const error = validateQuestion(editingQuestion);
    if (error) {
      setFormError(error);
      return;
    }
    setFormError(null);
    setIsSaving(true);

    try {
      const type: QuestionType = editingQuestion.type || 'choice';
      const payload: any = {
        type,
        text: editingQuestion.text!.trim(),
        domain: editingQuestion.domain,
        difficulty: editingQuestion.difficulty || 'Medium',
        explanation: (editingQuestion.explanation || '').trim(),
      };

      if (editingQuestion.aiDrafted) {
        payload.aiDrafted = true;
      }
      if (editingQuestion.imageIdea) {
        payload.imageIdea = editingQuestion.imageIdea;
      }

      // Type-specific field sanitization
      if (type === 'choice') {
        payload.options = (editingQuestion.options || []).map(o => o.trim());
        payload.correctAnswer = editingQuestion.correctAnswer ?? 0;
      } else if (type === 'image') {
        payload.imageUrl = editingQuestion.imageUrl;
        payload.imagePath = editingQuestion.imagePath || '';
        payload.imageAlt = (editingQuestion.imageAlt || '').trim();
        payload.options = (editingQuestion.options || []).map(o => o.trim());
        payload.correctAnswer = editingQuestion.correctAnswer ?? 0;
      } else if (type === 'multi') {
        payload.options = (editingQuestion.options || []).map(o => o.trim());
        payload.correctAnswers = editingQuestion.correctAnswers || [0];
      } else if (type === 'fill') {
        payload.acceptedAnswers = (editingQuestion.acceptedAnswers || []).map(a => a.trim()).filter(Boolean);
        payload.caseSensitive = Boolean(editingQuestion.caseSensitive);
      } else if (type === 'match') {
        payload.pairs = (editingQuestion.pairs || []).map(p => ({
          left: p.left.trim(),
          right: p.right.trim()
        }));
      } else if (type === 'order') {
        payload.steps = (editingQuestion.steps || []).map(s => s.trim()).filter(Boolean);
      } else if (type === 'terminal') {
        payload.prompt = (editingQuestion.prompt || '').trim();
        payload.acceptedCommands = (editingQuestion.acceptedCommands || []).map(c => c.trim()).filter(Boolean);
        payload.simulatedOutput = (editingQuestion.simulatedOutput || '').trim();
        if (editingQuestion.hint?.trim()) {
          payload.hint = editingQuestion.hint.trim();
        }
      }

      if (editingQuestion.id) {
        await setDoc(doc(db, 'test_questions', editingQuestion.id), withCourse(payload, course), { merge: true });
      } else {
        await addDoc(collection(db, 'test_questions'), withCourse(payload, course));
      }

      setEditingQuestion(null);
      setAdminFeedback('Question saved successfully!');
      setTimeout(() => setAdminFeedback(null), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'test_questions');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <motion.div 
        key="questions"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-8"
      >
        {/* Header Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-[var(--bg-card)] p-6 md:p-8 rounded-[2rem] border border-[var(--border-color)] shadow-sm">
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-1 flex items-center gap-3 text-[var(--text-main)]">
              <HelpCircle size={24} style={{ color: courseConfig.accentHex }} />
              {courseConfig.shortLabel} Question <span style={{ color: courseConfig.accentHex }}>Bank</span>
            </h3>
            <p className="text-[var(--text-muted)] text-xs md:text-sm">
              Manage interactive questions for Practice Mode and Exam Simulator.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                const fresh = createDefaultQuestion('choice');
                fresh.aiDrafted = true;
                setEditingQuestion(fresh);
                setActiveTab('editor');
                setPreviewAnswer(undefined);
                setFormError(null);
                setPendingTypeSwitch(null);
                setIsAiAccuracyConfirmed(false);
              }}
              className="px-4 py-3 rounded-xl font-black uppercase tracking-widest text-xs text-white shadow-md transition-all flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 cursor-pointer"
            >
              <Sparkles size={16} /> AI Draft Question
            </button>
            <button 
              onClick={() => {
                setEditingQuestion(createDefaultQuestion('choice'));
                setActiveTab('editor');
                setPreviewAnswer(undefined);
                setFormError(null);
              }}
              className="px-5 py-3 rounded-xl font-black uppercase tracking-widest text-xs text-white shadow-md transition-all flex items-center gap-2 hover:opacity-90 self-start sm:self-auto cursor-pointer"
              style={{ backgroundColor: courseConfig.accentHex }}
            >
              <Plus size={16} /> Add Question
            </button>
          </div>
        </div>

        {/* Questions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testQuestions.map(q => {
            const typeInfo = QUESTION_TYPES.find(t => t.id === (q.type || 'choice')) || QUESTION_TYPES[0];
            const Icon = typeInfo.icon;

            return (
              <div 
                key={q.id} 
                className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-color)] flex flex-col h-full shadow-sm hover:border-indigo-500/40 transition-colors group"
              >
                <div className="flex justify-between items-start mb-4 gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="bg-[var(--bg-surface)] px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] border border-[var(--border-color)]">
                      {resolveDomainTitle(q.domain, availableDomains)}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center gap-1">
                      <Icon size={10} />
                      {typeInfo.label}
                    </span>
                  </div>

                  {/* Actions: Duplicate, Edit, Delete */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button 
                      onClick={() => handleDuplicate(q)}
                      title="Duplicate Question"
                      className="p-1.5 bg-[var(--bg-surface)] hover:bg-[var(--border-color)] rounded-lg text-[var(--text-muted)] hover:text-indigo-400 transition-colors border border-[var(--border-color)]"
                    >
                      <Copy size={13} />
                    </button>
                    <button 
                      onClick={() => {
                        setEditingQuestion({ ...q });
                        setActiveTab('editor');
                        setPreviewAnswer(undefined);
                        setFormError(null);
                      }} 
                      title="Edit Question"
                      className="p-1.5 bg-[var(--bg-surface)] hover:bg-[var(--border-color)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors border border-[var(--border-color)]"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button 
                      onClick={() => onDeleteQuestion(q.id, q.text)} 
                      title="Delete Question"
                      className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg text-rose-500 transition-colors border border-rose-500/20"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <p className="text-sm font-semibold text-[var(--text-main)] mb-4 line-clamp-3 flex-1 select-text">
                  {q.text}
                </p>

                {/* Sub-meta by question type */}
                <div className="pt-3 border-t border-[var(--border-color)] flex items-center justify-between text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold">
                  <span>Difficulty: {q.difficulty || 'Medium'}</span>
                  <span>
                    {q.type === 'match' ? `${q.pairs?.length || 0} Pairs` :
                     q.type === 'order' ? `${q.steps?.length || 0} Steps` :
                     q.type === 'fill' ? `${q.acceptedAnswers?.length || 0} Accepted` :
                     q.type === 'terminal' ? 'CLI Command' :
                     `${q.options?.length || 0} Options`}
                  </span>
                </div>
              </div>
            );
          })}

          {testQuestions.length === 0 && (
            <div className="col-span-full py-16 text-center text-[var(--text-muted)] uppercase font-black tracking-widest border-2 border-dashed border-[var(--border-color)] rounded-3xl bg-[var(--bg-card)]">
              {course !== 'a-plus' 
                ? `No ${courseConfig.name} questions found. Click "Add Question" above to create one.` 
                : 'No custom questions found. The system is using the default fallback questions.'}
            </div>
          )}
        </div>
      </motion.div>

      {/* Question Editor & Preview Modal */}
      <AnimatePresence>
        {editingQuestion && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] rounded-[2.5rem] w-full max-w-4xl overflow-hidden shadow-2xl my-6 flex flex-col max-h-[90vh]"
            >
              {/* Modal Top Bar */}
              <div className="p-5 md:p-8 border-b border-[var(--border-color)] flex flex-wrap justify-between items-center bg-[var(--bg-surface)] gap-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white"
                    style={{ backgroundColor: courseConfig.accentHex }}
                  >
                    <HelpCircle size={22} />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-[var(--text-main)]">
                      {editingQuestion.id ? 'Edit Question' : 'Create New Question'}
                    </h2>
                    <p className="text-xs text-[var(--text-muted)] font-mono">
                      Course: {courseConfig.name}
                    </p>
                  </div>
                </div>

                {/* Sub-Tab Navigation: Form Editor vs Live Preview */}
                <div className="flex items-center gap-1 bg-[var(--bg-card)] p-1 rounded-2xl border border-[var(--border-color)]">
                  <button
                    type="button"
                    onClick={() => setActiveTab('editor')}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                      activeTab === 'editor'
                        ? 'bg-[var(--accent)] text-white shadow-sm'
                        : 'text-[var(--text-muted)] hover:text-white'
                    }`}
                  >
                    <Edit3 size={13} /> Editor
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('preview');
                      setPreviewAnswer(undefined);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                      activeTab === 'preview'
                        ? 'bg-[var(--accent)] text-white shadow-sm'
                        : 'text-[var(--text-muted)] hover:text-white'
                    }`}
                  >
                    <Eye size={13} /> Live Preview
                  </button>
                  <button 
                    onClick={() => setEditingQuestion(null)} 
                    className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors p-2 cursor-pointer ml-1"
                    title="Close modal"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Error banner if validation fails */}
              {formError && (
                <div className="bg-rose-500/15 border-b border-rose-500/30 px-6 py-3 text-rose-400 text-xs font-bold flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Scrollable Form Content */}
              <div className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                {activeTab === 'preview' ? (
                  /* ================= LIVE PREVIEW TAB ================= */
                  <div className="space-y-4">
                    <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs flex items-center gap-2">
                      <Eye size={15} className="shrink-0" />
                      <span>This is the interactive student view. Try answering below to verify layout and behavior!</span>
                    </div>

                    <QuestionRenderer
                      question={editingQuestion as TestQuestion}
                      questionNumber={1}
                      totalQuestions={1}
                      value={previewAnswer}
                      onChange={setPreviewAnswer}
                      onSubmitAnswer={() => setAdminFeedback('Answer verified in live student preview.')}
                      mode="practice"
                      reviewMode={false}
                      isAnswered={previewAnswer !== undefined && previewAnswer !== null}
                      isCorrect={isAnswerCorrect(editingQuestion as TestQuestion, previewAnswer)}
                      accentColor={courseConfig.accentHex}
                    />
                  </div>
                ) : (
                  /* ================= FORM EDITOR TAB ================= */
                  <div className="space-y-6">
                    {/* Pending Type Switch Redrafting Banner */}
                    {pendingTypeSwitch && (
                      <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-200 space-y-3">
                        <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-amber-400">
                          <AlertCircle size={16} className="shrink-0" />
                          <span>Redraft this question as {QUESTION_TYPES.find(t => t.id === pendingTypeSwitch.newType)?.label || pendingTypeSwitch.newType}?</span>
                        </div>
                        <p className="text-xs text-amber-200/90 leading-relaxed">
                          You are changing question type from <strong>{QUESTION_TYPES.find(t => t.id === pendingTypeSwitch.oldType)?.label}</strong> to <strong>{QUESTION_TYPES.find(t => t.id === pendingTypeSwitch.newType)?.label}</strong>. You can automatically redraft the current question text in the new type or start empty.
                        </p>
                        <div className="flex flex-wrap items-center gap-2.5 pt-1">
                          <button
                            type="button"
                            onClick={() => handleRedraftAsNewType(pendingTypeSwitch.newType)}
                            disabled={isRedrafting}
                            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md disabled:opacity-50 cursor-pointer"
                          >
                            {isRedrafting ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                            <span>Redraft as {QUESTION_TYPES.find(t => t.id === pendingTypeSwitch.newType)?.label}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStartEmptyNewType(pendingTypeSwitch.newType)}
                            disabled={isRedrafting}
                            className="px-4 py-2 rounded-xl bg-[var(--bg-card)] hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider border border-[var(--border-color)] transition-colors cursor-pointer"
                          >
                            Start Empty
                          </button>

                          <button
                            type="button"
                            onClick={() => setPendingTypeSwitch(null)}
                            disabled={isRedrafting}
                            className="px-3 py-2 text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
                          >
                            Keep {QUESTION_TYPES.find(t => t.id === pendingTypeSwitch.oldType)?.label}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* AI Draft Provenance Label & Visible Reminders */}
                    {editingQuestion.aiDrafted && (
                      <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-indigo-400">
                            <Sparkles size={15} />
                            <span>AI draft: check before saving</span>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                            aiDrafted: true
                          </span>
                        </div>

                        {editingQuestion.type === 'terminal' && (
                          <div className="text-xs text-amber-300 font-medium flex items-center gap-2 pt-1 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                            <AlertCircle size={15} className="shrink-0 text-amber-400" />
                            <span>Verify the command output and accepted commands before saving.</span>
                          </div>
                        )}

                        {editingQuestion.type === 'image' && (
                          <div className="text-xs text-cyan-300 font-medium space-y-1.5 pt-1 bg-cyan-500/10 p-2.5 rounded-xl border border-cyan-500/20">
                            <div className="flex items-center gap-2">
                              <AlertCircle size={15} className="shrink-0 text-cyan-400" />
                              <span>Add your own photo and check the alt text.</span>
                            </div>
                            {editingQuestion.imageIdea && (
                              <div className="text-[11px] text-cyan-200/90 pl-6">
                                <strong>Suggested Diagram:</strong> {editingQuestion.imageIdea}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Row 1: Type Dropdown, Domain, Difficulty */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Type Dropdown */}
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest font-black text-[var(--text-muted)]">
                          Question Type *
                        </label>
                        <div className="relative">
                          <select
                            value={pendingTypeSwitch ? pendingTypeSwitch.newType : (editingQuestion.type || 'choice')}
                            onChange={(e) => {
                              const newType = e.target.value as QuestionType;
                              const currentActiveType = editingQuestion.type || 'choice';
                              if (newType === currentActiveType) {
                                setPendingTypeSwitch(null);
                                return;
                              }

                              const hasSubstantiveContent = Boolean(
                                editingQuestion.text?.trim() ||
                                editingQuestion.explanation?.trim() ||
                                (editingQuestion.options && editingQuestion.options.some(o => o?.trim())) ||
                                (editingQuestion.steps && editingQuestion.steps.some(s => s?.trim())) ||
                                (editingQuestion.pairs && editingQuestion.pairs.some(p => p.left?.trim() || p.right?.trim())) ||
                                (editingQuestion.acceptedAnswers && editingQuestion.acceptedAnswers.some(a => a?.trim())) ||
                                (editingQuestion.acceptedCommands && editingQuestion.acceptedCommands.some(c => c?.trim())) ||
                                editingQuestion.aiDrafted
                              );

                              if (hasSubstantiveContent) {
                                setPendingTypeSwitch({ newType, oldType: currentActiveType });
                              } else {
                                const templated = createDefaultQuestion(newType);
                                setEditingQuestion({
                                  ...templated,
                                  id: editingQuestion.id,
                                  domain: editingQuestion.domain,
                                  difficulty: editingQuestion.difficulty,
                                  course
                                });
                                setPendingTypeSwitch(null);
                              }
                            }}
                            className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-3.5 text-[var(--text-main)] focus:border-indigo-500 transition-all appearance-none font-bold pr-10 text-xs"
                          >
                            {QUESTION_TYPES.map(t => (
                              <option key={t.id} value={t.id}>{t.label}</option>
                            ))}
                          </select>
                          <ChevronRight size={16} className="rotate-90 absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                        </div>
                      </div>

                      {/* Domain Selector */}
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest font-black text-[var(--text-muted)]">
                          Domain *
                        </label>
                        <div className="relative">
                          <select 
                            value={editingQuestion.domain || ''}
                            onChange={(e) => setEditingQuestion({...editingQuestion, domain: e.target.value})}
                            className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-3.5 text-[var(--text-main)] focus:border-indigo-500 transition-all appearance-none font-bold pr-10 text-xs"
                          >
                            <option value="" disabled>Select domain...</option>
                            {availableDomains.map(d => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                          </select>
                          <ChevronRight size={16} className="rotate-90 absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                        </div>
                      </div>

                      {/* Difficulty Selector */}
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest font-black text-[var(--text-muted)]">
                          Difficulty
                        </label>
                        <div className="relative">
                          <select 
                            value={editingQuestion.difficulty || 'Medium'}
                            onChange={(e) => setEditingQuestion({...editingQuestion, difficulty: e.target.value as any})}
                            className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-3.5 text-[var(--text-main)] focus:border-indigo-500 transition-all appearance-none font-bold pr-10 text-xs"
                          >
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                          </select>
                          <ChevronRight size={16} className="rotate-90 absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    {/* "Draft with AI" Panel (Sits near the Question Type selector, uses currently active type) */}
                    <AiDraftPanel
                      currentType={editingQuestion.type || 'choice'}
                      course={course}
                      courseName={courseConfig.name}
                      courseDescription={courseConfig.description}
                      domainId={editingQuestion.domain}
                      domainName={availableDomains.find(d => d.id === editingQuestion.domain)?.name || 'General Objectives'}
                      difficulty={editingQuestion.difficulty || 'Medium'}
                      onUseDraft={applyDraftToForm}
                      accentColor={courseConfig.accentHex}
                    />

                    {/* Question Text (Common to all types) */}
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-black text-[var(--text-muted)]">
                        Question Text (Plain text only) *
                      </label>
                      <textarea 
                        value={editingQuestion.text || ''}
                        onChange={(e) => setEditingQuestion({...editingQuestion, text: e.target.value})}
                        rows={3}
                        placeholder="Enter the question or scenario prompt..."
                        className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-4 text-[var(--text-main)] focus:border-indigo-500 transition-all resize-none text-sm font-medium"
                      />
                    </div>

                    {/* ================= TYPE-SPECIFIC FIELDS ================= */}

                    {/* 1. IMAGE QUESTION FIELDS */}
                    {editingQuestion.type === 'image' && (
                      <div className="space-y-4 p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)]">
                        <h4 className="text-xs font-black uppercase tracking-wider text-[var(--text-main)] flex items-center gap-2">
                          <ImageIcon size={16} className="text-cyan-400" /> Diagram / Image Settings
                        </h4>

                        {/* Image Uploader & Preview */}
                        <div className="space-y-3">
                          <label className="text-[10px] uppercase tracking-widest font-black text-[var(--text-muted)]">
                            Upload Diagram (JPEG, PNG, WebP • Max 2 MB) *
                          </label>

                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleImageFileSelect}
                            className="hidden"
                          />

                          {editingQuestion.imageUrl ? (
                            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border border-[var(--border-color)] bg-black/40">
                              <img
                                src={editingQuestion.imageUrl}
                                alt={editingQuestion.imageAlt || 'Uploaded Diagram'}
                                className="w-32 h-24 object-contain rounded-lg border border-white/10 bg-black"
                              />
                              <div className="flex-1 space-y-1 text-xs">
                                <span className="font-bold text-white block">Diagram Uploaded</span>
                                <span className="text-[10px] text-gray-400 font-mono break-all line-clamp-1">
                                  {editingQuestion.imagePath || editingQuestion.imageUrl}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => fileInputRef.current?.click()}
                                  className="px-3 py-2 bg-[var(--bg-card)] hover:bg-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors border border-[var(--border-color)]"
                                >
                                  Replace
                                </button>
                                <button
                                  type="button"
                                  onClick={handleRemoveImage}
                                  className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors border border-rose-500/20"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div 
                              onClick={() => fileInputRef.current?.click()}
                              className="border-2 border-dashed border-[var(--border-color)] hover:border-indigo-500/50 p-6 rounded-2xl text-center cursor-pointer transition-colors space-y-2 group"
                            >
                              <Upload size={24} className="mx-auto text-[var(--text-muted)] group-hover:text-indigo-400 transition-colors" />
                              <p className="text-xs font-bold text-[var(--text-main)]">
                                {isUploadingImage ? 'Uploading Diagram...' : 'Click to select diagram image'}
                              </p>
                              <p className="text-[10px] text-[var(--text-muted)]">
                                JPEG, PNG, or WebP under 2 MB
                              </p>
                            </div>
                          )}

                          {/* Progress bar */}
                          {isUploadingImage && uploadProgress !== null && (
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] font-mono text-[var(--text-muted)]">
                                <span>Uploading...</span>
                                <span>{uploadProgress}%</span>
                              </div>
                              <div className="h-1.5 bg-black rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-cyan-400 transition-all duration-150" 
                                  style={{ width: `${uploadProgress}%` }} 
                                />
                              </div>
                            </div>
                          )}

                          {/* Required Alt Text */}
                          <div className="space-y-1.5 pt-2">
                            <label className="text-[9px] uppercase tracking-widest font-black text-[var(--text-muted)]">
                              Diagram Alt Text (Required plain text description) *
                            </label>
                            <input
                              type="text"
                              value={editingQuestion.imageAlt || ''}
                              onChange={(e) => setEditingQuestion({...editingQuestion, imageAlt: e.target.value})}
                              placeholder="e.g. Motherboard schematic showing ATX 24-pin power connector"
                              className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-3 text-xs text-[var(--text-main)] focus:border-indigo-500 transition-all"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 2. CHOICE & IMAGE OPTIONS EDITOR */}
                    {(editingQuestion.type === 'choice' || editingQuestion.type === 'image' || !editingQuestion.type) && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] uppercase tracking-widest font-black text-[var(--text-muted)]">
                            Answer Options (Select the correct radio button) *
                          </label>
                          {(editingQuestion.options || []).length < 8 && (
                            <button
                              type="button"
                              onClick={() => {
                                const cur = editingQuestion.options || [];
                                setEditingQuestion({ ...editingQuestion, options: [...cur, ''] });
                              }}
                              className="text-[9px] font-black uppercase tracking-wider text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                            >
                              <Plus size={12} /> Add Option
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {(editingQuestion.options || ['', '', '', '']).map((opt, oIndex) => (
                            <div key={oIndex} className="space-y-1.5 bg-[var(--bg-surface)] p-3 rounded-2xl border border-[var(--border-color)]">
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] uppercase tracking-widest font-black text-[var(--text-muted)]">
                                  Option {String.fromCharCode(65 + oIndex)}
                                </span>
                                <div className="flex items-center gap-2">
                                  <button 
                                    type="button"
                                    onClick={() => setEditingQuestion({...editingQuestion, correctAnswer: oIndex})}
                                    className={`text-[8px] uppercase tracking-widest font-black px-2 py-0.5 rounded transition-colors ${
                                      editingQuestion.correctAnswer === oIndex 
                                        ? 'bg-emerald-600 text-white' 
                                        : 'bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-color)]'
                                    }`}
                                  >
                                    {editingQuestion.correctAnswer === oIndex ? 'Correct Answer' : 'Mark Correct'}
                                  </button>
                                  {(editingQuestion.options || []).length > 2 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const cur = [...(editingQuestion.options || [])];
                                        cur.splice(oIndex, 1);
                                        const newCorrect = (editingQuestion.correctAnswer || 0) >= cur.length ? 0 : editingQuestion.correctAnswer;
                                        setEditingQuestion({ ...editingQuestion, options: cur, correctAnswer: newCorrect });
                                      }}
                                      className="text-[var(--text-muted)] hover:text-rose-400 p-1"
                                      title="Remove option"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  )}
                                </div>
                              </div>
                              <input 
                                type="text"
                                value={opt}
                                onChange={(e) => {
                                  const newOptions = [...(editingQuestion.options || [])];
                                  newOptions[oIndex] = e.target.value;
                                  setEditingQuestion({...editingQuestion, options: newOptions});
                                }}
                                placeholder={`Enter text for option ${String.fromCharCode(65 + oIndex)}`}
                                className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-2.5 text-xs text-[var(--text-main)] focus:border-indigo-500 transition-all"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 3. MULTI-SELECT OPTIONS EDITOR */}
                    {editingQuestion.type === 'multi' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] uppercase tracking-widest font-black text-[var(--text-muted)]">
                            Answer Options (Check all correct boxes) *
                          </label>
                          {(editingQuestion.options || []).length < 8 && (
                            <button
                              type="button"
                              onClick={() => {
                                const cur = editingQuestion.options || [];
                                setEditingQuestion({ ...editingQuestion, options: [...cur, ''] });
                              }}
                              className="text-[9px] font-black uppercase tracking-wider text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                            >
                              <Plus size={12} /> Add Option
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {(editingQuestion.options || ['', '', '', '']).map((opt, oIndex) => {
                            const isCorrect = (editingQuestion.correctAnswers || []).includes(oIndex);

                            return (
                              <div key={oIndex} className="space-y-1.5 bg-[var(--bg-surface)] p-3 rounded-2xl border border-[var(--border-color)]">
                                <div className="flex items-center justify-between">
                                  <span className="text-[9px] uppercase tracking-widest font-black text-[var(--text-muted)]">
                                    Option {String.fromCharCode(65 + oIndex)}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <button 
                                      type="button"
                                      onClick={() => {
                                        const cur = editingQuestion.correctAnswers || [];
                                        const updated = cur.includes(oIndex)
                                          ? cur.filter(i => i !== oIndex)
                                          : [...cur, oIndex];
                                        setEditingQuestion({...editingQuestion, correctAnswers: updated});
                                      }}
                                      className={`text-[8px] uppercase tracking-widest font-black px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
                                        isCorrect 
                                          ? 'bg-emerald-600 text-white' 
                                          : 'bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-color)]'
                                      }`}
                                    >
                                      {isCorrect ? '✓ Correct Option' : 'Mark Correct'}
                                    </button>
                                    {(editingQuestion.options || []).length > 2 && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const cur = [...(editingQuestion.options || [])];
                                          cur.splice(oIndex, 1);
                                          // re-map correctAnswers indexes
                                          const updatedCorrect = (editingQuestion.correctAnswers || [])
                                            .filter(i => i !== oIndex)
                                            .map(i => (i > oIndex ? i - 1 : i));
                                          setEditingQuestion({ ...editingQuestion, options: cur, correctAnswers: updatedCorrect });
                                        }}
                                        className="text-[var(--text-muted)] hover:text-rose-400 p-1"
                                        title="Remove option"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <input 
                                  type="text"
                                  value={opt}
                                  onChange={(e) => {
                                    const newOptions = [...(editingQuestion.options || [])];
                                    newOptions[oIndex] = e.target.value;
                                    setEditingQuestion({...editingQuestion, options: newOptions});
                                  }}
                                  placeholder={`Enter option ${String.fromCharCode(65 + oIndex)} text`}
                                  className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-2.5 text-xs text-[var(--text-main)] focus:border-indigo-500 transition-all"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 4. FILL-IN-THE-BLANK EDITOR */}
                    {editingQuestion.type === 'fill' && (
                      <div className="space-y-4 p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)]">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] uppercase tracking-widest font-black text-[var(--text-muted)]">
                            Accepted Answers (Add alternative valid spellings/synonyms) *
                          </label>
                          {(editingQuestion.acceptedAnswers || []).length < 12 && (
                            <button
                              type="button"
                              onClick={() => {
                                const cur = editingQuestion.acceptedAnswers || [];
                                setEditingQuestion({ ...editingQuestion, acceptedAnswers: [...cur, ''] });
                              }}
                              className="text-[9px] font-black uppercase tracking-wider text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                            >
                              <Plus size={12} /> Add Accepted Answer
                            </button>
                          )}
                        </div>

                        <div className="space-y-2">
                          {(editingQuestion.acceptedAnswers || ['']).map((ans, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="font-mono text-xs text-[var(--text-muted)] w-6 text-center">
                                #{idx + 1}
                              </span>
                              <input
                                type="text"
                                value={ans}
                                onChange={(e) => {
                                  const updated = [...(editingQuestion.acceptedAnswers || [])];
                                  updated[idx] = e.target.value;
                                  setEditingQuestion({ ...editingQuestion, acceptedAnswers: updated });
                                }}
                                placeholder="e.g. 443 or port 443"
                                className="flex-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-3 text-xs text-[var(--text-main)] focus:border-indigo-500"
                              />
                              {(editingQuestion.acceptedAnswers || []).length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...(editingQuestion.acceptedAnswers || [])];
                                    updated.splice(idx, 1);
                                    setEditingQuestion({ ...editingQuestion, acceptedAnswers: updated });
                                  }}
                                  className="p-2 text-[var(--text-muted)] hover:text-rose-400"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Case sensitivity checkbox */}
                        <label className="flex items-center gap-2 pt-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={Boolean(editingQuestion.caseSensitive)}
                            onChange={(e) => setEditingQuestion({...editingQuestion, caseSensitive: e.target.checked})}
                            className="rounded border-[var(--border-color)] text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                          />
                          <span className="text-xs font-bold text-[var(--text-main)]">
                            Case-sensitive match (requires exact casing)
                          </span>
                        </label>
                      </div>
                    )}

                    {/* 5. MATCHING PAIRS EDITOR */}
                    {editingQuestion.type === 'match' && (
                      <div className="space-y-4 p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)]">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] uppercase tracking-widest font-black text-[var(--text-muted)]">
                            Matching Pairs (2–8 pairs) *
                          </label>
                          {(editingQuestion.pairs || []).length < 8 && (
                            <button
                              type="button"
                              onClick={() => {
                                const cur = editingQuestion.pairs || [];
                                setEditingQuestion({ ...editingQuestion, pairs: [...cur, { left: '', right: '' }] });
                              }}
                              className="text-[9px] font-black uppercase tracking-wider text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                            >
                              <Plus size={12} /> Add Pair
                            </button>
                          )}
                        </div>

                        <div className="space-y-3">
                          {(editingQuestion.pairs || []).map((pair, idx) => (
                            <div key={idx} className="p-3 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] flex flex-col sm:flex-row items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-[var(--bg-surface)] font-mono text-xs font-black flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <input
                                type="text"
                                value={pair.left}
                                onChange={(e) => {
                                  const updated = [...(editingQuestion.pairs || [])];
                                  updated[idx] = { ...pair, left: e.target.value };
                                  setEditingQuestion({ ...editingQuestion, pairs: updated });
                                }}
                                placeholder="Column A (Prompt)"
                                className="w-full sm:w-1/2 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-2.5 text-xs text-[var(--text-main)] focus:border-indigo-500"
                              />
                              <span className="text-[var(--text-muted)] text-xs font-black px-1">↔</span>
                              <input
                                type="text"
                                value={pair.right}
                                onChange={(e) => {
                                  const updated = [...(editingQuestion.pairs || [])];
                                  updated[idx] = { ...pair, right: e.target.value };
                                  setEditingQuestion({ ...editingQuestion, pairs: updated });
                                }}
                                placeholder="Column B (Matching Target)"
                                className="w-full sm:w-1/2 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-2.5 text-xs text-[var(--text-main)] focus:border-indigo-500"
                              />
                              {(editingQuestion.pairs || []).length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...(editingQuestion.pairs || [])];
                                    updated.splice(idx, 1);
                                    setEditingQuestion({ ...editingQuestion, pairs: updated });
                                  }}
                                  className="p-2 text-[var(--text-muted)] hover:text-rose-400 shrink-0"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 6. SEQUENCE ORDERING EDITOR */}
                    {editingQuestion.type === 'order' && (
                      <div className="space-y-4 p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)]">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] uppercase tracking-widest font-black text-[var(--text-muted)]">
                            Correct Sequence (Enter in chronological order 1 to N, 3–8 steps) *
                          </label>
                          {(editingQuestion.steps || []).length < 8 && (
                            <button
                              type="button"
                              onClick={() => {
                                const cur = editingQuestion.steps || [];
                                setEditingQuestion({ ...editingQuestion, steps: [...cur, ''] });
                              }}
                              className="text-[9px] font-black uppercase tracking-wider text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                            >
                              <Plus size={12} /> Add Step
                            </button>
                          )}
                        </div>

                        <div className="space-y-2">
                          {(editingQuestion.steps || []).map((step, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-2 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)]">
                              <span className="w-7 h-7 rounded-lg bg-[var(--bg-surface)] font-mono text-xs font-black flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <input
                                type="text"
                                value={step}
                                onChange={(e) => {
                                  const updated = [...(editingQuestion.steps || [])];
                                  updated[idx] = e.target.value;
                                  setEditingQuestion({ ...editingQuestion, steps: updated });
                                }}
                                placeholder={`Step ${idx + 1} description`}
                                className="flex-1 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-2.5 text-xs text-[var(--text-main)] focus:border-indigo-500"
                              />

                              {/* Up / Down Controls in editor */}
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => {
                                  const updated = [...(editingQuestion.steps || [])];
                                  const [moved] = updated.splice(idx, 1);
                                  updated.splice(idx - 1, 0, moved);
                                  setEditingQuestion({ ...editingQuestion, steps: updated });
                                }}
                                className="p-1.5 rounded-lg bg-[var(--bg-surface)] disabled:opacity-20 text-[var(--text-muted)] hover:text-white"
                                title="Move up"
                              >
                                <ArrowUp size={14} />
                              </button>
                              <button
                                type="button"
                                disabled={idx === (editingQuestion.steps || []).length - 1}
                                onClick={() => {
                                  const updated = [...(editingQuestion.steps || [])];
                                  const [moved] = updated.splice(idx, 1);
                                  updated.splice(idx + 1, 0, moved);
                                  setEditingQuestion({ ...editingQuestion, steps: updated });
                                }}
                                className="p-1.5 rounded-lg bg-[var(--bg-surface)] disabled:opacity-20 text-[var(--text-muted)] hover:text-white"
                                title="Move down"
                              >
                                <ArrowDown size={14} />
                              </button>
                              {(editingQuestion.steps || []).length > 3 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...(editingQuestion.steps || [])];
                                    updated.splice(idx, 1);
                                    setEditingQuestion({ ...editingQuestion, steps: updated });
                                  }}
                                  className="p-1.5 text-[var(--text-muted)] hover:text-rose-400"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 7. TERMINAL SIMULATION EDITOR */}
                    {editingQuestion.type === 'terminal' && (
                      <div className="space-y-4 p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)]">
                        <h4 className="text-xs font-black uppercase tracking-wider text-[var(--text-main)] flex items-center gap-2">
                          <Terminal size={16} className="text-emerald-400" /> CLI Terminal Parameters
                        </h4>

                        {/* Task Prompt */}
                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase tracking-widest font-black text-[var(--text-muted)]">
                            Task Prompt (Terminal Instruction) *
                          </label>
                          <input
                            type="text"
                            value={editingQuestion.prompt || ''}
                            onChange={(e) => setEditingQuestion({...editingQuestion, prompt: e.target.value})}
                            placeholder="e.g. Test connectivity to the default gateway at 192.168.1.1"
                            className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-3 text-xs text-[var(--text-main)] focus:border-indigo-500"
                          />
                        </div>

                        {/* Accepted Commands List */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[9px] uppercase tracking-widest font-black text-[var(--text-muted)]">
                              Accepted Commands (Commands that count as correct) *
                            </label>
                            {(editingQuestion.acceptedCommands || []).length < 12 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const cur = editingQuestion.acceptedCommands || [];
                                  setEditingQuestion({ ...editingQuestion, acceptedCommands: [...cur, ''] });
                                }}
                                className="text-[9px] font-black uppercase tracking-wider text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                              >
                                <Plus size={12} /> Add Variation
                              </button>
                            )}
                          </div>

                          <div className="space-y-2">
                            {(editingQuestion.acceptedCommands || ['']).map((cmd, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <span className="font-mono text-xs text-emerald-400 font-bold">$</span>
                                <input
                                  type="text"
                                  value={cmd}
                                  onChange={(e) => {
                                    const updated = [...(editingQuestion.acceptedCommands || [])];
                                    updated[idx] = e.target.value;
                                    setEditingQuestion({ ...editingQuestion, acceptedCommands: updated });
                                  }}
                                  placeholder="e.g. ping 192.168.1.1"
                                  className="flex-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-2.5 font-mono text-xs text-[var(--text-main)] focus:border-indigo-500"
                                />
                                {(editingQuestion.acceptedCommands || []).length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = [...(editingQuestion.acceptedCommands || [])];
                                      updated.splice(idx, 1);
                                      setEditingQuestion({ ...editingQuestion, acceptedCommands: updated });
                                    }}
                                    className="p-2 text-[var(--text-muted)] hover:text-rose-400"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Simulated Output */}
                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase tracking-widest font-black text-[var(--text-muted)]">
                            Simulated Terminal Output (Shown after successful command)
                          </label>
                          <textarea
                            value={editingQuestion.simulatedOutput || ''}
                            onChange={(e) => setEditingQuestion({...editingQuestion, simulatedOutput: e.target.value})}
                            rows={3}
                            placeholder="e.g. Reply from 192.168.1.1: bytes=32 time=2ms TTL=64"
                            className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-3 font-mono text-xs text-[var(--text-main)] focus:border-indigo-500 resize-none"
                          />
                        </div>

                        {/* Optional Hint */}
                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase tracking-widest font-black text-[var(--text-muted)]">
                            Optional Student Hint
                          </label>
                          <input
                            type="text"
                            value={editingQuestion.hint || ''}
                            onChange={(e) => setEditingQuestion({...editingQuestion, hint: e.target.value})}
                            placeholder="e.g. Use the standard ICMP utility"
                            className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-3 text-xs text-[var(--text-main)] focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    )}

                    {/* Explanation (Common to all types) */}
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-black text-[var(--text-muted)]">
                        Technical Explanation (Displayed in Practice mode and Review mode)
                      </label>
                      <textarea 
                        value={editingQuestion.explanation || ''}
                        onChange={(e) => setEditingQuestion({...editingQuestion, explanation: e.target.value})}
                        rows={3}
                        placeholder="Explain the technical concepts, protocol details, or troubleshooting steps..."
                        className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-4 text-[var(--text-main)] focus:border-indigo-500 transition-all resize-none text-sm font-medium"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer Controls */}
              <div className="p-5 md:p-8 bg-[var(--bg-surface)] border-t border-[var(--border-color)] flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div>
                  {editingQuestion.id && (
                    <button
                      type="button"
                      onClick={() => handleDuplicate(editingQuestion as TestQuestion)}
                      className="px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-[var(--text-muted)] hover:text-white transition-colors border border-[var(--border-color)] hover:border-indigo-500/50 flex items-center gap-1.5"
                    >
                      <Copy size={14} /> Duplicate
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {editingQuestion.aiDrafted && (
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-amber-300 select-none bg-amber-500/10 px-3.5 py-2 rounded-xl border border-amber-500/20 hover:bg-amber-500/15 transition-colors">
                      <input
                        type="checkbox"
                        checked={isAiAccuracyConfirmed}
                        onChange={(e) => setIsAiAccuracyConfirmed(e.target.checked)}
                        className="w-4 h-4 rounded border-amber-500 text-indigo-600 focus:ring-0 cursor-pointer"
                      />
                      <span>I have checked this answer is correct</span>
                    </label>
                  )}

                  <button 
                    type="button"
                    onClick={() => {
                      setEditingQuestion(null);
                      setPendingTypeSwitch(null);
                      setIsAiAccuracyConfirmed(false);
                    }}
                    className="px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button"
                    onClick={handleSaveTestQuestion}
                    disabled={isSaving || isUploadingImage || (Boolean(editingQuestion.aiDrafted) && !isAiAccuracyConfirmed)}
                    className="px-8 py-3 rounded-xl font-black text-xs uppercase tracking-wider text-white shadow-md transition-all flex items-center gap-2 disabled:opacity-50 hover:opacity-90 cursor-pointer"
                    style={{ backgroundColor: courseConfig.accentHex }}
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={15} />}
                    Save Question
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

export default AdminQuestionsTab;
