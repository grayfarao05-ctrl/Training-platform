
import React, { useState, useEffect } from 'react';
import { BossChallenge, UserStats, BossResponse } from '../types';
import { db, doc, onSnapshot, setDoc, collection, query, where, getDocs, handleFirestoreError, OperationType } from '../firebase';
import { ArrowLeft, Zap, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface BossChallengeViewProps {
  userStats: UserStats;
  onBack: () => void;
}

const BossChallengeView: React.FC<BossChallengeViewProps> = ({ userStats, onBack }) => {
  const [challenge, setChallenge] = useState<BossChallenge | null>(null);
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingResponse, setExistingResponse] = useState<BossResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'global', 'bossChallenge'), (snap) => {
      if (snap.exists()) {
        const challengeData = snap.data() as BossChallenge;
        setChallenge(challengeData);
        checkExistingResponse(challengeData.id);
      } else {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const checkExistingResponse = async (challengeId: string) => {
    try {
      const q = query(
        collection(db, 'bossResponses'),
        where('uid', '==', userStats.uid),
        where('challengeId', '==', challengeId)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        setExistingResponse(snap.docs[0].data() as BossResponse);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'bossResponses');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!challenge || !answer.trim()) return;
    setIsSubmitting(true);
    try {
      const responseId = `${userStats.uid}_${challenge.id}`;
      const responseData: BossResponse = {
        uid: userStats.uid,
        email: userStats.email,
        answer: answer.trim(),
        submittedAt: new Date().toISOString(),
        challengeId: challenge.id,
        challengeTitle: challenge.title,
        status: 'pending'
      };
      await setDoc(doc(db, 'bossResponses', responseId), responseData);
      setExistingResponse(responseData);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'bossResponses');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px]">
        <Loader2 className="animate-spin text-indigo-500" size={48} />
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="p-12 text-center">
        <AlertCircle className="mx-auto text-[var(--text-muted)] mb-4" size={48} />
        <h2 className="text-2xl font-black text-[var(--text-main)] uppercase tracking-tight">No Active Boss Challenge</h2>
        <button onClick={onBack} className="mt-6 text-indigo-500 font-black uppercase tracking-widest text-xs flex items-center gap-2 mx-auto hover:underline">
          <ArrowLeft size={16} /> Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-12 max-w-4xl mx-auto">
      <button 
        onClick={onBack}
        className="mb-8 flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors uppercase font-black tracking-widest text-xs"
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2rem] p-6 md:p-12 shadow-sm relative overflow-hidden text-[var(--text-main)]">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <Zap size={120} className="text-indigo-500" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-500">
              <Zap size={24} />
            </div>
            <div>
              <h4 className="text-[10px] uppercase font-black tracking-[0.3em] text-indigo-500 mb-1">Daily Boss Scenario</h4>
              <h1 className="text-2xl md:text-4xl font-black text-[var(--text-main)] uppercase tracking-tighter leading-tight">{challenge.title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-8 flex-wrap">
            <span className="px-3 py-1 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-full text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">
              Difficulty: {challenge.difficulty}
            </span>
            <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-[10px] font-black text-amber-500 uppercase tracking-widest">
              Reward: +{challenge.rewardXp} XP
            </span>
          </div>

          <div className="mb-10">
            <p className="text-base md:text-lg text-[var(--text-main)] font-medium italic leading-relaxed bg-[var(--bg-surface)] p-6 rounded-2xl border border-[var(--border-color)]">
              "{challenge.description}"
            </p>
          </div>

          {existingResponse ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 md:p-8 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="text-emerald-500" size={20} />
                <h3 className="text-emerald-500 font-black uppercase tracking-widest text-sm">Response Submitted</h3>
              </div>
              <p className="text-[var(--text-muted)] text-sm mb-6">Your answer has been sent to the instructor for review.</p>
              <div className="bg-[var(--bg-card)] p-5 rounded-xl border border-[var(--border-color)]">
                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2">Your Answer:</p>
                <p className="text-[var(--text-main)] font-medium italic">"{existingResponse.answer}"</p>
              </div>
              {existingResponse.feedback && (
                <div className="mt-6 pt-6 border-t border-emerald-500/20">
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Instructor Feedback:</p>
                  <p className="text-[var(--text-main)] font-bold">"{existingResponse.feedback}"</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-3">Provide your solution:</label>
                <textarea 
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Explain your troubleshooting steps or identify the component..."
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] p-5 rounded-2xl text-[var(--text-main)] placeholder:text-[var(--text-muted)] font-medium outline-none focus:border-indigo-500 transition-all min-h-[180px] resize-none text-sm"
                />
              </div>
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting || !answer.trim()}
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:opacity-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                Submit Solution
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BossChallengeView;
