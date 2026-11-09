import React from 'react';
import { ChevronDown, ArrowRight, Sparkles } from 'lucide-react';

interface HeroSectionProps {
  onScrollDown?: () => void;
  onStart?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onScrollDown, onStart }) => {
  const handleScrollClick = () => {
    if (onScrollDown) {
      onScrollDown();
    } else {
      const coursesEl = document.getElementById('courses');
      if (coursesEl) {
        coursesEl.scrollIntoView({ behavior: 'smooth' });
        window.history.replaceState(null, '', '#courses');
      }
    }
  };

  const marqueeItems = [
    'CompTIA A+',
    'CompTIA Network+',
    'Practical AI for Work',
    'Matric to Money',
    'MikroTik RouterOS',
    'Western Cape Careers',
    '3D Hardware Labs',
    'Action Over Theory'
  ];

  return (
    <section 
      id="hero" 
      className="relative w-full min-h-[calc(100vh-72px)] bg-[#E8F6FF] overflow-hidden flex flex-col justify-between select-none pt-12 pb-6 px-6 sm:px-10"
      aria-label="ITreal hero overview"
    >
      {/* Soft ambient sky glows in the background */}
      <div 
        className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-[#CFE9FF]/70 blur-3xl pointer-events-none -z-0"
        aria-hidden="true"
      />
      <div 
        className="absolute bottom-10 left-10 w-[450px] h-[450px] rounded-full bg-[#7FE7D6]/20 blur-3xl pointer-events-none -z-0"
        aria-hidden="true"
      />

      {/* Main Hero Content */}
      <div className="relative z-10 max-w-[1100px] mx-auto w-full flex flex-col items-center text-center my-auto py-10 space-y-6">
        {/* 1. Small label (ALL CAPS) */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#D6E6F5] shadow-[0_4px_16px_rgba(11,61,145,0.06)]">
          <span className="w-2 h-2 rounded-full bg-[#1FBF8F] animate-pulse" />
          <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#5B6B85]">
            ITreal Tech Solutions • Western Cape
          </span>
        </div>

        {/* 2. Huge hero title with kinetic letter rise & two-tone style */}
        <h1 
          className="kinetic text-5xl sm:text-7xl lg:text-8xl font-extrabold tracking-[-0.03em] leading-[0.95]"
          aria-label="Real Skills"
        >
          <span className="word mr-3 text-[#0A1F44]">
            <span className="ch" style={{ '--i': 0 } as any}>R</span>
            <span className="ch" style={{ '--i': 1 } as any}>e</span>
            <span className="ch" style={{ '--i': 2 } as any}>a</span>
            <span className="ch" style={{ '--i': 3 } as any}>l</span>
          </span>
          <span className="word text-[#8A97AD]">
            <span className="ch" style={{ '--i': 4 } as any}>S</span>
            <span className="ch" style={{ '--i': 5 } as any}>k</span>
            <span className="ch" style={{ '--i': 6 } as any}>i</span>
            <span className="ch" style={{ '--i': 7 } as any}>l</span>
            <span className="ch" style={{ '--i': 8 } as any}>l</span>
            <span className="ch" style={{ '--i': 9 } as any}>s</span>
          </span>
        </h1>

        {/* 3. Accent serif signature tagline (Instrument Serif) */}
        <p className="font-serif italic text-2xl sm:text-3xl lg:text-4xl text-[#3BA7F2] font-normal tracking-wide">
          REAL Knowledge, REAL Steps, Real Opportunities
        </p>

        {/* 4. Subtitle in Plus Jakarta Sans */}
        <p className="text-base sm:text-lg text-[#5B6B85] max-w-2xl mx-auto leading-relaxed font-normal">
          Fresh, action-first technical certifications and workplace readiness for South African youth. Master hardware, networking, and modern workplace AI on any device.
        </p>

        {/* 5. Row of Pill Tags */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-white text-[#0A1F44] border border-[#D6E6F5] shadow-xs">
            Calm & Focused
          </span>
          <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-[#CFE9FF] text-[#0A1F44]">
            100% Practical
          </span>
          <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-[#7FE7D6] text-[#0A1F44]">
            South Africa • en-ZA
          </span>
          <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-[#FFC93C] text-[#0A1F44]">
            Free Access Tracks
          </span>
        </div>

        {/* 6. Buttons in Ocean Breeze style */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <button
            type="button"
            onClick={onStart || handleScrollClick}
            className="btn-primary"
          >
            <span>Let's go</span>
            <ArrowRight size={18} />
          </button>

          <button
            type="button"
            onClick={handleScrollClick}
            className="btn-soft"
          >
            Explore Tracks
          </button>

          <button
            type="button"
            onClick={onStart || handleScrollClick}
            className="btn-dark-pill"
          >
            <Sparkles size={16} className="text-[#7FE7D6]" />
            <span>Ask AI to start</span>
          </button>
        </div>
      </div>

      {/* 7. Bottom Marquee Strip of Topics */}
      <div className="relative z-10 w-full overflow-hidden border-y border-[#D6E6F5] py-3.5 bg-white/70 backdrop-blur-md -mx-6 sm:-mx-10 px-6 sm:px-10">
        <div className="marquee gap-8 items-center text-xs sm:text-sm font-bold tracking-wider uppercase text-[#0B3D91]">
          {marqueeItems.concat(marqueeItems).map((topic, idx) => (
            <span key={idx} className="flex items-center gap-6 whitespace-nowrap">
              <span>{topic}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#3BA7F2]" aria-hidden="true" />
            </span>
          ))}
        </div>
      </div>

      {/* 8. Animated Scroll Indicator */}
      <div className="relative z-10 flex justify-center pt-4">
        <button
          type="button"
          onClick={handleScrollClick}
          className="flex flex-col items-center gap-1 text-[#5B6B85] hover:text-[#0B3D91] transition-colors cursor-pointer group"
          aria-label="Scroll down to courses"
        >
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#5B6B85] group-hover:text-[#0B3D91]">
            View Courses
          </span>
          <ChevronDown 
            size={22} 
            className="animate-bounce text-[#3BA7F2]" 
          />
        </button>
      </div>
    </section>
  );
};

export default HeroSection;
