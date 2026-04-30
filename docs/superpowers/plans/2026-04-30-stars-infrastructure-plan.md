# Phase 1 — 별 인프라 (Stars Infrastructure) Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 학습 활동 시 별이 자동 적립되어 화면 우상단에 실시간 표시되고, 게임 완료 후 `+N ⭐ 저장됨` 토스트가 뜬다.

**Architecture:** Supabase 트리거가 `learning_events` insert → `star_ledger` 적립 → `child_profiles.stars_total` 갱신을 server-side 자동 처리. 클라이언트는 잔고만 조회 + UI 표시 + 잔고 증가 시 토스트. 별도 server API 불필요 (Supabase 직접 조회).

**Tech Stack:** Supabase Postgres (트리거·RLS), Supabase JS client, TanStack Query, React, framer-motion (토스트 애니), Vitest + @testing-library/react.

**Spec:** `docs/superpowers/specs/2026-04-30-rewards-sr-collection-design.md`
**SQL:** `scripts/supabase-rewards-setup.sql`

---

## Pre-requisite: SQL 적용

플랜 시작 전 사용자가 **Supabase SQL Editor에서 1회 실행**:

1. Supabase 대시보드 → 프로젝트 `tangobook` → SQL Editor
2. `scripts/supabase-rewards-setup.sql` 전체 복붙 → 실행
3. 검증 쿼리:
   ```sql
   -- 새 컬럼 + 테이블 확인
   select column_name from information_schema.columns
     where table_name = 'child_profiles'
       and column_name in ('stars_total', 'streak_days', 'last_active_date');
   -- → 3 rows

   select tablename from pg_tables
     where schemaname = 'public'
       and tablename in ('star_ledger', 'word_mastery', 'collection_user',
                         'hori_inventory', 'weekly_missions');
   -- → 5 rows

   -- 트리거 확인
   select trigger_name from information_schema.triggers
     where event_object_table = 'learning_events';
   -- → learning_events_handle 포함

   -- RPC 확인
   select routine_name from information_schema.routines
     where routine_schema = 'public'
       and routine_name in ('get_sr_word_pool', 'grant_game_perfect',
                            'activate_collection_item', 'purchase_hori_item',
                            'complete_weekly_mission');
   -- → 5 rows
   ```

> 이 단계 실패 시 플랜 진행 불가. 검증 통과 후 Chunk 1 시작.

---

## Chunk 1: Foundation — 메타데이터 + 마지막 페이지 감지

목표: 트리거가 "마지막 페이지 = 동화 완독" 을 정확히 인식하도록 `page_read` 이벤트 metadata 에 `totalPages` 포함. 이게 없으면 동화 완독 +5 보너스가 절대 발동 안 됨 (★ Phase 1 의 가장 중요한 인프라 변경).

### Task 1.1: shared 타입 — `LearningEventMetadata` 에 페이지 수 필드

**Files:**
- Modify: `packages/shared/src/types/learning-events.ts`

- [ ] **Step 1: 타입 필드 추가**

`LearningEventMetadata` interface 에 두 개 옵셔널 필드:

```typescript
export interface LearningEventMetadata {
  lang?: Lang;
  source?: 'storybook' | 'phonics';
  storybookId?: string;
  pageNumber?: number;
  page?: number;
  // ★ 신규 (Phase 1)
  totalPages?: number;          // 동화 전체 페이지 수 (page_read 에서 마지막 페이지 감지용)
  lastPage?: boolean;           // 명시적 마지막 페이지 표시 (totalPages 와 page 일치 시 true)

  durationMs?: number;
  // ... 기존 필드 유지
}
```

- [ ] **Step 2: shared 빌드**

```bash
pnpm --filter @tangobook/shared build
```

Expected: 빌드 성공, 에러 없음.

- [ ] **Step 3: 클라이언트 typecheck**

```bash
pnpm --filter @tangobook/client typecheck
```

Expected: 에러 없음.

