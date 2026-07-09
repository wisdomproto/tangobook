# 회원 관리 대시보드 (`/members`) Implementation Plan

> ✅ **완료 (2026-07-09)** — Task 1~10 전편 구현·검증·커밋 완료(main). typecheck 전패키지 PASS · 서버 412 tests PASS · API 실검증(401/8054/404) · 브라우저 UI 확인. grant/ban/delete 뮤테이션은 실계정 대상 미실행(프로덕션 Supabase 변경 회피 — 버리는 테스트 계정 권장). 상세 → memory `members-admin-dashboard-2026-07-09`.

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 운영자가 회원을 조회하고 무료 체험/유료 권한 부여·차단·삭제·활동 통계를 처리하는 내부 대시보드(`/members`) 구축.

**Architecture:** 기존 ops 인증(`x-ops-password` or `OPS_EMAILS`)을 미들웨어로 추출해 공유. 서버는 service role로 accounts/child_profiles/learning_events/payments/entitlements를 JS 집계(기존 ops.service 패턴). 읽은시간·streak 공식은 shared로 이동해 부모 리포트와 수치 일치. 클라는 `features/members/` 신규 모듈 + `/members` 라우트(AppShell 밖).

**Tech Stack:** Express v5 · Supabase admin SDK(auth ban/delete) · React 18 + TanStack Query v5 · vitest.

**Spec:** `docs/superpowers/specs/2026-07-09-members-admin-dashboard-design.md`

**전제 (검증된 사실):**
- ops 라우트는 `app.ts:106`에서 `/api/ops`로 마운트, `ops.routes.ts`에 라우트 추가하면 됨.
- `child_profiles.name` 존재(text not null). `accounts.id = auth.users.id`(FK cascade) → `auth.admin.deleteUser` 한 방 삭제 성립.
- `entitlements`는 `account_id` PK — `on conflict account_id` upsert 성립. 컬럼: `paid_until`, `referral_bonus_days`, `referral_code`, `referred_by`, `trial_started_at`, `updated_at`.
- `LearningEvent` 타입(shared)에 `game_type: string | null` 존재.
- 서버 테스트 = `pnpm --filter server test` (vitest run). shared는 클라 테스트(`aggregate.test.ts`)가 re-export 경유로 커버.
- 클라 ops 게이트 헬퍼: `features/ops/api/ops.api.ts`의 `getStoredOpsPassword/storeOpsPassword/clearOpsPassword`.

---

## Chunk 1: Shared 공식 이동 + 서버 (미들웨어 · grant 로직 · 서비스 · 라우트)

### Task 1: 읽은시간·streak 공식을 shared로 이동

**Files:**
- Create: `packages/shared/src/utils/learning-aggregate.ts`
- Modify: `packages/shared/src/index.ts` (export 한 줄)
- Modify: `packages/client/src/features/learning/lib/aggregate.ts` (이동분 삭제 + re-export)

이동 대상(서버가 재사용할 함수만): `kstDateKey` · `estimateReadingMinutes` · `computeStreak` · `completedBooks`(+`CompletedBookStat`) · `weekActivity`(+`WeekDay`). 나머지(groupByWord 등 mastery 의존 함수, `formatKstDate`)는 클라에 유지.

- [x] **Step 1: shared에 파일 생성**

`packages/shared/src/utils/learning-aggregate.ts` — 아래 내용. 함수 본문은 `packages/client/src/features/learning/lib/aggregate.ts`의 해당 함수를 **그대로 복사**(수정 금지 — 수치 일치가 목적). import는 shared 내부 상대경로로 교체:

```ts
// 학습 이벤트 집계 공식 — 부모 리포트(클라)와 운영 대시보드(서버)가 공유.
// 🔴 여기 수치 공식을 바꾸면 두 화면이 함께 바뀐다. 클라 전용 집계는
// packages/client/src/features/learning/lib/aggregate.ts 에 그대로 있음.
import type { LearningEvent } from '../types/learning-events.js';

const SESSION_GAP = 300_000;
const PAGE_CAP = 120_000;
const SESSION_FLOOR = 30_000;

export function kstDateKey(iso: string): string { /* 클라 aggregate.ts:164-167 복사 */ }

export interface CompletedBookStat { storybookId: string; count: number; lastAt: string; }
export function completedBooks(events: LearningEvent[]): CompletedBookStat[] { /* 클라 182-203 복사 */ }

export function estimateReadingMinutes(events: LearningEvent[], _now?: Date): number { /* 클라 214-241 복사 */ }

export function computeStreak(events: LearningEvent[], now: Date): number { /* 클라 249-277 복사 */ }

export interface WeekDay { key: string; label: string; active: boolean; }
const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
export function weekActivity(events: LearningEvent[], now: Date): WeekDay[] { /* 클라 346-356 복사 */ }
```

주의: `learning-events` 타입 경로는 `packages/shared/src/types/learning-events.ts`. shared는 ESM이라 import 확장자 `.js` 필수(Railway 메모리 규칙).

- [x] **Step 2: shared index에 export 추가**

`packages/shared/src/index.ts`의 `export * from './utils/entitlement.js';` 아래에:

```ts
export * from './utils/learning-aggregate.js';
```

- [x] **Step 3: 클라 aggregate.ts를 re-export로 전환**

