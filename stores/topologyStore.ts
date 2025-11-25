import { create } from 'zustand';
import { CephTopologyData } from '@/components/dashboard/visualization/cephTypes';

interface TopologyState {
   topologyData: CephTopologyData | null;
   connected: boolean;
   loading: boolean;
   error: string | null;
   trafficIntensity: number;

   // Actions
   setTopologyData: (data: CephTopologyData) => void;
   setConnected: (connected: boolean) => void;
   setLoading: (loading: boolean) => void;
   setError: (error: string | null) => void;
   setTrafficIntensity: (intensity: number) => void;
   reset: () => void;
}

const initialState = {
   topologyData: null,
   connected: false,
   loading: false,
   error: null,
   trafficIntensity: 5,
};

export const useTopologyStore = create<TopologyState>(set => ({
   ...initialState,

   setTopologyData: data => set({ topologyData: data, loading: false, error: null }),
   setConnected: connected => set({ connected }),
   setLoading: loading => set({ loading }),
   setError: error => set({ error, loading: false }),
   setTrafficIntensity: intensity => set({ trafficIntensity: intensity }),
   reset: () => set(initialState),
}));
