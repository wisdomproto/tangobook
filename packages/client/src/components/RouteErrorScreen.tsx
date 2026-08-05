import { useRouteError } from 'react-router-dom';
import { reloadOnceForStaleChunk } from '@/lib/stale-chunk-reload';

/** 배포로 청크가 사라졌을 때 브라우저가 내는 문구들. 문자열 판별 말곤 구분할 방법이 없다. */
const STALE_CHUNK_RE =
  /dynamically imported module|Importing a module script failed|error loading dynamically imported module|Failed to fetch/i;

/**
 * 라우트 에러 화면.
 *
 * 🔴 첫 목적은 **자동 복구**다 — 배포되면 콘텐츠 해시가 바뀌어 옛 청크가 사라지는데, 그 전에 열어둔
 *    탭은 계속 옛 이름을 요청한다. 사용자에겐 "새로고침하면 됩니다"라고 알 방법이 없으므로 한 번은
 *    대신 눌러 준다(`reloadOnceForStaleChunk` 가 탭당 1회로 막는다 — 영영 없는 청크면 무한 루프다).
 * 🔴 그 외의 에러는 새로고침해도 안 고쳐지므로 조용한 안내만 남긴다. React Router 기본 화면은
 *    영문 스택이라 4~7세 아이·부모 화면에 그대로 뜨면 안 된다.
 */
export function RouteErrorScreen() {
  const error = useRouteError();
  const message = error instanceof Error ? error.message : String(error ?? '');

  if (STALE_CHUNK_RE.test(message) && reloadOnceForStaleChunk()) {
    return null; // 새로고침이 시작됐다 — 잠깐 빈 화면.
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream-50 p-8 text-center">
      <span className="text-5xl" aria-hidden>
        🙈
      </span>
      <p className="font-display text-lg font-black text-ink-900 break-keep">
        화면을 여는 데 문제가 생겼어요
      </p>
      <button
        onClick={() => window.location.reload()}
        className="min-h-[44px] rounded-full bg-coral-500 px-6 py-3 font-black text-white shadow-soft transition hover:bg-coral-600"
      >
        다시 열기
      </button>
    </div>
  );
}
