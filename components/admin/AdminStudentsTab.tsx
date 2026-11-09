import React, { useState, useEffect } from 'react';
import { UserStats, CourseId, CourseDoc, ReportDoc, ReportDateRange } from '../../types';
import { getCourseConfig, getCourseProgress, filterByCourse, withCourse, COURSE_LIST } from '../../courseConfig';
import { subscribeCourses, courseDocToConfig } from '../../coursesService';
import { db, auth, OperationType, handleFirestoreError } from '../../firebase';
import { doc, updateDoc, setDoc, collection, onSnapshot, query, deleteDoc } from 'firebase/firestore';
import { 
  XCircle, 
  Key, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Copy,
  FileText,
  DownloadCloud,
  CheckSquare,
  Square,
  Loader2,
  Briefcase,
  GraduationCap,
  Sparkles,
  Award
} from 'lucide-react';
import { getArchetype, calculateUnlockedLevel, getUnlockedCardsForUser } from '../../galleryService';
import { motion, AnimatePresence } from 'motion/react';
import JSZip from 'jszip';
import { 
  generateReportId, 
  buildReportData, 
  saveReportRecord, 
  getStudentReportsHistory, 
  revokeReportVerification, 
  formatDateEnZA, 
  getReportFileName 
} from '../../reportService';
import { generateProgressReportBlob } from '../../pdfTemplates';
const ReportGeneratorModal = React.lazy(() => import('./ReportGeneratorModal'));

interface UnlockCodeItem {
  id: string;
  code: string;
  course?: CourseId;
  createdAt: string;
  usedBy?: string | null;
  usedAt?: string | null;
}

interface AdminStudentsTabProps {
  users: UserStats[];
  searchTerm: string;
  setAdminFeedback: (msg: string | null) => void;
  course?: CourseId;
}

