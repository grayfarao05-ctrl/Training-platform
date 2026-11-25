import React, { useEffect, useRef, useState } from 'react';
import { Application } from '@splinetool/runtime';

interface SplineHeroProps {
  sceneUrl?: string;
  className?: string;
}

export const SplineHero: React.FC<SplineHeroProps> = ({
  sceneUrl = 'https://prod.spline.design/IZy0m-pY1RzYoPyF/scene.splinecode',
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let app: Application | null = null;
    let isMounted = true;

    if (!canvasRef.current) return;

    try {
      app = new Application(canvasRef.current);
      setIsLoading(true);
      setHasError(false);

      const targetUrl = sceneUrl.startsWith('http') ? sceneUrl : `https://${sceneUrl}`;

      app
        .load(targetUrl)
        .then(() => {
          (window as any)._splineApp = app;
          if (isMounted) {
            setIsLoading(false);
          }
        })
        .catch((err) => {
          console.warn('[SplineHero] Failed to load Spline scene:', err);
          if (isMounted) {
            setIsLoading(false);
            setHasError(true);
          }
        });
    } catch (e) {
      console.warn('[SplineHero] Error initializing Spline Application:', e);
      if (isMounted) {
        setIsLoading(false);
        setHasError(true);
      }
    }

    return () => {
      isMounted = false;
      if (app) {
        try {
          app.dispose();
        } catch {
          // Ignore cleanup errors during hot reload / unmount
        }
      }
    };
  }, [sceneUrl]);

  return (
    <div className={`relative w-full max-w-[520px] mx-auto h-[360px] sm:h-[400px] lg:h-[450px] flex items-center justify-center overflow-hidden ${className}`}>
      {/* Ambient background glow behind 3D asset */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none -z-10 flex items-center justify-center"
      >
        <div className="w-[320px] h-[320px] sm:w-[420px] sm:h-[420px] rounded-full bg-gradient-to-tr from-indigo-600/25 via-indigo-400/20 to-purple-500/10 blur-[64px]" />
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none transition-opacity duration-500">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-400/20 animate-pulse flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          </div>
          <span className="text-xs uppercase tracking-widest font-mono text-indigo-300/60">
            Rendering 3D Experience...
          </span>
        </div>
      )}

      {/* Error Fallback (soft and graceful) */}
      {hasError && !isLoading && (
        <div className="text-center p-6 rounded-2xl border border-indigo-500/20 bg-indigo-950/20 backdrop-blur-md">
          <p className="text-sm text-slate-300">Interactive 3D model unavailable</p>
          <span className="text-xs text-slate-500">Check network connection to Spline</span>
        </div>
      )}

      {/* Spline WebGL Canvas - clipped bottom 94px removes the watermark cleanly */}
      <canvas
        ref={canvasRef}
        className={`w-full h-full block transition-opacity duration-700 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        style={{
          outline: 'none',
          clipPath: 'inset(0 0 94px 0)',
        }}
      />
    </div>
  );
};
