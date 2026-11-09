import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Detect standalone mode (already installed)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    // Detect iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  // Do not render anything if already running in standalone mode
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow with beforeinstallprompt
  if (deferredPrompt) {
    return (
      <button
        type="button"
        onClick={handleInstallClick}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${className}`}
        title="Install ITreal as a Progressive Web App"
      >
        <Download size={14} className="shrink-0" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow (no beforeinstallprompt event supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--bg-card)] hover:bg-white/5 text-[var(--text-muted)] border border-[var(--border-color)] text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${className}`}
          title="Install on iPhone / iPad"
        >
          <Download size={14} className="shrink-0" />
          <span>Install App</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-6 rounded-3xl max-w-sm w-full shadow-2xl relative text-[var(--text-main)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-black uppercase tracking-tight text-[var(--text-main)]">
                  Install on iPhone / iPad
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-[var(--text-muted)] hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 text-xs text-[var(--text-muted)] leading-relaxed bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-color)]">
                <p>1. Tap the <strong>Share</strong> button (box with an arrow) in Safari toolbar.</p>
                <p>2. Scroll down and tap <strong>Add to Home Screen</strong>.</p>
                <p>3. Tap <strong>Add</strong> to launch ITreal like a native application.</p>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export default PWAInstallButton;
