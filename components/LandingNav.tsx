import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

interface LandingNavProps {
  onLogin: () => void;
  activeSection: string;
}

export const NAV_LINKS = [
  { id: 'courses', label: 'Courses' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'about', label: 'About' },
  { id: 'top5', label: 'Top 5' },
  { id: 'contact', label: 'Contact' }
];

export const LandingNav: React.FC<LandingNavProps> = ({ onLogin, activeSection }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      window.history.replaceState(null, '', `#${id}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full h-[72px] bg-[#E8F6FF]/90 backdrop-blur-md border-b border-[#D6E6F5] transition-colors">
      <div className="max-w-[1540px] h-full mx-auto px-6 sm:px-10 flex items-center justify-between">
        {/* Left: Logo image ~120px wide */}
        <a 
          href="#hero" 
          onClick={(e) => {
            e.preventDefault();
            const heroEl = document.getElementById('hero');
            if (heroEl) {
              heroEl.scrollIntoView({ behavior: 'smooth' });
              window.history.replaceState(null, '', ' ');
            }
          }}
          className="flex items-center group cursor-pointer"
          aria-label="ITreal Home"
        >
          <img 
            src="/assets/itreal-logo.png" 
            alt="ITreal" 
            className="w-[120px] h-auto object-contain transition-transform group-hover:scale-102"
          />
        </a>

        {/* Right: Desktop Navigation Tabs & Login Button */}
        <nav className="hidden md:flex items-center gap-8" aria-label="Main Navigation">
          <div className="flex items-center gap-7">
            {NAV_LINKS.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <a
                  key={link.id}
                  href={`#${link.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection(link.id);
                  }}
                  className={`text-[15px] font-semibold transition-colors relative py-1.5 cursor-pointer ${
                    isActive 
                      ? 'text-[#0B3D91]' 
                      : 'text-[#5B6B85] hover:text-[#0B3D91]'
                  }`}
                >
                  {link.label}
                  {/* Secondary Sky Blue underline for active section */}
                  {isActive && (
                    <span 
                      className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#3BA7F2] rounded-full shadow-[0_2px_8px_rgba(59,167,242,0.5)]"
                      aria-hidden="true"
                    />
                  )}
                </a>
              );
            })}
          </div>

          {/* Log in Button: Ocean Breeze Primary Pill */}
          <button
            type="button"
            onClick={onLogin}
            className="btn-primary"
          >
            Log in
          </button>
        </nav>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-[#0A1F44] hover:text-[#0B3D91] transition-colors focus:outline-none"
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden w-full bg-[#FFFFFF]/98 backdrop-blur-xl border-b border-[#D6E6F5] px-6 py-6 flex flex-col gap-5 shadow-[0_14px_32px_rgba(11,61,145,0.18)] animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col gap-3">
            {NAV_LINKS.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => scrollToSection(link.id)}
                  className={`text-left text-[15px] font-semibold py-2.5 px-3.5 rounded-xl transition-colors flex items-center justify-between ${
                    isActive 
                      ? 'text-[#0B3D91] bg-[#CFE9FF]/50 font-bold' 
                      : 'text-[#5B6B85] hover:text-[#0B3D91] hover:bg-[#F4FAFF]'
                  }`}
                >
                  <span>{link.label}</span>
                  {isActive && <span className="w-2 h-2 rounded-full bg-[#7FE7D6] shadow-[0_0_6px_#7FE7D6]" />}
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-[#D6E6F5]">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onLogin();
              }}
              className="w-full btn-primary text-center"
            >
              Log in
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default LandingNav;
