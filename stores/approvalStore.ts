import { create } from 'zustand';

/**
 * 승인 상태 타입
 */
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'executed' | 'failed';

/**
 * 개별 명령어 승인 상태
 */
export interface CommandApproval {
   requestId: string;
   command: string;
   args: string[];
   status: ApprovalStatus;
   groupId?: string; // 여러 명령어를 그룹으로 묶을 때 사용
   approvedAt?: string;
   rejectedAt?: string;
   executedAt?: string;
   error?: string;
}

/**
 * 승인 그룹 (해결책 실행 시 여러 명령어를 한꺼번에 요청할 때)
 */
export interface ApprovalGroup {
   groupId: string;
   solutionId: string;
   solutionTitle: string;
   requestIds: string[];
   createdAt: string;
}

interface ApprovalState {
   // 개별 명령어 승인 상태 (requestId -> CommandApproval)
   approvals: Map<string, CommandApproval>;

   // 승인 그룹 (groupId -> ApprovalGroup)
   groups: Map<string, ApprovalGroup>;

   // Actions
   addApproval: (approval: CommandApproval) => void;
   updateApprovalStatus: (requestId: string, status: ApprovalStatus, extra?: Partial<CommandApproval>) => void;
   removeApproval: (requestId: string) => void;

   addGroup: (group: ApprovalGroup) => void;
   removeGroup: (groupId: string) => void;

   // 그룹의 전체 상태 조회
   getGroupStatus: (groupId: string) => {
      total: number;
      pending: number;
      approved: number;
      rejected: number;
      allApproved: boolean;
      hasRejected: boolean;
   } | null;

   // 특정 그룹의 모든 승인 조회
   getGroupApprovals: (groupId: string) => CommandApproval[];

   // 초기화
   clearAll: () => void;
   clearGroup: (groupId: string) => void;
}

export const useApprovalStore = create<ApprovalState>((set, get) => ({
   approvals: new Map(),
   groups: new Map(),

   addApproval: (approval: CommandApproval) => {
      set(state => {
         const newApprovals = new Map(state.approvals);
         newApprovals.set(approval.requestId, approval);
         return { approvals: newApprovals };
      });
   },

   updateApprovalStatus: (requestId: string, status: ApprovalStatus, extra?: Partial<CommandApproval>) => {
      set(state => {
         const approval = state.approvals.get(requestId);
         if (!approval) return state;

         const newApprovals = new Map(state.approvals);
         newApprovals.set(requestId, {
            ...approval,
            status,
            ...extra,
            ...(status === 'approved' ? { approvedAt: new Date().toISOString() } : {}),
            ...(status === 'rejected' ? { rejectedAt: new Date().toISOString() } : {}),
            ...(status === 'executed' ? { executedAt: new Date().toISOString() } : {}),
         });
         return { approvals: newApprovals };
      });
   },

   removeApproval: (requestId: string) => {
      set(state => {
         const newApprovals = new Map(state.approvals);
         newApprovals.delete(requestId);
         return { approvals: newApprovals };
      });
   },

   addGroup: (group: ApprovalGroup) => {
      set(state => {
         const newGroups = new Map(state.groups);
         newGroups.set(group.groupId, group);
         return { groups: newGroups };
      });
   },

   removeGroup: (groupId: string) => {
      set(state => {
         const newGroups = new Map(state.groups);
         newGroups.delete(groupId);
         return { groups: newGroups };
      });
   },

   getGroupStatus: (groupId: string) => {
      const state = get();
      const group = state.groups.get(groupId);
      if (!group) return null;

      let pending = 0;
      let approved = 0;
      let rejected = 0;

      for (const requestId of group.requestIds) {
         const approval = state.approvals.get(requestId);
         if (!approval) {
            pending++;
            continue;
         }

         switch (approval.status) {
            case 'pending':
               pending++;
               break;
            case 'approved':
            case 'executed':
               approved++;
               break;
            case 'rejected':
            case 'failed':
               rejected++;
               break;
         }
      }

      return {
         total: group.requestIds.length,
         pending,
         approved,
         rejected,
         allApproved: approved === group.requestIds.length,
         hasRejected: rejected > 0,
      };
   },

   getGroupApprovals: (groupId: string) => {
      const state = get();
      const group = state.groups.get(groupId);
      if (!group) return [];

      return group.requestIds
         .map(requestId => state.approvals.get(requestId))
         .filter((a): a is CommandApproval => a !== undefined);
   },

   clearAll: () => {
      set({ approvals: new Map(), groups: new Map() });
   },

   clearGroup: (groupId: string) => {
      set(state => {
         const group = state.groups.get(groupId);
         if (!group) return state;

         const newApprovals = new Map(state.approvals);
         for (const requestId of group.requestIds) {
            newApprovals.delete(requestId);
         }

         const newGroups = new Map(state.groups);
         newGroups.delete(groupId);

         return { approvals: newApprovals, groups: newGroups };
      });
   },
}));
