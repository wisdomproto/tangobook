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

    // 프록시/서버 재시작 창 또는 네트워크 단절 — 우리 서버의 { success, error } 대신
    // 프록시(Railway/Envoy)가 평문 "no healthy upstream" 등을 반환하거나 응답 자체가 없음.
    // 이 경우 파싱 실패 메시지("Unexpected token 'o'…")를 그대로 노출하지 말고 친절 안내 + 재시도
    // 신호(transient)를 준다. (serverMsg 가 있는 정상 AppError 응답은 기존대로 그대로 전달.)
    const isTransient =
      !serverMsg &&
      (!error.response || // 네트워크/타임아웃
        (typeof status === 'number' && status >= 500) || // 5xx (502/503/504 = 프록시 upstream 다운)
        typeof data === 'string'); // 서버가 아닌 프록시가 평문 바디 반환

    if (isTransient) {
      const err = new Error(
        '서버가 잠시 응답하지 않고 있어요. 잠시 후 다시 시도해 주세요.'
      ) as Error & {
        transient?: boolean;
      };
      err.transient = true;
      return Promise.reject(err);
    }

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
