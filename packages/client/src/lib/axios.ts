import axios from 'axios';
import type { ApiResponse } from '@tangobook/shared';

export const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 응답 인터셉터: { success, data } 구조에서 data 추출
apiClient.interceptors.response.use(
  (response) => {
    const body = response.data as ApiResponse<unknown>;
    if (body && typeof body === 'object' && 'success' in body) {
      if (!body.success) {
        return Promise.reject(new Error(body.error));
      }
    }
    return response;
  },
  (error) => {
    const message =
      (error.response?.data as ApiResponse<unknown> & { error?: string })?.error ??
      error.message ??
      '서버 오류가 발생했습니다.';
    return Promise.reject(new Error(message));
  }
);

export async function apiGet<T>(url: string): Promise<T> {
  const res = await apiClient.get<ApiResponse<T>>(url);
  return (res.data as { success: true; data: T }).data;
}

export async function apiPost<T>(
  url: string,
  data?: unknown,
  config?: { signal?: AbortSignal }
): Promise<T> {
  const res = await apiClient.post<ApiResponse<T>>(url, data, config);
  return (res.data as { success: true; data: T }).data;
}

export async function apiDelete<T>(url: string, data?: unknown): Promise<T> {
  const res = await apiClient.delete<ApiResponse<T>>(url, { data });
  return (res.data as { success: true; data: T }).data;
}
