import { getSupabaseAdmin } from '../providers/supabase-admin.provider.js';
import { AppError } from '../middleware/error.middleware.js';
import { completedBooks, computeAccess, kstDateKey, type LearningEvent } from '@tangobook/shared';
import { resolveGrantUpdate, type GrantInput, type EntitlementValues } from './members-grant.js';
import { summarizeChildActivity, type ChildActivitySummary } from './members-activity.js';

type Admin = NonNullable<ReturnType<typeof getSupabaseAdmin>>;

function requireAdmin(): Admin {
  const admin = getSupabaseAdmin();
  if (!admin) throw new AppError(503, 'Supabase 미설정 — 회원 대시보드를 사용할 수 없습니다');
  return admin;
}

interface EntitlementRow extends EntitlementValues {
  account_id: string;
  referral_code: string | null;
  referred_by: string | null;
}

/** Supabase Auth 전체 유저의 banned_until 매핑(listUsers 페이지네이션 — 스펙). */
async function fetchBannedMap(admin: Admin): Promise<Map<string, string | null>> {
  const map = new Map<string, string | null>();
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new AppError(500, `유저 목록 조회 실패: ${error.message}`);
    for (const u of data.users) {
      map.set(u.id, (u as { banned_until?: string | null }).banned_until ?? null);
    }
    if (data.users.length < 1000) break;
  }
  return map;
}

const isBanned = (bannedUntil: string | null | undefined, now: number) =>
  !!bannedUntil && Date.parse(bannedUntil) > now;

/** entitlement → computeAccess 입력 매핑 — 클라 useAccess와 동일 규칙(paid_until = active 구독). */
function accessOf(createdAt: string, ent: EntitlementRow | undefined, now: number) {
  return computeAccess(
    {
      account: { createdAt },
      subscription: ent?.paid_until ? { status: 'active', currentPeriodEnd: ent.paid_until } : null,
      referralBonusDays: ent?.referral_bonus_days ?? 0,
      trialStartedAt: ent?.trial_started_at ?? null,
    },
    now
  );
}

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

export async function listMembers(): Promise<MembersOverview> {
  const admin = requireAdmin();
  const now = Date.now();
  const [accountsRes, profilesRes, eventsRes, entRes, bannedMap] = await Promise.all([
    admin.from('accounts').select('id, email, created_at'),
    admin.from('child_profiles').select('id, account_id'),
    admin
      .from('learning_events')
      .select('id, profile_id, event_type, storybook_id, game_type, word, metadata, created_at')
      .order('created_at', { ascending: false })
      .limit(100000),
    admin.from('entitlements').select('*'),
    fetchBannedMap(admin),
  ]);
  const err = accountsRes.error ?? profilesRes.error ?? eventsRes.error ?? entRes.error;
  if (err) throw new AppError(500, `회원 목록 조회 실패: ${err.message}`);

  const accounts = accountsRes.data ?? [];
  const profiles = profilesRes.data ?? [];
  const events = (eventsRes.data ?? []) as LearningEvent[];
  // 🔴 `as const` 필수 — 콜백 param 을 타입 주석하면 배열 리터럴이 튜플로 추론되지 않아
  // Map 생성자(readonly [K,V][])에 안 맞음(typecheck 실패).
  const entByAccount = new Map(
    (entRes.data ?? []).map((e: EntitlementRow) => [e.account_id, e] as const)
  );
  // 초대 집계 — referred_by(피초대자 행에 저장된 초대자 id)를 역으로 세어 계정별 "초대한 수" 계산.
  const invitedCountByAccount = new Map<string, number>();
  let invitesRedeemed = 0;
  for (const e of (entRes.data ?? []) as EntitlementRow[]) {
    if (!e.referred_by) continue;
    invitesRedeemed++;
    invitedCountByAccount.set(e.referred_by, (invitedCountByAccount.get(e.referred_by) ?? 0) + 1);
  }

  // 계정별 자녀 id 셋 + 이벤트 묶기
  const accountByProfile = new Map(profiles.map((p) => [p.id, p.account_id]));
  const eventsByAccount = new Map<string, LearningEvent[]>();
  for (const e of events) {
    const acc = accountByProfile.get(e.profile_id);
    if (!acc) continue;
    (eventsByAccount.get(acc) ?? eventsByAccount.set(acc, []).get(acc)!).push(e);
  }
  const childrenByAccount = new Map<string, number>();
  for (const p of profiles)
    childrenByAccount.set(p.account_id, (childrenByAccount.get(p.account_id) ?? 0) + 1);

  const todayKst = kstDateKey(new Date(now).toISOString());
  let activeToday = 0;
  const members: MemberSummary[] = accounts.map((a) => {
    const ent = entByAccount.get(a.id);
    const accEvents = eventsByAccount.get(a.id) ?? [];
    const access = accessOf(a.created_at, ent, now);
    let lastActiveAt: string | null = null;
    for (const e of accEvents) {
      if (!lastActiveAt || e.created_at > lastActiveAt) lastActiveAt = e.created_at;
    }
    // 완독 = shared completedBooks(distinct 책, totalPages 가드) — 상세/부모 리포트와 정의 통일
    const completed = completedBooks(accEvents).length;
    if (lastActiveAt && kstDateKey(lastActiveAt) === todayKst) activeToday++;
    return {
      accountId: a.id,
      email: a.email ?? '(이메일 없음)',
      createdAt: a.created_at,
      children: childrenByAccount.get(a.id) ?? 0,
      status: access.status,
      trialDaysLeft: access.trialDaysLeft,
      paidUntil: ent?.paid_until ?? null,
      bonusDays: ent?.referral_bonus_days ?? 0,
      trialStartedAt: ent?.trial_started_at ?? null,
      lastActiveAt,
      completedBooks: completed,
      invitedCount: invitedCountByAccount.get(a.id) ?? 0,
      banned: isBanned(bannedMap.get(a.id), now),
    };
  });
  members.sort((a, b) => (b.lastActiveAt ?? '').localeCompare(a.lastActiveAt ?? ''));

  return {
    generatedAt: new Date(now).toISOString(),
    totals: {
      members: members.length,
      activeToday,
      trial: members.filter((m) => m.status === 'trial').length,
      subscribed: members.filter((m) => m.status === 'subscribed').length,
      expired: members.filter((m) => m.status === 'expired').length,
      invitesRedeemed,
    },
    members,
  };
}

