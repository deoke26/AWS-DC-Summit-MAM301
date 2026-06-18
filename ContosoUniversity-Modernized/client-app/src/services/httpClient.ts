import axios from 'axios';
import type { AxiosResponse } from 'axios';
import type { ValidationError } from '../types/common';
import type { ConcurrencyConflict } from '../types/department';

// Custom event for global error notifications (500/network/timeout)
export const HTTP_ERROR_EVENT = 'http-error-notification';

export interface HttpErrorDetail {
  message: string;
  autoDismissMs: number;
}

/**
 * Dispatch a custom event that the ErrorNotification component will listen to.
 */
function emitErrorNotification(message: string): void {
  const detail: HttpErrorDetail = { message, autoDismissMs: 8000 };
  window.dispatchEvent(new CustomEvent<HttpErrorDetail>(HTTP_ERROR_EVENT, { detail }));
}

/**
 * Centralized axios instance configured with /api base path and 30-second timeout.
 */
const apiClient = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

// Response interceptor for centralized error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      emitErrorNotification('An unexpected error occurred. Please try again.');
      return Promise.reject(error);
    }

    const status = error.response?.status;

    // 404 → navigate to Not Found page
    if (status === 404) {
      window.location.href = '/not-found';
      return Promise.reject(error);
    }

    // 409 → typed ConcurrencyConflict rejection
    if (status === 409) {
      const conflict: ConcurrencyConflict = {
        currentValues: error.response?.data?.currentValues,
        message: error.response?.data?.message ?? 'A concurrency conflict occurred.',
      };
      return Promise.reject(conflict);
    }

    // 400 → typed ValidationError rejection
    if (status === 400) {
      const responseData = error.response?.data;
      const errorsMap: Record<string, string[]> = responseData?.errors ?? {};
      const validationErrors: ValidationError[] = Object.entries(errorsMap).map(
        ([field, messages]) => ({
          field,
          message: messages.join('; '),
        })
      );
      return Promise.reject(validationErrors);
    }

    // 500 / network error / timeout → emit error notification with 8s auto-dismiss
    if (status && status >= 500) {
      emitErrorNotification('A server error occurred. Please try again later.');
    } else if (error.code === 'ECONNABORTED') {
      emitErrorNotification('The request timed out. Please try again.');
    } else {
      emitErrorNotification('A network error occurred. Please check your connection.');
    }

    return Promise.reject(error);
  }
);

// Typed helper methods

export async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const response = await apiClient.get<T>(url, { params });
  return response.data;
}

export async function post<T>(url: string, data?: unknown): Promise<T> {
  const response = await apiClient.post<T>(url, data);
  return response.data;
}

export async function put<T>(url: string, data?: unknown): Promise<T> {
  const response = await apiClient.put<T>(url, data);
  return response.data;
}

export async function del(url: string): Promise<void> {
  await apiClient.delete(url);
}

export async function postForm<T>(url: string, formData: FormData): Promise<T> {
  const response = await apiClient.post<T>(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function putForm<T>(url: string, formData: FormData): Promise<T> {
  const response = await apiClient.put<T>(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export default apiClient;
