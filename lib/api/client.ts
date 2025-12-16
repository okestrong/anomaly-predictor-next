// API Client Configuration using native fetch
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL as string;
const API_TIMEOUT = 90000; // 30 seconds

// ========== Locale Utilities (i18n support) ==========

/**
 * 현재 locale 코드 가져오기
 * 일단 'ko'로 하드코딩하고, 향후 i18n 라우팅 적용 시 URL path에서 추출
 * @returns locale 코드 (예: "ko", "en")
 */
export const getCurrentLocale = (): string => {
   // TODO: 향후 i18n 라우팅 적용 시 URL path에서 추출
   // const pathLocale = window.location.pathname.split('/')[1];
   // if (['ko', 'en', 'ja'].includes(pathLocale)) return pathLocale;
   return 'ko'; // 현재는 한국어 고정
};

/**
 * Accept-Language 헤더에 사용할 locale 반환
 * navigator.language 형식(ko-KR)이 아닌 간단한 형식(ko) 사용
 */
export const getAcceptLanguage = (): string => {
   return getCurrentLocale();
};

// Custom error class for API errors
export class ApiError extends Error {
   constructor(
      message: string,
      public status: number,
      public statusText: string,
      public data?: any,
   ) {
      super(message);
      this.name = 'ApiError';
   }
}

// Request configuration interface
interface RequestConfig extends RequestInit {
   timeout?: number;
   params?: Record<string, string>;
}

// Helper function to build URL with query parameters
const buildUrl = (endpoint: string, params?: Record<string, string>): string => {
   const url = new URL(endpoint, API_BASE_URL);

   if (params) {
      Object.entries(params).forEach(([key, value]) => {
         url.searchParams.append(key, value);
      });
   }

   return url.toString();
};

// Helper function to handle fetch with timeout
const fetchWithTimeout = async (url: string, config: RequestConfig = {}): Promise<Response> => {
   const { timeout = API_TIMEOUT, ...fetchConfig } = config;

   const controller = new AbortController();
   const timeoutId = setTimeout(() => controller.abort(), timeout);

   try {
      const response = await fetch(url, {
         ...fetchConfig,
         signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
   } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
         throw new ApiError('Request timeout', 408, 'Request Timeout');
      }

      throw error;
   }
};

// Helper function to get default headers
const getDefaultHeaders = (): HeadersInit => {
   const headers: HeadersInit = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Accept-Language': getAcceptLanguage(), // i18n 지원: 현재 locale 전달
   };

   // Add authentication token if available (client-side only)
   if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
         headers['Authorization'] = `Bearer ${token}`;
      }
   }

   return headers;
};

// Helper function to handle response
const handleResponse = async <T>(response: Response): Promise<T> => {
   // Log response in development
   if (process.env.NODE_ENV === 'development') {
      console.log(`✅ [FRONTEND] API Response: ${response.status} ${response.url}`);
   }

   if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let errorData: any = null;

      try {
         errorData = await response.json();
         errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
         // Response is not JSON, use status text
      }

      // Handle common error cases
      switch (response.status) {
         case 401:
            console.warn('🔒 Unauthorized access');
            if (typeof window !== 'undefined') {
               localStorage.removeItem('auth_token');
            }
            break;
         case 403:
            console.warn('🚫 Forbidden access');
            break;
         case 404:
            console.warn('🔍 Resource not found');
            break;
         case 500:
            console.error('💥 Internal server error');
            break;
         default:
            console.error(`❌ API Error ${response.status}:`, errorMessage);
      }

      throw new ApiError(errorMessage, response.status, response.statusText, errorData);
   }

   try {
      return await response.json();
   } catch (error) {
      // Response is not JSON (e.g., 204 No Content)
      return null as T;
   }
};

