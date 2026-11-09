import { db } from './firebase';
import { doc, updateDoc, setDoc, getDoc, collection, onSnapshot, getDocs } from 'firebase/firestore';
import { AvatarArchetype, GalleryCard, SpecialChallenge, UserStats } from './types';

export const LEVEL_TIERS = [
  { 
    level: 1, 
    xp: 1000, 
    rankTitle: 'TRAINEE', 
    title: 'Learner', 
    subtitle: '1ST MISSION: BUILD YOUR SKILLS',
    quote: 'Small steps build big careers.',
    lore: "You took the first step. You showed up, you learned, and you're building a better future. This is just the beginning.",
    stats: { dedication: 7, focus: 6, problemSolving: 5, teamPlayer: 5 },
    rarity: 'common' as const, 
    accentColor: '#22c55e' 
  },
  { 
    level: 2, 
    xp: 2500, 
    rankTitle: 'APPRENTICE', 
    title: 'Decoder', 
    subtitle: '2ND MISSION: LEVEL UP YOUR SKILLS',
    quote: 'Challenge your limits, build your foundation.',
    lore: "You've built the basics and now you're diving deeper. Coding, configuring, and solving harder problems - this is where your journey really begins.",
    stats: { dedication: 8, focus: 7, problemSolving: 7, teamPlayer: 5 },
    rarity: 'uncommon' as const, 
    accentColor: '#f97316' 
  },
  { 
    level: 3, 
    xp: 5000, 
    rankTitle: 'SPECIALIST', 
    title: 'Operator', 
    subtitle: '3RD MISSION: DEPLOY REAL HARDWARE',
    quote: 'Precision in every packet and protocol.',
    lore: 'Hands-on experience unlocked. You configured subnets, diagnosed physical cabling, and proved troubleshooting instincts in the trenches.',
    stats: { dedication: 8, focus: 8, problemSolving: 8, teamPlayer: 6 },
    rarity: 'rare' as const, 
    accentColor: '#06b6d4' 
  },
  { 
    level: 4, 
    xp: 10000, 
    rankTitle: 'ENGINEER', 
    title: 'Architect', 
    subtitle: '4TH MISSION: ARCHITECT ENTERPRISE MESH',
    quote: 'Building networks that never sleep.',
    lore: 'System Architecture authority. You design highly-available topologies that withstand simulated network outages effortlessly.',
    stats: { dedication: 9, focus: 9, problemSolving: 9, teamPlayer: 7 },
    rarity: 'epic' as const, 
    accentColor: '#3b82f6' 
  },
  { 
    level: 5, 
    xp: 15000, 
    rankTitle: 'COMMANDER', 
    title: 'Vanguard', 
    subtitle: '5TH MISSION: COMMAND THE OPS CENTER',
    quote: 'Leading the cyber frontlines.',
    lore: 'Leadership certified. You mentor peers, optimize performance bottlenecks, and operate with calm authority under live load.',
    stats: { dedication: 10, focus: 9, problemSolving: 10, teamPlayer: 8 },
    rarity: 'epic' as const, 
    accentColor: '#a855f7' 
  },
  { 
    level: 6, 
    xp: 30000, 
    rankTitle: 'TITAN', 
    title: 'Titan', 
    subtitle: 'SUPREME MISSION: CONQUER CERTIFICATION',
    quote: 'Mastery realized. Real opportunities conquered.',
    lore: 'Ultimate Mastery realized. Recognized as an ITreal Cyber Legend, ready to seize top-tier opportunities in the Western Cape tech sphere.',
    stats: { dedication: 10, focus: 10, problemSolving: 10, teamPlayer: 9 },
    rarity: 'legendary' as const, 
    accentColor: '#eab308' 
  },
];