- [ ] **Step 4: 커밋**

```bash
git add packages/shared/src/types/learning-events.ts
git commit -m "feat(shared): add totalPages/lastPage to LearningEventMetadata for star trigger"
```

---

### Task 1.2: ViewerContainer page_read에 totalPages 포함

**Files:**
- Modify: `packages/client/src/features/viewer/components/ViewerContainer.tsx` (line ~210)

- [ ] **Step 1: 현재 emit 코드 확인**

```bash
grep -n "page_read" packages/client/src/features/viewer/components/ViewerContainer.tsx
```

Expected output: line 210 영역의 logEvent 호출.

- [ ] **Step 2: metadata 에 totalPages + lastPage 추가**

`logEvent({ type: 'page_read', ... })` 호출부 찾아 metadata 변경:

```tsx
const totalPages = storybook.pages?.length ?? 0;
const isLast = pageNumber >= totalPages;

logEvent({
  type: 'page_read',
  storybookId,
  metadata: {
    lang: narrowLang,
    page: pageNumber,
    totalPages,                    // ★ 신규
    lastPage: isLast,              // ★ 신규
    source: 'storybook',
  },
});
```

> 변수명 `pageNumber` / `narrowLang` / `storybook` / `storybookId` 는 함수 스코프에 이미 존재. 위 코드는 그 컨텍스트에 맞게 삽입. 반드시 `storybook.pages?.length` 로 안전 접근.

- [ ] **Step 3: typecheck**

```bash
pnpm --filter @tangobook/client typecheck
```

Expected: 에러 없음.

- [ ] **Step 4: 수동 검증 (선택)** — Supabase SQL Editor 에서:

```sql
-- 본인 자녀 프로필로 동화 한 권 끝까지 읽은 후
select event_type, metadata->>'page' as page,
       metadata->>'totalPages' as total,
       metadata->>'lastPage' as last
  from learning_events
  where event_type = 'page_read'
  order by created_at desc limit 5;
```

Expected: `last=true` 인 row 가 마지막 페이지에 1개 있음.

```sql
-- star_ledger 에 page_read 적립 확인
select source_type, delta, metadata
  from star_ledger
  where source_type = 'page_read'
  order by created_at desc limit 10;
```

Expected: `delta=1` (일반 페이지) + `delta=5` (마지막 페이지) 혼합.

- [ ] **Step 5: 커밋**

```bash
git add packages/client/src/features/viewer/components/ViewerContainer.tsx
git commit -m "feat(viewer): include totalPages/lastPage in page_read metadata for star trigger"
```

---

### Task 1.3: PhonicsViewer page_read에도 동일 처리

**Files:**
- Modify: `packages/client/src/features/viewer/components/PhonicsViewer.tsx` (line ~75)

- [ ] **Step 1: 현재 emit 코드 확인**

```bash
grep -n -A 7 "page_read" packages/client/src/features/viewer/components/PhonicsViewer.tsx
```

- [ ] **Step 2: metadata 에 totalPages + lastPage 추가**

PhonicsViewer 는 unit 단위 1회 emit (페이지 개념 다름) — 진입 자체를 "완독"으로 간주하기 위해 `lastPage: true`, `totalPages: 1` 고정:

```tsx
logEvent({
  type: 'page_read',
  storybookId: storybook.id,
  metadata: {
    lang,
    page: 1,
    totalPages: 1,                 // ★
    lastPage: true,                // ★ 파닉스 unit 진입 = 완독 (현재 동작 그대로 + 별 +5 트리거)
    source: 'phonics',
  },
});
```

> 결정 이유: 파닉스 unit 은 한 번 학습 = 완독. 트리거가 +5 별 부여. 향후 unit 내부 단계별 페이지 개념 도입 시 변경 가능.

- [ ] **Step 3: typecheck + 커밋**

```bash
pnpm --filter @tangobook/client typecheck
git add packages/client/src/features/viewer/components/PhonicsViewer.tsx
git commit -m "feat(phonics-viewer): mark unit entry as lastPage for star award"
```

