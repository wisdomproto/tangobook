import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@tangobook/shared';

/** 운영 비밀번호 세션 보관 키 — 탭 닫으면 만료. */
const OPS_PW_KEY = 'tb-ops-password';

export function getStoredOpsPassword(): string | null {
  return sessionStorage.getItem(OPS_PW_KEY);
}
export function storeOpsPassword(pw: string): void {
  sessionStorage.setItem(OPS_PW_KEY, pw);
}
export function clearOpsPassword(): void {
  sessionStorage.removeItem(OPS_PW_KEY);
}

export interface DayCount {
  date: string;
  count: number;
}

export interface OpsOverview {
  generatedAt: string;
  totals: {
    accounts: number;
    childProfiles: number;
    eventsTotal: number;
    paidActive: number;
    paidOrders: number;
    revenue: number;
    referredSignups: number;
  };
  signupsByDay: DayCount[];
  activeProfilesByDay: DayCount[];
  eventsByType: Array<{ type: string; count: number }>;
  topBooks: Array<{ storybookId: string; title: string; reads: number }>;
  retention: { d1: number | null; d7: number | null; cohortSize: number };
  recentAccounts: Array<{ email: string; createdAt: string; children: number }>;
}

export const opsApi = {
  async overview(): Promise<OpsOverview> {
    // 비밀번호가 저장돼 있으면 헤더로 전달 (없으면 로그인 세션 allowlist 경로).
    const pw = getStoredOpsPassword();
    const res = await apiClient.get<ApiResponse<OpsOverview>>('/ops/overview', {
      headers: pw ? { 'x-ops-password': pw } : undefined,
    });
    return (res.data as { success: true; data: OpsOverview }).data;
  },
};
