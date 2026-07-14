# 해외 결제 (Paddle) 연동 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 국내 토스 결제는 그대로 두고, 해외 사용자를 위한 Paddle(MoR) 단건 기간권 결제 레인을 추가한다 — entitlement `paid_until` 하나로 수렴.

**Architecture:** "결제는 플러그인, entitlement는 하나". 토스 코드는 무변경. `extendEntitlementForPaidOrder`(멱등 flip + revert)를 provider-agnostic 공유 코어로 추출하고, `paddle.service.ts`가 confirm(동기, 주) + webhook(멱등, 백스톱) 이중 경로로 같은 코어에 수렴. priceId 위조 방지는 서버 env 맵 기준. raw-body 웹훅은 app 레벨(전역 json 앞) 등록.

**Tech Stack:** Express v5 + TypeScript(서버), React 18 + TanStack Query + react-i18next(클라), Supabase(entitlement 저장), `@paddle/paddle-js`(클라 오버레이), Paddle Billing API(서버 재조회·서명검증), Vitest(테스트).

**Spec:** `docs/superpowers/specs/2026-07-15-overseas-paddle-payment-design.md`

---

## File Structure

**신규 (서버)**
- `packages/server/src/services/entitlement-extend.ts` — provider-agnostic 수렴 코어(`extendEntitlementForPaidOrder` + `requireAdmin` + `PaymentRow`)
- `packages/server/src/providers/paddle.provider.ts` — 서명 검증 + getTransaction 싱글톤
- `packages/server/src/services/paddle.service.ts` — createPaddleCheckout / confirmPaddlePayment / handlePaddleWebhook / verifyAndExtend
- `packages/server/src/services/paddle.service.test.ts` — Paddle 서비스 유닛 테스트
- `packages/server/scripts/reset-overseas-trials.sql` — 컷오버 시 해외 계정 trial 시드

**신규 (클라)**
- `packages/client/src/features/payment/hooks/useCheckoutPaddle.ts` — Paddle.js 오버레이 + confirm

**수정 (서버)**
- `packages/server/scripts/supabase-payments.sql` — payments 에 provider·currency 컬럼(멱등)
- `packages/server/src/config/index.ts` — `paddle` config 블록
- `packages/server/src/services/payment.service.ts` — 코어를 entitlement-extend 에서 re-import
- `packages/server/src/routes/payment.routes.ts` — paddle checkout·confirm 라우트
- `packages/server/src/controllers/payment.controller.ts` — postPaddleCheckout·postPaddleConfirm·postPaddleWebhook
- `packages/server/src/app.ts` — raw-body 웹훅 라우트(전역 json 앞)
- `packages/server/.env.example` — Paddle env 문서화

**수정 (shared)**
- `packages/shared/src/constants/plans.ts` — (변경 없음. priceId 는 env 라 클라/서버 각각 config에서 읽음 — plans.ts 무변경 확인)

**수정 (클라)**
- `packages/client/src/features/access/config.ts` — `isPaddleConfigured` + auto-off 판정
- `packages/client/src/features/access/hooks/useAccess.ts` — `!isPaddleConfigured` gate
- `packages/client/src/features/payment/api/payment.api.ts` — paddleCheckout·paddleConfirm
- `packages/client/src/features/payment/pages/SubscribePage.tsx` — 로케일 기본 + 수동 전환
- `packages/client/src/i18n/locales/*/payment.json` — 레인 전환 카피
- `packages/client/.env.example` (있으면) — Paddle 클라 env

---

## Chunk 1: DB 마이그레이션 + 서버 config

### Task 1: payments 테이블에 provider·currency 컬럼 추가

**Files:**
- Modify: `packages/server/scripts/supabase-payments.sql`

- [ ] **Step 1: SQL 멱등 alter 추가**

`supabase-payments.sql`의 `create table ... payments (...)` 블록 **뒤**, `alter table public.entitlements add column if not exists trial_started_at` 근처에 추가:

```sql
-- Paddle(해외 결제) 레인 — 결제 provider·통화 기록. 기존 행은 default 로 toss/KRW.
alter table public.payments
  add column if not exists provider text not null default 'toss',   -- 'toss' | 'paddle'
  add column if not exists currency text not null default 'KRW';    -- 'KRW' | 'USD' | ...
```

- [ ] **Step 2: Supabase 에 적용**

Supabase MCP `apply_migration`(name: `payments_add_provider_currency`) 또는 대시보드 SQL Editor 에서 위 alter 실행. 멱등이라 재실행 안전.
Expected: 성공. `select provider, currency from payments limit 1;` → 기존 행이 `toss`/`KRW`.

- [ ] **Step 3: Commit**

```bash
git add packages/server/scripts/supabase-payments.sql
git commit -m "feat(payments): add provider/currency columns for Paddle rail"
```

### Task 2: 서버 config 에 paddle 블록 추가

**Files:**
- Modify: `packages/server/src/config/index.ts` (기존 `toss: { secretKey }` 블록 옆, ~line 99-101)

- [ ] **Step 1: paddle config 추가**

`toss: { secretKey: ... },` 블록 **뒤**에:

```ts
  paddle: {
    apiKey: process.env.PADDLE_API_KEY ?? '',
    webhookSecret: process.env.PADDLE_WEBHOOK_SECRET ?? '',
    // 🔴 웹훅/confirm priceId 검증의 유일한 소스. VITE_* 는 서버에 없으므로 서버 전용 env.
    priceIds: {
      month1: process.env.PADDLE_PRICE_MONTH1 ?? '',
      year1: process.env.PADDLE_PRICE_YEAR1 ?? '',
    } as Record<string, string>,
  },
```

