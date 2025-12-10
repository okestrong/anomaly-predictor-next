import { apiClient } from './client';
import { Client, IMessage } from '@stomp/stompjs';
import { CephTopologyData } from '@/components/dashboard/visualization/cephTypes';

// API Functions
export class CephTopologyAPI {
   /**
    * Get current Ceph topology data
    */
   static async getTopology(): Promise<CephTopologyData> {
      return await apiClient.get<CephTopologyData>('/api/ceph/topology');
   }

   /**
    * Set traffic intensity (1-10)
    */
   static async setTrafficIntensity(intensity: number): Promise<{ status: string; message: string }> {
      return await apiClient.post(`/api/ceph/traffic/intensity?intensity=${intensity}`);
   }

   /**
    * Refresh topology data
    */
   static async refreshTopology(): Promise<{ status: string; message: string; timestamp: number }> {
      return await apiClient.post('/api/ceph/topology/refresh');
   }
}

// WebSocket Connection Management using STOMP
export class CephTopologyWebSocket {
   private stompClient: Client | null = null;
   private reconnectAttempts = 0;
   private maxReconnectAttempts = 5;
   private reconnectDelay = 1000;
   private isConnecting = false;

   constructor(
      private onMessage: (data: CephTopologyData) => void,
      private onConnectionChange: (connected: boolean) => void,
      private onError: (error: any) => void,
   ) {}

   connect(baseUrl: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080') {
      // SockJS requires http/https URL, not ws/wss
      let httpUrl = baseUrl;
      if (httpUrl.startsWith('ws://')) {
         httpUrl = httpUrl.replace('ws://', 'http://');
      } else if (httpUrl.startsWith('wss://')) {
         httpUrl = httpUrl.replace('wss://', 'https://');
      }

      const url = `${httpUrl}/ws/dashboard`;

      if (this.isConnecting || (this.stompClient && this.stompClient.connected)) {
         return;
      }

      this.isConnecting = true;

      try {
         // Create STOMP client with SockJS
         this.stompClient = new Client({
            brokerURL: undefined,
            webSocketFactory: () => {
               const SockJS = require('sockjs-client');
               return new SockJS(url);
            },
            reconnectDelay: this.reconnectDelay,
            heartbeatIncoming: 10000,
            heartbeatOutgoing: 10000,
            connectionTimeout: 5000,

            onConnect: frame => {
               console.log('Ceph Topology STOMP connected:', frame);
               this.isConnecting = false;
               this.reconnectAttempts = 0;
               this.onConnectionChange(true);

               // Subscribe to ceph topology topic
               this.stompClient?.subscribe('/topic/ceph-topology', (message: IMessage) => {
                  try {
                     const data = JSON.parse(message.body) as CephTopologyData;
                     this.onMessage(data);
                  } catch (error) {
                     console.error('Error parsing STOMP topology message:', error);
                     this.onError(error);
                  }
               });

               // Send connection confirmation
               this.stompClient?.publish({
                  destination: '/app/connect',
                  body: JSON.stringify({ type: 'ceph_topology_connect' }),
               });
            },

            onDisconnect: frame => {
               console.log('Ceph Topology STOMP disconnected:', frame);
               this.isConnecting = false;
               this.onConnectionChange(false);

               // Attempt to reconnect
               if (this.reconnectAttempts < this.maxReconnectAttempts) {
                  this.reconnectAttempts++;
                  console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
               } else {
                  console.error('Max reconnection attempts reached');
               }
            },

            onStompError: frame => {
               console.error('STOMP error:', frame);
               this.isConnecting = false;
               this.onError(new Error(frame.headers['message'] || 'STOMP error'));
            },

            onWebSocketError: event => {
               console.error('WebSocket error:', event);
               this.isConnecting = false;
               this.onError(event);
            },

            debug: (str: string) => {
               // Uncomment for debugging
               // console.log('STOMP debug:', str);
            },
         });

         this.stompClient.activate();
      } catch (error) {
         console.error('Error creating STOMP connection:', error);
         this.isConnecting = false;
         this.onConnectionChange(false);
         this.onError(error);
      }
   }

   disconnect() {
      if (this.stompClient) {
         this.stompClient.deactivate();
         this.stompClient = null;
      }
      this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnection
   }

   send(message: { type: string; data?: any }) {
      if (this.stompClient && this.stompClient.connected) {
         this.stompClient.publish({
            destination: '/app/ceph-topology',
            body: JSON.stringify(message),
         });
      } else {
         console.warn('STOMP client is not connected');
      }
   }

   isConnected(): boolean {
      return this.stompClient !== null && this.stompClient.connected;
   }
}
