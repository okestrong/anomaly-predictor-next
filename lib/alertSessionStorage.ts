/**
 * Alert Session Storage Utility
 * alert별 채팅 세션 및 웹 터미널 내용을 localStorage에 저장/관리
 */

import { Message, DiagnosisResult, Solution, AlertInfo } from '@/types/trouble';

// 터미널 라인 타입
export interface TerminalLine {
   type: 'command' | 'output' | 'error' | 'info' | 'success' | 'pending';
   content: string;
   timestamp: string;
   requestId?: string;
   commandStr?: string;
}

// 대기 중인 명령어 타입
export interface PendingCommand {
   requestId: string;
   command: string;
   args: string[];
   status: 'pending' | 'approved' | 'rejected' | 'executed' | 'failed';
   lineIndex: number;
}

// 채팅 세션 데이터 타입
export interface ChatSession {
   messages: Message[];
   diagnosis: DiagnosisResult | null;
   solutions: Solution[];
   isCompleted: boolean;
   lastUpdated: string;
   // 웹 터미널 데이터
   terminalLines?: TerminalLine[];
   pendingCommands?: Record<string, PendingCommand>; // Map을 직렬화하기 위해 Record 사용
}

// Alert 메타 정보 (목록 표시용)
export interface AlertMeta {
   alertInfo: AlertInfo;
   timestamp: number; // alert의 원본 timestamp
   hasSession: boolean; // 대화내용 존재 여부
   movedToHistoryAt?: string; // history로 이동한 시점 (ISO string)
}

// 키 prefix
const ACTIVE_PREFIX = 'active:';
const HISTORY_PREFIX = 'history:';
const META_PREFIX = 'alertMeta:';

// 30일 (밀리초)
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Alert timestamp 기반으로 키 생성
 */
export const generateAlertKey = (timestamp: number, isHistory: boolean = false): string => {
   return isHistory ? `${HISTORY_PREFIX}${timestamp}` : `${ACTIVE_PREFIX}${timestamp}`;
};

/**
 * AlertInfo에서 timestamp 추출 (숫자로 변환)
 */
export const getAlertTimestamp = (alert: AlertInfo): number => {
   // timestamp가 ISO string인 경우 숫자로 변환
   if (typeof alert.timestamp === 'string') {
      return new Date(alert.timestamp).getTime();
   }
   return alert.timestamp as unknown as number;
};

/**
 * 세션 저장
 */
export const saveSession = (timestamp: number, session: ChatSession, isHistory: boolean = false): void => {
   if (typeof window === 'undefined') return;
   try {
      const key = generateAlertKey(timestamp, isHistory);
      localStorage.setItem(key, JSON.stringify(session));
   } catch (e) {
      console.error('Failed to save session:', e);
   }
};

/**
 * 세션 불러오기
 */
export const loadSession = (timestamp: number, isHistory: boolean = false): ChatSession | null => {
   if (typeof window === 'undefined') return null;
   try {
      const key = generateAlertKey(timestamp, isHistory);
      const data = localStorage.getItem(key);
      if (data) {
         return JSON.parse(data);
      }
      // isHistory가 false인데 못 찾았으면 history에서도 찾아보기
      if (!isHistory) {
         const historyKey = generateAlertKey(timestamp, true);
         const historyData = localStorage.getItem(historyKey);
         if (historyData) {
            return JSON.parse(historyData);
         }
      }
   } catch (e) {
      console.error('Failed to load session:', e);
   }
   return null;
};

/**
 * 세션 존재 여부 확인
 */
export const hasSession = (timestamp: number): boolean => {
   if (typeof window === 'undefined') return false;
   const activeKey = generateAlertKey(timestamp, false);
   const historyKey = generateAlertKey(timestamp, true);
   return localStorage.getItem(activeKey) !== null || localStorage.getItem(historyKey) !== null;
};

/**
 * Alert 메타 정보 저장
 */
export const saveAlertMeta = (timestamp: number, meta: AlertMeta): void => {
   if (typeof window === 'undefined') return;
   try {
      const key = `${META_PREFIX}${timestamp}`;
      localStorage.setItem(key, JSON.stringify(meta));
   } catch (e) {
      console.error('Failed to save alert meta:', e);
   }
};

/**
 * Alert 메타 정보 불러오기
 */
export const loadAlertMeta = (timestamp: number): AlertMeta | null => {
   if (typeof window === 'undefined') return null;
   try {
      const key = `${META_PREFIX}${timestamp}`;
      const data = localStorage.getItem(key);
      if (data) {
         return JSON.parse(data);
      }
   } catch (e) {
      console.error('Failed to load alert meta:', e);
   }
   return null;
};

/**
 * Active 세션을 History로 이동
 */
