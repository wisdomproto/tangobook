import type { Storybook, HiddenObjectData, HiddenObjectTarget } from '@tangobook/shared';

/**
 * 동화책 → 숨은그림 찾기 데이터.
 *
 * 🔴 **씬의 정본은 `styleAssets[style].hiddenObjectScenes`** 다. top-level 은 활성 그림체 거울일
 *    뿐이라, 아이가 고른 그림체가 활성이 아니면 거기엔 없다 — 그림체를 먼저 보고 없을 때만 내려간다.
 * 🔴 라벨·낱말 카드·음원은 **`hotspot.objectName` 으로 `key_objects` 를 찾아** 붙인다. 서버
 *    `buildHiddenObjectData` 와 같은 규칙이다(한쪽만 고치면 editor2 와 아이 화면이 달라진다).
 */
export function buildHiddenObjectSceneData(
  book: Storybook | undefined,
  style?: string
): HiddenObjectData | null {
  if (!book) return null;
  const fromStyle = style ? book.styleAssets?.[style]?.hiddenObjectScenes : undefined;
  const scenes = fromStyle?.length ? fromStyle : book.hiddenObjectScenes;
  if (!scenes?.length) return null;

  const keyObjects = book.key_objects ?? [];
  const images = book.keyObjectImages ?? [];
  const labelOf = (name: string): string => {
    const ko = keyObjects.find((k) => k.name === name);
    return ko?.korean || ko?.name || name;
  };
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
    // 🔴 찾을 게 하나뿐인 씬은 게임이 아니다 — 한 번 누르면 끝난다.
    .filter((s) => s.sceneImageUrl && s.targets.length >= 2);

  if (!built.length) return null;
  // 한 판에 한 장. 여러 장이면 그때그때 다른 그림이 나오는 게 더 재미있다.
  const pick = built[Math.floor(Math.random() * built.length)];
  return { type: 'hidden-object', scenes: [pick] };
}
