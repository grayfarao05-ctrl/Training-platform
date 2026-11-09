import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowRight,
  MessageCircle,
  Search,
  Bell,
  Cpu,
  Network,
  Briefcase,
  Bot,
  Gamepad2,
  BookOpen,
  ClipboardCheck,
  Trophy,
  Sparkles,
  Terminal,
  Zap,
  ShieldCheck,
  Layers,
  Award,
} from 'lucide-react';
import {
  ReviewItem,
  TopStudentItem,
  LandingSettings,
  DEFAULT_REVIEWS,
  DEFAULT_TOP_STUDENTS,
  DEFAULT_LANDING_SETTINGS,
  subscribeReviews,
  subscribeTopStudents,
  subscribeLandingSettings,
} from '../landingService';
import {
  StudentCVModal,
  InviteInterviewModal,
  StudentReportCardModal,
} from './landing/TopStudentModals';

interface LandingPageProps {
  userName?: string;
  onEnter: () => void;
  onLogin?: () => void;
  onRegister?: () => void;
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
}

const WHATSAPP_NUMBER = '27720000000'; // TODO: Replace with ITreal official WhatsApp number
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  'Hi ITreal, I would like to learn more about your CompTIA A+, Network+ and career courses.'
)}`;

/** Word-by-word masked rise animation with preserved natural spacing */
const RevealWords: React.FC<{ text: string; className?: string; delay?: number }> = ({
  text,
  className = '',
  delay = 0,
}) => (
  <span className={className}>
    {text.split(' ').map((w, i, arr) => (
      <React.Fragment key={i}>
        <span className="lp-word">
          <span style={{ transitionDelay: `${delay + i * 65}ms` }}>{w}</span>
        </span>
        {i < arr.length - 1 ? ' ' : null}
      </React.Fragment>
    ))}
  </span>
);

/* 5 Foundation Cards matching the 2-over-3 layout in the reference video:
 * Row 1: CompTIA Network+ (dark), Beyond the Chatbot (dark)
 * Row 2: CompTIA A+ (featured bright indigo, bottom-left), Matric to Money (dark, center), The Arcade (dark, right)
 */
const FOUNDATION_CARDS = [
  {
    title: 'CompTIA Network+',
    code: 'N10-008 / N10-009',
    text: 'Master IPv4/IPv6 subnetting, VLANs, routing protocols, enterprise wireless and network security across 5 domains.',
    Icon: Network,
    rot: -5.5,
    speed: -0.08,
    featured: false,
  },
  {
    title: 'Beyond the Chatbot',
    code: 'Practical AI for Work',
    text: 'Turn AI into a workplace engine: Role-Task-Rule prompting, supplier pricelist extraction, WhatsApp templates and POPIA.',
    Icon: Bot,
    rot: 4.8,
    speed: -0.14,
    featured: false,
  },
  {
    title: 'CompTIA A+ Mastery',
    code: '220-1101 & 220-1102',
    text: 'Nine complete domains across Core 1 & Core 2: PC hardware, mobile devices, virtualization, Linux/Windows OS and troubleshooting.',
    Icon: Cpu,
    rot: -4.5,
    speed: 0.12,
    featured: true,
  },
  {
    title: 'Matric to Money',
    code: 'Career Launchpad',
    text: 'ATS-ready South African CVs, interview etiquette, BCEA contract red-flag detection and personal financial foundations.',
    Icon: Briefcase,
    rot: 1.5,
    speed: 0.05,
    featured: false,
  },
  {
    title: '8 Arcade Mini-Games',
    code: 'Interactive Drills',
    text: 'Subnet Speed-Run, CLI Challenge, Motherboard Puzzle, Match the Trio, Path Finder, Acronym Attack & CV Clinic.',
    Icon: Gamepad2,
    rot: -5.2,
    speed: 0.15,
    featured: false,
  },
];

const STRIP_ITEMS = [
  { label: 'CompTIA A+', Icon: Cpu },
  { label: 'Network+', Icon: Network },
  { label: 'Matric to Money', Icon: Briefcase },
  { label: 'Beyond the Chatbot', Icon: Bot },
  { label: 'Subnet Speed-Run', Icon: Zap },
  { label: 'CLI Challenge', Icon: Terminal },
  { label: 'Motherboard Puzzle', Icon: Layers },
  { label: 'Acronym Attack', Icon: ShieldCheck },
];

/* 90°/45° PCB circuit traces radiating around the central ITreal chip */
const PCB_TRACES = [
  // Top traces
  { d: 'M 115 65 L 115 35 L 100 20', cx: 100, cy: 20 },
  { d: 'M 135 65 L 135 18', cx: 135, cy: 18 },
  { d: 'M 155 65 L 155 28 L 170 14', cx: 170, cy: 14 },
  { d: 'M 175 65 L 175 40 L 192 24', cx: 192, cy: 24 },
  // Right traces
  { d: 'M 235 110 L 265 110 L 282 95', cx: 282, cy: 95 },
  { d: 'M 235 135 L 288 135', cx: 288, cy: 135 },
  { d: 'M 235 160 L 270 160 L 286 176', cx: 286, cy: 176 },
  { d: 'M 235 185 L 260 185 L 275 200', cx: 275, cy: 200 },
  // Bottom traces
  { d: 'M 120 235 L 120 268 L 105 284', cx: 105, cy: 284 },
  { d: 'M 145 235 L 145 286', cx: 145, cy: 286 },
  { d: 'M 168 235 L 168 265 L 184 280', cx: 184, cy: 280 },
  { d: 'M 190 235 L 190 255 L 206 270', cx: 206, cy: 270 },
  // Left traces
  { d: 'M 65 105 L 38 105 L 22 90', cx: 22, cy: 90 },
  { d: 'M 65 195 L 38 195 L 22 210', cx: 22, cy: 210 },
];

export const LandingPage: React.FC<LandingPageProps> = ({
  userName,
  onEnter,
  onLogin,
  onRegister,
  onOpenPrivacy,
  onOpenTerms,
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heroMockRef = useRef<HTMLDivElement>(null);
  const bentoTiltRef = useRef<HTMLDivElement>(null);
  const foundationRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  const [reviews, setReviews] = useState<ReviewItem[]>(DEFAULT_REVIEWS);
  const [topStudents, setTopStudents] = useState<TopStudentItem[]>(DEFAULT_TOP_STUDENTS);
  const [settings, setSettings] = useState<LandingSettings>(DEFAULT_LANDING_SETTINGS);

  // Modals for top students
  const [activeCvStudent, setActiveCvStudent] = useState<TopStudentItem | null>(null);
  const [activeInterviewStudent, setActiveInterviewStudent] = useState<TopStudentItem | null>(null);
  const [activeReportStudent, setActiveReportStudent] = useState<TopStudentItem | null>(null);

  const handleStartAuth = () => (onLogin ? onLogin() : onEnter());
  const handleRegister = () => (onRegister ? onRegister() : handleStartAuth());

  const lead = topStudents.find((s) => s.consentGiven) || DEFAULT_TOP_STUDENTS[0];
  const domainScores = lead?.reportCardData?.domainScores?.slice(0, 3) || [
    { domain: 'Mobile Devices', score: 96 },
    { domain: 'Networking', score: 91 },
    { domain: 'Hardware', score: 98 },
  ];
  const publicStudents = topStudents
    .filter((s) => s.consentGiven)
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 3);

  /* ---------- Subscribe to Firestore data ---------- */
  useEffect(() => {
    const unsubReviews = subscribeReviews((d) => d && d.length > 0 && setReviews(d));
    const unsubStudents = subscribeTopStudents((d) => d && setTopStudents(d));
    const unsubSettings = subscribeLandingSettings((d) => d && setSettings(d));
    return () => {
      unsubReviews();
      unsubStudents();
      unsubSettings();
    };
  }, []);

  /* ---------- IntersectionObserver for staged reveals ---------- */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const els = root.querySelectorAll<HTMLElement>('[data-reveal]');
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: '0px 0px -6% 0px' }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [publicStudents.length, reviews.length]);

  /* ---------- Continuous 60fps rAF scroll loop for smooth section & 3D transitions ---------- */
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    let ticking = false;

    const update = () => {
      ticking = false;
      const y = window.scrollY;
      const vh = window.innerHeight;

      // 1. Hero 3D dashboard: tilted back at 22deg, straightens smoothly over first 520px
      if (heroMockRef.current) {
        const p = Math.min(1, Math.max(0, y / 520));
        const easeP = 1 - Math.pow(1 - p, 3);
        const rx = (1 - easeP) * 22;
        const sc = 0.9 + easeP * 0.1;
        const ty = (1 - easeP) * 28;
        heroMockRef.current.style.transform = `perspective(1400px) rotateX(${rx.toFixed(2)}deg) scale(${sc.toFixed(3)}) translateY(${ty.toFixed(1)}px)`;
      }

      // 2. Bento tilted dashboard preview: smooth 3D swing as you scroll past
      if (bentoTiltRef.current) {
        const r = bentoTiltRef.current.getBoundingClientRect();
        const t = Math.max(-1, Math.min(1, (r.top + r.height / 2 - vh / 2) / vh));
        const rx = 16 + t * 8;
        const rz = -13 + t * 5;
        const tx = 6 + t * 14;
        const ty = 8 + t * 10;
        bentoTiltRef.current.style.transform = `perspective(1100px) rotateX(${rx.toFixed(2)}deg) rotateZ(${rz.toFixed(2)}deg) translate(${tx.toFixed(1)}%, ${ty.toFixed(1)}%)`;
      }

      // 3. Foundation cards: individual vertical drift + subtle rotation parallax
      if (foundationRef.current && window.innerWidth >= 768) {
        const r = foundationRef.current.getBoundingClientRect();
        const off = r.top + r.height / 2 - vh / 2;
        cardRefs.current.forEach((el, i) => {
          if (!el) return;
          const c = FOUNDATION_CARDS[i];
          const ty = Math.max(-48, Math.min(48, off * c.speed));
          const rot = c.rot + (off / vh) * (i % 2 === 0 ? -1.8 : 1.8);
          el.style.transform = `translate3d(0, ${ty.toFixed(1)}px, 0) rotate(${rot.toFixed(2)}deg)`;
        });
      }

      // 4. Smooth section-to-section depth transition
      sectionRefs.current.forEach((sec) => {
        if (!sec) return;
        const r = sec.getBoundingClientRect();
        const centerDist = (r.top + r.height / 2 - vh / 2) / vh;
        const absDist = Math.min(1, Math.abs(centerDist));
        const scale = 1 - absDist * 0.025;
        sec.style.setProperty('--sec-scale', scale.toFixed(3));
      });
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  /* ---------- Lightweight 2D Canvas Starfield ---------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let w = 0;
    let h = 0;
    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const count = w < 768 ? 32 : 68;
    const stars = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.45 + 0.35,
      vy: Math.random() * 0.2 + 0.04,
      a: Math.random() * Math.PI * 2,
      s: Math.random() * 0.02 + 0.006,
    }));

    let raf = 0;
    let running = true;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const st of stars) {
        st.y -= st.vy;
        st.a += st.s;
        if (st.y < -4) {
          st.y = h + 4;
          st.x = Math.random() * w;
        }
        ctx.globalAlpha = 0.2 + (Math.sin(st.a) + 1) * 0.32;
        ctx.fillStyle = '#E0E7FF';
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (running) raf = requestAnimationFrame(draw);
    };
    draw();

    const onVis = () => {
      running = !document.hidden;
      if (running) draw();
      else cancelAnimationFrame(raf);
    };
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  const goTo = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };

  /** Shared Student & Course Dashboard Mockup (mirrors the Resq.io dashboard layout with ITreal data) */
  const DashboardMockup = ({ compact = false }: { compact?: boolean }) => (
    <div className="lp-dash">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <img src="/assets/itreal-icon.png" alt="ITreal" className="w-4 h-4 object-contain" />
          <span className="font-bold text-white text-sm tracking-tight">ITreal.io</span>
        </div>
        {!compact && (
          <div className="hidden md:flex items-center gap-1 p-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] text-slate-400">
            {['Overview', 'Objectives', 'Arcade', 'Mock Exams', 'Talent Pool'].map((t, i) => (
              <span
                key={t}
                className={`px-3 py-1 rounded-full transition-colors ${
                  i === 0 ? 'bg-white/10 text-white font-medium' : ''
                }`}
              >
                {t}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="lp-icon-btn">
            <Search className="w-3.5 h-3.5" />
          </span>
          <span className="lp-icon-btn">
            <Bell className="w-3.5 h-3.5" />
          </span>
          <span className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-300 via-orange-400 to-pink-500 text-[11px] font-bold text-black flex items-center justify-center shadow-sm">
            {(lead?.firstName || 'T').charAt(0)}
          </span>
        </div>
      </div>

      {/* Welcome + progress pills + 3 big stat counters */}
      <div className="mt-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xl md:text-2xl text-white font-normal tracking-tight">
            Welcome in, <span className="text-indigo-300/90">{lead?.firstName || 'Thando'}</span>
          </p>
          <div className="mt-3 grid grid-cols-4 gap-2 text-[10px] text-slate-400 max-w-md">
            {[
              ['Core 1', '72%', 'bg-pink-500 text-white font-semibold'],
              ['Core 2', '58%', 'bg-white text-slate-950 font-semibold'],
              ['Network+', '40%', 'bg-white/10 text-slate-200'],
              ['AI & Career', '85%', 'bg-white/10 text-slate-200'],
            ].map(([label, val, cls]) => (
              <div key={label}>
                <div className="mb-1 truncate">{label}</div>
                <div className={`rounded-full px-2.5 py-0.5 text-center ${cls}`}>{val}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-5 sm:gap-6">
          {[
            [lead?.reportCardData?.testsCompleted ?? 38, 'Mocks passed', 'bg-emerald-400', '+12%'],
            [settings.stats.courses + 22, 'Days streak', 'bg-emerald-400', '+24%'],
            [settings.stats.studentsTrained, 'Learners active', 'bg-rose-400', 'ZA'],
          ].map(([n, label, dot, badge]) => (
            <div key={label as string} className="flex items-center gap-2.5">
              <span className="relative flex items-center justify-center px-1.5 py-0.5 rounded-full bg-white/90 text-[9px] font-bold text-slate-900">
                <span className={`w-1.5 h-1.5 rounded-full ${dot} mr-1`} />
                {badge}
              </span>
              <div>
                <div className="text-2xl md:text-3xl font-light text-white leading-none">{n as number}</div>
                <div className="text-[10px] text-slate-400 mt-1">{label as string}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom 3-column grid: Summary + Dual Spline Chart + Blue Readiness Card */}
      <div className={`mt-5 grid gap-3 ${compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-[1.05fr_1.95fr_0.95fr]'}`}>
        {!compact && (
          <div className="hidden md:flex lp-panel flex-col justify-between">
            <div>
              <div className="text-xs text-slate-300 font-medium mb-3">Domain mastery</div>
              {domainScores.map((d, i) => (
                <div
                  key={d.domain}
                  className="flex items-center justify-between text-[11px] bg-white/[0.04] border border-white/[0.05] rounded-lg px-2.5 py-2 mb-2"
                >
                  <span className="flex items-center gap-2 text-slate-300 truncate">
                    <span className={`w-1.5 h-1.5 rounded-full ${['bg-indigo-400', 'bg-emerald-400', 'bg-pink-400'][i]}`} />
                    {d.domain}
                  </span>
                  <span className="text-white font-medium px-1.5 py-0.5 rounded bg-white/5">{d.score}%</span>
                </div>
              ))}
            </div>
            <div className="text-[10px] text-slate-500 flex items-center gap-1.5 pt-1">
              <Award className="w-3 h-3 text-indigo-400 shrink-0" />
              <span>CompTIA A+ 220-1101 / 1102</span>
            </div>
          </div>
        )}

        <div className="lp-panel" data-reveal="chart">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-300 font-medium">Mock exam frequency</span>
            <span className="hidden sm:flex gap-1 text-[10px] text-slate-400 bg-white/[0.03] p-0.5 rounded-full border border-white/[0.06]">
              <span className="px-2 py-0.5 rounded-full">12 months</span>
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-white">30 days</span>
              <span className="px-2 py-0.5 rounded-full">1 week</span>
            </span>
          </div>
          <svg viewBox="0 0 320 115" className="w-full h-28 overflow-visible" aria-hidden="true">
            {[55, 110, 165, 220, 275].map((x) => (
              <line key={x} x1={x} y1="6" x2={x} y2="102" stroke="rgba(255,255,255,0.06)" />
            ))}
            <path
              className="lp-line"
              d="M0,86 C28,22 58,24 88,62 S145,104 176,52 S236,14 312,42"
              stroke="#EC4899"
            />
            <path
              className="lp-line lp-line-2"
              d="M0,56 C38,98 68,96 98,68 S158,20 188,68 S248,96 312,26"
              stroke="#6366F1"
            />
            <circle cx="176" cy="52" r="5" fill="#6366F1" stroke="#fff" strokeWidth="2" className="lp-chart-dot" />
            <g className="lp-chart-dot" transform="translate(184, 34)">
              <rect width="74" height="28" rx="6" fill="rgba(24,26,38,0.92)" stroke="rgba(255,255,255,0.12)" />
              <text x="8" y="12" fill="#94A3B8" fontSize="7.5">Mock #14</text>
              <text x="8" y="22" fill="#FFFFFF" fontSize="8.5" fontWeight="600">94% Readiness</text>
            </g>
          </svg>
          <div className="flex justify-between text-[9px] text-slate-500 mt-1 px-1">
            <span>Week 1</span>
            <span>Week 2</span>
            <span>Week 3</span>
            <span>Week 4</span>
            <span>Today</span>
          </div>
        </div>

        {!compact && (
          <div className="hidden md:flex lp-blue-card flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-white">Exam Readiness</span>
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] text-white">↗</span>
              </div>
              <p className="text-[10px] text-blue-100/85 mt-1.5 leading-relaxed">
                Core 1 & Core 2 objectives verified across 8 arcade drills.
              </p>
            </div>
            <div className="space-y-2 mt-3">
              <div className="bg-white text-slate-950 text-[10px] font-medium rounded-lg px-2.5 py-1.5 flex items-center justify-between shadow-md -rotate-2">
                <span>Core 1 (220-1101)</span>
                <span className="w-4 h-4 rounded-full bg-slate-900 text-white text-[9px] flex items-center justify-center">9</span>
              </div>
              <div className="bg-white/90 text-slate-950 text-[10px] font-medium rounded-lg px-2.5 py-1.5 flex items-center justify-between shadow-md rotate-1">
                <span>Arcade Badges</span>
                <span className="w-4 h-4 rounded-full bg-slate-900 text-white text-[9px] flex items-center justify-center">8</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div ref={rootRef} className="lp-root relative min-h-screen bg-[#020308] text-slate-100 font-sans overflow-x-hidden">
      <style>{LP_CSS}</style>

      {/* Fixed ambient star particles canvas */}
      <canvas ref={canvasRef} aria-hidden="true" className="fixed inset-0 w-full h-full pointer-events-none z-0" />

      {/* ============ FLOATING PILL NAVBAR ============ */}
      <header className="fixed top-5 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
        <nav className="lp-nav pointer-events-auto" aria-label="Main navigation">
          <a href="#top" onClick={goTo('top')} className="flex items-center group cursor-pointer shrink-0" aria-label="ITreal Home">
            <img 
              src="/assets/itreal-logo.png" 
              alt="ITreal - Real Knowledge, Real Steps, Real Opportunities" 
              className="h-7 sm:h-8 w-auto object-contain drop-shadow-[0_0_16px_rgba(99,102,241,0.35)] transition-transform group-hover:scale-105" 
            />
          </a>
          <div className="hidden md:flex items-center gap-7 text-xs text-slate-300">
            <a href="#issues" onClick={goTo('issues')} className="hover:text-white transition-colors">Why ITreal</a>
            <a href="#platform" onClick={goTo('platform')} className="hover:text-white transition-colors">Platform</a>
            <a href="#capabilities" onClick={goTo('capabilities')} className="hover:text-white transition-colors">Arcade</a>
            <a href="#courses" onClick={goTo('courses')} className="hover:text-white transition-colors">Courses</a>
            <a href="#students" onClick={goTo('students')} className="hover:text-white transition-colors">Top Students</a>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="lp-icon-btn !w-8 !h-8 text-emerald-400 hover:bg-emerald-500/15 transition-colors"
              aria-label="WhatsApp us"
              title="WhatsApp ITreal"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
            <button onClick={handleStartAuth} className="lp-btn-nav">
              {userName ? 'Portal' : 'Log in'}
            </button>
          </div>
        </nav>
      </header>

      <main className="relative z-10">
        {/* ============ 1. HERO SECTION ============ */}
        <section
          id="top"
          ref={(el) => { sectionRefs.current[0] = el; }}
          className="lp-sec relative pt-36 md:pt-44 pb-10 px-4 overflow-hidden"
        >
          {/* Multi-ray volumetric light beams from top-left */}
          <div aria-hidden="true" className="lp-rays" />
          <div aria-hidden="true" className="lp-ray-streak" />

          <div className="relative max-w-4xl mx-auto text-center" data-reveal>
            <h1 className="text-4xl sm:text-6xl md:text-[68px] font-semibold tracking-tight leading-[1.08] text-white">
              <RevealWords text="Master IT fast" className="lp-grad-text" />{' '}
              <RevealWords text="when" delay={140} />
              <br />
              <RevealWords text="exams & careers call" delay={240} />
            </h1>
            <p
              className="lp-fade mt-6 text-sm md:text-base text-slate-300/90 max-w-xl mx-auto leading-relaxed"
              style={{ transitionDelay: '520ms' }}
            >
              Complete CompTIA A+, Network+, practical AI and career readiness training—with interactive arcade labs tailored for South African learners.
            </p>
            <div
              className="lp-fade mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5"
              style={{ transitionDelay: '680ms' }}
            >
              <button onClick={handleRegister} className="lp-btn-primary w-full sm:w-auto">
                <span>Start learning free</span>
              </button>
              <a href="#courses" onClick={goTo('courses')} className="lp-btn-ghost w-full sm:w-auto">
                Explore courses
              </a>
            </div>
          </div>

          {/* 3D Tilted Dashboard Mockup with top-left lens flare */}
          <div
            className="relative mt-16 md:mt-20 max-w-5xl mx-auto lp-fade"
            data-reveal
            style={{ transitionDelay: '820ms' }}
          >
            {/* Bright lens flare where the top-left light beam strikes the dashboard corner */}
            <div aria-hidden="true" className="lp-corner-flare" />

            <div
              ref={heroMockRef}
              className="lp-hero-mock"
              style={{ transform: 'perspective(1400px) rotateX(22deg) scale(0.9) translateY(28px)' }}
            >
              <DashboardMockup />
            </div>
            <div
              aria-hidden="true"
              className="absolute inset-x-0 -bottom-2 h-36 bg-gradient-to-t from-[#020308] via-[#020308]/80 to-transparent pointer-events-none"
            />
          </div>
        </section>

        {/* ============ 2. MARQUEE BADGE STRIP ============ */}
        <section className="relative py-12" aria-label="Courses and interactive games">
          <div className="lp-marquee-mask max-w-6xl mx-auto">
            <div className="lp-marquee">
              {[...STRIP_ITEMS, ...STRIP_ITEMS].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5 text-white/90 whitespace-nowrap select-none">
                  <span className="w-7 h-7 rounded-lg bg-white/[0.07] border border-white/15 flex items-center justify-center">
                    <item.Icon className="w-4 h-4 text-indigo-300" />
                  </span>
                  <span className="text-lg md:text-xl font-bold tracking-tight">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ 3. "ISSUES ARISE EVERY DAY" — HANGING TAGS CARD ============ */}
        <section
          id="issues"
          ref={(el) => { sectionRefs.current[1] = el; }}
          className="lp-sec relative px-4 py-16 md:py-24"
        >
          <div className="lp-issue-card max-w-5xl mx-auto" data-reveal>
            <div className="relative z-10 max-w-md">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-medium text-white leading-[1.12] tracking-tight">
                <RevealWords text="Tough topics pop up" />
                <br />
                <RevealWords text="every day" delay={180} />
              </h2>
              <p className="lp-fade mt-4 text-sm text-slate-300/85 leading-relaxed" style={{ transitionDelay: '380ms' }}>
                Subnets, command-line flags, motherboard headers and job contracts can feel overwhelming—but with interactive drills, chaos turns into mastery.
              </p>
            </div>

            {/* 5 Tilted Tags Hanging on Vertical Glowing Threads */}
            <div className="lp-tags" aria-hidden="true">
              {[
                { t: 'Proof in the terminal', x: '14%', h: 68, rot: -6, d: 0 },
                { t: 'Subnetting in 20s', x: '60%', h: 112, rot: 5, d: 0.5 },
                { t: 'All 9 domains stable', x: '22%', h: 158, rot: 6, d: 1.0, hot: true },
                { t: 'Mock exam 94% ✓', x: '58%', h: 206, rot: -5, d: 0.3 },
                { t: 'CV red flags fixed', x: '4%', h: 238, rot: 0, d: 0.8 },
              ].map((g, i) => (
                <div
                  key={i}
                  className="lp-hang"
                  style={{
                    left: g.x,
                    animationDelay: `${g.d}s`,
                    ['--tag-rot' as string]: `${g.rot}deg`,
                  }}
                >
                  <span className="lp-thread" style={{ height: g.h }} />
                  <span className="lp-knot" />
                  <span className={`lp-tag ${g.hot ? 'lp-tag-hot' : ''}`}>{g.t}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ 4. UNIFIED LEARNING PLATFORM — CIRCUIT CHIP ============ */}
        <section
          id="platform"
          ref={(el) => { sectionRefs.current[2] = el; }}
          className="lp-sec relative px-4 py-20 md:py-28"
        >
          <div className="text-center max-w-2xl mx-auto" data-reveal>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-medium text-white tracking-tight">
              <RevealWords text="Unified learning platform" />
            </h2>
            <p className="lp-fade mt-4 text-sm text-slate-400 leading-relaxed" style={{ transitionDelay: '280ms' }}>
              From your first hardware objective to your first verified interview invite, equip yourself with the tools to learn fast and prove your skills.
            </p>
          </div>

          <div
            className="mt-16 max-w-5xl mx-auto grid md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.55fr)_auto] items-center gap-8 md:gap-0"
            data-reveal
          >
            {/* Left 2x2 grid of 4 dark glass cards with horizontal bridge bars */}
            <div className="grid grid-cols-2 gap-4 md:gap-6 relative">
              {[
                {
                  t: 'Guided Lessons',
                  d: 'Clear study modules for A+, Network+, AI & career prep',
                  Icon: BookOpen,
                },
                {
                  t: 'Arcade Labs',
                  d: '8 fast-paced mini-games that build muscle memory',
                  Icon: Gamepad2,
                },
                {
                  t: 'AI Study Engine',
                  d: 'Practical prompt frameworks & workplace templates',
                  Icon: Bot,
                },
                {
                  t: 'Talent Report Cards',
                  d: 'Verified domain scores shared directly with employers',
                  Icon: ClipboardCheck,
                },
              ].map((c, i) => (
                <div
                  key={c.t}
                  className="lp-mini-card lp-pop"
                  style={{ transitionDelay: `${140 + i * 100}ms` }}
                >
                  <div className="text-sm text-white font-medium">{c.t}</div>
                  <div className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">{c.d}</div>
                </div>
              ))}
              {/* Horizontal bridge bars between column 1 and column 2 */}
              <span aria-hidden="true" className="lp-bridge-h hidden md:block" style={{ top: '23%' }} />
              <span aria-hidden="true" className="lp-bridge-h hidden md:block" style={{ top: '77%' }} />
            </div>

            {/* Orthogonal rounded elbow conduit pipes connecting the 2x2 grid into the central chip */}
            <svg
              className="hidden md:block w-full h-64 overflow-visible"
              viewBox="0 0 220 260"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {[
                'M 0,60 L 84,60 Q 104,60 104,80 L 104,110 Q 104,130 124,130 L 220,130',
                'M 0,200 L 84,200 Q 104,200 104,180 L 104,150 Q 104,130 124,130 L 220,130',
              ].map((d, i) => (
                <g key={i}>
                  <path d={d} className="lp-conduit-outer" vectorEffect="non-scaling-stroke" />
                  <path d={d} className="lp-conduit-inner" vectorEffect="non-scaling-stroke" />
                  <path
                    d={d}
                    className="lp-pulse"
                    vectorEffect="non-scaling-stroke"
                    style={{ animationDelay: `${i * 1.1}s` }}
                  />
                </g>
              ))}
            </svg>

            {/* Right: Glowing 3D Square Chip with PCB Circuit Traces */}
            <div className="flex justify-center order-first md:order-none lp-pop" style={{ transitionDelay: '460ms' }}>
              <div className="lp-chip-wrap">
                <svg className="lp-traces" viewBox="0 0 300 300" aria-hidden="true">
                  {PCB_TRACES.map((t, i) => (
                    <g key={i}>
                      <path
                        d={t.d}
                        fill="none"
                        stroke="rgba(129,140,248,0.5)"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle
                        cx={t.cx}
                        cy={t.cy}
                        r="2.4"
                        fill="#C7D2FE"
                        className="lp-trace-dot"
                        style={{ animationDelay: `${(i % 5) * 0.35}s` }}
                      />
                    </g>
                  ))}
                </svg>
                <div className="lp-chip flex flex-col items-center justify-center p-3">
                  <img 
                    src="/assets/itreal-icon.png" 
                    alt="ITreal" 
                    className="w-14 h-14 md:w-16 md:h-16 object-contain drop-shadow-[0_0_16px_rgba(255,255,255,0.7)]" 
                  />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-100 mt-1">ITreal</span>
                  <span aria-hidden="true" className="lp-chip-sparkles" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ 5. ALL-IN-ONE PLATFORM CAPABILITIES — ASYMMETRIC BENTO ============ */}
        <section
          id="capabilities"
          ref={(el) => { sectionRefs.current[3] = el; }}
          className="lp-sec relative px-4 py-20 md:py-28"
        >
          <h2 className="text-center text-3xl sm:text-4xl md:text-5xl font-medium text-white tracking-tight leading-[1.12]" data-reveal>
            <RevealWords text="All-in-one platform" />
            <br />
            <RevealWords text="capabilities" delay={180} />
          </h2>

          {/* Row 1: [1fr_1.55fr] */}
          <div className="mt-14 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-[1fr_1.55fr] gap-4">
            {/* Top-Left: Bright Indigo Card */}
            <div className="lp-bento lp-bento-indigo flex flex-col justify-between" data-reveal>
              <div>
                <h3 className="text-2xl md:text-3xl text-white font-medium leading-tight">
                  <RevealWords text="Your study world, simplified in one dashboard." />
                </h3>
                <p className="lp-fade mt-4 text-sm text-indigo-100/85 leading-relaxed" style={{ transitionDelay: '280ms' }}>
                  Gain full visibility across all 4 courses with real-time exam readiness, XP streaks and domain-level mastery.
                </p>
              </div>
              <div aria-hidden="true" className="lp-sparkles" />
            </div>

            {/* Top-Right: Tilted 3D Dashboard Preview with Star Dust */}
            <div className="lp-bento overflow-hidden min-h-[290px]" data-reveal style={{ transitionDelay: '120ms' }}>
              <div aria-hidden="true" className="absolute -top-10 left-12 w-80 h-44 bg-indigo-500/30 blur-3xl rounded-full" />
              <div aria-hidden="true" className="lp-sparkles !top-5 !right-16 !bottom-auto opacity-80" />
              <div
                ref={bentoTiltRef}
                className="lp-bento-tilt"
                style={{ transform: 'perspective(1100px) rotateX(16deg) rotateZ(-13deg) translate(6%, 8%)' }}
              >
                <DashboardMockup compact />
              </div>
            </div>
          </div>

          {/* Row 2: Reversed [1.55fr_1fr] matching reference video f_08.jpg */}
          <div className="mt-4 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-[1.55fr_1fr] gap-4">
            {/* Bottom-Left (Wider): Quick Skill Resolution / Arcade & Student Activity Stack */}
            <div className="lp-bento min-h-[320px] flex flex-col justify-end overflow-hidden" data-reveal>
              {/* Subtle diagonal beam inside the card */}
              <div
                aria-hidden="true"
                className="absolute -top-12 -left-12 w-96 h-40 rotate-[28deg] bg-gradient-to-r from-indigo-500/25 via-indigo-300/15 to-transparent blur-2xl pointer-events-none"
              />

              {/* Staggered activity / game feed cards on the right side */}
              <div className="relative md:absolute md:top-5 md:right-5 md:w-[58%] space-y-2.5 mb-6 md:mb-0">
                <div className="lp-feed-card lp-pop ml-8" style={{ transitionDelay: '160ms' }}>
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-[11px] font-bold text-white flex items-center justify-center">
                      T
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs text-white font-medium truncate">Thabo M. · Atlantis</div>
                      <div className="text-[10px] text-slate-400 truncate">Motherboard Puzzle · 98% accuracy</div>
                    </div>
                  </div>
                </div>

                <div className="lp-feed-card lp-pop" style={{ transitionDelay: '280ms' }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.6)]">
                      Subnet Speed-Run
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">220-1101 · 18s</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    Completed 15 IPv4 CIDR /27 subnet calculations in under 20 seconds.
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-bold flex items-center justify-center">
                      A
                    </span>
                    <span className="text-[10px] text-slate-400">Anele K. · Malmesbury High</span>
                  </div>
                </div>

                <div className="lp-feed-card lp-pop ml-6" style={{ transitionDelay: '400ms' }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white text-slate-950">
                      CLI Mastered
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Streak 10</span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    Contract Red Flags & Terminal Challenge verified.
                  </p>
                </div>
              </div>

              <div className="relative z-10 max-w-[220px]">
                <h3 className="text-2xl md:text-3xl text-white font-medium leading-tight">
                  <RevealWords text="Hands-on arcade mastery" />
                </h3>
              </div>
            </div>

            {/* Bottom-Right (Narrower): Top Students & AI Career Engine with Discover Pill */}
            <div
              id="students"
              className="lp-bento flex flex-col justify-between"
              data-reveal
              style={{ transitionDelay: '140ms' }}
            >
              <div>
                <h3 className="text-xl md:text-2xl text-white font-medium leading-snug">
                  <RevealWords text="Verified talent & AI workflows—ready for work." />
                </h3>
                <p className="lp-fade mt-3 text-xs sm:text-sm text-slate-400 leading-relaxed" style={{ transitionDelay: '240ms' }}>
                  Top learners share live exam readiness report cards. Click any student below to inspect their domain scores or invite them to interview.
                </p>

                <div className="mt-4 space-y-2">
                  {publicStudents.map((s, i) => (
                    <button
                      key={s.id}
                      onClick={() => setActiveReportStudent(s)}
                      className="lp-student lp-pop w-full text-left"
                      style={{ transitionDelay: `${300 + i * 100}ms` }}
                    >
                      <span className="w-6 h-6 rounded-full bg-indigo-500/25 border border-indigo-400/40 text-[10px] text-indigo-200 flex items-center justify-center font-semibold">
                        #{s.rank}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-xs text-white font-medium truncate">
                          {s.firstName} {s.surnameInitial} · {s.schoolOrArea}
                        </span>
                      </span>
                      <span className="text-xs font-semibold text-indigo-300">{s.score}%</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <button onClick={handleStartAuth} className="lp-btn-primary !px-5 !py-2 text-xs">
                  Discover portal
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ============ 6. BUILT ON A SOLID FOUNDATION — 5 TILTED PARALLAX CARDS ============ */}
        <section
          id="courses"
          ref={(el) => { sectionRefs.current[4] = el; }}
          className="lp-sec relative px-4 py-24 md:py-32"
        >
          <h2 className="text-center text-3xl sm:text-4xl md:text-5xl font-medium text-white tracking-tight" data-reveal>
            <RevealWords text="Built on a solid foundation" />
          </h2>

          <div ref={foundationRef} className="lp-foundation mt-16 md:mt-20 max-w-5xl mx-auto" data-reveal>
            {FOUNDATION_CARDS.map((c, i) => (
              <div
                key={c.title}
                ref={(el) => { cardRefs.current[i] = el; }}
                onClick={handleStartAuth}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleStartAuth()}
                className={`lp-found-card ${c.featured ? 'lp-found-featured' : ''} lp-pop cursor-pointer`}
                style={{ transform: `rotate(${c.rot}deg)`, transitionDelay: `${i * 90}ms` }}
              >
                <div className="lp-glossy-icon">
                  <span className="lp-glossy-back" />
                  <span className="lp-glossy-front">
                    <c.Icon className="w-5 h-5 text-white" />
                  </span>
                </div>
                <div className="mt-5 text-base text-white font-medium">{c.title}</div>
                <div className="text-[10px] uppercase tracking-wider text-indigo-200/75 mt-0.5">{c.code}</div>
                <p className="mt-2 text-xs text-slate-300/90 leading-relaxed">{c.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ============ 7. FINAL CTA — MULTI-RAY BOTTOM SPOTLIGHT ============ */}
        <section
          ref={(el) => { sectionRefs.current[5] = el; }}
          className="lp-sec relative px-4 pt-24 md:pt-32 pb-12 overflow-hidden"
        >
          {/* Multi-cone spotlight beams rising from the bottom */}
          <div aria-hidden="true" className="lp-spot-rays" />
          <div aria-hidden="true" className="lp-spot" />
          <div aria-hidden="true" className="lp-spot-core" />

          <div className="relative text-center max-w-3xl mx-auto" data-reveal>
            <div className="flex justify-center mb-4">
              <img 
                src="/assets/itreal-logo.png" 
                alt="ITreal Tech Solutions" 
                className="h-10 sm:h-12 w-auto object-contain drop-shadow-[0_0_24px_rgba(99,102,241,0.45)]" 
              />
            </div>
            <h2 className="mt-2 text-4xl sm:text-5xl md:text-6xl font-medium text-white tracking-tight">
              <RevealWords text="Start Learning Free Today" delay={100} />
            </h2>
            <p className="lp-fade mt-5 text-xs sm:text-sm text-indigo-200/80 max-w-md mx-auto leading-relaxed" style={{ transitionDelay: '420ms' }}>
              Ready to earn your CompTIA certification or upskill your school?
              <br />
              Launch the interactive portal or chat with our Moorreesburg team today.
            </p>

            <div className="lp-fade mt-10 flex flex-col items-center justify-center gap-4" style={{ transitionDelay: '580ms' }}>
              <button onClick={handleRegister} className="lp-btn-hero">
                <span>Start learning free.</span>
                <span aria-hidden="true" className="lp-btn-sparkles" />
              </button>

              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs text-slate-300 hover:text-white transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Or chat with us on WhatsApp</span>
              </a>
            </div>
          </div>

          {/* ============ 8. MINIMAL INLINE FOOTER ============ */}
          <footer className="relative mt-28 md:mt-36 max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
            <div className="flex flex-wrap justify-center gap-6">
              <a href="#platform" onClick={goTo('platform')} className="hover:text-white transition-colors">Platform</a>
              <a href="#courses" onClick={goTo('courses')} className="hover:text-white transition-colors">Courses</a>
              <a href="#capabilities" onClick={goTo('capabilities')} className="hover:text-white transition-colors">Arcade</a>
            </div>
            <div className="text-slate-400/80 text-center">
              © {new Date().getFullYear()} ITreal Tech Solutions · Moorreesburg, Western Cape
            </div>
            <div className="flex flex-wrap justify-center gap-6">
              <a href="#students" onClick={goTo('students')} className="hover:text-white transition-colors">Talent Pool</a>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">WhatsApp</a>
              {onOpenPrivacy && (
                <button onClick={onOpenPrivacy} className="hover:text-white transition-colors">
                  Privacy & Policy
                </button>
              )}
              {onOpenTerms && (
                <button onClick={onOpenTerms} className="hover:text-white transition-colors">
                  Terms
                </button>
              )}
            </div>
          </footer>
        </section>
      </main>

      {/* Top Student Modals */}
      {activeCvStudent && <StudentCVModal student={activeCvStudent} onClose={() => setActiveCvStudent(null)} />}
      {activeInterviewStudent && (
        <InviteInterviewModal student={activeInterviewStudent} onClose={() => setActiveInterviewStudent(null)} />
      )}
      {activeReportStudent && (
        <StudentReportCardModal student={activeReportStudent} onClose={() => setActiveReportStudent(null)} />
      )}
    </div>
  );
};

/* ------------------------------------------------------------------
 * Scoped styles (`.lp-root`) matching the Resq.io visual reference
 * ------------------------------------------------------------------ */
const LP_CSS = `
.lp-root { --ease: cubic-bezier(.2,.75,.2,1); --indigo: #4F46E5; }

/* Smooth section depth scaling */
.lp-root .lp-sec { transform: scale(var(--sec-scale, 1)); transition: transform .25s ease-out; will-change: transform; }

/* ---- Reveal system ---- */
.lp-root [data-reveal] { opacity: 0; transform: translateY(38px); filter: blur(8px);
  transition: opacity .9s var(--ease), transform 1s var(--ease), filter .9s var(--ease); }
.lp-root [data-reveal].is-in { opacity: 1; transform: none; filter: none; }
.lp-root [data-reveal="chart"] { opacity: 1; transform: none; filter: none; }

/* Masked word rise */
.lp-root .lp-word { display: inline-block; overflow: hidden; vertical-align: top; padding-bottom: .08em; }
.lp-root .lp-word > span { display: inline-block; transform: translateY(112%); transition: transform .95s var(--ease); }
.lp-root .is-in .lp-word > span { transform: none; }

/* Fade & pop children */
.lp-root .lp-fade { opacity: 0; transform: translateY(16px); transition: opacity .8s var(--ease), transform .8s var(--ease); }
.lp-root .is-in .lp-fade, .lp-root .lp-fade.is-in { opacity: 1; transform: none; }
.lp-root .lp-pop { opacity: 0; translate: 0 28px; scale: .95; transition: opacity .85s var(--ease), translate .9s var(--ease), scale .9s var(--ease), border-color .3s, box-shadow .3s; }
.lp-root .is-in .lp-pop { opacity: 1; translate: 0 0; scale: 1; }

.lp-root .lp-grad-text > .lp-word > span {
  background: linear-gradient(95deg, #818CF8 0%, #A5B4FC 55%, #E0E7FF 100%);
  -webkit-background-clip: text; background-clip: text; color: transparent;
}

/* ---- Floating Glass Pill Nav ---- */
.lp-root .lp-nav {
  width: 100%; max-width: 62rem; display: flex; align-items: center; justify-content: space-between;
  padding: .5rem .55rem .5rem 1.4rem; border-radius: 999px;
  background: linear-gradient(90deg, rgba(24,26,38,.72), rgba(45,48,72,.52) 35%, rgba(20,22,32,.72));
  border: 1px solid rgba(255,255,255,.14); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.12), 0 14px 45px rgba(0,0,0,.6);
}
.lp-root .lp-icon-btn {
  width: 1.75rem; height: 1.75rem; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1); color: #cbd5e1;
}
.lp-root .lp-btn-nav {
  padding: .45rem 1.25rem; border-radius: 999px; font-size: .75rem; font-weight: 500; color: #fff;
  background: linear-gradient(180deg, #6366F1, #4F46E5); border: 1px solid rgba(255,255,255,.22);
  box-shadow: 0 0 22px rgba(79,70,229,.55), inset 0 1px 0 rgba(255,255,255,.25);
  transition: transform .2s, box-shadow .2s;
}
.lp-root .lp-btn-nav:hover { transform: translateY(-1px); box-shadow: 0 0 32px rgba(99,102,241,.8); }

/* ---- Hero Buttons (with bottom rim flare matching f_00.jpg) ---- */
.lp-root .lp-btn-primary {
  position: relative; overflow: hidden; display: inline-flex; justify-content: center; align-items: center;
  padding: .8rem 1.75rem; border-radius: 999px; font-size: .85rem; font-weight: 500; color: #fff;
  background: radial-gradient(60% 90% at 50% 105%, rgba(255,255,255,.65), rgba(129,140,248,.4) 40%, transparent 75%),
              linear-gradient(180deg, #5B5FF0 0%, #4F46E5 65%, #4338CA 100%);
  border: 1px solid rgba(199,210,254,.45);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.35), 0 6px 32px rgba(79,70,229,.6);
  transition: transform .25s var(--ease), box-shadow .25s;
}
.lp-root .lp-btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.45), 0 10px 44px rgba(99,102,241,.85);
}
.lp-root .lp-btn-ghost {
  display: inline-flex; justify-content: center; align-items: center; padding: .8rem 1.75rem; border-radius: 999px;
  font-size: .85rem; color: #e2e8f0;
  background: radial-gradient(50% 90% at 30% 105%, rgba(129,140,248,.32), rgba(15,17,28,.85) 70%);
  border: 1px solid rgba(165,180,252,.32);
  box-shadow: inset 0 0 18px rgba(99,102,241,.16), 0 0 24px rgba(79,70,229,.18);
  transition: all .25s var(--ease);
}
.lp-root .lp-btn-ghost:hover {
  border-color: rgba(199,210,254,.65);
  box-shadow: inset 0 0 24px rgba(99,102,241,.28), 0 0 32px rgba(99,102,241,.35);
}

/* ---- Volumetric Top-Left Hero Light Beams + Dashboard Corner Flare ---- */
.lp-root .lp-rays {
  position: absolute; left: -18%; top: -18%; width: 950px; height: 950px; pointer-events: none;
  background: conic-gradient(from 18deg at 12% 12%,
    transparent 0deg,
    rgba(99,102,241,.22) 14deg,
    rgba(199,210,254,.38) 24deg,
    rgba(99,102,241,.14) 34deg,
    rgba(129,140,248,.3) 46deg,
    rgba(79,70,229,.12) 58deg,
    transparent 74deg);
  filter: blur(36px); animation: lp-beam 7s ease-in-out infinite;
}
.lp-root .lp-ray-streak {
  position: absolute; left: -6%; top: -4%; width: 520px; height: 680px; pointer-events: none;
  transform-origin: top left; transform: rotate(-22deg);
  background: linear-gradient(180deg, rgba(165,180,252,.42) 0%, rgba(224,231,255,.75) 75%, transparent 100%);
  width: 90px; filter: blur(28px); opacity: .75; animation: lp-beam 7s ease-in-out infinite;
}
.lp-root .lp-corner-flare {
  position: absolute; left: 2%; top: -22px; width: 240px; height: 140px; pointer-events: none; z-index: 20;
  background: radial-gradient(ellipse at center, #FFFFFF 0%, rgba(199,210,254,.85) 28%, rgba(99,102,241,.4) 58%, transparent 78%);
  filter: blur(12px); animation: lp-beam 5s ease-in-out infinite;
}
@keyframes lp-beam { 0%,100% { opacity: .78; } 50% { opacity: 1; } }

/* ---- Dashboard Mockup ---- */
.lp-root .lp-hero-mock {
  transform-origin: center top; will-change: transform; border-radius: 22px; padding: 1.5px;
  background: linear-gradient(165deg, rgba(224,231,255,.7) 0%, rgba(129,140,248,.4) 22%, rgba(255,255,255,.07) 55%, transparent 90%);
  box-shadow: 0 -15px 90px rgba(79,70,229,.28), 0 40px 120px rgba(0,0,0,.95);
}
.lp-root .lp-dash { border-radius: 21px; padding: 1.35rem; background: linear-gradient(180deg, #151621 0%, #0B0C12 100%); }
.lp-root .lp-panel { border-radius: 14px; padding: .95rem; background: rgba(255,255,255,.032); border: 1px solid rgba(255,255,255,.07); }
.lp-root .lp-blue-card {
  border-radius: 14px; padding: .95rem;
  background: linear-gradient(165deg, #4C82FF 0%, #365CF5 55%, #2B44C8 100%);
  box-shadow: 0 0 32px rgba(59,130,246,.35);
}
.lp-root .lp-line { fill: none; stroke-width: 2; stroke-dasharray: 540; stroke-dashoffset: 540; transition: stroke-dashoffset 2.2s var(--ease) .35s; }
.lp-root .lp-line-2 { transition-delay: .65s; }
.lp-root .is-in .lp-line { stroke-dashoffset: 0; }
.lp-root .lp-chart-dot { opacity: 0; transition: opacity .5s 1.8s; }
.lp-root .is-in .lp-chart-dot { opacity: 1; }

/* ---- Marquee Strip ---- */
.lp-root .lp-marquee-mask {
  overflow: hidden;
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 14%, #000 86%, transparent);
  mask-image: linear-gradient(90deg, transparent, #000 14%, #000 86%, transparent);
}
.lp-root .lp-marquee { display: flex; gap: 4.2rem; width: max-content; animation: lp-marquee 34s linear infinite; }
.lp-root .lp-marquee:hover { animation-play-state: paused; }
@keyframes lp-marquee { to { transform: translateX(-50%); } }

/* ---- Issues Card + Hanging Tilted Tags ---- */
.lp-root .lp-issue-card {
  position: relative; display: grid; grid-template-columns: 1fr; gap: 2rem; align-items: center; overflow: hidden;
  min-height: 310px; padding: 2.5rem 1.75rem; border-radius: 24px; border: 1px solid rgba(165,180,252,.14);
  background:
    radial-gradient(1.5px 1.5px at 18% 28%, rgba(255,255,255,.45), transparent),
    radial-gradient(1.5px 1.5px at 42% 72%, rgba(255,255,255,.35), transparent),
    radial-gradient(2px 2px at 78% 22%, rgba(255,255,255,.5), transparent),
    radial-gradient(1.5px 1.5px at 88% 68%, rgba(255,255,255,.4), transparent),
    radial-gradient(110% 130% at 78% 0%, rgba(79,70,229,.42), rgba(28,27,68,.62) 48%, rgba(9,10,18,.95) 85%);
  box-shadow: 0 25px 70px rgba(0,0,0,.65);
}
@media (min-width: 768px) { .lp-root .lp-issue-card { grid-template-columns: 1fr 1.05fr; padding: 3.25rem 3.5rem; } }
.lp-root .lp-tags { position: relative; height: 290px; margin-top: -2.5rem; }
@media (min-width: 768px) { .lp-root .lp-tags { margin-top: -3.25rem; margin-bottom: -3.25rem; height: 330px; } }
.lp-root .lp-hang {
  position: absolute; top: 0; display: flex; flex-direction: column; align-items: center; transform-origin: top center;
  animation: lp-sway 5.5s ease-in-out infinite;
}
.lp-root .lp-thread { width: 1px; background: linear-gradient(to bottom, rgba(165,180,252,.1), rgba(165,180,252,.72)); }
.lp-root .lp-knot {
  width: 7px; height: 7px; border-radius: 999px; background: #E0E7FF;
  box-shadow: 0 0 10px #A5B4FC, 0 0 22px #6366F1; margin-top: -3px; z-index: 2;
}
.lp-root .lp-tag {
  margin-top: -2px; white-space: nowrap; font-size: .72rem; color: #E0E7FF; padding: .45rem .95rem; border-radius: 9px;
  transform: rotate(var(--tag-rot, 0deg));
  background: linear-gradient(180deg, rgba(32,34,68,.92), rgba(16,17,36,.95));
  border: 1px solid rgba(165,180,252,.32);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.1), 0 8px 22px rgba(0,0,0,.5);
}
.lp-root .lp-tag-hot {
  background: linear-gradient(180deg, #6D72F6, #4F46E5); border-color: rgba(224,231,255,.5); color: #fff; font-weight: 500;
  box-shadow: 0 0 28px rgba(99,102,241,.7), inset 0 1px 0 rgba(255,255,255,.35);
}
@keyframes lp-sway { 0%,100% { transform: rotate(-2deg); } 50% { transform: rotate(2deg); } }

/* ---- Platform 2x2 Grid + Orthogonal Elbow Conduits + PCB Chip ---- */
.lp-root .lp-mini-card {
  position: relative; z-index: 1; text-align: center; padding: 1.4rem 1rem; border-radius: 16px;
  background: radial-gradient(80% 60% at 50% 0%, rgba(99,102,241,.16), transparent 70%),
              linear-gradient(180deg, rgba(24,26,42,.92), rgba(11,12,20,.96));
  border: 1px solid rgba(165,180,252,.2);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.08), 0 12px 30px rgba(0,0,0,.5);
}
.lp-root .lp-mini-card:hover { border-color: rgba(165,180,252,.5); box-shadow: 0 0 28px rgba(79,70,229,.28); }
.lp-root .lp-bridge-h {
  position: absolute; left: 46%; width: 8%; height: 10px;
  background: rgba(30,33,56,.9); border-top: 1px solid rgba(165,180,252,.25); border-bottom: 1px solid rgba(165,180,252,.25);
}
.lp-root .lp-conduit-outer { fill: none; stroke: rgba(148,163,255,.22); stroke-width: 12; stroke-linecap: round; stroke-linejoin: round; }
.lp-root .lp-conduit-inner { fill: none; stroke: rgba(15,17,30,.92); stroke-width: 9; stroke-linecap: round; stroke-linejoin: round; }
.lp-root .lp-pulse {
  fill: none; stroke: #C7D2FE; stroke-width: 2.2; stroke-linecap: round; stroke-dasharray: 34 420; stroke-dashoffset: 454;
  filter: drop-shadow(0 0 8px #818CF8); animation: lp-pulse 2.8s linear infinite;
}
@keyframes lp-pulse { to { stroke-dashoffset: 0; } }

.lp-root .lp-chip-wrap { position: relative; width: 280px; height: 280px; display: flex; align-items: center; justify-content: center; }
.lp-root .lp-traces { position: absolute; inset: -16px; width: calc(100% + 32px); height: calc(100% + 32px); }
.lp-root .lp-trace-dot { animation: lp-blink 2.2s ease-in-out infinite; }
@keyframes lp-blink { 0%,100% { opacity: .35; } 50% { opacity: 1; } }
.lp-root .lp-chip {
  position: relative; width: 138px; height: 138px; border-radius: 24px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  background: radial-gradient(circle at 22% 18%, rgba(255,255,255,.45), transparent 45%),
              linear-gradient(155deg, #7C83FF 0%, #5254F1 55%, #3B38B8 100%);
  border: 2.5px solid rgba(224,231,255,.65);
  box-shadow: 0 0 0 7px rgba(255,255,255,.08), 0 0 65px rgba(99,102,241,.8), 0 0 140px rgba(79,70,229,.45), inset 0 2px 0 rgba(255,255,255,.45);
  animation: lp-chip 4s ease-in-out infinite;
}
.lp-root .lp-chip-sparkles {
  position: absolute; left: 14px; bottom: 12px; width: 42px; height: 26px;
  background-image: radial-gradient(2px 2px at 20% 60%, #fff, transparent),
                    radial-gradient(2.5px 2.5px at 55% 80%, #fff, transparent),
                    radial-gradient(1.5px 1.5px at 80% 40%, #fff, transparent),
                    radial-gradient(1.5px 1.5px at 35% 25%, #fff, transparent);
}
@keyframes lp-chip {
  0%,100% { box-shadow: 0 0 0 7px rgba(255,255,255,.08), 0 0 55px rgba(99,102,241,.65), 0 0 120px rgba(79,70,229,.38), inset 0 2px 0 rgba(255,255,255,.45); }
  50% { box-shadow: 0 0 0 9px rgba(165,180,252,.16), 0 0 85px rgba(129,140,248,.95), 0 0 175px rgba(79,70,229,.58), inset 0 2px 0 rgba(255,255,255,.45); }
}

/* ---- Bento Grid ---- */
.lp-root .lp-bento {
  position: relative; border-radius: 22px; padding: 1.75rem; border: 1px solid rgba(255,255,255,.08);
  background: linear-gradient(160deg, rgba(32,34,62,.72), rgba(10,11,18,.96) 62%);
  transition: border-color .3s, box-shadow .3s;
}
.lp-root .lp-bento:hover { border-color: rgba(165,180,252,.32); box-shadow: 0 0 42px rgba(79,70,229,.18); }
.lp-root .lp-bento-indigo {
  background: radial-gradient(80% 70% at 85% 20%, rgba(199,210,254,.35), transparent 60%),
              linear-gradient(165deg, #5B5FF0 0%, #4F46E5 50%, #3E34C2 100%);
  border-color: rgba(255,255,255,.22);
  box-shadow: 0 0 55px rgba(79,70,229,.35); min-height: 290px; overflow: hidden;
}
.lp-root .lp-sparkles {
  position: absolute; right: 10%; bottom: 10%; width: 150px; height: 80px; pointer-events: none;
  background-image:
    radial-gradient(2.5px 2.5px at 12% 35%, #fff, transparent),
    radial-gradient(1.8px 1.8px at 36% 72%, #fff, transparent),
    radial-gradient(3px 3px at 66% 42%, #fff, transparent),
    radial-gradient(1.8px 1.8px at 84% 78%, #fff, transparent),
    radial-gradient(2.2px 2.2px at 28% 86%, #fff, transparent),
    radial-gradient(2px 2px at 58% 18%, #fff, transparent),
    radial-gradient(1.5px 1.5px at 92% 28%, #fff, transparent);
  animation: lp-blink 3s ease-in-out infinite;
}
.lp-root .lp-bento-tilt {
  position: absolute; left: 6%; top: 10%; width: 118%; transform-origin: center; will-change: transform;
  border-radius: 22px; padding: 1.5px;
  background: linear-gradient(180deg, rgba(199,210,254,.65), rgba(255,255,255,.04));
  box-shadow: -20px -20px 65px rgba(79,70,229,.28);
}
.lp-root .lp-feed-card {
  padding: .75rem .9rem; border-radius: 14px;
  background: rgba(17,18,28,.92); border: 1px solid rgba(255,255,255,.09);
  box-shadow: 0 12px 28px rgba(0,0,0,.5);
}
.lp-root .lp-student {
  display: flex; align-items: center; gap: .65rem; padding: .55rem .7rem; border-radius: 11px;
  background: rgba(255,255,255,.035); border: 1px solid rgba(255,255,255,.07);
  transition: border-color .2s, background .2s;
}
.lp-root .lp-student:hover { border-color: rgba(165,180,252,.45); background: rgba(79,70,229,.15); }

/* ---- Foundation 2-over-3 Tilted Cards ---- */
.lp-root .lp-foundation { display: grid; grid-template-columns: 1fr; gap: 1rem; }
@media (min-width: 640px) { .lp-root .lp-foundation { grid-template-columns: 1fr 1fr; } }
@media (min-width: 768px) { .lp-root .lp-foundation { display: flex; flex-wrap: wrap; justify-content: center; gap: 0; } }
.lp-root .lp-found-card {
  position: relative; text-align: center; padding: 1.65rem 1.35rem; border-radius: 20px; will-change: transform;
  background: linear-gradient(180deg, rgba(38,40,64,.95), rgba(20,21,34,.96));
  border: 1px solid rgba(165,180,252,.18);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.08), 0 24px 48px rgba(0,0,0,.55);
}
.lp-root .lp-found-card:hover { border-color: rgba(199,210,254,.45); }
@media (min-width: 768px) {
  .lp-root .lp-found-card { width: 238px; margin: -.4rem .45rem; }
  .lp-root .lp-found-card:nth-child(1), .lp-root .lp-found-card:nth-child(2) { margin-bottom: .75rem; order: 0; }
  .lp-root .lp-foundation::after { content: ''; flex-basis: 100%; order: 1; }
  .lp-root .lp-found-card:nth-child(n+3) { order: 2; }
}
.lp-root .lp-found-featured {
  background: linear-gradient(170deg, #5B5FF0 0%, #4F46E5 55%, #3E34C2 100%);
  border-color: rgba(255,255,255,.28);
  box-shadow: 0 0 48px rgba(79,70,229,.45), 0 24px 48px rgba(0,0,0,.55);
}
.lp-root .lp-glossy-icon { position: relative; width: 58px; height: 58px; margin: 0 auto; }
.lp-root .lp-glossy-back {
  position: absolute; right: -5px; top: -5px; width: 46px; height: 46px; border-radius: 13px;
  background: linear-gradient(155deg, rgba(224,231,255,.92), rgba(129,140,248,.62));
  transform: rotate(10deg);
}
.lp-root .lp-glossy-front {
  position: absolute; left: 0; bottom: 0; width: 46px; height: 46px; border-radius: 13px;
  display: flex; align-items: center; justify-content: center;
  background: radial-gradient(circle at 25% 20%, rgba(255,255,255,.28), transparent 50%),
              linear-gradient(160deg, #3D4074, #1C1D3A);
  border: 1px solid rgba(255,255,255,.28);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.4), 0 8px 18px rgba(0,0,0,.45);
}

/* ---- Final CTA Spotlight + Hero Pill Button ---- */
.lp-root .lp-btn-hero {
  position: relative; overflow: hidden; padding: 1.1rem 2.8rem; border-radius: 999px; font-size: 1.05rem; font-weight: 500; color: #fff;
  background: radial-gradient(55% 95% at 50% 108%, rgba(255,255,255,.8), rgba(165,180,252,.45) 42%, transparent 75%),
              linear-gradient(180deg, #6366F1 0%, #4F46E5 60%, #4338CA 100%);
  border: 2px solid rgba(224,231,255,.55);
  box-shadow: 0 0 0 7px rgba(255,255,255,.1), 0 0 65px rgba(99,102,241,.85), inset 0 2px 0 rgba(255,255,255,.4);
  transition: transform .3s var(--ease), box-shadow .3s;
}
.lp-root .lp-btn-hero:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 0 0 9px rgba(255,255,255,.14), 0 0 95px rgba(129,140,248,1), inset 0 2px 0 rgba(255,255,255,.5);
}
.lp-root .lp-btn-sparkles {
  position: absolute; inset: 0; pointer-events: none;
  background-image:
    radial-gradient(2px 2px at 28% 82%, #fff, transparent),
    radial-gradient(2.5px 2.5px at 46% 76%, #fff, transparent),
    radial-gradient(2px 2px at 54% 86%, #fff, transparent),
    radial-gradient(2px 2px at 68% 78%, #fff, transparent);
}
.lp-root .lp-spot-rays {
  position: absolute; left: 50%; bottom: -8%; width: min(1000px, 150vw); height: 95%; transform: translateX(-50%); pointer-events: none;
  background: conic-gradient(from 325deg at 50% 42%,
    transparent 0deg,
    rgba(99,102,241,.22) 15deg,
    transparent 28deg,
    rgba(165,180,252,.38) 35deg,
    rgba(99,102,241,.22) 44deg,
    transparent 58deg,
    rgba(99,102,241,.2) 65deg,
    transparent 75deg);
  filter: blur(26px);
}
.lp-root .lp-spot {
  position: absolute; left: 50%; bottom: -10%; width: min(900px, 140vw); height: 115%; transform: translateX(-50%);
  background: radial-gradient(50% 58% at 50% 68%, rgba(79,70,229,.48), rgba(49,46,129,.25) 48%, transparent 75%);
  pointer-events: none;
}
.lp-root .lp-spot-core {
  position: absolute; left: 50%; bottom: 0; width: 220px; height: 76%; transform: translateX(-50%);
  background: linear-gradient(to top, rgba(238,242,255,.92), rgba(165,180,252,.58) 42%, rgba(99,102,241,.22) 78%, transparent);
  filter: blur(28px); pointer-events: none; animation: lp-beam 6s ease-in-out infinite;
}

/* ---- Reduced Motion ---- */
@media (prefers-reduced-motion: reduce) {
  .lp-root [data-reveal], .lp-root .lp-fade, .lp-root .lp-pop, .lp-root .lp-word > span, .lp-root .lp-sec {
    opacity: 1 !important; transform: none !important; translate: none !important; scale: none !important; filter: none !important; transition: none !important;
  }
  .lp-root .lp-line { stroke-dashoffset: 0; transition: none; }
  .lp-root .lp-chart-dot { opacity: 1; }
  .lp-root .lp-marquee, .lp-root .lp-hang, .lp-root .lp-pulse, .lp-root .lp-chip, .lp-root .lp-rays, .lp-root .lp-ray-streak,
  .lp-root .lp-corner-flare, .lp-root .lp-spot-core, .lp-root .lp-trace-dot, .lp-root .lp-sparkles { animation: none !important; }
  .lp-root .lp-hero-mock, .lp-root .lp-bento-tilt { transform: none !important; }
}
`;

export default LandingPage;
