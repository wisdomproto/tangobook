# 회원 관리 대시보드 (`/members`) — 설계

2026-07-09 · 승인됨 (A안: 독립 대시보드 + ops 인프라 재사용)

## 목적

운영자가 회원(부모 계정)을 조회·관리하는 내부 대시보드.
무료 체험 부여/연장, 유료 권한 무상 부여, 회원별 활동(engagement) 통계,
계정 차단/삭제를 한 화면에서 처리한다. 기존 `/admin`(KPI)과는 별개 페이지.

## 접근/인증

- 클라 라우트 `/members` — AppShell 밖 독립 페이지. 어디에도 링크 노출하지 않음(URL 직접 진입).
- 인증은 기존 ops 방식 재사용: `x-ops-password` 헤더(env `OPS_PASSWORD`) **또는**
  Bearer 토큰 이메일 allowlist(env `OPS_EMAILS`). 서버 `requireOpsUser` 공유
  — 현재 ops.controller module-private이므로 미들웨어/유틸로 추출(export) 선행.
- 클라는 `/admin`과 동일한 비번 게이트 화면 + sessionStorage 보관(`features/ops/api/ops.api.ts` 헬퍼 재사용).

## 서버 API (`/api/ops` 하위, 전부 service role)

| 메서드 | 경로 | 역할 |
| --- | --- | --- |
| GET | `/ops/members` | 회원 목록 + 계정별 요약 |
| GET | `/ops/members/:accountId` | 계정 상세 + 자녀별 활동 |
| POST | `/ops/members/:accountId/grant` | 무료/유료 권한 부여 |
| POST | `/ops/members/:accountId/ban` | Supabase Auth ban/unban |
| DELETE | `/ops/members/:accountId` | 계정 삭제 (auth.admin.deleteUser → FK cascade) |

### GET /ops/members — 목록 요약 필드

이메일 · 가입일 · 자녀 수 · 접근상태(`computeAccess` 재사용: trial/subscribed/expired + 남은 일수)
· `paid_until` · `referral_bonus_days` · `trial_started_at` · 마지막 활동일 · 총 완독 수 · 차단 여부.

차단 여부는 accounts 테이블이 아니라 Supabase Auth(`banned_until`)에 있음 —
`auth.admin.listUsers` 페이지네이션 루프(기본 50/page)로 전체 유저를 받아 매핑.

### GET /ops/members/:accountId — 상세

- 계정: 가입일, 초대코드, 초대한 수/받은 초대, 결제 이력(payments), entitlements 원값, 차단 여부.
- 자녀별 활동(learning_events를 child_profiles로 join, KST 기준 JS 집계 — 기존 ops.service 패턴):
  마지막 접속일 · 완독 권수 · 누적 읽은 시간 · 연속 접속일(streak) · 최근 7일 활동 도트
  · 만난 단어 수(word_exposed) · 게임 플레이 횟수.
- "게임 플레이 횟수" = 게임 이벤트를 **(profile, game_type, KST 날짜)로 그룹한 세션 수**
  (게임 1판이 단어별 이벤트 여러 개를 남기므로 이벤트 raw count 아님).
- 읽은 시간·streak 공식은 클라 `features/learning/lib/aggregate.ts`에만 있음 —
  부모 리포트와 수치 불일치를 막기 위해 **공식을 shared로 이동**해 서버·클라가 공유.

### POST /ops/members/:accountId/grant

```jsonc
{ "type": "trial-reset" }                      // trial_started_at = now()
{ "type": "bonus-days", "days": 7 }            // referral_bonus_days += days (1 ≤ days ≤ 365)
{ "type": "paid-until", "until": "2026-12-31" } // paid_until = 지정 시각 (미래만 허용)
```

- entitlements upsert(`on conflict account_id`).
- 검증: days 정수 1~365, until은 미래 시각. 위반 시 `AppError(400)`.
- 존재하지 않는 accountId → 상세/grant/ban/delete 모두 `AppError(404)`.

### POST /ops/members/:accountId/ban

`{ "banned": true | false }` → `auth.admin.updateUserById(id, { ban_duration: banned ? '876000h' : 'none' })`.
자체 blocked 플래그 없음 — Supabase 내장 ban만 사용(로그인 자체가 차단됨).

### DELETE /ops/members/:accountId

`auth.admin.deleteUser(accountId)` → `accounts` 및 하위 테이블 FK cascade.
클라에서 이메일 재입력 확인 후에만 호출.

## 화면 구성 (`features/members/` 신규 feature 모듈)

1. **비번 게이트** — `/admin`과 동일 UX.
2. **상단 요약 바** — 총 회원 · 오늘 활동 계정 · 체험중/구독중/만료 수.
3. **회원 테이블** — 이메일 검색, 가입일/마지막활동 정렬.
   컬럼: 이메일 · 가입일 · 자녀 · 상태 배지(체험 N일 / 구독 / 만료 / 차단) · 마지막 활동 · 완독.
4. **행 클릭 → 상세 드로어**
   - 계정 정보 + 결제 이력 + 초대 현황 + entitlement 원값
   - 자녀별 활동 카드(마지막접속·완독·읽은시간·연속일·주간 도트·만난단어·게임)
   - 액션 버튼: `🎁 +7일` `🎁 +30일` `체험 지금부터 리셋` `💳 유료 ~날짜까지(date picker)`
     `🚫 차단/해제` `🗑 삭제(이메일 타이핑 확인)`
5. 액션 성공 시 TanStack Query invalidate로 목록/상세 즉시 갱신.

## 안전장치

- 삭제는 이메일 재입력 일치 시에만 활성화.
- grant days 상한 365 (서버 검증).
- 모든 쓰기 액션 서버 콘솔 로그(대상 계정·액션·값). 감사 테이블은 YAGNI로 생략.
- 쓰기 API도 전부 `requireOpsUser` 통과 필수.

## 데이터/스키마

**신규 마이그레이션 없음.** 기존 `accounts` · `child_profiles` · `learning_events`
· `payments` · `entitlements` + Supabase Auth 내장 ban으로 전부 커버.

## 테스트

- 서버 단위: grant 3종 입력 검증 + entitlements 갱신 로직(순수 함수로 분리), requireOpsUser 거부 케이스.
- 수동: 본인 계정에 +7일 부여 → 학습자 사이드바 TrialBadge 일수 변화 확인.

## 비범위 (YAGNI)

- 감사(audit) 테이블, 페이지네이션(수백 계정까지 JS 집계로 충분), CSV 내보내기,
  이메일 발송, 자녀 프로필 개별 편집.
- **권한 회수(revoke) UI** — grant는 부여만(paid-until 미래, bonus-days ≥1).
  잘못 부여한 권한 회수는 SQL 직접 수정으로 처리(내부 도구 YAGNI).
