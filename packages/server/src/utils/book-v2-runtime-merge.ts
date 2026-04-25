// Runtime merge helpers for book-variants v2.
//
// 학습자(viewer/게임) 요청 시 manifest + textSlice + styleSlice를 머지해서
// 한 객체로 응답. 자산 URL은 R2 public URL로 채움.
//
// 누락 자산은 undefined 또는 placeholder. 호출자가 graceful fallback.

import { audioFileKey } from './book-v2-keys.js';
import type {
  BookManifest,
  BookTextSlice,
  BookStyleSlice,
  BookGameInstance,
  GameImageRef,
  ReadingLevel,
} from '@tangobook/shared';

function publicUrlOf(key: string): string {
  const base = (process.env.R2_PUBLIC_URL ?? '').replace(/\/+$/, '');
  return `${base}/${key}`;
}

// ────────────────────────────────────────────────────────────────────────────
// Viewer merge
// ────────────────────────────────────────────────────────────────────────────

export interface MergedViewerPage {
  pageNumber: number;
  text: string;
  illustrationKey: string;
  illustrationUrl?: string;
  ttsUrl?: string;
  sceneDescription?: string;
}

export interface MergedViewerPayload {
  bid: string;
  level: ReadingLevel;
  language: string;
  style: string;
  title: string;
  intro?: string;
  parentGuide?: BookManifest['parentGuide'];
  bgmUrl?: string;
  coverImageUrl?: string;
  pages: MergedViewerPage[];
  warnings: string[];
}

export function mergeForViewer(args: {
  manifest: BookManifest;
  textSlice: BookTextSlice;
  styleSlice: BookStyleSlice;
}): MergedViewerPayload {
  const { manifest, textSlice, styleSlice } = args;
  const { level, language } = textSlice;
  const style = styleSlice.style;
  const warnings: string[] = [];

  const pageImagesAtLevel = styleSlice.pageImages[level] ?? {};
  const pages: MergedViewerPage[] = textSlice.pages.map((p) => {
    const illustrationUrl = pageImagesAtLevel[p.illustrationKey];
    if (!illustrationUrl) {
      warnings.push(
        `page ${p.pageNumber}: missing illustration for style=${style}, key=${p.illustrationKey}`
      );
    }
    return {
      pageNumber: p.pageNumber,
      text: p.text,
      illustrationKey: p.illustrationKey,
      illustrationUrl,
      ttsUrl: publicUrlOf(audioFileKey(manifest.id, level, language, p.pageNumber)),
      sceneDescription: p.sceneDescription,
    };
  });

  return {
    bid: manifest.id,
    level,
    language,
    style,
    title: textSlice.title || manifest.title,
    intro: textSlice.intro,
    parentGuide: manifest.parentGuide,
    bgmUrl: manifest.bgmUrl,
    coverImageUrl: styleSlice.coverImageUrl || undefined,
    pages,
    warnings,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Game merge — imageRefs → 활성 style의 이미지 URL
// ────────────────────────────────────────────────────────────────────────────

export interface ResolvedGameImage {
  ref: GameImageRef;
  url?: string;
  warning?: string;
}

export interface MergedGamePayload {
  instance: BookGameInstance;
  resolvedImages: ResolvedGameImage[];
  /** word/korean 텍스트 (textSlice.keyObjectsText / vocabText에서 가져옴) */
  refText: Record<string, { word: string; korean?: string; definition?: string }>;
  warnings: string[];
}

export function mergeForGame(args: {
  instance: BookGameInstance;
  styleSlice: BookStyleSlice;
  textSlice?: BookTextSlice;
}): MergedGamePayload {
  const { instance, styleSlice, textSlice } = args;
  const warnings: string[] = [];

  const resolvedImages: ResolvedGameImage[] = instance.imageRefs.map((ref) => {
    let url: string | undefined;
    let warning: string | undefined;
    switch (ref.kind) {
      case 'keyObj':
        url = styleSlice.keyObjectImages[ref.refId];
        if (!url) warning = `keyObj image missing: ${ref.refId} in style=${styleSlice.style}`;
        break;
      case 'vocab':
        url = styleSlice.vocabImages[ref.refId];
        if (!url) warning = `vocab image missing: ${ref.refId} in style=${styleSlice.style}`;
        break;
      case 'page': {
        // page ref는 (level, illustrationKey)가 instance의 level + 'page' refId 의미
        const pageImages = styleSlice.pageImages[instance.level] ?? {};
        url = pageImages[ref.refId];
        if (!url)
          warning = `page image missing: level=${instance.level}, key=${ref.refId}, style=${styleSlice.style}`;
        break;
      }
    }
    if (warning) warnings.push(warning);
    return { ref, url, warning };
  });

  const refText: MergedGamePayload['refText'] = {};
  if (textSlice) {
    for (const [id, txt] of Object.entries(textSlice.keyObjectsText)) {
      refText[id] = { word: txt.word, korean: txt.korean };
    }
    for (const [id, txt] of Object.entries(textSlice.vocabText)) {
      refText[id] = { word: txt.word, korean: txt.korean, definition: txt.definition };
    }
  }

  return { instance, resolvedImages, refText, warnings };
}