---

## Chunk 2: 잔고 조회 API + Hook

목표: 활성 자녀 프로필의 별 잔고와 거래 원장을 Supabase 직접 쿼리로 가져오는 API 와 TanStack Query hook.

### Task 2.1: shared 타입 — `StarLedgerEntry`, `StarBalance`

**Files:**
- Create: `packages/shared/src/types/rewards.ts`
- Modify: `packages/shared/src/index.ts` (export 추가)

- [ ] **Step 1: 타입 파일 생성**

```typescript
// packages/shared/src/types/rewards.ts

export type StarSourceType =
  // earn
  | 'page_read'
  | 'game_correct'
  | 'game_perfect'
  | 'phonics_complete'
  | 'daily_login'
  | 'streak_bonus'
  | 'weekly_mission'
  | 'card_unlock'
  // spend
  | 'hori_item'
  | 'foil_card'
  | 'season_costume';

export interface StarLedgerEntry {
  id: string;
  profile_id: string;
  delta: number;                  // 양수 = 적립, 음수 = 사용
  source_type: StarSourceType;
  source_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface StarBalance {
  profile_id: string;
  stars_total: number;
  streak_days: number;
  last_active_date: string | null;
}
```

- [ ] **Step 2: shared/src/index.ts export 추가**

```bash
grep -n "learning-events" packages/shared/src/index.ts
```

확인 후 같은 위치에 추가:
```typescript
export * from './types/rewards.js';
```

- [ ] **Step 3: shared 빌드 + 클라 typecheck**

```bash
pnpm --filter @tangobook/shared build
pnpm --filter @tangobook/client typecheck
```

Expected: 둘 다 통과.

- [ ] **Step 4: 커밋**

```bash
git add packages/shared/src/types/rewards.ts packages/shared/src/index.ts
git commit -m "feat(shared): add StarBalance and StarLedgerEntry types"
```

---

### Task 2.2: rewards.api.ts — Supabase 직접 쿼리

**Files:**
- Create: `packages/client/src/features/rewards/api/rewards.api.ts`

- [ ] **Step 1: API 함수 작성**

```typescript
// packages/client/src/features/rewards/api/rewards.api.ts

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { StarBalance, StarLedgerEntry } from '@tangobook/shared';

export const rewardsApi = {
  /** 활성 자녀의 별 잔고 + streak. 게스트 모드면 null. */
  async getBalance(profileId: string): Promise<StarBalance | null> {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase
      .from('child_profiles')
      .select('id, stars_total, streak_days, last_active_date')
      .eq('id', profileId)
      .single();
    if (error) {
      console.warn('[rewards] balance fetch failed', error);
      return null;
    }
    return {
      profile_id: data.id,
      stars_total: data.stars_total ?? 0,
      streak_days: data.streak_days ?? 0,
      last_active_date: data.last_active_date,
    };
  },

  /** 별 거래 원장 (최신순). 게스트 모드면 빈 배열. */
  async getLedger(profileId: string, limit = 50): Promise<StarLedgerEntry[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('star_ledger')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) {
      console.warn('[rewards] ledger fetch failed', error);
      return [];
    }
    return (data ?? []) as StarLedgerEntry[];
  },
};
```

- [ ] **Step 2: typecheck**

```bash
pnpm --filter @tangobook/client typecheck
```

Expected: 통과.

- [ ] **Step 3: 커밋**

```bash
git add packages/client/src/features/rewards/api/rewards.api.ts
git commit -m "feat(rewards): add API for balance and ledger queries"
```

---

### Task 2.3: useStarBalance hook + 테스트

**Files:**
- Create: `packages/client/src/features/rewards/hooks/useStarBalance.ts`
- Create: `packages/client/src/features/rewards/hooks/useStarBalance.test.tsx`

- [ ] **Step 1: 실패하는 테스트 작성**