`packages/client/src/features/learning/lib/aggregate.ts`에서 이동한 5개 함수/타입/상수 정의를 **삭제**하고 파일 상단에 추가:

```ts
// 읽은시간·streak 등 수치 공식은 shared로 이동(운영 대시보드와 공유) — re-export로 기존 import 유지.
export {
  kstDateKey,
  completedBooks,
  estimateReadingMinutes,
  computeStreak,
  weekActivity,
} from '@tangobook/shared';
export type { CompletedBookStat, WeekDay } from '@tangobook/shared';
```

남는 함수 중 `formatKstDate`가 `kstDateKey`를 쓰므로(주: `booksThisWeek`는 ms cutoff 사용 — kstDateKey 안 씀) import가 필요. ⚠️ 같은 이름을 import와 re-export 둘 다 하면 중복 — **위 re-export 블록 대신 아래 형태로**(위 블록을 대체, 둘 다 넣지 말 것):

```ts
import { kstDateKey, completedBooks, estimateReadingMinutes, computeStreak, weekActivity } from '@tangobook/shared';
export { kstDateKey, completedBooks, estimateReadingMinutes, computeStreak, weekActivity };
export type { CompletedBookStat, WeekDay } from '@tangobook/shared';
```

- [x] **Step 4: 기존 테스트로 회귀 확인**

Run: `pnpm --filter shared build && pnpm --filter client test -- aggregate`
Expected: 기존 `aggregate.test.ts` 전부 PASS (import 경로 그대로, re-export 경유).
Run: `pnpm typecheck`
Expected: 전 패키지 PASS.

- [x] **Step 5: Commit**

```bash
git add packages/shared/src packages/client/src/features/learning/lib/aggregate.ts
git commit -m "refactor(shared): move reading-time/streak formulas to shared for ops reuse"
```

### Task 2: ops 인증 미들웨어 추출

**Files:**
- Create: `packages/server/src/middleware/ops-auth.middleware.ts`
- Modify: `packages/server/src/controllers/ops.controller.ts` (private 함수 제거)
- Modify: `packages/server/src/routes/ops.routes.ts` (미들웨어 적용)

- [x] **Step 1: 미들웨어 생성**

`packages/server/src/middleware/ops-auth.middleware.ts` — 기존 `ops.controller.ts:12-39`의 `OPS_PASSWORD`/`OPS_EMAILS`/`requireOpsUser` 본문을 **그대로 이동**하고 미들웨어로 감쌈:

```ts
import type { Request, Response, NextFunction } from 'express';
import { getSupabaseAdmin } from '../providers/supabase-admin.provider.js';
import { AppError } from './error.middleware.js';

// (기존 ops.controller.ts 12-16 상수 이동)
const OPS_PASSWORD = process.env.OPS_PASSWORD ?? '8054';
const OPS_EMAILS = (process.env.OPS_EMAILS ?? 'kil210@tangobook.co.kr')
  .split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);

/** (기존 requireOpsUser 본문 그대로 이동) */
export async function assertOpsUser(req: Request): Promise<void> { /* ops.controller.ts 18-39 복사 */ }

/** ops 계열 라우트 공용 인증 미들웨어 — 비번(x-ops-password) 또는 OPS_EMAILS 로그인. */
export async function opsAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    await assertOpsUser(req);
    next();
  } catch (err) {
    next(err);
  }
}
```

- [x] **Step 2: ops.controller/routes 정리**

`ops.controller.ts`: `requireOpsUser`와 상수 삭제, `getOverview`에서 `await requireOpsUser(req);` 줄 삭제.
`ops.routes.ts`:

```ts
import { opsAuth } from '../middleware/ops-auth.middleware.js';
router.get('/overview', opsAuth, OpsController.getOverview);
```

- [x] **Step 3: 거부 케이스 단위 테스트** (스펙 테스트 항목)

`packages/server/src/middleware/ops-auth.middleware.test.ts` — supabase 불필요한 두 경로만:

```ts
import { describe, it, expect } from 'vitest';
import { assertOpsUser } from './ops-auth.middleware.js';
import type { Request } from 'express';

const reqWith = (headers: Record<string, string>) => ({ headers }) as unknown as Request;

describe('assertOpsUser', () => {
  it('틀린 비밀번호 → 403', async () => {
    await expect(assertOpsUser(reqWith({ 'x-ops-password': 'wrong' }))).rejects.toMatchObject({
      status: 403,
    });
  });
  it('비번도 토큰도 없음 → 401', async () => {
    await expect(assertOpsUser(reqWith({}))).rejects.toMatchObject({ status: 401 });
  });
});
```

- [x] **Step 4: 검증 + Commit**

Run: `pnpm --filter server test && pnpm typecheck` → PASS.
수동: dev 서버에서 `curl -s localhost:3500/api/ops/overview` → 401 JSON, `curl -s -H "x-ops-password: 8054" localhost:3500/api/ops/overview` → success true.

```bash
git add packages/server/src
git commit -m "refactor(server): extract ops auth into reusable middleware"
```

### Task 3: grant 순수 로직 (TDD)

**Files:**
- Create: `packages/server/src/services/members-grant.ts`
- Test: `packages/server/src/services/members-grant.test.ts`

- [x] **Step 1: 실패하는 테스트 작성**

