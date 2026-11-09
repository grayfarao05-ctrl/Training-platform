import React, { useState } from 'react';
import { TestQuestion } from '../../types';
import ChoiceQuestion from './ChoiceQuestion';
import { ZoomIn, X } from 'lucide-react';

interface ImageQuestionProps {
  question: TestQuestion;
  value: number | null | undefined;
  onChange: (optionIndex: number) => void;
  disabled?: boolean;
  showCorrectness?: boolean;
}

export const ImageQuestion: React.FC<ImageQuestionProps> = ({
  question,
  value,
  onChange,
  disabled = false,
  showCorrectness = false
}) => {
  const [isZoomed, setIsZoomed] = useState(false);

  return (
    <div className="space-y-6">
      {/* Question Image Preview */}
      {question.imageUrl && (
        <div className="relative group max-w-2xl mx-auto rounded-2xl overflow-hidden border border-[var(--border-color)] bg-black/40 shadow-md">
          <img
            src={question.imageUrl}
            alt={question.imageAlt || 'Diagram for question'}
            className="w-full max-h-[380px] object-contain mx-auto cursor-zoom-in transition-transform duration-300 group-hover:scale-[1.01]"
            onClick={() => setIsZoomed(true)}
          />
          <button
            type="button"
            onClick={() => setIsZoomed(true)}
            className="absolute bottom-3 right-3 bg-black/75 hover:bg-black text-white px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider backdrop-blur-md border border-white/20 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-indigo-500"
            title="Tap to zoom image"
          >
            <ZoomIn size={14} /> Tap to Zoom
          </button>
        </div>
      )}

      {/* Alt text caption for accessibility */}
      {question.imageAlt && (
        <p className="text-xs text-[var(--text-muted)] italic text-center max-w-xl mx-auto">
          Figure: {question.imageAlt}
        </p>
      )}

      {/* Lightbox Zoom Modal */}
      {isZoomed && question.imageUrl && (
        <div 
          className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsZoomed(false)}
        >
          <button
            type="button"
            onClick={() => setIsZoomed(false)}
            className="absolute top-4 right-4 p-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl border border-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
            title="Close zoom"
          >
            <X size={20} />
          </button>
          <div 
            className="max-w-5xl max-h-[85vh] overflow-auto rounded-2xl bg-zinc-950 p-2 border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={question.imageUrl}
              alt={question.imageAlt || 'Enlarged diagram'}
              className="max-w-full max-h-[80vh] object-contain mx-auto"
            />
            {question.imageAlt && (
              <p className="text-xs text-gray-400 p-3 text-center border-t border-white/10 mt-2 font-mono">
                {question.imageAlt}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Multiple-choice options underneath */}
      <ChoiceQuestion
        question={question}
        value={value}
        onChange={onChange}
        disabled={disabled}
        showCorrectness={showCorrectness}
      />
    </div>
  );
};

export default ImageQuestion;