- [ ] **Step 2: 타입체크**

Run: `pnpm --filter server typecheck` (또는 `pnpm typecheck`)
Expected: PASS (config 는 `as const` 이므로 새 블록도 그대로 통과).

- [ ] **Step 3: .env.example 문서화**

`packages/server/.env.example` 에 추가:
```
# Paddle (해외 결제 MoR) — sandbox 로 먼저 검증, live 는 심사 통과 후
PADDLE_API_KEY=
PADDLE_WEBHOOK_SECRET=
PADDLE_PRICE_MONTH1=
PADDLE_PRICE_YEAR1=
```

- [ ] **Step 4: Commit**

```bash
git add packages/server/src/config/index.ts packages/server/.env.example
git commit -m "feat(config): add Paddle server config (apiKey, webhookSecret, priceIds)"
```

---

## Chunk 2: 서버 — 수렴 코어 추출 + Paddle provider/service (TDD)

### Task 3: entitlement-extend 공유 코어 추출 (리팩터, 회귀 그린 유지)

**Files:**
- Create: `packages/server/src/services/entitlement-extend.ts`
- Modify: `packages/server/src/services/payment.service.ts`
- Test: `packages/server/src/services/payment.service.test.ts` (기존 — 회귀 확인용, 수정 최소)

- [ ] **Step 1: 코어 파일 생성 (requireAdmin + PaymentRow + extendEntitlementForPaidOrder 이동)**

`payment.service.ts` 에서 아래 3개를 잘라 `entitlement-extend.ts` 로 옮긴다(로직 변경 없음):
- `PaymentRow` 인터페이스
- `requireAdmin()` 헬퍼
- `extendEntitlementForPaidOrder()` 함수

```ts
// packages/server/src/services/entitlement-extend.ts
import { PLANS, extendPaidUntil } from '@tangobook/shared';
import { getSupabaseAdmin } from '../providers/supabase-admin.provider.js';
import { AppError } from '../middleware/error.middleware.js';

export interface PaymentRow {
  id: string;
  order_id: string;
  account_id: string;
  plan: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed';
  payment_key?: string | null;
  paid_at?: string | null;
  provider?: string;
  currency?: string;
}

export function requireAdmin() {
  const admin = getSupabaseAdmin();
  if (!admin) throw new AppError(503, '결제 서비스를 사용할 수 없습니다 (Supabase 미설정)');
  return admin;
}

/**
 * Idempotent: marks the payment 'paid' and upserts the entitlement.
 * Provider-agnostic — toss·paddle 양쪽이 여기로 수렴. 조건부 flip 으로 exactly-once.
 * (본문은 기존 payment.service.ts 의 extendEntitlementForPaidOrder 와 동일 — 그대로 이동)
 */
export async function extendEntitlementForPaidOrder(
  paymentRow: PaymentRow,
  paymentKey: string
): Promise<void> {
  // ... 기존 본문 그대로 (idempotency guard → 조건부 flip → upsert → revert-on-failure)
}
```

- [ ] **Step 2: payment.service.ts 에서 re-import**

`payment.service.ts` 상단 import 에 추가하고, 지운 3개 대신 re-export(테스트가 `payment.service.js` 에서 `extendEntitlementForPaidOrder` 를 import 하므로 유지):

```ts
import {
  requireAdmin,
  extendEntitlementForPaidOrder,
  type PaymentRow,
} from './entitlement-extend.js';

// 테스트 호환 — 기존 import 경로 유지
export { extendEntitlementForPaidOrder };
```

`payment.service.ts` 내부의 `requireAdmin`/`PaymentRow` 로컬 정의는 삭제하고 import 를 사용.

- [ ] **Step 3: 기존 테스트 회귀 확인**

Run: `pnpm --filter server test payment.service`
Expected: PASS — 모든 기존 테스트 그린(코어 이동은 동작 무변경).

- [ ] **Step 4: 타입체크**

Run: `pnpm --filter server typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/server/src/services/entitlement-extend.ts packages/server/src/services/payment.service.ts
git commit -m "refactor(payments): extract provider-agnostic entitlement-extend core"
```

### Task 4: Paddle provider — 서명 검증 (TDD)

**Files:**
- Create: `packages/server/src/providers/paddle.provider.ts`
- Test: `packages/server/src/providers/paddle.provider.test.ts`

Paddle 웹훅 서명: `Paddle-Signature: ts=<unix>;h1=<hex>` 헤더. `h1 = HMAC_SHA256(secret, "<ts>:<rawBody>")`.

- [ ] **Step 1: 실패 테스트 작성**

```ts
// paddle.provider.test.ts
import { describe, it, expect } from 'vitest';
import crypto from 'node:crypto';
import { verifyPaddleSignature } from './paddle.provider.js';

const SECRET = 'pdl_ntfset_test_secret';
function sign(ts: string, body: string): string {
  const h1 = crypto.createHmac('sha256', SECRET).update(`${ts}:${body}`).digest('hex');
  return `ts=${ts};h1=${h1}`;
}

describe('verifyPaddleSignature', () => {
  it('accepts a correctly signed body', () => {
    const body = '{"event_type":"transaction.completed"}';
    const header = sign('1700000000', body);
    expect(verifyPaddleSignature(body, header, SECRET)).toBe(true);
  });
  it('rejects a tampered body', () => {
    const body = '{"event_type":"transaction.completed"}';
    const header = sign('1700000000', body);
    expect(verifyPaddleSignature('{"event_type":"tampered"}', header, SECRET)).toBe(false);
  });
  it('rejects a malformed header', () => {
    expect(verifyPaddleSignature('{}', 'garbage', SECRET)).toBe(false);
  });
  it('rejects when secret is empty', () => {
    expect(verifyPaddleSignature('{}', sign('1', '{}'), '')).toBe(false);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm --filter server test paddle.provider`
