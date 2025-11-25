'use client';

import { useEffect } from 'react';

/**
 * Component that suppresses deprecated unload events
 * and provides modern alternatives for Next.js
 *
 * This helps improve Lighthouse Best Practices score by preventing
 * the deprecated 'unload' event from being used.
 */
export default function UnloadSuppressor() {
  useEffect(() => {
    // Store original addEventListener
    const originalAddEventListener = window.addEventListener;
    const originalRemoveEventListener = window.removeEventListener;

    // Track pagehide listeners for compatibility
    const pagehideListeners = new Map<EventListener, EventListener>();

    /**
     * Override addEventListener to intercept 'unload' events
     * and convert them to 'pagehide' events instead
     */
    window.addEventListener = function (
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions
    ) {
      // If trying to add 'unload' listener, use 'pagehide' instead
      if (type === 'unload' && typeof listener === 'function') {
        // Create a wrapped listener for pagehide
        const pagehideListener = (event: Event) => {
          // Call the original listener with the pagehide event
          listener.call(window, event);
        };

        // Store the mapping for removal later
        pagehideListeners.set(listener, pagehideListener);

        // Add pagehide listener instead
        originalAddEventListener.call(window, 'pagehide', pagehideListener, options);

        // Log in development
        if (process.env.NODE_ENV === 'development') {
          console.log('[UnloadSuppressor] Intercepted unload event, using pagehide instead');
        }

        return;
      }

      // For all other events, use original behavior
      originalAddEventListener.call(window, type, listener, options);
    } as typeof window.addEventListener;

    /**
     * Override removeEventListener to handle unload->pagehide mapping
     */
    window.removeEventListener = function (
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | EventListenerOptions
    ) {
      // If removing 'unload' listener, remove the corresponding 'pagehide' listener
      if (type === 'unload' && typeof listener === 'function') {
        const pagehideListener = pagehideListeners.get(listener);

        if (pagehideListener) {
          originalRemoveEventListener.call(window, 'pagehide', pagehideListener, options);
          pagehideListeners.delete(listener);
          return;
        }
      }

      // For all other events, use original behavior
      originalRemoveEventListener.call(window, type, listener, options);
    } as typeof window.removeEventListener;

    // Cleanup on unmount
    return () => {
      // Restore original functions
      window.addEventListener = originalAddEventListener;
      window.removeEventListener = originalRemoveEventListener;

      // Clean up any remaining pagehide listeners
      pagehideListeners.forEach((pagehideListener) => {
        originalRemoveEventListener.call(window, 'pagehide', pagehideListener);
      });
      pagehideListeners.clear();
    };
  }, []);

  // This component doesn't render anything
  return null;
}
