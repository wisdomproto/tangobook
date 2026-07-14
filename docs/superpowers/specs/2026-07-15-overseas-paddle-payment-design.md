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
     ├─ ko 기본:   useCheckout (토스, 리다이렉트)      → /payments/checkout → /payments/confirm
     └─ 비-ko 기본: useCheckoutPaddle (Paddle.js 오버레이) → /payments/paddle/checkout
                     └─ successCallback(txnId) ─────────→ /payments/paddle/confirm (동기 연장)

[서버]
  payment.service.ts (토스 — 무변경)  ──┐
  paddle.service.ts  (신규: confirm+webhook) ─┼──▶ entitlement-extend.ts (공유 코어)
                                              │      extendEntitlementForPaidOrder()
  providers/toss.provider.ts (무변경)         │      → entitlements.paid_until (단일 수렴)
  providers/paddle.provider.ts (신규)  ───────┘

[DB]
  payments(+provider,+currency)  entitlements(무변경)
```

**결제 확정 = confirm(동기, 주) + webhook(멱등, 백스톱)** — 토스와 동일한 이중화. Paddle 오버레이 성공 콜백이 `confirm`으로 즉시 entitlement를 연장해 "결제 성공했는데 권한 없음" 레이스를 없애고, 웹훅은 confirm이 유실됐을 때(창 닫힘 등) 치유하는 백스톱. 공유 코어의 조건부 flip이 confirm+webhook 동시 실행을 exactly-once로 보장.

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
- Paddle 가격은 Paddle 대시보드에서 priceId로 관리하므로, 앱은 `planId → priceId` 매핑을 **양쪽에 각각** 보유한다:
  - **클라**(오버레이가 사용): `VITE_PADDLE_PRICE_MONTH1/YEAR1` → `PADDLE_PRICE_IDS`
  - **서버**(웹훅/confirm priceId 검증이 사용): `PADDLE_PRICE_MONTH1/YEAR1` env → `config.paddle.priceIds` 맵

```ts
// 클라
export const PADDLE_PRICE_IDS: Record<PlanId, string> = {
  month1: import.meta.env.VITE_PADDLE_PRICE_MONTH1 ?? '',
  year1:  import.meta.env.VITE_PADDLE_PRICE_YEAR1 ?? '',
};
// 서버 (config/index.ts) — 🔴 VITE_* 는 서버 프로세스에 없으므로 서버 전용 env 필수
paddle: {
  priceIds: {
    month1: process.env.PADDLE_PRICE_MONTH1 ?? '',
    year1:  process.env.PADDLE_PRICE_YEAR1 ?? '',
  },
  // ...apiKey, webhookSecret (§6)
}
```

- 🔴 웹훅/confirm의 **priceId 검증은 서버 맵**(`config.paddle.priceIds`)을 기준으로 한다. `VITE_*`는 빌드타임 클라 변수라 서버에 존재하지 않으므로 반드시 서버 전용 env를 둔다(이게 없으면 유일한 위조 방지책이 동작 불능).
- 🔴 앱은 USD 금액을 하드코딩하지 않는다. 로케일별 통화·표시가는 Paddle이 결정.
- PPP override(베트남 저가 등)는 Paddle 대시보드의 country/currency 가격 override로 후속 대응 — 코드 변경 불필요(priceId 하나가 나라별 가격을 포함).

### 3. 서버 — 공유 수렴 코어 (`services/entitlement-extend.ts`)

현재 `payment.service.ts`의 `extendEntitlementForPaidOrder` 로직을 provider 무관 코어로 추출한다. 이미 로직 자체는 provider 무관:
- pending→paid 조건부 flip(레이스 방지, 이긴 호출만 연장 = exactly-once)
- `extendPaidUntil(current, plan.days)`로 entitlement upsert
- upsert 실패 시 flip revert(고객 결제됨·권한 없음·재시도로 치유되는 상태 회피)

⚠️ 순수 "이동"이 아니라 **동반 의존성도 함께 옮긴다**: 이 함수는 `requireAdmin()` 헬퍼와 `PaymentRow` 타입에 의존하므로 이 둘도 `entitlement-extend.ts`(또는 공용 모듈)로 옮기고, `payment.service.ts`가 다시 import한다. `payment.service.ts`(토스)와 `paddle.service.ts` 둘 다 여기서 import.

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

토스 service와 나란히. 세 함수 — checkout / confirm(동기, 주) / webhook(멱등, 백스톱):

**`createPaddleCheckout(accountId, planId)`**
1. `isPlanId` 검증
2. `payments` pending 행 insert: `provider:'paddle'`, `currency:'USD'`, `amount:0`(플레이스홀더 — 실 금액은 확정 시 기록), `order_id: 'tb_' + uuid`
3. `{ orderId, priceId: config.paddle.priceIds[planId] }` 반환

**공유 검증 헬퍼 `verifyAndExtend(accountId | null, txnId, orderId)`** (confirm·webhook 공통)
1. `getTransaction(txnId)`로 재조회 — 웹훅/클라 바디 안 믿음
2. `custom_data.orderId`로 pending payments 행 조회(없으면 종료 — 계정 바인딩). `accountId` 주어지면(confirm) 행의 account_id 일치 확인(403).
3. 재검증:
   - status가 `completed`인지
   - `custom_data.orderId`가 우리 orderId와 일치(🔴 리플레이 방지 — 토스 orderId 바인딩과 동일)
   - **priceId 일치**: 트랜잭션 items의 priceId가 `config.paddle.priceIds[row.plan]`와 일치 → 금액 위조 방지. 정확한 통화 금액 일치는 **하지 않음**(Paddle 로컬 변환 때문). priceId는 대시보드 고정이라 위조 불가.
4. 실 결제 통화·금액을 payments 행에 기록(`currency`, `amount` — 🔴 **최소 단위=센트**로 저장. USD $49.50 → 4950)
5. `extendEntitlementForPaidOrder(row, txnId)` → 공유 코어가 flip + 연장(멱등)

**`confirmPaddlePayment(accountId, { transactionId })`** (동기, 클라 successCallback이 호출)
- `verifyAndExtend(accountId, transactionId, ...)` 실행 후 갱신된 `paidUntil` 반환. 토스 `confirmPayment`와 대칭 — 사용자가 결제 직후 곧바로 열람 가능(레이스 제거).

**`handlePaddleWebhook(rawBody, signature)`** (백스톱)
1. `verifyWebhookSignature` 실패 → 조용히 return(200, 재시도 유발 안 함)
2. `event_type`이 one-time 결제 완료 이벤트가 아니면 return (🔴 구현 시 Paddle Billing 실제 이벤트명 확인 — `transaction.completed` vs `transaction.paid`)
3. `verifyAndExtend(null, txnId, orderId)` — confirm과 같은 경로. 이미 confirm이 flip했으면 공유 코어가 no-op(exactly-once).

### 6. 서버 — 라우트/컨트롤러/config

`payment.routes.ts`에 2줄(checkout·confirm — 둘 다 json 파서 OK):
```ts
router.post('/paddle/checkout', PaymentController.postPaddleCheckout);   // auth
router.post('/paddle/confirm',  PaymentController.postPaddleConfirm);    // auth
```

🔴 **raw body 배선 (webhook 전용, app 레벨 필수)**: Paddle 서명 검증은 원본 바디가 필요하다. 현재 `app.ts`는 **전역 `express.json({limit:'10mb'})`를 line 58**에서 등록하고 `paymentRoutes`를 **line 110**에서 마운트한다. Paddle은 `application/json`으로 POST하므로 전역 파서가 바디를 먼저 소비 → 라우터 레벨 `express.raw()`는 이미 비워진 스트림을 만나 HMAC 불가. **유일한 방법**은 전역 json **앞(line 58 이전)**에 이 엔드포인트만 별도 등록:
```ts
app.post('/api/payments/paddle/webhook',
  express.raw({ type: '*/*' }),
  PaymentController.postPaddleWebhook);
