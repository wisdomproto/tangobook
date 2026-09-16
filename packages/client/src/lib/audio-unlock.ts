/**
 * iOS Safari 오디오 해금 — 🔴 **재생 권한은 페이지가 아니라 「그 요소」에 붙는다**(2026-09-16).
 *
 * 데스크톱·안드로이드 크롬은 사용자가 페이지를 한 번 만지면 그 뒤로는 어떤 `Audio` 로든 소리가
 * 난다. iOS Safari 는 **탭 핸들러 안에서 `play()` 가 불린 그 요소만** 풀어 준다. 그래서 소리마다
 * `new Audio()` 를 만들면 그 요소는 한 번도 풀린 적이 없고, 우리 재생 호출은 대부분 `useEffect`
 * ·`await` 뒤(= 제스처 밖)라 iOS 가 전부 거절한다 — `play().catch()` 가 삼켜서 에러도 안 보인다.
 * (아이패드에서 한글 블록 파닉스 음원이 안 나다가, 다음 탭이 시작될 때 React 가 밀린 effect 를
 *  동기로 흘리면서 **우연히** 제스처 안에서 불릴 때만 나던 증상.)
 *
 * → 소리 내는 요소는 **오래 두고 재사용**하고, 여기 등록해 두면 첫 탭에 무음으로 한 번 열어 준다.
 *
 * 🔴 리스너는 계속 달아 둔다(한 번 쓰고 떼지 않는다) — 게임이 뒤늦게 마운트하며 만든 요소는
 *    그 순간이 제스처 밖이라, 「이미 해금된 페이지」여도 **그 요소만** 잠겨 있다. 다음 탭에 연다.
 */

// 44.1kHz 무음 wav 한 프레임. 요소를 열기만 하면 되므로 길이는 상관없다.
const SILENT_WAV =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';

const waiting = new Set<HTMLAudioElement>();
let listening = false;

function prime(el: HTMLAudioElement): void {
  // 이미 소리를 내는 중이면 그 요소는 이미 풀린 것이다 — 건드리면 나던 소리를 끊는다.
  if (!el.paused) return;
  const volume = el.volume;
  try {
    if (!el.src) el.src = SILENT_WAV;
    el.volume = 0;
    void el
      .play()
      .then(() => el.pause())
      .catch(() => {})
      .finally(() => {
        el.volume = volume;
      });
  } catch {
    el.volume = volume;
  }
}

function primeAll(): void {
  for (const el of waiting) prime(el);
  waiting.clear();
}

function listen(): void {
  if (listening || typeof window === 'undefined') return;
  listening = true;
  // capture — 도중에 stopPropagation 하는 핸들러가 있어도 제스처를 놓치지 않는다.
  const opts = { capture: true } as const;
  window.addEventListener('pointerdown', primeAll, opts);
  window.addEventListener('touchend', primeAll, opts);
  window.addEventListener('click', primeAll, opts);
}

/** 오래 두고 쓸 오디오 요소를 해금 대상으로 등록. 언마운트하면 `unregisterAudio` 로 뺀다. */
export function registerAudio(el: HTMLAudioElement): void {
  waiting.add(el);
  listen();
}

export function unregisterAudio(el: HTMLAudioElement): void {
  waiting.delete(el);
}

/**
 * 말소리(TTS·파닉스 음원) 공용 재생 요소 — **앱 시작 때 만들어 첫 탭에 해금된다**.
 * 🔴 게임 화면에 들어가서 만들면 늦다: 게임으로 들어온 그 탭은 이미 지나갔고, 첫 안내 음성이
 *    바로 마운트에서 나가므로 그 소리를 놓친다.
 */
let sharedAudio: HTMLAudioElement | null = null;

export function getSharedAudio(): HTMLAudioElement {
  if (!sharedAudio) {
    sharedAudio = new Audio();
    sharedAudio.preload = 'auto';
    registerAudio(sharedAudio);
  }
  return sharedAudio;
}

if (typeof window !== 'undefined') {
  listen();
  getSharedAudio();
}
