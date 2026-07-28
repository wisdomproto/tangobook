/**
 * 유료화(paywall) 전역 스위치.
 *
 * `false` = 개발/오픈베타 단계 — 모든 게이팅 비활성(로그인 없이 전체 접근).
 *           잠금 뱃지·뷰어 차단·PaywallNotice 전부 inert.
 * `true`  = 유료화 활성 — 무료 책(isAccessibleForFree !== false)만 무료,
 *           나머지는 체험(7일)·구독·레퍼럴 권한 필요.
 *
 * 유료화 시작(런칭) 시 이 한 줄만 true 로.
 * ⚠️ 런칭 전제: 실제 토스 가맹 계약 + 운영 키(VITE_TOSS_CLIENT_KEY / TOSS_SECRET_KEY)가
 *    설정돼 있어야 함. 테스트 키 상태로 true 배포 시 잠금은 보이는데 결제가 깨짐.
 *    (무료책 isAccessibleForFree 마킹·library-config 정렬은 이미 적용됨 — 스위치만 남음.)
 */
export const PAYWALL_ENABLED = true;

/**
 * 게스트(미로그인) 전용 소프트 게이팅.
 *
 * `true`  = 유료화(PAYWALL_ENABLED) 전이라도 **로그인 안 한 방문자**에게는 무료 책만 열고
 *           나머지(isAccessibleForFree===false, 146권)는 잠금 표시 → 가입 유도.
 *           **로그인한 사용자는 전부 열람**(결제 준비 전이라 아직 과금 X).
 * `false` = 게스트도 전체 열람 (완전 오픈).
 *
 * PAYWALL_ENABLED=true 가 되면 이 플래그와 무관하게 정식 체험/구독 게이팅이 적용된다.
 */
export const LOCK_FOR_GUESTS = true;

/**
 * 해외(비-한국어 로케일) 무료 임시 브릿지 — Paddle(해외 결제) 나오기 전까지.
 *
 * `true`  = UI 언어가 ko 가 아닌 **로그인 사용자**는 페이월 미적용(전권 무료).
 *           국내 결제(토스)는 해외 카드가 안 되므로, 해외는 우선 트래픽·가입만 확보하고
 *           수익화는 Paddle 연동 후로 미룬다. (게스트는 그대로 가입 유도 소프트게이팅 유지.)
 * `false` = 로케일 무관 정식 게이팅.
 *
 * 🔴 Paddle 연동 완료 시 false 로 되돌리고 해외도 정식 체험/구독 적용.
 * ⚠️ 판정 기준 = UI 언어(로케일) — 국내 사용자가 UI 를 영어로 바꾸면 우회되는 임시 허점이나,
 *    Paddle 전까지의 런칭 브릿지라 감수. (region 기반 정교화는 Paddle 시점에.)
 */
export const OVERSEAS_FREE_UNTIL_PADDLE = true;

/**
 * 🔴 **파닉스는 언제나 무료** — 잠그지 않는다(2026-07-28 결정).
 *
 * 한글/영어 파닉스는 **획득 채널**이다. 광고·검색으로 들어온 사람이 가입도, 결제도, 게스트 창 만료도
 * 없이 32단원을 끝까지 쓸 수 있어야 한다. 가입 유인은 잠금이 아니라 **학습 기록**이 맡는다
 * (게스트는 계정이 없어 부모 리포트의 자음×모음 표가 안 쌓인다).
 *
 * 지금까지 열려 있던 건 **결정이 아니라 누락**이었다 — 학습 화면(`/library/phonics/korean/*`)이
 * AppShell 밖이라 진입 게이트를 안 만났을 뿐이고, 정작 **랜딩(`/library/phonics`)은 셸 안이라
 * 미로그인 첫 방문과 게스트 만료 뒤에 벽을 만났다**. 광고를 태우면 그 벽에서 샌다.
 *
 * 그래서 ①이 상수로 결정을 이름 붙이고 ②`AppShell` 이 파닉스 경로에선 게이트를 띄우지 않는다.
 * 🔴 파닉스 화면에 `useAccess`/페이월을 붙이지 말 것 — 붙이는 순간 이 결정이 조용히 뒤집힌다.
 */
export const PHONICS_ALWAYS_FREE = true;

/** 잠그지 않는 경로 접두사 — `PHONICS_ALWAYS_FREE` 의 적용 범위. */
export const isAlwaysFreePath = (pathname: string) =>
  PHONICS_ALWAYS_FREE && pathname.startsWith('/library/phonics');