Expected: FAIL ("verifyPaddleSignature is not defined").

- [ ] **Step 3: 구현**

```ts
// paddle.provider.ts
import crypto from 'node:crypto';
import { config } from '../config/index.js';
import { AppError } from '../middleware/error.middleware.js';

/** Paddle-Signature 헤더 검증. secret 주입 가능(테스트용), 기본 config. */
export function verifyPaddleSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string = config.paddle.webhookSecret
): boolean {
  if (!secret) return false;
  const parts = Object.fromEntries(
    signatureHeader.split(';').map((kv) => kv.split('=') as [string, string])
  );
  const ts = parts['ts'];
  const h1 = parts['h1'];
  if (!ts || !h1) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${ts}:${rawBody}`).digest('hex');
  // 길이 다르면 timingSafeEqual 이 throw — 먼저 가드
  if (expected.length !== h1.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(h1));
}

interface PaddleTransaction {
  id: string;
  status: string;
  currency_code: string;
  custom_data?: { orderId?: string; accountId?: string } | null;
  items?: Array<{ price?: { id?: string } }>;
  details?: { totals?: { total?: string } };
}

/** Paddle API 로 트랜잭션 재조회(웹훅 바디만 믿지 않음). */
export async function getPaddleTransaction(txnId: string): Promise<PaddleTransaction> {
  const res = await fetch(`https://api.paddle.com/transactions/${txnId}`, {
    headers: { Authorization: `Bearer ${config.paddle.apiKey}` },
  });
  if (!res.ok) {
    throw new AppError(402, `Paddle 조회 실패: HTTP ${res.status}`);
  }
  const body = (await res.json()) as { data: PaddleTransaction };
  return body.data;
}

export const paddle = { verifyPaddleSignature, getPaddleTransaction };
export type { PaddleTransaction };
```

> ⚠️ 구현자 확인: sandbox 는 `https://sandbox-api.paddle.com`. env `PADDLE_API_BASE` 로 분리하거나 apiKey prefix 로 판정. 우선 prod URL 로 두고 sandbox 검증 시 base 를 env 화(작은 후속). transaction API 응답 형태(`data.items[].price.id`, `custom_data`)는 [Paddle Billing API docs](https://developer.paddle.com/api-reference/transactions/get-transaction) 로 실제 필드명 대조.

- [ ] **Step 4: 통과 확인**

Run: `pnpm --filter server test paddle.provider`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/server/src/providers/paddle.provider.ts packages/server/src/providers/paddle.provider.test.ts
git commit -m "feat(paddle): webhook signature verification + transaction fetch provider"
```

### Task 5: Paddle service — checkout / verifyAndExtend / confirm / webhook (TDD)

**Files:**
- Create: `packages/server/src/services/paddle.service.ts`
- Test: `packages/server/src/services/paddle.service.test.ts`

기존 `payment.service.test.ts` 의 FakeAdmin 빌더 패턴을 재사용(복사 or 공용 헬퍼 추출 — 우선 복사로 단순화).

- [ ] **Step 1: 실패 테스트 작성 (핵심 시나리오)**

`payment.service.test.ts` 의 `makeFakeAdmin`/`Seed`/`OpLog` 빌더를 복사해오고, provider/getTransaction 을 mock:

```ts
// paddle.service.test.ts (요지 — makeFakeAdmin 은 payment.service.test.ts 에서 복사)
vi.mock('../providers/supabase-admin.provider.js', () => ({ getSupabaseAdmin: vi.fn() }));
vi.mock('../providers/paddle.provider.js', () => ({
  verifyPaddleSignature: vi.fn(),
  getPaddleTransaction: vi.fn(),
}));
vi.mock('../config/index.js', () => ({
  config: { paddle: { apiKey: 'k', webhookSecret: 's', priceIds: { month1: 'pri_MONTH1', year1: 'pri_YEAR1' } } },
}));

import { createPaddleCheckout, confirmPaddlePayment, handlePaddleWebhook } from './paddle.service.js';
import { getSupabaseAdmin } from '../providers/supabase-admin.provider.js';
import { verifyPaddleSignature, getPaddleTransaction } from '../providers/paddle.provider.js';

describe('createPaddleCheckout', () => {
  it('inserts a pending paddle row and returns {orderId, priceId}', async () => {
    const fake = makeFakeAdmin();
    (getSupabaseAdmin as any).mockReturnValue(fake.client);
    const r = await createPaddleCheckout('acc-1', 'month1');
    expect(r.priceId).toBe('pri_MONTH1');
    expect(r.orderId).toMatch(/^tb_/);
    const ins = fake.ops.find((o) => o.table === 'payments' && o.op === 'insert')!;
    const row = ins.payload as Record<string, unknown>;
    expect(row.provider).toBe('paddle');
    expect(row.currency).toBe('USD');
    expect(row.plan).toBe('month1');
    expect(row.status).toBe('pending');
  });
  it('throws 400 for invalid plan', async () => {
    const fake = makeFakeAdmin();
    (getSupabaseAdmin as any).mockReturnValue(fake.client);
    await expect(createPaddleCheckout('acc-1', 'nope')).rejects.toMatchObject({ statusCode: 400 });
  });
});

