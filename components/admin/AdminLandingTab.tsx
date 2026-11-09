import React, { useState, useEffect } from 'react';
import { 
  Star, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Award, 
  Users, 
  Mail, 
  Briefcase, 
  FileText, 
  ShieldCheck, 
  Save, 
  ExternalLink,
  MessageSquare,
  Building,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { db } from '../../firebase';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { 
  ReviewItem, 
  TopStudentItem, 
  LandingSettings, 
  InterviewInvite, 
  ContactMessage,
  DEFAULT_REVIEWS, 
  DEFAULT_TOP_STUDENTS, 
  DEFAULT_LANDING_SETTINGS,
  subscribeReviews, 
  subscribeTopStudents, 
  subscribeLandingSettings,
  saveReview, 
  deleteReview, 
  saveTopStudent, 
  deleteTopStudent, 
  saveLandingSettings
} from '../../landingService';

export const AdminLandingTab: React.FC = () => {
  const [subTab, setSubTab] = useState<'reviews' | 'top5' | 'invites' | 'messages' | 'about'>('top5');
  
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [topStudents, setTopStudents] = useState<TopStudentItem[]>([]);
  const [settings, setSettings] = useState<LandingSettings>(DEFAULT_LANDING_SETTINGS);
  const [invites, setInvites] = useState<InterviewInvite[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);

  // Editing state for Reviews
  const [editingReview, setEditingReview] = useState<Partial<ReviewItem> | null>(null);
  
  // Editing state for Top 5
  const [editingStudent, setEditingStudent] = useState<Partial<TopStudentItem> | null>(null);

  // Status notification
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg(null), 3500);
  };

  useEffect(() => {
    const unsubRev = subscribeReviews(setReviews);
    const unsubTop = subscribeTopStudents(setTopStudents);
    const unsubSet = subscribeLandingSettings(setSettings);

    // Subscribe to interview invites
    const unsubInv = onSnapshot(collection(db, 'interviewInvites'), (snap) => {
      const items = snap.docs.map(d => ({ ...d.data(), id: d.id } as InterviewInvite));
      items.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
      setInvites(items);
    }, (err) => console.warn("Interview invites err:", err));

    // Subscribe to contact messages
    const unsubMsg = onSnapshot(collection(db, 'contactMessages'), (snap) => {
      const items = snap.docs.map(d => ({ ...d.data(), id: d.id } as ContactMessage));
      items.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
      setMessages(items);
    }, (err) => console.warn("Contact messages err:", err));

    return () => {
      unsubRev();
      unsubTop();
      unsubSet();
      unsubInv();
      unsubMsg();
    };
  }, []);

  // Save Settings handler
  const handleSaveSettings = async () => {
    try {
      await saveLandingSettings(settings);
      showStatus("Landing settings and stats updated successfully!");
    } catch (err) {
      console.error(err);
      showStatus("Could not save settings.", "error");
    }
  };

  // Review save
  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReview?.name || !editingReview.quote) return;
    try {
      await saveReview(editingReview);
      setEditingReview(null);
      showStatus("Review saved successfully!");
    } catch (err) {
      console.error(err);
      showStatus("Failed to save review.", "error");
    }
  };

  // Student save
  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent?.firstName || !editingStudent.surnameInitial) return;
    try {
      await saveTopStudent({
        ...editingStudent,
        rank: Number(editingStudent.rank) || 1,
        score: Number(editingStudent.score) || 85,
        tags: Array.isArray(editingStudent.tags) 
          ? editingStudent.tags 
          : String((editingStudent as any).tags || '').split(',').map(s => s.trim()).filter(Boolean)
      });
      setEditingStudent(null);
      showStatus("Top student profile saved!");
    } catch (err) {
      console.error(err);
      showStatus("Failed to save top student.", "error");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Subtabs Navigation */}
      <div className="flex bg-[var(--bg-surface)] p-1.5 rounded-2xl border border-[var(--border-color)] flex-wrap gap-1">
        {[
          { id: 'top5', label: 'Top 5 Students', icon: Award, count: topStudents.length },
          { id: 'reviews', label: 'Reviews', icon: Star, count: reviews.length },
          { id: 'invites', label: 'Interview Invites', icon: Briefcase, count: invites.length },
          { id: 'messages', label: 'Contact Messages', icon: Mail, count: messages.length },
          { id: 'about', label: 'About & Stats', icon: Users }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider font-black transition-all cursor-pointer ${
              subTab === tab.id
                ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)]'
            }`}
          >
            <tab.icon size={14} />
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/30 text-white font-mono font-bold">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {statusMsg && (
        <div className={`p-4 rounded-2xl text-xs font-bold border flex items-center gap-2 ${
          statusMsg.type === 'success' 
            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' 
            : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
        }`}>
          <CheckCircle2 size={16} />
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* 1. TOP 5 STUDENTS MANAGEMENT */}
      {subTab === 'top5' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight text-[var(--text-main)]">
                Manage Top 5 Students
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                POPIA Compliant: Students only appear on the public landing page if consent is checked.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditingStudent({
                firstName: '',
                surnameInitial: 'M.',
                schoolOrArea: 'Moorreesburg',
                track: 'CompTIA A+',
                score: 90,
                rank: topStudents.length + 1,
                consentGiven: true,
                tags: ['Hardware', 'Troubleshooting'],
                cvUrl: '/assets/sample-student-cv.pdf'
              })}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer"
            >
              <Plus size={16} /> Add Candidate
            </button>
          </div>

          {/* Student Editor Form */}
          {editingStudent && (
            <form onSubmit={handleSaveStudent} className="p-6 rounded-2xl bg-[var(--bg-card)] border border-cyan-500/30 space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <h4 className="text-sm font-black uppercase text-cyan-400">
                  {editingStudent.id ? 'Edit Candidate Profile' : 'New Top 5 Candidate'}
                </h4>
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="text-[var(--text-muted)] hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-black uppercase text-[var(--text-muted)] mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={editingStudent.firstName || ''}
                    onChange={e => setEditingStudent({ ...editingStudent, firstName: e.target.value })}
                    placeholder="e.g. Thando"
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-xs text-[var(--text-main)]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-[var(--text-muted)] mb-1">Surname Initial *</label>
                  <input
                    type="text"
                    required
                    value={editingStudent.surnameInitial || ''}
                    onChange={e => setEditingStudent({ ...editingStudent, surnameInitial: e.target.value })}
                    placeholder="e.g. M."
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-xs text-[var(--text-main)]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-[var(--text-muted)] mb-1">Rank (1 to 5) *</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    required
                    value={editingStudent.rank || 1}
                    onChange={e => setEditingStudent({ ...editingStudent, rank: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-xs text-[var(--text-main)] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-black uppercase text-[var(--text-muted)] mb-1">School or Area *</label>
                  <input
                    type="text"
                    required
                    value={editingStudent.schoolOrArea || ''}
                    onChange={e => setEditingStudent({ ...editingStudent, schoolOrArea: e.target.value })}
                    placeholder="e.g. Atlantis Secondary"
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-xs text-[var(--text-main)]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-[var(--text-muted)] mb-1">Certification Track *</label>
                  <select
                    value={editingStudent.track || 'CompTIA A+'}
                    onChange={e => setEditingStudent({ ...editingStudent, track: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-xs text-[var(--text-main)]"
                  >
                    <option value="CompTIA A+">CompTIA A+</option>
                    <option value="CompTIA Network+">CompTIA Network+</option>
                    <option value="Matric to Money">Matric to Money</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-[var(--text-muted)] mb-1">Exam Readiness Score (%)</label>
                  <input
                    type="number"
                    min={50}
                    max={100}
                    value={editingStudent.score || 85}
                    onChange={e => setEditingStudent({ ...editingStudent, score: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-xs text-[var(--text-main)] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-[var(--text-muted)] mb-1">
                  Skill Tags (comma-separated, 2 to 3 tags)
                </label>
                <input
                  type="text"
                  value={Array.isArray(editingStudent.tags) ? editingStudent.tags.join(', ') : (editingStudent.tags || '')}
                  onChange={e => setEditingStudent({ ...editingStudent, tags: e.target.value.split(',').map(s => s.trim()) })}
                  placeholder="e.g. Hardware Diagnostics, Subnetting, CLI"
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-xs text-[var(--text-main)]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-[var(--text-muted)] mb-1">
                  CV PDF Storage URL / Path (Optional)
                </label>
                <input
                  type="text"
                  value={editingStudent.cvUrl || ''}
                  onChange={e => setEditingStudent({ ...editingStudent, cvUrl: e.target.value })}
                  placeholder="/assets/sample-student-cv.pdf or Firebase Storage download URL"
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-xs text-[var(--text-main)]"
                />
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)]">
                <input
                  type="checkbox"
                  id="consentGiven"
                  checked={Boolean(editingStudent.consentGiven)}
                  onChange={e => setEditingStudent({ ...editingStudent, consentGiven: e.target.checked })}
                  className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-400"
                />
                <label htmlFor="consentGiven" className="text-xs font-bold text-[var(--text-main)] cursor-pointer">
                  POPIA Consent Given (Student or parent/guardian gave written permission to showcase profile)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider shadow-md"
                >
                  Save Candidate
                </button>
              </div>
            </form>
          )}

          {/* Top Students Table / List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topStudents.map((student) => (
              <div 
                key={student.id} 
                className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-3 relative group"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-black bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    Rank #{student.rank}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditingStudent(student)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-400"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (confirm(`Remove ${student.firstName} ${student.surnameInitial} from Top 5?`)) {
                          await deleteTopStudent(student.id);
                          showStatus("Candidate removed.");
                        }
                      }}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-rose-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-base font-black text-[var(--text-main)] uppercase tracking-tight">
                    {student.firstName} {student.surnameInitial}
                  </h4>
                  <p className="text-xs text-[var(--text-muted)]">
                    {student.track} • {student.schoolOrArea}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[var(--text-muted)]">Readiness:</span>
                  <span className="text-cyan-400 font-bold">{student.score}%</span>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
                  <ShieldCheck size={14} />
                  <span>{student.consentGiven ? 'Consent verified' : 'Consent pending'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. REVIEWS MANAGEMENT */}
      {subTab === 'reviews' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight text-[var(--text-main)]">
                Student Reviews & Testimonials
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Add and manage testimonials displayed in the "#reviews" section.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditingReview({
                name: '',
                school: 'Western Cape High',
                course: 'CompTIA A+',
                quote: '',
                rating: 5
              })}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer"
            >
              <Plus size={16} /> Add Review
            </button>
          </div>

          {editingReview && (
            <form onSubmit={handleSaveReview} className="p-6 rounded-2xl bg-[var(--bg-card)] border border-cyan-500/30 space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <h4 className="text-sm font-black uppercase text-cyan-400">
                  {editingReview.id ? 'Edit Review' : 'New Review'}
                </h4>
                <button
                  type="button"
                  onClick={() => setEditingReview(null)}
                  className="text-[var(--text-muted)] hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-black uppercase text-[var(--text-muted)] mb-1">Student Name *</label>
                  <input
                    type="text"
                    required
                    value={editingReview.name || ''}
                    onChange={e => setEditingReview({ ...editingReview, name: e.target.value })}
                    placeholder="e.g. Thabo M."
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-xs text-[var(--text-main)]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-[var(--text-muted)] mb-1">School / Location *</label>
                  <input
                    type="text"
                    required
                    value={editingReview.school || ''}
                    onChange={e => setEditingReview({ ...editingReview, school: e.target.value })}
                    placeholder="e.g. Atlantis Secondary"
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-xs text-[var(--text-main)]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-[var(--text-muted)] mb-1">Course *</label>
                  <input
                    type="text"
                    required
                    value={editingReview.course || ''}
                    onChange={e => setEditingReview({ ...editingReview, course: e.target.value })}
                    placeholder="e.g. CompTIA A+"
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-xs text-[var(--text-main)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-[var(--text-muted)] mb-1">Quote *</label>
                <textarea
                  rows={3}
                  required
                  value={editingReview.quote || ''}
                  onChange={e => setEditingReview({ ...editingReview, quote: e.target.value })}
                  placeholder="Student testimonial text..."
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-xs text-[var(--text-main)] resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingReview(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider shadow-md"
                >
                  Save Review
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((r) => (
              <div key={r.id} className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-amber-400">
                    {Array.from({ length: r.rating || 5 }).map((_, i) => (
                      <Star key={i} size={14} fill="currentColor" />
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditingReview(r)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-400"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (confirm(`Delete review from ${r.name}?`)) {
                          await deleteReview(r.id);
                          showStatus("Review deleted.");
                        }
                      }}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-rose-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-[var(--text-main)] italic">
                  "{r.quote}"
                </p>

                <div className="pt-2 border-t border-[var(--border-color)] text-xs">
                  <span className="font-bold text-[var(--text-main)]">{r.name}</span> • <span className="text-cyan-400">{r.course}</span> ({r.school})
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. INTERVIEW INVITES */}
      {subTab === 'invites' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight text-[var(--text-main)]">
              Employer Interview Invitations ({invites.length})
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Inbound interview requests from companies interested in hiring ITreal candidates.
            </p>
          </div>

          {invites.length === 0 ? (
            <div className="p-12 rounded-2xl bg-[var(--bg-card)] text-center text-slate-400 text-xs uppercase font-bold">
              No interview invitations received yet.
            </div>
          ) : (
            <div className="space-y-4">
              {invites.map((inv) => (
                <div 
                  key={inv.id}
                  className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-color)] pb-3">
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-cyan-400">
                        Candidate: {inv.studentName}
                      </span>
                      <h4 className="text-sm font-black text-[var(--text-main)] uppercase">
                        Role: {inv.role} at {inv.companyName}
                      </h4>
                    </div>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">
                      {inv.createdAt ? new Date(inv.createdAt).toLocaleString() : ''}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[var(--text-muted)] font-bold">Contact Person: </span>
                      <span className="text-[var(--text-main)]">{inv.contactPerson}</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)] font-bold">Email / Phone: </span>
                      <span className="text-cyan-400 font-mono">{inv.emailOrPhone}</span>
                    </div>
                  </div>

                  {inv.message && (
                    <div className="p-3 rounded-xl bg-[var(--bg-surface)] text-xs text-[var(--text-muted)] leading-relaxed">
                      "{inv.message}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. CONTACT MESSAGES */}
      {subTab === 'messages' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight text-[var(--text-main)]">
              Inbound Contact Messages ({messages.length})
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Messages received via the "#contact" form on the public landing page.
            </p>
          </div>

          {messages.length === 0 ? (
            <div className="p-12 rounded-2xl bg-[var(--bg-card)] text-center text-slate-400 text-xs uppercase font-bold">
              No contact messages received yet.
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div 
                  key={msg.id}
                  className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-color)] pb-3">
                    <div>
                      <h4 className="text-sm font-black text-[var(--text-main)] uppercase">
                        {msg.name}
                      </h4>
                      <a href={`mailto:${msg.email}`} className="text-xs text-cyan-400 font-mono hover:underline">
                        {msg.email}
                      </a>
                    </div>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleString() : ''}
                    </span>
                  </div>

                  <p className="text-xs text-[var(--text-main)] leading-relaxed bg-[var(--bg-surface)] p-3 rounded-xl">
                    {msg.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. ABOUT STORY & STATS */}
      {subTab === 'about' && (
        <div className="space-y-6 p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight text-[var(--text-main)]">
              Edit About Story & Public Stats
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Customize the story text and animated count-up numbers in the "#about" section.
            </p>
          </div>

          {/* 3 Stats Counters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-black uppercase text-[var(--text-muted)] mb-1">
                Youth Trained (Count-Up)
              </label>
              <input
                type="number"
                value={settings.stats?.studentsTrained || 240}
                onChange={e => setSettings({
                  ...settings,
                  stats: { ...settings.stats, studentsTrained: Number(e.target.value) }
                })}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-xs text-[var(--text-main)] font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase text-[var(--text-muted)] mb-1">
                Certification Tracks
              </label>
              <input
                type="number"
                value={settings.stats?.courses || 3}
                onChange={e => setSettings({
                  ...settings,
                  stats: { ...settings.stats, courses: Number(e.target.value) }
                })}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-xs text-[var(--text-main)] font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase text-[var(--text-muted)] mb-1">
                Years Active
              </label>
              <input
                type="number"
                value={settings.stats?.years || 2}
                onChange={e => setSettings({
                  ...settings,
                  stats: { ...settings.stats, years: Number(e.target.value) }
                })}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-xs text-[var(--text-main)] font-mono"
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-[var(--border-color)]">
            <div>
              <label className="block text-[11px] font-black uppercase text-[var(--text-muted)] mb-1">
                Story Subtitle
              </label>
              <input
                type="text"
                value={settings.storySubtitle || ''}
                onChange={e => setSettings({ ...settings, storySubtitle: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-xs text-[var(--text-main)]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase text-[var(--text-muted)] mb-1">
                Story Lead Sentence
              </label>
              <textarea
                rows={2}
                value={settings.storyLead || ''}
                onChange={e => setSettings({ ...settings, storyLead: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-xs text-[var(--text-main)] resize-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase text-[var(--text-muted)] mb-1">
                Story Paragraph 1
              </label>
              <textarea
                rows={3}
                value={settings.storyParagraph1 || ''}
                onChange={e => setSettings({ ...settings, storyParagraph1: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-xs text-[var(--text-main)] resize-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase text-[var(--text-muted)] mb-1">
                Story Paragraph 2
              </label>
              <textarea
                rows={3}
                value={settings.storyParagraph2 || ''}
                onChange={e => setSettings({ ...settings, storyParagraph2: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-xs text-[var(--text-main)] resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={handleSaveSettings}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <Save size={16} /> Save Settings & Stats
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLandingTab;
