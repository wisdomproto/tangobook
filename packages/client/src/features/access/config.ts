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
