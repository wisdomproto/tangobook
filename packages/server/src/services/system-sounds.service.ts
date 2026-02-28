import {
  uploadBufferToR2,
  deleteFromR2,
  deleteManyFromR2,
  listR2Objects,
  r2PublicUrl,
} from '../providers/r2.provider.js';
import { AppError } from '../middleware/error.middleware.js';
import type { SystemSoundLanguage, SystemSoundType, SystemSoundItem } from '@tangobook/shared';

const PREFIX = 'system-sounds';
const VALID_LANGUAGES: SystemSoundLanguage[] = ['korean', 'english'];
const VALID_TYPES: SystemSoundType[] = ['correct', 'wrong'];

function buildKey(language: SystemSoundLanguage, type: SystemSoundType, name: string): string {
  return `${PREFIX}/${language}/${type}/${name}.mp3`;
}

function parseKey(
  key: string
): { language: SystemSoundLanguage; type: SystemSoundType; name: string } | null {
  const match = key.match(/^system-sounds\/(korean|english)\/(correct|wrong)\/(.+)\.mp3$/);
  if (!match) return null;
  return {
    language: match[1] as SystemSoundLanguage,
    type: match[2] as SystemSoundType,
    name: match[3],
  };
}

type SoundsLibrary = {
  korean: { correct: SystemSoundItem[]; wrong: SystemSoundItem[] };
  english: { correct: SystemSoundItem[]; wrong: SystemSoundItem[] };
};

export const SystemSoundsService = {
  async upload(
    files: Express.Multer.File[],
    language: SystemSoundLanguage,
    type: SystemSoundType
  ): Promise<SystemSoundItem[]> {
    if (!VALID_LANGUAGES.includes(language)) throw new AppError(400, '유효하지 않은 언어입니다.');
    if (!VALID_TYPES.includes(type)) throw new AppError(400, '유효하지 않은 타입입니다.');

    const results: SystemSoundItem[] = [];

    for (const file of files) {
      const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
      const ext = originalName.split('.').pop()?.toLowerCase();
      if (ext !== 'mp3') continue;

      const name = originalName.replace(/\.mp3$/i, '');
      if (!name) continue;

      const key = buildKey(language, type, name);
      const url = await uploadBufferToR2(file.buffer, key, 'audio/mpeg');
      results.push({ name, url, language, type });
    }

    return results;
  },

  async list(): Promise<SoundsLibrary> {
    const objects = await listR2Objects(PREFIX);

    const result: SoundsLibrary = {
      korean: { correct: [], wrong: [] },
      english: { correct: [], wrong: [] },
    };

    for (const obj of objects) {
      if (!obj.Key) continue;
      const parsed = parseKey(obj.Key);
      if (!parsed) continue;

      result[parsed.language][parsed.type].push({
        name: parsed.name,
        url: `${r2PublicUrl}/${obj.Key}`,
        language: parsed.language,
        type: parsed.type,
      });
    }

    // 알파벳 순 정렬
    for (const lang of VALID_LANGUAGES) {
      for (const t of VALID_TYPES) {
        result[lang][t].sort((a, b) => a.name.localeCompare(b.name));
      }
    }

    return result;
  },

  async remove(language: SystemSoundLanguage, type: SystemSoundType, name: string): Promise<void> {
    if (!VALID_LANGUAGES.includes(language)) throw new AppError(400, '유효하지 않은 언어입니다.');
    if (!VALID_TYPES.includes(type)) throw new AppError(400, '유효하지 않은 타입입니다.');
    await deleteFromR2(buildKey(language, type, name));
  },

  async removeAll(
    language: SystemSoundLanguage,
    type: SystemSoundType
  ): Promise<{ deleted: number }> {
    if (!VALID_LANGUAGES.includes(language)) throw new AppError(400, '유효하지 않은 언어입니다.');
    if (!VALID_TYPES.includes(type)) throw new AppError(400, '유효하지 않은 타입입니다.');

    const prefix = `${PREFIX}/${language}/${type}/`;
    const objects = await listR2Objects(prefix);
    const keys = objects.filter((o) => o.Key).map((o) => o.Key!);
    if (keys.length > 0) {
      await deleteManyFromR2(keys);
    }
    return { deleted: keys.length };
  },
};
