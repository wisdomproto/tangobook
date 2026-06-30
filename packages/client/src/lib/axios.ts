import axios from 'axios';
import type { ApiResponse } from '@tangobook/shared';
import { supabase, isSupabaseConfigured } from './supabase';

export const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: Supabase 세션 토큰 자동 첨부 (getSession은 localStorage 읽기 — 네트워크 없음)
apiClient.interceptors.request.use(async (config) => {
  if (isSupabaseConfigured) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
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
    const data = error.response?.data;
    const serverMsg = data && typeof data === 'object' && 'error' in data ? data.error : null;
    const status = error.response?.status;
    const message = serverMsg
      ? status
        ? `[${status}] ${serverMsg}`
        : serverMsg
      : (error.message ?? '서버 오류가 발생했습니다.');
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

export async function apiPatch<T>(url: string, data?: unknown): Promise<T> {
  const res = await apiClient.patch<ApiResponse<T>>(url, data);
  return (res.data as { success: true; data: T }).data;
}

export async function apiPut<T>(url: string, data?: unknown): Promise<T> {
  const res = await apiClient.put<ApiResponse<T>>(url, data);
  return (res.data as { success: true; data: T }).data;
}