export interface MemberDetail {
  account: {
    id: string;
    email: string;
    createdAt: string;
    banned: boolean;
    bannedUntil: string | null;
  };
  access: ReturnType<typeof computeAccess>;
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
  children: Array<{ profileId: string; name: string } & ChildActivitySummary>;
}

async function fetchAccount(admin: Admin, accountId: string) {
  const { data, error } = await admin
    .from('accounts')
    .select('id, email, created_at')
    .eq('id', accountId)
    .maybeSingle();
  if (error) throw new AppError(500, `계정 조회 실패: ${error.message}`);
  if (!data) throw new AppError(404, '계정을 찾을 수 없습니다');
  return data;
}

export async function getMemberDetail(accountId: string): Promise<MemberDetail> {
  const admin = requireAdmin();
  const now = new Date();
  const account = await fetchAccount(admin, accountId);
  const [profilesRes, entRes, invitedRes, paymentsRes, userRes] = await Promise.all([
    admin.from('child_profiles').select('id, name').eq('account_id', accountId),
    admin.from('entitlements').select('*').eq('account_id', accountId).maybeSingle(),
    admin.from('entitlements').select('account_id').eq('referred_by', accountId),
    admin
      .from('payments')
      .select('order_id, plan, amount, status, created_at, paid_at')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false }),
    admin.auth.admin.getUserById(accountId),
  ]);
  const err = profilesRes.error ?? entRes.error ?? invitedRes.error ?? paymentsRes.error;
  if (err) throw new AppError(500, `상세 조회 실패: ${err.message}`);

  const profiles = profilesRes.data ?? [];
  const profileIds = profiles.map((p) => p.id);
  let events: LearningEvent[] = [];
  if (profileIds.length > 0) {
    const evRes = await admin
      .from('learning_events')
      .select('id, profile_id, event_type, storybook_id, game_type, word, metadata, created_at')
      .in('profile_id', profileIds)
      .order('created_at', { ascending: false })
      .limit(50000);
    if (evRes.error) throw new AppError(500, `이벤트 조회 실패: ${evRes.error.message}`);
    events = (evRes.data ?? []) as LearningEvent[];
  }

  const ent = (entRes.data ?? null) as EntitlementRow | null;
  const bannedUntil =
    (userRes.data?.user as { banned_until?: string | null } | null)?.banned_until ?? null;

  // 초대자(referred_by) + 피초대자(invitedRes) 계정 id → 이메일 해석(accounts 1회 조회).
  const invitedAccountIds = (invitedRes.data ?? []).map((r) => r.account_id as string);
  const referredById = ent?.referred_by ?? null;
  const emailIds = [...new Set([...invitedAccountIds, ...(referredById ? [referredById] : [])])];
  const emailById = new Map<string, string>();
  if (emailIds.length > 0) {
    const { data: emailRows, error: emailErr } = await admin
      .from('accounts')
      .select('id, email')
      .in('id', emailIds);
    if (emailErr) throw new AppError(500, `초대 이메일 조회 실패: ${emailErr.message}`);
    for (const r of emailRows ?? []) emailById.set(r.id, r.email ?? '(이메일 없음)');
  }
  const invitedEmails = invitedAccountIds.map((id) => emailById.get(id) ?? '(알 수 없음)');
  const referredByEmail = referredById ? (emailById.get(referredById) ?? '(알 수 없음)') : null;

  return {
    account: {
      id: account.id,
      email: account.email ?? '(이메일 없음)',
      createdAt: account.created_at,
      banned: isBanned(bannedUntil, now.getTime()),
      bannedUntil,
    },
    access: accessOf(account.created_at, ent ?? undefined, now.getTime()),
    entitlement: {
      paidUntil: ent?.paid_until ?? null,
      bonusDays: ent?.referral_bonus_days ?? 0,
      trialStartedAt: ent?.trial_started_at ?? null,
      referralCode: ent?.referral_code ?? null,
      referredBy: ent?.referred_by ?? null,
      referredByEmail,
    },
    invitedCount: invitedAccountIds.length,
    invitedEmails,
    payments: (paymentsRes.data ?? []).map((p) => ({
      orderId: p.order_id,
      plan: p.plan,
      amount: p.amount,
      status: p.status,
      createdAt: p.created_at,
      paidAt: p.paid_at,
    })),
    children: profiles.map((p) => ({
      profileId: p.id,
      name: p.name,
      ...summarizeChildActivity(
        events.filter((e) => e.profile_id === p.id),
        now
      ),
    })),
  };
}

