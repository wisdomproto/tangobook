import type { Page, Storybook } from '@tangobook/shared';
import { LANGUAGE_NAMES } from './srt-translator.js';

/** 비-ko 는 translations 텍스트 우선, 없으면 base text. */
export function getPageText(page: Page, lang: string): string {
  if (lang !== 'ko' && page.translations?.[lang]?.text) {
    return page.translations[lang].text;
  }
  return page.text;
}

/**
 * YouTube 업로드 메타(제목/설명/태그) 자동생성용 Gemini 프롬프트 조립 (순수).
 * audiobook 서비스와 롱폼 배치 파이프라인이 공유한다.
 * 언어명은 LANGUAGE_NAMES 로 해석(ko→Korean, en→English 는 기존과 동일, vi/zh/th 는 정확).
 */
export function buildYoutubeMetaPrompt(
  storybook: Storybook,
  opts: { language: string; aspectRatio: string; userPrompt: string }
): string {
  const { language: lang, aspectRatio, userPrompt } = opts;
  const pages = storybook.pages ?? [];
  const langName = LANGUAGE_NAMES[lang] ?? 'English';

  const storybookInfo = [
    `Title: ${storybook.title}`,
    storybook.category ? `Category: ${storybook.category}` : '',
    `Type: Audiobook (animated storybook video)`,
    `Content Language: ${lang}`,
    `Aspect Ratio: ${aspectRatio}`,
    `Pages: ${pages.length}`,
    pages.length > 0
      ? `Content Summary:\n${pages
          .slice(0, 10)
          .map((p) => `- p${p.pageNumber}: ${getPageText(p, lang).slice(0, 100)}`)
          .join('\n')}`
      : '',
  ]
    .filter(Boolean)
    .join('\n');

  return [
    userPrompt,
    '',
    '=== Storybook Info ===',
    storybookInfo,
    '',
    'Based on the above info and the user prompt, generate YouTube upload settings as JSON.',
    'Output ONLY the JSON below (no other text):',
    '{',
    '  "title": "video title",',
    '  "description": "video description",',
    '  "tags": ["tag1", "tag2", "tag3"],',
    '  "privacy": "public | private | unlisted",',
    '  "categoryId": "YouTube category ID (Education: 27, Entertainment: 24, People/Blogs: 22)",',
    '  "language": "ko | en"',
    '}',
    '',
    `IMPORTANT: The video content is in "${langName}". Write the title, description, and tags in ${langName}.`,
  ].join('\n');
}
