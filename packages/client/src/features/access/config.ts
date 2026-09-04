/**
 * 🔴 **베타 기간 — 전부 연다.** (2026-09-04)
 *
 * `true`  = 로그인 여부·언어·콘텐츠 종류와 무관하게 **모든 게이팅이 inert**.
 *           아래 플래그들(PAYWALL_ENABLED · LOCK_FOR_GUESTS · PHONICS_ALWAYS_FREE)이
 *           무슨 값이든 이 한 줄이 이긴다.
 * `false` = 아래 플래그들이 정상 작동(= 베타 종료).
 *
 * 왜 개별 플래그를 뒤집지 않고 이걸 새로 두는가 —
 * 게이팅이 네 플래그에 흩어져 있고 그중 둘은 서로를 덮는다. 하나씩 끄면
 * **다시 켤 때 원래 조합을 복원하지 못한다.** 이 플래그는 아래를 **건드리지 않고 덮기만** 하므로
 * `false` 로 되돌리는 순간 베타 이전 정책이 그대로 돌아온다.
 *
 * 🔴 **한 곳만 열어선 안 된다.** 판정이 네 군데에 있고, 그중 셋은 `useAccess` 와 별개로
 *    **`!session` 을 직접 본다** — 훅만 열면 미로그인에게는 여전히 가입 벽이 선다.
 *      ① `useAccess()`                 권한 판정 자체
 *      ② `ActivityGate`                독후활동 라우트
 *      ③ `PhonicsUnitGate`             파닉스 단원
 *      ④ `BookDetailPage.activityBlocked`  「놀며 익히기」 **버튼**
 *    ④ 를 빼면 라우트는 열려 있는데 버튼이 로그인 페이지로 보내버려
 *    게이트까지 닿지도 못한다(실제로 그랬다).
 *
 * 🔴 **문구도 같이 바뀐다.** `/intro` FAQ 의 「가입하면 나머지 책이 열립니다」는
 *    베타엔 거짓이다 — 남기는 책이 없다. `faq.items.noSignup.aBeta`(5개 언어)로 갈라 쓴다.
 */
export const BETA_OPEN: boolean = true;

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
 * 🔴 **파닉스도 동화책과 같은 규칙** — 따로 열어두지 않는다(2026-07-29 결정, 07-28 결정을 뒤집음).
 *
 * 하루 전엔 파닉스를 **획득 채널**로 보고 잠그지 않기로 했었다(가입 유인은 잠금이 아니라 학습
 * 기록이 맡는다는 논리). 그 결정을 되돌린다 — 게스트 30일 / 로그인 이라는 **한 가지 규칙**으로
 * 가고, 광고는 「지금 베타기간 회원가입만 하면 1년 무료」로 가입 자체를 판다.
 *
 * 🔴 **끄는 것만으로는 부족하다.** 학습 화면(`/library/phonics/{korean,english}/*`)은 AppShell
 * **밖**이라 이 상수와 무관하게 게이트를 안 만난다 — URL 로 바로 들어가면 그대로 열린다.
 * 그래서 라우터에서 그 경로들을 `<GuestGate>` 로 감쌌다. 둘 중 하나만 바꾸면 반쪽이 된다.
 */
export const PHONICS_ALWAYS_FREE = false;

/** 잠그지 않는 경로 접두사 — `PHONICS_ALWAYS_FREE` 의 적용 범위. */
export const isAlwaysFreePath = (pathname: string) =>
  PHONICS_ALWAYS_FREE && pathname.startsWith('/library/phonics');
