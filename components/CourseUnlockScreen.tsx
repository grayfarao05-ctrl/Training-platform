import React, { useState } from 'react';
import { Lock, Key, ArrowLeft, Loader2, CheckCircle2, ShieldAlert } from 'lucide-react';
import { CourseId, UserStats } from '../types';
import { getCourseConfig } from '../courseConfig';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, getDoc, writeBatch, arrayUnion } from 'firebase/firestore';
import { motion } from 'motion/react';

interface CourseUnlockScreenProps {
  course: CourseId;
  userStats: UserStats;
  onUnlocked: () => void;
  onBackToAPlus: () => void;
}

export const CourseUnlockScreen: React.FC<CourseUnlockScreenProps> = ({
  course,
  userStats,
  onUnlocked,
  onBackToAPlus,
}) => {
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const courseConfig = getCourseConfig(course);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setError('Please enter an unlock code.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const codeRef = doc(db, 'unlock_codes', cleanCode);
      const codeSnap = await getDoc(codeRef);

      if (!codeSnap.exists()) {
        setError('Invalid unlock code. Please verify and try again.');
        setSubmitting(false);
        return;
      }

      const codeData = codeSnap.data();

      if (codeData.usedBy) {
        setError('This unlock code has already been redeemed.');
        setSubmitting(false);
        return;
      }

      // Check course match if code is tagged with a course
      if (codeData.course && codeData.course !== course) {
        const targetCourse = getCourseConfig(codeData.course);
        setError(`This code is valid for ${targetCourse?.name || codeData.course}, not this course.`);
        setSubmitting(false);
        return;
      }

      // Atomically mark code as used and unlock course on user doc in one batch
      const batch = writeBatch(db);
      batch.update(codeRef, {
        usedBy: userStats.uid,
        usedAt: new Date().toISOString()
      });

      const userRef = doc(db, 'users', userStats.uid);
      batch.update(userRef, {
        unlockedCourses: arrayUnion(course),
        redeemedCode: cleanCode
      });

      await batch.commit();

      setSuccess(true);
      setTimeout(() => {
        onUnlocked();
      }, 1200);
    } catch (err: any) {
      console.error('Error redeeming code:', err);
      setError(err?.message || 'Failed to redeem code. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-6 bg-[var(--bg-main)]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-xl w-full saas-hero-card rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden"
      >
        <div className="portal-ray-core" />
        {/* Glow backdrop using course accent */}
        <div 
          className="absolute -top-24 -right-24 w-56 h-56 blur-[80px] rounded-full pointer-events-none opacity-25"
          style={{ backgroundColor: courseConfig.accentHex }}
        />

        <div className="text-center space-y-6 relative z-10">
          <div className="saas-squircle-outer mx-auto">
            <div className="saas-squircle-inner !w-16 !h-16">
              <Lock size={28} className="animate-pulse" />
            </div>
          </div>

          <div>
            <span 
              className="text-[10px] font-black uppercase tracking-[0.3em] px-3.5 py-1.5 rounded-full border inline-block mb-3"
              style={{
                backgroundColor: `${courseConfig.accentHex}15`,
                color: courseConfig.accentHex,
                borderColor: `${courseConfig.accentHex}40`
              }}
            >
              {courseConfig.badgeLabel} Track
            </span>
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-[var(--text-main)]">
              {courseConfig.name} <span style={{ color: courseConfig.accentHex }}>Locked</span>
            </h2>
            <p className="text-[var(--text-muted)] text-sm mt-3 max-w-md mx-auto leading-relaxed">
              This certification course is locked. Enter the authorization code provided by your instructor to unlock access to all training modules, mock exams, and resources.
            </p>
          </div>

          {success ? (
            <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center gap-3 text-emerald-400 font-bold">
              <CheckCircle2 size={24} />
              <span>Course unlocked successfully! Loading...</span>
            </div>
          ) : (
            <form onSubmit={handleRedeem} className="space-y-4 pt-4">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                  <Key size={18} />
                </div>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="AUTH-XXXXXX"
                  disabled={submitting}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl py-4 pl-12 pr-4 text-[var(--text-main)] placeholder:text-[var(--text-muted)] text-center font-mono text-lg font-black tracking-widest focus:outline-none focus:border-indigo-500 transition-colors uppercase"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-600/10 border border-red-600/30 rounded-xl text-red-500 text-xs font-bold flex items-center justify-center gap-2">
                  <ShieldAlert size={14} />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !code.trim()}
                style={{ backgroundColor: courseConfig.accentHex }}
                className="w-full py-4 text-white hover:brightness-110 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <span>Unlock {courseConfig.shortLabel}</span>
                )}
              </button>
            </form>
          )}

          <div className="pt-4 border-t border-[var(--border-color)]">
            <button
              onClick={onBackToAPlus}
              className="text-[var(--text-muted)] hover:text-[var(--text-main)] text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 mx-auto transition-colors"
            >
              <ArrowLeft size={14} /> Return to Courses
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CourseUnlockScreen;
