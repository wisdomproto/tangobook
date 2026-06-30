# 토스 결제 + 프리미엄 게이팅 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 국내 토스페이먼츠 단건 기간권으로 동화책 유료화를 켜고, 무료 3권·7일 체험·친구초대 +7일·프로모 배너를 붙인다.

**Architecture:** 결제 판정 로직(`entitlement.ts`)·게이팅 UI(`features/access`)는 이미 존재 — 재사용. 신규는 (1) 토스 결제 서버 플로우(checkout→confirm, 금액 서버검증·멱등), (2) Supabase `payments`/`entitlements`(service-role 쓰기), (3) 클라 payment feature + `useAccess` entitlement 주입, (4) 무료책 마킹/정렬 + paywall ON, (5) PromoBanner, (6) referral. 백엔드는 routes→controllers→services→providers 레이어 준수.

**Tech Stack:** React 18 + TanStack Query + Zustand / Express 5 + tsx / Supabase(supabase-js, service role) / `@tosspayments/tosspayments-sdk` / Vitest.

**Spec:** [docs/superpowers/specs/2026-06-30-toss-payment-monetization-design.md](../specs/2026-06-30-toss-payment-monetization-design.md)

**전제:** main 브랜치 직접 작업(사용자 워크플로우). 토스 **테스트 키**로 개발 — `TOSS_SECRET_KEY`(서버 env, `test_sk_...`), `VITE_TOSS_CLIENT_KEY`(클라 env, `test_ck_...`). 토스 문서 공개 테스트키 사용.

---

## Chunk 1: shared PLANS + entitlement 확장

**Files:**
- Create: `packages/shared/src/constants/plans.ts`
- Modify: `packages/shared/src/index.ts` (export plans)
- Modify: `packages/shared/src/utils/entitlement.ts` (변경 거의 없음 — 이미 subscription·referralBonusDays 수용. 헬퍼 `extendPaidUntil` 추가)
- Test: `packages/client/src/features/access/__tests__/entitlement.test.ts` (기존 파일에 케이스 추가)

- [ ] **Step 1: PLANS 상수 작성**

`packages/shared/src/constants/plans.ts`:
```ts
export const PLANS = {
  month1: { id: 'month1', amount: 9900, days: 30, name: '1개월 이용권' },
  year1: { id: 'year1', amount: 99000, days: 365, name: '12개월 이용권' },
} as const;

export type PlanId = keyof typeof PLANS;
export const isPlanId = (v: unknown): v is PlanId =>
  typeof v === 'string' && v in PLANS;
```

- [ ] **Step 2: shared index export**

`packages/shared/src/index.ts` 에 `export * from './constants/plans.js';` 추가 (ESM `.js` 확장자 규칙 준수 — Railway 빌드).

- [ ] **Step 3: `extendPaidUntil` 헬퍼 작성 (entitlement.ts)**

`packages/shared/src/utils/entitlement.ts` 끝에 추가:
```ts
/** 기존 paid_until(없으면 now)에서 days 만큼 연장한 ISO. 결제 성공 시 서버가 사용. */
export function extendPaidUntil(current: string | null, days: number, now = Date.now()): string {
  const base = Math.max(now, current ? Date.parse(current) || now : now);
  return new Date(base + days * 86_400_000).toISOString();
}
```

- [ ] **Step 4: 실패 테스트 작성**

`entitlement.test.ts` 에 추가:
```ts
import { extendPaidUntil, computeAccess } from '@tangobook/shared';

describe('extendPaidUntil', () => {
  const NOW = Date.parse('2026-07-01T00:00:00Z');
  it('미보유(null)면 now + days', () => {
    expect(extendPaidUntil(null, 30, NOW)).toBe('2026-07-31T00:00:00.000Z');
  });
  it('미래 만료가 남아있으면 그 위에 누적', () => {
    const future = '2026-07-10T00:00:00.000Z';
    expect(extendPaidUntil(future, 30, NOW)).toBe('2026-08-09T00:00:00.000Z');
  });
  it('과거 만료면 now 기준 재시작', () => {
    expect(extendPaidUntil('2026-06-01T00:00:00Z', 30, NOW)).toBe('2026-07-31T00:00:00.000Z');
  });
});

describe('computeAccess with paid_until subscription', () => {
  const NOW = Date.parse('2026-07-01T00:00:00Z');
  it('paid_until 미래 → subscribed/entitled', () => {
    const a = computeAccess({ account: { createdAt: '2026-01-01T00:00:00Z' },
      subscription: { status: 'active', currentPeriodEnd: '2026-08-01T00:00:00Z' } }, NOW);
    expect(a.status).toBe('subscribed');
    expect(a.isEntitled).toBe(true);
  });
});
```

