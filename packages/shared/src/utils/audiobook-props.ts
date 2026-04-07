import type { Storybook, AudiobookProject } from '../types/storybook';

export type AudiobookSlideData = {
  imageUrl: string;
  ttsUrl?: string;
  ttsDuration?: number;
  subtitleText?: string;
};

export type AudiobookRenderData = {
  slides: AudiobookSlideData[];
  aspectRatio: '16:9' | '9:16' | '1:1' | '3:4' | '4:3';
  cover?: { imageUrl: string; title: string; duration: number; showTitle?: boolean };
  bgmUrl?: string;
  bgmVolume?: number;
  bgmDuration?: number;
  subtitleStyle: {
    fontSize: number;
    color: string;
    backgroundColor: string;
    position: 'top' | 'center' | 'bottom';
    wordsPerGroup?: number;
  };
  enableParticles?: boolean;
  fps?: number;
};

const SUBTITLE_SIZE_MAP: Record<string, number> = {
  sm: 18,
  md: 24,
  lg: 32,
};

export function buildAudiobookRenderData(
  storybook: Storybook,
  project: AudiobookProject
): AudiobookRenderData {
  const lang = project.language || 'ko';
  const pages = (storybook.pages || []).slice(project.startPage - 1, project.endPage);

  // Page uses `illustrationUrl`, not `imageUrl`
  const validPages = pages.filter((p) => p.illustrationUrl);

  const slides: AudiobookSlideData[] = validPages.map((page) => {
    const isTranslation = lang !== 'ko' && page.translations?.[lang];
    const text = isTranslation ? page.translations![lang].text : page.text;
    const ttsUrl = isTranslation ? page.translations![lang].ttsUrl : page.ttsUrl;
    // Page/PageTranslation does not have ttsDuration.
    // Defaults to 3s in composition (DEFAULT_SLIDE_DURATION).

    return {
      imageUrl: page.illustrationUrl!,
      ttsUrl: project.includeTts !== false ? ttsUrl : undefined,
      ttsDuration: undefined,
      subtitleText: project.includeSubtitles !== false ? text : undefined,
    };
  });

  // Cover — Storybook uses `coverImage`, not `coverImageUrl`
  let cover: AudiobookRenderData['cover'] | undefined;
  if (project.includeCover !== false) {
    const coverImageUrl = project.coverImageUrl || storybook.coverImage;
    if (coverImageUrl) {
      cover = {
        imageUrl: coverImageUrl,
        title: storybook.title || '',
        duration: project.coverDuration || 3,
        showTitle: project.showCoverTitle !== false,
      };
    }
  }

  // BGM
  const bgmUrl =
    project.includeBgm !== false ? project.bgmUrl || storybook.backgroundMusicUrl : undefined;

  const validRatios = ['16:9', '9:16', '1:1', '3:4', '4:3'];
  const aspectRatio = (
    validRatios.includes(project.aspectRatio) ? project.aspectRatio : '16:9'
  ) as AudiobookRenderData['aspectRatio'];

  return {
    slides,
    aspectRatio,
    cover,
    bgmUrl,
    bgmVolume: project.bgmVolume ?? 30,
    subtitleStyle: {
      fontSize: SUBTITLE_SIZE_MAP[project.subtitleSize] ?? 24,
      color: project.subtitleColor || '#ffffff',
      backgroundColor: project.subtitleBg || '#00000080',
      position: project.subtitlePosition || 'bottom',
      wordsPerGroup: project.subtitleWordsPerGroup ?? 2,
    },
    enableParticles: project.enableParticles ?? true,
    fps: 30,
  };
}
