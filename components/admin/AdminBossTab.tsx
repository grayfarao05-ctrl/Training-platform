import React, { useState } from 'react';
import { WeeklyBossChallenge, WeeklyBossSubmission, CourseId } from '../../types';
import { getCourseConfig, filterByCourse, withCourse } from '../../courseConfig';
import { db, OperationType, handleFirestoreError } from '../../firebase';
import { collection, doc, updateDoc, addDoc, increment } from 'firebase/firestore';
import { Sword, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

interface AdminBossTabProps {
  bossChallenges: WeeklyBossChallenge[];
  bossSubmissions: WeeklyBossSubmission[];
  setAdminFeedback: (msg: string | null) => void;
  course?: CourseId;
}

export const AdminBossTab: React.FC<AdminBossTabProps> = ({
  bossChallenges,
  bossSubmissions,
  setAdminFeedback,
  course = 'a-plus'
}) => {
  const [newBossQuestion, setNewBossQuestion] = useState('');
  const [newBossXP, setNewBossXP] = useState(500);
  const [newBossDifficulty, setNewBossDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'Extreme'>('Medium');
  const [gradingFeedback, setGradingFeedback] = useState<Record<string, string>>({});
  const courseConfig = getCourseConfig(course);

  const createWeeklyBoss = async () => {
    if (!newBossQuestion.trim()) return;
    try {
      // First, mark all existing active bosses for this course as inactive
      const activeBosses = filterByCourse(bossChallenges, course).filter(b => b.active);
      for (const boss of activeBosses) {
        if (boss.id) {
          await updateDoc(doc(db, 'boss_challenges', boss.id), { active: false });
        }
      }

      // Create new boss scoped to course
      await addDoc(collection(db, 'boss_challenges'), withCourse({
        question: newBossQuestion,
        maxXP: newBossXP,
        difficulty: newBossDifficulty,
        active: true,
        createdAt: new Date().toISOString()
      }, course));

      setNewBossQuestion('');
      setNewBossXP(500);
      setNewBossDifficulty('Medium');
      setAdminFeedback(`${courseConfig.shortLabel} Weekly Boss Challenge posted!`);
      setTimeout(() => setAdminFeedback(null), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'boss_challenges');
    }
  };

  const gradeBossSubmission = async (submissionId: string, isCorrect: boolean, studentId: string, xpAwarded: number) => {
    try {
      const feedback = gradingFeedback[submissionId] || (isCorrect ? 'Great job!' : 'Needs improvement.');
      
      await updateDoc(doc(db, 'boss_submissions', submissionId), {
        status: 'graded',
        isCorrect,
        xpAwarded: isCorrect ? xpAwarded : 0,
        feedback
      });

      if (isCorrect) {
        await updateDoc(doc(db, 'users', studentId), {
          xp: increment(xpAwarded)
        });
      }

      setAdminFeedback('Submission graded successfully!');
      setTimeout(() => setAdminFeedback(null), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `boss_submissions/${submissionId}`);
    }
  };

  return (
    <motion.div 
      key="boss"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-12"
    >
      {/* Create New Boss Challenge */}
      <div className="bg-[var(--bg-card)] p-6 md:p-10 rounded-[2rem] border border-[var(--border-color)] shadow-sm">
        <h3 className="text-2xl font-black uppercase tracking-tighter mb-8 flex items-center gap-3 text-[var(--text-main)]">
          <Sword size={24} style={{ color: courseConfig.accentHex }} />
          Create {courseConfig.shortLabel} <span style={{ color: courseConfig.accentHex }}>Boss Challenge</span>
        </h3>
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] uppercase tracking-widest font-black text-[var(--text-muted)]">Challenge Question / Scenario</label>
            <textarea 
              value={newBossQuestion}
              onChange={(e) => setNewBossQuestion(e.target.value)}
              placeholder="Describe the troubleshooting scenario..."
              className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-4 md:p-5 text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-indigo-500 transition-all resize-none font-medium text-sm"
              rows={4}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-widest font-black text-[var(--text-muted)]">XP Reward</label>
              <input 
                type="number" 
                value={newBossXP}
                onChange={(e) => setNewBossXP(Number(e.target.value))}
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-4 text-[var(--text-main)] focus:outline-none focus:border-indigo-500 transition-all text-sm font-bold"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-widest font-black text-[var(--text-muted)]">Difficulty</label>
              <select 
                value={newBossDifficulty}
                onChange={(e) => setNewBossDifficulty(e.target.value as any)}
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-4 text-[var(--text-main)] focus:outline-none focus:border-indigo-500 transition-all appearance-none text-sm font-semibold"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
                <option value="Extreme">Extreme</option>
              </select>
            </div>
          </div>
          <button 
            onClick={createWeeklyBoss}
            className="w-full py-4 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-md transition-all hover:opacity-90"
            style={{ backgroundColor: courseConfig.accentHex }}
          >
            Post {courseConfig.shortLabel} Challenge
          </button>
        </div>
      </div>

      {/* Review Submissions */}
      <div className="bg-[var(--bg-card)] p-6 md:p-10 rounded-[2rem] border border-[var(--border-color)] shadow-sm">
        <h3 className="text-2xl font-black uppercase tracking-tighter mb-8 flex items-center gap-3 text-[var(--text-main)]">
          <CheckCircle2 size={24} style={{ color: courseConfig.accentHex }} />
          Review {courseConfig.shortLabel} <span style={{ color: courseConfig.accentHex }}>Submissions</span>
        </h3>
        <div className="space-y-6">
          {bossSubmissions.filter(s => s.status === 'pending').length === 0 ? (
            <p className="text-[var(--text-muted)] italic text-sm">No pending submissions to review.</p>
          ) : (
            bossSubmissions.filter(s => s.status === 'pending').map(submission => {
              const challenge = bossChallenges.find(c => c.id === submission.challengeId);
              return (
                <div key={submission.id} className="bg-[var(--bg-surface)] p-6 md:p-8 rounded-2xl border border-[var(--border-color)] space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-black text-[var(--text-muted)] mb-1">Student</p>
                      <p className="text-lg font-black text-[var(--text-main)]">{submission.username}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-widest font-black text-[var(--text-muted)] mb-1">Submitted</p>
                      <p className="text-xs font-semibold text-[var(--text-muted)]">{new Date(submission.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border-color)]">
                    <p className="text-[10px] uppercase tracking-widest font-black mb-2" style={{ color: courseConfig.accentHex }}>Challenge</p>
                    <p className="text-sm font-medium text-[var(--text-main)]">{challenge?.question || 'Unknown Challenge'}</p>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-black text-[var(--text-muted)] mb-2">Student Answer</p>
                    <p className="text-sm text-[var(--text-main)] bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border-color)] whitespace-pre-wrap">
                      {submission.answer}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] uppercase tracking-widest font-black text-[var(--text-muted)]">Feedback (Optional)</label>
                    <textarea 
                      value={gradingFeedback[submission.id!] || ''}
                      onChange={(e) => setGradingFeedback({...gradingFeedback, [submission.id!]: e.target.value})}
                      placeholder="Provide feedback on their answer..."
                      className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-indigo-500 transition-all resize-none text-sm"
                      rows={2}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                      onClick={() => gradeBossSubmission(submission.id!, true, submission.uid, challenge?.maxXP || 0)}
                      className="flex-1 py-3.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-sm"
                    >
                      Mark Correct (+{challenge?.maxXP || 0} XP)
                    </button>
                    <button 
                      onClick={() => gradeBossSubmission(submission.id!, false, submission.uid, 0)}
                      className="flex-1 py-3.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-sm"
                    >
                      Mark Incorrect
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AdminBossTab;
