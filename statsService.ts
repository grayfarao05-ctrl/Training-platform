
import { db, auth, doc, getDoc, setDoc, writeBatch, collection, addDoc, serverTimestamp } from './firebase';
import { UserStats, ActivityDay, TestResult, LeaderboardEntry } from './types';
import { RANKS, calculateLevel } from './constants';

export const MAX_XP_PER_ACTION = 1000;

export const updateUserActivity = async (xpGain: number, studyHoursGain: number = 0, extraUpdates: any = {}) => {
  if (!auth.currentUser) return;

  const validXpGain = Math.max(0, Math.min(xpGain, MAX_XP_PER_ACTION));

  const userRef = doc(db, 'users', auth.currentUser.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) return;

  const stats = userSnap.data() as UserStats;
  const newXp = (stats.xp || 0) + validXpGain;
  
  // Calculate new level based on XP
  const newLevel = calculateLevel(newXp);
  const currentRank = RANKS[newLevel] || RANKS[0];

  const today = new Date().toISOString().split('T')[0];
  
  let history = [...(stats.activityHistory || [])];
  const todayIndex = history.findIndex(day => day.date === today);

  if (todayIndex >= 0) {
    history[todayIndex] = {
      ...history[todayIndex],
      count: (history[todayIndex].count || 0) + validXpGain,
      studyHours: (history[todayIndex].studyHours || 0) + studyHoursGain
    };
  } else {
    history.push({
      date: today,
      count: validXpGain,
      studyHours: studyHoursGain
    });
  }

  // Keep only last 30 days of history to keep doc size manageable
  if (history.length > 30) {
    history = history.slice(-30);
  }

  const batch = writeBatch(db);

  batch.update(userRef, {
    ...extraUpdates,
    xp: newXp,
    level: newLevel,
    activityHistory: history,
    lastStudyDate: new Date().toISOString()
  });

  const leaderboardRef = doc(db, 'leaderboard', auth.currentUser.uid);
  const displayName = extraUpdates.displayName || stats.displayName || auth.currentUser.displayName || stats.email?.split('@')[0] || 'Anonymous';
  const photoURL = extraUpdates.photoURL !== undefined ? extraUpdates.photoURL : (stats.photoURL || auth.currentUser.photoURL || null);

  const leaderboardEntry: LeaderboardEntry = {
    uid: auth.currentUser.uid,
    displayName,
    photoURL,
    xp: newXp,
    level: newLevel,
    rank: currentRank.title,
    rankTitle: currentRank.title,
    rankColor: currentRank.color,
    updatedAt: new Date().toISOString()
  };

  batch.set(leaderboardRef, leaderboardEntry);

  await batch.commit();
};

export const syncLeaderboard = async (stats: UserStats) => {
  if (!stats || !stats.uid) return;

  const currentLevel = calculateLevel(stats.xp || 0);
  const currentRank = RANKS[currentLevel] || RANKS[0];

  const leaderboardRef = doc(db, 'leaderboard', stats.uid);
  const entry: LeaderboardEntry = {
    uid: stats.uid,
    displayName: stats.displayName || stats.email?.split('@')[0] || 'Anonymous',
    photoURL: stats.photoURL || null,
    xp: stats.xp || 0,
    level: currentLevel,
    rank: currentRank.title,
    rankTitle: currentRank.title,
    rankColor: currentRank.color,
    updatedAt: new Date().toISOString()
  };

  await setDoc(leaderboardRef, entry);
};

export const saveTestResult = async (result: Omit<TestResult, 'id' | 'userId' | 'timestamp'>) => {
  if (!auth.currentUser) return;

  const resultsRef = collection(db, 'users', auth.currentUser.uid, 'testResults');
  await addDoc(resultsRef, {
    ...result,
    percentage: result.percentage ?? result.score ?? 0,
    userId: auth.currentUser.uid,
    timestamp: serverTimestamp(),
    date: result.date || new Date().toISOString()
  });

  // Also update activity
  await updateUserActivity(result.xpEarned || 0, 0.5); // Assume 30 mins per test for now
};
