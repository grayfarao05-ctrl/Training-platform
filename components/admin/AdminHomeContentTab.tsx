import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth, OperationType, handleFirestoreError } from '../../firebase';
import { Announcement, Vacancy, VacancyType, NewsItem, CourseDoc } from '../../types';
import { 
  Megaphone, 
  Briefcase, 
  Newspaper, 
  Plus, 
  Edit3, 
  Trash2, 
  Pin, 
  PinOff, 
  Check, 
  X, 
  ExternalLink as ExternalLinkIcon, 
  Calendar, 
  AlertCircle,
  Loader2,
  Clock,
  Building,
  MapPin,
  Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { scrollToTop } from '../../scrollUtils';

interface AdminHomeContentTabProps {
  courses: CourseDoc[];
  setAdminFeedback: (msg: string | null) => void;
}

type SubSection = 'announcements' | 'vacancies' | 'news';

export const AdminHomeContentTab: React.FC<AdminHomeContentTabProps> = ({
  courses,
  setAdminFeedback
}) => {
  const [subSection, setSubSection] = useState<SubSection>('announcements');

  // Data states
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form editing states
  const [editingAnnouncement, setEditingAnnouncement] = useState<Partial<Announcement> | null>(null);
  const [editingVacancy, setEditingVacancy] = useState<Partial<Vacancy> | null>(null);
  const [editingNews, setEditingNews] = useState<Partial<NewsItem> | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<{ id: string; type: SubSection; title: string } | null>(null);

  // Validation error state
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    scrollToTop();
  }, [subSection]);

  // Real-time listener for announcements
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'announcements'), (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Announcement));
      items.sort((a, b) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });
      setAnnouncements(items);
      setLoading(false);
    }, (err) => console.error('Error listening to announcements:', err));
    return () => unsub();
  }, []);

  // Real-time listener for vacancies
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'vacancies'), (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Vacancy));
      items.sort((a, b) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });
      setVacancies(items);
    }, (err) => console.error('Error listening to vacancies:', err));
    return () => unsub();
  }, []);

  // Real-time listener for news_items
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'news_items'), (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as NewsItem));
      items.sort((a, b) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });
      setNewsItems(items);
    }, (err) => console.error('Error listening to news_items:', err));
    return () => unsub();
  }, []);

  // ==========================================
  // Announcement Actions
  // ==========================================
  const handleSaveAnnouncement = async () => {
    setFormError(null);
    if (!editingAnnouncement?.title?.trim()) {
      setFormError('Title is required (max 100 characters).');
      return;
    }
    if (editingAnnouncement.title.length > 100) {
      setFormError(`Title exceeds 100 characters (${editingAnnouncement.title.length}/100).`);
      return;
    }
    if (!editingAnnouncement?.body?.trim()) {
      setFormError('Body is required (max 600 characters).');
      return;
    }
    if (editingAnnouncement.body.length > 600) {
      setFormError(`Body exceeds 600 characters (${editingAnnouncement.body.length}/600).`);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        title: editingAnnouncement.title.trim(),
        body: editingAnnouncement.body.trim(),
        audience: editingAnnouncement.audience || 'all',
        pinned: !!editingAnnouncement.pinned,
        expiresAt: editingAnnouncement.expiresAt || null,
      };

      if (editingAnnouncement.id) {
        await updateDoc(doc(db, 'announcements', editingAnnouncement.id), payload);
        setAdminFeedback('Announcement updated successfully');
      } else {
        payload.createdAt = serverTimestamp();
        payload.createdBy = auth.currentUser?.email || auth.currentUser?.uid || 'admin';
        await addDoc(collection(db, 'announcements'), payload);
        setAdminFeedback('Announcement created successfully');
      }
      setEditingAnnouncement(null);
    } catch (err: any) {
      console.error('Save announcement error:', err);
      setFormError(err?.message || 'Failed to save announcement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePinAnnouncement = async (item: Announcement) => {
    try {
      await updateDoc(doc(db, 'announcements', item.id), {
        pinned: !item.pinned
      });
      setAdminFeedback(item.pinned ? 'Announcement unpinned' : 'Announcement pinned to top');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'announcements');
    }
  };

  // ==========================================
  // Vacancy Actions
  // ==========================================
  const handleSaveVacancy = async () => {
    setFormError(null);
    if (!editingVacancy?.title?.trim()) {
      setFormError('Job title is required.');
      return;
    }
    if (editingVacancy.title.length > 200) {
      setFormError(`Job title exceeds 200 characters (${editingVacancy.title.length}/200).`);
      return;
    }
    if (!editingVacancy?.company?.trim()) {
      setFormError('Company name is required.');
      return;
    }
    if (!editingVacancy?.location?.trim()) {
      setFormError('Location is required.');
      return;
    }
    if (!editingVacancy?.closingDate) {
      setFormError('Closing date is required.');
      return;
    }
    if (editingVacancy.applyUrl && editingVacancy.applyUrl.trim() !== '') {
      if (!editingVacancy.applyUrl.startsWith('https://')) {
        setFormError('Application URL must begin with https://');
        return;
      }
    }
    if (editingVacancy.applyInfo && editingVacancy.applyInfo.length > 200) {
      setFormError(`Application info exceeds 200 characters (${editingVacancy.applyInfo.length}/200).`);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        title: editingVacancy.title.trim(),
        company: editingVacancy.company.trim(),
        location: editingVacancy.location.trim(),
        type: editingVacancy.type || 'learnership',
        closingDate: editingVacancy.closingDate,
        applyUrl: editingVacancy.applyUrl?.trim() || '',
        applyInfo: editingVacancy.applyInfo?.trim() || '',
        status: editingVacancy.status || 'open'
      };

      if (editingVacancy.id) {
        if (editingVacancy.createdAt) {
          payload.createdAt = editingVacancy.createdAt;
        }
        await updateDoc(doc(db, 'vacancies', editingVacancy.id), payload);
        setAdminFeedback('Vacancy updated successfully');
      } else {
        payload.createdAt = serverTimestamp();
        await addDoc(collection(db, 'vacancies'), payload);
        setAdminFeedback('Vacancy published successfully');
      }
      setEditingVacancy(null);
    } catch (err: any) {
      console.error('Save vacancy error:', err);
      setFormError(err?.message || 'Failed to save vacancy.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // News Actions
  // ==========================================
  const handleSaveNews = async () => {
    setFormError(null);
    if (!editingNews?.title?.trim()) {
      setFormError('Article title is required.');
      return;
    }
    if (editingNews.title.length > 250) {
      setFormError(`Title exceeds 250 characters (${editingNews.title.length}/250).`);
      return;
    }
    if (!editingNews?.sourceName?.trim()) {
      setFormError('Publication / Source name is required.');
      return;
    }
    if (!editingNews?.url?.trim() || !editingNews.url.startsWith('https://')) {
      setFormError('Article link is required and MUST start with https://');
      return;
    }
    if (editingNews.note && editingNews.note.length > 200) {
      setFormError(`Brief note exceeds 200 characters (${editingNews.note.length}/200).`);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        title: editingNews.title.trim(),
        sourceName: editingNews.sourceName.trim(),
        url: editingNews.url.trim(),
        note: editingNews.note?.trim() || '',
        publishedAt: editingNews.publishedAt || new Date().toISOString().split('T')[0]
      };

      if (editingNews.id) {
        await updateDoc(doc(db, 'news_items', editingNews.id), payload);
        setAdminFeedback('News item updated successfully');
      } else {
        payload.createdAt = serverTimestamp();
        await addDoc(collection(db, 'news_items'), payload);
        setAdminFeedback('News item published successfully');
      }
      setEditingNews(null);
    } catch (err: any) {
      console.error('Save news error:', err);
      setFormError(err?.message || 'Failed to save news item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // Execute Delete
  // ==========================================
  const handleExecuteDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      const coll = 
        confirmDeleteId.type === 'announcements' ? 'announcements' :
        confirmDeleteId.type === 'vacancies' ? 'vacancies' : 'news_items';

      await deleteDoc(doc(db, coll, confirmDeleteId.id));
      setAdminFeedback(`${confirmDeleteId.type === 'announcements' ? 'Announcement' : confirmDeleteId.type === 'vacancies' ? 'Vacancy' : 'News item'} deleted`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, confirmDeleteId.type);
    } finally {
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header & Sub-Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-color)] pb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-[var(--text-main)]">
            Home <span className="text-cyan-400">Content Management</span>
          </h2>
          <p className="text-[var(--text-muted)] text-sm mt-1 font-medium">
            Manage announcements, student opportunities, and industry briefings displayed on the portal Home screen.
          </p>
        </div>

        {/* Sub-Tab Navigation */}
        <div className="flex bg-[var(--bg-surface)] p-1.5 rounded-2xl border border-[var(--border-color)] gap-1 shrink-0">
          {[
            { id: 'announcements' as SubSection, label: 'Announcements', icon: Megaphone, count: announcements.length },
            { id: 'vacancies' as SubSection, label: 'Vacancies', icon: Briefcase, count: vacancies.length },
            { id: 'news' as SubSection, label: 'Industry News', icon: Newspaper, count: newsItems.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setSubSection(tab.id);
                setEditingAnnouncement(null);
                setEditingVacancy(null);
                setEditingNews(null);
                setFormError(null);
                scrollToTop();
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider font-black transition-all cursor-pointer ${
                subSection === tab.id
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/5'
              }`}
            >
              <tab.icon size={14} />
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${subSection === tab.id ? 'bg-white/20 text-white' : 'bg-[var(--bg-card)] text-[var(--text-muted)]'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION 1: ANNOUNCEMENTS */}
      {/* ========================================================= */}
      {subSection === 'announcements' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              {announcements.length} Total Announcements
            </span>
            <button
              type="button"
              onClick={() => {
                setFormError(null);
                setEditingAnnouncement({
                  title: '',
                  body: '',
                  audience: 'all',
                  pinned: false,
                  expiresAt: ''
                });
              }}
              className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer transition-all"
            >
              <Plus size={16} /> Add Announcement
            </button>
          </div>

          {/* Announcement Edit / Create Modal or Card */}
          {editingAnnouncement && (
            <div className="bg-[var(--bg-card)] border-2 border-cyan-500/40 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
                <h3 className="text-lg font-black uppercase tracking-tight text-[var(--text-main)]">
                  {editingAnnouncement.id ? 'Edit Announcement' : 'Create New Announcement'}
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingAnnouncement(null)}
                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/10"
                >
                  <X size={18} />
                </button>
              </div>

              {formError && (
                <div className="p-3.5 rounded-xl bg-red-600/15 border border-red-500/30 text-red-400 text-xs font-bold flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center justify-between text-xs font-bold text-[var(--text-muted)]">
                    <label>Title (Max 100 characters) *</label>
                    <span>{editingAnnouncement.title?.length || 0}/100</span>
                  </div>
                  <input
                    type="text"
                    maxLength={100}
                    placeholder="e.g. Schedule Change: Core 2 Simulation Workshop"
                    value={editingAnnouncement.title || ''}
                    onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, title: e.target.value })}
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-3.5 text-sm text-[var(--text-main)] focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center justify-between text-xs font-bold text-[var(--text-muted)]">
                    <label>Body (Max 600 characters, plain text) *</label>
                    <span>{editingAnnouncement.body?.length || 0}/600</span>
                  </div>
                  <textarea
                    rows={4}
                    maxLength={600}
                    placeholder="Provide plain text details for students..."
                    value={editingAnnouncement.body || ''}
                    onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, body: e.target.value })}
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-3.5 text-sm text-[var(--text-main)] focus:outline-none focus:border-cyan-500 leading-relaxed"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--text-muted)] block">Audience Target</label>
                  <select
                    value={editingAnnouncement.audience || 'all'}
                    onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, audience: e.target.value })}
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-3.5 text-sm text-[var(--text-main)] focus:outline-none focus:border-cyan-500"
                  >
                    <option value="all">All Enrolled Students ('all')</option>
                    <option value="a-plus">CompTIA A+ Only</option>
                    <option value="network-plus">CompTIA Network+ Only</option>
                    {courses.filter(c => c.id !== 'a-plus' && c.id !== 'network-plus').map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--text-muted)] block">Expires At (Optional)</label>
                  <input
                    type="date"
                    value={editingAnnouncement.expiresAt || ''}
                    onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, expiresAt: e.target.value })}
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-3.5 text-sm text-[var(--text-main)] focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="md:col-span-2 pt-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!editingAnnouncement.pinned}
                      onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, pinned: e.target.checked })}
                      className="w-5 h-5 rounded text-cyan-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-sm font-bold text-[var(--text-main)] flex items-center gap-1.5">
                      <Pin size={15} className="text-amber-400" /> Pin this announcement to top of feed
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => setEditingAnnouncement(null)}
                  className="px-5 py-2.5 rounded-xl border border-[var(--border-color)] text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSaveAnnouncement}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  <span>{editingAnnouncement.id ? 'Save Changes' : 'Publish Announcement'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Announcements List */}
          {announcements.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)]">
              <Megaphone size={32} className="mx-auto mb-2 opacity-30" />
              <p className="font-bold">No announcements created yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {announcements.map((item) => (
                <div
                  key={item.id}
                  className="p-5 sm:p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-cyan-500/30 transition-colors shadow-sm"
                >
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.pinned && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          <Pin size={10} /> Pinned
                        </span>
                      )}
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                        Target: {item.audience.toUpperCase()}
                      </span>
                      {item.expiresAt && (
                        <span className="text-[10px] text-[var(--text-muted)] font-medium">
                          Expires: {new Date(item.expiresAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <h4 className="text-base font-black text-[var(--text-main)] tracking-tight">
                      {item.title}
                    </h4>
                    <p className="text-xs text-[var(--text-muted)] font-medium line-clamp-2 leading-relaxed">
                      {item.body}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-[var(--border-color)]">
                    <button
                      type="button"
                      onClick={() => handleTogglePinAnnouncement(item)}
                      title={item.pinned ? 'Unpin' : 'Pin to top'}
                      className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                        item.pinned
                          ? 'bg-amber-500/15 border-amber-500/30 text-amber-400 hover:bg-amber-500/25'
                          : 'bg-[var(--bg-surface)] border-[var(--border-color)] text-[var(--text-muted)] hover:text-amber-400'
                      }`}
                    >
                      {item.pinned ? <PinOff size={16} /> : <Pin size={16} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormError(null);
                        setEditingAnnouncement(item);
                      }}
                      title="Edit announcement"
                      className="p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId({ id: item.id, type: 'announcements', title: item.title })}
                      title="Delete announcement"
                      className="p-2.5 rounded-xl bg-red-600/10 border border-red-500/30 text-red-400 hover:bg-red-600/20 transition-colors cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 2: VACANCIES */}
      {/* ========================================================= */}
      {subSection === 'vacancies' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              {vacancies.length} Total Vacancies ({vacancies.filter(v => v.status === 'open').length} Open)
            </span>
            <button
              type="button"
              onClick={() => {
                setFormError(null);
                setEditingVacancy({
                  title: '',
                  company: '',
                  location: '',
                  type: 'learnership',
                  closingDate: '',
                  applyUrl: '',
                  applyInfo: '',
                  status: 'open'
                });
              }}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer transition-all"
            >
              <Plus size={16} /> Post Vacancy
            </button>
          </div>

          {/* Vacancy Edit / Create Form */}
          {editingVacancy && (
            <div className="bg-[var(--bg-card)] border-2 border-emerald-500/40 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
                <h3 className="text-lg font-black uppercase tracking-tight text-[var(--text-main)]">
                  {editingVacancy.id ? 'Edit Vacancy' : 'Post New Career Vacancy'}
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingVacancy(null)}
                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/10"
                >
                  <X size={18} />
                </button>
              </div>

              {formError && (
                <div className="p-3.5 rounded-xl bg-red-600/15 border border-red-500/30 text-red-400 text-xs font-bold flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-[var(--text-muted)] block">Job Title (Max 200 characters) *</label>
                  <input
                    type="text"
                    maxLength={200}
                    placeholder="e.g. IT Technical Support Specialist"
                    value={editingVacancy.title || ''}
                    onChange={(e) => setEditingVacancy({ ...editingVacancy, title: e.target.value })}
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-3.5 text-sm text-[var(--text-main)] focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--text-muted)] block">Company / Host Employer *</label>
                  <input
                    type="text"
                    maxLength={200}
                    placeholder="e.g. Dimension Data / NTT"
                    value={editingVacancy.company || ''}
                    onChange={(e) => setEditingVacancy({ ...editingVacancy, company: e.target.value })}
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-3.5 text-sm text-[var(--text-main)] focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--text-muted)] block">Location (City / Remote / Hybrid) *</label>
                  <input
                    type="text"
                    maxLength={200}
                    placeholder="e.g. Johannesburg (Hybrid)"
                    value={editingVacancy.location || ''}
                    onChange={(e) => setEditingVacancy({ ...editingVacancy, location: e.target.value })}
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-3.5 text-sm text-[var(--text-main)] focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--text-muted)] block">Opportunity Type *</label>
                  <select
                    value={editingVacancy.type || 'learnership'}
                    onChange={(e) => setEditingVacancy({ ...editingVacancy, type: e.target.value as VacancyType })}
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-3.5 text-sm text-[var(--text-main)] focus:outline-none focus:border-emerald-500"
                  >
                    <option value="learnership">Learnership</option>
                    <option value="internship">Internship</option>
                    <option value="junior-role">Junior Role</option>
                    <option value="contract">Contract</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--text-muted)] block">Closing Date *</label>
                  <input
                    type="date"
                    value={editingVacancy.closingDate || ''}
                    onChange={(e) => setEditingVacancy({ ...editingVacancy, closingDate: e.target.value })}
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-3.5 text-sm text-[var(--text-main)] focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-[var(--text-muted)] block">Application URL (Optional, must start with https://)</label>
                  <input
                    type="url"
                    placeholder="https://company.careers.com/apply/..."
                    value={editingVacancy.applyUrl || ''}
                    onChange={(e) => setEditingVacancy({ ...editingVacancy, applyUrl: e.target.value })}
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-3.5 text-sm text-[var(--text-main)] focus:outline-none focus:border-emerald-500 font-mono text-xs"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center justify-between text-xs font-bold text-[var(--text-muted)]">
                    <label>Application Instructions / Note (Optional plain text, max 200)</label>
                    <span>{editingVacancy.applyInfo?.length || 0}/200</span>
                  </div>
                  <input
                    type="text"
                    maxLength={200}
                    placeholder="e.g. Email CV & matric certificate to careers@example.com with subject #IT-2026"
                    value={editingVacancy.applyInfo || ''}
                    onChange={(e) => setEditingVacancy({ ...editingVacancy, applyInfo: e.target.value })}
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-3.5 text-sm text-[var(--text-main)] focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--text-muted)] block">Status</label>
                  <select
                    value={editingVacancy.status || 'open'}
                    onChange={(e) => setEditingVacancy({ ...editingVacancy, status: e.target.value as 'open' | 'closed' })}
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-3.5 text-sm text-[var(--text-main)] focus:outline-none focus:border-emerald-500"
                  >
                    <option value="open">Open (Visible on Home until closing date)</option>
                    <option value="closed">Closed (Hidden from students)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => setEditingVacancy(null)}
                  className="px-5 py-2.5 rounded-xl border border-[var(--border-color)] text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSaveVacancy}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  <span>{editingVacancy.id ? 'Save Changes' : 'Publish Vacancy'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Vacancies List */}
          {vacancies.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)]">
              <Briefcase size={32} className="mx-auto mb-2 opacity-30" />
              <p className="font-bold">No vacancies posted yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vacancies.map((vac) => (
                <div
                  key={vac.id}
                  className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col justify-between space-y-4 hover:border-emerald-500/30 transition-colors shadow-sm"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        {vac.type}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        vac.status === 'open' ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30' : 'bg-slate-500/15 text-slate-400 border border-slate-500/30'
                      }`}>
                        {vac.status.toUpperCase()}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-black text-[var(--text-main)] tracking-tight">
                        {vac.title}
                      </h4>
                      <p className="text-xs font-bold text-cyan-400 mt-0.5">
                        {vac.company} • {vac.location}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-medium">
                      <Calendar size={13} className="shrink-0" />
                      <span>Closes: {vac.closingDate ? new Date(vac.closingDate).toLocaleDateString() : 'N/A'}</span>
                    </div>

                    {vac.applyInfo && (
                      <p className="text-xs text-[var(--text-muted)] font-medium line-clamp-2">
                        {vac.applyInfo}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[var(--border-color)]">
                    {vac.applyUrl ? (
                      <a
                        href={vac.applyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300"
                      >
                        <span>Apply Link</span>
                        <ExternalLinkIcon size={12} />
                      </a>
                    ) : <span />}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setFormError(null);
                          setEditingVacancy(vac);
                        }}
                        title="Edit vacancy"
                        className="p-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId({ id: vac.id, type: 'vacancies', title: vac.title })}
                        title="Delete vacancy"
                        className="p-2 rounded-xl bg-red-600/10 border border-red-500/30 text-red-400 hover:bg-red-600/20 transition-colors cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 3: INDUSTRY NEWS */}
      {/* ========================================================= */}
      {subSection === 'news' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              {newsItems.length} Total News Articles
            </span>
            <button
              type="button"
              onClick={() => {
                setFormError(null);
                setEditingNews({
                  title: '',
                  sourceName: '',
                  url: '',
                  note: '',
                  publishedAt: new Date().toISOString().split('T')[0]
                });
              }}
              className="px-4 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer transition-all"
            >
              <Plus size={16} /> Add News Item
            </button>
          </div>

          {/* News Edit / Create Form */}
          {editingNews && (
            <div className="bg-[var(--bg-card)] border-2 border-purple-500/40 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
                <h3 className="text-lg font-black uppercase tracking-tight text-[var(--text-main)]">
                  {editingNews.id ? 'Edit News Item' : 'Add Industry News Item'}
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingNews(null)}
                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/10"
                >
                  <X size={18} />
                </button>
              </div>

              {formError && (
                <div className="p-3.5 rounded-xl bg-red-600/15 border border-red-500/30 text-red-400 text-xs font-bold flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center justify-between text-xs font-bold text-[var(--text-muted)]">
                    <label>Article Title (Max 250 characters) *</label>
                    <span>{editingNews.title?.length || 0}/250</span>
                  </div>
                  <input
                    type="text"
                    maxLength={250}
                    placeholder="e.g. NIST Releases New Guidance on Post-Quantum Cryptography"
                    value={editingNews.title || ''}
                    onChange={(e) => setEditingNews({ ...editingNews, title: e.target.value })}
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-3.5 text-sm text-[var(--text-main)] focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--text-muted)] block">Source / Publisher (Max 100 characters) *</label>
                  <input
                    type="text"
                    maxLength={100}
                    placeholder="e.g. BleepingComputer, KrebsOnSecurity, CompTIA"
                    value={editingNews.sourceName || ''}
                    onChange={(e) => setEditingNews({ ...editingNews, sourceName: e.target.value })}
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-3.5 text-sm text-[var(--text-main)] focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--text-muted)] block">Date Published *</label>
                  <input
                    type="date"
                    value={editingNews.publishedAt || ''}
                    onChange={(e) => setEditingNews({ ...editingNews, publishedAt: e.target.value })}
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-3.5 text-sm text-[var(--text-main)] focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-[var(--text-muted)] block">Article URL (MUST start with https://) *</label>
                  <input
                    type="url"
                    placeholder="https://www.bleepingcomputer.com/news/security/..."
                    value={editingNews.url || ''}
                    onChange={(e) => setEditingNews({ ...editingNews, url: e.target.value })}
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-3.5 text-sm text-[var(--text-main)] focus:outline-none focus:border-purple-500 font-mono text-xs"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center justify-between text-xs font-bold text-[var(--text-muted)]">
                    <label>Curator Note (Optional plain text, max 200)</label>
                    <span>{editingNews.note?.length || 0}/200</span>
                  </div>
                  <input
                    type="text"
                    maxLength={200}
                    placeholder="e.g. Relevant for Domain 2.0 Network Security topics in Core 2"
                    value={editingNews.note || ''}
                    onChange={(e) => setEditingNews({ ...editingNews, note: e.target.value })}
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-3.5 text-sm text-[var(--text-main)] focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => setEditingNews(null)}
                  className="px-5 py-2.5 rounded-xl border border-[var(--border-color)] text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSaveNews}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  <span>{editingNews.id ? 'Save Changes' : 'Publish Article'}</span>
                </button>
              </div>
            </div>
          )}

          {/* News List */}
          {newsItems.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)]">
              <Newspaper size={32} className="mx-auto mb-2 opacity-30" />
              <p className="font-bold">No news items published yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {newsItems.map((item) => (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col justify-between space-y-4 hover:border-purple-500/30 transition-colors shadow-sm"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] font-bold">
                      <span className="text-purple-400 uppercase tracking-wider">{item.sourceName}</span>
                      <span>{item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : ''}</span>
                    </div>

                    <h4 className="text-sm font-black text-[var(--text-main)] leading-snug">
                      {item.title}
                    </h4>

                    {item.note && (
                      <p className="text-xs text-[var(--text-muted)] font-medium leading-relaxed">
                        {item.note}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[var(--border-color)]">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-purple-400 hover:text-purple-300"
                    >
                      <span>Read Original</span>
                      <ExternalLinkIcon size={12} />
                    </a>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setFormError(null);
                          setEditingNews(item);
                        }}
                        title="Edit article"
                        className="p-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId({ id: item.id, type: 'news', title: item.title })}
                        title="Delete article"
                        className="p-2 rounded-xl bg-red-600/10 border border-red-500/30 text-red-400 hover:bg-red-600/20 transition-colors cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl">
            <div className="space-y-2">
              <h3 className="text-lg font-black uppercase tracking-tight text-[var(--text-main)]">
                Confirm Deletion
              </h3>
              <p className="text-xs text-[var(--text-muted)] font-medium">
                Are you sure you want to permanently delete <span className="font-bold text-[var(--text-main)]">"{confirmDeleteId.title}"</span>? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2.5 rounded-xl border border-[var(--border-color)] text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] hover:bg-white/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider cursor-pointer shadow-md shadow-red-950/30"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHomeContentTab;