```typescript
// packages/client/src/features/rewards/hooks/useStarBalance.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useStarBalance } from './useStarBalance';

vi.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));
vi.mock('../api/rewards.api', () => ({
  rewardsApi: { getBalance: vi.fn(), getLedger: vi.fn() },
}));

import { useAuth } from '@/features/auth/context/AuthContext';
import { rewardsApi } from '../api/rewards.api';

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('useStarBalance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('활성 프로필 있으면 잔고 반환', async () => {
    (useAuth as any).mockReturnValue({ activeProfile: { id: 'p1' } });
    (rewardsApi.getBalance as any).mockResolvedValue({
      profile_id: 'p1',
      stars_total: 42,
      streak_days: 3,
      last_active_date: '2026-04-30',
    });

    const { result } = renderHook(() => useStarBalance(), { wrapper });
    await waitFor(() => expect(result.current.data?.stars_total).toBe(42));
    expect(result.current.data?.streak_days).toBe(3);
  });

  it('활성 프로필 없으면 query disabled (data undefined)', () => {
    (useAuth as any).mockReturnValue({ activeProfile: null });

    const { result } = renderHook(() => useStarBalance(), { wrapper });
    expect(result.current.data).toBeUndefined();
    expect(rewardsApi.getBalance).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
cd packages/client && npx vitest run src/features/rewards/hooks/useStarBalance.test.tsx
```

Expected: FAIL — `useStarBalance` not defined or 잘못된 동작.

- [ ] **Step 3: hook 구현**

```typescript
// packages/client/src/features/rewards/hooks/useStarBalance.ts
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/context/AuthContext';
import { rewardsApi } from '../api/rewards.api';

export const STAR_BALANCE_KEY = (profileId: string) => ['rewards', 'balance', profileId];

export function useStarBalance() {
  const { activeProfile } = useAuth();
  const profileId = activeProfile?.id;

  return useQuery({
    queryKey: profileId ? STAR_BALANCE_KEY(profileId) : ['rewards', 'balance', null],
    queryFn: () => rewardsApi.getBalance(profileId!),
    enabled: !!profileId,
    staleTime: 5_000, // 5초 — 게임 직후 빠른 갱신
    refetchOnWindowFocus: true,
  });
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
cd packages/client && npx vitest run src/features/rewards/hooks/useStarBalance.test.tsx
```

Expected: PASS — 2 tests.

- [ ] **Step 5: 커밋**

```bash
git add packages/client/src/features/rewards/hooks/useStarBalance.ts \
        packages/client/src/features/rewards/hooks/useStarBalance.test.tsx
git commit -m "feat(rewards): add useStarBalance hook"
```

---

### Task 2.4: useStarLedger hook (간단, 테스트 없이)

**Files:**
- Create: `packages/client/src/features/rewards/hooks/useStarLedger.ts`

- [ ] **Step 1: hook 구현**

```typescript
// packages/client/src/features/rewards/hooks/useStarLedger.ts
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/context/AuthContext';
import { rewardsApi } from '../api/rewards.api';

export function useStarLedger(limit = 50) {
  const { activeProfile } = useAuth();
  const profileId = activeProfile?.id;

  return useQuery({
    queryKey: profileId ? ['rewards', 'ledger', profileId, limit] : ['rewards', 'ledger', null],
    queryFn: () => rewardsApi.getLedger(profileId!, limit),
    enabled: !!profileId,
    staleTime: 30_000,
  });
}
```

- [ ] **Step 2: typecheck + 커밋**

```bash
pnpm --filter @tangobook/client typecheck
git add packages/client/src/features/rewards/hooks/useStarLedger.ts
git commit -m "feat(rewards): add useStarLedger hook"
```

---

## Chunk 3: UI 컴포넌트 + 통합

목표: `StarCounter` 가 화면 우상단 고정 표시 + 잔고 증가 시 `+N` 토스트 자체 발동. 게임 완료 화면에서는 별도 "저장됨" 토스트.

