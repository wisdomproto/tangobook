# 해외 결제 (Paddle) 연동 설계

**날짜**: 2026-07-15
**상태**: 설계 승인 대기
**관련 메모리**: `global-expansion-design-2026-07-11` · `overseas-login-strategy-2026-07-13` · `payment-toss-monetization-2026-06-30` · `launch-blocker-audit-fixes-2026-07-11`

## 배경

국내 결제는 토스 단건 기간권으로 운영 중이다(`payment.service.ts` — 웹훅 보안 패턴 완비: orderId 바인딩·pending→paid 조건부 flip·실패 시 revert·멱등). 해외(비-ko 로케일) 로그인 사용자는 현재 `OVERSEAS_FREE_UNTIL_PADDLE=true` 임시 브릿지로 전권 무료다. Stripe는 한국 법인 가맹 불가라 제외됐고, 해외는 MoR(Merchant of Record)로 전세계 소비세를 대납받아 세무 부담을 0으로 만드는 게 핵심이다.

이 스펙은 해외 결제 레인을 **Paddle**로 붙이되, 국내 토스 코드는 건드리지 않고 entitlement 수렴점만 공유하는 "결제는 플러그인, entitlement는 하나" 아키텍처를 구현한다.

## 확정된 결정 (브레인스토밍)

| 항목 | 결정 | 근거 |
|---|---|---|
| MoR 프로바이더 | **Paddle** | 구독·감사 성숙도, 메모리 설계가 Paddle 기준(`OVERSEAS_FREE_UNTIL_PADDLE`) |
| 상품 모델 | **단건 기간권**(one-time) | 국내 토스와 대칭 → entitlement 수렴 단순, 웹훅 1개 |
| 가격/통화 | **USD 글로벌 단일가** | Paddle이 로컬 통화 자동 변환·표시. PPP override는 구조만 두고 나중에 |
| 레인 분기 | **로케일 기본 + 수동 전환** | 메모리 원칙 "카드가 어디 거냐". 엣지케이스 커버 |
| provider 추상화 | **나란한 서비스 + 공유 수렴 코어**(접근 B) | 두 결제 흐름이 근본적으로 달라 공통 인터페이스는 과설계. 차이는 격리, 수렴만 공유 |
| 구현 범위 | **최소**(결제→entitlement 연장까지) | 영수증·환불은 Paddle 고객 포털이 자동 처리. 이력 UI는 후속 |

## 아키텍처

```
[클라]
  SubscribePage ──로케일 기본 + 수동 전환──┐
     ├─ ko 기본:   useCheckout (토스, 리다이렉트)      → /payments/checkout
     └─ 비-ko 기본: useCheckoutPaddle (Paddle.js 오버레이) → /payments/paddle/checkout

[서버]
  payment.service.ts (토스 — 무변경)  ──┐
  paddle.service.ts  (신규)          ──┼──▶ entitlement-extend.ts (공유 코어)
                                        │      extendEntitlementForPaidOrder()
  providers/toss.provider.ts (무변경)   │      → entitlements.paid_until (단일 수렴)
  providers/paddle.provider.ts (신규)  ─┘

[DB]
  payments(+provider,+currency)  entitlements(무변경)
```

## 컴포넌트별 설계

### 1. DB 마이그레이션 (`supabase-payments.sql`에 멱등 추가)

```sql
alter table public.payments
  add column if not exists provider text not null default 'toss',   -- 'toss' | 'paddle'
  add column if not exists currency text not null default 'KRW';    -- 'KRW' | 'USD' | ...
```

- `entitlements`는 **무변경**. `paid_until`이 이미 provider-agnostic한 수렴점.
- 기존 payments 행은 default로 `toss`/`KRW` 자동 충전 → 회귀 0.
- 적용: Supabase MCP `apply_migration` 또는 대시보드 SQL Editor.

### 2. Shared — PLANS 통화 차원 (`shared/constants/plans.ts`)

- 기존 `PLANS`(KRW, 토스 금액 교차검증용)는 **그대로 유지**.
- Paddle 가격은 Paddle 대시보드에서 priceId로 관리하므로, 앱은 `planId → priceId` 매핑만 보유:

```ts
// 클라 전용 (Paddle priceId 는 클라 오버레이가 사용)
export const PADDLE_PRICE_IDS: Record<PlanId, string> = {
  month1: import.meta.env.VITE_PADDLE_PRICE_MONTH1 ?? '',
  year1:  import.meta.env.VITE_PADDLE_PRICE_YEAR1 ?? '',
};
```