export const ARCHETYPES: AvatarArchetype[] = [
  // 3 FEMALE ARCHETYPES (All Level 1 Trainees)
  {
    id: 'female-learner-1',
    name: 'Maya Thorne',
    codename: 'Learner',
    gender: 'female',
    role: 'Field Recon & Hardware Trainee',
    bio: 'Resilient and eager, Maya builds confidence hands-on with real systems. Her tactical gear and diagnostic tablet keep her ready for any challenge.',
    tagline: 'Small steps build big careers.',
    accentColor: '#22c55e',
    thumbnailUrl: '/assets/cards/learner_lvl1.jpg?v=2',
    defaultCardId: 'female-learner-1-lvl1',
  },
  {
    id: 'female-learner-2',
    name: 'Zara Chen',
    codename: 'Learner',
    gender: 'female',
    role: 'Cloud & Infrastructure Trainee',
    bio: 'Diligent and sharp, Zara masters foundational cloud and virtual systems step-by-step.',
    tagline: 'Small steps build big careers.',
    accentColor: '#22c55e',
    thumbnailUrl: '/assets/cards/female_avatar_2_lvl1.jpg?v=2',
    defaultCardId: 'female-learner-2-lvl1',
  },
  {
    id: 'female-learner-3',
    name: 'Nyx Morales',
    codename: 'Learner',
    gender: 'female',
    role: 'Cyber Defense Trainee',
    bio: 'Observant and analytical, Nyx builds disciplined habits in security monitoring and protocol diagnostics.',
    tagline: 'Small steps build big careers.',
    accentColor: '#22c55e',
    thumbnailUrl: '/assets/cards/female_avatar_3_lvl1.jpg?v=2',
    defaultCardId: 'female-learner-3-lvl1',
  },

  // 3 MALE ARCHETYPES (All Level 1 Trainees)
  {
    id: 'male-learner-1',
    name: 'Marcus Vance',
    codename: 'Learner',
    gender: 'male',
    role: 'Hardware & Diagnostics Trainee',
    bio: 'Diligent and focused, Marcus trains hands-on with enterprise hardware and diagnostics.',
    tagline: 'Small steps build big careers.',
    accentColor: '#22c55e',
    thumbnailUrl: '/assets/cards/male_avatar_1_lvl1.jpg?v=2',
    defaultCardId: 'male-learner-1-lvl1',
  },
  {
    id: 'male-learner-2',
    name: 'Liam Sterling',
    codename: 'Learner',
    gender: 'male',
    role: 'Systems & Infrastructure Trainee',
    bio: 'Analytical and determined, Liam builds solid foundational expertise across networks and server clusters.',
    tagline: 'Small steps build big careers.',
    accentColor: '#22c55e',
    thumbnailUrl: '/assets/cards/male_avatar_2_lvl1.jpg?v=2',
    defaultCardId: 'male-learner-2-lvl1',
  },
  {
    id: 'male-learner-3',
    name: 'Ethan Cross',
    codename: 'Learner',
    gender: 'male',
    role: 'CLI & Automation Trainee',
    bio: 'Commanding terminal prompts and diagnostic scripts, Ethan builds core CLI skills step-by-step.',
    tagline: 'Small steps build big careers.',
    accentColor: '#22c55e',
    thumbnailUrl: '/assets/cards/male_avatar_3_lvl1.jpg?v=2',
    defaultCardId: 'male-learner-3-lvl1',
  },
];

export function getCardArtForTier(archetype: AvatarArchetype, level: number): string {
  // If custom tier artwork is uploaded via admin hub
  if (archetype.cardArtTiers && archetype.cardArtTiers[level]) {
    return archetype.cardArtTiers[level];
  }
  if (archetype.id === 'female-learner-1' || archetype.id === 'the-learner') {
    if (level >= 2) return '/assets/cards/learner_lvl2.jpg';
    return '/assets/cards/learner_lvl1.jpg';
  }
  if (archetype.id === 'female-learner-2' || archetype.id === 'cloud-architect') {
    return archetype.thumbnailUrl || '/assets/cards/female_avatar_2_lvl1.jpg';
  }
  if (archetype.id === 'female-learner-3' || archetype.id === 'sec-analyst') {
    return archetype.thumbnailUrl || '/assets/cards/female_avatar_3_lvl1.jpg';
  }
  if (archetype.id === 'male-learner-1' || archetype.id === 'net-engineer') {
    return '/assets/cards/male_avatar_1_lvl1.jpg';
  }
  if (archetype.id === 'male-learner-2' || archetype.id === 'code-breaker') {
    return '/assets/cards/male_avatar_2_lvl1.jpg';
  }
  if (archetype.id === 'male-learner-3' || archetype.id === 'male-coder-3' || archetype.id === 'sys-titan') {
    return '/assets/cards/male_avatar_3_lvl1.jpg';
  }
  return archetype.thumbnailUrl || '/assets/cards/learner_lvl1.jpg';
}