describe('confirmPaddlePayment', () => {
  const pending = { id: 'r1', order_id: 'tb_o1', account_id: 'acc-1', plan: 'month1', amount: 0, status: 'pending', provider: 'paddle', currency: 'USD' };
  it('verifies txn, records amount, extends entitlement, returns paidUntil', async () => {
    const fake = makeFakeAdmin({ paymentRow: pending, flippedRows: [{ order_id: 'tb_o1' }], entitlementRow: { account_id: 'acc-1', paid_until: null } });
    (getSupabaseAdmin as any).mockReturnValue(fake.client);
    (getPaddleTransaction as any).mockResolvedValue({
      id: 'txn_1', status: 'completed', currency_code: 'USD',
      custom_data: { orderId: 'tb_o1' }, items: [{ price: { id: 'pri_MONTH1' } }],
      details: { totals: { total: '4950' } },
    });
    const r = await confirmPaddlePayment('acc-1', { transactionId: 'txn_1' });
    expect(typeof r.paidUntil).toBe('string');
    // amount 는 센트 단위로 기록
    const upd = fake.ops.find((o) => o.table === 'payments' && o.op === 'update' && (o.payload as any).currency);
    expect((upd!.payload as any).amount).toBe(4950);
    expect((upd!.payload as any).currency).toBe('USD');
  });
  it('throws 403 when txn custom_data.orderId belongs to another account row', async () => {
    const foreign = { ...pending, account_id: 'acc-owner' };
    const fake = makeFakeAdmin({ paymentRow: foreign });
    (getSupabaseAdmin as any).mockReturnValue(fake.client);
    (getPaddleTransaction as any).mockResolvedValue({ id: 'txn_2', status: 'completed', currency_code: 'USD', custom_data: { orderId: 'tb_o1' }, items: [{ price: { id: 'pri_MONTH1' } }], details: { totals: { total: '4950' } } });
    await expect(confirmPaddlePayment('acc-attacker', { transactionId: 'txn_2' })).rejects.toMatchObject({ statusCode: 403 });
  });
  it('rejects when priceId does not match the plan (forgery)', async () => {
    const fake = makeFakeAdmin({ paymentRow: pending, entitlementRow: { account_id: 'acc-1', paid_until: null } });
    (getSupabaseAdmin as any).mockReturnValue(fake.client);
    (getPaddleTransaction as any).mockResolvedValue({ id: 'txn_3', status: 'completed', currency_code: 'USD', custom_data: { orderId: 'tb_o1' }, items: [{ price: { id: 'pri_WRONG' } }], details: { totals: { total: '1' } } });
    await expect(confirmPaddlePayment('acc-1', { transactionId: 'txn_3' })).rejects.toMatchObject({ statusCode: 400 });
    expect(fake.ops.some((o) => o.table === 'entitlements' && o.op === 'upsert')).toBe(false);
  });
});

