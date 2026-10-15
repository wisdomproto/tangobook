import { beforeEach, describe, expect, it, vi } from 'vitest';

const fetchLibrary = vi.hoisted(() => vi.fn());
vi.mock('@/features/settings/api/settings.api', () => ({
  settingsApi: { getPhonicsLibrary: fetchLibrary },
}));
beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
  fetchLibrary.mockReset();
});

describe('음원 라이브러리 연결 재시도', () => {
  it.each([
    ['getKoreanSyllableUrl', 'mod_korean', 'ㅏ'],
    ['getEnglishPhonemeUrl', 'mod_phonics', 'a'],
    ['getEnglishWordUrl', 'mod_english', 'dragon'],
    ['getChineseSyllableUrl', 'mod_chinese', 'ā'],
  ] as const)('%s 첫 실패를 무음 세션으로 캐시하지 않는다', async (fn, category, sound) => {
    fetchLibrary.mockRejectedValueOnce(new Error('API offline'));
    const library = {
      mod_korean: [],
      mod_phonics: [],
      mod_english: [],
      mod_chinese: [],
      [category]: [{ sound, url: 'https://assets.example/sound.mp3' }],
    };
    fetchLibrary.mockResolvedValueOnce(library);
    const module = await import('./usePhonicsMap');
    expect(await module[fn](sound)).toBeUndefined();
    expect(await module[fn](sound)).toBe('https://assets.example/sound.mp3');
    expect(await module[fn](sound)).toBe('https://assets.example/sound.mp3');
    expect(fetchLibrary).toHaveBeenCalledTimes(2);
  });
});