```ts
import { describe, it, expect } from 'vitest';
import { resolveGrantUpdate } from './members-grant.js';

const NOW = Date.parse('2026-07-09T00:00:00Z');
const existing = { trial_started_at: null, referral_bonus_days: 3, paid_until: null };

describe('resolveGrantUpdate', () => {
  it('trial-reset → trial_started_at = now', () => {
    expect(resolveGrantUpdate({ type: 'trial-reset' }, existing, NOW)).toEqual({
      trial_started_at: new Date(NOW).toISOString(),
    });
  });
  it('bonus-days → 기존값에 누적', () => {
    expect(resolveGrantUpdate({ type: 'bonus-days', days: 7 }, existing, NOW)).toEqual({
      referral_bonus_days: 10,
    });
  });
  it('bonus-days 범위 밖(0, 366, 1.5, NaN) → 400', () => {
    for (const days of [0, 366, 1.5, NaN]) {
      expect(() => resolveGrantUpdate({ type: 'bonus-days', days }, existing, NOW)).toThrowError(
        /1~365/
      );
    }
  });
  it('paid-until 미래 → paid_until 설정', () => {
    expect(
      resolveGrantUpdate({ type: 'paid-until', until: '2026-12-31T00:00:00Z' }, existing, NOW)
    ).toEqual({ paid_until: '2026-12-31T00:00:00.000Z' });
  });
  it('paid-until 과거/파싱불가 → 400', () => {
    expect(() =>
      resolveGrantUpdate({ type: 'paid-until', until: '2026-01-01' }, existing, NOW)
    ).toThrowError(/미래/);
    expect(() =>
      resolveGrantUpdate({ type: 'paid-until', until: 'nope' }, existing, NOW)
    ).toThrowError(/미래/);
  });
  it('알 수 없는 type → 400', () => {
    expect(() =>
      resolveGrantUpdate({ type: 'hack' } as never, existing, NOW)
    ).toThrowError(/type/);
  });
});
```

- [x] **Step 2: 실패 확인**

Run: `pnpm --filter server test -- members-grant`
Expected: FAIL (`members-grant.js` 모듈 없음).

- [x] **Step 3: 구현**

```ts
import { AppError } from '../middleware/error.middleware.js';

export type GrantInput =
  | { type: 'trial-reset' }
  | { type: 'bonus-days'; days: number }
  | { type: 'paid-until'; until: string };

export interface EntitlementValues {
  trial_started_at: string | null;
  referral_bonus_days: number;
  paid_until: string | null;
}

/** grant 요청 → entitlements 갱신 필드. 검증 실패 시 AppError(400). 순수 함수(테스트 대상). */
export function resolveGrantUpdate(
  input: GrantInput,
  existing: EntitlementValues,
  now: number = Date.now()
): Partial<EntitlementValues> {
  if (input.type === 'trial-reset') {
    return { trial_started_at: new Date(now).toISOString() };
  }
  if (input.type === 'bonus-days') {
    const d = input.days;
    if (!Number.isInteger(d) || d < 1 || d > 365) {
      throw new AppError(400, 'days는 1~365 정수여야 합니다');
    }
    return { referral_bonus_days: existing.referral_bonus_days + d };
  }
  if (input.type === 'paid-until') {
    const t = Date.parse(input.until);
    if (Number.isNaN(t) || t <= now) throw new AppError(400, 'until은 미래 시각이어야 합니다');
    return { paid_until: new Date(t).toISOString() };
  }
  throw new AppError(400, '알 수 없는 grant type입니다');
}
```

- [x] **Step 4: 통과 확인 + Commit**

Run: `pnpm --filter server test -- members-grant` → PASS.

```bash
git add packages/server/src/services/members-grant.ts packages/server/src/services/members-grant.test.ts
git commit -m "feat(server): pure grant-resolution logic for member entitlements (TDD)"
```

### Task 4: 회원별 활동 요약 순수 로직 (TDD)

**Files:**
- Create: `packages/server/src/services/members-activity.ts`
- Test: `packages/server/src/services/members-activity.test.ts`

- [x] **Step 1: 실패하는 테스트 작성**

```ts
import { describe, it, expect } from 'vitest';
import { summarizeChildActivity, countGameSessions } from './members-activity.js';
import type { LearningEvent } from '@tangobook/shared';

const ev = (over: Partial<LearningEvent>): LearningEvent => ({
  id: 'e', profile_id: 'p1', event_type: 'page_read', storybook_id: 'b1',
  game_type: null, word: null, metadata: null, created_at: '2026-07-08T10:00:00Z', ...over,
});
const NOW = new Date('2026-07-09T00:00:00Z');

describe('countGameSessions', () => {
  it('같은 게임·같은 KST 날짜 이벤트 여러 개 = 세션 1', () => {
    const events = [
      ev({ game_type: 'korean-block', event_type: 'word_correct', created_at: '2026-07-08T10:00:00Z' }),
      ev({ game_type: 'korean-block', event_type: 'word_correct', created_at: '2026-07-08T10:01:00Z' }),
      ev({ game_type: 'korean-block', event_type: 'word_correct', created_at: '2026-07-07T09:00:00Z' }),
      ev({ game_type: 'connect-the-dots', event_type: 'word_correct', created_at: '2026-07-08T10:00:00Z' }),
      ev({ game_type: null }), // 게임 아님 — 제외
    ];
    expect(countGameSessions(events)).toBe(3); // (kblock,7/8) (kblock,7/7) (dots,7/8)
  });
});

describe('summarizeChildActivity', () => {
  it('완독·만난단어·마지막활동을 집계한다', () => {
    const events = [
      ev({ metadata: { lastPage: true, totalPages: 10 } }),
      ev({ event_type: 'word_exposed', word: '사과', created_at: '2026-07-08T11:00:00Z' }),
      ev({ event_type: 'word_exposed', word: '사과', created_at: '2026-07-08T11:01:00Z' }), // 중복 단어
    ];
    const s = summarizeChildActivity(events, NOW);
    expect(s.completedBooks).toBe(1);
    expect(s.wordsMet).toBe(1);
    expect(s.lastActiveAt).toBe('2026-07-08T11:01:00Z');
    expect(s.week).toHaveLength(7);
    expect(s.readingMinutes).toBeGreaterThanOrEqual(1);
  });
  it('이벤트 없음 → 전부 0/null', () => {
    const s = summarizeChildActivity([], NOW);
    expect(s).toMatchObject({ completedBooks: 0, wordsMet: 0, lastActiveAt: null, readingMinutes: 0, streak: 0, gameSessions: 0 });
  });
});
```