- [ ] **Step 5: 테스트 실패 확인**

Run: `pnpm --filter client exec vitest run src/features/access/__tests__/entitlement.test.ts`
Expected: FAIL (extendPaidUntil not exported)

- [ ] **Step 6: shared 빌드 + 테스트 통과 확인**

Run: `pnpm --filter shared build && pnpm --filter client exec vitest run src/features/access/__tests__/entitlement.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add packages/shared/src/constants/plans.ts packages/shared/src/index.ts packages/shared/src/utils/entitlement.ts packages/client/src/features/access/__tests__/entitlement.test.ts
git commit -m "feat(payment): add PLANS constants + extendPaidUntil helper"
```

---

## Chunk 2: Supabase 마이그레이션 (payments · entitlements · RLS)

**Files:**
- Create: `packages/server/scripts/supabase-payments.sql`
- 적용: Supabase MCP `apply_migration` 또는 SQL Editor

- [ ] **Step 1: 마이그레이션 SQL 작성**

`packages/server/scripts/supabase-payments.sql`:
```sql
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  order_id text not null unique,
  payment_key text,
  plan text not null,
  amount integer not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists public.entitlements (
  account_id uuid primary key references public.accounts(id) on delete cascade,
  paid_until timestamptz,
  referral_bonus_days integer not null default 0,
  referral_code text unique,
  referred_by uuid references public.accounts(id),
  updated_at timestamptz not null default now()
);

alter table public.payments enable row level security;
alter table public.entitlements enable row level security;

-- 본인 행 select 만 (쓰기는 service role = RLS 우회)
create policy "own payments read" on public.payments
  for select using (auth.uid() = account_id);
create policy "own entitlement read" on public.entitlements
  for select using (auth.uid() = account_id);

create index if not exists idx_payments_account on public.payments(account_id);
```

- [ ] **Step 2: 마이그레이션 적용**

Supabase MCP `apply_migration` (name: `payments_entitlements`, query: 위 SQL). 또는 대시보드 SQL Editor.

- [ ] **Step 3: 적용 검증**

Supabase MCP `list_tables` → `payments`, `entitlements` 존재 확인. `get_advisors`(security) → RLS 경고 없는지 확인.

- [ ] **Step 4: Commit**

```bash
git add packages/server/scripts/supabase-payments.sql
git commit -m "feat(payment): supabase payments + entitlements schema with RLS"
```

---

## Chunk 3: 서버 결제 (checkout · confirm) + toss provider

**Files:**
- Create: `packages/server/src/providers/toss.provider.ts`
- Create: `packages/server/src/services/payment.service.ts`
- Create: `packages/server/src/controllers/payment.controller.ts`
- Create: `packages/server/src/routes/payment.routes.ts`
- Modify: `packages/server/src/app.ts` (route 등록)
- Modify: `packages/server/.env.example` (`TOSS_SECRET_KEY`)
- Test: `packages/server/src/services/payment.service.test.ts`

**전제:** service-role supabase 클라이언트는 마케팅 포트의 `supabase-admin.provider` 재사용. 인증 미들웨어는 기존 패턴(요청의 Supabase JWT → account_id) 확인 후 사용. account_id 출처가 없으면 confirm body 가 아니라 **검증된 토큰**에서 가져온다(위조 방지).

- [ ] **Step 1: toss.provider 작성 (HTTP 래퍼)**

`toss.provider.ts` — `confirmPayment({ paymentKey, orderId, amount })` → `POST https://api.tosspayments.com/v1/payments/confirm`, `Authorization: Basic base64(secret + ':')`. 실패 시 토스 에러 body 포함해 throw. 시크릿키는 `process.env.TOSS_SECRET_KEY` (없으면 起動 시 경고).

- [ ] **Step 2: payment.service 실패 테스트 작성**

`payment.service.test.ts` — toss.provider + supabase-admin mock:
```ts
// createCheckout: PLANS 금액으로 pending payment 생성, orderId 반환
// confirmPayment:
//   - 금액 불일치(요청 amount != PLANS[plan].amount) → AppError(400)
//   - 정상 → toss confirm 호출 + entitlements.paid_until 연장 + payments paid
//   - 이미 paid 인 orderId → 재호출 시 멱등(toss confirm 재호출 X, 200)
```
구체 케이스: 금액 불일치 거부, 멱등(중복 confirm), entitlement 연장 호출 검증.

- [ ] **Step 3: 테스트 실패 확인**

