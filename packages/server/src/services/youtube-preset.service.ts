import type { YouTubePreset } from '@tangobook/shared';
import { downloadFromR2, uploadJsonToR2 } from '../providers/r2.provider.js';

const PRESETS_KEY = 'system/youtube-presets.json';

async function loadPresets(): Promise<YouTubePreset[]> {
  try {
    const buf = await downloadFromR2(PRESETS_KEY);
    return JSON.parse(buf.toString('utf-8'));
  } catch {
    return [];
  }
}

async function savePresets(presets: YouTubePreset[]): Promise<void> {
  await uploadJsonToR2(presets, PRESETS_KEY);
}

export const YouTubePresetService = {
  async list(): Promise<YouTubePreset[]> {
    return loadPresets();
  },

  async create(data: Omit<YouTubePreset, 'id' | 'createdAt'>): Promise<YouTubePreset> {
    const presets = await loadPresets();
    const preset: YouTubePreset = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    presets.push(preset);
    await savePresets(presets);
    return preset;
  },

  async update(
    id: string,
    data: Partial<Omit<YouTubePreset, 'id' | 'createdAt'>>
  ): Promise<YouTubePreset> {
    const presets = await loadPresets();
    const idx = presets.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('프리셋을 찾을 수 없습니다.');
    presets[idx] = { ...presets[idx], ...data };
    await savePresets(presets);
    return presets[idx];
  },

  async remove(id: string): Promise<void> {
    const presets = await loadPresets();
    const filtered = presets.filter((p) => p.id !== id);
    await savePresets(filtered);
  },
};
