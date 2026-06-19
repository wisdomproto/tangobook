/**
 * 유료화(paywall) 전역 스위치.
 *
 * `false` = 개발/오픈베타 단계 — 모든 게이팅 비활성(로그인 없이 전체 접근).
 *           잠금 뱃지·뷰어 차단·PaywallNotice 전부 inert.
 * `true`  = 유료화 활성 — 무료 책(isAccessibleForFree !== false)만 무료,
 *           나머지는 체험(7일)·구독·레퍼럴 권한 필요.
 *
 * 유료화 시작 시 이 한 줄만 true 로. (Supabase 구독·Paddle webhook 연동 완료 후)
 */
export const PAYWALL_ENABLED = false;
