
import React, { useState, useEffect } from 'react';
import { Objective, UserStats } from '../types';
import { Play, Plus, Info, CheckCircle2, Lock, Loader2 } from 'lucide-react';

interface ObjectiveTileProps {
  objective: Objective;
  onClick: (obj: Objective) => void;
  userStats?: UserStats;
  isLocked?: boolean;
}

const ObjectiveTile: React.FC<ObjectiveTileProps> = ({ objective, onClick, userStats, isLocked = false }) => {
  const isCompleted = userStats?.completedObjectives.includes(objective.id) || false;
  const progress = isCompleted ? 100 : 0; // Simplified for this demo, could be based on score
  
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImg = () => {
      const img = objective.thumbnail || `https://loremflickr.com/1280/720/hardware,pc,tech/all?lock=${objective.id.replace(/\./g, '')}`;
      setImageUrl(img);
      setLoading(false);
    };
    fetchImg();
  }, [objective]);

  const handleClick = () => {
    if (!isLocked) onClick(objective);
  };

  return (
    <div 
      className={`relative flex-none w-[280px] md:w-[320px] aspect-video rounded-2xl overflow-hidden group transition-all duration-300 shadow-md bg-[var(--bg-card)] border border-[var(--border-color)] ${
        isLocked ? 'cursor-not-allowed grayscale opacity-60' : 'cursor-pointer hover:scale-105 hover:z-20 hover:border-[var(--accent)] hover:shadow-lg'
      }`}
      onClick={handleClick}
    >
      {/* Background Image */}
      <div className="w-full h-full flex items-center justify-center bg-[var(--bg-panel)]">
        {loading ? (
          <Loader2 className="animate-spin text-[var(--text-muted)]" />
        ) : (
          <img 
            src={imageUrl} 
            alt={objective.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        )}
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/20 z-30">
        <div 
          className={`h-full transition-all duration-700 ${isCompleted ? 'bg-emerald-500 shadow-sm' : 'bg-[var(--accent)]'}`} 
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Locked State Overlay */}
      {isLocked && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40 flex flex-col items-center justify-center">
          <Lock className="text-white/40 mb-2" size={32} />
          <span className="text-[10px] uppercase font-black tracking-widest text-white/40">Complete Previous Objective</span>
        </div>
      )}

      {/* Overlay - Content */}
      {!isLocked && (
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
          <div className="flex items-center justify-between mb-2">
             <h3 className="text-white font-black text-sm uppercase tracking-tighter leading-tight">{objective.title}</h3>
             {isCompleted && <CheckCircle2 size={16} className="text-green-500" />}
          </div>
          <p className="text-gray-300 text-[10px] line-clamp-2 mb-3 leading-snug">{objective.description}</p>
          
          <div className="flex items-center gap-2">
            <button className="bg-white text-black p-2 rounded-full hover:bg-gray-200 transition-colors">
              <Play fill="currentColor" size={12} />
            </button>
            <button className="border border-white/40 text-white p-2 rounded-full hover:bg-white/10 transition-colors" onClick={(e) => { e.stopPropagation(); }}>
              <Plus size={12} />
            </button>
            <div className="ml-auto flex items-center gap-2">
              <span className={`text-[10px] font-black ${isCompleted ? 'text-green-400' : 'text-gray-400'}`}>{progress}%</span>
              <button className="border border-white/40 text-white p-2 rounded-full hover:bg-white/10 transition-colors">
                <Info size={12} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom info bar (Static) */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent group-hover:opacity-0 transition-opacity">
        <span className="text-[10px] uppercase tracking-[0.14em] text-indigo-300 font-bold mb-0.5 block">OBJ {objective.id}</span>
        <h4 className="text-white text-xs font-bold truncate tracking-tight">{objective.title}</h4>
      </div>
    </div>
  );
};

export default ObjectiveTile;
