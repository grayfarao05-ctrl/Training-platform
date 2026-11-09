import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// ==========================================
// 1. Reduced Motion & Visibility Hook + Storage
// ==========================================
const STORAGE_KEY = 'itreal_reduce_animations';

/**
 * Retrieve user's reduced-motion preference from localStorage.
 * Returns null if no preference is explicitly stored yet.
 */
export function getStoredReducedMotion(): boolean | null {
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    if (val !== null) return val === 'true';
  } catch (e) {
    // LocalStorage might be unavailable in restricted environments
  }
  return null;
}

/**
 * Persist user's reduced-motion preference and dispatch a custom event
 * to notify all active listeners across components in real-time.
 */
export function setStoredReducedMotion(reduce: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(reduce));
    window.dispatchEvent(new CustomEvent('itreal-reduced-motion-changed', { detail: reduce }));
  } catch (e) {
    // Ignore storage errors
  }
}

let sharedSystemReduced = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;
let sharedUserReduced: boolean | null = typeof window !== 'undefined' ? getStoredReducedMotion() : null;
let sharedTabVisible = typeof document !== 'undefined' ? document.visibilityState !== 'hidden' : true;

const motionSubscribers = new Set<() => void>();

function notifyMotionSubscribers() {
  motionSubscribers.forEach(cb => {
    try { cb(); } catch {}
  });
}

if (typeof window !== 'undefined') {
  try {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => {
      sharedSystemReduced = e.matches;
      notifyMotionSubscribers();
    };
    if (media.addEventListener) {
      media.addEventListener('change', handler);
    }
  } catch {}

  window.addEventListener('itreal-reduced-motion-changed', (e: Event) => {
    sharedUserReduced = (e as CustomEvent<boolean>).detail;
    notifyMotionSubscribers();
  });

  window.addEventListener('storage', (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      sharedUserReduced = e.newValue === 'true';
      notifyMotionSubscribers();
    }
  });

  document.addEventListener('visibilitychange', () => {
    sharedTabVisible = document.visibilityState !== 'hidden';
    notifyMotionSubscribers();
  });
}

/**
 * Hook providing responsive animation state:
 * - Detects OS prefers-reduced-motion media query
 * - Respects the user-selected switch in Profile
 * - Tracks document.visibilityState to pause background animations when tab is hidden
 */
export function useReducedMotionAndVisibility() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const onStoreChange = () => setTick(t => (t + 1) % 1000000);
    motionSubscribers.add(onStoreChange);
    return () => {
      motionSubscribers.delete(onStoreChange);
    };
  }, []);

  const isReducedMotion = sharedUserReduced !== null ? sharedUserReduced : sharedSystemReduced;
  const shouldAnimate = !isReducedMotion && sharedTabVisible;

  return {
    isReducedMotion,
    isTabVisible: sharedTabVisible,
    shouldAnimate
  };
}

// ==========================================
// 2. <NetworkBackdrop />
// Nodes with soft pulsing, connecting lines, 3 small packets moving along lines
// ==========================================
interface NetworkBackdropProps {
  accentColor?: string;
  className?: string;
}

