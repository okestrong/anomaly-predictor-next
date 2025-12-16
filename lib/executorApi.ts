/**
 * Executor API 클라이언트
 * 백엔드 프록시를 통해 Ceph 명령어 실행 및 승인 관리
 */

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_API_URL as string;
const EXECUTOR_API_PATH = '/api/trouble/executor';

export interface ExecuteCommandRequest {
   command: string;
   args?: string[];
   timeout?: number;
   context?: {
      requester?: string;
      request_reason?: string;
      session_id?: string;
   };
}

export interface CommandResponse {
   request_id: string;
   status: 'completed' | 'pending_approval' | 'approved' | 'rejected' | 'failed' | 'timeout';
   requires_approval: boolean;
   command: string;
   args: string[];
   stdout?: string;
   stderr?: string;
   exit_code?: number;
   risk_level?: string;
   risk_description?: string;
   potential_impacts?: string[];
   executed_at?: string;
   execution_time_ms?: number;
}

export interface PendingApproval {
   request_id: string;
   command: string;
   args: string[];
   risk_level: string;
   risk_description: string;
   potential_impacts: string[];
   requested_at: string;
   requester: string;
   request_reason?: string;
   session_id?: string;
   timeout_at: string;
}

export interface ApprovalDecision {
   decision: 'approve' | 'reject';
   approver: string;
   comment?: string;
   additional_checks?: {
      backup_verified?: boolean;
      maintenance_window?: boolean;
      affected_services_notified?: boolean;
   };
}

/**
 * 명령어 실행 요청 (백엔드 프록시를 통해)
 * 실패 시에도 executor 응답의 stderr를 포함한 상세 정보 반환
 */
export async function executeCommand(request: ExecuteCommandRequest): Promise<CommandResponse> {
   const response = await fetch(`${BACKEND_BASE_URL}${EXECUTOR_API_PATH}/execute`, {
      method: 'POST',
      headers: {
         'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
   });

   // 응답 본문 파싱 시도
   const data = await response.json().catch(() => null);

   if (!response.ok) {
      // 500 에러여도 executor가 반환한 응답이 있으면 그대로 반환 (status: 'failed' 포함)
      if (data && data.status === 'failed') {
         return data as CommandResponse;
      }
      // executor 응답 형식이 아니면 에러 throw
      const errorMessage = data?.stderr || data?.message || 'Failed to execute command';
      throw new Error(errorMessage);
   }

   return data as CommandResponse;
}

/**
 * 승인된 명령어 실행 요청 (백엔드 프록시를 통해)
 * 승인된 명령어의 request_id로 실행 요청
 * placeholder가 있던 명령어는 실제 값으로 대체하여 전송
 */
export async function executeApprovedCommand(requestId: string, command: string, args: string[]): Promise<CommandResponse> {
   const response = await fetch(`${BACKEND_BASE_URL}${EXECUTOR_API_PATH}/commands/${requestId}/execute`, {
      method: 'POST',
      headers: {
         'Content-Type': 'application/json',
      },
      body: JSON.stringify({ command, args }),
   });

   // 응답 본문 파싱 시도
   const data = await response.json().catch(() => null);

   if (!response.ok) {
      // 500 에러여도 executor가 반환한 응답이 있으면 그대로 반환
      if (data && data.status === 'failed') {
         return data as CommandResponse;
      }
      const errorMessage = data?.stderr || data?.message || 'Failed to execute approved command';
      throw new Error(errorMessage);
   }

   return data as CommandResponse;
}

/**
 * 명령어 상태 조회 (백엔드 프록시를 통해)
 */
export async function getCommandStatus(requestId: string): Promise<CommandResponse> {
   const response = await fetch(`${BACKEND_BASE_URL}${EXECUTOR_API_PATH}/status/${requestId}`, {
      method: 'GET',
      headers: {
         'Content-Type': 'application/json',
      },
   });

   if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to get command status' }));
      throw new Error(error.message || 'Failed to get command status');
   }

   return response.json();
}

/**
 * 승인 대기 목록 조회 (백엔드 프록시를 통해)
 */
export async function getPendingApprovals(): Promise<{ pending_approvals: PendingApproval[]; total_count: number }> {
   const response = await fetch(`${BACKEND_BASE_URL}${EXECUTOR_API_PATH}/approvals/pending`, {
      method: 'GET',
      headers: {
         'Content-Type': 'application/json',
      },
   });

   if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to get pending approvals' }));
      throw new Error(error.message || 'Failed to get pending approvals');
   }

   return response.json();
}

/**
 * 명령어 승인/반려 (백엔드 프록시를 통해)
 */
export async function decideApproval(requestId: string, decision: ApprovalDecision): Promise<any> {
   const response = await fetch(`${BACKEND_BASE_URL}${EXECUTOR_API_PATH}/approvals/${requestId}/decision`, {
      method: 'POST',
      headers: {
         'Content-Type': 'application/json',
      },
      body: JSON.stringify(decision),
   });

   if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to process approval decision' }));
      throw new Error(error.message || 'Failed to process approval decision');
   }

   return response.json();
}
