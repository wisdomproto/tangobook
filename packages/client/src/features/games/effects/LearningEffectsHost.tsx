import { useLayoutEffect, useRef } from 'react';
import { playUi } from '@/lib/uiSound';
import {
  clearLearningEffects,
  emitLearningEffect,
  reducedEffects,
  rememberLearningTarget,
  subscribeLearningEffects,
  type LearningEffect,
} from './learning-effects';

type Engine = Awaited<
  ReturnType<typeof import('./learning-effects-engine').createLearningEffectsEngine>
>;

/** 앱당 하나의 투명 렌더러. 학습 대상만 반응시키며 입력 이벤트는 차단하지 않는다. */
export function LearningEffectsHost() {
  const root = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    let engine: Engine | undefined;
    let loading: Promise<void> | undefined;
    let disposed = false;
    let failed = false;
    let queueExpiry: ReturnType<typeof setTimeout> | undefined;
    let queue: LearningEffect[] = [];
    let pointer: { id: number; target: HTMLElement; time: number } | undefined;
    const start = () => {
      if (engine || loading || failed || reducedEffects() || !root.current) return;
      const parent = root.current;
      loading = import('./learning-effects-engine')
        .then((module) => (disposed ? undefined : module.createLearningEffectsEngine(parent)))
        .then((renderer) => {
          if (!renderer) return;
          if (disposed) {
            renderer.destroy();
            return;
          }
          engine = renderer;
          if (reducedEffects()) {
            queue = [];
            renderer.clear();
            return;
          }
          queue.forEach((effect) => renderer.play(effect));
          queue = [];
        })
        .catch((error: unknown) => {
          if (disposed) return;
          if (import.meta.env.DEV) console.warn('Learning effects unavailable', error);
          parent.dataset.effectsState = 'unavailable';
          failed = true;
          queue = [];
          parent.replaceChildren();
        });
    };
    const unsubscribe = subscribeLearningEffects((message) => {
      if (message === 'clear') {
        clearTimeout(queueExpiry);
        queue = [];
        pointer = undefined;
        engine?.clear();
        return;
      }
      if (message === 'prepare') {
        start();
        return;
      }
      if (engine) engine.play(message);
      else {
        // 콜드 로딩 뒤 오래된 클릭/쓰기 궤적이 뒤늦게 재생되지 않도록 마지막 반응만 보관.
        queue = [message];
        clearTimeout(queueExpiry);
        start();
        queueExpiry = setTimeout(() => {
          queue = [];
        }, 500);
      }
    });
    const down = (event: PointerEvent) => {
      if (!(event.target instanceof Element)) return;
      const target = event.target.closest<HTMLElement>('[data-learning-fx]');
      if (!target || target.matches(':disabled, [aria-disabled="true"]')) return;
      rememberLearningTarget(target);
      pointer = { id: event.pointerId, target, time: 0 };
      if (target.dataset.learningFx !== 'trace')
        emitLearningEffect(target.dataset.learningFx === 'listen' ? 'listen' : 'tap', target);
    };
    const move = (event: PointerEvent) => {
      if (
        !pointer ||
        pointer.id !== event.pointerId ||
        pointer.target.dataset.learningFx !== 'trace' ||
        event.buttons === 0
      )
        return;
      if (performance.now() - pointer.time < 45) return;
      pointer.time = performance.now();
      emitLearningEffect('trace', pointer.target, { x: event.clientX, y: event.clientY });
    };
    const up = () => {
      pointer = undefined;
    };
    const resize = () => {
      queue = [];
      engine?.resize();
    };
    const visibility = () => {
      if (document.hidden) clearLearningEffects();
    };
    const preference = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const motionChange = () => {
      if (preference?.matches) clearLearningEffects();
    };
    const keyboard = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const target = document.activeElement;
      if (
        target instanceof HTMLElement &&
        ['tap', 'listen'].includes(target.dataset.learningFx ?? '') &&
        !target.matches(':disabled, [aria-disabled="true"]')
      ) {
        if (event.repeat) return;
        rememberLearningTarget(target);
        emitLearningEffect(target.dataset.learningFx === 'listen' ? 'listen' : 'tap', target);
        if (target.dataset.sound !== 'none') playUi('learning-tap');
      }
    };
    document.addEventListener('pointerdown', down, true);
    document.addEventListener('pointermove', move, true);
    document.addEventListener('pointerup', up, true);
    document.addEventListener('pointercancel', up, true);
    document.addEventListener('keydown', keyboard, true);
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('resize', resize);
    preference?.addEventListener('change', motionChange);
    return () => {
      disposed = true;
      clearTimeout(queueExpiry);
      queue = [];
      unsubscribe();
      engine?.destroy();
      document.removeEventListener('pointerdown', down, true);
      document.removeEventListener('pointermove', move, true);
      document.removeEventListener('pointerup', up, true);
      document.removeEventListener('pointercancel', up, true);
      document.removeEventListener('keydown', keyboard, true);
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('resize', resize);
      preference?.removeEventListener('change', motionChange);
    };
  }, []);
  return <div ref={root} className="learning-effects-layer" aria-hidden="true" />;
}