- [x] **Step 2: 실패 확인** — Run: `pnpm --filter server test -- members-activity` → FAIL (모듈 없음).

- [x] **Step 3: 구현**

```ts
import type { LearningEvent, WeekDay } from '@tangobook/shared';
import {
  completedBooks,
  computeStreak,
  estimateReadingMinutes,
  kstDateKey,
  weekActivity,
} from '@tangobook/shared';

/** 게임 세션 수 = (game_type, KST 날짜) distinct — 한 판이 단어별 이벤트 여러 개를 남기므로 raw count 아님(스펙). */
export function countGameSessions(events: LearningEvent[]): number {
  const keys = new Set<string>();
  for (const e of events) {
    if (!e.game_type) continue;
    keys.add(`${e.game_type}|${kstDateKey(e.created_at)}`);
  }
  return keys.size;
}

export interface ChildActivitySummary {
  lastActiveAt: string | null;
  completedBooks: number;
  readingMinutes: number;
  streak: number;
  week: WeekDay[];
  wordsMet: number;
  gameSessions: number;
}

/** 자녀 1명 이벤트 → 활동 요약. shared 공식 재사용으로 부모 리포트와 수치 일치. */
export function summarizeChildActivity(events: LearningEvent[], now: Date): ChildActivitySummary {
  let lastActiveAt: string | null = null;
  const words = new Set<string>();
  for (const e of events) {
    if (!lastActiveAt || e.created_at > lastActiveAt) lastActiveAt = e.created_at;
    if (e.event_type === 'word_exposed' && e.word) words.add(e.word);
  }
  return {
    lastActiveAt,
    completedBooks: completedBooks(events).length,
    readingMinutes: events.length > 0 ? estimateReadingMinutes(events) : 0,
    streak: computeStreak(events, now),
    week: weekActivity(events, now),
    wordsMet: words.size,
    gameSessions: countGameSessions(events),
  };
}
```

- [x] **Step 4: 통과 확인 + Commit**

Run: `pnpm --filter server test -- members-activity` → PASS.

```bash
git add packages/server/src/services/members-activity.ts packages/server/src/services/members-activity.test.ts
git commit -m "feat(server): per-child activity summary logic (TDD)"
```

### Task 5: members.service — fetch + 조립

**Files:**
- Create: `packages/server/src/services/members.service.ts`

순수 로직은 Task 3·4에 있으므로 이 파일은 I/O 조립만(단위 테스트 없음 — supabase mock YAGNI, 수동 검증).

- [x] **Step 1: 서비스 구현**

```ts
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
      subscription: ent?.paid_until
        ? { status: 'active', currentPeriodEnd: ent.paid_until }
        : null,
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
  banned: boolean;
}

export interface MembersOverview {
  generatedAt: string;
  totals: { members: number; activeToday: number; trial: number; subscribed: number; expired: number };
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
      banned: isBanned(bannedMap.get(a.id), now),
    };
  });
  members.sort((a, b) => (b.lastActiveAt ?? '') .localeCompare(a.lastActiveAt ?? ''));

  return {
    generatedAt: new Date(now).toISOString(),
    totals: {
      members: members.length,
      activeToday,
      trial: members.filter((m) => m.status === 'trial').length,
      subscribed: members.filter((m) => m.status === 'subscribed').length,
      expired: members.filter((m) => m.status === 'expired').length,
    },
    members,
  };
}

export interface MemberDetail {
  account: { id: string; email: string; createdAt: string; banned: boolean; bannedUntil: string | null };
  access: ReturnType<typeof computeAccess>;
  entitlement: {
    paidUntil: string | null;
    bonusDays: number;
    trialStartedAt: string | null;
    referralCode: string | null;
    referredBy: string | null;
  };
  invitedCount: number;
  payments: Array<{ orderId: string; plan: string; amount: number; status: string; createdAt: string; paidAt: string | null }>;
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
    },
    invitedCount: (invitedRes.data ?? []).length,
    payments: (paymentsRes.data ?? []).map((p) => ({
      orderId: p.order_id, plan: p.plan, amount: p.amount, status: p.status,
      createdAt: p.created_at, paidAt: p.paid_at,
    })),
    children: profiles.map((p) => ({
      profileId: p.id,
      name: p.name,
      ...summarizeChildActivity(events.filter((e) => e.profile_id === p.id), now),
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
    .upsert({ account_id: accountId, ...update, updated_at: new Date().toISOString() }, { onConflict: 'account_id' });
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
```

