import React, { useState, useEffect, useRef } from 'react';
import { AvatarArchetype, CardRarity } from '../../types';
import { 
  ARCHETYPES, 
  subscribeArchetypes, 
  saveArchetypeToRoster, 
  saveArchetypeTierImage,
  LEVEL_TIERS 
} from '../../galleryService';
import { 
  Upload, 
  Image as ImageIcon, 
  CheckCircle2, 
  Sparkles, 
  User, 
  ShieldCheck, 
  Layers, 
  ArrowRight,
  Loader2,
  X,
  Palette,
  FileCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminAvatarsTabProps {
  setAdminFeedback: (msg: string | null) => void;
}

export const AdminAvatarsTab: React.FC<AdminAvatarsTabProps> = ({ setAdminFeedback }) => {
  const [archetypes, setArchetypes] = useState<AvatarArchetype[]>(ARCHETYPES);
  const [selectedSlotId, setSelectedSlotId] = useState<string>(ARCHETYPES[0].id);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [codename, setCodename] = useState('');
  const [gender, setGender] = useState<'female' | 'male'>('female');
  const [role, setRole] = useState('');
  const [tagline, setTagline] = useState('');
  const [bio, setBio] = useState('');
  const [accentColor, setAccentColor] = useState('#22c55e');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [cardArtTiers, setCardArtTiers] = useState<Record<number, string>>({});

  // File Upload State
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tierFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingTierLevel, setUploadingTierLevel] = useState<number | null>(null);

  useEffect(() => {
    const unsub = subscribeArchetypes((list) => {
      setArchetypes(list);
    });
    return () => unsub();
  }, []);

  // Sync form with selected archetype
  useEffect(() => {
    const current = archetypes.find((a) => a.id === selectedSlotId) || archetypes[0];
    if (current) {
      setName(current.name);
      setCodename(current.codename);
      setGender(current.gender);
      setRole(current.role);
      setTagline(current.tagline);
      setBio(current.bio);
      setAccentColor(current.accentColor);
      setThumbnailUrl(current.thumbnailUrl);
      setPreviewImage(current.thumbnailUrl);
      setCardArtTiers(current.cardArtTiers || {});
    }
  }, [selectedSlotId, archetypes]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setPreviewImage(result);
      setThumbnailUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleTierFileSelect = (level: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const result = event.target?.result as string;
      setCardArtTiers((prev) => ({ ...prev, [level]: result }));
      try {
        await saveArchetypeTierImage(selectedSlotId, level, result);
        setAdminFeedback(`Uploaded Level ${level} card graphic for ${name || 'operative'}!`);
      } catch (err) {
        console.error('Failed to save tier image:', err);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveOperative = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !codename) {
      alert('Please enter operative name and title.');
      return;
    }

    setSaving(true);
    try {
      const updated: AvatarArchetype = {
        id: selectedSlotId,
        name,
        codename,
        gender,
        role,
        tagline,
        bio,
        accentColor,
        thumbnailUrl: previewImage || thumbnailUrl,
        defaultCardId: `${selectedSlotId}-lvl1`,
        cardArtTiers,
      };

      await saveArchetypeToRoster(updated);
      setAdminFeedback(`Saved operative "${name} (${codename})" successfully!`);
    } catch (err) {
      console.error('Error saving operative:', err);
      alert('Failed to save operative changes.');
    } finally {
      setSaving(false);
    }
  };

  const selectedArchetype = archetypes.find((a) => a.id === selectedSlotId) || archetypes[0];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border-color)] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              Operative Roster Manager
            </span>
            <span className="text-xs text-[var(--text-muted)]">• 6 Base Avatar Slots</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[var(--text-main)]">
            Avatar <span className="text-indigo-400">Roster & Card Uploads</span>
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1 max-w-xl">
            Upload custom avatar images and card graphics for the 6 beginner operatives (3 Female, 3 Male). All uploads publish directly to students in real-time.
          </p>
        </div>
      </div>

      {/* 6 Avatar Slots Quick Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {archetypes.map((a, index) => {
          const isSelected = a.id === selectedSlotId;
          const isFemale = a.gender === 'female';

          return (
            <div
              key={a.id}
              onClick={() => setSelectedSlotId(a.id)}
              className={`p-3 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? 'bg-indigo-500/15 border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.3)] scale-[1.02]'
                  : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-white/20 hover:bg-white/[0.02]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)]">
                  Slot {index + 1}
                </span>
                <span 
                  className="px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider text-black"
                  style={{ backgroundColor: isFemale ? '#ec4899' : '#3b82f6' }}
                >
                  {a.gender}
                </span>
              </div>

              {/* Avatar Thumbnail */}
              <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-black border border-white/10 mb-2">
                <img
                  src={a.thumbnailUrl}
                  alt={a.name}
                  className="w-full h-full object-cover object-top"
                />
              </div>

              <div>
                <h4 className="text-xs font-black uppercase tracking-tight text-[var(--text-main)] truncate">
                  {a.name}
                </h4>
                <p 
                  className="text-[10px] font-bold uppercase tracking-wider truncate"
                  style={{ color: a.accentColor }}
                >
                  {a.codename}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Upload & Edit Form for Selected Slot */}
      <form
        onSubmit={handleSaveOperative}
        className="bg-[var(--bg-card)] rounded-[2rem] border border-indigo-400/25 p-6 sm:p-8 shadow-xl space-y-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
              Editing Slot: {selectedArchetype.gender.toUpperCase()} OPERATIVE
            </span>
            <h3 className="text-xl font-black uppercase tracking-tight text-[var(--text-main)] mt-0.5">
              Configure {selectedArchetype.name} ({selectedArchetype.codename})
            </h3>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            <span>Save & Publish Avatar</span>
          </button>
        </div>

        {/* Layout: Image Upload on Left, Fields on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-start">
          {/* Avatar Image Upload Box */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] block">
              Operative Avatar Image *
            </label>

            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden border-2 border-dashed border-indigo-400/40 hover:border-indigo-400 bg-black/50 flex flex-col items-center justify-center cursor-pointer transition-all group p-2"
            >
              {previewImage ? (
                <>
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="w-full h-full object-cover object-top rounded-xl"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity rounded-xl text-center p-3">
                    <Upload size={24} className="text-indigo-400 mb-1" />
                    <span className="text-xs font-black uppercase tracking-wider text-white">Click to Replace</span>
                    <span className="text-[10px] text-slate-300">JPG, PNG, WebP</span>
                  </div>
                </>
              ) : (
                <div className="text-center p-4">
                  <Upload size={32} className="mx-auto text-indigo-400 mb-2" />
                  <span className="text-xs font-black uppercase tracking-wider text-white block">Upload Image</span>
                  <span className="text-[10px] text-slate-400 mt-1 block">Click or drag & drop</span>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />

            <p className="text-[10px] text-[var(--text-muted)] text-center">
              Recommended: 3:4 portrait or trading card format (PNG or JPG).
            </p>
          </div>

          {/* Text Metadata Fields */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] block mb-1">
                  Operative Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maya Thorne"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] text-xs rounded-xl p-3 focus:outline-none focus:border-indigo-500 font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] block mb-1">
                  Title / Codename (Clean title, no prefix) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Learner"
                  value={codename}
                  onChange={(e) => setCodename(e.target.value)}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] text-xs rounded-xl p-3 focus:outline-none focus:border-indigo-500 font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] block mb-1">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] text-xs rounded-xl p-3 focus:outline-none focus:border-indigo-500 cursor-pointer font-bold"
                >
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] block mb-1">
                  Signature Accent Color
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
                    className="flex-1 bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] text-xs rounded-xl p-3 font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] block mb-1">
                Specialty Role & Technical Focus
              </label>
              <input
                type="text"
                placeholder="e.g. Field Recon & Hardware Specialist"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] text-xs rounded-xl p-3 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] block mb-1">
                Operative Motto / Tagline
              </label>
              <input
                type="text"
                placeholder="e.g. Small steps build big careers."
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] text-xs rounded-xl p-3 focus:outline-none focus:border-indigo-500 italic"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] block mb-1">
                Character Lore & Backstory
              </label>
              <textarea
                rows={3}
                placeholder="Brief backstory for this operative..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] text-xs rounded-xl p-3 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Level Tier Upgrade Card Artwork Manager */}
        <div className="pt-6 border-t border-[var(--border-color)] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-base font-black uppercase tracking-tight text-[var(--text-main)] flex items-center gap-2">
                <Layers size={18} className="text-indigo-400" />
                Level Tier Upgraded Card Graphics for {name || 'Operative'}
              </h4>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Upload progressive card artworks as this character levels up from Trainee (Level 1) to Titan (Level 6).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {LEVEL_TIERS.map((tier) => {
              const currentTierArt = cardArtTiers[tier.level] || (
                selectedSlotId === 'the-learner' && tier.level === 1 ? '/assets/cards/learner_lvl1.jpg' :
                selectedSlotId === 'the-learner' && tier.level === 2 ? '/assets/cards/learner_lvl2.jpg' :
                previewImage || thumbnailUrl
              );

              return (
                <div
                  key={tier.level}
                  className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-color)] p-2.5 flex flex-col justify-between text-center relative group"
                >
                  <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-wider text-[var(--text-muted)] mb-1">
                    <span>LVL {tier.level}</span>
                    <span style={{ color: tier.accentColor }}>{tier.rankTitle}</span>
                  </div>

                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-black border border-white/10 mb-2">
                    <img
                      src={currentTierArt}
                      alt={`Level ${tier.level}`}
                      className="w-full h-full object-cover"
                    />
                    <label className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity cursor-pointer p-1 text-center">
                      <Upload size={16} className="text-indigo-400 mb-1" />
                      <span className="text-[9px] font-black uppercase text-white">Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleTierFileSelect(tier.level, e)}
                      />
                    </label>
                  </div>

                  <span className="text-[10px] font-bold text-[var(--text-main)] truncate">
                    {tier.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </form>
    </div>
  );
};
export default AdminAvatarsTab;

