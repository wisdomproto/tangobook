import type { Storybook } from '@tangobook/shared';

export interface AvailableImage {
  label: string;
  url: string;
}

/**
 * 동화책에서 사용 가능한 모든 이미지를 수집합니다.
 * (표지, 페이지 삽화, 캐릭터, 파닉스 플래시카드, 핵심단어)
 */
export function buildAvailableImages(storybook: Storybook): AvailableImage[] {
  const images: AvailableImage[] = [];

  if (storybook.coverImage) {
    images.push({ label: '표지', url: storybook.coverImage });
  }

  for (const p of storybook.pages ?? []) {
    if (p.illustrationUrl) {
      images.push({
        label: `페이지 ${(storybook.pages?.indexOf(p) ?? 0) + 1}`,
        url: p.illustrationUrl,
      });
    }
  }

  for (const c of storybook.characters ?? []) {
    if (c.referenceImage) {
      images.push({ label: `캐릭터: ${c.name}`, url: c.referenceImage });
    }
  }

  if (storybook.type === 'phonics') {
    for (const fc of storybook.flashcards ?? []) {
      if (fc.imageUrl) images.push({ label: fc.word, url: fc.imageUrl });
    }
  } else {
    const koImages = storybook.keyObjectImages ?? [];
    for (const ko of storybook.key_objects ?? []) {
      const img = koImages.find((ki) => ki.objectName === ko.name);
      if (img?.imageUrl) images.push({ label: ko.name, url: img.imageUrl });
    }
  }

  return images;
}
