'use client';

import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useTopologyStore } from '@/stores/topology';
import { shallow } from 'zustand/vanilla/shallow';

interface TopologyContextType {
   isInitialized: boolean;
   initializeTopology: () => Promise<void>;
   refreshTopology: () => Promise<void>;
}

const TopologyContext = createContext<TopologyContextType | null>(null);

interface TopologyProviderProps {
   children: React.ReactNode;
   autoInitialize?: boolean;
}

/**
 * TopologyProvider - Handles early initialization of topology data
 *
 * This provider ensures topology data is fetched on app initialization,
 * not just when the /topology page is visited. This provides better UX
 * since the API call is slow and the data can be pre-loaded.
 */
export function TopologyProvider({ children, autoInitialize = true }: TopologyProviderProps) {
   const initializeTopology = useTopologyStore(state => state.initializeTopology);
   const refreshTopology = useTopologyStore(state => state.refreshTopology);
   const isLoading = useTopologyStore(state => state.isLoading);
   const topologyData = useTopologyStore(state => state.topologyData);

   const isInitialized = topologyData !== null && !isLoading;

   // Use ref to prevent double initialization in React 18 Strict Mode
   const isInitializedRef = useRef(false);

   // Auto-initialize topology data on mount
   useEffect(() => {
      // Prevent double initialization in Strict Mode (React 18)
      if (isInitializedRef.current) {
         return;
      }

      if (autoInitialize) {
         isInitializedRef.current = true;
         console.log('🔄 Auto-initializing topology data...');
         initializeTopology();
      }
   }, [autoInitialize, initializeTopology]);

   const contextValue: TopologyContextType = {
      isInitialized,
      initializeTopology,
      refreshTopology,
   };

   return <TopologyContext.Provider value={contextValue}>{children}</TopologyContext.Provider>;
}

/**
 * Hook to access topology context
 */
export function useTopologyContext() {
   const context = useContext(TopologyContext);
   if (!context) {
      throw new Error('useTopologyContext must be used within a TopologyProvider');
   }
   return context;
}