Run: `pnpm --filter server exec vitest run src/services/payment.service.test.ts`
Expected: FAIL (service 미구현)

- [ ] **Step 4: payment.service 구현**

`createCheckout(accountId, planId)`:
- `isPlanId` 검증 → PLANS 금액 → `order_id = 'tb_' + crypto.randomUUID()` → payments insert(pending) → `{ orderId, amount, orderName }`.

`confirmPayment(accountId, { paymentKey, orderId, amount })`:
- payments select by order_id → 없거나 account_id 불일치 → AppError(404/403)
- status==='paid' → 멱등 return(현 entitlement)
- `amount !== row.amount` → AppError(400, '금액 불일치')
- `toss.confirmPayment(...)` 호출
- 성공 → payments update(paid, paymentKey, paid_at) + entitlements upsert(`paid_until = extendPaidUntil(cur, PLANS[plan].days)`)
- 모든 쓰기 service-role.

- [ ] **Step 5: controller + routes**

`payment.controller.ts`: `postCheckout`/`postConfirm` — req 파싱 + asyncHandler + accountId는 인증 미들웨어 컨텍스트에서. `payment.routes.ts`: `POST /checkout`, `POST /confirm` (인증 필요). `app.ts`: `app.use('/api/payments', paymentRoutes)`.

- [ ] **Step 6: 웹훅 백스톱 (신뢰성 — confirm 누락 방지)**

리스크: 토스 승인 후 `/confirm` 호출 전 탭이 닫히면 토스엔 결제됐는데 entitlement 미연장(고아). 백스톱:
- `POST /api/payments/webhook` (토스 웹훅, 인증 미들웨어 제외 — 토스가 호출). 토스 `PAYMENT_STATUS_CHANGED`/`DONE` 이벤트 수신 → orderId로 payments 조회 → **confirm 로직과 동일한 멱등 처리**(이미 paid면 no-op, 아니면 entitlement 연장).
- 웹훅 진위 검증: 토스 webhook secret(있으면)으로 검증, 없으면 paymentKey 로 토스 `GET /v1/payments/{paymentKey}` 재조회해 상태 확인 후 처리(위조 방지).
- service의 `extendEntitlementForPaidOrder(orderId)` 를 confirm/webhook 둘 다 호출(DRY).
- 테스트: 웹훅 중복 수신 멱등, confirm 먼저/웹훅 먼저 둘 다 1회만 연장.

- [ ] **Step 7: 테스트 통과 확인**

Run: `pnpm --filter server exec vitest run src/services/payment.service.test.ts`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add packages/server/src/providers/toss.provider.ts packages/server/src/services/payment.service.* packages/server/src/controllers/payment.controller.ts packages/server/src/routes/payment.routes.ts packages/server/src/app.ts packages/server/.env.example
git commit -m "feat(payment): server toss checkout/confirm + webhook backstop (amount verify, idempotent)"
```

---

## Chunk 4: 클라 payment feature + useAccess 연동

**Files:**
- Create: `packages/client/src/features/payment/api/payment.api.ts`
- Create: `packages/client/src/features/payment/hooks/useCheckout.ts`
- Create: `packages/client/src/features/payment/hooks/useEntitlement.ts`
- Create: `packages/client/src/features/payment/pages/SubscribePage.tsx`
- Create: `packages/client/src/features/payment/pages/PaymentSuccessPage.tsx`
- Create: `packages/client/src/features/payment/pages/PaymentFailPage.tsx`
- Create: `packages/client/src/features/payment/components/PlanCard.tsx`
- Modify: `packages/client/src/features/access/hooks/useAccess.ts` (entitlement 주입)
- Modify: `packages/client/src/router/index.tsx` (routes)
- Modify: `packages/client/.env.local.example` (`VITE_TOSS_CLIENT_KEY`)
- Test: `packages/client/src/features/payment/__tests__/useAccess.test.tsx`

- [ ] **Step 1: payment.api 작성** — `apiPost('/payments/checkout', {plan})`, `apiPost('/payments/confirm', {...})`.

- [ ] **Step 2: useEntitlement 훅** — TanStack Query로 `entitlements` 본인행 fetch(supabase, RLS). `{ paidUntil, referralBonusDays }` 반환. PAYWALL off면 skip.

- [ ] **Step 3: useAccess 연동 (실패 테스트 먼저)**

`useAccess.test.tsx`: paid_until 미래면 isEntitled=true / referralBonusDays 반영 / PAYWALL off면 항상 entitled.

- [ ] **Step 4: useAccess 수정**

```ts
// PAYWALL_ENABLED 시: useEntitlement() 로 row 가져와
// computeAccess({ account, subscription: paidUntil ? {status:'active', currentPeriodEnd: paidUntil} : null,
//                 referralBonusDays })
```

- [ ] **Step 5: SubscribePage + PlanCard** — PLANS 2개 카드 → 클릭 시 `useCheckout` → 토스 SDK `loadTossPayments(VITE_TOSS_CLIENT_KEY)` → `requestPayment({orderId, amount, orderName, successUrl:'/payments/success', failUrl:'/payments/fail'})`.

- [ ] **Step 6: PaymentSuccessPage** — query(paymentKey,orderId,amount) → `payment.api.confirm` → 성공 시 entitlement invalidate + `/library` 이동. PaymentFailPage — 사유 표시 + 재시도.

- [ ] **Step 7: routes 등록** — `/subscribe`, `/payments/success`, `/payments/fail`.

- [ ] **Step 8: 테스트 + typecheck 통과 확인**

Run: `pnpm --filter client exec vitest run src/features/payment && pnpm --filter client exec tsc --noEmit`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add packages/client/src/features/payment packages/client/src/features/access/hooks/useAccess.ts packages/client/src/router/index.tsx packages/client/.env.local.example
git commit -m "feat(payment): client checkout flow + useAccess entitlement injection"
```