- 🔴 앱은 USD 금액을 하드코딩하지 않는다. 로케일별 통화·표시가는 Paddle이 결정.
- PPP override(베트남 저가 등)는 Paddle 대시보드의 country/currency 가격 override로 후속 대응 — 코드 변경 불필요(priceId 하나가 나라별 가격을 포함).

### 3. 서버 — 공유 수렴 코어 (`services/entitlement-extend.ts`)

현재 `payment.service.ts`의 `extendEntitlementForPaidOrder`를 **이동만** 한다(내용 변경 없음). 이미 provider 무관:
- pending→paid 조건부 flip(레이스 방지, 이긴 호출만 연장 = exactly-once)
- `extendPaidUntil(current, plan.days)`로 entitlement upsert
- upsert 실패 시 flip revert(고객 결제됨·권한 없음·재시도로 치유되는 상태 회피)

`payment.service.ts`(토스)와 `paddle.service.ts` 둘 다 여기서 import.

### 4. 서버 — Paddle provider (`providers/paddle.provider.ts`)

토스 provider와 동일한 싱글톤 패턴:

```ts
export const paddle = {
  verifyWebhookSignature(rawBody: string, signatureHeader: string): boolean,  // HMAC-SHA256
  getTransaction(txnId: string): Promise<PaddleTransaction>,                   // API 재조회
};
```

- `verifyWebhookSignature`: `Paddle-Signature` 헤더(`ts=...;h1=...`)를 파싱, `PADDLE_WEBHOOK_SECRET`으로 `ts:rawBody` HMAC 비교. 🔴 **raw body 필수**.
- `getTransaction`: Paddle API(`GET /transactions/{id}`)로 재조회 — 웹훅 바디만 믿지 않음(토스 `getPayment` 패턴).

### 5. 서버 — Paddle service (`services/paddle.service.ts`)

토스 service와 나란히. 두 함수:

**`createPaddleCheckout(accountId, planId)`**
1. `isPlanId` 검증
2. `payments` pending 행 insert: `provider:'paddle'`, `currency:'USD'`, `amount:0`(플레이스홀더 — 실 금액은 웹훅에서 기록), `order_id: 'tb_' + uuid`
3. `{ orderId, priceId: PADDLE_PRICE_IDS[planId] }` 반환 (priceId는 서버 env로도 검증 가능하게 서버측 매핑 보유)

**`handlePaddleWebhook(rawBody, signature)`**
1. `verifyWebhookSignature` 실패 → 조용히 return(200, 재시도 유발 안 함)
2. `event_type !== 'transaction.completed'` → return
3. `custom_data.orderId`로 pending payments 행 조회(없으면 return — 계정 바인딩)
4. `getTransaction(txnId)`로 재검증:
   - status가 `completed`인지
   - `custom_data.orderId`가 우리 orderId와 일치(🔴 리플레이 방지 — 토스 orderId 바인딩과 동일)
   - **priceId 일치**(items에 우리가 발급한 planId의 priceId 포함) → 금액 위조 방지. 정확한 통화 금액 일치는 **하지 않음**(Paddle 로컬 변환 때문). priceId는 대시보드 고정이라 위조 불가.
5. 실 결제 통화·금액을 payments 행에 기록(`currency`, `amount` 업데이트)
6. `extendEntitlementForPaidOrder(row, txnId)` 호출 → 공유 코어가 flip + 연장

### 6. 서버 — 라우트/컨트롤러/config

`payment.routes.ts`에 2줄:
```ts
router.post('/paddle/checkout', PaymentController.postPaddleCheckout);   // auth
// webhook 은 아래 raw-body 이유로 app 레벨에서 별도 배선 (라우터 json 파서 우회)
```

🔴 **raw body 배선**: Paddle 서명 검증은 원본 바디가 필요하다. 전역 `express.json()`이 바디를 파싱하기 전에 이 엔드포인트만 `express.raw({ type: '*/*' })`로 태운다. 서버 앱 셋업에서 `/api/payments/paddle/webhook`을 json 미들웨어 **앞에** 등록하거나, 라우트별 raw 미들웨어를 건다(구현 계획에서 현재 app 미들웨어 순서 확인 후 확정).

컨트롤러:
- `postPaddleCheckout`: `getAccountIdFromRequest` → `createPaddleCheckout` → `{ orderId, priceId }`
- `postPaddleWebhook`: **auth 없음**. `req.body`(raw Buffer)와 `Paddle-Signature` 헤더 → `handlePaddleWebhook`

config(`config/index.ts`, `toss` 옆):
```ts
paddle: {
  apiKey: process.env.PADDLE_API_KEY ?? '',
  webhookSecret: process.env.PADDLE_WEBHOOK_SECRET ?? '',
},
```

