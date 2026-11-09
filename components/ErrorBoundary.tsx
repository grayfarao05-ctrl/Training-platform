
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center p-6 text-[var(--text-main)]">
          <div className="max-w-md w-full bg-[var(--bg-card)] border border-[var(--border-color)] p-8 md:p-10 rounded-3xl shadow-xl text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500">
                <AlertTriangle className="w-8 h-8" />
              </div>
            </div>
            <h1 className="text-xl font-bold mb-2 tracking-tight">System Notice</h1>
            <p className="text-[var(--text-secondary)] text-sm mb-6 font-normal leading-relaxed">
              ITreal encountered an unexpected issue. Please reload the interface or check your network connection.
            </p>
            <div className="bg-[var(--bg-panel)] p-4 rounded-xl border border-[var(--border-color)] mb-6 text-left">
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold mb-1.5">Diagnostic Message</p>
              <p className="text-xs font-mono text-rose-500 break-words">
                {this.state.error?.message || 'Unknown system error'}
              </p>
            </div>
            <button 
              onClick={async () => {
                try {
                  if ('serviceWorker' in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    for (const reg of registrations) {
                      await reg.unregister();
                    }
                  }
                  if ('caches' in window) {
                    const cacheKeys = await caches.keys();
                    for (const key of cacheKeys) {
                      await caches.delete(key);
                    }
                  }
                } catch (e) {
                  console.error('Failed clearing caches on reload:', e);
                }
                window.location.reload();
              }}
              className="w-full py-3.5 bg-[var(--accent)] text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all hover:opacity-90 flex items-center justify-center gap-2 shadow-md shadow-[var(--accent-glow)] cursor-pointer"
            >
              <RefreshCw size={16} /> Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
