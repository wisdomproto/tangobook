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

const STORYBOOK_PREFIX = 'storybooks/';

function storybookKey(id: string): string {
  return `${STORYBOOK_PREFIX}${id}.json`;
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
            createdAt: sb.createdAt,
            coverImage: sb.coverImage,
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
      const res = await axios.get<Storybook>(url, { timeout: 10000 });
      return res.data;
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