// Helper to generate full tiered card deck for an archetype
export function generateArchetypeCards(archetype: AvatarArchetype): GalleryCard[] {
  return LEVEL_TIERS.map((tier) => {
    const cardId = `${archetype.id}-lvl${tier.level}`;
    const artUrl = getCardArtForTier(archetype, tier.level);

    return {
      id: cardId,
      title: tier.title,
      subtitle: tier.subtitle,
      archetypeId: archetype.id,
      level: tier.level,
      rankTitle: tier.rankTitle,
      rarity: tier.rarity,
      quote: tier.quote,
      lore: tier.lore,
      stats: tier.stats,
      artUrl,
      accentColor: tier.accentColor,
      requiredXp: tier.xp,
      isSpecial: false,
    };
  });
}

// Generate the master catalogue of all archetype cards
export const MASTER_ARCHETYPE_CARDS: GalleryCard[] = ARCHETYPES.flatMap(generateArchetypeCards);

export function getArchetype(id?: string): AvatarArchetype {
  return ARCHETYPES.find((a) => a.id === id) || ARCHETYPES[0];
}

export function getCardsForArchetype(archetypeId: string): GalleryCard[] {
  const archetype = getArchetype(archetypeId);
  return generateArchetypeCards(archetype);
}

export function getCardById(cardId: string): GalleryCard | undefined {
  return MASTER_ARCHETYPE_CARDS.find((c) => c.id === cardId);
}

export function calculateUnlockedLevel(xp: number): number {
  let highestLevel = 0;
  for (const tier of LEVEL_TIERS) {
    if (xp >= tier.xp) {
      highestLevel = tier.level;
    }
  }
  return highestLevel;
}

/**
 * Checks a user's XP and returns which archetype cards they are eligible for,
 * plus any custom special challenge cards they already hold.
 */
export function getUnlockedCardsForUser(userStats: UserStats | null): GalleryCard[] {
  if (!userStats) return [];
  const xp = userStats.xp || 0;
  const currentArchetypeId = userStats.avatarArchetype || ARCHETYPES[0].id;
  const archetypeCards = getCardsForArchetype(currentArchetypeId);

  // Filter archetype cards by XP threshold
  const unlockedArchetypeCards = archetypeCards.filter((card) => xp >= card.requiredXp);

  // If level 1 card is locked (xp < 1000), let's still unlock Level 1 Trainee as their Starter Card
  // once they choose an archetype so they aren't left with an empty gallery!
  if (unlockedArchetypeCards.length === 0 && archetypeCards.length > 0) {
    unlockedArchetypeCards.push(archetypeCards[0]);
  }

  return unlockedArchetypeCards;
}

/**
 * Select or change base avatar archetype in user document.
 */
export async function setUserArchetype(uid: string, archetypeId: string): Promise<void> {
  const userRef = doc(db, 'users', uid);
  const archetype = getArchetype(archetypeId);
  const defaultCard = `${archetypeId}-lvl1`;

  await updateDoc(userRef, {
    avatarArchetype: archetypeId,
    activeCardId: defaultCard,
    photoURL: archetype.thumbnailUrl,
  });
}

/**
 * Manually set an unlocked card as active avatar
 */
export async function setActiveAvatarCard(uid: string, card: GalleryCard): Promise<void> {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    activeCardId: card.id,
    photoURL: card.artUrl,
  });
}

/**
 * Special Challenges management (Admin & student awards)
 */
