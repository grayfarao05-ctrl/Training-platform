import React from 'react';
import { ArrowLeft, BookOpen, CheckCircle, AlertTriangle, Mail } from 'lucide-react';
import { scrollToTop } from '../scrollUtils';

interface TermsOfUseProps {
  onBack?: () => void;
}

export const TermsOfUse: React.FC<TermsOfUseProps> = ({ onBack }) => {
  React.useEffect(() => {
    scrollToTop();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 sm:p-10 shadow-2xl">
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-white mb-8 transition-colors bg-[var(--bg-surface)] px-4 py-2 rounded-xl border border-[var(--border-color)]"
          >
            <ArrowLeft size={16} /> Back
          </button>
        )}

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-cyan-500/15 rounded-2xl border border-cyan-500/30 text-cyan-400">
            <BookOpen size={28} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 block">Terms of Service</span>
            <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-[var(--text-main)]">
              Terms of Use
            </h1>
          </div>
        </div>

        <div className="prose prose-invert max-w-none text-sm text-[var(--text-muted)] space-y-6">
          <section>
            <h2 className="text-lg font-black uppercase tracking-wider text-[var(--text-main)] mb-2">1. Acceptance of Terms</h2>
            <p>
              By creating an account or accessing ITreal ("Platform"), operated by <strong>[ITreal Tech Solutions]</strong>, you agree to comply with and be legally bound by these Terms of Use and all applicable laws of the Republic of South Africa.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black uppercase tracking-wider text-[var(--text-main)] mb-2">2. Eligibility and Age of Majority</h2>
            <p>
              In terms of South African law:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>You must be at least 18 years of age to register independently.</li>
              <li>If you are under 18 years of age, you must obtain verifiable consent from your parent or legal guardian prior to registering and using the platform.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-black uppercase tracking-wider text-[var(--text-main)] mb-2">3. User Conduct and Academic Integrity</h2>
            <p>
              As a student of ITreal, you agree to:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Use the materials, practice questions, and lab simulators exclusively for your personal exam preparation and educational purposes.</li>
              <li>Maintain the confidentiality of your account credentials and immediately notify us of any unauthorized access.</li>
              <li>Not attempt to distribute, sell, or copy proprietary curriculum PDFs, question banks, or platform code.</li>
              <li>Not abuse or disrupt our systems, bypass authentication or security rules, or attempt unauthorized database modifications.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-black uppercase tracking-wider text-[var(--text-main)] mb-2">4. Intellectual Property</h2>
            <p>
              All curriculum summaries, custom practice questions, simulations, vector graphics, and interactive modules provided by ITreal are protected under South African copyright legislation. CompTIA® and associated certification titles (A+, Network+, Security+) are registered trademarks of CompTIA, Inc. ITreal is an independent preparation platform and is not affiliated with or endorsed by CompTIA.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black uppercase tracking-wider text-[var(--text-main)] mb-2">5. Privacy and Data Protection (POPIA)</h2>
            <p>
              Our handling of your personal information is governed by our Privacy Policy, which forms an integral part of these Terms. By accepting these Terms, you consent to the processing of your data as described in the Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black uppercase tracking-wider text-[var(--text-main)] mb-2">6. Limitation of Liability</h2>
            <p>
              While ITreal strives to provide the highest quality exam preparation questions and curriculum alignments, we do not guarantee that using our platform will guarantee passing any official certification examination. The platform is provided on an "as is" and "as available" basis.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black uppercase tracking-wider text-[var(--text-main)] mb-2">7. Governing Law and Contact</h2>
            <p>
              These Terms are governed by and construed in accordance with the laws of the Republic of South Africa.
            </p>
            <div className="bg-[var(--bg-surface)] p-5 rounded-2xl border border-[var(--border-color)]">
              <p className="font-bold text-[var(--text-main)]">ITreal Tech Solutions</p>
              <p className="text-xs text-[var(--text-muted)] mt-1 flex items-center gap-1.5">
                <Mail size={14} className="text-indigo-400" />
                Contact: <span className="font-mono text-indigo-400 font-semibold">[ITreal Tech Solutions, support@itreal.co.za - FILL IN YOUR EMAIL]</span>
              </p>
            </div>
          </section>

          <div className="pt-6 border-t border-[var(--border-color)] text-xs text-[var(--text-muted)] flex justify-between items-center">
            <span>Effective Date: October 2026</span>
            <span>Republic of South Africa</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfUse;
