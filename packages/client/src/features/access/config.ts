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
export const PAYWALL_ENABLED = false;

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
