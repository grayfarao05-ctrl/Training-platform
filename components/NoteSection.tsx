import React, { useState, useEffect } from 'react';
import { Plus, StickyNote, Loader2, Calendar, Clock, Edit2, Trash2 } from 'lucide-react';
import { db, auth, collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, handleFirestoreError, OperationType, doc, deleteDoc, updateDoc } from '../firebase';
import Modal from './Modal';

interface NoteData {
  id: string;
  title: string;
  content?: string;
  createdAt: any;
}

const NoteSection: React.FC = () => {
  const [notes, setNotes] = useState<NoteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteData | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    const uid = auth.currentUser.uid;
    const notesRef = collection(db, 'users', uid, 'notes');
    const q = query(notesRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotes(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as NoteData)));
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${uid}/notes`));

    return () => unsubscribe();
  }, []);

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !auth.currentUser) return;

    setSubmitting(true);
    try {
      if (editingNote) {
        const noteRef = doc(db, 'users', auth.currentUser.uid, 'notes', editingNote.id);
        await updateDoc(noteRef, {
          title: newTitle,
          content: newContent,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'users', auth.currentUser.uid, 'notes'), {
          title: newTitle,
          content: newContent,
          createdAt: serverTimestamp()
        });
      }
      setNewTitle('');
      setNewContent('');
      setEditingNote(null);
      setIsModalOpen(false);
    } catch (err) {
      handleFirestoreError(err, editingNote ? OperationType.UPDATE : OperationType.CREATE, 'notes');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNote = async () => {
    if (!noteToDelete || !auth.currentUser) return;
    
    setSubmitting(true);
    try {
      await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'notes', noteToDelete));
      setNoteToDelete(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `notes/${noteToDelete}`);
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteConfirm = (noteId: string) => {
    setNoteToDelete(noteId);
  };

  const openEditModal = (note: NoteData) => {
    setEditingNote(note);
    setNewTitle(note.title);
    setNewContent(note.content || '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingNote(null);
    setNewTitle('');
    setNewContent('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="text-[var(--accent)] animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--text-main)]">Study Notes</h2>
          <p className="text-[var(--text-muted)] text-xs font-medium mt-1">Capture your key exam insights and commands</p>
        </div>
      </div>

      {notes.length === 0 ? (
        <div className="bg-[var(--bg-card)] border border-dashed border-[var(--border-color)] rounded-3xl p-8 md:p-16 text-center">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-[var(--bg-panel)] rounded-full flex items-center justify-center mx-auto mb-5 text-[var(--text-muted)]">
            <StickyNote size={28} />
          </div>
          <h3 className="text-lg md:text-xl font-bold text-[var(--text-main)] tracking-tight mb-2">No Notes Found</h3>
          <p className="text-[var(--text-secondary)] text-sm max-w-xs mx-auto font-normal">Capture important concepts, command lines, or study reminders here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.map(note => (
            <div key={note.id} className="bg-[var(--bg-card)] border border-[var(--border-color)] p-6 md:p-7 rounded-3xl hover:border-[var(--border-strong)] transition-all group flex flex-col h-full relative shadow-sm">
              <div className="absolute top-6 right-6 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => openEditModal(note)}
                  className="p-2 bg-[var(--bg-panel)] hover:bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-color)] rounded-xl transition-all"
                  title="Edit Note"
                >
                  <Edit2 size={13} />
                </button>
                <button 
                  onClick={() => openDeleteConfirm(note.id)}
                  className="p-2 bg-[var(--bg-panel)] hover:bg-rose-500/15 text-[var(--text-muted)] hover:text-rose-500 border border-[var(--border-color)] rounded-xl transition-all"
                  title="Delete Note"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl">
                  <StickyNote size={15} />
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-muted)]">
                  <Calendar size={12} />
                  {note.createdAt?.toDate()?.toLocaleDateString() || 'Recent'}
                </div>
              </div>
              <h4 className="text-lg font-bold text-[var(--text-main)] tracking-tight mb-2 leading-snug">{note.title}</h4>
              <p className="text-[var(--text-secondary)] text-sm font-normal line-clamp-4 mb-5 flex-grow leading-relaxed">
                {note.content || 'No content...'}
              </p>
              <div className="pt-4 border-t border-[var(--border-color)] mt-auto flex items-center justify-between">
                <button 
                  onClick={() => openEditModal(note)}
                  className="text-xs font-semibold text-[var(--accent)] hover:opacity-80 transition-opacity"
                >
                  View Details →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating Add Button */}
      <div className="fixed bottom-8 left-1/2 lg:left-[calc(50%+100px)] -translate-x-1/2 z-40">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[var(--accent)] hover:opacity-95 text-white px-6 md:px-7 py-3 md:py-3.5 rounded-full transition-all flex items-center gap-2.5 text-xs md:text-sm font-bold uppercase tracking-wider shadow-lg shadow-[var(--accent-glow)] border border-white/10 hover:scale-105 active:scale-95 whitespace-nowrap"
        >
          <Plus size={18} />
          <span>New Note</span>
        </button>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingNote ? "Edit Note" : "New Note"}>
        <form onSubmit={handleCreateNote} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] ml-1">Note Title</label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl py-3 px-4 text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] transition-all outline-none text-sm font-medium"
              placeholder="e.g. RAID Levels Summary"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] ml-1">Content</label>
            <textarea
              rows={5}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl py-3 px-4 text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] transition-all outline-none text-sm font-normal resize-none leading-relaxed"
              placeholder="Start typing your notes..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button 
              type="button"
              onClick={closeModal}
              className="flex-1 bg-[var(--bg-panel)] text-[var(--text-main)] border border-[var(--border-color)] py-3 rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-[var(--hover-bg)] transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={submitting}
              className="flex-1 bg-[var(--accent)] text-white py-3 rounded-xl font-bold uppercase tracking-wider text-xs hover:opacity-90 transition-all disabled:opacity-50 shadow-md shadow-[var(--accent-glow)]"
            >
              {submitting ? 'Saving...' : (editingNote ? 'Update Note' : 'Save Note')}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!noteToDelete} onClose={() => setNoteToDelete(null)} title="Confirm Deletion">
        <div className="space-y-5 text-center py-2">
          <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 size={28} />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-[var(--text-main)]">Delete this note?</h3>
            <p className="text-[var(--text-muted)] text-sm max-w-xs mx-auto font-normal">
              This action cannot be undone. The note will be permanently removed.
            </p>
          </div>
          <div className="flex gap-3 pt-3">
            <button 
              onClick={() => setNoteToDelete(null)}
              disabled={submitting}
              className="flex-1 bg-[var(--bg-panel)] text-[var(--text-main)] border border-[var(--border-color)] py-3 rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-[var(--hover-bg)] transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              onClick={handleDeleteNote}
              disabled={submitting}
              className="flex-1 bg-rose-600 text-white py-3 rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-rose-500 transition-all disabled:opacity-50 shadow-md shadow-rose-600/30"
            >
              {submitting ? 'Deleting...' : 'Delete Note'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default NoteSection;
