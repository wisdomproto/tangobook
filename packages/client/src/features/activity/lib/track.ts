/** GA4 이벤트 — gtag 가 없으면(광고차단·개발) 조용히 아무것도 안 한다. */
export function trackActivity(
  event: 'activity_print' | 'activity_play' | 'activity_cta',
  params: { kind: string; key: string; target?: 'source' | 'home' | 'next' }
): void {
  (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag?.('event', event, params);
}
