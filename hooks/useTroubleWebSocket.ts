import { useEffect, useRef, useState, useCallback } from 'react';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { TroubleResponse, TroubleRequest, UserMessageRequest, SolutionSelectionRequest, ApprovalRequest, ApprovalStatusChangedMetadata } from '@/types/trouble';

interface UseTroubleWebSocketProps {
   threadId: string | null;
   onMessage: (response: TroubleResponse) => void;
   onApprovalStatusChanged?: (metadata: ApprovalStatusChangedMetadata) => void;
}

export function useTroubleWebSocket({ threadId, onMessage, onApprovalStatusChanged }: UseTroubleWebSocketProps) {
   const [connected, setConnected] = useState(false);
   const [connecting, setConnecting] = useState(false);
   const clientRef = useRef<Client | null>(null);
   const onMessageRef = useRef(onMessage);
   const onApprovalStatusChangedRef = useRef(onApprovalStatusChanged);

   // onMessage ref 업데이트
   useEffect(() => {
      onMessageRef.current = onMessage;
   }, [onMessage]);

   // onApprovalStatusChanged ref 업데이트
   useEffect(() => {
      onApprovalStatusChangedRef.current = onApprovalStatusChanged;
   }, [onApprovalStatusChanged]);

   // WebSocket 연결
   useEffect(() => {
      if (!threadId) return;

      // threadId 변경 시 연결 상태 초기화 (race condition 방지)
      setConnected(false);
      setConnecting(true);

      const client = new Client({
         webSocketFactory: () => new SockJS(`${process.env.NEXT_PUBLIC_API_URL}/ws/trouble`),
         reconnectDelay: 5000,
         heartbeatIncoming: 4000,
         heartbeatOutgoing: 4000,

         onConnect: () => {
            console.log('✅ WebSocket connected');
            setConnected(true);
            setConnecting(false);

            // 특정 스레드 구독
            client.subscribe(`/topic/trouble/${threadId}`, (message: IMessage) => {
               try {
                  const response: TroubleResponse = JSON.parse(message.body);
                  console.log('📥 Received message:', response.type, response);
                  onMessageRef.current(response);
               } catch (error) {
                  console.error('Error parsing message:', error);
               }
            });

            // 승인 상태 변경 구독 (전역)
            client.subscribe('/topic/approvals', (message: IMessage) => {
               try {
                  const response: TroubleResponse = JSON.parse(message.body);
                  console.log('📥 Received approval status change:', response);
                  if (response.metadata && onApprovalStatusChangedRef.current) {
                     onApprovalStatusChangedRef.current(response.metadata as ApprovalStatusChangedMetadata);
                  }
               } catch (error) {
                  console.error('Error parsing approval status message:', error);
               }
            });
         },

         onStompError: frame => {
            console.error('❌ STOMP error:', frame);
            setConnected(false);
            setConnecting(false);
         },

         onWebSocketClose: () => {
            console.log('🔌 WebSocket closed');
            setConnected(false);
            setConnecting(false);
         },

         onDisconnect: () => {
            console.log('🔌 WebSocket disconnected');
            setConnected(false);
         },
      });

      client.activate();
      clientRef.current = client;

      return () => {
         if (client.active) {
            client.deactivate();
         }
      };
   }, [threadId]);

   // 트러블슈팅 시작 (성공 여부 반환)
   const startTroubleshooting = useCallback((request: TroubleRequest): boolean => {
      if (!clientRef.current || !clientRef.current.connected) {
         console.error('WebSocket not connected - clientRef:', !!clientRef.current, 'connected:', clientRef.current?.connected);
         return false;
      }

      clientRef.current.publish({
         destination: '/app/trouble/start',
         body: JSON.stringify(request),
      });

      console.log('📤 Sent start request:', request);
      return true;
   }, []);

   // 사용자 메시지 전송
   const sendMessage = useCallback(
      (message: string) => {
         if (!clientRef.current || !clientRef.current.connected || !threadId) {
            console.error('WebSocket not connected or no threadId');
            return;
         }

         const request: UserMessageRequest = {
            threadId,
            message,
         };

         clientRef.current.publish({
            destination: '/app/trouble/message',
            body: JSON.stringify(request),
         });

         console.log('📤 Sent message:', request);
      },
      [threadId],
   );

   // 해결책 선택
   const selectSolution = useCallback(
      (solutionIndex: number) => {
         if (!clientRef.current || !clientRef.current.connected || !threadId) {
            console.error('WebSocket not connected or no threadId');
            return;
         }

         const request: SolutionSelectionRequest = {
            threadId,
            solutionIndex,
         };

         clientRef.current.publish({
            destination: '/app/trouble/select',
            body: JSON.stringify(request),
         });

         console.log('📤 Sent solution selection:', request);
      },
      [threadId],
   );

   // 명령어 승인
   const approveCommand = useCallback(
      (requestId: string, approved: boolean, comment?: string) => {
         if (!clientRef.current || !clientRef.current.connected || !threadId) {
            console.error('WebSocket not connected or no threadId');
            return;
         }

         const request: ApprovalRequest = {
            threadId,
            requestId,
            approved,
            comment,
         };

         clientRef.current.publish({
            destination: '/app/trouble/approve',
            body: JSON.stringify(request),
         });

         console.log('📤 Sent approval:', request);
      },
      [threadId],
   );

   // 세션 취소
   const cancelSession = useCallback(() => {
      if (!clientRef.current || !clientRef.current.connected || !threadId) {
         console.error('WebSocket not connected or no threadId');
         return;
      }

      clientRef.current.publish({
         destination: '/app/trouble/cancel',
         body: JSON.stringify({ threadId }),
      });

      console.log('📤 Sent cancel request');
   }, [threadId]);

   return {
      connected,
      connecting,
      startTroubleshooting,
      sendMessage,
      selectSolution,
      approveCommand,
      cancelSession,
   };
}
