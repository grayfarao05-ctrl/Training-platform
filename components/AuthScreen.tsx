import React, { useState } from 'react';
import { Mail, Lock, LogIn, UserPlus, ArrowLeft, ShieldCheck, CheckCircle2, ShieldAlert, Sparkles, Loader2 } from 'lucide-react';
import { ITREAL_LOGO_PATH } from './ITrealLogo';
import { 
  auth, 
  googleProvider, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendEmailVerification, 
  signInWithPopup 
} from '../firebase';

interface AuthScreenProps {
  onVerificationSent: (email: string) => void;
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
  initialMode?: 'login' | 'register';
  onBackToLanding?: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ 
  onVerificationSent, 
  onOpenPrivacy, 
  onOpenTerms,
  initialMode = 'login',
  onBackToLanding
}) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // POPIA South Africa Consent Checkboxes
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isAgeValid, setIsAgeValid] = useState(false);

  // Google Sign-In Consent Modal State
  const [showGoogleConsent, setShowGoogleConsent] = useState(false);
  const [googleAcceptTerms, setGoogleAcceptTerms] = useState(false);
  const [googleIsAgeValid, setGoogleIsAgeValid] = useState(false);

  const isLocalhost = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.includes('192.168.')
  );

  const handleQuickAdminLogin = async () => {
    setLoading(true);
    setError('');
    const adminEmail = 'admin@itreal.co.za';
    const adminPass = 'Admin123!';
    try {
      try {
        await signInWithEmailAndPassword(auth, adminEmail, adminPass);
      } catch (signInErr: any) {
        if (
          signInErr.code === 'auth/user-not-found' || 
          signInErr.code === 'auth/invalid-credential' ||
          signInErr.code === 'auth/invalid-login-credentials'
        ) {
          // Create the admin account in Firebase Auth
          await createUserWithEmailAndPassword(auth, adminEmail, adminPass);
        } else {
          throw signInErr;
        }
      }
    } catch (err: any) {
      console.error('Quick admin sign-in error:', err);
      setError(err.message || 'Admin sign in failed. Please use standard email login.');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isLogin && (!acceptTerms || !isAgeValid)) {
      setError('Under South African POPIA regulations, you must accept the Terms & Privacy Policy and confirm the age requirement to register.');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
        onVerificationSent(email);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
      setLoading(false);
    }
  };

  const handleGoogleClick = () => {
    // If user has already ticked both on the page, proceed directly
    if (acceptTerms && isAgeValid) {
      executeGoogleLogin();
    } else {
      setShowGoogleConsent(true);
    }
  };

  const executeGoogleLogin = async () => {
    setShowGoogleConsent(false);
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      setError(err.message || 'Google login failed');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] flex items-center justify-center p-4 md:p-8 relative overflow-hidden transition-colors duration-200">
      {/* Dark SaaS Volumetric Top-Left Rays & Starfield */}
      <div className="portal-cosmos-bg" aria-hidden="true">
        <div className="portal-ray-primary" />
        <div className="portal-ray-core" />
        <div className="portal-star-grid" />
      </div>

      {/* Top action bar: back to landing */}
      <div className="fixed top-6 left-6 z-50">
        {onBackToLanding && (
          <button
            onClick={onBackToLanding}
            className="btn-soft px-4 h-[40px] text-xs uppercase tracking-wider"
          >
            <ArrowLeft size={14} className="text-indigo-300" />
            <span>Back to Overview</span>
          </button>
        )}
      </div>

      <div className="saas-hero-card p-8 md:p-12 rounded-[2rem] md:rounded-[2.5rem] max-w-xl w-full relative z-10 transition-all">
        <div className="portal-ray-core" />
        {/* Brand Header */}
        <div className="text-center mb-8 relative z-10">
          <div className="flex justify-center mb-5">
            <img 
              src={ITREAL_LOGO_PATH} 
              alt="ITreal" 
              className="h-14 sm:h-16 max-w-[280px] w-auto object-contain drop-shadow-[0_0_25px_rgba(99,102,241,0.45)]" 
            />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-300/30 text-indigo-200 text-[10px] font-bold uppercase tracking-widest mb-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
            <span>Western Cape IT Academy</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            {isLogin ? (
              <>Sign In to <span className="saas-gradient-word">Portal</span></>
            ) : (
              <>Create Free <span className="saas-gradient-word">Student Account</span></>
            )}
          </h2>
          <p className="text-[var(--text-muted)] text-xs sm:text-sm font-medium mt-1">
            {isLogin 
              ? 'Access your CompTIA exams, practical labs & skill records' 
              : 'Start your journey from Matric to industry-certified engineer'}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/25 text-red-400 p-4 rounded-2xl text-xs font-bold leading-relaxed mb-6 text-center">
            {error}
          </div>
        )}

        {/* Localhost Dev Admin Quick Access */}
        {isLocalhost && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-rose-500/15 via-indigo-500/15 to-rose-500/10 border border-rose-500/35 text-left shadow-lg">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-300">
                  Localhost Admin Access
                </span>
              </div>
              <span className="text-[9px] font-mono text-indigo-200 bg-indigo-500/20 px-2 py-0.5 rounded-md border border-indigo-400/30">
                admin@itreal.co.za
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mb-3 leading-relaxed">
              Click below to immediately log in as the System Administrator with full access to the Admin Hub, Challenges, and Course settings.
            </p>
            <button
              type="button"
              onClick={handleQuickAdminLogin}
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(244,63,94,0.3)] transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Signing In as Admin...</span>
                </>
              ) : (
                <>
                  <ShieldAlert size={14} />
                  <span>⚡ Quick Local Admin Sign-In</span>
                </>
              )}
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={17} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl py-3.5 pl-11 pr-4 text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:border-cyan-500 transition-all outline-none font-medium text-sm"
                placeholder="student@example.co.za"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={17} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl py-3.5 pl-11 pr-4 text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:border-cyan-500 transition-all outline-none font-medium text-sm"
                placeholder="••••••••••••"
              />
            </div>
          </div>

          {/* POPIA Registration Consent Checkboxes */}
          {!isLogin && (
            <div className="space-y-3 pt-3 pb-1 border-t border-[var(--border-color)]">
              <div className="text-[10px] font-black uppercase tracking-widest text-cyan-400">
                South Africa POPIA Consent
              </div>
              <label className="flex items-start gap-3 cursor-pointer text-left select-none group">
                <input
                  type="checkbox"
                  required
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-[var(--border-color)] bg-[var(--bg-surface)] text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                />
                <span className="text-xs text-[var(--text-muted)] leading-relaxed group-hover:text-[var(--text-main)] transition-colors">
                  I accept the{' '}
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); onOpenTerms?.(); }}
                    className="text-cyan-400 underline underline-offset-2 hover:text-cyan-300 font-bold cursor-pointer"
                  >
                    Terms of Use
                  </button>
                  {' '}and{' '}
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); onOpenPrivacy?.(); }}
                    className="text-cyan-400 underline underline-offset-2 hover:text-cyan-300 font-bold cursor-pointer"
                  >
                    POPIA Privacy Policy
                  </button>
                  .
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer text-left select-none group">
                <input
                  type="checkbox"
                  required
                  checked={isAgeValid}
                  onChange={(e) => setIsAgeValid(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-[var(--border-color)] bg-[var(--bg-surface)] text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                />
                <span className="text-xs text-[var(--text-muted)] leading-relaxed group-hover:text-[var(--text-main)] transition-colors">
                  I confirm that I am 18 years or older, or I have parent/legal guardian permission to train on ITreal.
                </span>
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (!isLogin && (!acceptTerms || !isAgeValid))}
            className="w-full btn-primary h-[48px] rounded-full text-xs font-bold uppercase tracking-wider mt-4"
          >
            {loading ? 'Processing...' : (isLogin ? <><LogIn size={16} /> Sign In to Academy</> : <><UserPlus size={16} /> Create Free Account</>)}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--border-color)]"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-black">
            <span className="bg-[var(--bg-card)] px-3 text-[var(--text-muted)]">Or continue with</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleClick}
          className="w-full btn-soft h-[48px] rounded-full border border-[var(--border-color)] text-[var(--text-main)] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-3"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="Google" />
          <span>Continue with Google</span>
        </button>

        <div className="mt-6 pt-5 border-t border-[var(--border-color)] text-center relative z-10">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-xs font-bold text-indigo-300 hover:text-white transition-colors cursor-pointer"
          >
            {isLogin ? "Need an account? Register free" : "Already have an account? Sign In"}
          </button>
        </div>
      </div>

      {/* Google Sign-In POPIA Consent Modal */}
      {showGoogleConsent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-6 sm:p-8 rounded-3xl max-w-md w-full shadow-2xl relative text-[var(--text-main)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h3 className="text-base font-black uppercase tracking-tight text-[var(--text-main)]">
                  South African POPIA Consent
                </h3>
                <p className="text-[11px] text-[var(--text-muted)]">Protection of Personal Information Act</p>
              </div>
            </div>

            <p className="text-xs text-[var(--text-muted)] mb-5 leading-relaxed">
              Before linking your Google Account to ITreal, please review and accept our learning terms and personal information processing policy.
            </p>

            <div className="space-y-3 mb-6 bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-color)]">
              <label className="flex items-start gap-3 cursor-pointer text-left select-none">
                <input
                  type="checkbox"
                  checked={googleAcceptTerms}
                  onChange={(e) => setGoogleAcceptTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-[var(--border-color)] bg-[var(--bg-card)] text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                />
                <span className="text-xs text-[var(--text-main)] leading-relaxed">
                  I accept the{' '}
                  <button
                    type="button"
                    onClick={onOpenTerms}
                    className="text-cyan-400 underline underline-offset-2 hover:text-cyan-300 font-bold"
                  >
                    Terms
                  </button>
                  {' '}and{' '}
                  <button
                    type="button"
                    onClick={onOpenPrivacy}
                    className="text-cyan-400 underline underline-offset-2 hover:text-cyan-300 font-bold"
                  >
                    POPIA Privacy Policy
                  </button>
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer text-left select-none">
                <input
                  type="checkbox"
                  checked={googleIsAgeValid}
                  onChange={(e) => setGoogleIsAgeValid(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-[var(--border-color)] bg-[var(--bg-card)] text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                />
                <span className="text-xs text-[var(--text-main)] leading-relaxed">
                  I am 18 or older, or have parent/guardian consent.
                </span>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowGoogleConsent(false)}
                className="flex-1 py-3 bg-[var(--bg-surface)] hover:bg-white/5 border border-[var(--border-color)] text-[var(--text-muted)] rounded-xl font-bold uppercase tracking-wider text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!googleAcceptTerms || !googleIsAgeValid}
                onClick={executeGoogleLogin}
                className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white rounded-xl font-black uppercase tracking-wider text-xs shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all cursor-pointer"
              >
                Accept & Proceed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthScreen;