- [x] **Step 2: 검증 + Commit**

Run: `pnpm typecheck` → PASS. (I/O 조립 파일 — 동작은 Task 6 수동 검증에서.)

```bash
git add packages/server/src/services/members.service.ts
git commit -m "feat(server): members service — list/detail aggregation + grant/ban/delete"
```

### Task 6: 컨트롤러 + 라우트

**Files:**
- Create: `packages/server/src/controllers/members.controller.ts`
- Modify: `packages/server/src/routes/ops.routes.ts`

- [x] **Step 1: 컨트롤러**

```ts
import type { Request, Response, NextFunction } from 'express';
import {
  listMembers, getMemberDetail, grantMember, setMemberBan, deleteMember,
} from '../services/members.service.js';
import type { GrantInput } from '../services/members-grant.js';

export const MembersController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ success: true, data: await listMembers() });
    } catch (err) { next(err); }
  },
  async detail(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ success: true, data: await getMemberDetail(req.params.accountId) });
    } catch (err) { next(err); }
  },
  async grant(req: Request, res: Response, next: NextFunction) {
    try {
      await grantMember(req.params.accountId, req.body as GrantInput);
      res.json({ success: true, data: { ok: true } });
    } catch (err) { next(err); }
  },
  async ban(req: Request, res: Response, next: NextFunction) {
    try {
      await setMemberBan(req.params.accountId, !!(req.body as { banned?: boolean }).banned);
      res.json({ success: true, data: { ok: true } });
    } catch (err) { next(err); }
  },
  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await deleteMember(req.params.accountId);
      res.json({ success: true, data: { ok: true } });
    } catch (err) { next(err); }
  },
};
```

- [x] **Step 2: 라우트 추가** (`ops.routes.ts`)

```ts
import { MembersController } from '../controllers/members.controller.js';
// ...
router.get('/members', opsAuth, MembersController.list);
router.get('/members/:accountId', opsAuth, MembersController.detail);
router.post('/members/:accountId/grant', opsAuth, MembersController.grant);
router.post('/members/:accountId/ban', opsAuth, MembersController.ban);
router.delete('/members/:accountId', opsAuth, MembersController.remove);
```

- [x] **Step 3: 수동 검증 + Commit**

Run: `pnpm typecheck && pnpm --filter server test` → PASS.
dev 서버 살아있는 상태에서:

```bash
curl -s localhost:3500/api/ops/members                                  # → 401
curl -s -H "x-ops-password: 8054" localhost:3500/api/ops/members        # → success true + members 배열
curl -s -H "x-ops-password: 8054" localhost:3500/api/ops/members/없는id  # → 404 (uuid 형식 아니면 500일 수 있음 — 실제 uuid로 확인)
```

```bash
git add packages/server/src
git commit -m "feat(server): members admin endpoints (list/detail/grant/ban/delete)"
```

---

## Chunk 2: 클라이언트 (`features/members/` + `/members` 라우트)

### Task 7: members API 모듈

**Files:**
- Create: `packages/client/src/features/members/api/members.api.ts`
- (barrel `index.ts`는 페이지 파일이 생기는 Task 9에서 생성 — 이 커밋 단독으로도 typecheck green 유지)

- [x] **Step 1: API 모듈**

서버 응답 타입을 미러링(수동 동기화 — 기존 ops.api 패턴). 비번 헤더는 ops 헬퍼 재사용:

```ts
import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@tangobook/shared';
import { getStoredOpsPassword } from '@/features/ops/api/ops.api';

// ── 서버 members.service 응답 미러 타입 ──
export interface MemberSummary {
  accountId: string; email: string; createdAt: string; children: number;
  status: 'trial' | 'subscribed' | 'expired' | 'guest';
  trialDaysLeft: number; paidUntil: string | null; bonusDays: number;
  trialStartedAt: string | null; lastActiveAt: string | null;
  completedBooks: number; banned: boolean;
}
export interface MembersOverview {
  generatedAt: string;
  totals: { members: number; activeToday: number; trial: number; subscribed: number; expired: number };
  members: MemberSummary[];
}
export interface WeekDay { key: string; label: string; active: boolean; }
export interface ChildActivity {
  profileId: string; name: string; lastActiveAt: string | null; completedBooks: number;
  readingMinutes: number; streak: number; week: WeekDay[]; wordsMet: number; gameSessions: number;
}
export interface MemberDetail {
  account: { id: string; email: string; createdAt: string; banned: boolean; bannedUntil: string | null };
  access: { status: string; isEntitled: boolean; trialEndsAt: string | null; trialDaysLeft: number };
  entitlement: { paidUntil: string | null; bonusDays: number; trialStartedAt: string | null; referralCode: string | null; referredBy: string | null };
  invitedCount: number;
  payments: Array<{ orderId: string; plan: string; amount: number; status: string; createdAt: string; paidAt: string | null }>;
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
const unwrap = <T,>(res: { data: ApiResponse<T> }): T =>
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
```

