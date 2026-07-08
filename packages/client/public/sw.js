/* 탱고북 자산 캐시 서비스워커 — cache-first (2026-07-08)
 *
 * 목적: 동화 페이지 이미지·어휘 이미지·TTS 음원·효과음 등 **immutable 자산**을 로컬
 *       Cache Storage 에 한 번만 받아 두고, 다음부터는 서버를 안 거치고 로컬에서 준다.
 *       (R2 URL 은 키에 타임스탬프가 박혀 내용이 안 바뀌므로 cache-first-forever 안전.)
 *       → 같은 자산 반복 다운로드로 인한 서버 비용 제거. "flag" = Cache Storage 자체(match).
 *
 * ⚠️ HTML/JS/CSS/API(JSON) 은 캐시하지 않는다(항상 네트워크) — 앱 업데이트/동적 데이터 stale 방지.
 */
const CACHE = 'tango-assets-v1';

/** 캐시 대상 판별 — immutable 미디어/정적 자산만. */
function isCacheableAsset(url) {
  // Cloudflare R2 public 자산 (이미지 webp/png/jpg · 음원 mp3 등)
  if (url.hostname.endsWith('.r2.dev')) return true;
  // R2 프록시 (CORS 우회 오디오/비디오) — key 로 immutable
  if (url.pathname.startsWith('/api/r2-proxy')) return true;
  // 동일 출처 정적 자산 (효과음/아이콘/이미지/로고/마스코트/릴스 등)
  if (/^\/(sounds|icons|images|logo|mascot|reels|fonts)\//.test(url.pathname)) return true;
  return false;
}

self.addEventListener('install', () => {
  // 새 SW 즉시 활성화 (기존 페이지도 다음 네비게이션부터 새 SW 사용)
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // 옛 버전 자산 캐시 정리
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k.startsWith('tango-assets') && k !== CACHE).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  let url;
  try {
    url = new URL(req.url);
  } catch {
    return;
  }
  if (!isCacheableAsset(url)) return; // 나머지는 그냥 네트워크로 통과 (가로채지 않음)

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req);
      if (cached) return cached; // 로컬에 있음 → 서버 안 거침 (재다운로드 X)

      try {
        const res = await fetch(req);
        // 정상(200) 또는 opaque(no-cors R2) 응답만 저장. 저장 실패(quota 등)는 무시하고 응답만 반환.
        if (res && (res.status === 200 || res.type === 'opaque')) {
          cache.put(req, res.clone()).catch(() => {});
        }
        return res;
      } catch (err) {
        // 오프라인 등 — 캐시에도 없으면 실패 반환
        return cached || Response.error();
      }
    })()
  );
});