export async function grantMember(accountId: string, input: GrantInput): Promise<void> {
  const admin = requireAdmin();
  await fetchAccount(admin, accountId); // 404 가드
  const { data: ent, error } = await admin
    .from('entitlements')
    .select('trial_started_at, referral_bonus_days, paid_until')
    .eq('account_id', accountId)
    .maybeSingle();
  if (error) throw new AppError(500, `entitlement 조회 실패: ${error.message}`);
  const existing: EntitlementValues = ent ?? {
    trial_started_at: null,
    referral_bonus_days: 0,
    paid_until: null,
  };
  const update = resolveGrantUpdate(input, existing);
  const { error: upErr } = await admin
    .from('entitlements')
    .upsert(
      { account_id: accountId, ...update, updated_at: new Date().toISOString() },
      { onConflict: 'account_id' }
    );
  if (upErr) throw new AppError(500, `entitlement 갱신 실패: ${upErr.message}`);
  console.log(`[members] grant ${JSON.stringify(input)} → ${accountId}`); // 감사 로그(스펙: 콘솔)
}

export async function setMemberBan(accountId: string, banned: boolean): Promise<void> {
  const admin = requireAdmin();
  await fetchAccount(admin, accountId);
  const { error } = await admin.auth.admin.updateUserById(accountId, {
    ban_duration: banned ? '876000h' : 'none', // ≈100년 / 해제
  });
  if (error) throw new AppError(500, `차단 갱신 실패: ${error.message}`);
  console.log(`[members] ban=${banned} → ${accountId}`);
}

export async function deleteMember(accountId: string): Promise<void> {
  const admin = requireAdmin();
  await fetchAccount(admin, accountId);
  const { error } = await admin.auth.admin.deleteUser(accountId); // accounts FK cascade
  if (error) throw new AppError(500, `계정 삭제 실패: ${error.message}`);
  console.log(`[members] DELETE → ${accountId}`);
}