// Main API client object
export const apiClient = {
   async get<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
      const { params, ...fetchConfig } = config;
      const url = buildUrl(endpoint, params);

      if (process.env.NODE_ENV === 'development') {
         console.log(`🚀 [FRONTEND] API Request: GET ${url}`);
      }

      const response = await fetchWithTimeout(url, {
         method: 'GET',
         headers: {
            ...getDefaultHeaders(),
            ...fetchConfig.headers,
         },
         ...fetchConfig,
      });

      return handleResponse<T>(response);
   },

   async post<T>(endpoint: string, data?: any, config: RequestConfig = {}): Promise<T> {
      const url = buildUrl(endpoint);

      if (process.env.NODE_ENV === 'development') {
         console.log(`🚀 API Request: POST ${url}`);
      }

      const response = await fetchWithTimeout(url, {
         method: 'POST',
         headers: {
            ...getDefaultHeaders(),
            ...config.headers,
         },
         body: data ? JSON.stringify(data) : undefined,
         ...config,
      });

      return handleResponse<T>(response);
   },

   async put<T>(endpoint: string, data?: any, config: RequestConfig = {}): Promise<T> {
      const url = buildUrl(endpoint);

      if (process.env.NODE_ENV === 'development') {
         console.log(`🚀 API Request: PUT ${url}`);
      }

      const response = await fetchWithTimeout(url, {
         method: 'PUT',
         headers: {
            ...getDefaultHeaders(),
            ...config.headers,
         },
         body: data ? JSON.stringify(data) : undefined,
         ...config,
      });

      return handleResponse<T>(response);
   },

   async patch<T>(endpoint: string, data?: any, config: RequestConfig = {}): Promise<T> {
      const url = buildUrl(endpoint);

      if (process.env.NODE_ENV === 'development') {
         console.log(`🚀 API Request: PATCH ${url}`);
      }

      const response = await fetchWithTimeout(url, {
         method: 'PATCH',
         headers: {
            ...getDefaultHeaders(),
            ...config.headers,
         },
         body: data ? JSON.stringify(data) : undefined,
         ...config,
      });

      return handleResponse<T>(response);
   },

   async delete<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
      const url = buildUrl(endpoint);

      if (process.env.NODE_ENV === 'development') {
         console.log(`🚀 API Request: DELETE ${url}`);
      }

      const response = await fetchWithTimeout(url, {
         method: 'DELETE',
         headers: {
            ...getDefaultHeaders(),
            ...config.headers,
         },
         ...config,
      });

      return handleResponse<T>(response);
   },
};

// Utility functions for common use cases
export const api = apiClient;

// Health check function
export const checkApiHealth = async (): Promise<boolean> => {
   try {
      await apiClient.get('/api/dashboard/status', { timeout: 5000 });
      return true;
   } catch (error) {
      console.error('API health check failed:', error);
      return false;
   }
};

// Retry mechanism for critical requests
export const apiWithRetry = async <T>(requestFn: () => Promise<T>, maxRetries: number = 3, retryDelay: number = 1000): Promise<T> => {
   let lastError: any;

   for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
         return await requestFn();
      } catch (error) {
         lastError = error;

         if (attempt === maxRetries) {
            break;
         }

         console.warn(`🔄 API request failed (attempt ${attempt}/${maxRetries}), retrying in ${retryDelay}ms...`);
         await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
   }

   throw lastError;
};

// Helper function for Next.js Server Actions (if needed)
export const createServerActionClient = (baseUrl?: string) => {
   const serverBaseUrl = baseUrl || process.env.API_URL;

   return {
      async get<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
         const { params } = config;
         const url = new URL(endpoint, serverBaseUrl);

         if (params) {
            Object.entries(params).forEach(([key, value]) => {
               url.searchParams.append(key, value);
            });
         }

         const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
               'Content-Type': 'application/json',
               Accept: 'application/json',
            },
            next: { revalidate: 0 }, // Disable caching for real-time data
         });

         return handleResponse<T>(response);
      },

      // Add other methods as needed for server actions
   };
};
