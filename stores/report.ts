/**
 * Report Store - Zustand State Management
 * Manages reporting module state including reports, templates, schedules, and generation
 */

import { create } from 'zustand';
import { subscribeWithSelector, devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
   Report,
   ReportTemplate,
   ReportSchedule,
   GenerateReportParams,
   ExportOptions,
   EmailParams,
   ReportType,
   ReportStatus,
   AIInsights,
   ReportListResponse,
   TemplateListResponse,
   ScheduleListResponse,
} from '@/types/report';

// ==================== Store State Interface ====================

interface ReportStore {
   // ===== State =====
   // Current report being viewed/generated
   currentReport: Report | null;

   // All reports list
   reports: Report[];
   reportsTotal: number;
   reportsPage: number;
   reportsPageSize: number;

   // Templates
   templates: ReportTemplate[];
   templatesTotal: number;

   // Schedules
   schedules: ReportSchedule[];
   schedulesTotal: number;

   // Generation state
   isGenerating: boolean;
   generationProgress: number; // 0-100
   generationStatus: string;

   // Loading states
   loadingReports: boolean;
   loadingTemplates: boolean;
   loadingSchedules: boolean;

   // Errors
   error: string | null;

   // ===== Actions =====
   // Report generation
   generateReport: (params: GenerateReportParams) => Promise<Report>;
   setCurrentReport: (report: Report | null) => void;
   setGenerationProgress: (progress: number, status?: string) => void;

   // Report management
   fetchReports: (page?: number, pageSize?: number) => Promise<void>;
   fetchReportById: (reportId: string) => Promise<Report | null>;
   deleteReport: (reportId: string) => Promise<void>;

