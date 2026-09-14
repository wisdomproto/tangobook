import type { HiddenObjectScene, KeyObject } from '../types/storybook.js';

/**
 * 숨은그림 낱말 라벨 — `key_objects` 에서 이름으로 찾아 `korean` → `name` → objectName.
 * 🔴 클라 게임 빌더와 활동 목록 굽기 스크립트가 **같은 함수**를 쓴다(따로 적으면 체크리스트와 게임이 갈라진다).
 */
export function hiddenObjectLabelOf(
  keyObjects: Pick<KeyObject, 'name' | 'korean'>[] | undefined,
  objectName: string
): string {
  const ko = (keyObjects ?? []).find((k) => k.name === objectName);
  return ko?.korean || ko?.name || objectName;
}

/**
 * 그 씬에서 찾을 낱말 — **이름 중복을 뺀** 목록(날개처럼 박스가 둘이어도 한 낱말).
 * 「2개 이상이어야 게임」 판정은 이 길이로 한다.
 */
export function playableHiddenWords(scene: Pick<HiddenObjectScene, 'hotspots'>): string[] {
  return [...new Set(scene.hotspots.map((h) => h.objectName))];
}