### Task 3.1: StarCounter 컴포넌트 + 테스트

**Files:**
- Create: `packages/client/src/features/rewards/components/StarCounter.tsx`
- Create: `packages/client/src/features/rewards/components/StarCounter.test.tsx`

- [ ] **Step 1: 실패하는 테스트 작성**

```typescript
// packages/client/src/features/rewards/components/StarCounter.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StarCounter } from './StarCounter';

vi.mock('../hooks/useStarBalance', () => ({
  useStarBalance: vi.fn(),
}));
import { useStarBalance } from '../hooks/useStarBalance';

describe('StarCounter', () => {
  it('balance 0 일 때 0 ⭐ 표시', () => {
    (useStarBalance as any).mockReturnValue({ data: { stars_total: 0, streak_days: 0 } });
    render(<StarCounter />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('balance 42 표시 + streak 3일 표시', () => {
    (useStarBalance as any).mockReturnValue({ data: { stars_total: 42, streak_days: 3 } });
    render(<StarCounter />);
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByLabelText(/streak/i)).toHaveTextContent('3');
  });

  it('data 없을 때 (게스트 모드) 렌더 X', () => {
    (useStarBalance as any).mockReturnValue({ data: undefined });
    const { container } = render(<StarCounter />);
    expect(container.firstChild).toBeNull();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
cd packages/client && npx vitest run src/features/rewards/components/StarCounter.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: 구현**

```tsx
// packages/client/src/features/rewards/components/StarCounter.tsx
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStarBalance } from '../hooks/useStarBalance';

interface ToastState {
  delta: number;
  key: number;
}

/** 화면 우상단 별 카운터. 잔고 증가 시 +N 토스트 자체 표시. */
export function StarCounter() {
  const { data } = useStarBalance();
  const [toast, setToast] = useState<ToastState | null>(null);
  const prevRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!data) return;
    const cur = data.stars_total;
    const prev = prevRef.current;
    if (prev != null && cur > prev) {
      setToast({ delta: cur - prev, key: Date.now() });
      const t = setTimeout(() => setToast(null), 1800);
      return () => clearTimeout(t);
    }
    prevRef.current = cur;
  }, [data]);

  if (!data) return null;

  return (
    <div className="relative inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-full text-sm font-bold text-amber-700 shadow-soft">
      <span className="text-base">⭐</span>
      <span data-testid="star-count">{data.stars_total}</span>
      {data.streak_days > 0 && (
        <span aria-label={`streak ${data.streak_days}일`} className="text-xs text-orange-500">
          🔥{data.streak_days}
        </span>
      )}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.key}
            initial={{ y: 0, opacity: 1, scale: 1 }}
            animate={{ y: -36, opacity: 0, scale: 1.3 }}
            transition={{ duration: 1.6, ease: 'easeOut' }}
            className="absolute left-1/2 -translate-x-1/2 -top-2 text-coral-500 font-black text-base pointer-events-none"
            aria-live="polite"
          >
            +{toast.delta}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
cd packages/client && npx vitest run src/features/rewards/components/StarCounter.test.tsx
```

Expected: PASS — 3 tests.

- [ ] **Step 5: 커밋**

```bash
git add packages/client/src/features/rewards/components/StarCounter.tsx \
        packages/client/src/features/rewards/components/StarCounter.test.tsx