- [x] **Step 2: Commit** (typecheck는 이 파일 단독으로 통과해야 함: `pnpm --filter client typecheck`)

```bash
git add packages/client/src/features/members
git commit -m "feat(members): admin members api module"
```

### Task 8: MembersDashboardPage — 게이트 + 요약 + 테이블

**Files:**
- Create: `packages/client/src/features/members/pages/MembersDashboardPage.tsx`

- [x] **Step 1: 페이지 구현**

`OpsDashboardPage`의 게이트 패턴 재사용(같은 sessionStorage 키 — /admin과 비번 한 번만 입력). 핵심 골격:

```tsx
import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
// 🔴 auth 는 barrel(index.ts) 없음 — OpsDashboardPage 와 동일하게 context 직접 import.
//    AuthContextValue 는 `user` 가 아니라 `account` 필드.
import { useAuth } from '@/features/auth/context/AuthContext';
import { isDevEmail } from '@/config/dev';
import {
  getStoredOpsPassword, storeOpsPassword, clearOpsPassword,
} from '@/features/ops/api/ops.api';
import { membersApi, type MemberSummary } from '../api/members.api';
import { MemberDetailDrawer } from '../components/MemberDetailDrawer';

const MEMBERS_KEY = ['ops-members'];
const fmtDate = (iso: string | null) => (iso ? iso.slice(0, 10) : '—');

function StatusBadge({ m }: { m: MemberSummary }) {
  if (m.banned) return <span className="px-2 py-0.5 rounded-full bg-ink-900 text-white text-xs font-black">차단</span>;
  if (m.status === 'subscribed') return <span className="px-2 py-0.5 rounded-full bg-mint-100 text-mint-700 text-xs font-black">구독 ~{fmtDate(m.paidUntil)}</span>;
  if (m.status === 'trial') return <span className="px-2 py-0.5 rounded-full bg-coral-100 text-coral-600 text-xs font-black">체험 {m.trialDaysLeft}일</span>;
  return <span className="px-2 py-0.5 rounded-full bg-ink-100 text-ink-500 text-xs font-black">만료</span>;
}

export default function MembersDashboardPage() {
  const { account } = useAuth();
  const qc = useQueryClient();
  const [pwEntered, setPwEntered] = useState(() => !!getStoredOpsPassword());
  const [wrong, setWrong] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null); // accountId

  const canTry = isDevEmail(account?.email) || pwEntered;
  const { data, isLoading, isError } = useQuery({
    queryKey: MEMBERS_KEY,
    queryFn: async () => {
      try {
        return await membersApi.list();
      } catch (e) {
        if (isAxiosError(e) && e.response?.status === 403) {
          clearOpsPassword(); setPwEntered(false); setWrong(true);
        }
        throw e;
      }
    },
    enabled: canTry,
    staleTime: 30_000,
  });

  const filtered = useMemo(
    () => (data?.members ?? []).filter((m) => m.email.toLowerCase().includes(search.toLowerCase())),
    [data, search]
  );

  if (!canTry) {
    return (
      /* OpsDashboardPage 의 OpsPasswordGate 와 동일 구조의 폼 (input type=password + 확인 버튼).
         onSubmit: storeOpsPassword(pw); setWrong(false); setPwEntered(true); */
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 p-4 sm:p-8">
      <div className="max-w-[1200px] mx-auto">
        <h1 className="text-2xl font-black text-ink-900 mb-4">👥 회원 관리</h1>
        {/* 요약 바 */}
        {data && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            {[
              ['총 회원', data.totals.members], ['오늘 활동', data.totals.activeToday],
              ['체험중', data.totals.trial], ['구독중', data.totals.subscribed], ['만료', data.totals.expired],
            ].map(([label, v]) => (
              <div key={label as string} className="bg-white rounded-2xl shadow-soft px-4 py-3">
                <p className="text-xs font-bold text-ink-500">{label}</p>
                <p className="text-2xl font-black text-ink-900">{v}</p>
              </div>
            ))}
          </div>
        )}
        {/* 검색 */}
        <input
          value={search} onChange={(e) => setSearch(e.target.value)} placeholder="이메일 검색"
          className="mb-3 w-full sm:w-80 rounded-xl bg-white px-4 py-2.5 shadow-soft font-bold outline-none"
        />
        {/* 테이블 */}
        {isLoading && <p className="text-ink-500 font-bold">불러오는 중…</p>}
        {isError && <p className="text-danger font-bold">불러오기 실패 — 비밀번호/서버 확인</p>}
        {data && (
          <div className="bg-white rounded-2xl shadow-soft overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-500 border-b border-ink-100">
                  {['이메일', '가입일', '자녀', '상태', '마지막 활동', '완독'].map((h) => (
                    <th key={h} className="px-4 py-3 font-black">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr
                    key={m.accountId}
                    onClick={() => setSelected(m.accountId)}
                    className="border-b border-ink-50 hover:bg-peach-50 cursor-pointer"
                  >
                    <td className="px-4 py-3 font-bold text-ink-900">{m.email}</td>
                    <td className="px-4 py-3">{fmtDate(m.createdAt)}</td>
                    <td className="px-4 py-3">{m.children}</td>
                    <td className="px-4 py-3"><StatusBadge m={m} /></td>
                    <td className="px-4 py-3">{fmtDate(m.lastActiveAt)}</td>
                    <td className="px-4 py-3">{m.completedBooks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {selected && (
        <MemberDetailDrawer
          accountId={selected}
          onClose={() => setSelected(null)}
          onChanged={() => void qc.invalidateQueries({ queryKey: MEMBERS_KEY })}
        />
      )}
    </div>
  );
}
```