   // Template management
   fetchTemplates: () => Promise<void>;
   saveTemplate: (template: Omit<ReportTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ReportTemplate>;
   updateTemplate: (templateId: string, updates: Partial<ReportTemplate>) => Promise<void>;
   deleteTemplate: (templateId: string) => Promise<void>;

   // Schedule management
   fetchSchedules: () => Promise<void>;
   createSchedule: (schedule: Omit<ReportSchedule, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ReportSchedule>;
   updateSchedule: (scheduleId: string, updates: Partial<ReportSchedule>) => Promise<void>;
   deleteSchedule: (scheduleId: string) => Promise<void>;
   toggleSchedule: (scheduleId: string, enabled: boolean) => Promise<void>;

   // Export and email
   exportReport: (reportId: string, options: ExportOptions) => Promise<Blob>;
   sendEmail: (reportId: string, params: EmailParams) => Promise<void>;

   // AI features
   generateAIInsights: (reportId: string) => Promise<AIInsights>;

   // Utility actions
   setError: (error: string | null) => void;
   clearError: () => void;
   reset: () => void;
}

// ==================== Initial State ====================

const initialState = {
   currentReport: null,
   reports: [],
   reportsTotal: 0,
   reportsPage: 1,
   reportsPageSize: 20,
   templates: [],
   templatesTotal: 0,
   schedules: [],
   schedulesTotal: 0,
   isGenerating: false,
   generationProgress: 0,
   generationStatus: '',
   loadingReports: false,
   loadingTemplates: false,
   loadingSchedules: false,
   error: null,
};

// ==================== Store Implementation ====================

export const useReportStore = create<ReportStore>()(
   devtools(
      persist(
         subscribeWithSelector(
            immer((set, get) => ({
               ...initialState,

               // ===== Report Generation =====
               generateReport: async (params: GenerateReportParams): Promise<Report> => {
                  set((state) => {
                     state.isGenerating = true;
                     state.generationProgress = 0;
                     state.generationStatus = 'Initializing report generation...';
                     state.error = null;
                  });

                  try {
                     // Import API client dynamically to avoid circular dependency
                     const { ReportAPI } = await import('@/lib/api/reportApi');

                     // Step 1: Fetch data (25%)
                     set((state) => {
                        state.generationProgress = 10;
                        state.generationStatus = 'Fetching cluster data...';
                     });

                     // Step 2: Process data (50%)
                     set((state) => {
                        state.generationProgress = 30;
                        state.generationStatus = 'Processing metrics...';
                     });

                     // Step 3: Generate AI insights if requested (75%)
                     if (params.options.includeAI) {
                        set((state) => {
                           state.generationProgress = 60;
                           state.generationStatus = 'Generating AI insights...';
                        });
                     }

                     // Step 4: Create report (90%)
                     set((state) => {
                        state.generationProgress = 80;
                        state.generationStatus = 'Assembling report...';
                     });

                     // Transform params to match backend DTO
                     const requestPayload = {
                        type: params.type.toUpperCase().replace('-', '_'),
                        startDate: params.timeRange.start,
                        endDate: params.timeRange.end,
                        options: {
                           includeAI: params.options.includeAI || false,
                           includePredictions: params.options.includePredictions || false,
                           includeRecommendations: params.options.includeRecommendations || true,
                           templateId: params.templateId,
                           format: 'JSON',
                        },
                     };

                     const report = await ReportAPI.generate(requestPayload);

                     // Step 5: Complete (100%)
                     set((state) => {
                        state.generationProgress = 100;
                        state.generationStatus = 'Report generated successfully';
                        state.currentReport = report;

                        // 중복 체크: 이미 존재하는 리포트인지 확인
                        const existingIndex = state.reports.findIndex(r => r.id === report.id);
                        if (existingIndex === -1) {
                           // 새 리포트만 추가
                           state.reports.unshift(report);
                           state.reportsTotal += 1;
                        } else {
                           // 기존 리포트 업데이트
                           state.reports[existingIndex] = report;
                        }

                        state.isGenerating = false;
                     });

                     return report;
                  } catch (error) {
                     const errorMessage = error instanceof Error ? error.message : 'Failed to generate report';
                     set((state) => {
                        state.error = errorMessage;
                        state.isGenerating = false;
                        state.generationProgress = 0;
                        state.generationStatus = '';
                     });
                     throw error;
                  }
               },

               setCurrentReport: (report: Report | null) => {
                  set((state) => {
                     state.currentReport = report;
                  });
               },

               setGenerationProgress: (progress: number, status?: string) => {
                  set((state) => {
                     state.generationProgress = Math.max(0, Math.min(100, progress));
                     if (status) {
                        state.generationStatus = status;
                     }
                  });
               },

               // ===== Report Management =====
               fetchReports: async (page = 1, pageSize = 20) => {
                  set((state) => {
                     state.loadingReports = true;
                     state.error = null;
                  });

                  try {
                     const { ReportAPI } = await import('@/lib/api/reportApi');
                     const response: ReportListResponse = await ReportAPI.getReports(page, pageSize);

                     set((state) => {
                        // 중복 제거: API에서 받은 데이터에서 중복된 ID 제거
                        const uniqueReports = Array.from(
                           new Map(response.reports.map(r => [r.id, r])).values()
                        );

                        state.reports = uniqueReports;
                        state.reportsTotal = response.total;
                        state.reportsPage = response.page;
                        state.reportsPageSize = response.pageSize;
                        state.loadingReports = false;
                     });
                  } catch (error) {
                     const errorMessage = error instanceof Error ? error.message : 'Failed to fetch reports';
                     set((state) => {
                        state.error = errorMessage;
                        state.loadingReports = false;
                     });
                     throw error;
                  }
               },

               fetchReportById: async (reportId: string): Promise<Report | null> => {
                  // Check if report is already loaded in store
                  const currentState = get();
                  if (currentState.currentReport?.id === reportId) {
                     console.log('Report already loaded in store, skipping API call');
                     return currentState.currentReport;
                  }

                  try {
                     const { ReportAPI } = await import('@/lib/api/reportApi');
                     const report = await ReportAPI.getReportById(reportId);

                     set((state) => {
                        state.currentReport = report;
                     });

                     return report;
                  } catch (error) {
                     const errorMessage = error instanceof Error ? error.message : 'Failed to fetch report';
                     set((state) => {
                        state.error = errorMessage;
                     });
                     return null;
                  }
               },

               deleteReport: async (reportId: string) => {
                  try {
                     const { ReportAPI } = await import('@/lib/api/reportApi');
                     await ReportAPI.deleteReport(reportId);

                     set((state) => {
                        state.reports = state.reports.filter((r) => r.id !== reportId);
                        state.reportsTotal -= 1;
                        if (state.currentReport?.id === reportId) {
                           state.currentReport = null;
                        }
                     });
                  } catch (error) {
                     const errorMessage = error instanceof Error ? error.message : 'Failed to delete report';
                     set((state) => {
                        state.error = errorMessage;
                     });
                     throw error;
                  }
               },

               // ===== Template Management =====
               fetchTemplates: async () => {
                  set((state) => {
                     state.loadingTemplates = true;
                     state.error = null;
                  });

                  try {
                     const { ReportAPI } = await import('@/lib/api/reportApi');
                     const response: TemplateListResponse = await ReportAPI.getTemplates();

                     set((state) => {
                        state.templates = response.templates;
                        state.templatesTotal = response.total;
                        state.loadingTemplates = false;
                     });
                  } catch (error) {
                     const errorMessage = error instanceof Error ? error.message : 'Failed to fetch templates';
                     set((state) => {
                        state.error = errorMessage;
                        state.loadingTemplates = false;
                     });
                     throw error;
                  }
               },

               saveTemplate: async (templateData) => {
                  try {
                     const { ReportAPI } = await import('@/lib/api/reportApi');
                     const template = await ReportAPI.saveTemplate(templateData);

                     set((state) => {
                        state.templates.push(template);
                        state.templatesTotal += 1;
                     });

                     return template;
                  } catch (error) {
                     const errorMessage = error instanceof Error ? error.message : 'Failed to save template';
                     set((state) => {
                        state.error = errorMessage;
                     });
                     throw error;
                  }
               },

               updateTemplate: async (templateId, updates) => {
                  try {
                     const { ReportAPI } = await import('@/lib/api/reportApi');
                     const updated = await ReportAPI.updateTemplate(templateId, updates);

                     set((state) => {
                        const index = state.templates.findIndex((t) => t.id === templateId);
                        if (index !== -1) {
                           state.templates[index] = updated;
                        }
                     });
                  } catch (error) {
                     const errorMessage = error instanceof Error ? error.message : 'Failed to update template';
                     set((state) => {
                        state.error = errorMessage;
                     });
                     throw error;
                  }
               },

               deleteTemplate: async (templateId) => {
                  try {
                     const { ReportAPI } = await import('@/lib/api/reportApi');
                     await ReportAPI.deleteTemplate(templateId);

                     set((state) => {
                        state.templates = state.templates.filter((t) => t.id !== templateId);
                        state.templatesTotal -= 1;
                     });
                  } catch (error) {
                     const errorMessage = error instanceof Error ? error.message : 'Failed to delete template';
                     set((state) => {
                        state.error = errorMessage;
                     });
                     throw error;
                  }
               },

               // ===== Schedule Management =====
               fetchSchedules: async () => {
                  set((state) => {
                     state.loadingSchedules = true;
                     state.error = null;
                  });

                  try {
                     const { ReportAPI } = await import('@/lib/api/reportApi');
                     const response: ScheduleListResponse = await ReportAPI.getSchedules();

                     set((state) => {
                        state.schedules = response.schedules;
                        state.schedulesTotal = response.total;
                        state.loadingSchedules = false;
                     });
                  } catch (error) {
                     const errorMessage = error instanceof Error ? error.message : 'Failed to fetch schedules';
                     set((state) => {
                        state.error = errorMessage;
                        state.loadingSchedules = false;
                     });
                     throw error;
                  }
               },

               createSchedule: async (scheduleData) => {
                  try {
                     const { ReportAPI } = await import('@/lib/api/reportApi');
                     const schedule = await ReportAPI.createSchedule(scheduleData);

                     set((state) => {
                        state.schedules.push(schedule);
                        state.schedulesTotal += 1;
                     });

                     return schedule;
                  } catch (error) {
                     const errorMessage = error instanceof Error ? error.message : 'Failed to create schedule';
                     set((state) => {
                        state.error = errorMessage;
                     });
                     throw error;
                  }
               },

               updateSchedule: async (scheduleId, updates) => {
                  try {
                     const { ReportAPI } = await import('@/lib/api/reportApi');
                     const updated = await ReportAPI.updateSchedule(scheduleId, updates);

                     set((state) => {
                        const index = state.schedules.findIndex((s) => s.id === scheduleId);
                        if (index !== -1) {
                           state.schedules[index] = updated;
                        }
                     });
                  } catch (error) {
                     const errorMessage = error instanceof Error ? error.message : 'Failed to update schedule';
                     set((state) => {
                        state.error = errorMessage;
                     });
                     throw error;
                  }
               },

               deleteSchedule: async (scheduleId) => {
                  try {
                     const { ReportAPI } = await import('@/lib/api/reportApi');
                     await ReportAPI.deleteSchedule(scheduleId);

                     set((state) => {
                        state.schedules = state.schedules.filter((s) => s.id !== scheduleId);
                        state.schedulesTotal -= 1;
                     });
                  } catch (error) {
                     const errorMessage = error instanceof Error ? error.message : 'Failed to delete schedule';
                     set((state) => {
                        state.error = errorMessage;
                     });
                     throw error;
                  }
               },

               toggleSchedule: async (scheduleId, enabled) => {
                  try {
                     await get().updateSchedule(scheduleId, { enabled });
                  } catch (error) {
                     throw error;
                  }
               },

               // ===== Export and Email =====
               exportReport: async (reportId, options) => {
                  try {
                     const { ReportAPI } = await import('@/lib/api/reportApi');
                     const blob = await ReportAPI.exportReport(reportId, options);
                     return blob;
                  } catch (error) {
                     const errorMessage = error instanceof Error ? error.message : 'Failed to export report';
                     set((state) => {
                        state.error = errorMessage;
                     });
                     throw error;
                  }
               },

               sendEmail: async (reportId, params) => {
                  try {
                     const { ReportAPI } = await import('@/lib/api/reportApi');
                     await ReportAPI.sendEmail(reportId, params);
                  } catch (error) {
                     const errorMessage = error instanceof Error ? error.message : 'Failed to send email';
                     set((state) => {
                        state.error = errorMessage;
                     });
                     throw error;
                  }
               },

               // ===== AI Features =====
               generateAIInsights: async (reportId) => {
                  try {
                     const { ReportAPI } = await import('@/lib/api/reportApi');
                     const insights = await ReportAPI.getAIInsights(reportId);

                     set((state) => {
                        if (state.currentReport?.id === reportId) {
                           state.currentReport.aiInsights = insights;
                        }

                        const reportIndex = state.reports.findIndex((r) => r.id === reportId);
                        if (reportIndex !== -1) {
                           state.reports[reportIndex].aiInsights = insights;
                        }
                     });

                     return insights;
                  } catch (error) {
                     const errorMessage = error instanceof Error ? error.message : 'Failed to generate AI insights';
                     set((state) => {
                        state.error = errorMessage;
                     });
                     throw error;
                  }
               },

               // ===== Utility Actions =====
               setError: (error) => {
                  set((state) => {
                     state.error = error;
                  });
               },

               clearError: () => {
                  set((state) => {
                     state.error = null;
                  });
               },

               reset: () => {
                  set(initialState);
               },
            }))
         ),
         {
            name: 'report-store',
            partialize: (state) => ({
               // reports는 persist하지 않음 - 매번 새로 fetch
               templates: state.templates,
               schedules: state.schedules,
               // currentReport도 persist하지 않음 - 페이지 새로고침 시 새로 fetch
            }),
         }
      ),
      { name: 'report-store' }
   )
);

// ==================== Selector Hooks (Performance Optimization) ====================

export const useCurrentReport = () => useReportStore((state) => state.currentReport);
export const useReports = () => useReportStore((state) => state.reports);
export const useTemplates = () => useReportStore((state) => state.templates);
export const useSchedules = () => useReportStore((state) => state.schedules);
export const useReportGenerationStatus = () =>
   useReportStore((state) => ({
      isGenerating: state.isGenerating,
      progress: state.generationProgress,
      status: state.generationStatus,
   }));
export const useReportError = () => useReportStore((state) => state.error);

// ==================== Utility Functions ====================

/**
 * Get date range presets for report generation
 */
export const getDateRangePresets = () => {
   const now = new Date();
   const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

   return {
      today: {
         label: 'Today',
         value: 'today',
         getTimeRange: () => ({
            start: today.toISOString(),
            end: now.toISOString(),
            label: 'Today',
         }),
      },
      yesterday: {
         label: 'Yesterday',
         value: 'yesterday',
         getTimeRange: () => {
            const start = new Date(today);
            start.setDate(start.getDate() - 1);
            const end = new Date(start);
            end.setDate(end.getDate() + 1);
            return {
               start: start.toISOString(),
               end: end.toISOString(),
               label: 'Yesterday',
            };
         },
      },
      last7Days: {
         label: 'Last 7 Days',
         value: 'last7Days',
         getTimeRange: () => {
            const start = new Date(today);
            start.setDate(start.getDate() - 7);
            return {
               start: start.toISOString(),
               end: now.toISOString(),
               label: 'Last 7 Days',
            };
         },
      },
      last30Days: {
         label: 'Last 30 Days',
         value: 'last30Days',
         getTimeRange: () => {
            const start = new Date(today);
            start.setDate(start.getDate() - 30);
            return {
               start: start.toISOString(),
               end: now.toISOString(),
               label: 'Last 30 Days',
            };
         },
      },
      thisMonth: {
         label: 'This Month',
         value: 'thisMonth',
         getTimeRange: () => {
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            return {
               start: start.toISOString(),
               end: now.toISOString(),
               label: 'This Month',
            };
         },
      },
      lastMonth: {
         label: 'Last Month',
         value: 'lastMonth',
         getTimeRange: () => {
            const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const end = new Date(now.getFullYear(), now.getMonth(), 1);
            return {
               start: start.toISOString(),
               end: end.toISOString(),
               label: 'Last Month',
            };
         },
      },
   };
};