git commit -m "feat(rewards): add StarCounter with +N toast on balance increase"
```

---

### Task 3.2: features/rewards barrel export

**Files:**
- Create: `packages/client/src/features/rewards/index.ts`

- [ ] **Step 1: 생성**

```typescript
// packages/client/src/features/rewards/index.ts
export { rewardsApi } from './api/rewards.api';
export { useStarBalance, STAR_BALANCE_KEY } from './hooks/useStarBalance';
export { useStarLedger } from './hooks/useStarLedger';
export { StarCounter } from './components/StarCounter';
```

- [ ] **Step 2: 커밋**

```bash
git add packages/client/src/features/rewards/index.ts
git commit -m "feat(rewards): add public barrel export"
```

---

### Task 3.3: LibraryPage 헤더에 StarCounter 통합

**Files:**
- Modify: `packages/client/src/pages/LibraryPage.tsx`

- [ ] **Step 1: AuthCornerBar 위치 찾기**

```bash
grep -n "AuthCornerBar\|ParentCornerButton" packages/client/src/pages/LibraryPage.tsx
```

- [ ] **Step 2: StarCounter import + 헤더에 삽입**

`StarCounter` 를 `ParentCornerButton` 옆 (왼쪽) 에 배치. 활성 프로필 있을 때만 표시 (StarCounter 자체가 null 처리).

```tsx
// LibraryPage.tsx 상단 import 추가
import { StarCounter } from '@/features/rewards';

// AuthCornerBar 또는 헤더 우측 영역에서 ParentCornerButton 옆:
<div className="flex items-center gap-3">
  <StarCounter />
  <ParentCornerButton ... />
</div>
```

> 정확한 JSX 위치는 LibraryPage 의 헤더 컴포넌트 (보통 화면 우상단 floating). 기존 `ParentCornerButton` 또는 `AuthCornerBar` 가 있는 줄 옆에 삽입.

- [ ] **Step 3: typecheck**

```bash
pnpm --filter @tangobook/client typecheck
```

- [ ] **Step 4: dev 서버 실행 + 수동 검증**

```bash
pnpm dev
```

브라우저 `/library` 접속 → 자녀 프로필 활성 상태에서 우상단에 ⭐0 표시 확인. (이미 트리거가 작동 중이라면 적립된 별 표시).

- [ ] **Step 5: 커밋**

```bash
git add packages/client/src/pages/LibraryPage.tsx
git commit -m "feat(library): show StarCounter in header"
```

---

### Task 3.4: GameResultScreen 에 별 적립 토스트

**Files:**
- Modify: `packages/client/src/features/games/components/GameResultScreen.tsx`

- [ ] **Step 1: 동작 정의**

게임 완료 → 화면 표시 → 1초 후 잔고 refetch → 증가분 만큼 "+N ⭐ 저장됨!" 텍스트 표시.

- [ ] **Step 2: 구현**

```tsx
// GameResultScreen.tsx 상단 import
import { useStarBalance } from '@/features/rewards';
import { useEffect, useRef, useState } from 'react';

// 컴포넌트 내부에 추가
const { data: balance, refetch } = useStarBalance();
const [savedDelta, setSavedDelta] = useState<number | null>(null);
const initialBalanceRef = useRef<number | null>(null);