구현 시 게이트 폼은 `OpsDashboardPage.tsx:50-86`의 `OpsPasswordGate`를 그대로 옮겨 써도 됨(로컬 함수 복사 — 두 페이지가 스타일 다르게 진화할 수 있어 공유 컴포넌트化는 YAGNI).
정렬은 마지막활동 desc 고정(스펙의 "정렬"을 단순화 — 헤더 클릭 정렬은 필요해지면 추가).

- [x] **Step 2: typecheck** — Drawer가 아직 없으므로 Task 9와 함께 검증.

### Task 9: MemberDetailDrawer — 상세 + 액션 + barrel

**Files:**
- Create: `packages/client/src/features/members/components/MemberDetailDrawer.tsx`
- Create: `packages/client/src/features/members/index.ts`

```ts
// index.ts
export { default as MembersDashboardPage } from './pages/MembersDashboardPage';
```

- [x] **Step 1: 드로어 구현**

```tsx
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { membersApi, type GrantInput } from '../api/members.api';

const DETAIL_KEY = (id: string) => ['ops-member', id];
const fmt = (iso: string | null) => (iso ? iso.replace('T', ' ').slice(0, 16) : '—');

export function MemberDetailDrawer({
  accountId, onClose, onChanged,
}: { accountId: string; onClose: () => void; onChanged: () => void }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: DETAIL_KEY(accountId),
    queryFn: () => membersApi.detail(accountId),
  });
  const [paidUntilDate, setPaidUntilDate] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: DETAIL_KEY(accountId) });
    onChanged();
  };
  const grantMut = useMutation({
    mutationFn: (input: GrantInput) => membersApi.grant(accountId, input),
    onSuccess: () => { setMsg('적용 완료'); refresh(); },
    onError: (e) => setMsg(`실패: ${String(e)}`),
  });
  const banMut = useMutation({
    mutationFn: (banned: boolean) => membersApi.ban(accountId, banned),
    onSuccess: () => { setMsg('적용 완료'); refresh(); },
    onError: (e) => setMsg(`실패: ${String(e)}`),
  });
  const deleteMut = useMutation({
    mutationFn: () => membersApi.remove(accountId),
    onSuccess: () => { onChanged(); onClose(); },
    onError: (e) => setMsg(`실패: ${String(e)}`),
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-xl h-full overflow-y-auto bg-white p-6 shadow-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="float-right text-2xl font-black text-ink-500">✕</button>
        {isLoading && <p className="font-bold text-ink-500">불러오는 중…</p>}
        {data && (
          <div className="space-y-6">
            {/* 계정 */}
            <section>
              <h2 className="text-xl font-black text-ink-900">{data.account.email}</h2>
              <p className="text-sm text-ink-500 font-bold">
                가입 {fmt(data.account.createdAt)} · 초대코드 {data.entitlement.referralCode ?? '—'} ·
                초대한 {data.invitedCount}명 · 받은초대 {data.entitlement.referredBy ? 'O' : '—'}
                {data.account.banned ? ' · 🚫 차단됨' : ''}
              </p>
              <p className="text-sm text-ink-700 font-bold mt-1">
                상태 {data.access.status} (체험 {data.access.trialDaysLeft}일 남음) ·
                보너스 {data.entitlement.bonusDays}일 · 유료 ~{fmt(data.entitlement.paidUntil)} ·
                체험시작 {fmt(data.entitlement.trialStartedAt)}
              </p>
            </section>
            {/* 액션 */}
            <section className="space-y-2">
              <h3 className="font-black text-ink-900">권한 부여</h3>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => grantMut.mutate({ type: 'bonus-days', days: 7 })}
                  className="px-3 py-2 rounded-xl bg-coral-100 text-coral-600 font-black text-sm">🎁 +7일</button>
                <button onClick={() => grantMut.mutate({ type: 'bonus-days', days: 30 })}
                  className="px-3 py-2 rounded-xl bg-coral-100 text-coral-600 font-black text-sm">🎁 +30일</button>
                <button onClick={() => grantMut.mutate({ type: 'trial-reset' })}
                  className="px-3 py-2 rounded-xl bg-peach-100 text-ink-700 font-black text-sm">체험 지금부터 리셋</button>
              </div>
              <div className="flex items-center gap-2">
                <input type="date" value={paidUntilDate} onChange={(e) => setPaidUntilDate(e.target.value)}
                  className="rounded-xl bg-cream-50 px-3 py-2 font-bold" />
                <button
                  disabled={!paidUntilDate}
                  onClick={() => grantMut.mutate({ type: 'paid-until', until: `${paidUntilDate}T23:59:59+09:00` })}
                  className="px-3 py-2 rounded-xl bg-mint-100 text-mint-700 font-black text-sm disabled:opacity-40"
                >💳 유료 ~날짜까지</button>
              </div>
              <div className="flex gap-2">
                <button onClick={() => banMut.mutate(!data.account.banned)}
                  className="px-3 py-2 rounded-xl bg-ink-100 text-ink-700 font-black text-sm">
                  {data.account.banned ? '🔓 차단 해제' : '🚫 차단'}
                </button>
              </div>
              {msg && <p className="text-sm font-bold text-ink-500">{msg}</p>}
            </section>
            {/* 자녀별 활동 */}
            <section>
              <h3 className="font-black text-ink-900 mb-2">자녀 활동 ({data.children.length})</h3>
              <div className="space-y-3">
                {data.children.map((c) => (
                  <div key={c.profileId} className="rounded-2xl bg-cream-50 p-4">
                    <p className="font-black text-ink-900">{c.name}</p>
                    <p className="text-sm font-bold text-ink-700">
                      마지막 {fmt(c.lastActiveAt)} · 완독 {c.completedBooks} · 읽은시간 {c.readingMinutes}분 ·
                      연속 {c.streak}일 · 단어 {c.wordsMet} · 게임 {c.gameSessions}판
                    </p>
                    <div className="flex gap-1.5 mt-2">
                      {c.week.map((d) => (
                        <span key={d.key} title={d.key}
                          className={`w-4 h-4 rounded-full ${d.active ? 'bg-coral-500' : 'bg-ink-100'}`} />
                      ))}
                    </div>
                  </div>
                ))}
                {data.children.length === 0 && <p className="text-sm text-ink-500 font-bold">자녀 프로필 없음</p>}
              </div>
            </section>
            {/* 결제 이력 */}
            <section>
              <h3 className="font-black text-ink-900 mb-2">결제 이력 ({data.payments.length})</h3>
              {data.payments.map((p) => (
                <p key={p.orderId} className="text-sm font-bold text-ink-700">
                  {fmt(p.paidAt ?? p.createdAt)} · {p.plan} · {p.amount.toLocaleString()}원 · {p.status}
                </p>
              ))}
              {data.payments.length === 0 && <p className="text-sm text-ink-500 font-bold">없음</p>}
            </section>
            {/* 삭제 */}
            <section className="rounded-2xl border-2 border-danger/30 p-4">
              <h3 className="font-black text-danger mb-2">🗑 계정 삭제 (복구 불가)</h3>
              <p className="text-xs text-ink-500 font-bold mb-2">이메일을 정확히 입력하면 활성화됩니다.</p>
              <div className="flex gap-2">
                <input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder={data.account.email}
                  className="flex-1 rounded-xl bg-cream-50 px-3 py-2 font-bold" />
                <button
                  disabled={deleteConfirm !== data.account.email || deleteMut.isPending}
                  onClick={() => deleteMut.mutate()}
                  className="px-4 py-2 rounded-xl bg-danger text-white font-black disabled:opacity-30"
                >삭제</button>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [x] **Step 2: typecheck + Commit**

Run: `pnpm typecheck` → PASS.

```bash
git add packages/client/src/features/members
git commit -m "feat(members): dashboard page + detail drawer with grant/ban/delete actions"
```

### Task 10: 라우트 등록 + 수동 E2E + 문서

**Files:**
- Modify: `packages/client/src/router/index.tsx`
- Modify: `CLAUDE.md` (admin 항목에 한 줄)

- [x] **Step 1: 라우트 추가**

`router/index.tsx`의 `admin` 라우트(318행 부근) 아래에:

```tsx
// 회원 관리 대시보드 — /admin 과 동일 인증(비번/OPS_EMAILS), 독립 페이지
{
  path: 'members',
  element: (
    <ErrorBoundary>
      <MembersDashboardPage />
    </ErrorBoundary>
  ),
},
```

import: `import { MembersDashboardPage } from '../features/members';` (기존 lazy 패턴을 쓰는 파일이면 그 패턴을 따를 것 — 62행 `OpsDashboardPage` import 방식과 동일하게).

- [x] **Step 2: 수동 E2E**

1. `localhost:5174/members` → 비번 게이트 → `8054` 입력 → 회원 테이블 표시.
2. 본인 계정 행 클릭 → 드로어에서 자녀 활동·결제·초대 표시 확인.
3. `🎁 +7일` 클릭 → 드로어의 보너스 일수 +7 확인 → 학습자 화면 사이드바 TrialBadge 일수 증가 확인(새로고침).
4. 테스트 계정으로 차단 → 그 계정 로그인 시도 → 실패 확인 → 해제.
5. (선택) 버리는 테스트 계정으로 삭제 플로우 확인.

- [x] **Step 3: CLAUDE.md 갱신**

루트 CLAUDE.md의 `/admin 운영 대시보드` 불릿에 이어서 한 줄:

```
- **`/members` 회원 관리 대시보드**(`features/members/` + 서버 `/api/ops/members*`): 회원 목록·자녀별 활동(shared 집계 공식 공유)·무료/유료 부여·차단(Auth ban)·삭제. 인증 = /admin 과 동일(비번/OPS_EMAILS, `ops-auth.middleware`). 스펙 → docs/superpowers/specs/2026-07-09-members-admin-dashboard-design.md
```

- [x] **Step 4: 최종 검증 + Commit**

Run: `pnpm typecheck && pnpm --filter server test && pnpm --filter client test -- aggregate` → PASS.

```bash
git add packages/client/src/router/index.tsx CLAUDE.md
git commit -m "feat(members): register /members route + docs"
```
