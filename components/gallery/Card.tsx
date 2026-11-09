import React, { useRef, useState } from 'react';
import { GalleryCard } from '../../types';
import { 
  CheckCircle2, 
  Lock, 
  Sparkles, 
  Laptop, 
  Cog, 
  TrendingUp, 
  Star, 
  Target, 
  Brain, 
  Users as UsersIcon,
  Eye,
  ShieldCheck
} from 'lucide-react';
import { ITrealLogo } from '../ITrealLogo';

interface CardProps {
  card: GalleryCard;
  isUnlocked: boolean;
  isActiveAvatar: boolean;
  userXp: number;
  onEquip?: (card: GalleryCard) => void;
  onInspect?: (card: GalleryCard) => void;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  card,
  isUnlocked,
  isActiveAvatar,
  userXp,
  onEquip,
  onInspect,
  className = '',
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [sheenX, setSheenX] = useState(50);
  const [sheenY, setSheenY] = useState(50);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Subtle 3D tilt
    const rX = ((y - centerY) / centerY) * -10;
    const rY = ((x - centerX) / centerX) * 10;

    setRotateX(rX);
    setRotateY(rY);
    setSheenX((x / rect.width) * 100);
    setSheenY((y / rect.height) * 100);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const renderSegmentedBar = (value: number, total: number = 10, colorHex: string) => {
    return (
      <div className="flex items-center gap-1 w-full max-w-[130px]">
        {Array.from({ length: total }).map((_, i) => {
          const filled = i < value;
          return (
            <div
              key={i}
              className={`h-2 flex-1 rounded-xs transition-all ${
                filled
                  ? 'shadow-[0_0_6px_currentColor]'
                  : 'bg-white/10 opacity-30'
              }`}
              style={{
                backgroundColor: filled ? colorHex : undefined,
                color: colorHex,
              }}
            />
          );
        })}
      </div>
    );
  };

