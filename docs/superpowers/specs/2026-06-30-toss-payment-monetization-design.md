# 토스 결제 + 프리미엄 게이팅 설계

**날짜**: 2026-06-30
**상태**: 설계 합의 (구현 대기)
**선행**: 소셜 로그인(카카오·구글) 완료 — 계정/세션 기반 마련됨

## 1. 목표 / 비목표

**목표**: 국내(한국) 대상으로 동화책 유료화를 켠다. 토스페이먼츠 단건 결제로 "이용권(기간권)"을 팔고, 결제 성공 시 유료책 전체 열람 권한을 부여한다. 게스트는 무료 3권만, 가입자는 7일 무료 체험, 친구 초대 시 +7일.

**비목표(이번 제외)**:
- 자동결제(빌링키 정기구독) — 향후 2차
- 글로벌/해외카드 결제(Paddle 등 MoR) — 향후 별도
- 책 1권 단위 판매 — 안 함(이용권=전체 열람)

## 2. 이미 있는 것 (재사용, 신규 아님)

- `packages/shared/src/utils/entitlement.ts` — `computeAccess`(guest/trial/subscribed/expired), `canReadBook`, `trialEndMs`, `isSubscriptionActive`. trial 7일 + `referralBonusDays` + `subscription{currentPeriodEnd}` 모두 수용. 순수 로직 + 테스트 존재.
- `packages/client/src/features/access/` — `useAccess`(현재 subscription 미주입), `config.ts` `PAYWALL_ENABLED=false`, `PaywallNotice`, `LockBadge`.
- 책 `isAccessibleForFree` 게이팅: `isAccessibleForFree !== false` = 무료, `=== false` = 유료(권한 필요).

→ 결제 "판정 두뇌"는 완성. 이번 작업은 **실제 결제 + 데이터 영속 + UI + referral + 배너**.

## 3. 상품 정의 (`PLANS`, shared 단일 소스)

`packages/shared/src/constants/plans.ts` 신규. 가격은 placeholder(확정 시 숫자만 교체):

```ts
export const PLANS = {
  month1: { id: 'month1', amount: 9900,  days: 30,  name: '1개월 이용권' },
  year1:  { id: 'year1',  amount: 99000, days: 365, name: '12개월 이용권' },
} as const;
export type PlanId = keyof typeof PLANS;
```

금액은 **서버가 PLANS에서 결정**(클라가 보낸 금액 신뢰 안 함).

## 4. 데이터 모델 (Supabase)

마이그레이션: `scripts/supabase-payments.sql` (또는 MCP `apply_migration`).

```sql
-- 결제 이력 (멱등·감사)
create table payments (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  order_id text not null unique,          -- 멱등 키
  payment_key text,                       -- 토스 승인 후
  plan text not null,
  amount integer not null,
  status text not null default 'pending', -- pending|paid|failed
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

-- 계정별 권한 상태 (1:1)
create table entitlements (
  account_id uuid primary key references accounts(id) on delete cascade,
  paid_until timestamptz,                 -- 기간권 만료 시각 (결제 시 연장)
  referral_bonus_days integer not null default 0,
  referral_code text unique,              -- 내 초대 코드
  referred_by uuid references accounts(id),
  updated_at timestamptz not null default now()
);
```

**RLS**: 본인 행 `select`만 허용. `insert/update`는 **service role(서버)만** — 결제 승인·referral 적립은 신뢰 경로에서만. (마케팅 포트의 `supabase-admin.provider` 서비스롤 패턴 재사용.)

## 5. 결제 플로우 (토스 단건, 금액 위변조 차단형)

1. **체크아웃 생성** — 클라 `POST /api/payments/checkout { plan }`
   → 서버: PLANS에서 금액 결정, `payments` pending row(order_id 생성) → `{ orderId, amount, orderName }` 반환
2. **결제 요청** — 클라 토스 SDK(`@tosspayments/tosspayments-sdk`) `requestPayment({ orderId, amount, orderName, successUrl, failUrl })`
   - clientKey = `VITE_TOSS_CLIENT_KEY` (테스트키, 공개 가능)
3. **승인** — successUrl `/payments/success?paymentKey&orderId&amount`
   → 클라 `POST /api/payments/confirm { paymentKey, orderId, amount }`
   → 서버:
     a. order_id 조회 + status=pending + **amount가 PLANS 금액과 일치** 검증 (불일치=거부)
     b. 토스 `POST https://api.tosspayments.com/v1/payments/confirm` (시크릿키 Basic auth, **서버 전용** `TOSS_SECRET_KEY`)
     c. 성공 → payments status=paid, `entitlements.paid_until = max(now, paid_until) + plan.days` 연장
     d. 멱등: 이미 paid면 no-op 200
4. 클라 → `/library` 이동, `useAccess` 권한 활성.
- 실패 → failUrl `/payments/fail` (사유 표시 + 재시도).

**키**: 개발=토스 공개 테스트키. 실가맹 계약 후 env만 교체.

## 6. useAccess 연동

```ts
// useAccess: PAYWALL_ENABLED 시 entitlement row fetch (supabase, RLS 본인)
//  → computeAccess({ account, subscription: paid_until? {status:'active',currentPeriodEnd:paid_until} : null,
//                     referralBonusDays: row.referral_bonus_days })
```
TanStack Query로 entitlement 캐싱. 결제 성공 후 invalidate.

## 7. 무료 3권 + paywall ON

