import type { Storybook, YouTubeUploadResult } from '@tangobook/shared';

export type LangCode = 'ko' | 'en' | (string & {});

export function hasVideoUrl(storybook: Storybook): boolean {
  const audio = storybook.audiobookProjects?.some((p) => !!p.youtubeUpload?.videoId);
  const lf = storybook.longformProjects?.some((p) => !!p.youtubeUpload?.videoId);
  return !!(audio || lf);
}

export function getPrimaryVideoId(storybook: Storybook): string | null {
  const all: YouTubeUploadResult[] = [
    ...(storybook.audiobookProjects ?? []).flatMap((p) =>
      p.youtubeUpload ? [p.youtubeUpload] : []
    ),
    ...(storybook.longformProjects ?? []).flatMap((p) =>
      p.youtubeUpload ? [p.youtubeUpload] : []
    ),
  ];
  if (all.length === 0) return null;
  all.sort((a, b) => (b.uploadedAt ?? '').localeCompare(a.uploadedAt ?? ''));
  return all[0].videoId ?? null;
}

export function getAvailableLanguages(storybook: Storybook): LangCode[] {
  const pages = storybook.pages ?? [];
  if (pages.length === 0) return [];
  const result: LangCode[] = ['ko'];
  const extraSet = new Set<string>();
  for (const p of pages) {
    if (p.translations) for (const key of Object.keys(p.translations)) extraSet.add(key);
  }
  for (const k of extraSet) if (!result.includes(k as LangCode)) result.push(k as LangCode);
  return result;
}

export function hasGames(storybook: Storybook): boolean {
  return (storybook.games?.length ?? 0) > 0;
}

/**
 * 책에 등록된 모든 YouTube videoId 수집 (audiobook + longform).
 * BookDetailPage 의 영상 카드 노출 / videoId 선택에 사용.
 */
export function getYoutubeVideoIds(storybook: Storybook): string[] {
  const ids: string[] = [];
  storybook.audiobookProjects?.forEach(
    (p) => p.youtubeUpload?.videoId && ids.push(p.youtubeUpload.videoId)
  );
  storybook.longformProjects?.forEach(
    (p) => p.youtubeUpload?.videoId && ids.push(p.youtubeUpload.videoId)
  );
  return ids;
}

/**
 * YouTube 업로드 안 된 책의 직접 video URL (R2 archive).
 * YouTube 업로드 후엔 outputUrl 이 자동 삭제되므로 보통 빈 배열.
 */
export function getDirectVideoUrls(storybook: Storybook): string[] {
  const urls: string[] = [];
  storybook.audiobookProjects?.forEach((p) => p.outputUrl && urls.push(p.outputUrl));
  storybook.longformProjects?.forEach((p) => p.outputUrl && urls.push(p.outputUrl));
  return urls;
}

/**
 * 책이 지원하는 그림체 prompt 배열. availableStyles 가 비어있으면 [artStyle] 로 fallback.
 */
export function getAvailableStyles(storybook: Storybook): string[] {
  if (storybook.availableStyles && storybook.availableStyles.length > 0) {
    return storybook.availableStyles;
  }
  return storybook.artStyle ? [storybook.artStyle] : [];
}
