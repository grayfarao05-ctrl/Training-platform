import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  FileText, 
  Briefcase, 
  Calendar, 
  ShieldCheck, 
  Download, 
  Loader2, 
  CheckCircle2, 
  Info,
  GraduationCap
} from 'lucide-react';
import { 
  UserStats, 
  CourseConfig, 
  ReportType, 
  ReportDateRange, 
  ReportDoc, 
  ReportVerificationDoc 
} from '../../types';
import { 
  generateReportId, 
  buildReportData, 
  saveReportRecord, 
  saveReportVerification 
} from '../../reportService';
import { 
  downloadProgressReport, 
  downloadEmployerSummary 
} from '../../pdfTemplates';
import { auth } from '../../firebase';

interface ReportGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: UserStats | null;
  courses: CourseConfig[];
  defaultCourseId?: string;
  onReportGenerated?: (report: ReportDoc) => void;
  setAdminFeedback: (msg: string | null) => void;
}

export const ReportGeneratorModal: React.FC<ReportGeneratorModalProps> = ({
  isOpen,
  onClose,
  student,
  courses,
  defaultCourseId,
  onReportGenerated,
  setAdminFeedback
}) => {
  if (!isOpen || !student) return null;

  const [reportType, setReportType] = useState<ReportType>('progress');
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    defaultCourseId || courses[0]?.id || 'a-plus'
  );
  const [datePreset, setDatePreset] = useState<'30days' | 'custom' | 'all'>('30days');
  const [customStart, setCustomStart] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [customEnd, setCustomEnd] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });
  const [tutorComment, setTutorComment] = useState<string>('');
  const [employerConsentChecked, setEmployerConsentChecked] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const selectedCourse = courses.find(c => c.id === selectedCourseId) || courses[0];

  // Resolve actual date range
  const getDateRange = (): ReportDateRange => {
    const todayStr = new Date().toISOString().slice(0, 10);
    if (datePreset === '30days') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      return {
        start: d.toISOString().slice(0, 10),
        end: todayStr,
        preset: '30days',
        isAllTime: false
      };
    }
    if (datePreset === 'all') {
      return {
        start: '2023-01-01',
        end: todayStr,
        preset: 'all',
        isAllTime: true
      };
    }
    return {
      start: customStart || todayStr,
      end: customEnd || todayStr,
      preset: 'custom',
      isAllTime: false
    };
  };

  const handleGenerate = async () => {
    if (reportType === 'employer' && !employerConsentChecked) return;

    setIsGenerating(true);
    try {
      const reportId = generateReportId();
      const dateRange = getDateRange();

      // Build pure report data
      const data = await buildReportData(
        student.uid,
        selectedCourseId,
        dateRange,
        tutorComment.trim(),
        {
          userStats: student,
          courseConfig: selectedCourse
        }
      );

      const adminIdentifier = auth.currentUser?.email || auth.currentUser?.uid || 'admin';

      // 1. Save Report Record into reports/{reportId}
      const reportDoc: ReportDoc = {
        id: reportId,
        type: reportType,
        studentUid: student.uid,
        courseId: selectedCourseId,
        periodStart: dateRange.start,
        periodEnd: dateRange.end,
        issuedAt: new Date().toISOString(),
        issuedBy: adminIdentifier,
        tutorComment: tutorComment.trim(),
        consent: {
          confirmed: reportType === 'employer' ? employerConsentChecked : false,
          confirmedBy: adminIdentifier,
          date: new Date().toISOString()
        },
        snapshot: {
          testAverage: data.tests.averageScore ?? null,
          totalTests: data.tests.totalCount,
          bestScore: data.tests.bestScore ?? null,
          objectivesCompleted: data.objectives.completedCount,
          objectivesTotal: data.objectives.totalCount,
          studyHours: data.effort.recordedStudyHours,
          examReadiness: data.examReadiness.percentage,
          streak: data.effort.currentStreak,
          xp: data.engagement.xp,
          level: data.engagement.level
        },
        ...(reportType === 'employer' ? { status: 'valid' as const } : {})
      };

      await saveReportRecord(reportDoc);

      // 2. If Employer Summary, create public verification document in report_verifications/{reportId}
      const verifyUrl = `${window.location.origin}/?verify=${reportId}`;
      if (reportType === 'employer') {
        const verificationDoc: ReportVerificationDoc = {
          id: reportId,
          type: 'employer',
          studentDisplayName: data.student.maskedName,
          courseName: selectedCourse.name,
          periodStart: dateRange.start,
          periodEnd: dateRange.end,
          issuedAt: reportDoc.issuedAt,
          testAverage: data.tests.averageScore ?? null,
          objectivesCompleted: data.objectives.completedCount,
          objectivesTotal: data.objectives.totalCount,
          status: 'valid'
        };
        await saveReportVerification(verificationDoc);
      }

      // 3. Trigger Download
      if (reportType === 'progress') {
        downloadProgressReport(data, reportId);
        setAdminFeedback(`Progress report generated & downloaded for ${student.displayName}!`);
        setTimeout(() => setAdminFeedback(null), 4000);
      } else {
        downloadEmployerSummary(data, reportId, verifyUrl);
        setAdminFeedback(`Employer summary generated, verified & downloaded for ${student.displayName}!`);
        setTimeout(() => setAdminFeedback(null), 4000);
      }

      if (onReportGenerated) {
        onReportGenerated(reportDoc);
      }

      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err: any) {
      console.error('Error generating report:', err);
      setAdminFeedback(`Failed to generate report: ${err?.message || 'Unknown error'}`);
      setTimeout(() => setAdminFeedback(null), 5000);
    } finally {
      setIsGenerating(false);
    }
  };

  const isDownloadDisabled = isGenerating || (reportType === 'employer' && !employerConsentChecked);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 md:p-6">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-[var(--border-color)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white shrink-0 shadow-md"
              style={{ backgroundColor: selectedCourse?.accentHex || '#4f46e5' }}
            >
              <FileText size={22} />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-[var(--text-main)]">
                Generate Student <span style={{ color: selectedCourse?.accentHex || '#4f46e5' }}>Report</span>
              </h2>
              <p className="text-[var(--text-muted)] text-xs font-semibold">
                Candidate: <span className="text-[var(--text-main)] font-black">{student.displayName}</span> ({student.email})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors border border-[var(--border-color)]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-6">
          {/* 1. Report Type Selection */}
          <div className="space-y-2.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">
              Select Report Template
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Progress Report Option */}
              <button
                type="button"
                onClick={() => setReportType('progress')}
                className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 cursor-pointer ${
                  reportType === 'progress'
                    ? 'border-indigo-500 bg-indigo-500/10 shadow-sm shadow-indigo-950/20'
                    : 'border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-indigo-500/40'
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${reportType === 'progress' ? 'bg-indigo-600 text-white' : 'bg-[var(--bg-card)] text-[var(--text-muted)]'}`}>
                  <GraduationCap size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-tight text-[var(--text-main)]">
                    Progress Report
                  </h4>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-snug font-medium">
                    1–2 pages for student, parent, or school. Detailed breakdown with tests, study effort, and engagement.
                  </p>
                </div>
              </button>

              {/* Employer Summary Option */}
              <button
                type="button"
                onClick={() => setReportType('employer')}
                className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 cursor-pointer ${
                  reportType === 'employer'
                    ? 'border-cyan-500 bg-cyan-500/10 shadow-sm shadow-cyan-950/20'
                    : 'border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-cyan-500/40'
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${reportType === 'employer' ? 'bg-cyan-600 text-white' : 'bg-[var(--bg-card)] text-[var(--text-muted)]'}`}>
                  <Briefcase size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-tight text-[var(--text-main)]">
                    Employer Summary
                  </h4>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-snug font-medium">
                    Strictly 1 page, positive & factual. Skills covered, test averages, and public authenticity verification link.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Course Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">
              Curriculum Course Track
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-4 text-[var(--text-main)] text-sm font-bold focus:border-indigo-500 focus:outline-none transition-colors cursor-pointer"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.shortLabel})
                </option>
              ))}
            </select>
          </div>

          {/* 3. Date Range Selection */}
          <div className="space-y-2.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">
              Assessment & Activity Period
            </label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-color)]">
              <button
                type="button"
                onClick={() => setDatePreset('30days')}
                className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  datePreset === '30days'
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                Last 30 Days
              </button>
              <button
                type="button"
                onClick={() => setDatePreset('custom')}
                className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  datePreset === 'custom'
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                Custom Dates
              </button>
              <button
                type="button"
                onClick={() => setDatePreset('all')}
                className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  datePreset === 'all'
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                All Time
              </button>
            </div>

            {/* Custom Dates Inputs */}
            {datePreset === 'custom' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)] block mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-3 text-xs text-[var(--text-main)] font-semibold focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)] block mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-3 text-xs text-[var(--text-main)] font-semibold focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 4. Tutor / Instructor Comment Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">
                Instructor Observation / Evaluation (Optional)
              </label>
              <span className={`text-[10px] font-bold ${tutorComment.length > 550 ? 'text-amber-500' : 'text-[var(--text-muted)]'}`}>
                {tutorComment.length} / 600
              </span>
            </div>
            <textarea
              rows={3}
              maxLength={600}
              value={tutorComment}
              onChange={(e) => setTutorComment(e.target.value)}
              placeholder="e.g., Demonstrated strong practical proficiency in subnetting and hardware diagnostics. Consistently completed drills with disciplined study habits."
              className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-4 text-[var(--text-main)] text-xs font-medium focus:border-indigo-500 focus:outline-none transition-colors resize-none placeholder:text-[var(--text-muted)]/70"
            />
          </div>

          {/* 5. Required Consent Checkbox for Employer Summary */}
          {reportType === 'employer' && (
            <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 space-y-2">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={employerConsentChecked}
                  onChange={(e) => setEmployerConsentChecked(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 border-gray-300"
                />
                <span className="text-xs font-bold text-[var(--text-main)] leading-relaxed">
                  The student (and parent or guardian if under 18) has agreed to this being shared with employers.
                </span>
              </label>
              <p className="text-[10px] text-cyan-400/90 pl-7 font-medium">
                Required for employer records: saving confirms consent audit and creates a public verification document.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 md:p-8 bg-[var(--bg-surface)] border-t border-[var(--border-color)] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={isDownloadDisabled}
            className={`px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              reportType === 'employer'
                ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 hover:brightness-110 shadow-cyan-950/30'
                : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:brightness-110 shadow-indigo-950/30'
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Building PDF...</span>
              </>
            ) : (
              <>
                <Download size={16} />
                <span>Download PDF</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ReportGeneratorModal;
