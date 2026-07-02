/**
 * 전역 UI 효과음 — 버튼 탭, 모달 열고닫기, 별/보상, 책 펼침·페이지 넘김, 재생 등.
 *
 * React 밖의 싱글톤이라 이벤트 핸들러 어디서든 `playUi('tap')` 로 호출 가능.
 * - 파일: `/sounds/ui/{name}.mp3`
 * - 음소거는 localStorage('tangobook-ui-muted')에 영속 (게임 음소거와 별개)
 * - 빠른 연타 대비 사운드별 작은 풀(round-robin)로 겹침 재생 허용
 */

export type UiSoundName =
  | 'tap'
  | 'select'
  | 'back'
  | 'toggle'
  | 'open'
  | 'close'
  | 'book-open'
  | 'page-turn'
  | 'star'
  | 'reward'
  | 'success'
  | 'play';

const ALL_SOUNDS: UiSoundName[] = [
  'tap',
  'select',
  'back',
  'toggle',
  'open',
  'close',
  'book-open',
  'page-turn',
  'star',
  'reward',
  'success',
  'play',
];

const STORAGE_KEY = 'tangobook-ui-muted';
const POOL_SIZE = 4;

let muted = ((): boolean => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
})();

const listeners = new Set<() => void>();
const pools = new Map<UiSoundName, HTMLAudioElement[]>();
const cursor = new Map<UiSoundName, number>();

function url(name: UiSoundName): string {
  return `/sounds/ui/${name}.mp3`;
}

function ensurePool(name: UiSoundName): HTMLAudioElement[] {
  let pool = pools.get(name);
  if (!pool) {
    pool = Array.from({ length: POOL_SIZE }, () => {
      const a = new Audio(url(name));
      a.preload = 'auto';
      return a;
    });
    pools.set(name, pool);
    cursor.set(name, 0);
  }
  return pool;
}

/** 마운트 시 한 번 호출 — 전 효과음 프리로드(첫 재생 지연 제거). */
export function preloadUiSounds(): void {
  if (typeof window === 'undefined') return;
  for (const name of ALL_SOUNDS) ensurePool(name);
}

export function isUiMuted(): boolean {
  return muted;
}

export function setUiMuted(next: boolean): void {
  muted = next;
  try {
    localStorage.setItem(STORAGE_KEY, String(next));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function toggleUiMuted(): void {
  setUiMuted(!muted);
}

/** useSyncExternalStore 용 구독. */
export function subscribeUiMuted(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** 효과음 재생. 음소거 시 무시. */
export function playUi(name: UiSoundName): void {
  if (muted || typeof window === 'undefined') return;
  const pool = ensurePool(name);
  const i = cursor.get(name) ?? 0;
  cursor.set(name, (i + 1) % pool.length);
  const a = pool[i];
  try {
    a.currentTime = 0;
    void a.play().catch(() => {});
  } catch {
    /* ignore */
  }
}