export const NetworkBackdrop: React.FC<NetworkBackdropProps> = ({
  accentColor = '#06b6d4',
  className = ''
}) => {
  const { shouldAnimate, isReducedMotion } = useReducedMotionAndVisibility();

  // 6 fixed nodes across the viewBox (0 0 800 400)
  const nodes = [
    { id: 1, cx: 120, cy: 90, r: 4 },
    { id: 2, cx: 360, cy: 60, r: 3.5 },
    { id: 3, cx: 680, cy: 110, r: 4.5 },
    { id: 4, cx: 200, cy: 300, r: 3 },
    { id: 5, cx: 480, cy: 320, r: 4 },
    { id: 6, cx: 720, cy: 280, r: 3.5 }
  ];

  // 5 lines connecting node pairs
  const lines = [
    { x1: 120, y1: 90, x2: 360, y2: 60 },
    { x1: 360, y1: 60, x2: 680, y2: 110 },
    { x1: 120, y1: 90, x2: 200, y2: 300 },
    { x1: 360, y1: 60, x2: 480, y2: 320 },
    { x1: 480, y1: 320, x2: 720, y2: 280 }
  ];

  // 3 packet paths for subtle moving data
  const packets = [
    { d: 'M 120 90 L 360 60', dur: 4.5, delay: 0 },
    { d: 'M 360 60 L 680 110', dur: 5.5, delay: 1.5 },
    { d: 'M 480 320 L 720 280', dur: 4.0, delay: 0.8 }
  ];

  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 pointer-events-none overflow-hidden select-none ${className}`}
    >
      <svg
        viewBox="0 0 800 400"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full opacity-60"
      >
        <defs>
          <radialGradient id={`net-glow-${accentColor.replace('#', '')}`}>
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.4" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Static Background Lines */}
        {lines.map((l, i) => (
          <line
            key={`line-${i}`}
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            stroke={accentColor}
            strokeOpacity="0.22"
            strokeWidth="1.2"
            strokeDasharray="4 4"
          />
        ))}

        {/* 3 Moving Packets along lines */}
        {!isReducedMotion && shouldAnimate && packets.map((p, i) => (
          <path
            key={`packet-${i}`}
            d={p.d}
            fill="none"
            stroke={accentColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="8 160"
            className="transition-opacity"
            style={{
              animation: `netPacketAnim ${p.dur}s linear infinite`,
              animationDelay: `${p.delay}s`
            }}
          />
        ))}

        {/* 6 Network Nodes with gentle pulse */}
        {nodes.map((node, i) => {
          if (isReducedMotion || !shouldAnimate) {
            return (
              <g key={`node-${node.id}`}>
                <circle cx={node.cx} cy={node.cy} r={node.r * 2.2} fill={`url(#net-glow-${accentColor.replace('#', '')})`} />
                <circle cx={node.cx} cy={node.cy} r={node.r} fill={accentColor} opacity="0.8" />
              </g>
            );
          }

          return (
            <g key={`node-${node.id}`}>
              {/* Outer soft glow ring */}
              <circle
                cx={node.cx}
                cy={node.cy}
                r={node.r * 2.5}
                fill={accentColor}
                opacity="0.15"
                style={{
                  animation: `nodePulse 3.${5 + (i % 3)}s ease-in-out infinite alternate`,
                  animationDelay: `${i * 0.4}s`
                }}
              />
              {/* Center Core */}
              <circle
                cx={node.cx}
                cy={node.cy}
                r={node.r}
                fill={accentColor}
                opacity="0.85"
              />
            </g>
          );
        })}
      </svg>

      <style>{`
        @keyframes netPacketAnim {
          0% { stroke-dashoffset: 168; opacity: 0; }
          15% { opacity: 0.9; }
          85% { opacity: 0.9; }
          100% { stroke-dashoffset: 0; opacity: 0; }
        }
        @keyframes nodePulse {
          0% { transform-origin: center; opacity: 0.12; transform: scale(0.9); }
          100% { transform-origin: center; opacity: 0.35; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
};

// ==========================================
// 3. <CircuitBackdrop />
// Hardware traces with slow moving pulse for A+ or hardware tracks
// ==========================================
interface CircuitBackdropProps {
  accentColor?: string;
  className?: string;
}

export const CircuitBackdrop: React.FC<CircuitBackdropProps> = ({
  accentColor = '#3b82f6',
  className = ''
}) => {
  const { shouldAnimate, isReducedMotion } = useReducedMotionAndVisibility();

  // Geometric PCB traces: horizontal, 45 degree angle, vertical
  const traces = [
    { d: 'M 40 50 H 220 L 270 100 H 460', dur: 7, delay: 0 },
    { d: 'M 140 280 H 320 L 370 230 H 600', dur: 8.5, delay: 1.2 },
    { d: 'M 500 80 L 550 130 V 270 L 600 320 H 760', dur: 8, delay: 2.0 },
    { d: 'M 80 180 H 260 L 300 140 H 480', dur: 6.5, delay: 0.5 }
  ];

  const pads = [
    { cx: 40, cy: 50 },
    { cx: 460, cy: 100 },
    { cx: 140, cy: 280 },
    { cx: 600, cy: 230 },
    { cx: 500, cy: 80 },
    { cx: 760, cy: 320 }
  ];

  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 pointer-events-none overflow-hidden select-none ${className}`}
    >
      <svg
        viewBox="0 0 800 360"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full opacity-45"
      >
        {/* Static Base Circuit Traces */}
        {traces.map((t, idx) => (
          <path
            key={`trace-base-${idx}`}
            d={t.d}
            fill="none"
            stroke={accentColor}
            strokeWidth="1.2"
            strokeOpacity="0.2"
          />
        ))}

        {/* Slow Moving Pulse along Traces */}
        {!isReducedMotion && shouldAnimate && traces.map((t, idx) => (
          <path
            key={`trace-pulse-${idx}`}
            d={t.d}
            fill="none"
            stroke={accentColor}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeDasharray="24 380"
            style={{
              animation: `circuitPulse ${t.dur}s linear infinite`,
              animationDelay: `${t.delay}s`
            }}
          />
        ))}

        {/* Small Connection Pads */}
        {pads.map((p, idx) => (
          <g key={`pad-${idx}`}>
            <circle cx={p.cx} cy={p.cy} r="4" fill="none" stroke={accentColor} strokeWidth="1.2" strokeOpacity="0.4" />
            <circle cx={p.cx} cy={p.cy} r="1.5" fill={accentColor} fillOpacity="0.8" />
          </g>
        ))}
      </svg>

      <style>{`
        @keyframes circuitPulse {
          0% { stroke-dashoffset: 404; opacity: 0; }
          15% { opacity: 0.85; }
          85% { opacity: 0.85; }
          100% { stroke-dashoffset: 0; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

// ==========================================
// 4. <GradientDrift />
// Slow background gradient shift and ambient glow pulse (12-20s loop)
// ==========================================
interface GradientDriftProps {
  primaryColor?: string;
  secondaryColor?: string;
  durationSeconds?: number;
  className?: string;
}

export const GradientDrift: React.FC<GradientDriftProps> = ({
  primaryColor = '#4f46e5',
  secondaryColor = '#06b6d4',
  durationSeconds = 16,
  className = ''
}) => {
  const { shouldAnimate, isReducedMotion } = useReducedMotionAndVisibility();

  if (isReducedMotion || !shouldAnimate) {
    return (
      <div aria-hidden="true" className={`absolute inset-0 pointer-events-none overflow-hidden select-none ${className}`}>
        <div
          className="absolute -top-24 -left-24 w-96 h-96 rounded-full blur-[110px] opacity-20"
          style={{ backgroundColor: primaryColor }}
        />
        <div
          className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full blur-[120px] opacity-15"
          style={{ backgroundColor: secondaryColor }}
        />
      </div>
    );
  }

  return (
    <div aria-hidden="true" className={`absolute inset-0 pointer-events-none overflow-hidden select-none ${className}`}>
      {/* Primary Glow Orb */}
      <div
        className="absolute -top-24 -left-24 w-96 h-96 rounded-full blur-[110px]"
        style={{
          backgroundColor: primaryColor,
          animation: `driftOne ${durationSeconds}s ease-in-out infinite alternate`
        }}
      />
      {/* Secondary Glow Orb */}
      <div
        className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full blur-[120px]"
        style={{
          backgroundColor: secondaryColor,
          animation: `driftTwo ${durationSeconds * 1.2}s ease-in-out infinite alternate`
        }}
      />

      <style>{`
        @keyframes driftOne {
          0% {
            opacity: 0.15;
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            opacity: 0.28;
            transform: translate3d(30px, 20px, 0) scale(1.12);
          }
          100% {
            opacity: 0.18;
            transform: translate3d(-15px, 35px, 0) scale(0.95);
          }
        }
        @keyframes driftTwo {
          0% {
            opacity: 0.12;
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            opacity: 0.24;
            transform: translate3d(-35px, -20px, 0) scale(1.15);
          }
          100% {
            opacity: 0.14;
            transform: translate3d(20px, -30px, 0) scale(0.92);
          }
        }
      `}</style>
    </div>
  );
};

// ==========================================
// 5. <CountUp />
// Numeric animation over 900ms with easing, once on mount
// ==========================================
interface CountUpProps {
  value: number;
  duration?: number;
  formatter?: (val: number) => string;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export const CountUp: React.FC<CountUpProps> = ({
  value,
  duration = 900,
  formatter,
  prefix = '',
  suffix = '',
  className = ''
}) => {
  const { shouldAnimate, isReducedMotion } = useReducedMotionAndVisibility();
  const [displayValue, setDisplayValue] = useState<number>(() => {
    return isReducedMotion ? value : 0;
  });

  const frameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (isReducedMotion || !shouldAnimate) {
      setDisplayValue(value);
      return;
    }

    const startVal = 0;
    const endVal = value;
    startTimeRef.current = null;

    const step = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      // Ease out cubic: 1 - (1 - t)^3
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startVal + (endVal - startVal) * eased);
      setDisplayValue(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        setDisplayValue(endVal);
      }
    };

    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [value, duration, isReducedMotion, shouldAnimate]);

  const formatted = formatter ? formatter(displayValue) : displayValue.toLocaleString();

  return (
    <span className={className}>
      {prefix}{formatted}{suffix}
    </span>
  );
};

// ==========================================
// 6. <FillBar />
// Progress bar fills smoothly from 0 on mount
// ==========================================
interface FillBarProps {
  value: number; // 0 to 100
  max?: number;
  color?: string;
  heightClass?: string;
  className?: string;
}

export const FillBar: React.FC<FillBarProps> = ({
  value,
  max = 100,
  color,
  heightClass = 'h-2.5',
  className = ''
}) => {
  const { shouldAnimate, isReducedMotion } = useReducedMotionAndVisibility();
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={`w-full bg-[var(--border-color)]/50 rounded-full overflow-hidden ${heightClass} ${className}`}>
      {isReducedMotion || !shouldAnimate ? (
        <div
          className={`h-full rounded-full ${!color ? 'bg-cyan-500' : ''}`}
          style={{
            width: `${percentage}%`,
            backgroundColor: color || undefined
          }}
        />
      ) : (
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: percentage / 100 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className={`h-full rounded-full origin-left ${!color ? 'bg-cyan-500' : ''}`}
          style={{
            width: '100%',
            backgroundColor: color || undefined
          }}
        />
      )}
    </div>
  );
};

// ==========================================
// 7. <Stagger />
// Children fade and slide up 12px, 60ms apart, once on mount
// ==========================================
interface StaggerProps {
  children: React.ReactNode;
  staggerDelay?: number; // default 0.06 (60ms)
  className?: string;
}

export const Stagger: React.FC<StaggerProps> = ({
  children,
  staggerDelay = 0.06,
  className = ''
}) => {
  const { shouldAnimate, isReducedMotion } = useReducedMotionAndVisibility();
  const items = React.Children.toArray(children);

  if (isReducedMotion || !shouldAnimate) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={className}>
      {items.map((child, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.35,
            delay: idx * staggerDelay,
            ease: [0.2, 0, 0.2, 1]
          }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
};

// ==========================================
// 8. <XPPop />
// Floating "+N XP" that rises and fades over 1.2s
// ==========================================
interface XPPopProps {
  amount: number;
  onComplete?: () => void;
  className?: string;
}

export const XPPop: React.FC<XPPopProps> = ({
  amount,
  onComplete,
  className = ''
}) => {
  const { shouldAnimate, isReducedMotion } = useReducedMotionAndVisibility();

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.();
    }, 1200);
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (isReducedMotion || !shouldAnimate) {
    return (
      <span className={`inline-flex items-center gap-1 font-black text-amber-400 font-mono text-sm ${className}`}>
        +{amount} XP
      </span>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 0, scale: 0.8 }}
      animate={{
        opacity: [0, 1, 1, 0],
        y: -28,
        scale: [0.8, 1.15, 1, 0.9]
      }}
      transition={{
        duration: 1.2,
        times: [0, 0.15, 0.7, 1],
        ease: 'easeOut'
      }}
      className={`pointer-events-none inline-flex items-center gap-1 font-black text-amber-300 drop-shadow-[0_2px_10px_rgba(251,191,36,0.6)] font-mono text-sm z-50 ${className}`}
    >
      <span className="text-amber-400">⚡</span>
      <span>+{amount} XP</span>
    </motion.div>
  );
};

// ==========================================
// 9. <RankCelebration />
// Short 1.2s celebration (CSS-only confetti pieces, max 24), pointer-events-none
// ==========================================
interface RankCelebrationProps {
  onComplete?: () => void;
  className?: string;
}

export const RankCelebration: React.FC<RankCelebrationProps> = ({
  onComplete,
  className = ''
}) => {
  const { shouldAnimate, isReducedMotion } = useReducedMotionAndVisibility();

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.();
    }, 1200);
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (isReducedMotion || !shouldAnimate) {
    return null;
  }

  // Exactly 24 pieces (max 24)
  const confettiColors = ['#06b6d4', '#6366f1', '#f59e0b', '#10b981', '#ec4899', '#3b82f6'];
  const pieces = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    left: `${(i * 4.1 + 3) % 94}%`,
    color: confettiColors[i % confettiColors.length],
    size: 7 + (i % 4) * 2,
    delay: (i % 6) * 0.05,
    rotate: (i * 37) % 360
  }));

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 pointer-events-none overflow-hidden z-[999] select-none ${className}`}
    >
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute top-0 rounded-sm"
          style={{
            left: p.left,
            width: `${p.size}px`,
            height: `${p.size * 1.5}px`,
            backgroundColor: p.color,
            animation: 'confettiDrop 1.2s cubic-bezier(0.25, 1, 0.5, 1) forwards',
            animationDelay: `${p.delay}s`,
            transform: `rotate(${p.rotate}deg)`
          }}
        />
      ))}
      <style>{`
        @keyframes confettiDrop {
          0% {
            transform: translateY(-20px) rotate(0deg) scale(0.8);
            opacity: 1;
          }
          75% {
            opacity: 0.9;
          }
          100% {
            transform: translateY(92vh) rotate(540deg) scale(0.95);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};
