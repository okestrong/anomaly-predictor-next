/**
 * Modern page leave detection hook
 * Replaces deprecated 'unload' event with 'pagehide' and 'visibilitychange'
 *
 * This hook helps improve Lighthouse Best Practices score by avoiding deprecated APIs
 */

import { useEffect, useRef } from 'react';

interface UseModernPageLeaveOptions {
  onPageLeave?: () => void;
  onPageHide?: (event: PageTransitionEvent) => void;
  onVisibilityChange?: (isHidden: boolean) => void;
}

/**
 * Hook that provides modern alternatives to deprecated unload event
 *
 * @example
 * useModernPageLeave({
 *   onPageLeave: () => {
 *     // Cleanup resources, save state, etc.
 *     console.log('User is leaving the page');
 *   },
 * });
 */
export function useModernPageLeave(options: UseModernPageLeaveOptions = {}) {
  const { onPageLeave, onPageHide, onVisibilityChange } = options;
  const isCleanedUpRef = useRef(false);

  useEffect(() => {
    // Reset cleanup flag on mount
    isCleanedUpRef.current = false;

    /**
     * pagehide - Modern replacement for unload
     * Fires when the page is being unloaded or put into bfcache
     * More reliable than unload and works with bfcache
     */
    const handlePageHide = (event: PageTransitionEvent) => {
      if (isCleanedUpRef.current) return;

      if (onPageHide) {
        onPageHide(event);
      }

      if (onPageLeave) {
        onPageLeave();
      }

      // Mark as cleaned up to prevent duplicate calls
      isCleanedUpRef.current = true;
    };

    /**
     * visibilitychange - Detects when page becomes hidden
     * Fires when user switches tabs or minimizes window
     * Useful for pausing activities or saving state
     */
    const handleVisibilityChange = () => {
      const isHidden = document.visibilityState === 'hidden';

      if (onVisibilityChange) {
        onVisibilityChange(isHidden);
      }

      // If page is hidden and we haven't cleaned up, treat it as page leave
      if (isHidden && !isCleanedUpRef.current && onPageLeave) {
        onPageLeave();
        isCleanedUpRef.current = true;
      }
    };

    // Add event listeners
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [onPageLeave, onPageHide, onVisibilityChange]);
}

/**
 * Hook for cleanup operations when page is about to be hidden
 * Useful for WebSocket disconnections, saving state, etc.
 *
 * @example
 * usePageCleanup(() => {
 *   websocket.disconnect();
 *   localStorage.setItem('state', JSON.stringify(state));
 * });
 */
export function usePageCleanup(cleanup: () => void) {
  useModernPageLeave({
    onPageLeave: cleanup,
  });
}

/**
 * Hook for detecting when user navigates away
 * More reliable than beforeunload for modern browsers
 *
 * @example
 * usePageVisibility((isHidden) => {
 *   if (isHidden) {
 *     // Pause animations, disconnect from real-time updates
 *     pauseAnimations();
 *   } else {
 *     // Resume animations, reconnect to real-time updates
 *     resumeAnimations();
 *   }
 * });
 */
export function usePageVisibility(callback: (isHidden: boolean) => void) {
  useModernPageLeave({
    onVisibilityChange: callback,
  });
}
