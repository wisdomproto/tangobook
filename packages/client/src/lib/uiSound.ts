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
  | 'play'
  | 'draw';

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
  'draw',
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
  if (next) stopDrawLoop(); // 음소거 시 진행 중인 그리기 루프 즉시 정지
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

/**
 * 효과음 재생. 음소거 시 무시.
 *
 * `rate` 로 음높이를 올릴 수 있다 — 같은 소리가 반복될 때 조금씩 올라가면 "쌓이고 있다"가 들린다
 * (색칠공부에서 칸을 하나씩 채울 때 쓴다). 🔴 풀은 이름별로 공유하므로 **매번 되돌려 놓는다** —
 * 안 그러면 한 번 올린 음높이가 그 뒤 모든 호출부에 남는다.
 */
export function playUi(name: UiSoundName, rate = 1): void {
  if (muted || typeof window === 'undefined') return;
  const pool = ensurePool(name);
  const i = cursor.get(name) ?? 0;
  cursor.set(name, (i + 1) % pool.length);
  const a = pool[i];
  try {
    a.currentTime = 0;
    a.playbackRate = rate;
    void a.play().catch(() => {});
  } catch {
    /* ignore */
  }
}

// ── 도레미파솔라시도 ─────────────────────────────────────────────────────────
//
// 🔴 **한 걸음마다 다음 음**이 필요할 때 쓴다(색칠공부에서 칸을 채울 때). mp3 를 배속으로 올려
//    쓰려다 실패했다 — 배속을 올리면 음만 오르는 게 아니라 **길이가 짧아진다**. 0.2초짜리
//    `select` 를 1.5배로 내니 0.13초가 됐고, 그림의 30%가 칠해지는데 소리는 딸깍하고 마니
//    "나오다 만다"는 소리를 들었다(사용자 지적). 음정은 음정으로 올려야 한다.
//
// 파일 8개를 굽지 않고 그 자리에서 합성한다 — 음정이 정확하고, 길이를 마음대로 잡을 수 있고,
// 자산이 늘지 않는다. (`tap` 이 합성본인 것과 같은 선례.)

/** 장음계 반음 간격 — 도 레 미 파 솔 라 시 도. */
const NOTE_SEMITONES = [0, 2, 4, 5, 7, 9, 11, 12];
const BASE_HZ = 523.25; // C5 = 도. 유아 화면이라 밝은 옥타브.

let noteCtx: AudioContext | null = null;

function ensureNoteCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!noteCtx) noteCtx = new Ctor();
  // 자동재생 정책상 사용자 제스처 전에는 suspended 다 — 탭에서 부르므로 여기서 깨우면 된다.
  if (noteCtx.state === 'suspended') void noteCtx.resume().catch(() => {});
  return noteCtx;
}

/**
 * 음계의 `step` 번째 음(0=도 … 7=높은 도). 범위를 벗어나면 양끝으로 물린다.
 *
 * 사인파 3개(기본음 + 2·3배음)를 지수 감쇠로 덮어 마림바 비슷한 소리를 낸다 — 사인 하나면
 * 너무 맹하고, 사각파는 유아 화면에 날카롭다.
 */
export function playNote(step: number, durationSec = 0.5): void {
  if (muted) return;
  const ctx = ensureNoteCtx();
  if (!ctx) return;
  const i = Math.max(0, Math.min(NOTE_SEMITONES.length - 1, Math.round(step)));
  const hz = BASE_HZ * Math.pow(2, NOTE_SEMITONES[i] / 12);
  const t = ctx.currentTime;

  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(0.3, t + 0.008); // 또렷한 어택
  env.gain.exponentialRampToValueAtTime(0.0001, t + durationSec);
  env.connect(ctx.destination);

  for (const [mult, level] of [
    [1, 1],
    [2, 0.28],
    [3, 0.1],
  ] as const) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = hz * mult;
    const g = ctx.createGain();
    g.gain.value = level;
    osc.connect(g).connect(env);
    osc.start(t);
    osc.stop(t + durationSec + 0.05);
  }
}

// 그리기/색칠 중 "글쓰는 소리" — 그리는 동안 draw.mp3 를 루프 재생하고, 손을 떼거나 멈추면
// (마지막 feed 후 ~220ms) 자동 정지. pointerdown/move 에서 feedDrawLoop() 만 호출하면 됨
// (pointerup 배선 불필요 — keepalive 타이머가 정지 담당).
let drawLoop: HTMLAudioElement | null = null;
let drawLoopTimer: ReturnType<typeof setTimeout> | null = null;

function ensureDrawLoop(): HTMLAudioElement {
  if (!drawLoop) {
    drawLoop = new Audio(url('draw'));
    drawLoop.loop = true;
    drawLoop.volume = 0.5; // 은은하게
    drawLoop.preload = 'auto';
  }
  return drawLoop;
}

/** 그리는 중 매 stroke(pointerdown/move)에서 호출 — 루프 시작/유지. 멈추면 자동 정지. */
export function feedDrawLoop(): void {
  if (muted || typeof window === 'undefined') return;
  const a = ensureDrawLoop();
  if (a.paused) void a.play().catch(() => {});
  if (drawLoopTimer) clearTimeout(drawLoopTimer);
  drawLoopTimer = setTimeout(stopDrawLoop, 220);
}

/** 즉시 정지 (손 뗌/언마운트/음소거). */
export function stopDrawLoop(): void {
  if (drawLoopTimer) {
    clearTimeout(drawLoopTimer);
    drawLoopTimer = null;
  }
  if (drawLoop && !drawLoop.paused) {
    drawLoop.pause();
    drawLoop.currentTime = 0;
  }
}