```
(라우터 레벨 raw 대안은 이 앱 구성에선 불가능 — 채택하지 않는다.)

컨트롤러:
- `postPaddleCheckout`: `getAccountIdFromRequest` → `createPaddleCheckout` → `{ orderId, priceId }`
- `postPaddleConfirm`: `getAccountIdFromRequest` → `confirmPaddlePayment(accountId, { transactionId })` → `{ paidUntil }`
- `postPaddleWebhook`: **auth 없음**. `req.body`(raw Buffer)와 `Paddle-Signature` 헤더 → `handlePaddleWebhook`

config(`config/index.ts`, `toss` 옆):
```ts
paddle: {
  apiKey: process.env.PADDLE_API_KEY ?? '',
  webhookSecret: process.env.PADDLE_WEBHOOK_SECRET ?? '',
  priceIds: {
    month1: process.env.PADDLE_PRICE_MONTH1 ?? '',
    year1:  process.env.PADDLE_PRICE_YEAR1 ?? '',
  },
},
```

### 7. 클라이언트

**config** (`features/access/config.ts`)
- `isPaddleConfigured` = `Boolean(VITE_PADDLE_CLIENT_TOKEN)` (payment feature 쪽에 두는 게 자연스러우면 그쪽).
- `OVERSEAS_FREE_UNTIL_PADDLE` 판정 강화: `useAccess`에서 `OVERSEAS_FREE_UNTIL_PADDLE && isOverseas && account && !isPaddleConfigured`. 🔴 **Paddle 토큰이 설정되면 해외 무료 브릿지가 자동으로 꺼지고 정식 게이팅 ON** — 플래그를 손으로 false 하는 걸 잊어도 안전.

**`useCheckoutPaddle.ts`** (신규, `useCheckout` 옆)
- `@paddle/paddle-js` 로드 → `Paddle.Checkout.open({ items:[{ priceId, quantity:1 }], customData:{ accountId, orderId } })`
- 흐름: `POST /payments/paddle/checkout` → `{ orderId, priceId }` → 오버레이 open → 성공 이벤트 콜백에서 **`transactionId`를 받아 `POST /payments/paddle/confirm`(동기 연장)** → `{ paidUntil }` → entitlement invalidate + 인라인 성공 안내
- 🔴 **레이스 제거**: 웹훅만 기다리지 않고 confirm으로 즉시 연장하므로, 사용자가 결제 직후 바로 열람 가능. 웹훅은 confirm 유실 시 백스톱. (토스도 confirm-주/webhook-백스톱 이중화 — 동일 패턴.)
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
- `paddle.service.test.ts`(신규): 서명 검증 통과/거부, orderId 바인딩(불일치 무시), priceId 검증(서버 맵 기준·불일치 거부), 멱등(confirm+webhook 동시 → 1회만 연장), 완료 외 이벤트 무시, confirm의 account 바인딩(타 계정 403)
- `entitlement-extend` 추출 후 기존 `payment.service.test.ts` 회귀 그린 확인
- `useAccess` 테스트: `isPaddleConfigured` true일 때 해외 게이팅 ON, false일 때 무료 브릿지 유지

## Paddle 계정 셋업 가이드 (사용자 실행)
1. **Sandbox 가입** → 앱에 sandbox 토큰 넣고 E2E 검증(실 심사 전 전체 흐름 확인)
2. **상품 2개 생성**: 1개월/12개월 one-time price(USD) → 각 priceId를 **클라(`VITE_PADDLE_PRICE_*`)와 서버(`PADDLE_PRICE_*`) 양쪽** env에 매핑
3. **웹훅 등록**: 엔드포인트 `https://<host>/api/payments/paddle/webhook`, one-time 결제 완료 이벤트(`transaction.completed`/`paid` — 구현 시 확인) 구독 → signing secret을 `PADDLE_WEBHOOK_SECRET`
4. **세금/사업자**: MoR이라 Paddle이 전세계 소비세 대납. 세무사에게 "Paddle 정산 = 외화획득 영세율"(메모리 확정)만 전달
5. **심사 통과 → production**: production 토큰·API 키·서버 price env를 **한꺼번에** 교체(아래 🔴 컷오버 순서 주의) → `isPaddleConfigured` 자동 활성 → 해외 정식 게이팅 ON

