/**
 * Report API Client
 * Handles all reporting-related API calls
 */

import { apiClient } from './client';
import type {
   Report,
   ReportTemplate,
   ReportSchedule,
   GenerateReportParams,
   ExportOptions,
   EmailParams,
   AIInsights,
   ReportListResponse,
   TemplateListResponse,
   ScheduleListResponse,
   GenerateReportResponse,
   ExportResponse,
   SendEmailResponse,
} from '@/types/report';

/**
 * Report API Class
 * Provides methods for report generation, management, and export
 */
export class ReportAPI {
   // ==================== Report Generation ====================

   /**
    * Generate a new report
    */
   static async generate(params: any): Promise<Report> {
      const response = await apiClient.post<any>(
         '/api/v1/reports/generate',
         params,
         { timeout: 120000 } // 2 minutes timeout for report generation
      );

      // Backend returns the report directly, not wrapped in GenerateReportResponse
      return response;
   }

   // ==================== Report Management ====================

   /**
    * Get list of reports with pagination
    */
   static async getReports(page: number = 1, pageSize: number = 20): Promise<ReportListResponse> {
      return await apiClient.get<ReportListResponse>('/api/v1/reports', {
         params: {
            page: String(page),
            pageSize: String(pageSize),
         },
         timeout: 30000,
      });
   }

   /**
    * Get a single report by ID
    */
   static async getReportById(reportId: string): Promise<Report> {
      return await apiClient.get<Report>(`/api/v1/reports/${reportId}`, {
         timeout: 30000,
      });
   }

   /**
    * Delete a report
    */
   static async deleteReport(reportId: string): Promise<void> {
      await apiClient.delete(`/api/v1/reports/${reportId}`, {
         timeout: 10000,
      });
   }

   /**
    * Get report history
    */
   static async getReportHistory(days: number = 30): Promise<ReportListResponse> {
      return await apiClient.get<ReportListResponse>('/api/v1/reports/history', {
         params: { days: String(days) },
         timeout: 30000,
      });
   }

   // ==================== Template Management ====================

   /**
    * Get all report templates
    */
   static async getTemplates(): Promise<TemplateListResponse> {
      return await apiClient.get<TemplateListResponse>('/api/v1/reports/templates', {
         timeout: 30000,
      });
   }

   /**
    * Save a new template
    */
   static async saveTemplate(
      templateData: Omit<ReportTemplate, 'id' | 'createdAt' | 'updatedAt'>
   ): Promise<ReportTemplate> {
      return await apiClient.post<ReportTemplate>('/api/v1/reports/templates', templateData, {
         timeout: 30000,
      });
   }

   /**
    * Update an existing template
    */
   static async updateTemplate(
      templateId: string,
      updates: Partial<ReportTemplate>
   ): Promise<ReportTemplate> {
      return await apiClient.put<ReportTemplate>(`/api/v1/reports/templates/${templateId}`, updates, {
         timeout: 30000,
      });
   }

   /**
    * Delete a template
    */
   static async deleteTemplate(templateId: string): Promise<void> {
      await apiClient.delete(`/api/v1/reports/templates/${templateId}`, {
         timeout: 10000,
      });
   }

   /**
    * Get a single template by ID
    */
   static async getTemplateById(templateId: string): Promise<ReportTemplate> {
      return await apiClient.get<ReportTemplate>(`/api/v1/reports/templates/${templateId}`, {
         timeout: 30000,
      });
   }

   // ==================== Schedule Management ====================

   /**
    * Get all report schedules
    */
   static async getSchedules(): Promise<ScheduleListResponse> {
      return await apiClient.get<ScheduleListResponse>('/api/v1/reports/schedules', {
         timeout: 30000,
      });
   }

   /**
    * Create a new schedule
    */
   static async createSchedule(
      scheduleData: Omit<ReportSchedule, 'id' | 'createdAt' | 'updatedAt'>
   ): Promise<ReportSchedule> {
      return await apiClient.post<ReportSchedule>('/api/v1/reports/schedules', scheduleData, {
         timeout: 30000,
      });
   }

   /**
    * Update an existing schedule
    */
   static async updateSchedule(
      scheduleId: string,
      updates: Partial<ReportSchedule>
   ): Promise<ReportSchedule> {
      return await apiClient.put<ReportSchedule>(
         `/api/v1/reports/schedules/${scheduleId}`,
         updates,
         {
            timeout: 30000,
         }
      );
   }

   /**
    * Delete a schedule
    */
   static async deleteSchedule(scheduleId: string): Promise<void> {
      await apiClient.delete(`/api/v1/reports/schedules/${scheduleId}`, {
         timeout: 10000,
      });
   }

   /**
    * Get a single schedule by ID
    */
   static async getScheduleById(scheduleId: string): Promise<ReportSchedule> {
      return await apiClient.get<ReportSchedule>(`/api/v1/reports/schedules/${scheduleId}`, {
         timeout: 30000,
      });
   }

