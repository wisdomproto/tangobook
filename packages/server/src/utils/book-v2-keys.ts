// R2 key builders for book-variants v2 storage layout.
//
// Tree:
//   books/{bid}/manifest.json
//   books/{bid}/texts/{level}.{lang}.json
//   books/{bid}/audio/{level}.{lang}/page-{N}.mp3
//   books/{bid}/styles/{style}/characters.json
//   books/{bid}/styles/{style}/cover.webp
//   books/{bid}/styles/{style}/pages/{level}/{illustrationKey}.webp
//   books/{bid}/styles/{style}/key-objects/{keyObjId}.webp
//   books/{bid}/styles/{style}/vocabulary/{vocabId}.webp
//   books/{bid}/games/{gameInstanceId}.json
//   books/{bid}/audiobook/project.json
//   books/{bid}/audiobook/renders/{level}.{lang}.{style}.mp4
//   books/{bid}/audiobook/renders/{level}.{lang}.{style}.meta.json
//   books/{bid}/longform/{projectId}.json
//   books/{bid}/longform/{projectId}.mp4
//   books/{bid}/marketing/blog/{postId}.json
//   books/{bid}/marketing/card-news/{projectId}.json
//   _index/books.json
//
// 스펙: docs/superpowers/specs/2026-04-25-book-variants-design.md §3

import type { ReadingLevel } from '@tangobook/shared';

// ────────────────────────────────────────────────────────────────────────────
// Validation
// ────────────────────────────────────────────────────────────────────────────

const BID_RE = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;
const LEVEL_RE = /^L[1-4]$/;
const LANG_RE = /^[a-z]{2,5}(-[A-Z]{2})?$/; // 'ko', 'en', 'zh-CN'
const STYLE_RE = /^[a-z][a-z0-9-]*$/; // ART_STYLES.id 형식
// Unicode letters + digits 허용 (한글·일본어·중국어 ID 지원)
const SAFE_TOKEN_RE = /^[\p{L}\p{N}][\p{L}\p{N}_.-]*$/u;

function check(name: string, value: unknown, re: RegExp): string {
  if (typeof value !== 'string' || !re.test(value)) {
    throw new Error(`book-v2-keys: invalid ${name}: ${JSON.stringify(value)}`);
  }
  return value;
}

const validBid = (v: unknown) => check('bid', v, BID_RE);
const validLevel = (v: unknown) => check('level', v, LEVEL_RE) as ReadingLevel;
const validLang = (v: unknown) => check('language', v, LANG_RE);
const validStyle = (v: unknown) => check('style', v, STYLE_RE);
const validToken = (name: string, v: unknown) => check(name, v, SAFE_TOKEN_RE);

// ────────────────────────────────────────────────────────────────────────────
// Prefix builders (디렉토리)
// ────────────────────────────────────────────────────────────────────────────

export const bookPrefix = (bid: string) => `books/${validBid(bid)}/`;
export const stylePrefix = (bid: string, style: string) =>
  `${bookPrefix(bid)}styles/${validStyle(style)}/`;
export const audioPrefix = (bid: string, level: ReadingLevel, lang: string) =>
  `${bookPrefix(bid)}audio/${validLevel(level)}.${validLang(lang)}/`;
export const audiobookPrefix = (bid: string) => `${bookPrefix(bid)}audiobook/`;
export const audiobookRendersPrefix = (bid: string) => `${audiobookPrefix(bid)}renders/`;
export const longformPrefix = (bid: string) => `${bookPrefix(bid)}longform/`;
export const gamesPrefix = (bid: string) => `${bookPrefix(bid)}games/`;
export const marketingPrefix = (bid: string) => `${bookPrefix(bid)}marketing/`;

// ────────────────────────────────────────────────────────────────────────────
// File keys
// ────────────────────────────────────────────────────────────────────────────

export const manifestKey = (bid: string) => `${bookPrefix(bid)}manifest.json`;

export const textSliceKey = (bid: string, level: ReadingLevel, lang: string) =>
  `${bookPrefix(bid)}texts/${validLevel(level)}.${validLang(lang)}.json`;

export const audioFileKey = (
  bid: string,
  level: ReadingLevel,
  lang: string,
  pageNumber: number
) => {
  if (!Number.isInteger(pageNumber) || pageNumber < 1) {
    throw new Error(`book-v2-keys: invalid pageNumber: ${pageNumber}`);
  }
  return `${audioPrefix(bid, level, lang)}page-${pageNumber}.mp3`;
};

export const styleCharactersKey = (bid: string, style: string) =>
  `${stylePrefix(bid, style)}characters.json`;

export const styleCoverKey = (bid: string, style: string, ext: 'webp' | 'png' | 'jpg' = 'webp') =>
  `${stylePrefix(bid, style)}cover.${ext}`;

