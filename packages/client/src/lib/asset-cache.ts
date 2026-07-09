/**
 * 자산 캐시 서비스워커 등록 + durable 저장 권한 요청.
 *
 * - prod + dev 모두 등록. `public/sw.js` 가 **dev(localhost)에선 R2 자산만** 캐시(동일출처 정적은
 *   제외 — 개발 중 파일 교체 stale 방지), prod 는 전부 캐시. R2 URL 은 내용 불변이라 dev 캐시도 안전.
 *   앱 JS/HTML/API 는 어디서도 캐시 안 함(가로채지 않음) → HMR/동적데이터 영향 없음.
 * - cache-first 로 같은 자산(파닉스 mp3·이미지·TTS·BGM) 반복 다운로드 제거 → "한 번 받으면 영구".
 * - `navigator.storage.persist()` = 사용자 허락(브라우저별 자동 승인/프롬프트) — 저장소 압박 시에도
 *   캐시가 evict 되지 않게 보호. 거부돼도 캐시는 동작(단, 공간 부족 시 evict 될 수 있음).
 */
export function registerAssetCache(): void {
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
