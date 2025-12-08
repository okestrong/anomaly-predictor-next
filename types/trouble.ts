/**
 * Trouble Shooting Guide 타입 정의
 */

export interface AlertInfo {
   alertId: string;
   title: string;
   severity: 'critical' | 'warning' | 'info';
   component: string;
   componentId: string;
   description: string;
   timestamp: string;
   status: 'active' | 'resolved' | 'investigating';
   source?: string;
   labels?: Record<string, string>;
}

export interface Message {
   role: 'user' | 'assistant' | 'system' | 'tool';
   content: string;
   timestamp?: string;
   status?: 'sending' | 'sent' | 'error';
   toolName?: string;
   metadata?: Record<string, any>;
}

export interface DiagnosisResult {
   problemSummary: string;
   rootCause: string;
   confidence: number;
   impactScope: string;
   affectedComponents: string[];
   sources: string[];
   details: string;
}

export interface CommandToExecute {
   command: string;
   args: string[];
   timeout: number;
   description: string;
   requiresApproval: boolean;
   riskLevel: 'low' | 'medium' | 'high' | 'critical';
   potentialImpacts: string[];
}

export interface CommandResult {
   requestId: string;
   command: string;
   args: string;
   stdout: string;
   stderr: string;
   exitCode: number;
   executionTimeMs: number;
}

export interface Solution {
   id: string;
   title: string;
   description: string;
   steps: string[];
   commands: CommandToExecute[];
   readOnly: boolean;
   riskLevel: 'low' | 'medium' | 'high' | 'critical';
   expectedImpacts: string[];
   estimatedMinutes: number;
   referenceUrls: string[];
}

export interface ErrorInfo {
   errorCode: string;
   message: string;
   node: string;
   recoverable: boolean;
   timestamp?: string;
}

export enum WorkflowStatus {
   INITIALIZED = 'INITIALIZED',
   INITIALIZING = 'INITIALIZING',
   ANALYZING = 'ANALYZING',
   COLLECTING_DATA = 'COLLECTING_DATA',
   DIAGNOSING = 'DIAGNOSING',
   GENERATING_SOLUTION = 'GENERATING_SOLUTION',
   EXECUTING_COMMANDS = 'EXECUTING_COMMANDS',
   PENDING_APPROVAL = 'PENDING_APPROVAL',
   COMPLETED = 'COMPLETED',
   FAILED = 'FAILED',
   CANCELLED = 'CANCELLED',
   ERROR = 'ERROR',
}

export interface TroubleResponse {
   type: ResponseType;
   threadId: string;
   currentNode?: string;
   status?: WorkflowStatus;
   message?: Message;
   diagnosis?: DiagnosisResult;
   solutions?: Solution[];
   selectedSolution?: Solution;
   executionResults?: Record<string, CommandResult>;
   error?: ErrorInfo;
   performanceMetrics?: Record<string, any>;
   progress?: number;
   metadata?: Record<string, any>;
}

export enum ResponseType {
   INITIALIZED = 'INITIALIZED',
   NODE_START = 'NODE_START',
   NODE_COMPLETE = 'NODE_COMPLETE',
   MESSAGE = 'MESSAGE',
   DIAGNOSIS = 'DIAGNOSIS',
   SOLUTIONS = 'SOLUTIONS',
   EXECUTION_RESULT = 'EXECUTION_RESULT',
   APPROVAL_REQUIRED = 'APPROVAL_REQUIRED',
   COMPLETED = 'COMPLETED',
   ERROR = 'ERROR',
   PROGRESS = 'PROGRESS',
   STREAMING_CHUNK = 'STREAMING_CHUNK',
   APPROVAL_STATUS_CHANGED = 'APPROVAL_STATUS_CHANGED',
}

/**
 * 승인 상태 변경 메타데이터
 */
export interface ApprovalStatusChangedMetadata {
   requestId: string;
   status: string;
   command: string;
   args: string[];
   decision: 'approve' | 'reject';
   approver: string;
   comment?: string;
}

export interface TroubleRequest {
   threadId?: string;
   alertInfo?: AlertInfo;
   message?: string;
   /**
    * 대상 언어 코드 (예: "ko", "en", "ja")
    * 진단 및 해결책 번역에 사용
    */
   targetLanguage?: string;
}

export interface UserMessageRequest {
   threadId: string;
   message: string;
}

export interface SolutionSelectionRequest {
   threadId: string;
   solutionIndex: number;
}

export interface ApprovalRequest {
   threadId: string;
   requestId: string;
   approved: boolean;
   comment?: string;
}
