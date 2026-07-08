/**
 * 자산 캐시 서비스워커 등록 + durable 저장 권한 요청.
 *
 * - **배포(prod)에서만** 등록 — dev 는 Vite HMR 간섭/자산 stale 캐싱 방지.
 * - `public/sw.js` 가 R2 자산·효과음을 cache-first 로 로컬에 저장 → 같은 자산 반복 다운로드 제거.
 * - `navigator.storage.persist()` = 사용자 허락(브라우저별 자동 승인/프롬프트) — 저장소 압박 시에도
 *   캐시가 evict 되지 않게 보호. 거부돼도 캐시는 동작(단, 공간 부족 시 evict 될 수 있음).
 */
export function registerAssetCache(): void {
  if (!import.meta.env.PROD) return;
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* 등록 실패 — 캐시 없이 정상 동작 */
    });

    // durable 저장 요청 (이미 persisted 면 재요청 X)
    if (navigator.storage?.persist) {
      navigator.storage
        .persisted()
        .then((already) => {
          if (!already) return navigator.storage.persist();
          return true;
        })
        .catch(() => {});
    }
  });
}