   // ==================== Export ====================

   /**
    * Export report to specified format
    */
   static async exportReport(reportId: string, options: ExportOptions): Promise<Blob> {
      const response = await apiClient.post<ExportResponse>(
         `/api/v1/reports/${reportId}/export`,
         options,
         {
            timeout: 120000, // 2 minutes for export generation
         }
      );

      // Download the exported file
      const fileResponse = await fetch(response.url);
      return await fileResponse.blob();
   }

   /**
    * Download report file
    */
   static async downloadReport(reportId: string, format: string): Promise<Blob> {
      const url = `/api/v1/reports/download/${reportId}?format=${format}`;

      const response = await fetch(url, {
         method: 'GET',
         headers: {
            Accept: 'application/octet-stream',
         },
      });

      if (!response.ok) {
         throw new Error(`Failed to download report: ${response.statusText}`);
      }

      return await response.blob();
   }

   // ==================== Email ====================

   /**
    * Send report via email
    */
   static async sendEmail(reportId: string, params: EmailParams): Promise<SendEmailResponse> {
      return await apiClient.post<SendEmailResponse>(
         `/api/v1/reports/${reportId}/send-email`,
         params,
         {
            timeout: 60000, // 1 minute for email sending
         }
      );
   }

   // ==================== AI Features ====================

   /**
    * Get AI insights for a report
    */
   static async getAIInsights(reportId: string): Promise<AIInsights> {
      return await apiClient.get<AIInsights>(`/api/v1/reports/${reportId}/ai-insights`, {
         timeout: 60000, // 1 minute for AI analysis
      });
   }

   /**
    * Generate AI insights for existing report
    */
   static async generateAIInsights(reportId: string): Promise<AIInsights> {
      return await apiClient.post<AIInsights>(`/api/v1/reports/${reportId}/ai-insights`, {}, {
         timeout: 120000, // 2 minutes for AI analysis
      });
   }

   // ==================== Utility Methods ====================

   /**
    * Preview report before saving
    */
   static async previewReport(params: GenerateReportParams): Promise<Report> {
      return await apiClient.post<Report>('/api/v1/reports/preview', params, {
         timeout: 60000,
      });
   }

   /**
    * Get available report types
    */
   static async getReportTypes(): Promise<
      Array<{
         type: string;
         name: string;
         description: string;
         features: string[];
      }>
   > {
      return await apiClient.get('/api/v1/reports/types', {
         timeout: 10000,
      });
   }

   /**
    * Get report statistics
    */
   static async getReportStats(): Promise<{
      totalReports: number;
      reportsThisMonth: number;
      activeSchedules: number;
      totalTemplates: number;
   }> {
      return await apiClient.get('/api/v1/reports/stats', {
         timeout: 10000,
      });
   }

   /**
    * Validate schedule configuration
    */
   static async validateSchedule(
      schedule: Partial<ReportSchedule>
   ): Promise<{
      valid: boolean;
      errors?: string[];
      warnings?: string[];
   }> {
      return await apiClient.post('/api/v1/reports/schedules/validate', schedule, {
         timeout: 10000,
      });
   }

   /**
    * Export report
    */
   static async exportReportFile(reportId: string, format: string = 'PDF'): Promise<Blob> {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/v1/reports/${reportId}/export?format=${format}`, {
         method: 'GET',
         headers: {
            'Accept': 'application/pdf',
         },
      });

      if (!response.ok) {
         throw new Error(`Failed to export report: ${response.statusText}`);
      }

      return await response.blob();
   }

   /**
    * Send report via email
    */
   static async sendReportEmail(reportId: string, recipients: string[], subject?: string, message?: string): Promise<any> {
      return await apiClient.post(`/api/v1/reports/${reportId}/send-email`, {
         recipients,
         subject: subject || 'Ceph Cluster Report',
         message: message || 'Please find the attached cluster report.',
         format: 'PDF',
      }, {
         timeout: 60000,
      });
   }
}

// ==================== Helper Functions ====================

/**
 * Helper function to download blob as file
 */
export const downloadBlob = (blob: Blob, filename: string) => {
   const url = window.URL.createObjectURL(blob);
   const link = document.createElement('a');
   link.href = url;
   link.download = filename;
   document.body.appendChild(link);
   link.click();
   document.body.removeChild(link);
   window.URL.revokeObjectURL(url);
};

/**
 * Helper function to get file extension for export format
 */
export const getFileExtension = (format: string): string => {
   const extensions: Record<string, string> = {
      pdf: 'pdf',
      html: 'html',
      excel: 'xlsx',
      json: 'json',
   };
   return extensions[format] || 'pdf';
};

/**
 * Helper function to generate filename for export
 */
export const generateExportFilename = (reportType: string, format: string): string => {
   const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
   const extension = getFileExtension(format);
   return `${reportType}-report-${timestamp}.${extension}`;
};

// Export as default for convenience
export default ReportAPI;