  const xpProgress = Math.min(100, Math.round((userXp / card.requiredXp) * 100));
  const isFullCardArt = 
    card.artUrl.includes('learner_lvl') || 
    card.artUrl.includes('male_avatar_') || 
    card.artUrl.includes('female_avatar_');

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: '1000px',
      }}
      className={`relative select-none transition-transform duration-200 ease-out ${className}`}
    >
      <div
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${isHovered ? 1.02 : 1}, ${isHovered ? 1.02 : 1}, 1)`,
          transformStyle: 'preserve-3d',
        }}
        className={`relative w-full max-w-[380px] mx-auto rounded-3xl p-2.5 sm:p-3 transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-2xl ${
          isUnlocked
            ? 'bg-gradient-to-b from-[#131722] via-[#0d1019] to-[#07090e] border border-white/15'
            : 'bg-gradient-to-b from-[#0e1017] to-[#06080d] border border-white/5 opacity-80 grayscale-[35%]'
        }`}
      >
        {/* Holographic Sheen Layer */}
        {isHovered && isUnlocked && (
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none rounded-3xl z-30 transition-opacity duration-300 opacity-35"
            style={{
              background: `radial-gradient(circle at ${sheenX}% ${sheenY}%, rgba(255, 255, 255, 0.45) 0%, rgba(34, 197, 94, 0.15) 30%, transparent 65%)`,
            }}
          />
        )}

        {/* Ambient Top Glow */}
        <div
          aria-hidden="true"
          className="absolute -top-14 left-1/2 -translate-x-1/2 w-48 h-32 rounded-full blur-[50px] pointer-events-none opacity-40"
          style={{ backgroundColor: card.accentColor }}
        />

        {isFullCardArt ? (
          /* Render Full-Bleed Artwork Card (Exact reproduction of uploaded reference cards) */
          <div className="relative flex flex-col h-full rounded-2xl overflow-hidden bg-black border border-white/10 group">
            <div className="relative w-full aspect-[1/1.42] overflow-hidden bg-black">
              <img
                src={card.artUrl}
                alt={card.title}
                className={`w-full h-full object-cover transition-transform duration-500 ${
                  isHovered ? 'scale-103' : 'scale-100'
                }`}
              />

              {/* Inspect Button on hover */}
              {onInspect && (
                <button
                  type="button"
                  onClick={() => onInspect(card)}
                  className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/75 hover:bg-black text-white text-[10px] font-bold uppercase tracking-wider border border-white/20 flex items-center gap-1 backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow-lg z-20"
                >
                  <Eye size={12} /> Inspect
                </button>
              )}

              {/* Locked Overlay if not unlocked */}
              {!isUnlocked && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 text-center z-20">
                  <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-2 text-slate-300">
                    <Lock size={18} />
                  </div>
                  <span className="text-xs font-black uppercase tracking-wider text-white mb-1">
                    Locked Tier
                  </span>
                  <span className="text-[10px] text-slate-300 font-bold mb-2">
                    Requires {card.requiredXp.toLocaleString()} XP
                  </span>
                  <div className="w-36 bg-white/10 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all"
                      style={{ width: `${xpProgress}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1">
                    {userXp.toLocaleString()} / {card.requiredXp.toLocaleString()} XP ({xpProgress}%)
                  </span>
                </div>
              )}
            </div>

            {/* Bottom Action Footer */}
            <div className="p-3 bg-[#0a0d14] border-t border-white/10 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: card.accentColor, boxShadow: `0 0 8px ${card.accentColor}` }}
                />
                <span className="text-[11px] font-black uppercase tracking-tight text-white">
                  {card.title} • LVL {card.level}
                </span>
              </div>

              {isUnlocked ? (
                isActiveAvatar ? (
                  <div className="flex items-center gap-1 text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                    <ShieldCheck size={13} /> Active Avatar
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onEquip && onEquip(card)}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center gap-1.5 hover:scale-105 active:scale-95 text-black"
                    style={{ backgroundColor: card.accentColor }}
                  >
                    <Sparkles size={11} /> Equip Avatar
                  </button>
                )
              ) : (
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  {Math.max(0, card.requiredXp - userXp).toLocaleString()} XP to unlock
                </span>
              )}
            </div>
          </div>
        ) : (
          /* Dynamic Component Layout for Cards with Separate Character Artwork */
          <div className="relative z-10 flex flex-col h-full rounded-2xl bg-[#090c13]/90 border border-white/10 p-3 sm:p-3.5 backdrop-blur-md">
          {/* Card Header: ITreal Brand on left, LEVEL on right */}
          <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2.5">
            <div className="flex items-center gap-2">
              <div 
                className="w-5 h-5 rounded-md flex items-center justify-center font-black text-[10px] text-black shadow-sm"
                style={{ backgroundColor: card.accentColor }}
              >
                IT
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black tracking-wider text-white">ITreal</span>
                <span className="text-[8px] font-bold text-slate-400 tracking-tight">Real Skills. Real Paths.</span>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-center gap-1.5 justify-end">
                <span className="text-[10px] font-bold text-slate-400 tracking-wider">LEVEL</span>
                <span 
                  className="text-sm font-black tracking-tight"
                  style={{ color: card.accentColor }}
                >
                  {card.level}
                </span>
              </div>
              <span className="text-[8px] font-black tracking-widest text-slate-300 uppercase">
                {card.rankTitle}
              </span>
            </div>
          </div>

          {/* Main Visual Artwork Area */}
          <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border border-white/15 bg-slate-900 group">
            <img
              src={card.artUrl}
              alt={card.title}
              className={`w-full h-full object-cover object-top transition-transform duration-500 ${
                isHovered ? 'scale-105' : 'scale-100'
              }`}
            />

            {/* Dark Vignette Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

            {/* Left Hex Badges (LEARN, PRACTICE, GROW) */}
            <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-20">
              <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2 py-1 rounded-lg border border-emerald-500/40 shadow-sm">
                <Laptop size={11} className="text-emerald-400" />
                <div className="flex flex-col leading-none">
                  <span className="text-[8px] font-black text-white uppercase">Learn</span>
                  <span className="text-[6px] text-emerald-300 uppercase">Build Skills</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2 py-1 rounded-lg border border-amber-500/40 shadow-sm">
                <Cog size={11} className="text-amber-400" />
                <div className="flex flex-col leading-none">
                  <span className="text-[8px] font-black text-white uppercase">Practice</span>
                  <span className="text-[6px] text-amber-300 uppercase">Gain Exp</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2 py-1 rounded-lg border border-cyan-500/40 shadow-sm">
                <TrendingUp size={11} className="text-cyan-400" />
                <div className="flex flex-col leading-none">
                  <span className="text-[8px] font-black text-white uppercase">Grow</span>
                  <span className="text-[6px] text-cyan-300 uppercase">Open Doors</span>
                </div>
              </div>
            </div>

            {/* Top Right Quote */}
            <div className="absolute top-2.5 right-2.5 max-w-[140px] text-right z-20">
              <span className="text-[9px] italic font-semibold text-white/90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] leading-tight block">
                "{card.quote}"
              </span>
            </div>

            {/* Inspect Button on hover */}
            {onInspect && (
              <button
                type="button"
                onClick={() => onInspect(card)}
                className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-black/75 hover:bg-black text-white text-[10px] font-bold uppercase tracking-wider border border-white/20 flex items-center gap-1 backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow-lg z-20"
              >
                <Eye size={12} /> Inspect
              </button>
            )}

            {/* Locked Overlay if not unlocked */}
            {!isUnlocked && (
              <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 text-center z-20">
                <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-2 text-slate-300">
                  <Lock size={18} />
                </div>
                <span className="text-xs font-black uppercase tracking-wider text-white mb-1">
                  Locked Tier
                </span>
                <span className="text-[10px] text-slate-300 font-bold mb-2">
                  Requires {card.requiredXp.toLocaleString()} XP
                </span>
                <div className="w-36 bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all"
                    style={{ width: `${xpProgress}%` }}
                  />
                </div>
                <span className="text-[9px] text-slate-400 mt-1">
                  {userXp.toLocaleString()} / {card.requiredXp.toLocaleString()} XP ({xpProgress}%)
                </span>
              </div>
            )}
          </div>

          {/* Title Banner (THE LEARNER / THE OPERATOR etc.) */}
          <div className="mt-3 p-2.5 rounded-xl bg-gradient-to-r from-black/80 via-slate-900/90 to-black/80 border border-white/10 relative overflow-hidden">
            <div
              aria-hidden="true"
              className="absolute left-0 top-0 bottom-0 w-1"
              style={{ backgroundColor: card.accentColor }}
            />
            <div className="flex items-center justify-between">
              <div>
                <h3 
                  className="text-base sm:text-lg font-black tracking-tight uppercase leading-none drop-shadow-[0_0_8px_currentColor]"
                  style={{ color: card.accentColor }}
                >
                  {card.title}
                </h3>
                <p className="text-[9px] font-mono tracking-wider text-slate-300 uppercase mt-0.5">
                  {card.subtitle}
                </p>
              </div>

              {isActiveAvatar && (
                <div className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-[0_0_10px_rgba(34,197,94,0.3)]">
                  <CheckCircle2 size={10} /> Active
                </div>
              )}
            </div>
          </div>

          {/* Flavor Lore Box */}
          <div className="my-2 p-2 rounded-lg bg-black/40 border border-white/5">
            <p className="text-[10px] text-slate-300/90 leading-relaxed font-normal">
              {card.lore}
            </p>
          </div>

          {/* Stats & Unlock Hex Seal Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 items-center bg-black/60 rounded-xl p-2.5 border border-white/10">
            {/* 4 Segmented Stat Bars */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[9px] font-bold text-slate-300">
                <span className="flex items-center gap-1">
                  <Star size={10} className="text-amber-400" /> DEDICATION
                </span>
                {renderSegmentedBar(card.stats.dedication, 10, '#f59e0b')}
              </div>

              <div className="flex items-center justify-between text-[9px] font-bold text-slate-300">
                <span className="flex items-center gap-1">
                  <Target size={10} className="text-cyan-400" /> FOCUS
                </span>
                {renderSegmentedBar(card.stats.focus, 10, '#06b6d4')}
              </div>

              <div className="flex items-center justify-between text-[9px] font-bold text-slate-300">
                <span className="flex items-center gap-1">
                  <Brain size={10} className="text-purple-400" /> PROBLEM SOLVING
                </span>
                {renderSegmentedBar(card.stats.problemSolving, 10, '#a855f7')}
              </div>

              <div className="flex items-center justify-between text-[9px] font-bold text-slate-300">
                <span className="flex items-center gap-1">
                  <UsersIcon size={10} className="text-emerald-400" /> TEAM PLAYER
                </span>
                {renderSegmentedBar(card.stats.teamPlayer, 10, '#22c55e')}
              </div>
            </div>

            {/* Hexagonal Unlock Badge */}
            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-gradient-to-b from-white/10 to-transparent border border-white/15 text-center shrink-0 min-w-[85px]">
              {isUnlocked ? (
                <>
                  <div 
                    className="w-7 h-7 rounded-full flex items-center justify-center mb-1 text-black font-black text-xs shadow-md"
                    style={{ backgroundColor: card.accentColor }}
                  >
                    ★
                  </div>
                  <span className="text-[8px] font-black uppercase text-slate-200">
                    UNLOCKED
                  </span>
                  <span 
                    className="text-[9px] font-black uppercase tracking-tight"
                    style={{ color: card.accentColor }}
                  >
                    LEVEL {card.level}
                  </span>
                </>
              ) : (
                <>
                  <Lock size={16} className="text-slate-400 mb-1" />
                  <span className="text-[8px] font-black uppercase text-slate-400">
                    LOCKED
                  </span>
                  <span className="text-[8px] font-mono text-slate-500">
                    {card.requiredXp} XP
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Action Row: Equip as Avatar */}
          <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between gap-2">
            <span className="text-[8px] font-mono tracking-widest text-slate-500 uppercase">
              ITreal • WESTERN CAPE
            </span>

            {isUnlocked ? (
              isActiveAvatar ? (
                <div className="flex items-center gap-1 text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                  <ShieldCheck size={13} /> Active Avatar
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onEquip && onEquip(card)}
                  className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center gap-1.5 hover:scale-105 active:scale-95 text-black"
                  style={{ backgroundColor: card.accentColor }}
                >
                  <Sparkles size={11} /> Equip Avatar
                </button>
              )
            ) : (
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                Earn {Math.max(0, card.requiredXp - userXp).toLocaleString()} XP to unlock
              </span>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  );
};
export default Card;

