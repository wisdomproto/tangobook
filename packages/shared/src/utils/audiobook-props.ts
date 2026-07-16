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
        showTitle: project.showCoverTitle !== false && project.includeSubtitles !== false,
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

export function buildStyledAudiobookRenderData(
  storybook: Storybook,
  opts: { artStyle: string; language: string }
): AudiobookRenderData {
  const { artStyle, language: lang } = opts;
  const styleAsset = (storybook.styleAssets ?? {})[artStyle] as
    | {
        pageIllustrations?: Record<string, { illustrationUrl?: string }>;
        primaryCoverByLang?: Record<string, string>;
        coverImage?: string;
      }
    | undefined;
  const pageIllos = styleAsset?.pageIllustrations ?? {};

  const slides: AudiobookSlideData[] = (storybook.pages ?? [])
    .map((page): AudiobookSlideData | null => {
      const styled = pageIllos[String(page.pageNumber)]?.illustrationUrl;
      if (!styled) return null; // 그 그림체에 이미지 없는 페이지 스킵
      const isTranslation = lang !== 'ko' && page.translations?.[lang];
      const text = isTranslation ? page.translations![lang].text : page.text;
      const ttsUrl = isTranslation ? page.translations![lang].ttsUrl : page.ttsUrl;

      return {
        imageUrl: styled,
        ttsUrl,
        ttsDuration: undefined,
        subtitleText: text,
      };
    })
    .filter((s): s is AudiobookSlideData => s !== null);

  const coverImageUrl =
    styleAsset?.primaryCoverByLang?.[lang] || styleAsset?.coverImage || storybook.coverImage;
  const cover = coverImageUrl
    ? { imageUrl: coverImageUrl, title: storybook.title || '', duration: 3, showTitle: true }
    : undefined;

  return {
    slides,
    aspectRatio: '16:9',
    cover,
    bgmUrl: storybook.backgroundMusicUrl,
    bgmVolume: 30,
    subtitleStyle: {
      fontSize: 24,
      color: '#ffffff',
      backgroundColor: '#00000080',
      position: 'bottom',
      wordsPerGroup: 2,
    },
    enableParticles: true,
    fps: 30,
  };
}

/**
 * 실사(자연관찰) 책용 렌더 데이터. 그림체(styleAssets.pageIllustrations)가 없고 이미지가
 * base `pages[].illustrationUrl` 에 있는 책 — buildStyledAudiobookRenderData 는 0슬라이드가 된다.
 * 이미지는 실사 단일본이라 언어와 무관하게 동일하고, 텍스트/TTS 만 translations[lang] 로 바뀐다.
 * (buildStyledAudiobookRenderData 의 base-이미지 버전 — 롱폼 배치 렌더가 style 유무로 분기한다.)
 */
export function buildBaseAudiobookRenderData(
  storybook: Storybook,
  opts: { language: string }
): AudiobookRenderData {
  const { language: lang } = opts;

  const slides: AudiobookSlideData[] = (storybook.pages ?? [])
    .map((page): AudiobookSlideData | null => {
      if (!page.illustrationUrl) return null; // 삽화 없는 페이지 스킵
      const isTranslation = lang !== 'ko' && page.translations?.[lang];
      const text = isTranslation ? page.translations![lang].text : page.text;
      const ttsUrl = isTranslation ? page.translations![lang].ttsUrl : page.ttsUrl;

      return {
        imageUrl: page.illustrationUrl,
        ttsUrl,
        ttsDuration: undefined,
        subtitleText: text,
      };
    })
    .filter((s): s is AudiobookSlideData => s !== null);

  const coverImageUrl = storybook.primaryCoverByLang?.[lang] || storybook.coverImage;
  const cover = coverImageUrl
    ? { imageUrl: coverImageUrl, title: storybook.title || '', duration: 3, showTitle: true }
    : undefined;

  return {
    slides,
    aspectRatio: '16:9',
    cover,
    bgmUrl: storybook.backgroundMusicUrl,
    bgmVolume: 30,
    subtitleStyle: {
      fontSize: 24,
      color: '#ffffff',
      backgroundColor: '#00000080',
      position: 'bottom',
      wordsPerGroup: 2,
    },
    enableParticles: true,
    fps: 30,
  };
}
