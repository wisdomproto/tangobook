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