- **무료 마킹**: 신데렐라 `1772107608499` · 인어공주 `1772181399388` · 백설공주 `1778555233699` + 각 `__L2/__L4` 형제 → `isAccessibleForFree: true`.
- **유료 잠금**: **공개된(isPublic 계열)** 나머지 책만 `isAccessibleForFree: false` 일괄 마킹. 비공개/미완성 책은 건드리지 않음. (현재 미지정=무료취급이므로 명시 필요.) → 멱등 스크립트 `scripts/mark-free-books.mjs`.
- **정렬**: `_index/library-config.json` — `categoryOrder` 맨 앞 `세계 명작`, `bookPriority['세계 명작']` 앞 3개 = 무료책.
- `PAYWALL_ENABLED = true`.

## 8. 친구초대 +7일 (referral)

- 가입 시(또는 최초 접근 시) `entitlements.referral_code` 발급(짧은 코드).
- 초대 링크: `https://tangobook.co.kr/?ref=CODE` (OG: 기존 `og-invite.png`).
- 신규 방문 시 URL `ref` → localStorage 저장 → **가입 완료 후** 서버 엔드포인트가 `referred_by` 기록 + **초대자**에게 `referral_bonus_days += 7`.
- **어뷰징 방지**: 자기 자신 초대 차단 · 피초대 계정당 1회만(referred_by 이미 있으면 무시) · 누적 상한 `+28일` · 가입 완료 시점에만 적립.
- entitlement `referralBonusDays`로 trial 연장에 반영.

## 9. 프로모 배너 (롤링 제거)

- `features/library/components/LibraryBanner.tsx` 3슬라이드 롤링 → 단일 `PromoBanner`로 교체(LibraryPage 사용처 1곳).
- **좌측(HTML 오버레이)**: 헤드라인 "로그인하면 7일 무료 체험", 서브 "친구 초대하면 +7일 무료", 코랄 CTA 버튼.
- **우측(이미지)**: `public/images/library-banner/promo.webp` (호리가 빛나는 책+선물 든 일러스트, 피사체 우측·좌측 여백=텍스트존. 1872×1248).
- **상태별 카피**(useAccess + auth):
  - 게스트 → "로그인하면 7일 무료" + [로그인] → `/login`
  - 체험중 → "무료 체험 N일 남음" + [이용권 보기] → `/subscribe`
  - 만료 → "이용권으로 모든 책을" + [이용권 보기]
  - 구독중 → 배너 숨김(또는 감사 카피)

## 10. 진입점 & 라우트

- `/subscribe` — 2플랜 카드 + 결제 버튼(토스). PaywallNotice CTA가 여기로.
- `/payments/success`, `/payments/fail` — 승인 콜백 처리 페이지.
- 부모 설정(`ParentSettingsPage`) — 현재 이용권 상태 표시(만료일/체험 남은일) + 결제 진입.
- 뷰어/BookDetail의 유료책 → 기존 `PaywallNotice`/`LockBadge`가 paywall ON 시 자동 동작.

## 11. 모듈 경계 (신규)

- `features/payment/` — `api/payment.api.ts`(checkout/confirm), `hooks/useCheckout.ts`, `pages/SubscribePage.tsx`, `pages/PaymentSuccessPage.tsx`/`PaymentFailPage.tsx`, `components/PlanCard.tsx`.
- `features/library/components/PromoBanner.tsx`.
- 서버 `routes/payments.routes.ts` → `controllers/payments.controller.ts` → `services/payments.service.ts`(토스 호출+entitlement) → `providers/toss.provider.ts`(SDK/HTTP) + `supabase-admin`.
- shared: `constants/plans.ts`, entitlement.ts 확장(이미 수용 가능 — 변경 최소).

## 12. 보안

- 시크릿키(`TOSS_SECRET_KEY`)·service role 키 = **서버 env 전용**, 절대 클라 노출 금지.
- 금액은 서버 PLANS 기준 재검증(클라 amount 신뢰 X).
- order_id unique로 이중 결제/리플레이 차단. confirm 멱등.
- entitlements 쓰기는 service role만(RLS).
- referral 자기초대·중복·상한 가드.

## 13. 테스트

- `entitlement.test.ts` 확장: paid_until 기반 subscribed, referral 보너스 합산, 만료 경계.
- 서버 `payments.service` 테스트: 금액 불일치 거부, confirm 멱등, 토스 호출 mock.
- `canReadBook`: 무료3권 항상 열람, 유료책 권한별.
- `PromoBanner`: 게스트/체험/만료/구독 상태별 카피·CTA.
- referral: 자기초대 차단, 중복 무시, 상한.

## 14. 롤아웃 순서

1. shared PLANS + entitlement 확장 + 테스트
2. Supabase 마이그(payments·entitlements·RLS)
3. 서버 payments(checkout/confirm) + toss.provider (테스트키)
4. 클라 payment feature(SubscribePage/success/fail) + useAccess 연동
5. 무료책 마킹 스크립트 + library-config 정렬 + PAYWALL_ENABLED=true
6. PromoBanner 교체
7. referral(코드 발급·링크 캡처·적립·어뷰징)
8. 수동 QA(샌드박스 결제 → 권한 부여 → 유료책 열람)

## 15. 미확정 (구현 중 확정 가능)

- 가격 숫자(현재 9,900 / 99,000 placeholder)
- referral 누적 상한(현재 +28일 가정)
- 구독자에게 배너: 완전 숨김 vs 감사 카피
- `/subscribe` 디자인 시안(별도 이미지 핸드오프 가능)