---

## Chunk 5: 무료책 마킹 + 라이브러리 정렬 + paywall ON

**Files:**
- Create: `packages/server/scripts/mark-free-books.mjs`
- Modify: `_index/library-config.json` (R2 — 스크립트 또는 /library-master)
- Modify: `packages/client/src/features/access/config.ts` (`PAYWALL_ENABLED = true`)

- [ ] **Step 1: 무료책 마킹 스크립트 (멱등)**

`mark-free-books.mjs`: R2 전체 storybook 스캔 →
- FREE_IDS = `['1772107608499','1772181399388','1778555233699']` + 각 `__L2`/`__L4` → `isAccessibleForFree = true`
- 그 외 **공개(isPublic 계열) 책** → `isAccessibleForFree = false`. **비공개/미완성 책은 스킵**(건드리지 않음).
- 변경된 책만 저장(로그). dry-run 플래그 지원.

- [ ] **Step 2: dry-run 실행 → 영향 책 수 확인**

Run: `node packages/server/scripts/mark-free-books.mjs --dry-run`
Expected: 무료 N권 / 잠금 M권 / 스킵(비공개) K권 출력. 숫자 sanity 확인.

- [ ] **Step 3: 실제 적용**

Run: `node packages/server/scripts/mark-free-books.mjs`

- [ ] **Step 4: library-config 정렬**

`categoryOrder` 맨 앞 `세계 명작`, `bookPriority['세계 명작']` 앞 3개 = FREE base id. `/library-master`에서 하거나 스크립트로 R2 `_index/library-config.json` patch.

- [ ] **Step 5: paywall ON**

`config.ts`: `export const PAYWALL_ENABLED = true;`

- [ ] **Step 6: 수동 확인** — 게스트로 `/library` → 무료 3권 맨 앞·열람 가능, 유료책 LockBadge. (preview 도구)

- [ ] **Step 7: Commit**

```bash
git add packages/server/scripts/mark-free-books.mjs packages/client/src/features/access/config.ts
git commit -m "feat(payment): mark free books + enable paywall + order free first"
```

---

## Chunk 6: PromoBanner (롤링 제거)

**Files:**
- Create: `packages/client/src/features/library/components/PromoBanner.tsx`
- Modify: `packages/client/src/pages/LibraryPage.tsx` (LibraryBanner → PromoBanner)
- (보존) `LibraryBanner.tsx` 는 남기되 미사용 — 또는 삭제
- Test: `packages/client/src/features/library/components/__tests__/PromoBanner.test.tsx`
- Asset: `public/images/library-banner/promo.webp` (이미 존재)

- [ ] **Step 1: 실패 테스트 작성** — 게스트→"로그인"/`/login`, 체험중→"N일 남음"+`/subscribe`, 만료→"이용권", 구독→null(숨김). useAccess/useAuth mock.

- [ ] **Step 2: 테스트 실패 확인** — Run vitest, Expected FAIL.

- [ ] **Step 3: PromoBanner 구현** — `aspect-[4/1] md:aspect-[5/1]` 컨테이너, 우측 배경 `promo.webp`(object-cover, 좌측 fade mask), 좌측 헤드라인+서브+코랄 CTA. 상태별 카피/링크. `break-keep`, `font-display`. 구독자면 `return null`.

