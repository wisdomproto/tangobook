import { usePlaylistStore } from '../store/playlist.store';

// 재생 버튼 클릭(사용자 제스처) 안에서 무음 오디오를 한 번 재생해 브라우저 오디오를 해금한다.
// SPA 네비게이션이라 문서가 유지돼 제스처 컨텍스트가 살아있고, 다음 화면(ViewerContainer)에서
// 첫 책도 "탭해서 시작하기" 없이 바로 자동재생된다. 실패해도 무해(best-effort).
let unlockEl: HTMLAudioElement | null = null;
function unlockAudio() {
  try {
    if (!unlockEl) {
      unlockEl = new Audio(
        'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='
      );
      unlockEl.volume = 0;
    }
    void unlockEl
      .play()
      .then(() => unlockEl?.pause())
      .catch(() => {});
  } catch {
    /* best-effort */
  }
}

/**
 * 연속재생 시작 공용 핸들러 — 반드시 재생 버튼 클릭 안에서 호출.
 * 오디오 해금 + 큐 세팅 + 재생 화면 이동을 한 번에.
 */
export function beginPlaylist(
  bookIds: string[],
  language: string,
  navigate: (to: string) => void
): void {
  if (bookIds.length === 0) return;
  unlockAudio();
  usePlaylistStore.getState().setQueue(
    bookIds.map((bookId) => ({ bookId })),
    language
  );
  navigate('/continuous/play');
}