export const AdminStudentsTab: React.FC<AdminStudentsTabProps> = ({
  users,
  searchTerm,
  setAdminFeedback,
  course = 'a-plus'
}) => {
  const [selectedUser, setSelectedUser] = useState<UserStats | null>(null);
  const [newTaskText, setNewTaskText] = useState('');
  const [sortField, setSortField] = useState<'displayName' | 'level' | 'xp' | 'status'>('xp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [unlockCodes, setUnlockCodes] = useState<UnlockCodeItem[]>([]);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [courseDocs, setCourseDocs] = useState<CourseDoc[]>([]);
  const [codeCourse, setCodeCourse] = useState<CourseId>(course);

  // Report Generator & History State
  const [selectedStudentUids, setSelectedStudentUids] = useState<string[]>([]);
  const [reportModalStudent, setReportModalStudent] = useState<UserStats | null>(null);
  const [studentReports, setStudentReports] = useState<ReportDoc[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [isGeneratingBulkZip, setIsGeneratingBulkZip] = useState(false);
  const [bulkZipProgress, setBulkZipProgress] = useState<{ current: number; total: number } | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  useEffect(() => {
    setCodeCourse(course);
  }, [course]);

  useEffect(() => {
    const unsub = subscribeCourses((docs) => setCourseDocs(docs));
    return () => unsub();
  }, []);

  const allAvailableCourses = courseDocs.length > 0 
    ? courseDocs.map(courseDocToConfig) 
    : COURSE_LIST;

  const targetDoc = courseDocs.find(c => c.id === codeCourse);
  const currentTargetConfig = targetDoc ? courseDocToConfig(targetDoc) : getCourseConfig(codeCourse);
  const courseConfig = getCourseConfig(course);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'unlock_codes'), (snap) => {
      const raw = snap.docs.map(d => ({ ...d.data(), id: d.id } as UnlockCodeItem));
      setUnlockCodes(filterByCourse(raw, codeCourse));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'unlock_codes'));
    return () => unsub();
  }, [codeCourse]);

  // Load student report history when selectedUser opens
  useEffect(() => {
    if (!selectedUser) {
      setStudentReports([]);
      return;
    }
    let isMounted = true;
    setLoadingReports(true);
    getStudentReportsHistory(selectedUser.uid)
      .then(reps => {
        if (isMounted) {
          setStudentReports(reps);
          setLoadingReports(false);
        }
      })
      .catch(err => {
        console.error('Error fetching student report history:', err);
        if (isMounted) setLoadingReports(false);
      });
    return () => { isMounted = false; };
  }, [selectedUser]);

  const handleSelectAllStudents = () => {
    if (selectedStudentUids.length === sortedUsers.length) {
      setSelectedStudentUids([]);
    } else {
      setSelectedStudentUids(sortedUsers.map(u => u.uid));
    }
  };

  const handleToggleSelectStudent = (uid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedStudentUids(prev => 
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

  const handleDownloadBulkProgressZip = async () => {
    if (selectedStudentUids.length === 0) return;
    setIsGeneratingBulkZip(true);
    setBulkZipProgress({ current: 0, total: selectedStudentUids.length });

    try {
      const zip = new JSZip();
      const targetCourseConfig = getCourseConfig(course);
      const todayStr = new Date().toISOString().slice(0, 10);
      const defaultDateRange: ReportDateRange = {
        start: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
        end: todayStr,
        preset: '30days',
        isAllTime: false
      };

      const selectedUsers = users.filter(u => selectedStudentUids.includes(u.uid));
      let count = 0;

      for (let i = 0; i < selectedUsers.length; i++) {
        const student = selectedUsers[i];
        setBulkZipProgress({ current: i + 1, total: selectedUsers.length });

        try {
          const bulkReportId = generateReportId();
          const reportData = await buildReportData(
            student.uid,
            course,
            defaultDateRange,
            '', // blank tutor comment for bulk
            {
              userStats: student,
              courseConfig: targetCourseConfig
            }
          );
          const pdfBlob = await generateProgressReportBlob(reportData, bulkReportId);
          const fileName = getReportFileName(student.displayName, student.email, targetCourseConfig.shortLabel, defaultDateRange.end);
          zip.file(fileName, pdfBlob);
          count++;
        } catch (studentErr) {
          console.error(`Error generating report for ${student.displayName}:`, studentErr);
        }
      }

      if (count > 0) {
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const downloadUrl = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `ITreal_Progress_Reports_${course}_${todayStr}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);

        setAdminFeedback(`Generated ZIP with ${count} student progress reports!`);
        setTimeout(() => setAdminFeedback(null), 4000);
        setSelectedStudentUids([]);
      } else {
        setAdminFeedback('No reports could be generated for selected students.');
        setTimeout(() => setAdminFeedback(null), 4000);
      }
    } catch (err) {
      console.error('Bulk ZIP generation failed:', err);
      setAdminFeedback('Failed to generate bulk ZIP. Please try again.');
      setTimeout(() => setAdminFeedback(null), 4000);
    } finally {
      setIsGeneratingBulkZip(false);
      setBulkZipProgress(null);
    }
  };

  const handleRevokeReport = async (reportId: string) => {
    setRevokingId(reportId);
    try {
      await revokeReportVerification(reportId);
      setStudentReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'revoked' } : r));
      setAdminFeedback('Report verification revoked successfully.');
      setTimeout(() => setAdminFeedback(null), 3000);
    } catch (err) {
      console.error('Failed to revoke report verification:', err);
      setAdminFeedback('Failed to revoke report verification.');
      setTimeout(() => setAdminFeedback(null), 3000);
    } finally {
      setRevokingId(null);
    }
  };

  const handleGenerateCode = async () => {
    setIsGeneratingCode(true);
    try {
      const prefix = (currentTargetConfig.shortLabel || codeCourse).replace(/[^A-Za-z0-9]/g, '').slice(0, 5).toUpperCase() || 'AUTH';
      const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
      const codeStr = `${prefix}-${randomPart}`;
      await setDoc(doc(db, 'unlock_codes', codeStr), withCourse({
        code: codeStr,
        createdAt: new Date().toISOString(),
        usedBy: null,
        usedAt: null
      }, codeCourse));
      setAdminFeedback(`Unlock code generated for ${currentTargetConfig.shortLabel}: ${codeStr}`);
      setTimeout(() => setAdminFeedback(null), 4000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'unlock_codes');
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleDeleteCode = async (codeId: string) => {
    try {
      await deleteDoc(doc(db, 'unlock_codes', codeId));
      setAdminFeedback('Unlock code deleted!');
      setTimeout(() => setAdminFeedback(null), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `unlock_codes/${codeId}`);
    }
  };

  const handleUpdateUserXP = async (uid: string, newXP: number) => {
    try {
      await updateDoc(doc(db, 'users', uid), { xp: newXP });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const handleToggleUserStatus = async (uid: string, currentStatus: string | undefined) => {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    try {
      await updateDoc(doc(db, 'users', uid), { status: newStatus });
      if (selectedUser && selectedUser.uid === uid) {
        setSelectedUser({ ...selectedUser, status: newStatus });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const handleAssignTask = async (uid: string) => {
    if (!newTaskText.trim()) return;
    try {
      await setDoc(doc(collection(db, `users/${uid}/todo`)), withCourse({
        text: newTaskText,
        completed: false,
        createdAt: new Date().toISOString()
      }, course));
      setNewTaskText('');
      setAdminFeedback(`Task assigned for ${courseConfig.shortLabel}!`);
      setTimeout(() => setAdminFeedback(null), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${uid}/todo`);
    }
  };

  const handleSort = (field: 'displayName' | 'level' | 'xp' | 'status') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredUsers = users.filter(u => 
    u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let aVal: any = a[sortField];
    let bVal: any = b[sortField];
    
    if (sortField === 'status') {
      aVal = a.status || 'active';
      bVal = b.status || 'active';
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <>
      <motion.div 
        key="users"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border-color)] overflow-hidden shadow-sm"
      >
        {/* Bulk Action Bar */}
        {selectedStudentUids.length > 0 && (
          <div className="bg-[var(--bg-surface)] border-b border-[var(--border-color)] px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-black text-cyan-400 uppercase tracking-wider">
                {selectedStudentUids.length} {selectedStudentUids.length === 1 ? 'student' : 'students'} selected
              </span>
              <button
                type="button"
                onClick={() => setSelectedStudentUids([])}
                className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-main)] underline font-bold uppercase transition-colors"
              >
                Clear Selection
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadBulkProgressZip}
                disabled={isGeneratingBulkZip}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-md disabled:opacity-50 cursor-pointer"
              >
                {isGeneratingBulkZip ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>
                      Generating ZIP {bulkZipProgress ? `(${bulkZipProgress.current}/${bulkZipProgress.total})` : ''}...
                    </span>
                  </>
                ) : (
                  <>
                    <DownloadCloud size={14} />
                    <span>Download Progress Reports (ZIP)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead>
              <tr className="border-b border-[var(--border-color)] bg-[var(--bg-surface)]">
                <th className="p-5 md:p-6 w-12 text-center" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={handleSelectAllStudents}
                    className="text-[var(--text-muted)] hover:text-cyan-400 transition-colors cursor-pointer"
                    title={selectedStudentUids.length === sortedUsers.length && sortedUsers.length > 0 ? "Deselect All" : "Select All"}
                  >
                    {selectedStudentUids.length > 0 && selectedStudentUids.length === sortedUsers.length ? (
                      <CheckSquare size={16} className="text-cyan-400" />
                    ) : (
                      <Square size={16} />
                    )}
                  </button>
                </th>
                <th className="p-5 md:p-6 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] cursor-pointer hover:text-[var(--text-main)] transition-colors" onClick={() => handleSort('displayName')}>
                  Username {sortField === 'displayName' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-5 md:p-6 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] cursor-pointer hover:text-[var(--text-main)] transition-colors" onClick={() => handleSort('level')}>
                  Rank {sortField === 'level' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-5 md:p-6 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] cursor-pointer hover:text-[var(--text-main)] transition-colors" onClick={() => handleSort('xp')}>
                  Total XP {sortField === 'xp' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-5 md:p-6 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] cursor-pointer hover:text-[var(--text-main)] transition-colors" onClick={() => handleSort('status')}>
                  Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-5 md:p-6 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] text-right">
                  Quick Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {sortedUsers.map(user => {
                const isSelected = selectedStudentUids.includes(user.uid);
                return (
                  <tr 
                    key={user.uid} 
                    onClick={() => setSelectedUser(user)}
                    className={`group hover:bg-[var(--bg-surface)] transition-colors cursor-pointer ${
                      isSelected ? 'bg-cyan-500/5' : ''
                    }`}
                  >
                    <td className="p-5 md:p-6 text-center" onClick={(e) => handleToggleSelectStudent(user.uid, e)}>
                      <button type="button" className="text-[var(--text-muted)] hover:text-cyan-400 transition-colors cursor-pointer">
                        {isSelected ? (
                          <CheckSquare size={16} className="text-cyan-400" />
                        ) : (
                          <Square size={16} />
                        )}
                      </button>
                    </td>
                    <td className="p-5 md:p-6">
                      {(() => {
                        const archetype = getArchetype(user.avatarArchetype);
                        const unlockedCards = getUnlockedCardsForUser(user);
                        const cardLevel = calculateUnlockedLevel(user.xp);
                        const hasSpecial = user.unlockedCardIds && user.unlockedCardIds.some(id => id.startsWith('challenge-'));

                        return (
                          <div className="flex items-center gap-4">
                            <div 
                              className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm overflow-hidden shrink-0 text-white relative border border-white/15 shadow-sm"
                              style={{ backgroundColor: archetype.accentColor || courseConfig.accentHex }}
                            >
                              {user.photoURL ? (
                                <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                              ) : (
                                user.displayName[0]
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-black uppercase tracking-tight text-sm text-[var(--text-main)] transition-colors">
                                  {user.displayName}
                                </h3>

                                {/* Card Achievement Badges next to student name */}
                                <span 
                                  className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider text-black flex items-center gap-1 shadow-xs"
                                  style={{ backgroundColor: archetype.accentColor }}
                                  title={`Active Archetype: ${archetype.name} (${archetype.codename})`}
                                >
                                  ★ {archetype.codename}
                                </span>

                                <span 
                                  className="px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold text-indigo-300 bg-indigo-500/15 border border-indigo-400/25 flex items-center gap-1"
                                  title={`Tactical Cards Collected: ${unlockedCards.length} (Tier ${cardLevel || 1})`}
                                >
                                  🎴 {unlockedCards.length} {unlockedCards.length === 1 ? 'Card' : 'Cards'}
                                </span>

                                {hasSpecial && (
                                  <span 
                                    className="px-1.5 py-0.5 rounded-md text-[9px] font-bold text-amber-300 bg-amber-500/15 border border-amber-400/25 flex items-center gap-1"
                                    title="Special Challenge Award Recipient"
                                  >
                                    <Award size={10} className="text-amber-400" /> Special
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold mt-0.5">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="p-5 md:p-6">
                      <span className="text-xs font-black uppercase tracking-widest bg-[var(--bg-surface)] border border-[var(--border-color)] px-3 py-1 rounded-full text-[var(--text-main)]">LVL {user.level}</span>
                    </td>
                    <td className="p-5 md:p-6">
                      <span className="font-black" style={{ color: courseConfig.accentHex }}>{user.xp.toLocaleString()}</span>
                    </td>
                    <td className="p-5 md:p-6">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${user.status === 'suspended' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                        {user.status === 'suspended' ? 'Suspended' : 'Active'}
                      </span>
                    </td>
                    <td className="p-5 md:p-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setReportModalStudent(user)}
                          className="w-8 h-8 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center justify-center hover:bg-cyan-500 hover:text-slate-950 transition-colors text-[var(--text-main)]"
                          title="Generate Student Report"
                        >
                          <FileText size={14} />
                        </button>
                        <button 
                          onClick={() => handleUpdateUserXP(user.uid, Math.max(0, user.xp - 100))}
                          className="w-8 h-8 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center justify-center hover:bg-rose-600 hover:text-white transition-colors text-[var(--text-main)] font-black text-sm"
                          title="Subtract 100 XP"
                        >-</button>
                        <button 
                          onClick={() => handleUpdateUserXP(user.uid, user.xp + 100)}
                          className="w-8 h-8 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-colors text-[var(--text-main)] font-black text-sm"
                          title="Add 100 XP"
                        >+</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Unlock Codes Management */}
        <div className="p-6 md:p-10 border-t border-[var(--border-color)] bg-[var(--bg-surface)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3 text-[var(--text-main)]">
                <Key size={20} style={{ color: currentTargetConfig.accentHex }} />
                Course <span style={{ color: currentTargetConfig.accentHex }}>Unlock Codes</span>
              </h3>
              <p className="text-[var(--text-muted)] text-xs">Generate codes for students to unlock courses requiring access authorization.</p>
            </div>
            
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <label htmlFor="code-course-dropdown" className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">
                  Course:
                </label>
                <select
                  id="code-course-dropdown"
                  value={codeCourse}
                  onChange={(e) => setCodeCourse(e.target.value)}
                  className="bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {allAvailableCourses.map((c) => {
                    const doc = courseDocs.find(d => d.id === c.id);
                    const requiresCode = doc ? doc.requiresCode : (c.id === 'network-plus');
                    return (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.shortLabel}) {requiresCode ? '• Code Required' : '• Open'}
                      </option>
                    );
                  })}
                </select>
              </div>

              <button
                onClick={handleGenerateCode}
                disabled={isGeneratingCode}
                className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white shadow-md transition-all flex items-center gap-2 hover:opacity-90 cursor-pointer disabled:opacity-50"
                style={{ backgroundColor: currentTargetConfig.accentHex }}
              >
                <Plus size={14} /> Generate Code
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {unlockCodes.length > 0 ? (
              unlockCodes.map((c) => (
                <div key={c.id} className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-2xl flex items-center justify-between shadow-sm">
                  <div>
                    <div className="font-mono font-black text-sm text-[var(--text-main)] tracking-widest">{c.code}</div>
                    <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase mt-1">
                      {c.usedBy ? (
                        <span className="text-amber-500 font-bold">Claimed</span>
                      ) : (
                        <span className="text-emerald-500 font-bold">Available</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteCode(c.id)}
                    className="p-2 text-[var(--text-muted)] hover:text-rose-500 transition-colors"
                    title="Delete code"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-[var(--text-muted)] text-xs italic col-span-full">No unlock codes generated for {courseConfig.shortLabel} yet.</p>
            )}
          </div>
        </div>
      </motion.div>

      {/* User Details Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUser(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 md:p-10 border-b border-[var(--border-color)] flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl overflow-hidden text-white"
                    style={{ backgroundColor: courseConfig.accentHex }}
                  >
                    {selectedUser.photoURL ? <img src={selectedUser.photoURL} alt="" className="w-full h-full object-cover" /> : selectedUser.displayName[0]}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter text-[var(--text-main)]">{selectedUser.displayName}</h2>
                    <p className="text-[var(--text-muted)] text-[10px] uppercase tracking-widest font-bold">{selectedUser.email}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedUser(null)} className="p-3 bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-xl transition-all border border-[var(--border-color)]">
                  <XCircle size={22} />
                </button>
              </div>

              <div className="p-8 md:p-10 space-y-8 max-h-[75vh] overflow-y-auto">
                <div className="flex justify-end gap-3 flex-wrap">
                  <button 
                    type="button"
                    onClick={() => setReportModalStudent(selectedUser)}
                    className="px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500 hover:text-slate-950 flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <FileText size={13} />
                    <span>Generate Report</span>
                  </button>
                  <button 
                    onClick={() => handleToggleUserStatus(selectedUser.uid, selectedUser.status)}
                    className={`px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border ${
                      selectedUser.status === 'suspended' 
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500 hover:text-white' 
                        : 'bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500 hover:text-white'
                    }`}
                  >
                    {selectedUser.status === 'suspended' ? 'Reactivate Account' : 'Suspend Account'}
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-[var(--bg-surface)] p-5 rounded-2xl border border-[var(--border-color)] text-center">
                    <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-widest font-black mb-1">Total XP</p>
                    <span className="text-xl md:text-2xl font-black" style={{ color: courseConfig.accentHex }}>{selectedUser.xp.toLocaleString()}</span>
                  </div>
                  <div className="bg-[var(--bg-surface)] p-5 rounded-2xl border border-[var(--border-color)] text-center">
                    <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-widest font-black mb-1">Level</p>
                    <span className="text-xl md:text-2xl font-black text-[var(--text-main)]">{selectedUser.level}</span>
                  </div>
                  <div className="bg-[var(--bg-surface)] p-5 rounded-2xl border border-[var(--border-color)] text-center">
                    <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-widest font-black mb-1">{courseConfig.shortLabel} Readiness</p>
                    <span className="text-xl md:text-2xl font-black text-[var(--text-main)]">{getCourseProgress(selectedUser, course).examReadiness}%</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] uppercase tracking-widest font-black text-[var(--text-muted)]">Completed {courseConfig.shortLabel} Objectives</h3>
                  <div className="flex flex-wrap gap-2">
                    {getCourseProgress(selectedUser, course).completedObjectives?.length > 0 ? (
                      getCourseProgress(selectedUser, course).completedObjectives.map((id, idx) => (
                        <span key={`${id}-${idx}`} className="px-3 py-1.5 bg-[var(--bg-surface)] rounded-xl text-[10px] font-black uppercase tracking-widest border border-[var(--border-color)] text-[var(--text-main)]">
                          {id}
                        </span>
                      ))
                    ) : (
                      <p className="text-[var(--text-muted)] text-xs italic">No {courseConfig.shortLabel} objectives completed yet.</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] uppercase tracking-widest font-black text-[var(--text-muted)]">Recent Activity</h3>
                  <div className="space-y-2">
                    {selectedUser.activityHistory?.slice(-5).reverse().map((day, i) => (
                      <div key={i} className="flex justify-between items-center p-3 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-color)]">
                        <span className="text-xs font-semibold text-[var(--text-muted)]">{new Date(day.date).toLocaleDateString()}</span>
                        <span className="text-xs font-black text-emerald-500">+{day.count} XP</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] uppercase tracking-widest font-black text-[var(--text-muted)]">Assign Task</h3>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input 
                      type="text" 
                      value={newTaskText}
                      onChange={(e) => setNewTaskText(e.target.value)}
                      placeholder="Enter task description..."
                      className="flex-1 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-3.5 text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-indigo-500 transition-colors font-medium text-sm"
                    />
                    <button 
                      onClick={() => handleAssignTask(selectedUser.uid)}
                      className="px-6 py-3.5 rounded-xl font-black uppercase tracking-widest text-xs text-white shadow-md transition-all hover:opacity-90"
                      style={{ backgroundColor: courseConfig.accentHex }}
                    >
                      Assign
                    </button>
                  </div>
                </div>

                {/* Reports History */}
                <div className="space-y-4 pt-4 border-t border-[var(--border-color)]">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] uppercase tracking-widest font-black text-[var(--text-muted)] flex items-center gap-2">
                      <FileText size={14} className="text-cyan-400" />
                      Reports History
                    </h3>
                    <span className="text-[10px] text-[var(--text-muted)] font-bold">
                      {studentReports.length} {studentReports.length === 1 ? 'record' : 'records'}
                    </span>
                  </div>

                  {loadingReports ? (
                    <div className="flex items-center justify-center py-6 gap-2 text-xs text-[var(--text-muted)]">
                      <Loader2 size={16} className="animate-spin text-cyan-400" />
                      <span>Loading reports history...</span>
                    </div>
                  ) : studentReports.length > 0 ? (
                    <div className="space-y-3">
                      {studentReports.map((rep) => {
                        const repCourse = allAvailableCourses.find(c => c.id === rep.courseId) || getCourseConfig(rep.courseId as CourseId);
                        const isEmployer = rep.type === 'employer';
                        const isRevoked = rep.status === 'revoked';

                        return (
                          <div 
                            key={rep.id}
                            className="p-4 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-color)] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="flex items-start sm:items-center gap-3">
                              <div className={`p-2 rounded-xl shrink-0 ${isEmployer ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'}`}>
                                {isEmployer ? <Briefcase size={16} /> : <GraduationCap size={16} />}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-black uppercase text-[var(--text-main)]">
                                    {isEmployer ? 'Employer Summary' : 'Progress Report'}
                                  </span>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)]">
                                    {repCourse.shortLabel || rep.courseId}
                                  </span>
                                  {isEmployer && (
                                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                      isRevoked 
                                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    }`}>
                                      {isRevoked ? 'Revoked' : 'Valid'}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-[var(--text-muted)] font-medium mt-1 flex items-center gap-2 flex-wrap">
                                  <span>Issued: {formatDateEnZA(rep.issuedAt.slice(0, 10))}</span>
                                  <span>•</span>
                                  <span>By: {rep.issuedBy}</span>
                                  <span>•</span>
                                  <span className="font-mono text-[9px] opacity-75">ID: {rep.id}</span>
                                </div>
                              </div>
                            </div>

                            {isEmployer && (
                              <div className="flex items-center gap-2 self-end sm:self-center">
                                {isRevoked ? (
                                  <span className="text-[10px] font-black text-rose-400 uppercase tracking-wider px-3 py-1 bg-rose-500/10 rounded-xl border border-rose-500/20">
                                    Revoked
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleRevokeReport(rep.id)}
                                    disabled={revokingId === rep.id}
                                    className="px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-wider bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 transition-all disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                                    title="Revoke employer verification"
                                  >
                                    {revokingId === rep.id ? (
                                      <>
                                        <Loader2 size={12} className="animate-spin" />
                                        <span>Revoking...</span>
                                      </>
                                    ) : (
                                      <span>Revoke</span>
                                    )}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[var(--text-muted)] text-xs italic">No reports generated for this student yet.</p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Report Generator Modal */}
      <React.Suspense fallback={null}>
        {reportModalStudent && (
          <ReportGeneratorModal
            isOpen={!!reportModalStudent}
            onClose={() => setReportModalStudent(null)}
            student={reportModalStudent}
            courses={allAvailableCourses}
            defaultCourseId={course}
            onReportGenerated={(newReport) => {
              if (selectedUser && selectedUser.uid === newReport.studentUid) {
                setStudentReports(prev => [newReport, ...prev]);
              }
            }}
            setAdminFeedback={setAdminFeedback}
          />
        )}
      </React.Suspense>
    </>
  );
};

export default AdminStudentsTab;
