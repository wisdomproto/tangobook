import { useState } from 'react';
import { ImageLightbox } from '@/components/ImageLightbox';
import { getOtherStyleAssets } from '@/features/editor/lib/style-assets';
import type { Storybook } from '@tangobook/shared';

/**
 * 활성 그림체 외 다른 그림체들의 자산을 슬롯별로 작은 썸네일로 표시.
 * 새 그림체로 작업할 때 기존 그림체의 같은 슬롯 이미지를 참고용으로 옆에 둠.
 *
 * 슬롯 종류:
 *  - 'cover'        : 표지 (각 그림체의 coverImage 또는 coverImages[0])
 *  - 'character'    : 특정 캐릭터 (characterImages[index].referenceImage)
 *  - 'page'         : 특정 페이지 (pageIllustrations[pageNumber].illustrationUrl)
 *  - 'keyObject'    : 특정 핵심사물 (keyObjectImages.find(o => o.objectName === name)?.imageUrl)
 *
 * styleAssets 에 다른 그림체 자산이 없으면 (= availableStyles 1개 이거나 첫 추가 전) 아무것도 안 그림.
 */
type SlotSpec =
  | { kind: 'cover' }
  | { kind: 'character'; characterIndex: number }
  | { kind: 'page'; pageNumber: number }
  | { kind: 'keyObject'; objectName: string };

interface OtherStyleReferenceProps {
  storybook: Storybook;
  slot: SlotSpec;
  /** 라벨 — 헤더에 보임. 예: "다른 그림체 표지", "다른 그림체 캐릭터" */
  label?: string;
  /** thumb 한 변 길이 (px). 기본 96. */
  thumbSize?: number;
}

export function OtherStyleReference({
  storybook,
  slot,
  label = '🎨 다른 그림체 참고',
  thumbSize = 96,
}: OtherStyleReferenceProps) {
  const others = getOtherStyleAssets(storybook);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // 각 다른 그림체에서 슬롯에 맞는 이미지 URL 추출
  const items = others
    .map(({ style, label: styleLabel, assets }) => {
      let url: string | undefined;
      switch (slot.kind) {
        case 'cover':
          url = assets.coverImage ?? assets.coverImages?.[0]?.imageUrl;
          break;
        case 'character':
          url = assets.characterImages?.[slot.characterIndex]?.referenceImage;
          break;
        case 'page':
          url = assets.pageIllustrations?.[slot.pageNumber]?.illustrationUrl;
          break;
        case 'keyObject': {
          const found = assets.keyObjectImages?.find((o) => o.objectName === slot.objectName);
          url = found?.imageUrl;
          break;
        }
      }
      return { style, styleLabel, url };
    })
    .filter((x): x is { style: string; styleLabel: string; url: string } => !!x.url);

  if (items.length === 0) return null;

  return (
    <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-900/10 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-amber-700 dark:text-amber-300">{label}</span>
        <span className="text-[10px] text-amber-600/70 dark:text-amber-400/70">
          시각 참조용 — 새 그림체 만들 때 이걸 보고 작업
        </span>
      </div>
      <div className="flex gap-2 flex-wrap">
        {items.map(({ style, styleLabel, url }) => (
          <button
            key={style}
            type="button"
            onClick={() => setLightboxUrl(url)}
            className="group relative rounded-md overflow-hidden border border-amber-200 dark:border-amber-700 hover:border-amber-400 transition-colors bg-white dark:bg-slate-800"
            style={{ width: thumbSize, height: thumbSize + 16 }}
            title={`${styleLabel} 그림체 (${style}) — 클릭해서 크게 보기`}
          >
            <img
              src={url}
              alt={styleLabel}
              loading="lazy"
              className="w-full object-cover"
              style={{ height: thumbSize }}
            />
            <div className="text-[10px] font-bold text-amber-700 dark:text-amber-300 px-1 py-0.5 bg-white/90 dark:bg-slate-800/90 truncate">
              🎨 {styleLabel}
            </div>
          </button>
        ))}
      </div>
      {lightboxUrl && <ImageLightbox src={lightboxUrl} onClose={() => setLightboxUrl(null)} />}
    </div>
  );
}
