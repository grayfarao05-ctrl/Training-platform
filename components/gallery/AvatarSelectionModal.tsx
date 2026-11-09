import React, { useState, useEffect } from 'react';
import { ARCHETYPES, setUserArchetype, subscribeArchetypes } from '../../galleryService';
import { AvatarArchetype } from '../../types';
import { X, Check, Sparkles, User, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AvatarSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentArchetypeId?: string;
  uid: string;
  onSelected: (archetypeId: string) => void;
  isFirstTime?: boolean;
}

const getArchetypeFallbackArt = (id: string): string => {
  switch (id) {
    case 'female-learner-1': return '/assets/cards/learner_lvl1.jpg?v=2';
    case 'female-learner-2': return '/assets/cards/female_avatar_2_lvl1.jpg?v=2';
    case 'female-learner-3': return '/assets/cards/female_avatar_3_lvl1.jpg?v=2';
    case 'male-learner-1': return '/assets/cards/male_avatar_1_lvl1.jpg?v=2';
    case 'male-learner-2': return '/assets/cards/male_avatar_2_lvl1.jpg?v=2';
    case 'male-learner-3': return '/assets/cards/male_avatar_3_lvl1.jpg?v=2';
    default: return '/assets/cards/learner_lvl1.jpg?v=2';
  }
};

export const AvatarSelectionModal: React.FC<AvatarSelectionModalProps> = ({
  isOpen,
  onClose,
  currentArchetypeId,
  uid,
  onSelected,
  isFirstTime = false,
}) => {
  const [archetypeList, setArchetypeList] = useState<AvatarArchetype[]>(ARCHETYPES);
  const [selectedId, setSelectedId] = useState<string>(currentArchetypeId || ARCHETYPES[0].id);
  const [genderFilter, setGenderFilter] = useState<'all' | 'female' | 'male'>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      setImgErrors({});
    }
  }, [isOpen]);

  useEffect(() => {
    const unsub = subscribeArchetypes((list) => {
      setArchetypeList(list);
      setImgErrors({});
    });
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const filteredArchetypes = archetypeList.filter((a) => {
    if (genderFilter === 'all') return true;
    return a.gender === genderFilter;
  });

  const selectedArchetype = archetypeList.find((a) => a.id === selectedId) || archetypeList[0];

  const handleConfirm = async () => {
    if (!uid) return;
    setIsSubmitting(true);
    try {
      await setUserArchetype(uid, selectedId);
      onSelected(selectedId);
      onClose();
    } catch (err) {
      console.error('Error setting archetype:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={isFirstTime ? undefined : onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-xl"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative z-10 w-full max-w-4xl bg-gradient-to-b from-[#111422] to-[#080911] border border-indigo-400/30 rounded-3xl shadow-[0_0_50px_rgba(79,70,229,0.25)] overflow-hidden my-8"
        >
          {/* Header */}
          <div className="p-6 md:p-8 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  {isFirstTime ? 'Required Setup' : 'Avatar Identity'}
                </span>
                <span className="text-xs text-slate-400 font-semibold">• 6 Base Operatives (3 Female / 3 Male)</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                Choose Your <span className="text-indigo-400">Avatar Archetype</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
                Select your base operative. As you earn XP and complete special challenges, you will unlock upgraded tactical cards and can equip any card as your active avatar.
              </p>
            </div>

            {!isFirstTime && (
              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            )}
          </div>

          {/* Gender Filter Tabs */}
          <div className="px-6 md:px-8 pt-4 pb-2 flex items-center gap-2 border-b border-white/5 bg-black/20">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-2">Filter:</span>
            {(['all', 'female', 'male'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setGenderFilter(filter)}
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  genderFilter === filter
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {filter === 'all' ? 'All (6)' : filter === 'female' ? 'Female (3)' : 'Male (3)'}
              </button>
            ))}
          </div>

          {/* Archetype Selector Grid */}
          <div className="p-6 md:p-8 grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 max-h-[460px] overflow-y-auto">
            {filteredArchetypes.map((archetype) => {
              const isSelected = archetype.id === selectedId;
              return (
                <div
                  key={archetype.id}
                  onClick={() => setSelectedId(archetype.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group flex flex-col justify-between ${
                    isSelected
                      ? 'bg-indigo-500/15 border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.3)]'
                      : 'bg-white/[0.03] border-white/10 hover:border-white/30 hover:bg-white/[0.06]'
                  }`}
                >
                  {/* Selected Badge */}
                  {isSelected && (
                    <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-md z-20">
                      <Check size={14} />
                    </div>
                  )}

                  {/* Archetype Art Preview */}
                  <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden mb-3 border border-white/10 bg-black">
                    {imgErrors[archetype.id] ? (
                      <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-gradient-to-b from-[#131726] to-[#0a0c16]">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-slate-400 mb-1">
                          <User size={16} />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-wider text-indigo-300">Awaiting Upload</span>
                        <span className="text-[8px] font-bold text-slate-500 uppercase mt-0.5">Level 1 Trainee</span>
                      </div>
                    ) : (
                      <img
                        key={`${archetype.id}-${archetype.thumbnailUrl || ''}`}
                        src={archetype.thumbnailUrl || getArchetypeFallbackArt(archetype.id)}
                        alt={archetype.name}
                        loading="eager"
                        onError={(e) => {
                          const fallback = getArchetypeFallbackArt(archetype.id);
                          const target = e.currentTarget;
                          if (target.src !== fallback && !target.src.endsWith(fallback)) {
                            target.src = fallback;
                          } else {
                            setImgErrors((prev) => ({ ...prev, [archetype.id]: true }));
                          }
                        }}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                    
                    <span 
                      className="absolute bottom-2 left-2 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md text-black shadow-sm"
                      style={{ backgroundColor: archetype.accentColor }}
                    >
                      {archetype.gender}
                    </span>
                  </div>

                  {/* Information */}
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-tight group-hover:text-indigo-300 transition-colors">
                      {archetype.name}
                    </h3>
                    <p 
                      className="text-[10px] font-bold uppercase tracking-wider mb-1"
                      style={{ color: archetype.accentColor }}
                    >
                      {archetype.codename}
                    </p>
                    <p className="text-[10px] text-slate-400 line-clamp-2">
                      {archetype.role}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Archetype Preview & Footer Action */}
          <div className="p-6 md:p-8 border-t border-white/10 bg-black/40 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-black text-lg shrink-0 shadow-lg"
                style={{ backgroundColor: selectedArchetype.accentColor }}
              >
                ★
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-black text-white uppercase tracking-tight">
                    {selectedArchetype.name} • {selectedArchetype.codename}
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400">({selectedArchetype.gender})</span>
                </div>
                <p className="text-xs text-indigo-300 italic">
                  "{selectedArchetype.tagline}"
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleConfirm}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(99,102,241,0.4)] transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <span>Select & Equip Operative</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
export default AvatarSelectionModal;