### 7. 클라이언트

**config** (`features/access/config.ts`)
- `isPaddleConfigured` = `Boolean(VITE_PADDLE_CLIENT_TOKEN)` (payment feature 쪽에 두는 게 자연스러우면 그쪽).
- `OVERSEAS_FREE_UNTIL_PADDLE` 판정 강화: `useAccess`에서 `OVERSEAS_FREE_UNTIL_PADDLE && isOverseas && account && !isPaddleConfigured`. 🔴 **Paddle 토큰이 설정되면 해외 무료 브릿지가 자동으로 꺼지고 정식 게이팅 ON** — 플래그를 손으로 false 하는 걸 잊어도 안전.

**`useCheckoutPaddle.ts`** (신규, `useCheckout` 옆)
- `@paddle/paddle-js` 로드 → `Paddle.Checkout.open({ items:[{ priceId, quantity:1 }], customData:{ accountId, orderId } })`
- 흐름: `POST /payments/paddle/checkout` → `{ orderId, priceId }` → 오버레이 open → 성공 `successCallback`에서 entitlement invalidate + 인라인 성공 안내(토스처럼 리다이렉트 페이지 안 거침)
- `isPaddleConfigured`로 준비 여부 노출.

**`SubscribePage.tsx`**
- `uiLang === 'ko'`: 토스 카드 기본 + 하단 "🌍 Pay with international card" 링크 → Paddle 레인
- 비-ko: Paddle 기본 + 하단 "한국 카드로 결제" 링크 → 토스 레인
- 각 레인은 자기 `isXConfigured`로 준비 판정(미설정 → 기존 "준비 중" 화면 재사용)
- i18n `payment` 네임스페이스에 레인 전환 카피 추가

**게이팅 수렴**: `computeAccess`·trial·referral·`extendPaidUntil` **전부 무변경**. Paddle도 같은 `paid_until`로 수렴.

### 8. 최소 범위 밖 (후속)
- 결제 이력 UI(부모설정 통합 리스트) — Paddle 고객 포털이 영수증·환불 자동 처리하므로 1단계 제외
- PPP 나라별 가격 override — Paddle 대시보드에서 코드 변경 없이 후속
- 자동갱신 구독 모델 — 현재 단건, 필요 시 별도 스펙

## 에러 처리
- 서명 검증 실패: 200 + 무시(재시도 스톰 방지). 로그만.
- 알 수 없는 orderId/priceId 불일치: 조용히 무시(위조 시도일 수 있음).
- entitlement upsert 실패: 공유 코어가 flip revert → 웹훅 재전송이 치유.
- Paddle 미설정 상태에서 레인 진입: "준비 중" 화면(SubscribePage 기존 패턴).

## 테스트 전략
- `paddle.service.test.ts`(신규): 서명 검증 통과/거부, orderId 바인딩(불일치 무시), priceId 검증, 멱등(중복 웹훅 1회만 연장), transaction.completed 외 이벤트 무시
- `entitlement-extend` 이동 후 기존 `payment.service.test.ts` 회귀 그린 확인
- `useAccess` 테스트: `isPaddleConfigured` true일 때 해외 게이팅 ON, false일 때 무료 브릿지 유지

## Paddle 계정 셋업 가이드 (사용자 실행)
1. **Sandbox 가입** → 앱에 sandbox 토큰 넣고 E2E 검증(실 심사 전 전체 흐름 확인)
2. **상품 2개 생성**: 1개월/12개월 one-time price(USD) → 각 priceId를 env에 매핑
3. **웹훅 등록**: 엔드포인트 `https://<host>/api/payments/paddle/webhook`, `transaction.completed` 구독 → signing secret을 `PADDLE_WEBHOOK_SECRET`
4. **세금/사업자**: MoR이라 Paddle이 전세계 소비세 대납. 세무사에게 "Paddle 정산 = 외화획득 영세율"(메모리 확정)만 전달
5. **심사 통과 → production**: production client 토큰·API 키로 교체 → `isPaddleConfigured` 자동 활성 → 해외 정식 게이팅 ON

## env 요약
| 위치 | 키 | 용도 |
|---|---|---|
| 서버 | `PADDLE_API_KEY` | getTransaction 재조회 |
| 서버 | `PADDLE_WEBHOOK_SECRET` | 웹훅 서명 검증 |
| 클라 | `VITE_PADDLE_CLIENT_TOKEN` | Paddle.js 오버레이 |
| 클라 | `VITE_PADDLE_PRICE_MONTH1` / `VITE_PADDLE_PRICE_YEAR1` | planId → priceId |
