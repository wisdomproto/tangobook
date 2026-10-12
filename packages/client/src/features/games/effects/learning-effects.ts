export const LEARNING_EFFECTS = [
  { kind: 'tap', label: '말랑 터치' },
  { kind: 'trace', label: '연필 자국' },
  { kind: 'listen', label: '소리 파동' },
  { kind: 'reveal', label: '글자 발견' },
  { kind: 'letter', label: '글자 완성' },
  { kind: 'blend', label: '자모 합성' },
  { kind: 'word', label: '단어 완성' },
  { kind: 'match', label: '짝 찾기' },
  { kind: 'correct', label: '정답 춤' },
  { kind: 'streak', label: '연속 성공' },
  { kind: 'retry', label: '다시 해봐요' },
  { kind: 'complete', label: '배움 완성' },
] as const;
export type LearningEffectKind = (typeof LEARNING_EFFECTS)[number]['kind'];
export interface EffectRect {
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface LearningEffect {
  kind: LearningEffectKind;
  x: number;
  y: number;
  size: number;
  variant?: number;
  bounds: EffectRect;
}
export type EffectMessage = LearningEffect | 'prepare' | 'clear';
const listeners = new Set<(message: EffectMessage) => void>();
let lastTarget: HTMLElement | null = null;
let lastCorrectAt = -Infinity;
let lastCorrectTarget: HTMLElement | null = null;
let correctVariant = 0;
let animatedTarget: HTMLElement | null = null;

export function subscribeLearningEffects(listener: (message: EffectMessage) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export function reducedEffects() {
  return (
    typeof window !== 'undefined' &&
    !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
}
export function prepareLearningEffects() {
  if (!reducedEffects()) listeners.forEach((listener) => listener('prepare'));
}
export function clearLearningEffects() {
  (animatedTarget?.getAnimations?.() ?? [])
    .filter((animation) => animation.id === 'learning-response')
    .forEach((animation) => animation.cancel());
  lastTarget = null;
  animatedTarget = null;
  lastCorrectAt = -Infinity;
  correctVariant = 0;
  lastCorrectTarget = null;
  listeners.forEach((listener) => listener('clear'));
}
export function rememberLearningTarget(target: HTMLElement) {
  lastTarget = target;
}

/** 화면 좌표로 반응시킨다. 입력·판정·음성·기록은 소유하지 않는다. */
export function emitLearningEffect(
  kind: LearningEffectKind,
  target?: HTMLElement | null,
  point?: { x: number; y: number },
  variant?: number
) {
  if (typeof document === 'undefined') return;
  const element = target ?? (lastTarget?.isConnected ? lastTarget : null);
  const scope =
    element?.closest<HTMLElement>('.learning-stage, [data-learning-effects]') ??
    document.querySelector<HTMLElement>('.learning-stage, [data-learning-effects]');
  // 축소 임베드는 글 밖으로 이펙트가 넘어가지 않도록 이 레이어를 사용하지 않는다.
  if (!scope || scope.dataset.effectsEmbedded === 'true') return;
  if (['correct', 'letter', 'word', 'match', 'blend', 'streak'].includes(kind)) {
    const now = performance.now();
    if (element === lastCorrectTarget && now - lastCorrectAt < 180) return;
    lastCorrectAt = now;
    lastCorrectTarget = element;
  }
  const rect = element?.getBoundingClientRect() ?? scope.getBoundingClientRect();
  if (
    kind !== 'trace' &&
    !reducedEffects() &&
    element &&
    typeof element.animate === 'function' &&
    element.tagName !== 'CANVAS'
  ) {
    const artwork = element.querySelector<HTMLElement>('.toy-hangul') ?? element;
    animatedTarget = artwork;
    (artwork.getAnimations?.() ?? [])
      .filter((animation) => animation.id === 'learning-response')
      .forEach((animation) => animation.cancel());
    const shake = kind === 'retry';
    const animation = artwork.animate(
      shake
        ? [
            { translate: '0 0' },
            { translate: '-5px 0' },
            { translate: '4px 0' },
            { translate: '0 0' },
          ]
        : [
            { scale: '1', translate: '0 0', rotate: '0deg' },
            { scale: '.88 1.02', translate: '0 2px', rotate: '-3deg', offset: 0.2 },
            { scale: '1.12 1.08', translate: '0 -5px', rotate: '3deg', offset: 0.55 },
            { scale: '1', translate: '0 0', rotate: '0deg' },
          ],
      { duration: shake ? 260 : kind === 'tap' ? 340 : 520, easing: 'cubic-bezier(.2,.8,.2,1)' }
    );
    animation.id = 'learning-response';
  }
  if (reducedEffects()) return;
  const scopeRect = scope.getBoundingClientRect();
  const bounds = {
    x: Math.max(0, scopeRect.left),
    y: Math.max(0, scopeRect.top),
    width: Math.min(innerWidth, scopeRect.right) - Math.max(0, scopeRect.left),
    height: Math.min(innerHeight, scopeRect.bottom) - Math.max(0, scopeRect.top),
  };
  if (bounds.width <= 0 || bounds.height <= 0) return;
  const x =
    point?.x ??
    (kind === 'complete' && !target ? bounds.x + bounds.width / 2 : rect.left + rect.width / 2);
  const y =
    point?.y ??
    (kind === 'complete' && !target ? bounds.y + bounds.height * 0.36 : rect.top + rect.height / 2);
  listeners.forEach((listener) =>
    listener({
      kind,
      variant: kind === 'correct' ? (variant ?? correctVariant++ % 3) : undefined,
      x,
      y,
      size: Math.min(
        220,
        Math.max(
          64,
          Math.min(element?.offsetWidth || rect.width, element?.offsetHeight || rect.height)
        )
      ),
      bounds,
    })
  );
}
