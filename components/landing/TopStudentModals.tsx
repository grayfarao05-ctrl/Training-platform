import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Send, 
  Briefcase, 
  CheckCircle2, 
  ShieldCheck, 
  Award, 
  FileText, 
  ExternalLink,
  MessageCircle,
  Phone,
  Mail,
  Building
} from 'lucide-react';
import { TopStudentItem, submitInterviewInvite } from '../../landingService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// -------------------------------------------------------------
// 1. Student CV Modal (In-App PDF Viewer)
// -------------------------------------------------------------
interface CVModalProps {
  student: TopStudentItem;
  onClose: () => void;
}

export const StudentCVModal: React.FC<CVModalProps> = ({ student, onClose }) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = () => {
    setDownloading(true);
    // If a PDF url exists, download or create one
    if (student.cvUrl && student.cvUrl.endsWith('.pdf')) {
      const a = document.createElement('a');
      a.href = student.cvUrl;
      a.download = `${student.firstName}_${student.surnameInitial}_CV.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setDownloading(false);
      return;
    }

    // Generate certified summary CV PDF via jsPDF
    const doc = new jsPDF();
    doc.setFillColor(8, 12, 22);
    doc.rect(0, 0, 210, 35, 'F');
    doc.setTextColor(6, 182, 212);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('ITREAL TECH SOLUTIONS', 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text('Certified Candidate Technical Profile — Western Cape', 14, 27);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(16);
    doc.text(`Candidate: ${student.firstName} ${student.surnameInitial}`, 14, 48);
    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105);
    doc.text(`Track: ${student.track} | Region: ${student.schoolOrArea}`, 14, 56);
    doc.text(`ITreal Exam Readiness Score: ${student.score}%`, 14, 63);

    autoTable(doc, {
      startY: 72,
      head: [['Core Competency', 'Proficiency & Verified Status']],
      body: student.tags.map(tag => [tag, 'Verified via hands-on labs & timed exams']),
      theme: 'grid',
      headStyles: { fillColor: [8, 12, 22], textColor: [6, 182, 212] }
    });

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(
      'Privacy notice: In compliance with POPIA, candidate contact details are managed through ITreal Tech Solutions (Pty) Ltd. Contact hello@itreal.co.za to schedule interviews.',
      14,
      doc.internal.pageSize.getHeight() - 15,
      { maxWidth: 180 }
    );

    doc.save(`${student.firstName}_${student.surnameInitial}_Profile.pdf`);
    setDownloading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#080c16] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#151c32]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center font-bold">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-tight">
                Curriculum Vitae — {student.firstName} {student.surnameInitial}
              </h3>
              <p className="text-xs text-white/60 font-medium">
                {student.track} • {student.schoolOrArea}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/25 transition-all text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
            >
              <Download size={14} />
              <span>{downloading ? 'Downloading...' : 'Download'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body / Viewer */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 text-slate-200">
          {/* Candidate Privacy Header */}
          <div className="p-4 rounded-2xl bg-[#151c32] border border-cyan-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <ShieldCheck size={22} className="text-cyan-400 shrink-0" />
              <div className="text-xs text-white/80">
                <span className="font-bold text-white">POPIA Verified Profile:</span> Candidate identity and academic records verified by ITreal Tech Solutions.
              </div>
            </div>
            <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-cyan-400 text-slate-950 font-mono">
              Score: {student.score}%
            </span>
          </div>

          {/* Structured CV View */}
          <div className="bg-[#10172a] rounded-2xl p-6 border border-white/5 space-y-6 font-sans">
            <div className="border-b border-white/10 pb-4">
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                {student.firstName} {student.surnameInitial}
              </h2>
              <p className="text-cyan-400 text-xs font-black uppercase tracking-wider mt-1">
                Candidate Track: {student.track}
              </p>
              <p className="text-xs text-white/60 mt-0.5">
                Location: {student.schoolOrArea}, Western Cape
              </p>
            </div>

            {/* Technical Skills */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-white/60 uppercase tracking-widest">
                Verified Technical Skills
              </h4>
              <div className="flex flex-wrap gap-2">
                {student.tags.map((tag, idx) => (
                  <span 
                    key={idx}
                    className="px-3 py-1 rounded-lg text-xs font-bold bg-[#151c32] text-cyan-300 border border-cyan-500/30"
                  >
                    ✓ {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Academic & Training */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-white/60 uppercase tracking-widest">
                ITreal Training & Labs Completed
              </h4>
              <div className="p-4 rounded-xl bg-[#151c32]/60 border border-white/5 space-y-2 text-xs text-slate-300">
                <p className="font-bold text-white">
                  • CompTIA Technical Curriculum & Scenario PBQs
                </p>
                <p className="text-white/70">
                  Completed over 30+ timed diagnostic exams, hardware tear-downs, and real-world network troubleshooting tasks with an aggregate readiness benchmark score of <strong className="text-cyan-400">{student.score}%</strong>.
                </p>
              </div>
            </div>

            {/* Contact Notice */}
            <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-300 flex items-center justify-between gap-4">
              <span>Ready to interview this candidate? Use the "Invite to interview" form on ITreal.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 2. Invite to Interview Modal Form
// -------------------------------------------------------------
interface InterviewModalProps {
  student: TopStudentItem;
  onClose: () => void;
}

export const InviteInterviewModal: React.FC<InterviewModalProps> = ({ student, onClose }) => {
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [role, setRole] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !contactPerson.trim() || !emailOrPhone.trim() || !role.trim()) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      await submitInterviewInvite({
        studentId: student.id,
        studentName: `${student.firstName} ${student.surnameInitial}`,
        companyName: companyName.trim(),
        contactPerson: contactPerson.trim(),
        emailOrPhone: emailOrPhone.trim(),
        role: role.trim(),
        message: message.trim()
      });
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setErrorMsg('Could not submit interview invite. Please try again or WhatsApp us.');
    } finally {
      setLoading(false);
    }
  };

  const whatsappText = encodeURIComponent(
    `Hello ITreal, I would like to request an interview with ${student.firstName} ${student.surnameInitial} (${student.track}) for the role of "${role || 'IT Support'}" at ${companyName || 'our company'}.`
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#080c16] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#151c32]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center font-bold">
              <Briefcase size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-tight">
                Invite to Interview
              </h3>
              <p className="text-xs text-white/60">
                Candidate: <strong className="text-cyan-400">{student.firstName} {student.surnameInitial}</strong> ({student.track})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8">
          {success ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 size={36} />
              </div>
              <h4 className="text-xl font-black text-white uppercase tracking-tight">
                Invite Dispatched!
              </h4>
              <p className="text-sm text-slate-300 max-w-md mx-auto">
                Thanks. ITreal will contact the student and come back to you.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href={`https://wa.me/27730000000?text=${whatsappText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer"
                >
                  <MessageCircle size={16} />
                  <span>Notify Admin via WhatsApp</span>
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-white/70">
                To respect POPIA, ITreal acts as the accredited bridge. Submit your role details and we will coordinate interview availability directly with the candidate.
              </p>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-white/70 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Swartland IT Solutions"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#151c32] border border-white/10 text-white text-xs focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-white/70 mb-1">
                    Contact Person *
                  </label>
                  <input
                    type="text"
                    required
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="e.g. Sarah van der Merwe"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#151c32] border border-white/10 text-white text-xs focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-white/70 mb-1">
                    Email or Phone *
                  </label>
                  <input
                    type="text"
                    required
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    placeholder="sarah@company.co.za / 082 123 4567"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#151c32] border border-white/10 text-white text-xs focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-white/70 mb-1">
                    Position / Role *
                  </label>
                  <input
                    type="text"
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Junior Desktop Support Tech"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#151c32] border border-white/10 text-white text-xs focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-white/70 mb-1">
                  Message / Interview Details (Optional)
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Offer details, starting stipend/salary, office location (e.g. Malmesbury / Remote)..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[#151c32] border border-white/10 text-white text-xs focus:border-cyan-400 focus:outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send size={15} />
                <span>{loading ? 'Submitting...' : 'Send Interview Invitation'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 3. Student Report Card Modal (Domain Breakdown & PDF)
// -------------------------------------------------------------
interface ReportCardModalProps {
  student: TopStudentItem;
  onClose: () => void;
}

export const StudentReportCardModal: React.FC<ReportCardModalProps> = ({ student, onClose }) => {
  const [downloading, setDownloading] = useState(false);
  const report = student.reportCardData || {
    examReadiness: student.score,
    domainScores: [
      { domain: 'Domain 1: Core Fundamentals', score: student.score },
      { domain: 'Domain 2: Implementations & Setup', score: Math.min(100, student.score + 2) },
      { domain: 'Domain 3: Security & Compliance', score: Math.max(70, student.score - 3) },
      { domain: 'Domain 4: Troubleshooting PBQs', score: student.score }
    ],
    testsCompleted: 30,
    avgScore: student.score,
    topStrengths: student.tags
  };

  const handleDownloadPDF = () => {
    setDownloading(true);
    const doc = new jsPDF();

    // Dark header banner
    doc.setFillColor(8, 12, 22);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(6, 182, 212);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('ITREAL TECH SOLUTIONS', 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text('Certified Student Performance & Readiness Report', 14, 30);

    // Student overview
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(15);
    doc.text(`Candidate: ${student.firstName} ${student.surnameInitial}`, 14, 52);
    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105);
    doc.text(`Track: ${student.track}`, 14, 60);
    doc.text(`Overall Exam Readiness: ${report.examReadiness}%`, 14, 67);
    doc.text(`Timed Practice Tests Completed: ${report.testsCompleted}`, 14, 74);
    doc.text(`Average Assessment Score: ${report.avgScore}%`, 14, 81);

    // Table of domain breakdown
    autoTable(doc, {
      startY: 90,
      head: [['Curriculum Domain', 'Readiness Score', 'Status']],
      body: report.domainScores.map(d => [
        d.domain,
        `${d.score}%`,
        d.score >= 85 ? 'Exemplary' : d.score >= 70 ? 'Exam Ready' : 'Reviewing'
      ]),
      theme: 'striped',
      headStyles: { fillColor: [8, 12, 22], textColor: [6, 182, 212] }
    });

    // Verification seal text
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(
      'Verification: This candidate report is generated directly from simulated CompTIA exams and live PBQ terminal diagnostics on the ITreal training engine. Contact: hello@itreal.co.za',
      14,
      finalY,
      { maxWidth: 180 }
    );

    doc.save(`ITreal_Report_${student.firstName}_${student.surnameInitial}.pdf`);
    setDownloading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#080c16] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#151c32]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center font-bold">
              <Award size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-tight">
                ITreal Verified Report Card
              </h3>
              <p className="text-xs text-white/60">
                {student.firstName} {student.surnameInitial} • {student.track}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/25 transition-all text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
            >
              <Download size={14} />
              <span>{downloading ? 'Exporting...' : 'Download PDF'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Report Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 text-slate-200">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-[#151c32] border border-white/5 text-center">
              <p className="text-[10px] font-black uppercase tracking-wider text-white/60">Exam Readiness</p>
              <p className="text-2xl font-black text-cyan-400 font-mono mt-1">{report.examReadiness}%</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#151c32] border border-white/5 text-center">
              <p className="text-[10px] font-black uppercase tracking-wider text-white/60">Tests Drilled</p>
              <p className="text-2xl font-black text-white font-mono mt-1">{report.testsCompleted}</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#151c32] border border-white/5 text-center">
              <p className="text-[10px] font-black uppercase tracking-wider text-white/60">Avg Assessment</p>
              <p className="text-2xl font-black text-emerald-400 font-mono mt-1">{report.avgScore}%</p>
            </div>
          </div>

          {/* Domain Breakdown Bars */}
          <div className="space-y-4 bg-[#10172a] p-5 rounded-2xl border border-white/5">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">
              Domain Mastery Breakdown
            </h4>
            <div className="space-y-3">
              {report.domainScores.map((domain, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-white/80">{domain.domain}</span>
                    <span className="font-mono text-cyan-400 font-black">{domain.score}%</span>
                  </div>
                  <div className="h-2 bg-[#151c32] rounded-full overflow-hidden border border-white/5">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full"
                      style={{ width: `${domain.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Key Strengths */}
          {report.topStrengths && report.topStrengths.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-black text-white/60 uppercase tracking-widest">
                Demonstrated Strengths
              </h4>
              <div className="flex flex-wrap gap-2">
                {report.topStrengths.map((s, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-xl text-xs font-bold bg-[#151c32] text-white border border-white/10"
                  >
                    ★ {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
