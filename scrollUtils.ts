/**
 * scrollUtils.ts
 * Reliable scroll-to-top helper across browsers, mobile viewports, and custom scroll containers.
 */

export const scrollToTop = (smooth: boolean = false) => {
  const behavior: ScrollBehavior = smooth ? 'smooth' : 'instant';
  try {
    window.scrollTo({ top: 0, left: 0, behavior });
  } catch {
    window.scrollTo(0, 0);
  }
  if (typeof document !== 'undefined') {
    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
    }
    if (document.body) {
      document.body.scrollTop = 0;
    }
    const mainEl = document.querySelector('main');
    if (mainEl && mainEl.scrollTop > 0) {
      mainEl.scrollTop = 0;
    }
  }
};
