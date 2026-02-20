import axios from 'axios';
import {
  uploadBase64ToR2,
  uploadBufferToR2,
  uploadJsonToR2,
  deleteFromR2,
  urlToR2Key,
  listR2Objects,
  r2PublicUrl,
} from '../providers/r2.provider.js';
import type { Storybook, StorybookSummary } from '@tangobook/shared';

const STORYBOOK_PREFIX = 'storybook-';

function storybookKey(id: string): string {
  return `${STORYBOOK_PREFIX}${id}.json`;
}

/** 기존 R2 데이터의 필드명을 현재 타입에 맞게 정규화 */
function normalizeStorybook(sb: Record<string, unknown>): Storybook {
  const pages = (sb.pages as Array<Record<string, unknown>> | undefined) ?? [];
  const normalizedPages = pages.map((p) => {
    // illustrationImage → illustrationUrl
    if (p.illustrationImage && !p.illustrationUrl) {
      p.illustrationUrl = p.illustrationImage;
    }
    // audioUrl → ttsUrl
    if (p.audioUrl && !p.ttsUrl) {
      p.ttsUrl = p.audioUrl;
    }
    return p;
  });

  // top-level translations → per-page translations
  const topTranslations = sb.translations as
    | Record<string, Array<Record<string, unknown>>>
    | undefined;
  if (topTranslations && typeof topTranslations === 'object') {
    for (const [lang, langPages] of Object.entries(topTranslations)) {
      if (lang === 'ko' || !Array.isArray(langPages)) continue;
      langPages.forEach((lp, idx) => {
        const page = normalizedPages[idx] as Record<string, unknown> | undefined;
        if (!page || !lp.text) return;
        if (!page.translations) page.translations = {};
        (page.translations as Record<string, unknown>)[lang] = { text: lp.text };
      });
    }
  }

  // keyObjectImages: name → objectName
  const keyObjImages = sb.keyObjectImages as Array<Record<string, unknown>> | undefined;
  if (keyObjImages) {
    keyObjImages.forEach((img) => {
      if (img.name && !img.objectName) {
        img.objectName = img.name;
      }
    });
  }

  // folder "all" 은 잘못 저장된 값 → 제거
  if (sb.folder === 'all') sb.folder = undefined;

  return { ...sb, pages: normalizedPages } as unknown as Storybook;
}

export const R2Repository = {
  async listStorybooks(): Promise<StorybookSummary[]> {
    const objects = await listR2Objects(STORYBOOK_PREFIX);
    const summaries: StorybookSummary[] = [];

    const jsonObjects = objects.filter((obj) => obj.Key?.endsWith('.json'));

    await Promise.all(
      jsonObjects.map(async (obj) => {
        try {
          const url = `${r2PublicUrl}/${obj.Key}`;
          const res = await axios.get<Storybook>(url, { timeout: 5000 });
          const sb = res.data;
          summaries.push({
            id: sb.id,
            title: sb.title,
            targetAge: sb.targetAge,
            artStyle: sb.artStyle,
            category: sb.category,
            folder: sb.folder,
            isPublic: sb.isPublic,
            createdAt: sb.createdAt,
            coverImage: sb.coverImage,
            pageCount: sb.pages?.length ?? 0,
          });
        } catch {
          // 개별 파일 로드 실패 무시
        }
      })
    );

    return summaries.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  async getStorybook(id: string): Promise<Storybook | null> {
    try {
      const url = `${r2PublicUrl}/${storybookKey(id)}`;
      const res = await axios.get<Record<string, unknown>>(url, { timeout: 10000 });
      return normalizeStorybook(res.data);
    } catch {
      return null;
    }
  },

  async saveStorybook(storybook: Storybook): Promise<Storybook> {
    const updated = { ...storybook, updatedAt: new Date().toISOString() };
    await uploadJsonToR2(updated, storybookKey(storybook.id));
    return updated;
  },

  async deleteStorybook(id: string): Promise<void> {
    await deleteFromR2(storybookKey(id));
  },

  async uploadImage(base64: string, key: string): Promise<string> {
    return uploadBase64ToR2(base64, key);
  },

  async uploadBuffer(buffer: Buffer, key: string, contentType: string): Promise<string> {
    return uploadBufferToR2(buffer, key, contentType);
  },

  async deleteImage(imageUrl: string): Promise<void> {
    const key = urlToR2Key(imageUrl);
    await deleteFromR2(key);
  },
};
