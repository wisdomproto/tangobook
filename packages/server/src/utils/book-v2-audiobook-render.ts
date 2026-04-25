// v2 manifest+text+style → AudiobookRenderData 빌더.
// v1 buildAudiobookRenderData의 v2 변형 — 페이지 이미지·TTS는 R2 prefix 트리에서 머지.

import type {
  BookManifest,
  BookTextSlice,
  BookStyleSlice,
  AudiobookProjectV2,
  ReadingLevel,
  AudiobookRenderData,
} from '@tangobook/shared';
import { audioFileKey } from './book-v2-keys.js';
import { listR2Objects, r2PublicUrl } from '../providers/r2.provider.js';

export interface BuildV2RenderOpts {
  manifest: BookManifest;
  textSlice: BookTextSlice;
  styleSlice: BookStyleSlice;
  project: AudiobookProjectV2;
  level: ReadingLevel;
  language: string;
}

const VALID_RATIOS: AudiobookRenderData['aspectRatio'][] = ['16:9', '9:16', '1:1', '3:4', '4:3'];

export async function buildAudiobookRenderDataV2(
  opts: BuildV2RenderOpts
): Promise<AudiobookRenderData> {
  const { manifest, textSlice, styleSlice, project, level, language } = opts;

  // 존재하는 audio 파일만 ttsUrl 셋팅 (없는 페이지는 default 3s 슬라이드)
  const audioObjs = await listR2Objects(`books/${manifest.id}/audio/${level}.${language}/`);
  const existingAudioPages = new Set<number>();
  for (const o of audioObjs) {
    if (!o.Key) continue;
    const m = o.Key.match(/page-(\d+)\.mp3$/);
    if (m) existingAudioPages.add(parseInt(m[1], 10));
  }

  const slides: AudiobookRenderData['slides'] = [];
  const pageImagesAtLevel = styleSlice.pageImages[level] ?? {};
  for (const page of textSlice.pages) {
    const imageUrl = pageImagesAtLevel[page.illustrationKey];
    if (!imageUrl) continue; // 이미지 없는 페이지는 스킵

    const ttsUrl = existingAudioPages.has(page.pageNumber)
      ? `${r2PublicUrl}/${audioFileKey(manifest.id, level, language, page.pageNumber)}`
      : undefined;

    slides.push({
      imageUrl,
      ttsUrl,
      ttsDuration: undefined,
      subtitleText: page.text,
    });
  }

  const cover: AudiobookRenderData['cover'] | undefined = styleSlice.coverImageUrl
    ? {
        imageUrl: styleSlice.coverImageUrl,
        title: textSlice.title || manifest.title,
        duration: 3,
        showTitle: true,
      }
    : undefined;

  // BGM — project가 우선, 없으면 manifest.bgmUrl
  const bgmRaw = project.bgmSettings?.url || manifest.bgmUrl;
  const bgmUrl = bgmRaw && bgmRaw.length > 0 ? bgmRaw : undefined;
  const bgmVolume = Math.round((project.bgmSettings?.volume ?? 0.5) * 100);

  // Aspect ratio
  const arRaw = manifest.aspectRatios?.illustration ?? '16:9';
  const aspectRatio = (VALID_RATIOS as readonly string[]).includes(arRaw)
    ? (arRaw as AudiobookRenderData['aspectRatio'])
    : '16:9';

  // Subtitle (v2 → v1 mapping)
  const sub = project.subtitleSettings ?? {};
  const subPos = sub.position;
  const position: 'top' | 'center' | 'bottom' = subPos === 'top' ? 'top' : 'bottom';

  return {
    slides,
    aspectRatio,
    cover,
    bgmUrl,
    bgmVolume,
    subtitleStyle: {
      fontSize: typeof sub.fontSize === 'number' ? sub.fontSize : 28,
      color: typeof sub.color === 'string' ? sub.color : '#ffffff',
      backgroundColor: '#00000080',
      position,
      wordsPerGroup: 2,
    },
    enableParticles: true,
    fps: 30,
  };
}
