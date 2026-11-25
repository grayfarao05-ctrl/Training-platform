import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowRight,
  MessageCircle,
  Cpu,
  Network,
  Briefcase,
  Bot,
  Gamepad2,
  Terminal,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  Layers,
  Sparkles,
  Award,
  Zap,
  Users,
  Clock,
  Laptop,
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
import { SplineHero } from './SplineHero';

interface LandingPageProps {
  userName?: string;
  onEnter: () => void;
  onLogin?: () => void;
  onRegister?: () => void;
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
}

const WHATSAPP_NUMBER = '27720000000';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  'Hi ITreal, I would like to learn more about your CompTIA A+, Network+ and career readiness courses.'
)}`;

/* =========================================================================
   1. B11 MANDATORY TAGLINE REVEAL SECTION
   Words start at 28% opacity and transition individually on scroll
   ========================================================================= */
const TaglineReveal: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeWordCount, setActiveWordCount] = useState(0);

  const taglineWords = [
    'Real',
    'knowledge',
    'for',
    'real',
    'careers.',
    'Practical',
    'interactive',
    'drills',
    'replacing',
    'passive',
    'textbook',
    'memorization.',
  ];

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setActiveWordCount(taglineWords.length);
      return;
    }

    const handleScroll = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const start = vh * 0.85;
      const end = vh * 0.35;

      if (rect.top > start) {
        setActiveWordCount(0);
      } else if (rect.top < end) {
        setActiveWordCount(taglineWords.length);
      } else {
        const progress = (start - rect.top) / (start - end);
        const count = Math.min(taglineWords.length, Math.floor(progress * taglineWords.length));
        setActiveWordCount(count);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [taglineWords.length]);

  return (
    <section className="bg-[#000000] py-20 px-4 border-y border-[#272727]">
      <div ref={containerRef} className="max-w-[680px] mx-auto text-center">
        <p className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight leading-[1.25] text-balance">
          {taglineWords.map((word, idx) => (
            <span
              key={idx}
              className="inline-block mr-2.5 transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{
                color: idx < activeWordCount ? '#FFFFFF' : 'rgba(255, 255, 255, 0.28)',
              }}
            >
              {word}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
};

/* =========================================================================
   2. FAQ DATA (B1 & A2 compliant: 8 realistic objection-handling items)
   ========================================================================= */
const FAQS = [
  {
    q: 'How does ITreal prepare me for official CompTIA exams?',
    a: 'Every module maps directly to the official CompTIA A+ (220-1101 & 220-1102) and Network+ (N10-008 & N10-009) exam objectives. You practice with interactive motherboard assembly, terminal CLI scenarios, and timed mock tests replicating actual exam conditions.',
  },
  {
    q: 'Do I need a high-end computer to run the arcade and 3D labs?',
    a: 'No. All interactive drills and WebGL simulations run entirely inside standard modern web browsers on standard laptops and office desktops without any heavy local software installation.',
  },
  {
    q: 'Can I study on my mobile phone when travelling?',
    a: 'Yes. The portal, knowledge summaries, acronym attack drills, and flashcards are optimized for mobile screens and low data usage so you can study anytime.',
  },
  {
    q: 'How is this different from reading a certification textbook?',
    a: 'Textbooks describe hardware and commands passively. ITreal places you inside terminal sandboxes, cable wiring exercises, and diagnostic puzzles so you build concrete problem-solving habits that employers test for.',
  },
  {
    q: 'What is included in the free tier?',
    a: 'Free access includes Core 1 hardware diagnostic drills, initial mock tests, the Subnet Speed-Run arcade lab, and CV clinic foundations with no credit card required.',
  },
  {
    q: 'Are the talent pool and report cards recognized by employers?',
    a: 'Yes. When you score above 85% on verified domain mocks, you unlock a shareable skill dossier showing verified accuracy, streak consistency, and completed lab exercises.',
  },
  {
    q: 'How much time do I need to invest each week?',
    a: 'Most learners studying 4 to 6 hours per week complete Core 1 in 6 weeks and Core 2 in another 6 weeks while working or attending school.',
  },
  {
    q: 'Can I get help if I get stuck on a difficult subnetting problem?',
    a: 'Yes. You have access to detailed step-by-step diagnostic breakdowns for every question and direct WhatsApp support with technical mentors.',
  },
];

/* =========================================================================
   3. COURSE TRACKS
   ========================================================================= */
const COURSE_TRACKS = [
  {
    id: 'a-plus',
    title: 'CompTIA A+ Mastery',
    code: 'Core 1 (220-1101) & Core 2 (220-1102)',
    description:
      'Nine comprehensive domains covering mobile devices, networking hardware, virtualization, cloud computing, operating systems, security, and systematic troubleshooting.',
    Icon: Cpu,
    badge: 'Flagship certification',
    domains: ['Mobile Devices', 'Networking Tech', 'Hardware', 'Virtualization', 'Operating Systems', 'Security Procedures'],
  },
  {
    id: 'network-plus',
    title: 'CompTIA Network+',
    code: 'N10-008 & N10-009',
    description:
      'Enterprise networking principles including CIDR subnetting, VLAN segmentation, routing protocols, wireless standards, and defense in depth network hardening.',
    Icon: Network,
    badge: 'Core networking',
    domains: ['Networking Fundamentals', 'Network Implementations', 'Network Operations', 'Network Security', 'Troubleshooting'],
  },
  {
    id: 'ai-work',
    title: 'Beyond the Chatbot',
    code: 'Applied Workplace AI',
    description:
      'Practical role-task-rule prompting, PDF spreadsheet extraction, customer communications, and POPIA compliant workplace automation.',
    Icon: Bot,
    badge: 'Practical skills',
    domains: ['Structured Prompting', 'Data Extraction', 'Process Automation', 'Compliance & Ethics'],
  },
  {
    id: 'career',
    title: 'Matric to Money',
    code: 'Professional Career Launchpad',
    description:
      'South African ATS resume formatting, technical interview etiquette, BCEA contract rights verification, and workplace financial fundamentals.',
    Icon: Briefcase,
    badge: 'Career readiness',
    domains: ['ATS CV Optimization', 'Technical Interviews', 'BCEA Rights', 'Workplace Professionalism'],
  },
];

/* =========================================================================
   4. INTERACTIVE ARCADE LABS
   ========================================================================= */
const ARCADE_GAMES = [
  {
    name: 'Subnet Speed-Run',
    category: 'Network calculations',
    desc: 'Calculate slash notation, broadcast addresses, and usable host ranges against the clock.',
    Icon: Zap,
  },
  {
    name: 'CLI Challenge',
    category: 'Terminal proficiency',
    desc: 'Execute real Windows and Linux diagnostic commands: ping, traceroute, netstat, and chmod.',
    Icon: Terminal,
  },
  {
    name: 'Motherboard Puzzle',
    category: 'Hardware anatomy',
    desc: 'Identify socket types, RAM channels, PCIe slots, and front panel headers on full schematics.',
    Icon: Layers,
  },
  {
    name: 'Acronym Attack',
    category: 'Exam terminology',
    desc: 'Match over 200 technical CompTIA acronyms to their definitions under rapid fire timing.',
    Icon: ShieldCheck,
  },
];

/* =========================================================================
   MAIN COMPONENT: LANDING PAGE
   Strictly complies with design _land.md Part A (strategy) & Part B (visual)
   ========================================================================= */
export const LandingPage: React.FC<LandingPageProps> = ({
  userName,
  onEnter,
  onLogin,
  onRegister,
  onOpenPrivacy,
  onOpenTerms,
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const heroMockRef = useRef<HTMLDivElement>(null);

  const [reviews, setReviews] = useState<ReviewItem[]>(DEFAULT_REVIEWS);
  const [topStudents, setTopStudents] = useState<TopStudentItem[]>(DEFAULT_TOP_STUDENTS);
  const [settings, setSettings] = useState<LandingSettings>(DEFAULT_LANDING_SETTINGS);

  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [activeCvStudent, setActiveCvStudent] = useState<TopStudentItem | null>(null);
  const [activeInterviewStudent, setActiveInterviewStudent] = useState<TopStudentItem | null>(null);
  const [activeReportStudent, setActiveReportStudent] = useState<TopStudentItem | null>(null);

  const handleStartAuth = () => (onLogin ? onLogin() : onEnter());
  const handleRegister = () => (onRegister ? onRegister() : handleStartAuth());

  const lead = topStudents.find((s) => s.consentGiven) || DEFAULT_TOP_STUDENTS[0];
  const publicStudents = topStudents
    .filter((s) => s.consentGiven)
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 3);

  /* Subscribe to live Firestore collections */
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

  /* IntersectionObserver for B7 scroll reveals (runs once per section) */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      root.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement;
            target.style.opacity = '1';
            target.style.transform = 'translateY(0)';
            observer.unobserve(target);
          }
        });
      },
      { threshold: 0.12 }
    );

    root.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(32px)';
      el.style.transition = 'opacity 700ms cubic-bezier(0.22, 1, 0.36, 1), transform 700ms cubic-bezier(0.22, 1, 0.36, 1)';
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={rootRef} className="min-h-screen bg-[#000000] text-[#FFFFFF] font-sans antialiased selection:bg-[#313131] selection:text-white">
      {/* =====================================================================
          HEADER / FLOATING NAVIGATION BAR (B7 Compliant)
          Floating compact bar off top edge, translucent surface, background blur
          ===================================================================== */}
      <header className="fixed top-4 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
        <nav
          className="pointer-events-auto flex items-center justify-between gap-4 px-4 py-2 rounded-full bg-[#181818]/90 border border-[#272727] backdrop-blur-md shadow-2xl max-w-4xl w-full"
          aria-label="Main Navigation"
        >
          {/* Logo */}
          <a href="#top" className="flex items-center gap-2.5 text-white focus-visible:ring-2 focus-visible:ring-white rounded-md">
            <img src="/assets/itreal-icon.png" alt="ITreal" className="w-5 h-5 object-contain" />
            <span className="font-semibold text-sm tracking-tight">ITreal</span>
          </a>

          {/* Links */}
          <div className="hidden md:flex items-center gap-6 text-sm text-[#9B9B9B]">
            <a href="#courses" className="hover:text-white transition-colors duration-300">
              Courses
            </a>
            <a href="#arcade" className="hover:text-white transition-colors duration-300">
              Arcade
            </a>
            <a href="#how-it-works" className="hover:text-white transition-colors duration-300">
              How it works
            </a>
            <a href="#talent" className="hover:text-white transition-colors duration-300">
              Top students
            </a>
            <a href="#faq" className="hover:text-white transition-colors duration-300">
              FAQ
            </a>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full text-emerald-400 hover:bg-[#272727] transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-emerald-400"
              aria-label="WhatsApp ITreal"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
            <button
              onClick={handleStartAuth}
              className="py-1.5 px-3.5 rounded-full text-xs font-semibold bg-[#272727] text-white hover:bg-[#313131] active:scale-[0.98] transition-all duration-300 focus-visible:ring-2 focus-visible:ring-white"
            >
              {userName ? 'Portal' : 'Log in'}
            </button>
            <button
              onClick={handleRegister}
              className="py-1.5 px-4 rounded-full text-xs font-semibold bg-white text-black hover:bg-[#E5E5E5] active:scale-[0.98] transition-all duration-300 focus-visible:ring-2 focus-visible:ring-white"
            >
              Start free
            </button>
          </div>
        </nav>
      </header>

      <main>
        {/* =====================================================================
            1. HERO SECTION (B5 & A2 Compliant)
            Heading with #FFFFFF -> #9B9B9B gradient, max 680px, left aligned,
            Spline 3D robot on the right, integrated interactive preview
            ===================================================================== */}
        <section id="top" className="relative pt-32 md:pt-40 pb-16 px-4 bg-[#000000] overflow-hidden">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center" data-reveal>
              {/* Left Column: Heading, Subheading, Primary CTA & Proof */}
              <div className="lg:col-span-7 text-center lg:text-left z-10">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.08] text-balance max-w-[680px] mx-auto lg:mx-0">
                  <span className="bg-gradient-to-r from-[#FFFFFF] to-[#9B9B9B] bg-clip-text text-transparent">
                    Master IT fast
                  </span>{' '}
                  <span>when exams and careers call</span>
                </h1>

                <p className="mt-4 text-base sm:text-lg text-[#9B9B9B] max-w-[680px] mx-auto lg:mx-0 leading-relaxed text-pretty">
                  Comprehensive CompTIA A+, Network+, practical workplace AI, and career readiness training designed for South African learners.
                </p>

                {/* Primary CTA button (8px vertical, 16px horizontal per B2) */}
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                  <button
                    onClick={handleRegister}
                    className="w-full sm:w-auto py-2.5 px-6 rounded-lg text-base font-semibold bg-white text-black hover:bg-[#E5E5E5] active:scale-[0.98] transition-all duration-300 focus-visible:ring-2 focus-visible:ring-white flex items-center justify-center gap-2"
                  >
                    <span>Start learning free</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <a
                    href="#courses"
                    className="w-full sm:w-auto py-2.5 px-5 rounded-lg text-base font-semibold bg-[#181818] border border-[#272727] text-white hover:bg-[#272727] active:scale-[0.98] transition-all duration-300 focus-visible:ring-2 focus-visible:ring-white text-center"
                  >
                    Explore tracks
                  </a>
                </div>

                {/* Proof signal */}
                <div className="mt-6 flex items-center justify-center lg:justify-start gap-4 text-xs text-[#9B9B9B]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>240 active learners</span>
                  </div>
                  <span>·</span>
                  <span>38 verified mocks passed</span>
                  <span>·</span>
                  <span>No credit card required</span>
                </div>
              </div>

              {/* Right Column: Interactive 3D Spline Asset */}
              <div className="lg:col-span-5 flex items-center justify-center z-0">
                <SplineHero sceneUrl="https://prod.spline.design/IZy0m-pY1RzYoPyF/scene.splinecode" />
              </div>
            </div>

            {/* Dashboard Preview Tile (tucked seamlessly below hero) */}
            <div className="mt-6 max-w-5xl mx-auto rounded-2xl bg-[#181818] border border-[#272727] p-5 sm:p-6 shadow-2xl" data-reveal>
              <div className="flex items-center justify-between pb-4 border-b border-[#272727]">
                <div className="flex items-center gap-2.5">
                  <img src="/assets/itreal-icon.png" alt="ITreal" className="w-4 h-4 object-contain" />
                  <span className="text-sm font-semibold text-white">ITreal student overview</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#9B9B9B]">
                  <span className="px-2.5 py-1 rounded bg-[#272727] text-white font-medium">Core 1 72%</span>
                  <span className="px-2.5 py-1 rounded bg-[#272727] text-white font-medium">Core 2 58%</span>
                  <span className="hidden sm:inline px-2.5 py-1 rounded bg-[#272727] text-white font-medium">Network+ 40%</span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-lg bg-[#1F1F1F] border border-[#272727]">
                  <span className="text-xs text-[#9B9B9B]">Hardware mastery</span>
                  <p className="text-xl font-semibold text-white mt-0.5">98%</p>
                  <span className="text-[11px] text-emerald-400">14 arcade drills cleared</span>
                </div>
                <div className="p-3.5 rounded-lg bg-[#1F1F1F] border border-[#272727]">
                  <span className="text-xs text-[#9B9B9B]">Networking domain</span>
                  <p className="text-xl font-semibold text-white mt-0.5">91%</p>
                  <span className="text-[11px] text-emerald-400">Subnetting exam ready</span>
                </div>
                <div className="p-3.5 rounded-lg bg-[#1F1F1F] border border-[#272727]">
                  <span className="text-xs text-[#9B9B9B]">Active study streak</span>
                  <p className="text-xl font-semibold text-white mt-0.5">25 days</p>
                  <span className="text-[11px] text-indigo-400">Consistent diagnostic pace</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            2. B11 MANDATORY TAGLINE REVEAL SECTION
            ===================================================================== */}
        <TaglineReveal />

        {/* =====================================================================
            3. PROBLEM TO SOLUTION (A2 Mid Page Argument)
            ===================================================================== */}
        <section className="py-20 px-4 bg-[#000000]">
          <div className="max-w-4xl mx-auto" data-reveal>
            <div className="text-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#9B9B9B]">The certification gap</span>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white mt-2 text-balance">
                Memorizing questions is why candidates fail exam day
              </h2>
              <p className="mt-3 text-base text-[#9B9B9B] max-w-[640px] mx-auto text-pretty">
                Official CompTIA exams test situational troubleshooting, cable pinouts, command lines, and network topologies. Static PDFs cannot build operational reflexes.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 rounded-2xl bg-[#181818] border border-[#272727]">
                <span className="text-xs font-semibold text-rose-400 uppercase tracking-wide">Traditional training</span>
                <h3 className="text-lg font-semibold text-white mt-2">Passive reading and question dumps</h3>
                <ul className="mt-4 space-y-2.5 text-sm text-[#9B9B9B]">
                  <li className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold">×</span>
                    <span>No real terminal command experience</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold">×</span>
                    <span>Confusing textbook subnetting charts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold">×</span>
                    <span>Panic on interactive PBQ exam questions</span>
                  </li>
                </ul>
              </div>

              <div className="p-6 rounded-2xl bg-[#181818] border border-[#313131]">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">The ITreal way</span>
                <h3 className="text-lg font-semibold text-white mt-2">Interactive diagnostic labs and drills</h3>
                <ul className="mt-4 space-y-2.5 text-sm text-[#9B9B9B]">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>Realistic terminal CLI command sandboxes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>Interactive speed-run subnet calculations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>3D hardware inspection before you sit the exam</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            4. OUTCOME DRIVEN BENEFITS (A2 & A5 Compliant)
            ===================================================================== */}
        <section className="py-20 px-4 bg-[#181818] border-t border-[#272727]">
          <div className="max-w-5xl mx-auto" data-reveal>
            <div className="text-center max-w-[680px] mx-auto">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#9B9B9B]">Outcome driven training</span>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white mt-2 text-balance">
                Built to get you certified and hired
              </h2>
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-6 rounded-2xl bg-[#1F1F1F] border border-[#272727]">
                <div className="w-10 h-10 rounded-lg bg-[#272727] flex items-center justify-center text-white">
                  <Terminal className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-white mt-4">Hands on diagnostic drills</h3>
                <p className="mt-2 text-sm text-[#9B9B9B] leading-relaxed">
                  Solve real operating system errors, network timeouts, and hardware faults in simulated environments instead of reading static theory.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#1F1F1F] border border-[#272727]">
                <div className="w-10 h-10 rounded-lg bg-[#272727] flex items-center justify-center text-white">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-white mt-4">Exam verified curriculum</h3>
                <p className="mt-2 text-sm text-[#9B9B9B] leading-relaxed">
                  Every domain corresponds directly to CompTIA A+ and Network+ specifications so you never spend hours on outdated material.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#1F1F1F] border border-[#272727]">
                <div className="w-10 h-10 rounded-lg bg-[#272727] flex items-center justify-center text-white">
                  <Briefcase className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-white mt-4">South African career launchpad</h3>
                <p className="mt-2 text-sm text-[#9B9B9B] leading-relaxed">
                  Create ATS compliant resumes, understand BCEA contract rights, and showcase verified exam scores directly to recruiting employers.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            5. HOW IT WORKS (A2: 3 steps)
            ===================================================================== */}
        <section id="how-it-works" className="py-20 px-4 bg-[#000000] border-t border-[#272727]">
          <div className="max-w-4xl mx-auto" data-reveal>
            <div className="text-center max-w-[680px] mx-auto">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#9B9B9B]">Step by step framework</span>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white mt-2 text-balance">
                Three steps from zero to certified
              </h2>
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-[#181818] border border-[#272727] relative">
                <span className="text-2xl font-bold text-[#313131]">01</span>
                <h3 className="text-base font-semibold text-white mt-2">Diagnose weak areas</h3>
                <p className="mt-2 text-sm text-[#9B9B9B] leading-relaxed">
                  Take a 10 minute domain assessment that flags your specific gaps across hardware, subnetting, and command line tools.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#181818] border border-[#272727] relative">
                <span className="text-2xl font-bold text-[#313131]">02</span>
                <h3 className="text-base font-semibold text-white mt-2">Master interactive labs</h3>
                <p className="mt-2 text-sm text-[#9B9B9B] leading-relaxed">
                  Practice with high speed arcade games, terminal simulations, and practical exercises until your domain accuracy passes 85%.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#181818] border border-[#272727] relative">
                <span className="text-2xl font-bold text-[#313131]">03</span>
                <h3 className="text-base font-semibold text-white mt-2">Clear verified mocks</h3>
                <p className="mt-2 text-sm text-[#9B9B9B] leading-relaxed">
                  Pass timed full-length mock examinations under genuine exam pressure and export your employer verified skill report.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            6. COURSE TRACKS SHOWCASE
            ===================================================================== */}
        <section id="courses" className="py-20 px-4 bg-[#181818] border-t border-[#272727]">
          <div className="max-w-5xl mx-auto" data-reveal>
            <div className="text-center max-w-[680px] mx-auto">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#9B9B9B]">Structured syllabus</span>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white mt-2 text-balance">
                Four comprehensive training tracks
              </h2>
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
              {COURSE_TRACKS.map((course) => (
                <div key={course.id} className="p-6 rounded-2xl bg-[#1F1F1F] border border-[#272727] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-lg bg-[#272727] flex items-center justify-center text-white">
                        <course.Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9B9B9B] px-2.5 py-0.5 rounded bg-[#272727]">
                        {course.badge}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-white mt-4">{course.title}</h3>
                    <span className="text-xs text-indigo-400 font-mono mt-0.5 block">{course.code}</span>
                    <p className="mt-2.5 text-sm text-[#9B9B9B] leading-relaxed">{course.description}</p>

                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {course.domains.map((dom) => (
                        <span key={dom} className="text-[11px] px-2.5 py-1 rounded bg-[#272727] text-white">
                          {dom}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#272727]">
                    <button
                      onClick={handleRegister}
                      className="text-xs font-semibold text-white hover:text-indigo-300 flex items-center gap-1.5 transition-colors duration-300"
                    >
                      <span>Start this course track</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =====================================================================
            7. INTERACTIVE ARCADE SECTION
            ===================================================================== */}
        <section id="arcade" className="py-20 px-4 bg-[#000000] border-t border-[#272727]">
          <div className="max-w-5xl mx-auto" data-reveal>
            <div className="text-center max-w-[680px] mx-auto">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#9B9B9B]">Muscle memory drills</span>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white mt-2 text-balance">
                The ITreal arcade labs
              </h2>
              <p className="mt-3 text-base text-[#9B9B9B]">
                Mini-games designed to make tough exam topics intuitive through timed repetitions.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {ARCADE_GAMES.map((game) => (
                <div key={game.name} className="p-5 rounded-2xl bg-[#181818] border border-[#272727] flex flex-col justify-between">
                  <div>
                    <div className="w-9 h-9 rounded-lg bg-[#272727] flex items-center justify-center text-white">
                      <game.Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] text-indigo-400 font-mono mt-3 block">{game.category}</span>
                    <h3 className="text-base font-semibold text-white mt-1">{game.name}</h3>
                    <p className="mt-2 text-xs text-[#9B9B9B] leading-relaxed">{game.desc}</p>
                  </div>
                  <button
                    onClick={handleRegister}
                    className="mt-5 w-full py-2 rounded-lg text-xs font-semibold bg-[#272727] text-white hover:bg-[#313131] transition-all duration-300"
                  >
                    Play lab
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =====================================================================
            8. SOCIAL PROOF & TOP STUDENTS TALENT POOL
            ===================================================================== */}
        <section id="talent" className="py-20 px-4 bg-[#181818] border-t border-[#272727]">
          <div className="max-w-5xl mx-auto" data-reveal>
            <div className="text-center max-w-[680px] mx-auto">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#9B9B9B]">Employer talent pool</span>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white mt-2 text-balance">
                Real student outcomes
              </h2>
              <p className="mt-3 text-base text-[#9B9B9B]">
                View verified report cards from learners who cleared full mock examinations.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
              {publicStudents.map((st) => (
                <div key={st.id} className="p-5 rounded-2xl bg-[#1F1F1F] border border-[#272727] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white px-2 py-0.5 rounded bg-[#272727]">
                        Rank #{st.rank}
                      </span>
                      <span className="text-xs text-emerald-400 font-mono font-medium">
                        {st.examReadiness || 94}% Readiness
                      </span>
                    </div>

                    <h3 className="text-base font-semibold text-white mt-3">
                      {st.firstName} {st.lastName}
                    </h3>
                    <span className="text-xs text-[#9B9B9B]">{st.location || 'Western Cape, South Africa'}</span>

                    <div className="mt-4 pt-3 border-t border-[#272727] space-y-1.5 text-xs text-[#9B9B9B]">
                      <div className="flex justify-between">
                        <span>Mocks cleared</span>
                        <span className="text-white font-medium">{st.mocksPassed || 12}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Study streak</span>
                        <span className="text-white font-medium">{st.streakDays || 18} days</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setActiveReportStudent(st)}
                      className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-[#272727] text-white hover:bg-[#313131] transition-all duration-300 text-center"
                    >
                      Report card
                    </button>
                    <button
                      onClick={() => setActiveInterviewStudent(st)}
                      className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-white text-black hover:bg-[#E5E5E5] transition-all duration-300 text-center"
                    >
                      Interview
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =====================================================================
            9. FAQ ACCORDION (A2 Objection Handling, 8 items)
            ===================================================================== */}
        <section id="faq" className="py-20 px-4 bg-[#000000] border-t border-[#272727]">
          <div className="max-w-3xl mx-auto" data-reveal>
            <div className="text-center max-w-[680px] mx-auto">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#9B9B9B]">Common questions</span>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white mt-2 text-balance">
                Frequently asked questions
              </h2>
            </div>

            <div className="mt-12 space-y-3">
              {FAQS.map((faq, idx) => {
                const isOpen = activeFaq === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-xl bg-[#181818] border border-[#272727] overflow-hidden transition-colors duration-300"
                  >
                    <button
                      onClick={() => setActiveFaq(isOpen ? null : idx)}
                      className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 text-white focus-visible:ring-2 focus-visible:ring-white"
                      aria-expanded={isOpen}
                    >
                      <span className="text-sm sm:text-base font-semibold">{faq.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-[#9B9B9B] transition-transform duration-300 ${
                          isOpen ? 'rotate-180 text-white' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-sm text-[#9B9B9B] leading-relaxed border-t border-[#272727] pt-3 text-pretty">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* =====================================================================
            10. FINAL CTA SECTION (A2 & A4: Identical primary CTA & risk reversal)
            ===================================================================== */}
        <section className="py-20 px-4 bg-[#181818] border-t border-[#272727] text-center">
          <div className="max-w-2xl mx-auto" data-reveal>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white text-balance">
              Start building verified IT skills today
            </h2>
            <p className="mt-3 text-base text-[#9B9B9B] text-pretty">
              Join South African students and career changers preparing for international CompTIA certification.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={handleRegister}
                className="w-full sm:w-auto py-2.5 px-6 rounded-lg text-base font-semibold bg-white text-black hover:bg-[#E5E5E5] active:scale-[0.98] transition-all duration-300 focus-visible:ring-2 focus-visible:ring-white flex items-center justify-center gap-2"
              >
                <span>Start learning free</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto py-2.5 px-5 rounded-lg text-base font-semibold bg-[#272727] border border-[#313131] text-white hover:bg-[#313131] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>WhatsApp advisor</span>
              </a>
            </div>

            <p className="mt-4 text-xs text-[#9B9B9B]">
              Free foundational access · No credit card required · Instant access
            </p>
          </div>
        </section>
      </main>

      {/* =====================================================================
          11. SEMANTIC FOOTER (B10 Ship Requirements)
          ===================================================================== */}
      <footer className="py-12 px-4 bg-[#000000] border-t border-[#272727] text-xs text-[#9B9B9B]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <img src="/assets/itreal-icon.png" alt="ITreal" className="w-4 h-4 object-contain" />
            <span className="font-semibold text-white">ITreal Tech Solutions</span>
            <span>· Moorreesburg, Western Cape</span>
          </div>

          <div className="flex flex-wrap items-center gap-5">
            <a href="#courses" className="hover:text-white transition-colors duration-300">
              Courses
            </a>
            <a href="#arcade" className="hover:text-white transition-colors duration-300">
              Arcade
            </a>
            <a href="#talent" className="hover:text-white transition-colors duration-300">
              Talent pool
            </a>
            <button
              onClick={onOpenPrivacy}
              className="hover:text-white transition-colors duration-300 underline-offset-2 hover:underline"
            >
              Privacy policy
            </button>
            <button
              onClick={onOpenTerms}
              className="hover:text-white transition-colors duration-300 underline-offset-2 hover:underline"
            >
              Terms of service
            </button>
          </div>

          <p>© 2026 ITreal Tech Solutions. All rights reserved.</p>
        </div>
      </footer>

      {/* Modals for student dossier and interview invitation */}
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

export default LandingPage;
