import type { LongformScene } from '@tangobook/shared';

export function getEffectiveDuration(scene: LongformScene): number {
  return scene.clipDuration - (scene.trimStart ?? 0) - (scene.trimEnd ?? 0);
}

export function getSceneStartTime(scenes: LongformScene[], index: number): number {
  let t = 0;
  for (let i = 0; i < index; i++) {
    t += getEffectiveDuration(scenes[i]);
  }
  return t;
}