export const moveToHistory = (timestamp: number): void => {
   if (typeof window === 'undefined') return;
   try {
      const activeKey = generateAlertKey(timestamp, false);
      const historyKey = generateAlertKey(timestamp, true);
      const metaKey = `${META_PREFIX}${timestamp}`;

      // Active 세션 불러오기
      const sessionData = localStorage.getItem(activeKey);
      if (sessionData) {
         // History로 저장
         localStorage.setItem(historyKey, sessionData);
         // Active 삭제
         localStorage.removeItem(activeKey);
      }

      // 메타 정보 업데이트
      const metaData = localStorage.getItem(metaKey);
      if (metaData) {
         const meta: AlertMeta = JSON.parse(metaData);
         meta.movedToHistoryAt = new Date().toISOString();
         localStorage.setItem(metaKey, JSON.stringify(meta));
      }
   } catch (e) {
      console.error('Failed to move to history:', e);
   }
};

/**
 * 모든 History Alert 불러오기 (메타 정보 기반)
 */
export const loadAllHistoryAlerts = (): AlertMeta[] => {
   if (typeof window === 'undefined') return [];
   const historyAlerts: AlertMeta[] = [];

   try {
      for (let i = 0; i < localStorage.length; i++) {
         const key = localStorage.key(i);
         if (key && key.startsWith(META_PREFIX)) {
            const data = localStorage.getItem(key);
            if (data) {
               const meta: AlertMeta = JSON.parse(data);
               if (meta.movedToHistoryAt) {
                  historyAlerts.push(meta);
               }
            }
         }
      }
   } catch (e) {
      console.error('Failed to load history alerts:', e);
   }

   // timestamp 기준 내림차순 정렬
   return historyAlerts.sort((a, b) => b.timestamp - a.timestamp);
};

/**
 * 모든 Active 세션 timestamp 불러오기
 */
export const loadAllActiveSessionTimestamps = (): number[] => {
   if (typeof window === 'undefined') return [];
   const timestamps: number[] = [];

   try {
      for (let i = 0; i < localStorage.length; i++) {
         const key = localStorage.key(i);
         if (key && key.startsWith(ACTIVE_PREFIX)) {
            const timestamp = parseInt(key.replace(ACTIVE_PREFIX, ''), 10);
            if (!isNaN(timestamp)) {
               timestamps.push(timestamp);
            }
         }
      }
   } catch (e) {
      console.error('Failed to load active session timestamps:', e);
   }

   return timestamps;
};

/**
 * 30일 지난 History 데이터 정리
 */
export const cleanupOldHistory = (): void => {
   if (typeof window === 'undefined') return;
   const now = Date.now();

   try {
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
         const key = localStorage.key(i);
         if (key && key.startsWith(META_PREFIX)) {
            const data = localStorage.getItem(key);
            if (data) {
               const meta: AlertMeta = JSON.parse(data);
               if (meta.movedToHistoryAt) {
                  const movedAt = new Date(meta.movedToHistoryAt).getTime();
                  if (now - movedAt > THIRTY_DAYS_MS) {
                     keysToRemove.push(key);
                     // 해당 history 세션도 삭제
                     keysToRemove.push(generateAlertKey(meta.timestamp, true));
                  }
               }
            }
         }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));

      if (keysToRemove.length > 0) {
         console.log(`Cleaned up ${keysToRemove.length / 2} old history entries`);
      }
   } catch (e) {
      console.error('Failed to cleanup old history:', e);
   }
};

/**
 * 기존 키 마이그레이션 (trouble-chat-* -> active:*)
 */
export const migrateOldKeys = (): void => {
   if (typeof window === 'undefined') return;

   try {
      const keysToMigrate: { oldKey: string; timestamp: number }[] = [];

      for (let i = 0; i < localStorage.length; i++) {
         const key = localStorage.key(i);
         if (key && key.startsWith('trouble-chat-')) {
            // alertId에서 timestamp 추출 시도 (불가능하면 현재 시간 사용)
            const data = localStorage.getItem(key);
            if (data) {
               try {
                  const session = JSON.parse(data);
                  // lastUpdated에서 timestamp 추출
                  const timestamp = session.lastUpdated
                     ? new Date(session.lastUpdated).getTime()
                     : Date.now();
                  keysToMigrate.push({ oldKey: key, timestamp });
               } catch {
                  // 파싱 실패시 무시
               }
            }
         }
      }

      keysToMigrate.forEach(({ oldKey, timestamp }) => {
         const data = localStorage.getItem(oldKey);
         if (data) {
            const newKey = generateAlertKey(timestamp, false);
            localStorage.setItem(newKey, data);
            localStorage.removeItem(oldKey);
            console.log(`Migrated ${oldKey} -> ${newKey}`);
         }
      });
   } catch (e) {
      console.error('Failed to migrate old keys:', e);
   }
};

/**
 * 세션 삭제
 */
export const deleteSession = (timestamp: number): void => {
   if (typeof window === 'undefined') return;
   try {
      localStorage.removeItem(generateAlertKey(timestamp, false));
      localStorage.removeItem(generateAlertKey(timestamp, true));
      localStorage.removeItem(`${META_PREFIX}${timestamp}`);
   } catch (e) {
      console.error('Failed to delete session:', e);
   }
};