export function subscribeSpecialChallenges(callback: (challenges: SpecialChallenge[]) => void): () => void {
  const q = collection(db, 'special_challenges');
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((d) => ({
      ...d.data(),
      id: d.id,
    } as SpecialChallenge));
    callback(items);
  }, (err) => {
    console.warn('Error fetching special challenges:', err);
    callback([]);
  });
}

export async function createSpecialChallenge(challenge: Omit<SpecialChallenge, 'id' | 'createdAt'>): Promise<string> {
  const coll = collection(db, 'special_challenges');
  const newDocRef = doc(coll);
  const newChallenge: SpecialChallenge = {
    ...challenge,
    id: newDocRef.id,
    createdAt: new Date().toISOString(),
  };
  await setDoc(newDocRef, newChallenge);
  return newDocRef.id;
}

export async function awardChallengeCardToStudent(studentUid: string, challenge: SpecialChallenge): Promise<void> {
  const userRef = doc(db, 'users', studentUid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return;

  const data = snap.data() as UserStats;
  const currentUnlocked: string[] = (data.unlockedCardIds as string[]) || [];
  const challengeCardId = `challenge-${challenge.id}`;

  if (!currentUnlocked.includes(challengeCardId)) {
    const updatedUnlocked = [...currentUnlocked, challengeCardId];
    await updateDoc(userRef, {
      unlockedCardIds: updatedUnlocked,
    });
  }
}

export async function awardChallengeCardToAll(challenge: SpecialChallenge): Promise<number> {
  const usersSnap = await getDocs(collection(db, 'users'));
  let count = 0;
  const challengeCardId = `challenge-${challenge.id}`;

  for (const userDoc of usersSnap.docs) {
    const data = userDoc.data() as UserStats;
    const currentUnlocked: string[] = (data.unlockedCardIds as string[]) || [];
    if (!currentUnlocked.includes(challengeCardId)) {
      await updateDoc(doc(db, 'users', userDoc.id), {
        unlockedCardIds: [...currentUnlocked, challengeCardId],
      });
      count++;
    }
  }
  return count;
}

/**
 * Real-time subscription to customizable avatar roster from Firestore
 */
export function subscribeArchetypes(callback: (archetypes: AvatarArchetype[]) => void): () => void {
  const coll = collection(db, 'avatar_roster');
  return onSnapshot(coll, (snap) => {
    if (snap.empty) {
      callback(ARCHETYPES);
      return;
    }
    const customMap = new Map<string, AvatarArchetype>();
    snap.docs.forEach((docSnap) => {
      customMap.set(docSnap.id, { ...docSnap.data(), id: docSnap.id } as AvatarArchetype);
    });

    const merged = ARCHETYPES.map((def) => {
      const custom = customMap.get(def.id);
      if (!custom) return def;
      return {
        ...def,
        ...custom,
        thumbnailUrl: (custom.thumbnailUrl && typeof custom.thumbnailUrl === 'string' && custom.thumbnailUrl.trim() !== '')
          ? custom.thumbnailUrl
          : def.thumbnailUrl,
        cardArtTiers: {
          ...(def.cardArtTiers || {}),
          ...(custom.cardArtTiers || {}),
        },
      };
    });
    callback(merged);
  }, (err) => {
    console.warn('Error fetching avatar_roster:', err);
    callback(ARCHETYPES);
  });
}

export async function saveArchetypeToRoster(archetype: AvatarArchetype): Promise<void> {
  const docRef = doc(db, 'avatar_roster', archetype.id);
  await setDoc(docRef, archetype, { merge: true });
}

export async function saveArchetypeTierImage(archetypeId: string, level: number, imageUrl: string): Promise<void> {
  const docRef = doc(db, 'avatar_roster', archetypeId);
  const snap = await getDoc(docRef);
  const existing = snap.exists() ? (snap.data() as AvatarArchetype) : (getArchetype(archetypeId));
  const currentTiers = existing.cardArtTiers || {};
  currentTiers[level] = imageUrl;

  await setDoc(docRef, {
    ...existing,
    cardArtTiers: currentTiers,
  }, { merge: true });
}


