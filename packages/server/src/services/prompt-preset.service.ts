import {
  uploadJsonToR2,
  downloadFromR2,
  listR2Objects,
  deleteFromR2,
} from '../providers/r2.provider.js';
import { AppError } from '../middleware/error.middleware.js';
import type { PromptPreset } from '@tangobook/shared';

const PRESET_PREFIX = 'prompt-presets/';

function presetKey(id: string): string {
  return `${PRESET_PREFIX}${id}.json`;
}

export const PromptPresetService = {
  async list(): Promise<PromptPreset[]> {
    const objects = await listR2Objects(PRESET_PREFIX);
    const jsonObjects = objects.filter((obj) => obj.Key?.endsWith('.json'));

    const presets: PromptPreset[] = [];
    const CONCURRENCY = 5;

    for (let i = 0; i < jsonObjects.length; i += CONCURRENCY) {
      const batch = jsonObjects.slice(i, i + CONCURRENCY);
      await Promise.all(
        batch.map(async (obj) => {
          try {
            const buffer = await downloadFromR2(obj.Key!);
            const preset = JSON.parse(buffer.toString('utf-8')) as PromptPreset;
            presets.push(preset);
          } catch {
            // 개별 파일 로드 실패 무시
          }
        })
      );
    }

    return presets.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  async getById(id: string): Promise<PromptPreset> {
    try {
      const buffer = await downloadFromR2(presetKey(id));
      return JSON.parse(buffer.toString('utf-8')) as PromptPreset;
    } catch {
      throw new AppError(404, '프롬프트 프리셋을 찾을 수 없습니다.');
    }
  },

  async create(data: { name: string; systemPrompt: string }): Promise<PromptPreset> {
    const now = new Date().toISOString();
    const preset: PromptPreset = {
      id: crypto.randomUUID(),
      name: data.name,
      systemPrompt: data.systemPrompt,
      createdAt: now,
      updatedAt: now,
    };
    await uploadJsonToR2(preset, presetKey(preset.id));
    return preset;
  },

  async update(id: string, data: Partial<PromptPreset>): Promise<PromptPreset> {
    const existing = await PromptPresetService.getById(id);
    const updated: PromptPreset = {
      ...existing,
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    };
    await uploadJsonToR2(updated, presetKey(id));
    return updated;
  },

  async remove(id: string): Promise<void> {
    await deleteFromR2(presetKey(id));
  },
};