// 마운트 시 초기 잔고 기록
useEffect(() => {
  initialBalanceRef.current = balance?.stars_total ?? null;
  // 1초 뒤 트리거가 적립 끝났을 시점에 refetch
  const t = setTimeout(() => {
    void refetch();
  }, 1200);
  return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // 의도적으로 mount 1회만

// balance 변화 시 delta 계산
useEffect(() => {
  if (balance == null || initialBalanceRef.current == null) return;
  const delta = balance.stars_total - initialBalanceRef.current;
  if (delta > 0) setSavedDelta(delta);
}, [balance]);
```

JSX 에서 별 3개 표시 옆에 신규 영역:

```tsx
{savedDelta != null && (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-success/10 border border-success/30 rounded-full text-success font-bold"
    role="status"
  >
    <span>⭐</span>
    <span>+{savedDelta} 저장됨!</span>
  </motion.div>
)}
```

- [ ] **Step 3: typecheck**

```bash
pnpm --filter @tangobook/client typecheck
```

- [ ] **Step 4: 수동 검증**

`pnpm dev` 후 자녀 프로필로 게임 1판 → 결과 화면에서 ⭐ +N 저장됨 인디케이터 표시 확인.

- [ ] **Step 5: 커밋**

```bash
git add packages/client/src/features/games/components/GameResultScreen.tsx
git commit -m "feat(games): show '+N ⭐ saved' indicator on game result screen"
```

---

### Task 3.5: 통합 검증 스크립트 (수동, 1회성)

**목적**: 실제 Supabase 와 트리거가 동작하는지 end-to-end 확인.

- [ ] **Step 1: 자녀 프로필로 로그인**

브라우저 `/login` → 자녀 프로필 선택.

- [ ] **Step 2: 동화 1권 끝까지 읽기**

`/library` → 동화 카드 클릭 → 마지막 페이지까지 자동 또는 수동 진행.

- [ ] **Step 3: 잔고 변화 확인**

`/library` 복귀 후 우상단 StarCounter 잔고:
- 기대: 페이지 수 × 1 + 5 (마지막) ≈ 약 19~25 별 (14페이지 기준)
- 첫 일일 접속 시: +2 추가
- 7일 streak: +20 추가

- [ ] **Step 4: 게임 1판 플레이**

게임 시작 → 끝 → 결과 화면에서 "+N ⭐ 저장됨" 확인.

- [ ] **Step 5: Supabase ledger 확인**

Supabase SQL Editor:
```sql
select source_type, delta, metadata, created_at
  from star_ledger
  where profile_id = '<자녀-uuid>'
  order by created_at desc
  limit 20;
```

기대 출력 — `page_read` (delta 1·5 혼합), `game_correct`, `daily_login` 등 다양한 source.

- [ ] **Step 6: 누적 잔고 일치 확인**

```sql
select stars_total from child_profiles where id = '<자녀-uuid>';
-- 위 ledger 의 delta 합계와 일치해야 함
select sum(delta) from star_ledger where profile_id = '<자녀-uuid>';
```

기대: 두 값 동일.

---

## Chunk 4: 마무리 — 문서 업데이트

### Task 4.1: CLAUDE.md / MEMORY.md 업데이트

**Files:**
- Modify: `CLAUDE.md` (root)
- Create: `memory/rewards-system.md` (자동 메모리)
- Modify: `C:\Users\101024\.claude\projects\C--projects-tangobook\memory\MEMORY.md`

- [ ] **Step 1: CLAUDE.md 에 별 시스템 섹션 추가**

기존 "Auth Feature 구조" 섹션 뒤에 `## 별/포인트 시스템 (Phase 1, 2026-04-30)` 추가:

```markdown
## 별/포인트 시스템 (Phase 1, 2026-04-30)
- **데이터**: Supabase `child_profiles.stars_total` + `star_ledger` 거래 원장. SQL 셋업: `scripts/supabase-rewards-setup.sql`
- **적립 흐름**: 클라이언트가 `learning_events` insert → Postgres 트리거 `handle_learning_event()` 가 자동 별 적립 + word_mastery 갱신 + collection 상태 전이
- **별 적립 규칙**: page_read +1 (마지막 페이지 +5) · game_correct +1 · daily_login +2 · 7일 streak +20
- **별 사용**: hori_item / foil_card / season_costume 만 허용 (validate_star_spend trigger 가 강제)
- **클라이언트**: `features/rewards/` — `useStarBalance` (TanStack Query) + `StarCounter` (라이브러리 헤더, +N 토스트 자체)
- **GameResultScreen**: 게임 종료 후 1.2초 뒤 잔고 refetch → "+N ⭐ 저장됨" 인디케이터
- 스펙: [docs/superpowers/specs/2026-04-30-rewards-sr-collection-design.md](docs/superpowers/specs/2026-04-30-rewards-sr-collection-design.md)
- 플랜: [docs/superpowers/plans/2026-04-30-stars-infrastructure-plan.md](docs/superpowers/plans/2026-04-30-stars-infrastructure-plan.md)
```

- [ ] **Step 2: 자동 메모리 파일 추가**

```bash
# C:\Users\101024\.claude\projects\C--projects-tangobook\memory\rewards-system.md
```

내용 (frontmatter 포함):
```markdown
---
name: 별/포인트 시스템 (Phase 1)
description: Supabase 트리거 기반 별 적립 + StarCounter UI. 2026-04-30 Phase 1 완료.
type: project
---

# 별/포인트 시스템 — Phase 1 완료 (2026-04-30)

## 핵심 결정
- 적립은 server-side trigger (`handle_learning_event`)로 자동 — 클라가 별도 API 호출 안 함
- 클라는 `learning_events` insert 만 하고 잔고는 polling
- 별 사용은 호리 코스메틱만 허용 (DB 차원 enforce)

## 핵심 파일
- SQL: `scripts/supabase-rewards-setup.sql`
- shared 타입: `packages/shared/src/types/rewards.ts`
- 클라 features: `packages/client/src/features/rewards/`
- ViewerContainer page_read에 totalPages/lastPage 포함 — 트리거 마지막 페이지 +5 감지용

## Phase 2~6 후속 작업
spec section 11 참고. SR 엔진/카드/호리/놀이터/미션 단계적 진행.
```

- [ ] **Step 3: MEMORY.md 인덱스에 1줄 추가**

```bash
# 기존 MEMORY.md 마지막 ## section 뒤에:
```

```markdown
## Stars Infrastructure (2026-04-30, Phase 1)
See [rewards-system.md](rewards-system.md) — Supabase trigger 기반 별 자동 적립 + StarCounter UI 통합. 후속 Phase 2~6 (SR/카드/호리) 는 별도 진행.
```

- [ ] **Step 4: 커밋**

```bash
git add CLAUDE.md
# memory 파일은 .claude 외부라 별도 커밋 X (자동 메모리)
git commit -m "docs: add Phase 1 stars infrastructure section to CLAUDE.md"
```

---

## 검증 체크리스트 (Phase 1 종료)

플랜 완료 후 다음 모두 통과해야 함:

- [ ] `pnpm --filter @tangobook/client typecheck` — 에러 없음
- [ ] `pnpm --filter @tangobook/client test` — 신규 테스트 5개 PASS, 기존 테스트 회귀 없음
- [ ] 브라우저 `/library` 에서 우상단 StarCounter 표시
- [ ] 동화 1권 완독 후 잔고 ≥ N 페이지 + 5 만큼 증가
- [ ] 게임 1판 후 결과 화면 "+N ⭐ 저장됨" 표시
- [ ] Supabase `star_ledger` 에 정확한 source_type 으로 row 기록
- [ ] `select sum(delta) from star_ledger` = `select stars_total from child_profiles` (동일)
- [ ] 7일 연속 접속 시 +20 별 보너스 확인 (선택, 시간 소요)

---

## 알려진 한계 / 후속 작업

1. **실시간 구독 미사용** — 별 변화는 5초 staleTime + window focus refetch + 게임 직후 1.2s refetch. 충분하지만 다중 탭에서 동기화 X.
2. **단어 마스터리 영속화 미적용** — 트리거가 word_mastery 도 갱신하지만, 클라 마스터리 표시는 여전히 learning_events 집계. Phase 2 에서 DB 조회로 위임.
3. **호리 놀이터 게임 별 적립 X** — 현재 게임만 emit. 호리 놀이터는 Phase 5 에서 별도 endpoint.
4. **결제 등급 ×배율 미연동** — `accounts.tier` default `'free'`. 결제 webhook 도입 시 자동 갱신.
5. **streak 끊김 알림 X** — 일일 접속 끊기면 다음 접속 시 `streak_days = 1` 로 초기화되지만 사용자에게 "어제 접속 안 했어!" 안내 X. 후속 UX 개선.

---

**플랜 작성**: 2026-04-30
**예상 소요**: 4-6시간 (테스트 작성 포함)
**선행 의존**: SQL `scripts/supabase-rewards-setup.sql` 적용 완료
