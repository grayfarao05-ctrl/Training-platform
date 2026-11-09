import React, { useState } from 'react';
import { ExternalLink, CourseId } from '../../types';
import { getCourseConfig, withCourse } from '../../courseConfig';
import { db, OperationType, handleFirestoreError } from '../../firebase';
import { collection, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { Link as LinkIcon, Plus, Edit3, Trash2, XCircle, Loader2, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminLinksTabProps {
  externalLinks: ExternalLink[];
  searchTerm: string;
  onDeleteLink: (id: string, label: string) => void;
  setAdminFeedback: (msg: string | null) => void;
  course?: CourseId;
}

export const AdminLinksTab: React.FC<AdminLinksTabProps> = ({
  externalLinks,
  searchTerm,
  onDeleteLink,
  setAdminFeedback,
  course = 'a-plus'
}) => {
  const [editingLink, setEditingLink] = useState<Partial<ExternalLink> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const courseConfig = getCourseConfig(course);

  const handleSaveLink = async () => {
    if (!editingLink?.label || !editingLink?.url) return;
    setIsSaving(true);
    try {
      if (editingLink.id) {
        await updateDoc(doc(db, 'external_links', editingLink.id), withCourse({
          label: editingLink.label,
          url: editingLink.url,
          description: editingLink.description || ''
        }, course));
      } else {
        await addDoc(collection(db, 'external_links'), withCourse({
          label: editingLink.label,
          url: editingLink.url,
          description: editingLink.description || '',
          createdAt: serverTimestamp()
        }, course));
      }
      setEditingLink(null);
      setAdminFeedback('Link saved successfully!');
      setTimeout(() => setAdminFeedback(null), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'external_links');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredLinks = externalLinks.filter(l => 
    l.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <motion.div 
        key="links"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-12"
      >
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tighter text-[var(--text-main)]">
              {courseConfig.shortLabel} External <span style={{ color: courseConfig.accentHex }}>Resources</span>
            </h3>
            <p className="text-[var(--text-muted)] text-xs md:text-sm">Manage {courseConfig.name} links to external study materials and tools.</p>
          </div>
          <button 
            onClick={() => setEditingLink({ label: '', url: '', description: '', course })}
            className="px-5 py-3 rounded-xl font-black uppercase tracking-widest text-xs text-white shadow-md transition-all flex items-center gap-2 hover:opacity-90 self-start sm:self-auto"
            style={{ backgroundColor: courseConfig.accentHex }}
          >
            <Plus size={16} /> Add Link
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLinks.map(link => (
            <div key={link.id} className="bg-[var(--bg-card)] p-6 md:p-8 rounded-[2rem] border border-[var(--border-color)] flex flex-col justify-between group hover:border-indigo-500/40 transition-all shadow-sm">
              <div>
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 text-white"
                  style={{ backgroundColor: courseConfig.accentHex }}
                >
                  <LinkIcon size={22} />
                </div>
                <h4 className="text-lg font-black uppercase tracking-tight mb-2 truncate text-[var(--text-main)]">{link.label}</h4>
                <p className="text-[var(--text-muted)] text-xs line-clamp-2 mb-4">{link.description || 'No description provided.'}</p>
                <div className="bg-[var(--bg-surface)] p-3 rounded-xl border border-[var(--border-color)] mb-6">
                  <p className="text-[10px] text-[var(--text-muted)] truncate font-mono">{link.url}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setEditingLink(link)}
                  className="flex-1 py-2.5 bg-[var(--bg-surface)] hover:bg-[var(--border-color)] text-[var(--text-main)] rounded-xl font-black uppercase tracking-widest text-[10px] transition-colors border border-[var(--border-color)] flex items-center justify-center gap-2"
                >
                  <Edit3 size={13} /> Edit
                </button>
                <button 
                  onClick={() => onDeleteLink(link.id, link.label)}
                  className="p-2.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all border border-rose-500/20"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {externalLinks.length === 0 && (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-[var(--border-color)] rounded-[2rem] bg-[var(--bg-card)]">
              <LinkIcon size={44} className="mx-auto text-[var(--text-muted)] mb-4 opacity-40" />
              <p className="text-[var(--text-muted)] font-bold uppercase tracking-widest text-sm">No external links found.</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Link Editor Modal */}
      <AnimatePresence>
        {editingLink && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl my-8"
            >
              <div className="p-6 md:p-10 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-surface)]">
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter flex items-center gap-3 text-[var(--text-main)]">
                  <LinkIcon size={26} style={{ color: courseConfig.accentHex }} />
                  {editingLink.id ? 'Edit Link' : 'New Link'}
                </h2>
                <button onClick={() => setEditingLink(null)} className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors p-2">
                  <XCircle size={26} />
                </button>
              </div>

              <div className="p-6 md:p-10 space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] uppercase tracking-widest font-black text-[var(--text-muted)]">Link Label</label>
                  <input 
                    type="text" 
                    value={editingLink.label || ''}
                    onChange={(e) => setEditingLink({...editingLink, label: e.target.value})}
                    placeholder="e.g., CompTIA Official Study Guide"
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-4 text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-indigo-500 transition-all font-bold text-sm"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] uppercase tracking-widest font-black text-[var(--text-muted)]">URL</label>
                  <input 
                    type="text" 
                    value={editingLink.url || ''}
                    onChange={(e) => setEditingLink({...editingLink, url: e.target.value})}
                    placeholder="https://..."
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-4 text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-indigo-500 transition-all font-mono text-sm"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] uppercase tracking-widest font-black text-[var(--text-muted)]">Description (Optional)</label>
                  <textarea 
                    value={editingLink.description || ''}
                    onChange={(e) => setEditingLink({...editingLink, description: e.target.value})}
                    rows={3}
                    placeholder="Briefly describe what this resource is for..."
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-4 text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-indigo-500 transition-all resize-none text-sm"
                  />
                </div>
              </div>

              <div className="p-6 md:p-8 bg-[var(--bg-surface)] border-t border-[var(--border-color)] flex justify-end gap-3">
                <button 
                  onClick={() => setEditingLink(null)}
                  className="px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveLink}
                  disabled={isSaving}
                  className="px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-white shadow-md transition-all flex items-center gap-2 disabled:opacity-50 hover:opacity-90"
                  style={{ backgroundColor: courseConfig.accentHex }}
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={15} />}
                  Save Link
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AdminLinksTab;