export const stylePageImageKey = (
  bid: string,
  style: string,
  level: ReadingLevel,
  illustrationKey: string,
  ext: 'webp' | 'png' | 'jpg' = 'webp'
) =>
  `${stylePrefix(bid, style)}pages/${validLevel(level)}/${validToken('illustrationKey', illustrationKey)}.${ext}`;

export const styleKeyObjectImageKey = (
  bid: string,
  style: string,
  keyObjId: string,
  ext: 'webp' | 'png' | 'jpg' = 'webp'
) => `${stylePrefix(bid, style)}key-objects/${validToken('keyObjId', keyObjId)}.${ext}`;

export const styleVocabImageKey = (
  bid: string,
  style: string,
  vocabId: string,
  ext: 'webp' | 'png' | 'jpg' = 'webp'
) => `${stylePrefix(bid, style)}vocabulary/${validToken('vocabId', vocabId)}.${ext}`;

export const gameInstanceKey = (bid: string, gameInstanceId: string) =>
  `${gamesPrefix(bid)}${validToken('gameInstanceId', gameInstanceId)}.json`;

export const audiobookProjectKey = (bid: string) => `${audiobookPrefix(bid)}project.json`;

export const audiobookRenderKey = (
  bid: string,
  level: ReadingLevel,
  lang: string,
  style: string,
  ext: 'mp4' | 'webm' = 'mp4'
) =>
  `${audiobookRendersPrefix(bid)}${validLevel(level)}.${validLang(lang)}.${validStyle(style)}.${ext}`;

export const audiobookRenderMetaKey = (
  bid: string,
  level: ReadingLevel,
  lang: string,
  style: string
) =>
  `${audiobookRendersPrefix(bid)}${validLevel(level)}.${validLang(lang)}.${validStyle(style)}.meta.json`;

export const longformProjectKey = (bid: string, projectId: string) =>
  `${longformPrefix(bid)}${validToken('projectId', projectId)}.json`;

export const longformVideoKey = (bid: string, projectId: string, ext: 'mp4' | 'webm' = 'mp4') =>
  `${longformPrefix(bid)}${validToken('projectId', projectId)}.${ext}`;

export const blogPostKey = (bid: string, postId: string) =>
  `${marketingPrefix(bid)}blog/${validToken('postId', postId)}.json`;

export const cardNewsKey = (bid: string, projectId: string) =>
  `${marketingPrefix(bid)}card-news/${validToken('projectId', projectId)}.json`;

export const bookIndexKey = () => `_index/books.json`;

// ────────────────────────────────────────────────────────────────────────────
// Parsers — key 문자열에서 메타데이터 추출
// ────────────────────────────────────────────────────────────────────────────

export interface ParsedTextSliceKey {
  bid: string;
  level: ReadingLevel;
  language: string;
}

export function parseTextSliceKey(key: string): ParsedTextSliceKey | null {
  const m = key.match(/^books\/([^/]+)\/texts\/(L[1-4])\.([a-z]{2,5}(?:-[A-Z]{2})?)\.json$/);
  if (!m) return null;
  return { bid: m[1], level: m[2] as ReadingLevel, language: m[3] };
}

export interface ParsedAudiobookRenderKey {
  bid: string;
  level: ReadingLevel;
  language: string;
  style: string;
  meta: boolean;
  ext: string;
}

export function parseAudiobookRenderKey(key: string): ParsedAudiobookRenderKey | null {
  // books/{bid}/audiobook/renders/{L\d}.{lang}.{style}.{mp4|webm|meta.json}
  const m = key.match(
    /^books\/([^/]+)\/audiobook\/renders\/(L[1-4])\.([a-z]{2,5}(?:-[A-Z]{2})?)\.([a-z][a-z0-9-]*)\.(mp4|webm|meta\.json)$/
  );
  if (!m) return null;
  return {
    bid: m[1],
    level: m[2] as ReadingLevel,
    language: m[3],
    style: m[4],
    meta: m[5] === 'meta.json',
    ext: m[5],
  };
}

export interface ParsedStylePageImageKey {
  bid: string;
  style: string;
  level: ReadingLevel;
  illustrationKey: string;
  ext: string;
}

export function parseStylePageImageKey(key: string): ParsedStylePageImageKey | null {
  const m = key.match(
    /^books\/([^/]+)\/styles\/([a-z][a-z0-9-]*)\/pages\/(L[1-4])\/([\p{L}\p{N}][\p{L}\p{N}_.-]*)\.(webp|png|jpg)$/u
  );
  if (!m) return null;
  return { bid: m[1], style: m[2], level: m[3] as ReadingLevel, illustrationKey: m[4], ext: m[5] };
}

export function parseManifestKey(key: string): { bid: string } | null {
  const m = key.match(/^books\/([^/]+)\/manifest\.json$/);
  return m ? { bid: m[1] } : null;
}