describe('handlePaddleWebhook', () => {
  it('ignores an invalid signature (no getTransaction, no writes)', async () => {
    (verifyPaddleSignature as any).mockReturnValue(false);
    const fake = makeFakeAdmin();
    (getSupabaseAdmin as any).mockReturnValue(fake.client);
    await handlePaddleWebhook('{"event_type":"transaction.completed"}', 'ts=1;h1=bad');
    expect(getPaddleTransaction).not.toHaveBeenCalled();
    expect(fake.ops.length).toBe(0);
  });
  it('ignores non-completion events', async () => {
    (verifyPaddleSignature as any).mockReturnValue(true);
    const fake = makeFakeAdmin();
    (getSupabaseAdmin as any).mockReturnValue(fake.client);
    await handlePaddleWebhook(JSON.stringify({ event_type: 'transaction.created', data: { id: 'txn_x' } }), 'ok');
    expect(getPaddleTransaction).not.toHaveBeenCalled();
  });
  it('is idempotent with confirm — already-paid row does not double-extend', async () => {
    (verifyPaddleSignature as any).mockReturnValue(true);
    const paid = { id: 'r9', order_id: 'tb_o9', account_id: 'acc-1', plan: 'month1', amount: 4950, status: 'paid', provider: 'paddle', currency: 'USD' };
    const fake = makeFakeAdmin({ paymentRow: paid });
    (getSupabaseAdmin as any).mockReturnValue(fake.client);
    (getPaddleTransaction as any).mockResolvedValue({ id: 'txn_9', status: 'completed', currency_code: 'USD', custom_data: { orderId: 'tb_o9' }, items: [{ price: { id: 'pri_MONTH1' } }], details: { totals: { total: '4950' } } });
    await handlePaddleWebhook(JSON.stringify({ event_type: 'transaction.completed', data: { id: 'txn_9' } }), 'ok');
    expect(fake.ops.some((o) => o.table === 'entitlements' && o.op === 'upsert')).toBe(false);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm --filter server test paddle.service`
Expected: FAIL (service not implemented).

- [ ] **Step 3: 구현**

```ts
// paddle.service.ts
import crypto from 'node:crypto';
import { isPlanId, PLANS } from '@tangobook/shared';
import { config } from '../config/index.js';
import { AppError } from '../middleware/error.middleware.js';
import { requireAdmin, extendEntitlementForPaidOrder, type PaymentRow } from './entitlement-extend.js';
import { verifyPaddleSignature, getPaddleTransaction, type PaddleTransaction } from '../providers/paddle.provider.js';

export async function createPaddleCheckout(accountId: string, planId: unknown) {
  if (!isPlanId(planId)) throw new AppError(400, `올바르지 않은 플랜입니다: ${String(planId)}`);
  const priceId = config.paddle.priceIds[planId];
  if (!priceId) throw new AppError(503, 'Paddle 가격이 설정되지 않았습니다');
  const orderId = 'tb_' + crypto.randomUUID();
  const admin = requireAdmin();
  const { error } = await admin.from('payments').insert({
    account_id: accountId, order_id: orderId, plan: planId,
    amount: 0, currency: 'USD', provider: 'paddle', status: 'pending',
  });
  if (error) throw new AppError(500, `주문 생성 실패: ${error.message}`);
  return { orderId, priceId };
}

/** confirm·webhook 공통: txn 재조회 → 검증 → 금액 기록 → 코어 연장. accountId 주면 소유 확인. */
async function verifyAndExtend(
  accountId: string | null,
  txn: PaddleTransaction
): Promise<{ paidUntil: string | null }> {
  const orderId = txn.custom_data?.orderId;
  if (!orderId) throw new AppError(400, 'orderId 누락');

  const admin = requireAdmin();
  const { data: row } = await admin.from('payments').select('*').eq('order_id', orderId).maybeSingle();
  if (!row) throw new AppError(404, '주문을 찾을 수 없습니다');
  const paymentRow = row as PaymentRow;

  if (accountId && paymentRow.account_id !== accountId) throw new AppError(403, '권한이 없습니다');

  // 이미 처리됨 — 멱등 반환
  if (paymentRow.status === 'paid') {
    const { data: ent } = await admin.from('entitlements').select('paid_until').eq('account_id', paymentRow.account_id).maybeSingle();
    return { paidUntil: (ent as { paid_until?: string | null } | null)?.paid_until ?? null };
  }

  // 재검증
  if (txn.status !== 'completed') throw new AppError(402, '결제 미완료');
  const paidPriceId = txn.items?.[0]?.price?.id;
  const expectedPriceId = config.paddle.priceIds[paymentRow.plan];
  if (!expectedPriceId || paidPriceId !== expectedPriceId) {
    throw new AppError(400, 'priceId 불일치'); // 🔴 위조 방지 — 서버 맵 기준
  }

  // 실 결제 통화·금액(센트) 기록
  const cents = Number(txn.details?.totals?.total ?? '0');
  await admin.from('payments').update({ currency: txn.currency_code, amount: cents })
    .eq('order_id', orderId).eq('status', 'pending');

  await extendEntitlementForPaidOrder(paymentRow, txn.id);

  const { data: ent } = await admin.from('entitlements').select('paid_until').eq('account_id', paymentRow.account_id).maybeSingle();
  return { paidUntil: (ent as { paid_until?: string | null } | null)?.paid_until ?? null };
}

/** 클라 successCallback 이 호출(동기, 주 경로). */
export async function confirmPaddlePayment(accountId: string, args: { transactionId: string }) {
  const txn = await getPaddleTransaction(args.transactionId);
  return verifyAndExtend(accountId, txn);
}

/** 웹훅 백스톱(멱등). raw body + Paddle-Signature 헤더. */
export async function handlePaddleWebhook(rawBody: string, signature: string): Promise<void> {
  if (!verifyPaddleSignature(rawBody, signature)) return; // 조용히 무시(재시도 스톰 방지)
  const event = JSON.parse(rawBody) as { event_type?: string; data?: { id?: string } };
  // 🔴 구현 시 실제 완료 이벤트명 확인 (transaction.completed vs transaction.paid)
  if (event.event_type !== 'transaction.completed') return;
  const txnId = event.data?.id;
  if (!txnId) return;
  const txn = await getPaddleTransaction(txnId);
  try {
    await verifyAndExtend(null, txn); // account 바인딩 없음(웹훅) — orderId 로 계정 확정
  } catch {
    // 위조/불일치/미완료는 조용히 무시. 진짜 transient 는 Paddle 재전송이 치유.
  }
}
```

> ⚠️ `extendEntitlementForPaidOrder` 는 `PLANS[row.plan].days` 로 연장 기간을 읽으므로 paddle row 의 `plan`('month1'/'year1')이 그대로 동작한다(코어 무변경). Paddle 의 amount 는 무관.

- [ ] **Step 4: 통과 확인**

Run: `pnpm --filter server test paddle.service`
Expected: PASS (all scenarios).

- [ ] **Step 5: 전체 서버 테스트 회귀**

Run: `pnpm --filter server test`
Expected: PASS (기존 + 신규 모두 그린).

- [ ] **Step 6: Commit**

```bash
git add packages/server/src/services/paddle.service.ts packages/server/src/services/paddle.service.test.ts
git commit -m "feat(paddle): checkout/confirm/webhook service converging on shared core"
```

---

## Chunk 3: 서버 — 라우트/컨트롤러 + raw-body 웹훅 배선

### Task 6: 컨트롤러 핸들러 3종

**Files:**
- Modify: `packages/server/src/controllers/payment.controller.ts`

- [ ] **Step 1: import 추가 + 핸들러 3종 추가**

상단 import 확장:
```ts
import { createPaddleCheckout, confirmPaddlePayment, handlePaddleWebhook } from '../services/paddle.service.js';
```

`PaymentController` 객체에 추가:
```ts
  postPaddleCheckout: asyncHandler(async (req, res) => {
    const accountId = await getAccountIdFromRequest(req);
    const { plan: planId } = req.body as { plan?: string };
    const data = await createPaddleCheckout(accountId, planId);
    res.json({ success: true, data });
  }),

  postPaddleConfirm: asyncHandler(async (req, res) => {
    const accountId = await getAccountIdFromRequest(req);
    const { transactionId } = req.body as { transactionId?: string };
    const data = await confirmPaddlePayment(accountId, { transactionId: transactionId ?? '' });
    res.json({ success: true, data });
  }),

  postPaddleWebhook: asyncHandler(async (req, res) => {
    // NO auth — Paddle 이 server-to-server 로 호출. req.body 는 raw Buffer(app.ts 배선).
    const raw = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body ?? '');
    const signature = (req.headers['paddle-signature'] as string) ?? '';
    await handlePaddleWebhook(raw, signature);
    res.json({ success: true });
  }),
```

- [ ] **Step 2: 타입체크**

Run: `pnpm --filter server typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/server/src/controllers/payment.controller.ts
git commit -m "feat(paddle): controller handlers for checkout/confirm/webhook"
```

### Task 7: checkout·confirm 라우트

**Files:**
- Modify: `packages/server/src/routes/payment.routes.ts`

- [ ] **Step 1: 라우트 2줄 추가**

`router.post('/webhook', ...)` 아래에:
```ts
router.post('/paddle/checkout', PaymentController.postPaddleCheckout);
router.post('/paddle/confirm', PaymentController.postPaddleConfirm);
// 주의: /paddle/webhook 은 raw-body 때문에 app.ts 에서 별도 배선 (여기 아님)
```

- [ ] **Step 2: 타입체크**

Run: `pnpm --filter server typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/server/src/routes/payment.routes.ts
git commit -m "feat(paddle): checkout/confirm routes"
```

### Task 8: raw-body 웹훅 — app 레벨 (전역 json 앞)

**Files:**
- Modify: `packages/server/src/app.ts`

- [ ] **Step 1: import 추가**

`app.ts` 상단(다른 route import 근처):
```ts
import { PaymentController } from './controllers/payment.controller.js';
```

- [ ] **Step 2: 웹훅 라우트를 express.json() 앞에 등록**

`app.use(corsMiddleware);`(line 52) **뒤**, `app.use(express.json({ limit: '10mb' }));`(line 58) **앞**에:
```ts
  // 🔴 Paddle 웹훅 — 서명 검증에 원본 바디 필요 → 전역 json 파서보다 먼저 raw 로 받는다.
  // (전역 express.json 이 먼저 소비하면 rawBody 를 복구할 수 없어 HMAC 불가.)
  app.post(
    '/api/payments/paddle/webhook',
    express.raw({ type: '*/*' }),
    PaymentController.postPaddleWebhook
  );
```

- [ ] **Step 3: 타입체크 + 서버 빌드**

Run: `pnpm --filter server typecheck && pnpm --filter server build`
Expected: PASS.

- [ ] **Step 4: 로컬 스모크 — 서명 없는 POST 는 200 + 무시**

서버를 띄우고(`pnpm --filter server dev`) 다른 터미널에서:
```bash
curl -s -X POST http://localhost:3500/api/payments/paddle/webhook \
  -H 'Content-Type: application/json' -d '{"event_type":"transaction.completed"}'
```
Expected: `{"success":true}` (서명 없음 → 조용히 무시, 500 아님). 서버 로그에 에러 없음.

- [ ] **Step 5: Commit**

```bash
git add packages/server/src/app.ts
git commit -m "feat(paddle): raw-body webhook route before global json parser"
```

---

## Chunk 4: 클라이언트 — config auto-off + checkout + SubscribePage

### Task 9: 클라 config — isPaddleConfigured + auto-off gate

**Files:**
- Modify: `packages/client/src/features/access/config.ts`
- Modify: `packages/client/src/features/access/hooks/useAccess.ts`
- Test: `packages/client/src/features/payment/__tests__/useAccess.test.tsx` (기존 — 확장)

- [ ] **Step 1: config 에 isPaddleConfigured 추가**

`config.ts` 하단:
```ts
/**
 * Paddle 클라 토큰이 설정되어 해외 결제 오버레이를 열 수 있는 상태인지.
 * 🔴 이 값이 true 가 되면 OVERSEAS_FREE_UNTIL_PADDLE 무료 브릿지가 자동으로 꺼지고
 *    해외도 정식 게이팅이 적용된다(useAccess). 플래그를 손으로 false 하는 걸 잊어도 안전.
 */
export const isPaddleConfigured = Boolean(import.meta.env.VITE_PADDLE_CLIENT_TOKEN);
```

- [ ] **Step 2: useAccess gate 수정**

`useAccess.ts` 에서 import 확장 + 판정 강화:
```ts
import { PAYWALL_ENABLED, LOCK_FOR_GUESTS, OVERSEAS_FREE_UNTIL_PADDLE, isPaddleConfigured } from '../config';
```
그리고 해외 브릿지 라인(현 line 45)을:
```ts
    // 해외(비-ko) 로그인 사용자 — Paddle 미설정 동안만 무료 브릿지. 토큰 들어오면 자동 게이팅.
    if (OVERSEAS_FREE_UNTIL_PADDLE && isOverseas && account && !isPaddleConfigured) return ALWAYS_ENTITLED;
```

- [ ] **Step 3: 테스트 확장 (auto-off)**

기존 `useAccess.test.tsx` 에 케이스 추가(패턴은 기존 테스트 따름): "비-ko 로케일 + 로그인 + `isPaddleConfigured=true` → computeAccess 경로(무료 브릿지 아님)". `isPaddleConfigured` 는 모듈 상수라 `vi.mock('../config', ...)` 로 오버라이드.

Run: `pnpm --filter client test useAccess`
Expected: PASS (신규 케이스 포함).

- [ ] **Step 4: Commit**

```bash
git add packages/client/src/features/access/config.ts packages/client/src/features/access/hooks/useAccess.ts packages/client/src/features/payment/__tests__/useAccess.test.tsx
git commit -m "feat(access): auto-disable overseas free bridge when Paddle configured"
```

### Task 10: 클라 API + useCheckoutPaddle 훅

**Files:**
- Modify: `packages/client/src/features/payment/api/payment.api.ts`
- Create: `packages/client/src/features/payment/hooks/useCheckoutPaddle.ts`

- [ ] **Step 1: API 메서드 추가**

`payment.api.ts` 의 `paymentApi` 에:
```ts
  paddleCheckout(plan: string): Promise<{ orderId: string; priceId: string }> {
    return apiPost('/payments/paddle/checkout', { plan });
  },
  paddleConfirm(transactionId: string): Promise<ConfirmResponse> {
    return apiPost<ConfirmResponse>('/payments/paddle/confirm', { transactionId });
  },
```

- [ ] **Step 2: 훅 구현**

`@paddle/paddle-js` 설치 필요: `pnpm --filter client add @paddle/paddle-js`

```ts
// useCheckoutPaddle.ts
import { useState } from 'react';
import { initializePaddle, type Paddle } from '@paddle/paddle-js';
import type { PlanId } from '@tangobook/shared';
import { useQueryClient } from '@tanstack/react-query';
import { paymentApi } from '../api/payment.api';
import { useAuth } from '@/features/auth/context/AuthContext';
import { ENTITLEMENT_QUERY_KEY } from './useEntitlement';

const CLIENT_TOKEN = import.meta.env.VITE_PADDLE_CLIENT_TOKEN as string | undefined;
const ENV = (import.meta.env.VITE_PADDLE_ENV as 'sandbox' | 'production') ?? 'sandbox';
export const isPaddleCheckoutConfigured = Boolean(CLIENT_TOKEN);

export function useCheckoutPaddle() {
  const { account } = useAuth();
  const qc = useQueryClient();
  const [state, setState] = useState<{ loading: boolean; error: string | null; done: boolean }>({
    loading: false, error: null, done: false,
  });

  async function startCheckout(planId: PlanId) {
    if (!CLIENT_TOKEN) { setState({ loading: false, error: 'Paddle not configured', done: false }); return; }
    if (!account) { setState({ loading: false, error: '로그인이 필요합니다.', done: false }); return; }
    setState({ loading: true, error: null, done: false });
    try {
      const { orderId, priceId } = await paymentApi.paddleCheckout(planId);
      const paddle: Paddle | undefined = await initializePaddle({
        environment: ENV,
        token: CLIENT_TOKEN,
        eventCallback: async (ev) => {
          if (ev.name === 'checkout.completed') {
            const txnId = (ev.data as { transaction_id?: string })?.transaction_id;
            if (txnId) {
              try {
                await paymentApi.paddleConfirm(txnId); // 🔴 동기 연장 — 레이스 제거
                await qc.invalidateQueries({ queryKey: ENTITLEMENT_QUERY_KEY(account.id) });
                setState({ loading: false, error: null, done: true });
              } catch {
                // confirm 실패해도 웹훅 백스톱이 치유 — invalidate 만
                await qc.invalidateQueries({ queryKey: ENTITLEMENT_QUERY_KEY(account.id) });
                setState({ loading: false, error: null, done: true });
              }
            }
          }
        },
      });
      paddle?.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        customData: { orderId, accountId: account.id },
        settings: { displayMode: 'overlay' },
      });
      setState((s) => ({ ...s, loading: false }));
    } catch (err) {
      setState({ loading: false, error: err instanceof Error ? err.message : '결제 요청 실패', done: false });
    }
  }
  return { startCheckout, loading: state.loading, error: state.error, done: state.done };
}
```

> ⚠️ 구현자 확인: Paddle.js 이벤트명(`checkout.completed`)·`transaction_id` 필드는 [Paddle.js docs](https://developer.paddle.com/paddlejs/events/overview) 로 대조. `VITE_PADDLE_ENV` env 추가(sandbox 기본).

- [ ] **Step 3: 타입체크**

Run: `pnpm --filter client typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/client/src/features/payment/api/payment.api.ts packages/client/src/features/payment/hooks/useCheckoutPaddle.ts packages/client/package.json
git commit -m "feat(paddle): client checkout hook (overlay + sync confirm)"
```

### Task 11: SubscribePage — 로케일 기본 + 수동 전환

**Files:**
- Modify: `packages/client/src/features/payment/pages/SubscribePage.tsx`
- Modify: `packages/client/src/i18n/locales/{ko,en,vi,zh,th}/payment.json`

- [ ] **Step 1: 레인 상태 + 토글**

`SubscribePage` 에 로컬 `rail` 상태 추가: `useState<'toss' | 'paddle'>(uiLang === 'ko' ? 'toss' : 'paddle')`. `uiLang` 은 `i18n.language`.
- `rail === 'toss'` → 기존 `useCheckout` 경로(현 코드).
- `rail === 'paddle'` → `useCheckoutPaddle` 경로. `PlanCard.onSelect` 를 paddle `startCheckout` 로.
- 각 레인의 준비 판정: toss=`PAYWALL_ENABLED && isCheckoutConfigured`, paddle=`isPaddleCheckoutConfigured`. 준비 안 된 레인 선택 시 기존 "준비 중" 화면 재사용.
- 하단에 전환 링크: 현재 `toss` 면 `t('subscribe.payWithIntl')`("🌍 해외 카드로 결제") → `setRail('paddle')`; 현재 `paddle` 이면 `t('subscribe.payWithKorean')`("🇰🇷 한국 카드로 결제") → `setRail('toss')`.
- paddle `done` 상태면 성공 안내(인라인 — "결제가 완료되었어요! 🎉" + 라이브러리로).

- [ ] **Step 2: i18n 키 추가**

각 `payment.json` 의 `subscribe` 객체에:
```json
"payWithIntl": "🌍 해외 카드로 결제하기",
"payWithKorean": "🇰🇷 국내 카드로 결제하기",
"paddleSuccess": "결제가 완료되었어요! 🎉"
```
(en/vi/zh/th 는 해당 언어로 — en 예: "Pay with an international card" / "Pay with a Korean card" / "Payment complete! 🎉". 나머지는 번역.)

- [ ] **Step 3: i18n 파리티 검증**

Run: `node packages/client/scripts/verify-locales.mjs`
Expected: PASS (5개 언어 키 파리티).

- [ ] **Step 4: 타입체크 + 클라 빌드**

Run: `pnpm --filter client typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/features/payment/pages/SubscribePage.tsx packages/client/src/i18n/locales
git commit -m "feat(paddle): SubscribePage locale-default rail with manual switch"
```

---

## Chunk 5: 컷오버 준비 (trial 리셋) + 최종 검증

### Task 12: 해외 계정 trial 리셋 시드 스크립트

**Files:**
- Create: `packages/server/scripts/reset-overseas-trials.sql`

- [ ] **Step 1: SQL 작성**

```sql
-- 🔴 Paddle 프로덕션 컷오버 시 1회 실행.
-- 무료 브릿지 기간에 생성된 해외 계정은 createdAt 기준 trial 이 이미 만료 → Paddle 켜지는
-- 순간 전원 즉시 expired 로 잠긴다. trial_started_at 을 now() 로 시드해 신규 7일 체험 부여.
--
-- ⚠️ 해외 계정 판별 컬럼이 accounts 에 있으면(예: locale/ui_lang) WHERE 로 스코프.
--    없으면 전체 계정 일괄 시드(국내는 이미 국내 정책이 우선이라 무해) — 운영 판단.
-- entitlements 행이 없는 계정도 upsert 로 생성.

insert into public.entitlements (account_id, trial_started_at, updated_at)
select a.id, now(), now()
from public.accounts a
-- and a.ui_lang <> 'ko'   -- 해외 스코프 컬럼이 있으면 주석 해제
on conflict (account_id) do update
  set trial_started_at = now(), updated_at = now();
```

> ⚠️ 구현자: `accounts` 에 로케일/언어 컬럼이 있는지 `list_tables` 로 확인 후 WHERE 스코프 확정. 없으면 전체 시드 + 주석에 명시. 실행은 **컷오버 배포와 동시**(spec 컷오버 순서 §).

- [ ] **Step 2: Commit**

```bash
git add packages/server/scripts/reset-overseas-trials.sql
git commit -m "chore(paddle): overseas trial reset seed for production cutover"
```

### Task 13: 전체 검증 + CLAUDE.md/메모리 갱신

**Files:**
- Modify: `CLAUDE.md` (결제/유료화 섹션에 Paddle 레인 한 줄)
- Modify: `packages/server/.env.example`, `packages/client/.env.example`(있으면)

- [ ] **Step 1: 전체 테스트 + 타입체크**

Run: `pnpm typecheck && pnpm --filter server test && pnpm --filter client test`
Expected: PASS (전 패키지 그린).

- [ ] **Step 2: 빌드**

Run: `pnpm build`
Expected: PASS.

- [ ] **Step 3: CLAUDE.md 결제 섹션에 Paddle 한 줄 추가**

기존 "결제/유료화" 항목에 요지 추가: "해외=Paddle 단건 기간권(USD 글로벌, `paddle.service.ts` confirm+webhook, entitlement 수렴 코어 `entitlement-extend.ts` 공유). SubscribePage 로케일 기본+수동 전환. `isPaddleConfigured` 자동 게이팅. 컷오버=`reset-overseas-trials.sql`. → spec/plan 2026-07-15."

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md packages/server/.env.example
git commit -m "docs(claude): note Paddle overseas payment rail"
```

- [ ] **Step 5: 브랜치 마무리**

superpowers:finishing-a-development-branch 로 병합/PR 결정.

---

## 구현 후 남는 수동 작업 (사용자)
Spec §"Paddle 계정 셋업 가이드" 참조:
1. Paddle Sandbox 가입 → sandbox 토큰·priceId 로 E2E 검증(오버레이→confirm→entitlement 연장→열람)
2. 상품 2개(month1/year1 one-time USD) 생성 → priceId 를 클라/서버 env 양쪽 매핑
3. 웹훅 등록(`/api/payments/paddle/webhook`, 완료 이벤트) → secret
4. 세무사: "Paddle 정산 = 외화획득 영세율" 전달
5. 심사 통과 → production 토큰·키·priceId 동시 배포(🔴 컷오버 순서) + `reset-overseas-trials.sql` 실행

## 미해결/구현 시 확정할 것
- Paddle Billing 완료 이벤트 정확한 이름(`transaction.completed` vs `transaction.paid`)
- Paddle.js 이벤트명·`transaction_id` 필드 경로
- Transaction API 응답 필드(`items[].price.id`, `custom_data`, `details.totals.total`) 실제 스키마
- sandbox/prod API base URL 분리(`PADDLE_API_BASE` env)
