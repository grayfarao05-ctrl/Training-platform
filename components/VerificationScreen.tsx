import React from 'react';
import { Mail, ArrowRight, LogIn, RefreshCw, ShieldCheck } from 'lucide-react';
import { ITREAL_LOGO_PATH } from './ITrealLogo';

interface VerificationScreenProps {
  email: string;
  onLoginClick: () => void;
  onRefreshClick?: () => void;
  onResendClick?: () => void;
}

const VerificationScreen: React.FC<VerificationScreenProps> = ({ 
  email, 
  onLoginClick, 
  onRefreshClick, 
  onResendClick 
}) => {
  return (
    <div className="min-h-screen bg-[var(--bg-app)] flex items-center justify-center p-6 text-[var(--text-main)] relative overflow-hidden transition-colors duration-200">
      <div className="portal-cosmos-bg" aria-hidden="true">
        <div className="portal-ray-primary" />
        <div className="portal-ray-core" />
        <div className="portal-star-grid" />
      </div>
      <div className="saas-hero-card p-8 md:p-12 rounded-[2.5rem] max-w-xl w-full text-center relative z-10 animate-in fade-in zoom-in duration-300">
        <div className="portal-ray-core" />
        <div className="flex justify-center mb-6 relative z-10">
          <img 
            src={ITREAL_LOGO_PATH} 
            alt="ITreal" 
            className="h-12 w-auto object-contain drop-shadow-[0_0_20px_rgba(99,102,241,0.4)]" 
          />
        </div>

        <div className="saas-squircle-outer mx-auto mb-6 relative z-10">
          <div className="saas-squircle-inner !w-14 !h-14">
            <Mail size={26} />
          </div>
        </div>
        
        <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-2 relative z-10">
          Verify Your <span className="saas-gradient-word">Student Account</span>
        </h2>
        
        <p className="text-[var(--text-muted)] mb-6 font-medium leading-relaxed text-xs md:text-sm">
          We have sent a verification link to <span className="text-[var(--text-main)] font-bold">{email}</span>. Please click the link in your email to activate your account.
        </p>

        <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] p-5 rounded-2xl mb-6 text-left">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-2.5">
            <ShieldCheck size={14} />
            <span>Next Steps</span>
          </div>
          <ul className="text-xs text-[var(--text-muted)] space-y-2 font-medium">
            <li className="flex items-center gap-2">
              <ArrowRight size={12} className="text-cyan-400 shrink-0" />
              Check your inbox (and spam / promotions folder)
            </li>
            <li className="flex items-center gap-2">
              <ArrowRight size={12} className="text-cyan-400 shrink-0" />
              Click the official verification link from ITreal
            </li>
            <li className="flex items-center gap-2">
              <ArrowRight size={12} className="text-cyan-400 shrink-0" />
              Click "Refresh Status" below once confirmed
            </li>
          </ul>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <button
            onClick={onRefreshClick}
            className="bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white py-3.5 rounded-xl font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/20 active:scale-[0.98] cursor-pointer"
          >
            <RefreshCw size={14} /> Refresh Status
          </button>
          <button
            onClick={onLoginClick}
            className="bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] hover:border-cyan-500/40 py-3.5 rounded-xl font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
          >
            <LogIn size={15} /> Return to Sign In
          </button>
        </div>

        {onResendClick && (
          <button
            onClick={onResendClick}
            className="text-[11px] font-black uppercase tracking-wider text-[var(--text-muted)] hover:text-cyan-400 transition-colors cursor-pointer"
          >
            Didn't receive the email? Resend verification
          </button>
        )}
      </div>
    </div>
  );
};

export default VerificationScreen;
