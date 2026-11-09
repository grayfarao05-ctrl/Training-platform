import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-color)]">
          <h3 className="text-xl font-bold tracking-tight text-[var(--text-main)]">{title}</h3>
          <button 
            onClick={onClose}
            className="px-3.5 py-1.5 bg-[var(--bg-panel)] text-[var(--text-main)] hover:bg-[var(--hover-bg)] border border-[var(--border-color)] rounded-xl transition-all shadow-sm flex items-center gap-2 font-bold uppercase tracking-wider text-[11px]"
          >
            <ArrowLeft size={14} /> Close
          </button>
        </div>
        <div className="p-6 text-[var(--text-secondary)]">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