- [ ] **Step 4: LibraryPage 교체** — `{type === 'storybook' && <PromoBanner />}`.

- [ ] **Step 5: 테스트 통과 + preview 확인** — vitest PASS + preview 스크린샷(게스트 상태 배너).

- [ ] **Step 6: Commit**

```bash
git add packages/client/src/features/library/components/PromoBanner.tsx packages/client/src/pages/LibraryPage.tsx packages/client/src/features/library/components/__tests__/PromoBanner.test.tsx
git commit -m "feat(payment): promo banner (login 7d / referral +7d), drop rolling banner"
```

---

## Chunk 7: 친구초대 +7일 (referral)

**Files:**
- Create: `packages/server/src/services/referral.service.ts`
- Modify: `packages/server/src/routes/payment.routes.ts` (또는 신규 referral.routes)
- Create: `packages/client/src/features/payment/hooks/useReferralCapture.ts`
- Modify: `packages/client/src/features/auth/context/AuthContext.tsx` (가입 후 referral redeem 트리거)
- Create: `packages/client/src/features/payment/components/InviteButton.tsx`
- Test: `packages/server/src/services/referral.service.test.ts`

- [ ] **Step 1: referral.service 실패 테스트** — `redeemReferral(newAccountId, code)`:
  - 자기 자신 코드 → 무시(적립 X)
  - 이미 referred_by 있음 → 무시
  - 정상 → 신규계정 referred_by 기록 + 초대자 `referral_bonus_days += 7` (상한 28 — `min(28, +7)`)
  - 상한 도달 시 더 안 늘어남

- [ ] **Step 2: 테스트 실패 확인** — vitest FAIL.

- [ ] **Step 3: referral.service 구현** — entitlements 조회/upsert(service role). `ensureReferralCode(accountId)` (없으면 짧은코드 발급). `redeemReferral` 가드 로직. **상한 증가는 원자적으로**: `update entitlements set referral_bonus_days = least(28, referral_bonus_days + 7) where account_id = $inviter` 단일 SQL(읽고-증가 레이스 차단). 자기초대/중복은 `referred_by` 기록을 조건부(WHERE referred_by is null)로 처리해 동시성 안전.

- [ ] **Step 4: redeem 엔드포인트** — `POST /api/payments/referral/redeem { code }`(인증 필요, accountId=토큰). 신규가입 직후 1회 호출.

- [ ] **Step 5: 클라 캡처** — `useReferralCapture`: 앱 진입 시 URL `?ref=CODE` → localStorage(`tb_ref`) 저장. AuthContext: 신규 세션 + 미사용 ref 있으면 redeem 호출 후 localStorage 클리어.

- [ ] **Step 6: InviteButton** — 내 referral_code로 `tangobook.co.kr/?ref=CODE` 링크 복사/공유(부모 설정 또는 배너 CTA). entitlement에서 코드 fetch(없으면 ensure).

- [ ] **Step 7: 테스트 통과 확인** — Run server + client vitest, Expected PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/server/src/services/referral.service.* packages/server/src/routes packages/client/src/features/payment/hooks/useReferralCapture.ts packages/client/src/features/auth/context/AuthContext.tsx packages/client/src/features/payment/components/InviteButton.tsx
git commit -m "feat(payment): friend referral +7d with abuse guards"
```

---

## 최종 검증

- [ ] `pnpm typecheck` (전 패키지) PASS
- [ ] `pnpm --filter client test` / `pnpm --filter server test` PASS
- [ ] 샌드박스 수동 QA: 게스트(무료3권만) → 가입(체험7일) → /subscribe 결제(토스 테스트카드) → 유료책 열람 → 부모설정 만료일 표시 → 초대링크로 가입 시 초대자 +7일
- [ ] "업데이트 하자" 워크플로우(CLAUDE.md·memory·commit·push)

## 미확정 (구현 중 확정)
- 가격(9,900/99,000 placeholder) · referral 상한(+28d) · 구독자 배너(숨김) · /subscribe 시안

## 신뢰성 메모 (스펙 리뷰 반영)
- **고아 결제 방지**: confirm(redirect) + webhook(Chunk 3 Step 6) 이중화. 추가로 `payments.status='pending'` 가 일정 시간 경과 시 토스 재조회로 정리하는 reconciliation은 운영 단계 옵션(현재 webhook으로 충분).
- **payments 종료상태**: 미확인 pending 정리 정책 — 만료(예 1h) 시 `failed` 마킹(운영 cron, 1차 필수 아님).
- **referral 동시성**: 원자적 `least(28, +7)` 증가 + 조건부 referred_by 기록(Chunk 7 Step 3).
