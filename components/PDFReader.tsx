import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Objective, UserStats, CourseId, ObjectivePdf } from '../types';
import { subscribeObjectivePdf } from '../objectivePdfsService';
import { storage, ref, getBytes } from '../firebase';
import { getCourseConfig } from '../courseConfig';
import { 
  ArrowLeft, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RotateCcw, 
  Loader2, 
  AlertCircle, 
  FileQuestion,
  X
} from 'lucide-react';

// Set up pdf.js worker using static asset from /public
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

interface PDFReaderProps {
  objective: Objective;
  userStats: UserStats;
  onBack: () => void;
  activeCourse?: CourseId;
}

interface PageRenderState {
  pageNumber: number;
  rendered: boolean;
  rendering: boolean;
}

export const PDFReader: React.FC<PDFReaderProps> = ({
  objective,
  userStats,
  onBack,
  activeCourse = 'a-plus'
}) => {
  const [pdfMeta, setPdfMeta] = useState<ObjectivePdf | null>(null);
  const [metaLoading, setMetaLoading] = useState(true);
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);

  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0); // Multiplier on fit-to-width

  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const renderTasks = useRef<Map<number, any>>(new Map());
  const visiblePages = useRef<Set<number>>(new Set());

  const courseConfig = getCourseConfig(activeCourse);

  // Subscribe to PDF metadata for this objective with course isolation
  useEffect(() => {
    setMetaLoading(true);
    setDocError(null);
    const course = objective.course ?? activeCourse ?? 'a-plus';
    const unsubscribe = subscribeObjectivePdf(objective.id, course, (pdf) => {
      if (pdf) {
        setPdfMeta(pdf);
        setMetaLoading(false);
      } else if (
        objective.id === '1.1' || 
        objective.id === 'a-plus_1.1' ||
        objective.title?.toLowerCase().includes('laptop') ||
        objective.title?.toLowerCase().includes('mobile')
      ) {
        // Fallback to the official uploaded CompTIA A+ Mobile Devices study PDF
        setPdfMeta({
          id: `a-plus_${objective.id}`,
          course: 'a-plus',
          objectiveId: objective.id,
          fileName: 'Mobile_Devices-small_3ddc9bc4.pdf',
          storagePath: '',
          downloadURL: '/assets/aistudio/Mobile_Devices-small_3ddc9bc4.pdf',
          sizeBytes: 4500000,
          uploadedAt: new Date().toISOString(),
          uploadedBy: 'system'
        });
        setMetaLoading(false);
      } else {
        setPdfMeta(null);
        setMetaLoading(false);
      }
    });
    return () => unsubscribe();
  }, [objective.id, objective.title, objective.course, activeCourse]);

  // Load PDF document from Storage bytes using getBytes, with seamless fallback
  const loadPdfDocument = useCallback(async () => {
    if (!pdfMeta?.storagePath && !pdfMeta?.downloadURL) return;

    setDocLoading(true);
    setDocError(null);

    try {
      let bytes: Uint8Array | ArrayBuffer | null = null;

      // 1. Primary: Load raw bytes with Firebase Storage SDK (getBytes) if storagePath exists
      if (pdfMeta.storagePath) {
        try {
          const storageRef = ref(storage, pdfMeta.storagePath);
          const getBytesPromise = getBytes(storageRef);
          const timeoutPromise = new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('getBytes timed out (likely Storage bucket CORS)')), 5000)
          );
          bytes = await Promise.race([getBytesPromise, timeoutPromise]);
        } catch (sdkError: any) {
          console.warn('Firebase Storage getBytes failed or timed out (bucket CORS). Falling back to authenticated download URL / proxy:', sdkError);
        }
      }

      // 2. Fallback: If getBytes was blocked by bucket CORS, load via downloadURL or app proxy
      if (!bytes && pdfMeta.downloadURL) {
        try {
          const directResp = await fetch(pdfMeta.downloadURL);
          if (directResp.ok) {
            bytes = await directResp.arrayBuffer();
          }
        } catch {
          // Direct fetch blocked by CORS, proceed to app proxy
        }

        if (!bytes) {
          const proxyResp = await fetch(`/api/pdf-proxy?url=${encodeURIComponent(pdfMeta.downloadURL)}`);
          if (proxyResp.ok) {
            bytes = await proxyResp.arrayBuffer();
          } else {
            throw new Error(`Failed to load PDF via proxy (${proxyResp.status})`);
          }
        }
      }

      if (!bytes) {
        throw new Error('Could not load PDF document bytes. Please verify bucket CORS or retry.');
      }

      const loadingTask = pdfjsLib.getDocument({
        data: bytes,
        cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/',
        cMapPacked: true,
      });

      const loadedDoc = await loadingTask.promise;
      setPdfDoc(loadedDoc);
      setNumPages(loadedDoc.numPages);
      setCurrentPage(1);
    } catch (err: any) {
      console.error('Failed to load PDF bytes:', err);
      setDocError(err?.message || 'Could not load PDF document. Please retry.');
    } finally {
      setDocLoading(false);
    }
  }, [pdfMeta?.storagePath, pdfMeta?.downloadURL]);

  useEffect(() => {
    if (pdfMeta) {
      loadPdfDocument();
    }
  }, [pdfMeta, loadPdfDocument]);

  // Faint diagonal watermark drawer
  const drawWatermark = useCallback((
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    dpr: number
  ) => {
    const studentName = userStats.displayName || 'Authorized Student';
    const studentEmail = userStats.email || '';
    const watermarkText = `${studentName.toUpperCase()} • ${studentEmail.toLowerCase()}`;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.rotate((-35 * Math.PI) / 180);
    ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = 'rgba(128, 128, 128, 0.12)'; // Faint subtle repeated watermark

    const stepX = 320;
    const stepY = 180;
    const maxDim = Math.max(width, height) * 2.5;

    for (let x = -maxDim; x < maxDim; x += stepX) {
      for (let y = -maxDim; y < maxDim; y += stepY) {
        ctx.fillText(watermarkText, x, y);
      }
    }
    ctx.restore();
  }, [userStats.displayName, userStats.email]);

  // Render a single page to canvas
  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfDoc) return;
    const canvas = canvasRefs.current.get(pageNum);
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Cancel existing render task for this page if ongoing
    if (renderTasks.current.has(pageNum)) {
      renderTasks.current.get(pageNum).cancel();
      renderTasks.current.delete(pageNum);
    }

    try {
      const page = await pdfDoc.getPage(pageNum);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      // Fit to container width
      const containerWidth = Math.max(container.clientWidth - 48, 300);
      const unscaledViewport = page.getViewport({ scale: 1 });
      const baseScale = (containerWidth / unscaledViewport.width) * zoomLevel;
      const viewport = page.getViewport({ scale: baseScale });

      // Match canvas internal resolution to dpr for crisp rendering
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) return;

      const renderContext = {
        canvasContext: ctx,
        viewport: page.getViewport({ scale: baseScale * dpr }),
        intent: 'display'
      };

      const task = page.render(renderContext);
      renderTasks.current.set(pageNum, task);
      await task.promise;
      renderTasks.current.delete(pageNum);

      // Draw watermark over rendered page
      drawWatermark(ctx, viewport.width, viewport.height, dpr);
    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') {
        console.error(`Page ${pageNum} render error:`, err);
      }
    }
  }, [pdfDoc, zoomLevel, drawWatermark]);

  // IntersectionObserver for lazy page rendering and current page detection
  useEffect(() => {
    if (!pdfDoc || numPages === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const pageNum = Number(entry.target.getAttribute('data-page-number'));
        if (entry.isIntersecting) {
          visiblePages.current.add(pageNum);
          renderPage(pageNum);
        } else {
          visiblePages.current.delete(pageNum);
        }
      });

      // Update current page based on highest visibility
      const intersectingEntries = entries.filter(e => e.isIntersecting);
      if (intersectingEntries.length > 0) {
        const bestEntry = intersectingEntries.reduce((prev, curr) => 
          curr.intersectionRatio > prev.intersectionRatio ? curr : prev
        );
        const activePageNum = Number(bestEntry.target.getAttribute('data-page-number'));
        if (activePageNum) {
          setCurrentPage(activePageNum);
        }
      }
    }, {
      root: containerRef.current,
      rootMargin: '300px 0px 300px 0px', // Preload nearby pages
      threshold: [0, 0.25, 0.5, 0.75, 1.0]
    });

    pageRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [pdfDoc, numPages, renderPage]);

  // Re-fit on window resize or orientation change (debounced)
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        visiblePages.current.forEach((pageNum) => {
          renderPage(pageNum);
        });
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      clearTimeout(timeout);
    };
  }, [renderPage]);

  // Trigger render when zoom level changes
  useEffect(() => {
    if (!pdfDoc) return;
    visiblePages.current.forEach((pageNum) => {
      renderPage(pageNum);
    });
  }, [zoomLevel, pdfDoc, renderPage]);


  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 2.5));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.6));
  };

  const handleResetZoom = () => {
    setZoomLevel(1.0);
  };

  // 1. Initial Metadata Loading State
  if (metaLoading) {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6 text-center select-none">
        <Loader2 className="w-12 h-12 text-red-600 animate-spin mb-4" />
        <p className="text-xs uppercase tracking-[0.3em] font-black text-white animate-pulse">
          Opening Content Reader...
        </p>
      </div>
    );
  }

  // 2. Empty State: No objective_pdfs document uploaded for this objective
  if (!pdfMeta) {
    return (
      <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] p-6 md:p-12 lg:p-16 flex flex-col justify-between select-none">
        <div>
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors uppercase font-black tracking-widest text-xs mb-8"
          >
            <ArrowLeft size={16} /> Back to Content
          </button>

          <div className="max-w-3xl mx-auto my-12 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2.5rem] p-8 md:p-16 text-center shadow-2xl">
            <div 
              className="w-20 h-20 rounded-3xl border flex items-center justify-center mx-auto mb-6"
              style={{ 
                backgroundColor: `${courseConfig.accentHex}15`, 
                borderColor: `${courseConfig.accentHex}30`,
                color: courseConfig.accentHex 
              }}
            >
              <FileQuestion size={40} />
            </div>

            <span 
              className="text-[10px] font-black uppercase tracking-[0.25em] px-3.5 py-1 rounded-full border inline-block mb-4"
              style={{
                backgroundColor: `${courseConfig.accentHex}15`,
                color: courseConfig.accentHex,
                borderColor: `${courseConfig.accentHex}30`
              }}
            >
              Objective {objective.id}
            </span>

            <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight text-[var(--text-main)] mb-3">
              {objective.title}
            </h2>

            <p className="text-[var(--text-muted)] text-sm md:text-base max-w-lg mx-auto leading-relaxed mb-8">
              No material uploaded for this objective yet.
            </p>

            <div className="p-4 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-color)] text-xs text-[var(--text-muted)] max-w-md mx-auto mb-8 font-medium">
              Study notes, cheat sheets, and technical diagrams for this objective will appear here once attached by an instructor in the Admin Hub.
            </div>

            <button
              onClick={onBack}
              className="px-8 py-4 bg-[var(--bg-surface)] hover:bg-white/10 text-[var(--text-main)] rounded-2xl font-black uppercase tracking-widest text-xs transition-all border border-[var(--border-color)] shadow-sm"
            >
              Return to Course Content
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-[100] bg-[var(--bg-app)] text-[var(--text-main)] flex flex-col select-none overflow-hidden"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Top Controls Toolbar */}
      <header className="h-16 md:h-18 bg-[var(--bg-surface)]/95 border-b border-[var(--border-color)] px-4 md:px-8 flex items-center justify-between gap-3 shrink-0 z-20 backdrop-blur-md">
        {/* Left: Back & Title */}
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <button 
            onClick={onBack}
            className="p-2 md:p-2.5 bg-[var(--bg-card)] hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-xl transition-all border border-[var(--border-color)] shrink-0"
            title="Back to Content"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span 
                className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border"
                style={{
                  backgroundColor: `${courseConfig.accentHex}15`,
                  color: courseConfig.accentHex,
                  borderColor: `${courseConfig.accentHex}30`
                }}
              >
                {objective.id}
              </span>
              <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider hidden sm:inline">
                {objective.domain}
              </span>
            </div>
            <h1 className="text-xs md:text-sm font-black uppercase tracking-tight text-[var(--text-main)] truncate max-w-[200px] sm:max-w-sm md:max-w-md">
              {objective.title}
            </h1>
          </div>
        </div>

        {/* Center: Page Indicator & Zoom Controls */}
        <div className="flex items-center gap-2 md:gap-3 bg-[var(--bg-card)] border border-[var(--border-color)] px-3 py-1.5 rounded-2xl shadow-inner">
          <span className="text-[11px] font-mono font-black text-gray-300 tracking-wider whitespace-nowrap">
            {numPages > 0 ? `Page ${currentPage} / ${numPages}` : 'Loading...'}
          </span>

          <div className="h-4 w-px bg-white/10 mx-1 hidden sm:block" />

          <button 
            onClick={handleZoomOut}
            disabled={zoomLevel <= 0.6 || docLoading}
            className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut size={15} />
          </button>

          <span className="text-[10px] font-mono text-gray-400 font-bold w-10 text-center hidden sm:inline">
            {Math.round(zoomLevel * 100)}%
          </span>

          <button 
            onClick={handleZoomIn}
            disabled={zoomLevel >= 2.5 || docLoading}
            className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
            title="Zoom In"
          >
            <ZoomIn size={15} />
          </button>

          <button 
            onClick={handleResetZoom}
            className="p-1.5 text-gray-400 hover:text-white transition-colors hidden sm:block"
            title="Fit to Width (100%)"
          >
            <Maximize2 size={14} />
          </button>
        </div>

        {/* Right: Close Reader Action */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onBack}
            className="p-2 md:p-2.5 bg-[var(--bg-card)] hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-xl transition-all border border-[var(--border-color)]"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {/* Main Canvas Scroll Viewport */}
      <main 
        ref={containerRef}
        className="flex-1 overflow-y-auto overflow-x-auto p-4 md:p-8 flex flex-col items-center gap-6 bg-[#111111]"
      >
        {/* Loading Skeleton */}
        {docLoading && (
          <div className="w-full max-w-3xl space-y-6 animate-pulse">
            <div className="h-10 bg-white/5 rounded-2xl w-3/4 mx-auto" />
            <div className="h-[75vh] bg-zinc-900/60 rounded-3xl border border-white/5 flex flex-col items-center justify-center text-center p-8">
              <Loader2 className="w-10 h-10 text-red-600 animate-spin mb-4" />
              <p className="text-xs font-black uppercase tracking-widest text-gray-400">
                Streaming Document Pages...
              </p>
              <p className="text-[10px] text-gray-600 font-mono mt-2">
                Securing watermarked canvas view
              </p>
            </div>
          </div>
        )}

        {/* Error State with Retry Button */}
        {docError && !docLoading && (
          <div className="max-w-md my-auto p-8 bg-zinc-900 border border-red-500/30 rounded-3xl text-center shadow-2xl space-y-4">
            <div className="w-14 h-14 bg-red-600/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto">
              <AlertCircle size={28} />
            </div>
            <h3 className="text-lg font-black uppercase tracking-tight text-white">
              Document Load Error
            </h3>
            <p className="text-gray-400 text-xs leading-relaxed">
              {docError}
            </p>
            <button
              onClick={loadPdfDocument}
              className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-colors flex items-center justify-center gap-2 mx-auto shadow-lg shadow-red-600/30"
            >
              <RotateCcw size={14} /> Retry Loading
            </button>
          </div>
        )}

        {/* Rendered Pages List (Lazy Canvas Rendering) */}
        {!docLoading && !docError && numPages > 0 && (
          <div className="flex flex-col items-center gap-6 pb-20 w-full">
            {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
              <div
                key={pageNum}
                ref={(el) => {
                  if (el) pageRefs.current.set(pageNum, el);
                  else pageRefs.current.delete(pageNum);
                }}
                data-page-number={pageNum}
                className="relative bg-white rounded-xl shadow-2xl border border-white/10 overflow-hidden min-h-[400px] flex items-center justify-center transition-transform"
                style={{
                  maxWidth: '100%',
                }}
              >
                <canvas
                  ref={(el) => {
                    if (el) canvasRefs.current.set(pageNum, el);
                    else canvasRefs.current.delete(pageNum);
                  }}
                  className="block"
                />
                
                {/* Floating Page Number Tag */}
                <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-md text-[9px] font-mono font-bold text-gray-300 border border-white/10 pointer-events-none">
                  {pageNum}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default PDFReader;
