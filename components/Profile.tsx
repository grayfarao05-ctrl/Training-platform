import React, { useRef, useState } from 'react';
import { UserStats, Rank, Badge } from '../types';
import { RANKS, BADGES, calculateLevel } from '../constants';
import { Shield, Award, Flame, Star, Hexagon, Trophy, CheckCircle, Lock, Crown, ArrowLeft, Camera, Loader2, Trash2 } from 'lucide-react';
import { auth, db, doc, updateDoc, handleFirestoreError, OperationType, clearUserStorage } from '../firebase';
import { collection, getDocs, deleteDoc } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { 
  NetworkBackdrop, 
  GradientDrift, 
  getStoredReducedMotion, 
  setStoredReducedMotion, 
  useReducedMotionAndVisibility 
} from '../animations';

interface ProfileProps {
  stats: UserStats;
  onLogout: () => void;
  onBack: () => void;
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
}

const Profile: React.FC<ProfileProps> = ({ stats, onLogout, onBack, onOpenPrivacy, onOpenTerms }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [reduceAnimations, setReduceAnimations] = useState<boolean>(() => {
    const stored = getStoredReducedMotion();
    if (stored !== null) return stored;
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  const handleToggleReduceAnimations = (val: boolean) => {
    setReduceAnimations(val);
    setStoredReducedMotion(val);
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const uid = stats.uid;
      // 1. Delete all user subcollections
      const subcollections = ['testResults', 'notes', 'folders', 'files', 'todo', 'notifications'];
      for (const sub of subcollections) {
        try {
          const snap = await getDocs(collection(db, 'users', uid, sub));
          for (const d of snap.docs) {
            await deleteDoc(d.ref);
          }
        } catch (subErr) {
          console.warn(`Subcollection deletion skipped for ${sub}:`, subErr);
        }
      }

      // 2. Delete leaderboard entry
      try {
        await deleteDoc(doc(db, 'leaderboard', uid));
      } catch (lbErr) {
        console.warn('Leaderboard deletion skipped:', lbErr);
      }

      // 3. Delete user document
      try {
        await deleteDoc(doc(db, 'users', uid));
      } catch (userDocErr) {
        console.warn('User doc deletion skipped:', userDocErr);
      }

      // 4. Delete Auth user account
      if (auth.currentUser) {
        try {
          await deleteUser(auth.currentUser);
        } catch (authErr: any) {
          if (authErr?.code === 'auth/requires-recent-login') {
            setDeleteError('Security requirement: Please log out, log back in, and retry deletion immediately.');
            setIsDeleting(false);
            return;
          }
          throw authErr;
        }
      }

      // Clear local storage & notify logout
      clearUserStorage();
      onLogout();
    } catch (err: any) {
      console.error('Account deletion error:', err);
      setDeleteError(err?.message || 'Failed to complete deletion. Please try again or contact our Information Officer.');
      setIsDeleting(false);
    }
  };

  const currentRankIndex = RANKS.findIndex((r, idx) => 
    stats.xp >= r.minXp && (idx === RANKS.length - 1 || stats.xp < RANKS[idx + 1].minXp)
  );
  const currentRank = RANKS[currentRankIndex];

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 256;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const base64String = canvas.toDataURL('image/jpeg', 0.8);
          
          try {
            const userRef = doc(db, 'users', stats.uid);
            await updateDoc(userRef, { photoURL: base64String });
          } catch (err) {
            handleFirestoreError(err, OperationType.UPDATE, 'users');
          } finally {
            setIsUploading(false);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading image:", error);
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 md:p-12 lg:p-16 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-300">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors uppercase font-black tracking-widest text-xs"
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <header className="saas-hero-card flex flex-col md:flex-row items-center gap-10 text-white p-8 md:p-12 rounded-[2.5rem] relative overflow-hidden">
        <div className="portal-ray-core" />
        <NetworkBackdrop accentColor="#6366f1" />
        <GradientDrift primaryColor="#4f46e5" secondaryColor="#818cf8" />
        
        <div className="relative group shrink-0 z-10">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            accept="image/*" 
            className="hidden" 
          />
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-40 h-40 rounded-[2rem] bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center shadow-xl transition-all duration-300 overflow-hidden cursor-pointer relative"
          >
            {isUploading ? (
              <Loader2 className="text-white w-10 h-10 animate-spin" />
            ) : stats.photoURL ? (
              <img src={stats.photoURL} alt={stats.displayName} className="w-full h-full object-cover" />
            ) : (
              <Crown className="text-white w-18 h-18 drop-shadow-lg" />
            )}
             
            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-1.5">
              <Camera className="text-white w-6 h-6" />
              <span className="text-white font-black text-[9px] uppercase tracking-wider">Change Photo</span>
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-3 shadow-lg z-20 flex flex-col items-center min-w-[90px]">
            <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-wider mb-0.5">Tech Level</span>
            <span className="text-2xl font-black text-amber-400 font-mono leading-none">0{calculateLevel(stats.xp)}</span>
          </div>
        </div>

        <div className="flex-1 text-center md:text-left min-w-0 z-10">
          <span className="text-indigo-400 font-black uppercase tracking-widest text-xs inline-block mb-1.5">
            {stats.role === 'admin' ? 'Platform Administrator' : 'Certification Candidate'}
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight mb-4 truncate">
            {stats.displayName}
          </h2>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
            <div className="flex items-center gap-2 text-slate-300 font-bold uppercase tracking-wider text-xs">
              <Flame className="text-orange-400" size={16} /> {stats.streak} Day Streak
            </div>
            <div className="flex items-center gap-2 text-slate-300 font-bold uppercase tracking-wider text-xs">
              <Shield className="text-cyan-400" size={16} /> {stats.completedObjectives.length} Objectives Done
            </div>
            <button 
              onClick={onLogout}
              className="px-4 py-2 bg-white/10 hover:bg-red-500/20 text-red-400 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all border border-white/10"
            >
              Sign Out
            </button>
          </div>
        </div>

        <div className="text-center md:text-right shrink-0 z-10">
          <p className="text-3xl sm:text-4xl font-black text-white font-mono">{stats.xp.toLocaleString()}</p>
          <p className="text-xs font-black uppercase tracking-widest text-slate-300">Total XP Earned</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Achievement Badges */}
        <div className="lg:col-span-2 space-y-10">
          <section>
            <h2 className="text-2xl font-black text-[var(--text-main)] uppercase tracking-tight mb-6 flex items-center gap-3">
              <Award className="text-indigo-400" /> Achievement Gallery
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              {BADGES.map((badge) => {
                const isUnlocked = stats.badges.includes(badge.id);
                return (
                  <div 
                    key={badge.id} 
                    className={`bg-[var(--bg-card)] border ${isUnlocked ? 'border-indigo-500/40' : 'border-[var(--border-color)] opacity-50 grayscale'} p-6 rounded-3xl transition-all hover:scale-105 shadow-md text-center flex flex-col items-center`}
                  >
                    <div className={`w-14 h-14 rounded-2xl mb-3 flex items-center justify-center ${isUnlocked ? 'bg-indigo-600 text-white' : 'bg-[var(--bg-surface)] text-[var(--text-muted)]'}`}>
                      <Hexagon size={26} />
                    </div>
                    <h3 className="text-[var(--text-main)] font-black uppercase tracking-tight text-xs mb-1.5">{badge.name}</h3>
                    <p className="text-[var(--text-muted)] text-[10px] font-medium leading-relaxed">{badge.description}</p>
                    {!isUnlocked && <Lock size={12} className="mt-3 text-[var(--text-muted)]" />}
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-black text-[var(--text-main)] uppercase tracking-tight mb-6 flex items-center gap-3">
              <Trophy className="text-amber-400" /> Unlocked Rewards
            </h2>
            <div className="space-y-3">
              {RANKS.filter(r => stats.xp >= r.minXp).map((rank) => (
                <div key={rank.title} className="bg-[var(--bg-card)] border border-[var(--border-color)] p-5 rounded-2xl flex items-center justify-between group hover:border-indigo-500/40 transition-all shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-emerald-500/15 text-emerald-400 rounded-xl flex items-center justify-center">
                      <CheckCircle size={18} />
                    </div>
                    <div>
                      <p className="text-[var(--text-main)] font-black text-sm uppercase tracking-tight">{rank.reward}</p>
                      <p className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-wider">Tier: {rank.title}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full">
                    Unlocked
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Rank Progression */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-8 rounded-[2.5rem] shadow-xl h-fit">
          <h3 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tight mb-6">Rank Progression</h3>
          <div className="space-y-6 relative">
            <div className="absolute left-4 top-3 bottom-3 w-0.5 bg-[var(--border-color)]" />
            {RANKS.map((rank, idx) => {
              const isAchieved = stats.xp >= rank.minXp;
              const isCurrent = currentRankIndex === idx;
              
              return (
                <div key={rank.title} className={`relative pl-10 flex items-center gap-3 transition-all ${isAchieved ? 'opacity-100' : 'opacity-40'}`}>
                  <div className={`absolute left-0 w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs border z-10 ${
                    isCurrent 
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/40 scale-110' 
                      : isAchieved 
                        ? 'bg-[var(--bg-surface)] border-emerald-500 text-emerald-400' 
                        : 'bg-[var(--bg-surface)] border-[var(--border-color)] text-[var(--text-muted)]'
                  }`}>
                    {idx + 1}
                  </div>
                  <div>
                    <p className={`text-xs font-black uppercase tracking-tight ${isCurrent ? 'text-indigo-400' : 'text-[var(--text-main)]'}`}>{rank.title}</p>
                    <p className="text-[10px] font-mono font-bold text-[var(--text-muted)]">{rank.minXp.toLocaleString()} XP</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Platform Motion & Accessibility Settings */}
      <section className="bg-[var(--bg-card)] border border-[var(--border-color)] p-6 md:p-8 rounded-[2.5rem] shadow-xl">
        <h3 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tight mb-4 flex items-center gap-2">
          <span>Display & Motion Preferences</span>
        </h3>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)]">
          <div>
            <h4 className="text-sm font-bold text-[var(--text-main)] uppercase tracking-tight">Reduce animations</h4>
            <p className="text-xs text-[var(--text-muted)] mt-1 max-w-xl font-normal leading-relaxed">
              Pauses ambient particle backdrops, moving data pulses, and animated transitions across the platform.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={reduceAnimations}
            onClick={() => handleToggleReduceAnimations(!reduceAnimations)}
            className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
              reduceAnimations ? 'bg-indigo-600' : 'bg-slate-700'
            }`}
          >
            <span className="sr-only">Reduce animations</span>
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                reduceAnimations ? 'translate-x-7' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </section>

      {/* Legal & POPIA Data Protection */}
      <section className="bg-[var(--bg-card)] border border-[var(--border-color)] p-6 md:p-8 rounded-[2.5rem] shadow-xl">
        <h3 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tight mb-2 flex items-center gap-2">
          <Shield className="text-indigo-400" size={22} />
          <span>Legal & Data Privacy (POPIA)</span>
        </h3>
        <p className="text-xs text-[var(--text-muted)] mb-6 max-w-2xl leading-relaxed">
          Your personal information is protected under South Africa's Protection of Personal Information Act (POPIA). 
          You can inspect our privacy policies or exercise your statutory right to data erasure at any time.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <button
            type="button"
            onClick={onOpenPrivacy}
            className="flex items-center justify-between p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-indigo-500/40 text-left transition-colors group cursor-pointer"
          >
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-[var(--text-main)] group-hover:text-indigo-400 transition-colors">
                Privacy Policy (POPIA)
              </p>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Learn how we collect, use, and protect your information</p>
            </div>
            <span className="text-xs font-black text-indigo-400">View →</span>
          </button>

          <button
            type="button"
            onClick={onOpenTerms}
            className="flex items-center justify-between p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-indigo-500/40 text-left transition-colors group cursor-pointer"
          >
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-[var(--text-main)] group-hover:text-indigo-400 transition-colors">
                Terms of Use
              </p>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Academic integrity, age requirement & platform terms</p>
            </div>
            <span className="text-xs font-black text-indigo-400">View →</span>
          </button>
        </div>

        {/* Danger Zone: Account & Data Deletion */}
        <div className="p-6 rounded-2xl bg-rose-500/5 border border-rose-500/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-black text-rose-400 uppercase tracking-tight flex items-center gap-2">
                <span>Danger Zone • Account & Data Deletion</span>
              </h4>
              <p className="text-xs text-[var(--text-muted)] mt-1 max-w-xl leading-relaxed">
                Permanently deletes your account, personal data, test records, notes, study files, and leaderboard entry. 
                This action is irreversible under Section 24 of POPIA.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-wider text-xs transition-colors shrink-0 shadow-lg shadow-rose-600/20 cursor-pointer"
            >
              Delete my account and data
            </button>
          </div>
        </div>
      </section>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--bg-card)] border border-rose-500/40 p-6 sm:p-8 rounded-3xl max-w-md w-full shadow-2xl relative text-[var(--text-main)]">
            <h3 className="text-xl font-black uppercase tracking-tight text-rose-500 mb-2">
              Permanently Delete Account?
            </h3>
            <p className="text-xs text-[var(--text-muted)] mb-6 leading-relaxed">
              This will permanently purge your user profile, all test scores, notes, uploaded files, and leaderboard ranking from the ITreal database.
              This operation cannot be reversed.
            </p>

            {deleteError && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-xl text-xs mb-4">
                {deleteError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 rounded-xl bg-[var(--bg-surface)] hover:bg-white/5 border border-[var(--border-color)] text-xs font-bold uppercase tracking-wider transition-colors text-[var(--text-muted)] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteAccount}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase tracking-wider transition-colors shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2"
              >
                {isDeleting ? <><Loader2 size={14} className="animate-spin" /> Deleting...</> : 'Yes, Delete Everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
