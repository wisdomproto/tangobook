import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@tangobook/shared';
import { getStoredOpsPassword } from '@/features/ops/api/ops.api';

// ── 서버 members.service 응답 미러 타입 ──
export interface MemberSummary {
  accountId: string;
  email: string;
  createdAt: string;
  children: number;
  status: 'trial' | 'subscribed' | 'expired' | 'guest';
  trialDaysLeft: number;
  paidUntil: string | null;
  bonusDays: number;
  trialStartedAt: string | null;
  lastActiveAt: string | null;
  completedBooks: number;
  invitedCount: number;
  banned: boolean;
}
export interface MembersOverview {
  generatedAt: string;
  totals: {
    members: number;
    activeToday: number;
    trial: number;
    subscribed: number;
    expired: number;
    invitesRedeemed: number;
  };
  members: MemberSummary[];
}
export interface WeekDay {
  key: string;
  label: string;
  active: boolean;
}
export interface ChildActivity {
  profileId: string;
  name: string;
  lastActiveAt: string | null;
  completedBooks: number;
  readingMinutes: number;
  streak: number;
  week: WeekDay[];
  wordsMet: number;
  gameSessions: number;
}
export interface MemberDetail {
  account: {
    id: string;
    email: string;
    createdAt: string;
    banned: boolean;
    bannedUntil: string | null;
  };
  access: {
    status: string;
    isEntitled: boolean;
    trialEndsAt: string | null;
    trialDaysLeft: number;
  };
  entitlement: {
    paidUntil: string | null;
    bonusDays: number;
    trialStartedAt: string | null;
    referralCode: string | null;
    referredBy: string | null;
    referredByEmail: string | null;
  };
  invitedCount: number;
  invitedEmails: string[];
  payments: Array<{
    orderId: string;
    plan: string;
    amount: number;
    status: string;
    createdAt: string;
    paidAt: string | null;
  }>;
  children: ChildActivity[];
}
export type GrantInput =
  | { type: 'trial-reset' }
  | { type: 'bonus-days'; days: number }
  | { type: 'paid-until'; until: string };

function opsHeaders() {
  const pw = getStoredOpsPassword();
  return pw ? { 'x-ops-password': pw } : undefined;
}
const unwrap = <T>(res: { data: ApiResponse<T> }): T =>
  (res.data as { success: true; data: T }).data;

export const membersApi = {
  list: async () =>
    unwrap<MembersOverview>(await apiClient.get('/ops/members', { headers: opsHeaders() })),
  detail: async (accountId: string) =>
    unwrap<MemberDetail>(
      await apiClient.get(`/ops/members/${accountId}`, { headers: opsHeaders() })
    ),
  grant: async (accountId: string, input: GrantInput) =>
    unwrap<{ ok: true }>(
      await apiClient.post(`/ops/members/${accountId}/grant`, input, { headers: opsHeaders() })
    ),
  ban: async (accountId: string, banned: boolean) =>
    unwrap<{ ok: true }>(
      await apiClient.post(`/ops/members/${accountId}/ban`, { banned }, { headers: opsHeaders() })
    ),
  remove: async (accountId: string) =>
    unwrap<{ ok: true }>(
      await apiClient.delete(`/ops/members/${accountId}`, { headers: opsHeaders() })
    ),
};
