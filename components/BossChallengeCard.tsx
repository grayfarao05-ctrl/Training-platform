import React, { useState, useEffect } from 'react';
import { Skull, Lock, Zap, Clock, Send, CheckCircle2, XCircle } from 'lucide-react';
import { WeeklyBossChallenge, WeeklyBossSubmission, UserStats, CourseId } from '../types';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { collection, onSnapshot, doc, setDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { getCourseConfig, filterByCourse, withCourse } from '../courseConfig';

interface BossChallengeCardProps {
  userStats: UserStats;
  activeCourse?: CourseId;
}

const BossChallengeCard: React.FC<BossChallengeCardProps> = ({ userStats, activeCourse = 'a-plus' }) => {
  const [activeBoss, setActiveBoss] = useState<WeeklyBossChallenge | null>(null);
  const [submission, setSubmission] = useState<WeeklyBossSubmission | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const courseConfig = getCourseConfig(activeCourse);

  useEffect(() => {
    // Listen for active bosses and filter by active course
    const qBoss = query(collection(db, 'boss_challenges'), where('active', '==', true));
    const unsubscribeBoss = onSnapshot(qBoss, (snapshot) => {
      const allBosses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WeeklyBossChallenge));
      const courseBosses = filterByCourse(allBosses, activeCourse);
      if (courseBosses.length > 0) {
        setActiveBoss(courseBosses[0]);
      } else {
        setActiveBoss(null);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'boss_challenges'));

    return () => unsubscribeBoss();
  }, [activeCourse]);

  useEffect(() => {
    if (!activeBoss || !userStats.uid) return;

    const qSub = query(
      collection(db, 'boss_submissions'), 
      where('challengeId', '==', activeBoss.id),
      where('uid', '==', userStats.uid),
      limit(1)
    );
    
    const unsubscribeSub = onSnapshot(qSub, (snapshot) => {
      if (!snapshot.empty) {
        setSubmission({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as WeeklyBossSubmission);
      } else {
        setSubmission(null);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'boss_submissions'));

    return () => unsubscribeSub();
  }, [activeBoss, userStats.uid]);

  const handleSubmit = async () => {
    if (!answerText.trim() || !activeBoss || !userStats.uid) return;
    setIsSubmitting(true);
    try {
      const newSubmissionRef = doc(collection(db, 'boss_submissions'));
      await setDoc(newSubmissionRef, withCourse({
        challengeId: activeBoss.id,
        uid: userStats.uid,
        username: userStats.email.split('@')[0],
        answer: answerText,
        status: 'pending',
        timestamp: new Date().toISOString()
      }, activeCourse));
      setAnswerText('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'boss_submissions');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!activeBoss) {
    return (
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 text-center shadow-md">
        <Skull size={36} className="mx-auto text-[var(--text-muted)] mb-3 opacity-40" />
        <h3 className="text-base font-black text-[var(--text-main)] uppercase tracking-tight mb-1">
          No Active {courseConfig.shortLabel} Boss
        </h3>
        <p className="text-xs text-[var(--text-muted)] font-medium leading-relaxed">
          The {courseConfig.shortLabel} challenge arena is quiet. Check back later for the next simulation.
        </p>
      </div>
    );
  }

  return (
    <div 
      className="relative overflow-hidden rounded-3xl p-6 transition-all duration-300 bg-[var(--bg-card)] border border-[var(--border-color)] shadow-md"
    >
      {/* Background Glow */}
      <div 
        aria-hidden="true"
        className="absolute -top-16 -right-16 w-36 h-36 blur-[50px] rounded-full pointer-events-none opacity-15"
        style={{ backgroundColor: courseConfig.accentHex }}
      />

      <div className="relative z-10 flex items-start justify-between mb-4">
        <div 
          className="p-3 rounded-2xl text-white shadow-sm"
          style={{ backgroundColor: courseConfig.accentHex }}
        >
          <Skull size={24} className="animate-pulse" />
        </div>
        
        <div className="text-right">
          <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-0.5">Bounty</div>
          <div className="text-xl font-black flex items-center gap-1 font-mono" style={{ color: courseConfig.accentHex }}>
            <Zap size={16} /> {activeBoss.maxXP} XP
          </div>
          <div className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">{activeBoss.difficulty}</div>
        </div>
      </div>

      <h3 className="text-base font-black text-[var(--text-main)] uppercase tracking-tight mb-2">
        Weekly Boss Challenge
      </h3>
      <p className="text-xs text-[var(--text-muted)] font-medium mb-6 leading-relaxed">
        {activeBoss.question}
      </p>

      <div className="mt-auto">
        {!submission ? (
          <div className="space-y-3">
            <textarea
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Formulate your troubleshooting response..."
              className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-3.5 text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-indigo-500 transition-colors font-medium resize-none h-28 text-xs leading-relaxed"
            />
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting || !answerText.trim()}
              style={{ backgroundColor: courseConfig.accentHex }}
              className="w-full py-3 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
            >
              <Send size={14} /> Submit Solution
            </button>
          </div>
        ) : submission.status === 'pending' ? (
          <div className="w-full py-5 bg-amber-500/10 text-amber-400 rounded-2xl font-black uppercase tracking-wider text-xs flex flex-col items-center justify-center gap-1.5 border border-amber-500/20">
            <Clock size={20} className="animate-spin" /> 
            Pending Evaluation
            <span className="text-[10px] text-amber-400/80 normal-case tracking-normal font-medium text-center px-4">
              Your response is being reviewed by the instructor.
            </span>
          </div>
        ) : submission.isCorrect ? (
          <div className="w-full py-5 bg-emerald-500/10 text-emerald-400 rounded-2xl font-black uppercase tracking-wider text-xs flex flex-col items-center justify-center gap-1.5 border border-emerald-500/20">
            <CheckCircle2 size={20} /> 
            Challenge Completed (+{submission.xpAwarded} XP)
            {submission.feedback && (
              <span className="text-[10px] text-emerald-400/80 normal-case tracking-normal font-medium text-center px-4">
                "{submission.feedback}"
              </span>
            )}
          </div>
        ) : (
          <div className="w-full py-5 bg-red-500/10 text-red-400 rounded-2xl font-black uppercase tracking-wider text-xs flex flex-col items-center justify-center gap-1.5 border border-red-500/20">
            <XCircle size={20} /> 
            Needs Revision
            {submission.feedback && (
              <span className="text-[10px] text-red-400/80 normal-case tracking-normal font-medium text-center px-4">
                "{submission.feedback}"
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BossChallengeCard;
