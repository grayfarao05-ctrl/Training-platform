import React from 'react';
import { Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ConfirmDeleteModalProps {
  confirmDelete: { id: string; type: 'question' | 'objective' | 'link'; title: string } | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  confirmDelete,
  onClose,
  onConfirm
}) => {
  return (
    <AnimatePresence>
      {confirmDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-[var(--bg-card)] border border-[var(--border-color)] p-8 rounded-[2.5rem] max-w-md w-full relative shadow-2xl text-[var(--text-main)]"
          >
            <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mb-6">
              <Trash2 className="text-rose-500 w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-[var(--text-main)] uppercase tracking-tighter mb-2">
              Confirm <span className="text-rose-500">Deletion</span>
            </h3>
            <p className="text-[var(--text-muted)] mb-8 text-sm">
              Are you sure you want to delete this {confirmDelete.type}? This action cannot be undone.
              <span className="block mt-2 text-[var(--text-main)] font-bold italic truncate">"{confirmDelete.title}"</span>
            </p>
            <div className="flex gap-4">
              <button
                onClick={onClose}
                className="flex-1 py-3.5 bg-[var(--bg-surface)] hover:bg-[var(--border-color)] text-[var(--text-main)] rounded-xl font-black uppercase tracking-widest text-[10px] transition-colors border border-[var(--border-color)]"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black uppercase tracking-widest text-[10px] transition-colors shadow-lg shadow-rose-600/20"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmDeleteModal;
