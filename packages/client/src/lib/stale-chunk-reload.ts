/**
 * 배포로 사라진 청크를 만나면 **한 번만** 새로고침한다.
 *
 * 🔴 왜 필요한가 — 자산 파일명에 콘텐츠 해시가 붙으므로, 배포되면 옛 이름의 청크는 서버에서
 *    사라진다. 그런데 **그 전에 열어둔 탭은 여전히 옛 이름을 요청**한다(SPA 라 새로고침 없이
 *    라우트를 옮겨 다니기 때문에 몇 시간이고 옛 빌드로 산다). 그래서 배포 후 열려 있던 PC 탭에서만
 *    "Failed to fetch dynamically imported module" 이 뜨고, 새로 연 모바일은 멀쩡하다(2026-08-05 실측).
 *    새로고침 한 번이면 새 index.html 을 받아 정상화된다 — 사용자가 그걸 알아낼 이유가 없다.
 *
 * 🔴 무한 새로고침 방지 — 청크가 **영영** 없는 경우(빌드 사고)엔 새로고침해도 안 고쳐진다.
 *    sessionStorage 표식으로 탭당 1회만 시도하고, 그 뒤엔 평소 에러 화면을 보여준다.
 */
const KEY = 'tb-stale-chunk-reloaded';

export function reloadOnceForStaleChunk(): boolean {
  try {
    if (sessionStorage.getItem(KEY)) return false;
    sessionStorage.setItem(KEY, '1');
  } catch {
    return false; // 프라이빗 모드 등 — 새로고침 루프를 만들 바엔 아무것도 안 한다.
  }
  window.location.reload();
  return true;
}

/** 새 빌드로 성공적으로 떴다는 뜻 — 다음 배포 때 다시 한 번 새로고침할 수 있게 표식을 지운다. */
export function clearStaleChunkMark(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function registerStaleChunkReload(): void {
  if (typeof window === 'undefined') return;
  // Vite 가 동적 import/preload 실패 시 쏘는 전용 이벤트.
  window.addEventListener('vite:preloadError', (e) => {
    e.preventDefault(); // 기본 동작(에러 전파) 막고 우리가 새로고침을 시도한다.
    reloadOnceForStaleChunk();
  });
}
