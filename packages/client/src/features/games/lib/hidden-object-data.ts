import type { Storybook, HiddenObjectData, HiddenObjectTarget } from '@tangobook/shared';
import { hiddenObjectLabelOf, playableHiddenWords } from '@tangobook/shared';

/**
 * 동화책 → 숨은그림 찾기 데이터.
 *
 * 한 책 = 한 그림체(2026-09-14) — 씬은 책의 `hiddenObjectScenes` 하나다.
 * 🔴 라벨·낱말 카드·음원은 **`hotspot.objectName` 으로 `key_objects` 를 찾아** 붙인다. 서버
 *    `buildHiddenObjectData` 와 같은 규칙이다(한쪽만 고치면 editor2 와 아이 화면이 달라진다).
 */
export function buildHiddenObjectSceneData(
  book: Storybook | undefined,
  _style?: string,
  /** 주면 `hobj_<sceneKey>` 씬만(활동 모음 한 장 페이지). 없으면 무작위 한 장. */
  sceneKey?: string
): HiddenObjectData | null {
  if (!book) return null;
  const all = book.hiddenObjectScenes;
  if (!all?.length) return null;
  const scenes = sceneKey ? all.filter((s) => s.id === `hobj_${sceneKey}`) : all;

  const keyObjects = book.key_objects ?? [];
  const images = book.keyObjectImages ?? [];
  const labelOf = (name: string): string => hiddenObjectLabelOf(keyObjects, name);
  const thumbOf = (name: string): string | undefined =>
    images.find((i) => i.objectName === name && i.success)?.imageUrl;
  const ttsOf = (name: string): string | undefined =>
    keyObjects.find((k) => k.name === name)?.ttsUrl;

  const built = scenes
    .map((scene) => ({
      sceneImageUrl: scene.sceneImageUrl,
      targets: scene.hotspots.map(
        (h): HiddenObjectTarget => ({
          objectName: h.objectName,
          label: labelOf(h.objectName),
          thumbnailUrl: thumbOf(h.objectName),
          ttsUrl: ttsOf(h.objectName),
          x: h.x,
          y: h.y,
          w: h.w,
          h: h.h,
          layer: h.layer,
        })
      ),
    }))
    // 🔴 찾을 게 하나뿐인 씬은 게임이 아니다 — **이름 중복을 뺀** 개수로 센다(날개 박스 둘 = 한 낱말).
    .filter((s, i) => s.sceneImageUrl && playableHiddenWords(scenes[i]).length >= 2);

  if (!built.length) return null;
  // 한 판에 한 장. 여러 장이면 그때그때 다른 그림이 나오는 게 더 재미있다.
  const pick = built[Math.floor(Math.random() * built.length)];
  return { type: 'hidden-object', scenes: [pick] };
}
