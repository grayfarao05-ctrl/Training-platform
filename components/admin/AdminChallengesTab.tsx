import React, { useState, useEffect } from 'react';
import { UserStats, SpecialChallenge, CardRarity } from '../../types';
import { 
  subscribeSpecialChallenges, 
  createSpecialChallenge, 
  awardChallengeCardToStudent, 
  awardChallengeCardToAll 
} from '../../galleryService';
import { db } from '../../firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { 
  Award, 
  Plus, 
  Trash2, 
  Send, 
  Sparkles, 
  Users, 
  ShieldCheck, 
  Star, 
  Target, 
  Brain, 
  Users as UsersIcon,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminChallengesTabProps {
  users: UserStats[];
  setAdminFeedback: (msg: string | null) => void;
}

export const AdminChallengesTab: React.FC<AdminChallengesTabProps> = ({
  users,
  setAdminFeedback,
}) => {
  const [challenges, setChallenges] = useState<SpecialChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rewardCardTitle, setRewardCardTitle] = useState('');
  const [rewardCardSubtitle, setRewardCardSubtitle] = useState('');
  const [rarity, setRarity] = useState<CardRarity>('epic');
  const [accentColor, setAccentColor] = useState('#22c55e');
  const [quote, setQuote] = useState('Excellence through real rigor.');
  const [lore, setLore] = useState('Awarded for exceptional skill mastery in cybersecurity operations.');
  const [artUrl, setArtUrl] = useState('/assets/cards/learner_lvl1.jpg');
  const [requiredXp, setRequiredXp] = useState(2500);

  // Award State
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);
  const [targetStudentUid, setTargetStudentUid] = useState<string>('');
  const [isAwarding, setIsAwarding] = useState(false);

  useEffect(() => {
    const unsub = subscribeSpecialChallenges((list) => {
      setChallenges(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !rewardCardTitle) {
      alert('Please fill out challenge and card titles.');
      return;
    }

    setSubmitting(true);
    try {
      await createSpecialChallenge({
        title,
        description,
        rewardCardTitle,
        rewardCardSubtitle: rewardCardSubtitle || 'SPECIAL OPS MISSION',
        rarity,
        accentColor,
        quote,
        lore,
        artUrl,
        requiredXp,
        conditionType: 'manual_grant',
        stats: {
          dedication: 9,
          focus: 9,
          problemSolving: 10,
          teamPlayer: 8,
        },
      });

      setAdminFeedback(`Created special challenge "${title}" successfully!`);
      setIsCreating(false);
      // Reset
      setTitle('');
      setDescription('');
      setRewardCardTitle('');
      setRewardCardSubtitle('');
    } catch (err) {
      console.error('Error creating challenge:', err);
      alert('Failed to save challenge.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteChallenge = async (id: string, challengeTitle: string) => {
    if (!confirm(`Are you sure you want to delete challenge "${challengeTitle}"?`)) return;
    try {
      await deleteDoc(doc(db, 'special_challenges', id));
      setAdminFeedback(`Deleted challenge "${challengeTitle}".`);
    } catch (err) {
      console.error('Error deleting challenge:', err);
    }
  };

  const handleAwardToSingleStudent = async (challenge: SpecialChallenge) => {
    if (!targetStudentUid) {
      alert('Please select a student first.');
      return;
    }
    setIsAwarding(true);
    try {
      await awardChallengeCardToStudent(targetStudentUid, challenge);
      const student = users.find((u) => u.uid === targetStudentUid);
      setAdminFeedback(`Awarded "${challenge.rewardCardTitle}" to ${student?.displayName || 'student'}!`);
      setSelectedChallengeId(null);
    } catch (err) {
      console.error('Error awarding challenge:', err);
    } finally {
      setIsAwarding(false);
    }
  };

  const handleAwardToAll = async (challenge: SpecialChallenge) => {
    if (!confirm(`Award "${challenge.rewardCardTitle}" card to ALL ${users.length} enrolled students?`)) return;
    setIsAwarding(true);
    try {
      const count = await awardChallengeCardToAll(challenge);
      setAdminFeedback(`Awarded challenge card to ${count} students!`);
    } catch (err) {
      console.error('Error awarding to all:', err);
    } finally {
      setIsAwarding(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Tab Header */}
      <div className="bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border-color)] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Operative Rewards
            </span>
            <span className="text-xs text-[var(--text-muted)]">• Student Gallery Collectibles</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[var(--text-main)]">
            Special Challenges & <span className="text-emerald-400">Card Achievements</span>
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1 max-w-xl">
            Design exclusive collectible cards for competitions, milestones, and high achievers. Students can unlock and equip these cards as their active avatar.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreating(!isCreating)}
          className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg cursor-pointer shrink-0"
        >
          {isCreating ? 'Cancel' : <><Plus size={16} /> Create Challenge Card</>}
        </button>
      </div>

      {/* Creation Form */}
      <AnimatePresence>
        {isCreating && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCreateChallenge}
            className="bg-[var(--bg-card)] rounded-[2rem] border border-emerald-500/30 p-6 sm:p-8 shadow-xl space-y-6 overflow-hidden"
          >
            <h3 className="text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
              <Sparkles size={18} className="text-emerald-400" />
              New Special Challenge & Card Config
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] block mb-1">
                  Challenge Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Subnet Speedrun Grand Master"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] block mb-1">
                  Reward Card Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. THE PACKET HUNTER"
                  value={rewardCardTitle}
                  onChange={(e) => setRewardCardTitle(e.target.value)}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] block mb-1">
                  Card Subtitle / Mission Tag
                </label>
                <input
                  type="text"
                  placeholder="e.g. SPECIAL OPS: ZERO LATENCY"
                  value={rewardCardSubtitle}
                  onChange={(e) => setRewardCardSubtitle(e.target.value)}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] block mb-1">
                  Card Artwork URL / Asset Path
                </label>
                <input
                  type="text"
                  placeholder="/assets/cards/learner_lvl1.jpg"
                  value={artUrl}
                  onChange={(e) => setArtUrl(e.target.value)}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] block mb-1">
                  Rarity Tier
                </label>
                <select
                  value={rarity}
                  onChange={(e) => setRarity(e.target.value as CardRarity)}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="common">Common (White)</option>
                  <option value="uncommon">Uncommon (Cyan)</option>
                  <option value="rare">Rare (Blue)</option>
                  <option value="epic">Epic (Purple / Gold)</option>
                  <option value="legendary">Legendary (Golden Cyber)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] block mb-1">
                  Accent Color Hex
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-10 h-10 rounded-xl bg-transparent border-none cursor-pointer"
                  />
                  <input
                    type="text"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="flex-1 bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] text-xs rounded-xl p-3 font-mono"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] block mb-1">
                Challenge Description / Requirements
              </label>
              <textarea
                rows={2}
                placeholder="Describe how a student achieves this challenge..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] block mb-1">
                Flavor Lore & Card Quote
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Quote (e.g. Speed and precision conquer all.)"
                  value={quote}
                  onChange={(e) => setQuote(e.target.value)}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] text-xs rounded-xl p-3"
                />
                <input
                  type="text"
                  placeholder="Lore (e.g. Awarded to elite graduates who beat the exam speed challenge.)"
                  value={lore}
                  onChange={(e) => setLore(e.target.value)}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] text-xs rounded-xl p-3"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 rounded-xl bg-white/5 text-[var(--text-muted)] text-xs font-bold uppercase tracking-wider hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                <span>Publish Challenge Card</span>
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Challenges List */}
      <div className="bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border-color)] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between">
          <h3 className="text-base font-black uppercase tracking-tight text-[var(--text-main)] flex items-center gap-2">
            <Award size={18} className="text-emerald-400" />
            Active Challenge Cards ({challenges.length})
          </h3>
          <span className="text-xs text-[var(--text-muted)]">Award cards directly to students</span>
        </div>

        {challenges.length === 0 ? (
          <div className="p-12 text-center text-[var(--text-muted)] space-y-2">
            <Award size={36} className="mx-auto opacity-40 text-emerald-400" />
            <p className="text-sm font-bold uppercase tracking-wider">No Special Challenges Created Yet</p>
            <p className="text-xs">Click "Create Challenge Card" above to craft your first special achievement card.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-color)]">
            {challenges.map((c) => (
              <div key={c.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-start gap-4">
                  <div 
                    className="w-14 h-14 rounded-2xl overflow-hidden border border-white/20 shrink-0 bg-black flex items-center justify-center shadow-md"
                    style={{ borderColor: c.accentColor }}
                  >
                    {c.artUrl ? (
                      <img src={c.artUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Award size={24} style={{ color: c.accentColor }} />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-black uppercase tracking-tight text-[var(--text-main)]">
                        {c.rewardCardTitle}
                      </h4>
                      <span 
                        className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider text-black shadow-sm"
                        style={{ backgroundColor: c.accentColor }}
                      >
                        {c.rarity}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-slate-300 mt-0.5">
                      Challenge: {c.title}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-1 max-w-xl">
                      {c.description || c.lore}
                    </p>
                  </div>
                </div>

                {/* Award & Delete Controls */}
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedChallengeId === c.id ? (
                    <div className="flex items-center gap-2 bg-[var(--bg-surface)] p-2 rounded-2xl border border-emerald-500/40">
                      <select
                        value={targetStudentUid}
                        onChange={(e) => setTargetStudentUid(e.target.value)}
                        className="bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] text-xs rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
                      >
                        <option value="">Select Student...</option>
                        {users.map((u) => (
                          <option key={u.uid} value={u.uid}>
                            {u.displayName} ({u.email})
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        disabled={isAwarding || !targetStudentUid}
                        onClick={() => handleAwardToSingleStudent(c)}
                        className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                      >
                        <Send size={12} /> Award
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedChallengeId(null)}
                        className="px-2 py-2 text-xs text-[var(--text-muted)] hover:text-white"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedChallengeId(c.id);
                          setTargetStudentUid(users[0]?.uid || '');
                        }}
                        className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Send size={13} className="text-emerald-400" />
                        <span>Award Student</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAwardToAll(c)}
                        className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Award this card to all enrolled students"
                      >
                        <Users size={13} className="text-cyan-400" />
                        <span>Award All</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteChallenge(c.id, c.title)}
                        className="w-9 h-9 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/30 text-[var(--text-muted)] hover:text-rose-400 flex items-center justify-center transition-colors cursor-pointer"
                        title="Delete Challenge"
                      >
                        <Trash2 size={15} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default AdminChallengesTab;

