import React from 'react';
import { ArrowLeft, Shield, Lock, Trash2, Mail, CheckCircle2, FileText } from 'lucide-react';
import { scrollToTop } from '../scrollUtils';

interface PrivacyPolicyProps {
  onBack?: () => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
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
          <div className="p-3 bg-indigo-500/15 rounded-2xl border border-indigo-500/30 text-indigo-400">
            <Shield size={28} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 block">Legal & Privacy Notice</span>
            <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-[var(--text-main)]">
              Privacy Policy (POPIA)
            </h1>
          </div>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-8 text-xs text-amber-200">
          <p className="font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-amber-400" /> South African POPIA Compliance Notice
          </p>
          <p>
            This Privacy Policy is compiled in terms of the Protection of Personal Information Act (POPIA), Act No. 4 of 2013 of South Africa.
            Please note placeholders marked with <strong>[BRACKETS]</strong> for your organizational details.
          </p>
        </div>

        <div className="prose prose-invert max-w-none text-sm text-[var(--text-muted)] space-y-6">
          <section>
            <h2 className="text-lg font-black uppercase tracking-wider text-[var(--text-main)] mb-2">1. Who We Are</h2>
            <p>
              ITreal ("we", "us", "our") is an IT certification training platform operated by <strong>[ORGANIZATION NAME: ITreal Tech Solutions]</strong>.
              We respect your privacy and are committed to protecting your personal information in compliance with South Africa's POPIA.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black uppercase tracking-wider text-[var(--text-main)] mb-2">2. What Information We Store</h2>
            <p>When you register and use the ITreal platform, we process and store the following categories of personal information:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Account Information:</strong> Your full name / display name and email address.</li>
              <li><strong>Gamification & Engagement:</strong> Experience Points (XP), current level, streak count, and badges earned.</li>
              <li><strong>Academic & Assessment Records:</strong> Test results, mock exam answers, domain drill performance, exam readiness score, and timestamps.</li>
              <li><strong>Learning Material & Notes:</strong> Personal study notes, uploaded revision files, checklist todos, and objective completion status.</li>
              <li><strong>Authentication Data:</strong> Secure Firebase user identifier (UID) and OAuth tokens (for Google Sign-In).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-black uppercase tracking-wider text-[var(--text-main)] mb-2">3. Why We Collect and Use Your Data</h2>
            <p>Your personal information is collected for legitimate educational and service delivery purposes:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>To create and manage your student account.</li>
              <li>To deliver personalized curriculum content and adapt test questions to your progress.</li>
              <li>To calculate your readiness score for CompTIA certification exams.</li>
              <li>To generate verifiable academic progress reports for your training provider or employer (with your explicit consent).</li>
              <li>To display community leaderboards (showing display name, XP, and rank).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-black uppercase tracking-wider text-[var(--text-main)] mb-2">4. Who Can See Your Information</h2>
            <p>We treat your personal data as strictly confidential:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>You:</strong> You have continuous access to your profile, stats, notes, and results.</li>
              <li><strong>Authorized Administrators & Tutors:</strong> Designated ITreal administrative personnel have access to student progress to provide academic guidance, monitor cohort performance, and issue verified progress certificates.</li>
              <li><strong>Fellow Students:</strong> On the optional platform leaderboard, other signed-in students can only see your display name, rank, level, and XP. Your test answers and private notes are never visible to peers.</li>
              <li><strong>Third Parties:</strong> We do not sell, rent, or trade your personal information. Firebase (Google Cloud) is utilized as an operator for secure cloud database hosting.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-black uppercase tracking-wider text-[var(--text-main)] mb-2">5. How to Request Deletion (Right to Erasure)</h2>
            <p>
              In accordance with Section 24 of POPIA, you have the right to request the deletion or destruction of your personal information:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Self-Service Account Deletion:</strong> You can delete your account and all associated data at any time directly in the app. Navigate to <em>Profile &gt; Danger Zone</em> and click <strong>"Delete my account and data"</strong>. This immediately and permanently purges your user document, test results, notes, files, leaderboard records, and authentication account.</li>
              <li><strong>Manual Deletion Request:</strong> You may also email our Information Officer at the address below with the subject line <em>"POPIA Deletion Request"</em>.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-black uppercase tracking-wider text-[var(--text-main)] mb-2">6. Information Officer Contact</h2>
            <p>
              Under the Protection of Personal Information Act, our designated Information Officer is responsible for addressing all privacy inquiries and data subject requests:
            </p>
            <div className="bg-[var(--bg-surface)] p-5 rounded-2xl border border-[var(--border-color)]">
              <p className="font-bold text-[var(--text-main)]">Information Officer</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Organization: <strong>ITreal Tech Solutions</strong>
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Contact Person: <strong>[NAME: ITreal Information Officer]</strong>
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1 flex items-center gap-1.5">
                <Mail size={14} className="text-indigo-400" />
                Email: <span className="font-mono text-indigo-400 font-semibold">[EMAIL: ITreal Tech Solutions, info-officer@itreal.co.za - FILL IN YOUR EMAIL]</span>
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Physical Address: <strong>[PHYSICAL ADDRESS: Johannesburg, Gauteng, South Africa - FILL IN YOUR ADDRESS]</strong>
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-black uppercase tracking-wider text-[var(--text-main)] mb-2">7. Lodging a Complaint</h2>
            <p>
              If you believe our processing of your personal information infringes POPIA, you have the right to lodge a complaint with the South African Information Regulator:
            </p>
            <p className="text-xs">
              Website: <a href="https://inforegulator.org.za" target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline">https://inforegulator.org.za</a><br />
              Email: enquiries@inforegulator.org.za / POPIAComplaints@inforegulator.org.za
            </p>
          </section>

          <div className="pt-6 border-t border-[var(--border-color)] text-xs text-[var(--text-muted)] flex justify-between items-center">
            <span>Last Updated: October 2026</span>
            <span>POPIA Act 4 of 2013 Compliant</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
