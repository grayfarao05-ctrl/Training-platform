import React, { useState, useEffect } from 'react';
import { UserStats, GalleryCard, SpecialChallenge, AvatarArchetype } from '../../types';
import { 
  getArchetype, 
  getCardsForArchetype, 
  generateArchetypeCards,
  setActiveAvatarCard, 
  LEVEL_TIERS,
  ARCHETYPES,
  subscribeSpecialChallenges,
  subscribeArchetypes
} from '../../galleryService';
import Card from './Card';
import AvatarSelectionModal from './AvatarSelectionModal';
import CardDetailModal from './CardDetailModal';
import { 
  ShieldCheck, 
  Sparkles, 
  Trophy, 
  UserCheck, 
  Lock, 
  Filter, 
  Layers, 
  Award,
  ChevronRight,
  Zap,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { scrollToTop } from '../../scrollUtils';

interface MyGalleryProps {
  userStats: UserStats | null;
  onBack: () => void;
}

export const MyGallery: React.FC<MyGalleryProps> = ({ userStats, onBack }) => {
  const currentArchetypeId = userStats?.avatarArchetype || ARCHETYPES[0].id;
  const [archetypeList, setArchetypeList] = useState<AvatarArchetype[]>(ARCHETYPES);
  const archetype = archetypeList.find((a) => a.id === currentArchetypeId) || getArchetype(currentArchetypeId);
  const userXp = userStats?.xp || 0;

  const [cards, setCards] = useState<GalleryCard[]>([]);
  const [specialChallenges, setSpecialChallenges] = useState<SpecialChallenge[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unlocked' | 'locked' | 'special'>('all');
  const [isArchetypeModalOpen, setIsArchetypeModalOpen] = useState(false);
  const [inspectedCard, setInspectedCard] = useState<GalleryCard | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeArchetypes((list) => {
      setArchetypeList(list);
    });
    return () => unsub();
  }, []);

  // Auto-open avatar selector on first arrival if user has never selected an archetype
  useEffect(() => {
    if (userStats && !userStats.avatarArchetype) {
      setIsArchetypeModalOpen(true);
    }
  }, [userStats?.avatarArchetype]);

  // Load archetype cards
  useEffect(() => {
    const current = archetypeList.find((a) => a.id === currentArchetypeId) || getArchetype(currentArchetypeId);
    const archetypeCards = generateArchetypeCards(current);
    setCards(archetypeCards);
  }, [currentArchetypeId, archetypeList]);

  // Subscribe to special challenges
  useEffect(() => {
    const unsub = subscribeSpecialChallenges((list) => {
      setSpecialChallenges(list);
    });
    return () => unsub();
  }, []);

  const unlockedCardIds = new Set<string>();
  // Archetype cards unlocked by XP
  cards.forEach((c) => {
    // Level 1 is unlocked once they choose an archetype or when XP >= 1000
    if (c.level === 1 || userXp >= c.requiredXp) {
      unlockedCardIds.add(c.id);
    }
  });

  // Also include any user-specific unlocked challenge IDs
  if (userStats?.unlockedCardIds) {
    userStats.unlockedCardIds.forEach((id) => unlockedCardIds.add(id));
  }

  // Active Card ID
  const activeCardId = userStats?.activeCardId || `${currentArchetypeId}-lvl1`;

  // Compute next level target
  const nextLockedTier = LEVEL_TIERS.find((t) => t.xp > userXp) || null;
  const currentLevelTier = [...LEVEL_TIERS].reverse().find((t) => userXp >= t.xp) || LEVEL_TIERS[0];
  const progressToNext = nextLockedTier
    ? Math.min(100, Math.round(((userXp - (currentLevelTier.xp || 0)) / (nextLockedTier.xp - (currentLevelTier.xp || 0))) * 100))
    : 100;

  const handleEquipAvatar = async (card: GalleryCard) => {
    if (!userStats?.uid) return;
    try {
      await setActiveAvatarCard(userStats.uid, card);
      setFeedbackMsg(`Equipped "${card.title} (Level ${card.level})" as your active avatar!`);
      setTimeout(() => setFeedbackMsg(null), 3500);
    } catch (err) {
      console.error('Error equipping card:', err);
    }
  };

  // Convert special challenges into GalleryCard objects
  const specialCards: GalleryCard[] = specialChallenges.map((sc) => ({
    id: `challenge-${sc.id}`,
    title: sc.rewardCardTitle || sc.title,
    subtitle: sc.rewardCardSubtitle || 'SPECIAL CHALLENGE AWARD',
    archetypeId: currentArchetypeId,
    level: 0,
    rankTitle: 'CHALLENGE REWARD',
    rarity: sc.rarity || 'epic',
    quote: sc.quote || 'Forged through elite operational mastery.',
    lore: sc.lore || sc.description,
    stats: sc.stats || { dedication: 9, focus: 9, problemSolving: 9, teamPlayer: 9 },
    artUrl: sc.artUrl || archetype.thumbnailUrl,
    accentColor: sc.accentColor || '#ec4899',
    requiredXp: sc.requiredXp || 0,
    isSpecial: true,
    specialChallengeId: sc.id,
  }));

  const allDisplayCards = [...cards, ...specialCards];

  const filteredCards = allDisplayCards.filter((card) => {
    const isUnlocked = unlockedCardIds.has(card.id);
    if (selectedFilter === 'unlocked') return isUnlocked;
    if (selectedFilter === 'locked') return !isUnlocked;
    if (selectedFilter === 'special') return card.isSpecial;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#050711] text-white p-4 sm:p-6 md:p-10 lg:p-12 relative overflow-hidden">
      {/* Background Ambience */}
      <div
        aria-hidden="true"
        className="absolute top-0 right-1/4 w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none opacity-20 bg-indigo-600"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-10 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none opacity-15"
        style={{ backgroundColor: archetype.accentColor }}
      />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-300/10 pb-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onBack}
              className="w-10 h-10 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-400/20">
                  Tactical Vault
                </span>
                <span className="text-xs text-slate-400 font-bold">• Collectible Identity Cards</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white mt-1">
                My <span className="text-indigo-400">Gallery</span>
              </h1>
            </div>
          </div>

          {/* Operative Switcher Button */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsArchetypeModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-200 border border-indigo-400/30 text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all cursor-pointer hover:scale-[1.02]"
            >
              <UserCheck size={16} />
              <span>Archetype: {archetype.codename}</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert Banner */}
        <AnimatePresence>
          {feedbackMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 text-xs font-bold uppercase tracking-wider flex items-center gap-3 shadow-lg"
            >
              <ShieldCheck size={18} className="text-emerald-400" />
              <span>{feedbackMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Avatar Showcase Hero Banner */}
        <div className="rounded-[32px] bg-gradient-to-r from-[#121629] via-[#0d101d] to-[#070912] border border-indigo-400/20 p-6 sm:p-8 md:p-10 shadow-2xl relative overflow-hidden">
          <div
            aria-hidden="true"
            className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full blur-[90px] opacity-25"
            style={{ backgroundColor: archetype.accentColor }}
          />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
            {/* Left: Active Operative Identity */}
            <div className="space-y-4 max-w-xl">
              <div className="flex items-center gap-2">
                <span 
                  className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider text-black shadow-md"
                  style={{ backgroundColor: archetype.accentColor }}
                >
                  Active Operative
                </span>
                <span className="text-xs text-slate-400 font-mono tracking-wider">
                  {archetype.role}
                </span>
              </div>

              <div>
                <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white">
                  {archetype.name} <span style={{ color: archetype.accentColor }}>"{archetype.codename}"</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                  {archetype.bio}
                </p>
              </div>

              {/* Tagline */}
              <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center gap-2 text-xs italic text-indigo-200">
                <Sparkles size={14} className="text-indigo-400 shrink-0" />
                <span>"{archetype.tagline}"</span>
              </div>
            </div>

            {/* Right: XP Progression to Next Tier Card */}
            <div className="w-full lg:max-w-md bg-black/60 rounded-3xl p-6 border border-white/10 backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy size={16} className="text-amber-400" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-300">Progression Vault</span>
                </div>
                <span className="text-sm font-mono font-black text-indigo-400">{userXp.toLocaleString()} XP</span>
              </div>

              {nextLockedTier ? (
                <>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                      <span>Next: <strong className="text-white">{nextLockedTier.title} (Level {nextLockedTier.level})</strong></span>
                      <span className="font-mono text-indigo-300">{nextLockedTier.xp.toLocaleString()} XP</span>
                    </div>
                    
                    <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden p-0.5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-500 shadow-[0_0_12px_rgba(99,102,241,0.5)]"
                        style={{ width: `${progressToNext}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>{Math.max(0, nextLockedTier.xp - userXp).toLocaleString()} XP remaining</span>
                      <span className="font-bold text-cyan-400">{progressToNext}%</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs font-bold text-center">
                  👑 Maximum Tier Attained! You are a Certified Cyber Titan!
                </div>
              )}

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                <span>Cards Unlocked:</span>
                <span className="font-black text-white">{unlockedCardIds.size} of {allDisplayCards.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white/[0.02] p-4 rounded-2xl border border-white/10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-2 flex items-center gap-1.5">
              <Filter size={12} /> Filter Cards:
            </span>

            {[
              { id: 'all', label: `All (${allDisplayCards.length})` },
              { id: 'unlocked', label: `Unlocked (${unlockedCardIds.size})` },
              { id: 'locked', label: `Locked (${allDisplayCards.length - unlockedCardIds.size})` },
              { id: 'special', label: `Special Challenges (${specialCards.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  selectedFilter === tab.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="text-[11px] font-mono text-slate-400">
            Click any card to inspect or equip as avatar
          </div>
        </div>

        {/* Collectible Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredCards.map((card) => {
            const isUnlocked = unlockedCardIds.has(card.id);
            const isActive = activeCardId === card.id;

            return (
              <Card
                key={card.id}
                card={card}
                isUnlocked={isUnlocked}
                isActiveAvatar={isActive}
                userXp={userXp}
                onEquip={handleEquipAvatar}
                onInspect={setInspectedCard}
              />
            );
          })}
        </div>
      </div>

      {/* Modals */}
      <AvatarSelectionModal
        isOpen={isArchetypeModalOpen}
        onClose={() => setIsArchetypeModalOpen(false)}
        currentArchetypeId={currentArchetypeId}
        uid={userStats?.uid || ''}
        onSelected={(id) => {
          setIsArchetypeModalOpen(false);
          setCards(getCardsForArchetype(id));
        }}
        isFirstTime={!userStats?.avatarArchetype}
      />

      <CardDetailModal
        card={inspectedCard}
        isOpen={Boolean(inspectedCard)}
        onClose={() => setInspectedCard(null)}
        isUnlocked={Boolean(inspectedCard && unlockedCardIds.has(inspectedCard.id))}
        isActiveAvatar={Boolean(inspectedCard && activeCardId === inspectedCard.id)}
        userXp={userXp}
        onEquip={handleEquipAvatar}
      />
    </div>
  );
};
export default MyGallery;

