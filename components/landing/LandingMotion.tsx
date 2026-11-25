import React, { useEffect, useRef, useState } from 'react';

/**
 * Lightweight drifting cyan & white starfield canvas matching the Welcome Intro aesthetic.
 * Automatically reduces particle count on mobile / low-core devices and pauses when hidden.
 */
export const StarfieldBackdrop: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const cores =
      typeof navigator !== 'undefined' && navigator.hardwareConcurrency
        ? navigator.hardwareConcurrency
        : 4;
    const isSmall = typeof window !== 'undefined' && window.innerWidth < 768;
    const count = prefersReduced ? 18 : isSmall || cores <= 4 ? 26 : 56;

    const particles = Array.from({ length: count }, (_, i) => ({
      x: ((i * 137.508) % 100) / 100,
      y: ((i * 61.803) % 100) / 100,
      r: 0.9 + ((i * 1.7) % 1.8),
      vx: (((i % 7) - 3) * 0.000018),
      vy: -0.000022 - ((i % 5) * 0.000008),
      phase: (i * 2.399) % (Math.PI * 2),
      speed: 0.6 + ((i * 0.37) % 1.4),
      isCyan: i % 2 === 0,
    }));

    let rafId = 0;
    let hidden = false;
    let lastTs = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    const onVis = () => {
      hidden = document.visibilityState === 'hidden';
      lastTs = performance.now();
    };
    document.addEventListener('visibilitychange', onVis);

    const draw = (ts: number) => {
      const dt = Math.min(50, ts - lastTs);
      lastTs = ts;

      if (!hidden) {
        const w = window.innerWidth;
        const h = window.innerHeight;
        ctx.clearRect(0, 0, w, h);

        const timeSec = ts / 1000;
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          if (!prefersReduced) {
            p.x = (p.x + p.vx * dt + 1) % 1;
            p.y = (p.y + p.vy * dt + 1) % 1;
          }
          const px = p.x * w;
          const py = p.y * h;
          const twinkle = prefersReduced
            ? 0.5
            : 0.25 + 0.65 * ((Math.sin(timeSec * p.speed + p.phase) + 1) / 2);

          const color = p.isCyan
            ? `rgba(110, 225, 255, ${twinkle * 0.75})`
            : `rgba(235, 245, 255, ${twinkle * 0.65})`;

          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(px, py, p.r, 0, Math.PI * 2);
          ctx.fill();

          // Soft halo on brighter cyan particles
          if (p.isCyan && p.r > 1.8) {
            ctx.fillStyle = `rgba(56, 189, 248, ${twinkle * 0.14})`;
            ctx.beginPath();
            ctx.arc(px, py, p.r * 3.4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      if (!prefersReduced) {
        rafId = requestAnimationFrame(draw);
      }
    };

    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 opacity-80"
    />
  );
};

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
  accent?: 'cyan' | 'emerald' | 'rose' | 'indigo';
}

const ACCENT_GLOW: Record<NonNullable<SpotlightCardProps['accent']>, { border: string; fill: string }> = {
  cyan: { border: 'rgba(56, 189, 248, 0.55)', fill: 'rgba(56, 189, 248, 0.10)' },
  emerald: { border: 'rgba(52, 211, 153, 0.55)', fill: 'rgba(52, 211, 153, 0.10)' },
  rose: { border: 'rgba(251, 113, 133, 0.50)', fill: 'rgba(251, 113, 133, 0.08)' },
  indigo: { border: 'rgba(129, 140, 248, 0.55)', fill: 'rgba(129, 140, 248, 0.10)' },
};

/**
 * Interactive card with:
 * - Cursor-tracking radial spotlight border & surface glow (desktop fine pointers only)
 * - Smooth staggered scroll-reveal entrance (IntersectionObserver)
 * - Gentle hover lift
 */
export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className = '',
  delayMs = 0,
  accent = 'cyan',
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -30px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    // Skip expensive hover tracking on touch devices
    if (window.matchMedia && !window.matchMedia('(pointer: fine)').matches) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    el.style.setProperty('--my', `${e.clientY - rect.top}px`);
  };

  const glow = ACCENT_GLOW[accent];

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      style={
        {
          transitionDelay: `${visible ? delayMs : 0}ms`,
          '--spot-border': glow.border,
          '--spot-fill': glow.fill,
        } as React.CSSProperties
      }
      className={`landing-spotlight-card group relative rounded-2xl p-[1px] transition-all duration-700 ease-out will-change-transform ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
    >
      {/* Inner card surface */}
      <div
        className={`relative z-10 h-full w-full rounded-[15px] bg-[#0b1220]/90 backdrop-blur-md border border-white/[0.07] transition-all duration-300 group-hover:border-white/[0.16] ${className}`}
      >
        {children}
      </div>
    </div>
  );
};

/**
 * Shared keyframes & spotlight border CSS injected once on the landing page.
 */
export const LandingMotionStyles: React.FC = () => (
  <style>{`
    .landing-spotlight-card {
      background: rgba(255, 255, 255, 0.06);
    }
    @media (pointer: fine) {
      .landing-spotlight-card:hover {
        transform: translateY(-5px);
        background: radial-gradient(
          340px circle at var(--mx, 50%) var(--my, 50%),
          var(--spot-border, rgba(56, 189, 248, 0.55)),
          rgba(255, 255, 255, 0.06) 55%
        );
        box-shadow: 0 18px 40px -16px rgba(0, 140, 255, 0.25);
      }
      .landing-spotlight-card::after {
        content: '';
        position: absolute;
        inset: 1px;
        border-radius: 15px;
        pointer-events: none;
        z-index: 12;
        opacity: 0;
        transition: opacity 0.3s ease;
        background: radial-gradient(
          300px circle at var(--mx, 50%) var(--my, 50%),
          var(--spot-fill, rgba(56, 189, 248, 0.10)),
          transparent 65%
        );
      }
      .landing-spotlight-card:hover::after {
        opacity: 1;
      }
    }

    @keyframes landingFloat {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-5px); }
    }
    .landing-float {
      animation: landingFloat 4.8s ease-in-out infinite;
    }
    .landing-float-slow {
      animation: landingFloat 6.4s ease-in-out infinite;
    }
    @media (prefers-reduced-motion: reduce) {
      .landing-float,
      .landing-float-slow {
        animation: none !important;
      }
    }
  `}</style>
);
