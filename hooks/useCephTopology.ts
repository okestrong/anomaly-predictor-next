import { useEffect, useRef } from 'react';
import { useTopologyStore } from '@/stores/topologyStore';
import { CephTopologyAPI, CephTopologyWebSocket } from '@/lib/api/cephTopologyApi';

/**
 * Custom hook for managing Ceph topology data and WebSocket connection
 * Similar to useDashboard hook pattern
 */
export function useCephTopology() {
   const { topologyData, connected, loading, error, trafficIntensity, setTopologyData, setConnected, setLoading, setError, setTrafficIntensity } =
      useTopologyStore();

   const wsRef = useRef<CephTopologyWebSocket | null>(null);

   useEffect(() => {
      // Initialize WebSocket connection
      const ws = new CephTopologyWebSocket(
         // onMessage
         data => {
            setTopologyData(data);
         },
         // onConnectionChange
         isConnected => {
            setConnected(isConnected);
         },
         // onError
         err => {
            console.error('Ceph topology WebSocket error:', err);
            setError(err?.message || 'WebSocket connection error');
         },
      );

      wsRef.current = ws;
      ws.connect();

      // Load initial data via REST API
      setLoading(true);
      CephTopologyAPI.getTopology()
         .then(data => {
            setTopologyData(data);
         })
         .catch(err => {
            console.error('Failed to load initial topology data:', err);
            setError(err?.message || 'Failed to load topology data');
         })
         .finally(() => {
            setLoading(false);
         });

      // Cleanup on unmount
      return () => {
         if (wsRef.current) {
            wsRef.current.disconnect();
         }
      };
   }, [setTopologyData, setConnected, setLoading, setError]);

   // Update traffic intensity
   const updateTrafficIntensity = async (intensity: number) => {
      setTrafficIntensity(intensity);
      try {
         await CephTopologyAPI.setTrafficIntensity(intensity);
      } catch (err) {
         console.error('Failed to update traffic intensity:', err);
         setError('Failed to update traffic intensity');
      }
   };

   return {
      topologyData,
      connected,
      loading,
      error,
      trafficIntensity,
      updateTrafficIntensity,
   };
}