### 🔴 프로덕션 컷오버 순서 (동시 배포 필수)
- **서버 키(`PADDLE_API_KEY`·`PADDLE_WEBHOOK_SECRET`·`PADDLE_PRICE_*`)와 클라 토큰(`VITE_PADDLE_CLIENT_TOKEN`)을 동시에 배포한다.** 해외 무료 브릿지 auto-off는 **클라 토큰 유무**만 본다(§7) — 클라 토큰만 먼저 나가면 해외 페이월은 켜지는데 서버가 웹훅/confirm을 검증 못 해 결제해도 연장 불가.
- **해외 계정 trial 리셋**: 무료 브릿지 기간에 생성된 해외 계정은 `createdAt` 기준 trial이 이미 만료 상태 → Paddle이 켜지는 순간 전원 즉시 `expired`. 컷오버와 함께 이 계정들의 `entitlements.trial_started_at = now()`를 시드해야 신규 7일 체험이 시작된다(국내 `reset-trials.sql`의 해외판 — 비-ko/해외 계정 스코프 or 전체 일괄). 이 시드 스크립트를 구현 계획에 포함.

## env 요약
| 위치 | 키 | 용도 |
|---|---|---|
| 서버 | `PADDLE_API_KEY` | getTransaction 재조회 |
| 서버 | `PADDLE_WEBHOOK_SECRET` | 웹훅 서명 검증 |
| 서버 | `PADDLE_PRICE_MONTH1` / `PADDLE_PRICE_YEAR1` | 🔴 웹훅/confirm priceId 검증(위조 방지의 유일한 소스) |
| 클라 | `VITE_PADDLE_CLIENT_TOKEN` | Paddle.js 오버레이 + 해외 게이팅 auto-on 신호 |
| 클라 | `VITE_PADDLE_PRICE_MONTH1` / `VITE_PADDLE_PRICE_YEAR1` | 오버레이가 여는 priceId |
