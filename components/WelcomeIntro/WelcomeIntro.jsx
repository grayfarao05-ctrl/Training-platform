import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import itrealLogo from './itrealLogo.js';
import { createIntro } from './introEngine.js';

export const WelcomeIntro = ({
  logoSrc = itrealLogo,
  studentName = '',
  href = undefined,
  onContinue = undefined,
  buttonLabel = 'Continue to the website',
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const introRef = useRef(null);
  const imageRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const lastTimeRef = useRef(null);
  const currentTimeRef = useRef(0);
  const isPausedRef = useRef(false);

  const [buttonOpacity, setButtonOpacity] = useState(0);
  const [showSkip, setShowSkip] = useState(true);

  // Initialize intro engine with the logo image
  useEffect(() => {
    let active = true;
    const img = new Image();
    img.src = logoSrc;

    const onImageReady = () => {
      if (!active) return;
      imageRef.current = img;
      introRef.current = createIntro(img, { studentName });
    };

    if (img.complete && img.naturalWidth > 0) {
      onImageReady();
    } else {
      img.onload = onImageReady;
    }

    return () => {
      active = false;
      img.onload = null;
    };
  }, [logoSrc, studentName]);

  // Jump immediately to final state
  const handleSkip = useCallback(() => {
    if (!introRef.current) return;
    currentTimeRef.current = introRef.current.end;
    setButtonOpacity(1);
    setShowSkip(false);
  }, []);

  // Main animation and resize loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Detect device capabilities
    const cores =
      typeof navigator !== 'undefined' && navigator.hardwareConcurrency
        ? navigator.hardwareConcurrency
        : 4;
    const sparkleCount = cores <= 4 ? 18 : 36;

    // Detect reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      if (introRef.current) {
        currentTimeRef.current = introRef.current.end;
      }
      setButtonOpacity(1);
      setShowSkip(false);
    }

    const render = (timestamp) => {
      if (!introRef.current) {
        animFrameIdRef.current = requestAnimationFrame(render);
        return;
      }

      if (!isPausedRef.current) {
        if (lastTimeRef.current === null) {
          lastTimeRef.current = timestamp;
        }
        // Calculate dt clamped to 0.05s
        const dt = Math.min(0.05, (timestamp - lastTimeRef.current) / 1000);
        lastTimeRef.current = timestamp;

        if (!mediaQuery.matches) {
          currentTimeRef.current += dt;
        }
      } else {
        lastTimeRef.current = timestamp;
      }

      const t = currentTimeRef.current;
      const intro = introRef.current;

      // Screen and DPR management
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      const targetPxW = Math.round(screenW * dpr);
      const targetPxH = Math.round(screenH * dpr);

      if (canvas.width !== targetPxW || canvas.height !== targetPxH) {
        canvas.width = targetPxW;
        canvas.height = targetPxH;
      }

      // Drawing setup
      ctx.save();
      ctx.scale(dpr, dpr);

      // Paint full-viewport radial background seamlessly across the entire screen
      const maxDim = Math.max(screenW, screenH);
      const bgGrad = ctx.createRadialGradient(
        screenW / 2,
        screenH * 0.44,
        maxDim * 0.04,
        screenW / 2,
        screenH * 0.44,
        maxDim * 0.72
      );
      bgGrad.addColorStop(0, '#10263b');
      bgGrad.addColorStop(0.55, '#07111d');
      bgGrad.addColorStop(1, '#03070d');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, screenW, screenH);

      // Scale = min(screen width x 0.92 / 960, screen height x 0.72 / scene height)
      // Centre it horizontally and at about 44% of the screen height, leaving room for the button
      const scale = Math.min((screenW * 0.92) / intro.w, (screenH * 0.72) / intro.h);
      const sceneScaledW = intro.w * scale;
      const sceneScaledH = intro.h * scale;
      const offsetX = (screenW - sceneScaledW) / 2;
      const offsetY = screenH * 0.44 - sceneScaledH / 2;

      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);

      const frameState = intro.draw(ctx, t, { scale, sparkleCount, skipBg: true });
      ctx.restore();

      // UI state updates
      if (frameState.buttonOpacity !== buttonOpacity) {
        setButtonOpacity(frameState.buttonOpacity);
      }
      if (!frameState.canSkip && showSkip) {
        setShowSkip(false);
      }

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    // Pause when document tab is hidden
    const handleVisibilityChange = () => {
      isPausedRef.current = document.visibilityState === 'hidden';
      if (!isPausedRef.current) {
        lastTimeRef.current = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [buttonOpacity, showSkip]);

  const buttonStyle = {
    opacity: buttonOpacity,
    pointerEvents: buttonOpacity > 0.05 ? 'auto' : 'none',
    transform: `translateY(${(1 - buttonOpacity) * 16}px)`,
    transition: 'opacity 0.5s ease-out, transform 0.5s ease-out',
  };

  const overlayContent = (
    <div
      ref={containerRef}
      className="welcome-intro-root"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100dvh',
        overflow: 'hidden',
        backgroundColor: '#03070d',
        zIndex: 2147483647,
        padding: 'env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500&display=swap');

        .welcome-sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        .welcome-skip-btn {
          position: absolute;
          top: calc(env(safe-area-inset-top, 16px) + 16px);
          right: calc(env(safe-area-inset-right, 16px) + 16px);
          z-index: 10;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.16);
          color: rgba(255, 255, 255, 0.7);
          padding: 6px 14px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          cursor: pointer;
          backdrop-filter: blur(8px);
          transition: all 0.25s ease;
        }
        .welcome-skip-btn:hover,
        .welcome-skip-btn:focus-visible {
          background: rgba(255, 255, 255, 0.16);
          color: #ffffff;
          border-color: rgba(120, 225, 255, 0.6);
          outline: 2px solid #78e1ff;
          outline-offset: 2px;
        }

        .welcome-continue-btn {
          position: absolute;
          bottom: calc(env(safe-area-inset-bottom, 24px) + 28px);
          z-index: 10;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 13px 32px;
          font-family: 'Cormorant Garamond', serif, -apple-system, sans-serif;
          font-size: 18px;
          font-weight: 500;
          letter-spacing: 0.04em;
          text-decoration: none;
          color: #ffffff;
          background: linear-gradient(135deg, rgba(20, 95, 175, 0.85), rgba(7, 45, 95, 0.95));
          border: 1px solid rgba(120, 225, 255, 0.5);
          border-radius: 9999px;
          cursor: pointer;
          box-shadow: 0 0 25px rgba(0, 150, 255, 0.35);
          backdrop-filter: blur(12px);
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
        }

        .welcome-continue-btn::before {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: 9999px;
          border: 1.5px solid rgba(120, 225, 255, 0.6);
          opacity: 0.8;
          animation: welcomeRingPulse 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          pointer-events: none;
        }

        @keyframes welcomeRingPulse {
          0% {
            transform: scale(0.98);
            opacity: 0.8;
            box-shadow: 0 0 0 0 rgba(120, 225, 255, 0.5);
          }
          50% {
            transform: scale(1.06);
            opacity: 0.15;
            box-shadow: 0 0 16px 4px rgba(120, 225, 255, 0.2);
          }
          100% {
            transform: scale(0.98);
            opacity: 0.8;
            box-shadow: 0 0 0 0 rgba(120, 225, 255, 0.5);
          }
        }

        .welcome-continue-btn:hover {
          transform: translateY(-2px) scale(1.02);
          border-color: rgba(180, 245, 255, 0.9);
          box-shadow: 0 0 35px rgba(0, 180, 255, 0.6);
        }

        .welcome-continue-btn:focus-visible {
          outline: 2px solid #ffffff;
          outline-offset: 4px;
        }
      `}</style>

      {/* Visually hidden heading for accessibility */}
      <h1 className="welcome-sr-only">
        {studentName ? `Thank you for your interest, ${studentName} — ITreal` : 'Thank you for your interest in ITreal'}
      </h1>

      {/* Interactive Skip Button */}
      {showSkip && (
        <button
          type="button"
          onClick={handleSkip}
          className="welcome-skip-btn"
          aria-label="Skip welcome animation"
        >
          Skip
        </button>
      )}

      {/* 2D Canvas for intro animation */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          touchAction: 'none',
        }}
      />

      {/* Action Button: <a> if href provided, else <button> */}
      {href ? (
        <a
          href={href}
          className="welcome-continue-btn"
          style={buttonStyle}
          tabIndex={buttonOpacity > 0.05 ? 0 : -1}
        >
          {buttonLabel}
        </a>
      ) : (
        <button
          type="button"
          onClick={onContinue}
          className="welcome-continue-btn"
          style={buttonStyle}
          tabIndex={buttonOpacity > 0.05 ? 0 : -1}
        >
          {buttonLabel}
        </button>
      )}
    </div>
  );

  if (typeof document !== 'undefined' && document.body) {
    return createPortal(overlayContent, document.body);
  }
  return overlayContent;
};

export default WelcomeIntro;
