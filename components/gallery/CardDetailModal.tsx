import React from 'react';
import { GalleryCard } from '../../types';
import { X, Sparkles, CheckCircle2, Star, Target, Brain, Users, ShieldCheck, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CardDetailModalProps {
  card: GalleryCard | null;
  isOpen: boolean;
  onClose: () => void;
  isUnlocked: boolean;
  isActiveAvatar: boolean;
  userXp: number;
  onEquip: (card: GalleryCard) => void;
}

export const CardDetailModal: React.FC<CardDetailModalProps> = ({
  card,
  isOpen,
  onClose,
  isUnlocked,
  isActiveAvatar,
  userXp,
  onEquip,
}) => {
  if (!isOpen || !card) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-xl"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative z-10 w-full max-w-2xl bg-gradient-to-b from-[#131724] to-[#070910] border border-white/20 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-6 border-b border-white/10 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span 
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-black"
                  style={{ backgroundColor: card.accentColor }}
                >
                  LEVEL {card.level} • {card.rankTitle}
                </span>
                <span className="text-xs uppercase font-mono text-slate-400">
                  {card.rarity.toUpperCase()} COLLECTIBLE
                </span>
              </div>
              <h2 
                className="text-2xl sm:text-3xl font-black uppercase tracking-tight"
                style={{ color: card.accentColor }}
              >
                {card.title}
              </h2>
              <p className="text-xs text-slate-400 font-mono tracking-wider mt-0.5">
                {card.subtitle}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Grid Layout: Art on left, Stats on right */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
            {/* Card Portrait */}
            <div className="relative rounded-2xl overflow-hidden border border-white/15 bg-black aspect-[3/4] shadow-2xl">
              <img
                src={card.artUrl}
                alt={card.title}
                className="w-full h-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

              <div className="absolute bottom-3 left-3 right-3 text-center">
                <span className="text-[10px] italic text-white/90 drop-shadow-md">
                  "{card.quote}"
                </span>
              </div>
            </div>

            {/* Lore and Specs */}
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-black/50 border border-white/10">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Operative Directive</span>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {card.lore}
                </p>
              </div>

              {/* Segmented Stats */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-black/50 border border-white/10">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Tactical Attribute Ratings</span>
                
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-1.5"><Star size={12} className="text-amber-400" /> Dedication</span>
                  <span className="font-mono text-amber-400">{card.stats.dedication} / 10</span>
                </div>

                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-1.5"><Target size={12} className="text-cyan-400" /> Focus</span>
                  <span className="font-mono text-cyan-400">{card.stats.focus} / 10</span>
                </div>

                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-1.5"><Brain size={12} className="text-purple-400" /> Problem Solving</span>
                  <span className="font-mono text-purple-400">{card.stats.problemSolving} / 10</span>
                </div>

                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-1.5"><Users size={12} className="text-emerald-400" /> Team Player</span>
                  <span className="font-mono text-emerald-400">{card.stats.teamPlayer} / 10</span>
                </div>
              </div>

              {/* XP Requirement */}
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400">XP Threshold</span>
                <span className="text-xs font-mono font-black text-white">{card.requiredXp.toLocaleString()} XP</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
            {isUnlocked ? (
              isActiveAvatar ? (
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-400">
                  <ShieldCheck size={18} />
                  <span>Currently Equipped as Active Avatar</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onEquip(card);
                    onClose();
                  }}
                  className="px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-black flex items-center gap-2 shadow-lg hover:scale-105 transition-all cursor-pointer"
                  style={{ backgroundColor: card.accentColor }}
                >
                  <Sparkles size={14} /> Equip As Active Avatar
                </button>
              )
            ) : (
              <div className="flex items-center gap-2 text-xs text-slate-400 font-bold uppercase tracking-wider">
                <Lock size={16} />
                <span>Locked — Reach {card.requiredXp.toLocaleString()} XP to unlock</span>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
export default CardDetailModal;

