import React from 'react';
import { ChevronDown } from 'lucide-react';
import './HeroSection.css';

interface HeroSectionProps {
  onScrollDown?: () => void;
  onStart?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onScrollDown }) => {
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

  return (
    <section
      id="hero"
      className="relative w-full h-[calc(100vh-72px)] min-h-[520px] bg-black overflow-hidden select-none"
      aria-label="ITreal hero overview"
    >
      {/* Full-bleed looping hero video covering the entire hero section */}
      <video
        src="/assets/hero-loop.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Subtle bottom scroll cue */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10">
        <button
          type="button"
          onClick={handleScrollClick}
          className="flex flex-col items-center gap-1 px-4 py-2 rounded-full bg-black/35 hover:bg-black/55 backdrop-blur-md border border-white/15 text-white/90 hover:text-white transition-all cursor-pointer group"
          aria-label="Scroll down to courses"
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.16em]">
            View Courses
          </span>
          <ChevronDown size={18} className="animate-bounce text-[#3BA7F2]" />
        </button>
      </div>
    </section>
  );
};

export default HeroSection;
