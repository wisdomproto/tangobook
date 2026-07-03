import { useEffect, useSyncExternalStore } from 'react';
import { isUiMuted, subscribeUiMuted } from '@/lib/uiSound';

/**
 * 메인(브라우즈) 화면 배경음악 + 우하단 플로팅 🎵 토글 — AppShell 에 마운트.
 *
 * AppShell 안 라우트(라이브러리·게임허브·연속재생 홈 등)에서만 재생되고,
 * AppShell 밖(뷰어/게임/파닉스/부모/결제)으로 나가면 언마운트로 자동 정지 —
 * 뷰어 BGM·나레이션과 겹치지 않는다.
 *
 * - 곡: 기본 BGM 5곡 중 메인 테마 1곡 고정 (바꾸려면 MAIN_BGM_URL 만 수정)
 * - 끄기 2경로: ① 플로팅 🎵 버튼(배경음만, localStorage 영속) ② 부모설정 🔊
 *   효과음 음소거(tangobook-ui-muted — 효과음+배경음 전체)
 * - autoplay 차단 브라우저: 첫 pointerdown(사용자 제스처)에서 시작
 */
const MAIN_BGM_URL = '/sounds/bgm/default-1.mp3';
const MAIN_BGM_VOLUME = 0.25; // 나레이션 없는 화면이지만 은은하게

// ── 배경음 전용 음소거 store (UI 효과음 음소거와 별개) ─────────────────────
const BGM_MUTE_KEY = 'tangobook-bgm-muted';
let bgmMuted = ((): boolean => {
  try {
    return localStorage.getItem(BGM_MUTE_KEY) === 'true';
  } catch {
    return false;
  }
})();
const bgmListeners = new Set<() => void>();
function isBgmMuted(): boolean {
  return bgmMuted;
}
function setBgmMuted(next: boolean): void {
  bgmMuted = next;
  try {
    localStorage.setItem(BGM_MUTE_KEY, String(next));
  } catch {
    /* ignore */
  }
  bgmListeners.forEach((l) => l());
}
function subscribeBgmMuted(listener: () => void): () => void {
  bgmListeners.add(listener);
  return () => {
    bgmListeners.delete(listener);
  };
}

let sharedAudio: HTMLAudioElement | null = null;

function ensureAudio(): HTMLAudioElement {
  if (!sharedAudio) {
    sharedAudio = new Audio(MAIN_BGM_URL);
    sharedAudio.loop = true;
    sharedAudio.preload = 'auto';
    sharedAudio.volume = MAIN_BGM_VOLUME;
  }
  return sharedAudio;
}

export function AppBgm() {
  const uiMuted = useSyncExternalStore(subscribeUiMuted, isUiMuted, isUiMuted);
  const bgmOff = useSyncExternalStore(subscribeBgmMuted, isBgmMuted, isBgmMuted);
  const silenced = uiMuted || bgmOff;

  useEffect(() => {
    if (silenced) {
      sharedAudio?.pause();
      return;
    }
    const audio = ensureAudio();
    let disposed = false;

    const tryPlay = () => {
      if (disposed) return;
      void audio.play().catch(() => {
        /* autoplay 차단 — 아래 pointerdown 폴백이 처리 */
      });
    };
    tryPlay();

    // autoplay 차단 대비: 첫 사용자 제스처에서 시작 (성공하면 리스너 해제)
    const onGesture = () => {
      if (disposed || !audio.paused) return;
      void audio
        .play()
        .then(() => document.removeEventListener('pointerdown', onGesture, true))
        .catch(() => {});
    };
    document.addEventListener('pointerdown', onGesture, true);

    return () => {
      disposed = true;
      document.removeEventListener('pointerdown', onGesture, true);
      audio.pause(); // AppShell 이탈(뷰어/게임 진입) 시 정지
    };
  }, [silenced]);

  // 전체 음소거(부모설정) 중엔 배경음 버튼 숨김 — 눌러도 소리 안 나 혼란만 줌
  if (uiMuted) return null;

  return (
    <button
      type="button"
      onClick={() => setBgmMuted(!bgmOff)}
      data-sound="toggle"
      aria-label={bgmOff ? '배경음악 켜기' : '배경음악 끄기'}
      title={bgmOff ? '배경음악 켜기' : '배경음악 끄기'}
      className="fixed bottom-4 right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-xl shadow-pop backdrop-blur-sm transition hover:scale-105 active:scale-95"
    >
      {bgmOff ? '🔇' : '🎵'}
    </button>
  );
}
