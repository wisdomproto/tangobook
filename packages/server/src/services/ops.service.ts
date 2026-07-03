import { getSupabaseAdmin } from '../providers/supabase-admin.provider.js';
import { R2Repository } from '../repositories/r2.repository.js';
import { AppError } from '../middleware/error.middleware.js';

/**
 * 내부 운영 대시보드(/ops) 집계 — first-party 데이터(Supabase)가 진실의 원천.
 * 런칭 초기 규모(수천 행 이하) 전제로 JS 집계. 이벤트가 수십만 행이 되면 SQL RPC 로 이전.
 */

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** timestamptz → KST 날짜 문자열 (YYYY-MM-DD). 리포트(aggregate.ts)와 동일 기준. */
function kstDate(ts: string): string {
  return new Date(new Date(ts).getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);
}

function lastNDates(n: number): string[] {
  const out: string[] = [];
  const todayKst = new Date(Date.now() + KST_OFFSET_MS);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(todayKst);
    d.setUTCDate(d.getUTCDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

interface DayCount {
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
  signupsByDay: DayCount[]; // 14일
  activeProfilesByDay: DayCount[]; // 14일, 이벤트 있는 distinct 자녀
  eventsByType: Array<{ type: string; count: number }>;
  topBooks: Array<{ storybookId: string; title: string; reads: number }>;
  retention: { d1: number | null; d7: number | null; cohortSize: number };
  recentAccounts: Array<{ email: string; createdAt: string; children: number }>;
}

export async function getOpsOverview(): Promise<OpsOverview> {
  const admin = getSupabaseAdmin();
  if (!admin) throw new AppError(503, 'Supabase 미설정 — 운영 대시보드를 사용할 수 없습니다');

  const [accountsRes, profilesRes, eventsRes, paymentsRes, entitlementsRes] = await Promise.all([
    admin.from('accounts').select('id, email, created_at'),
    admin.from('child_profiles').select('id, account_id, created_at'),
    // 런칭 초기 전량 fetch — 이벤트 폭증 시 30일 필터 + count 쿼리로 전환
    admin
      .from('learning_events')
      .select('profile_id, event_type, storybook_id, created_at')
      .order('created_at', { ascending: false })
      .limit(100000),
    admin.from('payments').select('amount, status, paid_at'),
    admin.from('entitlements').select('account_id, paid_until, referred_by'),
  ]);

  const firstError =
    accountsRes.error ??
    profilesRes.error ??
    eventsRes.error ??
    paymentsRes.error ??
    entitlementsRes.error;
  if (firstError) throw new AppError(500, `집계 조회 실패: ${firstError.message}`);

  const accounts = (accountsRes.data ?? []) as Array<{
    id: string;
    email: string | null;
    created_at: string;
  }>;
  const profiles = (profilesRes.data ?? []) as Array<{
    id: string;
    account_id: string;
    created_at: string;
  }>;
  const events = (eventsRes.data ?? []) as Array<{
    profile_id: string;
    event_type: string;
    storybook_id: string | null;
    created_at: string;
  }>;
  const payments = (paymentsRes.data ?? []) as Array<{
    amount: number;
    status: string;
    paid_at: string | null;
  }>;
  const entitlements = (entitlementsRes.data ?? []) as Array<{
    account_id: string;
    paid_until: string | null;
    referred_by: string | null;
  }>;

  const now = Date.now();
  const days14 = lastNDates(14);

  // ── 가입 추이 (14일, KST) ──
  const signupCount = new Map<string, number>();
  for (const a of accounts) {
    const d = kstDate(a.created_at);
    signupCount.set(d, (signupCount.get(d) ?? 0) + 1);
  }
  const signupsByDay = days14.map((date) => ({ date, count: signupCount.get(date) ?? 0 }));

  // ── 활성 자녀 추이 (14일, distinct profile) ──
  const activeByDate = new Map<string, Set<string>>();
  for (const e of events) {
    const d = kstDate(e.created_at);
    if (!activeByDate.has(d)) activeByDate.set(d, new Set());
    activeByDate.get(d)!.add(e.profile_id);
  }
  const activeProfilesByDay = days14.map((date) => ({
    date,
    count: activeByDate.get(date)?.size ?? 0,
  }));

  // ── 이벤트 타입 분포 ──
  const typeCount = new Map<string, number>();
  for (const e of events) typeCount.set(e.event_type, (typeCount.get(e.event_type) ?? 0) + 1);
  const eventsByType = [...typeCount.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  // ── 인기 책 top 10 (page_read 기준) + 제목 매핑 ──
  const bookReads = new Map<string, number>();
  for (const e of events) {
    if (e.event_type !== 'page_read' || !e.storybook_id) continue;
    bookReads.set(e.storybook_id, (bookReads.get(e.storybook_id) ?? 0) + 1);
  }
  let titleById = new Map<string, string>();
  try {
    const summaries = await R2Repository.listStorybooks();
    titleById = new Map(summaries.map((s) => [s.id, s.title]));
  } catch {
    // 제목 매핑 실패해도 대시보드는 id 로 표시
  }
  const topBooks = [...bookReads.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([storybookId, reads]) => ({
      storybookId,
      title: titleById.get(storybookId) ?? storybookId,
      reads,
    }));

  // ── D1/D7 리텐션 (계정 기준: 가입 이후 자녀 이벤트가 D+1 / D+7 내 존재) ──
  const accountByProfile = new Map(profiles.map((p) => [p.id, p.account_id]));
  const eventDatesByAccount = new Map<string, Set<string>>();
  for (const e of events) {
    const acc = accountByProfile.get(e.profile_id);
    if (!acc) continue;
    if (!eventDatesByAccount.has(acc)) eventDatesByAccount.set(acc, new Set());
    eventDatesByAccount.get(acc)!.add(kstDate(e.created_at));
  }
  const DAY = 24 * 60 * 60 * 1000;
  // 코호트 = 가입 후 최소 7일 지난 계정 (아직 7일 안 된 계정은 D7 판정 불가)
  const cohort = accounts.filter((a) => now - new Date(a.created_at).getTime() >= 7 * DAY);
  let d1Kept = 0;
  let d7Kept = 0;
  for (const a of cohort) {
    const signup = new Date(a.created_at).getTime();
    const dates = eventDatesByAccount.get(a.id);
    if (!dates) continue;
    const d1Date = kstDate(new Date(signup + 1 * DAY).toISOString());
    if (dates.has(d1Date)) d1Kept++;
    for (let i = 1; i <= 7; i++) {
      if (dates.has(kstDate(new Date(signup + i * DAY).toISOString()))) {
        d7Kept++;
        break;
      }
    }
  }
  const retention = {
    d1: cohort.length > 0 ? Math.round((d1Kept / cohort.length) * 100) : null,
    d7: cohort.length > 0 ? Math.round((d7Kept / cohort.length) * 100) : null,
    cohortSize: cohort.length,
  };

  // ── 결제/구독/초대 totals ──
  const paidPayments = payments.filter((p) => p.status === 'paid');
  const paidActive = entitlements.filter(
    (e) => e.paid_until && new Date(e.paid_until).getTime() > now
  ).length;
  const referredSignups = entitlements.filter((e) => e.referred_by).length;

  // ── 최근 가입 10 ──
  const childrenByAccount = new Map<string, number>();
  for (const p of profiles)
    childrenByAccount.set(p.account_id, (childrenByAccount.get(p.account_id) ?? 0) + 1);
  const recentAccounts = [...accounts]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10)
    .map((a) => ({
      email: a.email ?? '(이메일 없음)',
      createdAt: a.created_at,
      children: childrenByAccount.get(a.id) ?? 0,
    }));

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      accounts: accounts.length,
      childProfiles: profiles.length,
      eventsTotal: events.length,
      paidActive,
      paidOrders: paidPayments.length,
      revenue: paidPayments.reduce((s, p) => s + p.amount, 0),
      referredSignups,
    },
    signupsByDay,
    activeProfilesByDay,
    eventsByType,
    topBooks,
    retention,
    recentAccounts,
  };
}
