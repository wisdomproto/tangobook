import { describe, it, expect, vi } from 'vitest';
import type { Storybook } from '@tangobook/shared';
import REFERENCES from '@/features/phonics-learner/data/changjak-word-scenes.json';
import { apiGet } from '@/lib/axios';
import {
  getMetBooks,
  hasPhonicsWordScene,
  isReviewedSceneCurrent,
  pickPhonicsWordScene,
  preloadWordScenes,
} from './phonics-word-scene';

vi.mock('@/lib/axios', () => ({ apiGet: vi.fn() }));

const [id, pageNumber, sourceText] = REFERENCES.cap.at(-1)! as [string, number, string];
const book = () =>
  ({
    id,
    title: '검토한 모자 장면',
    isPublic: true,
    pages: Array.from({ length: pageNumber }, (_, i) => ({
      pageNumber: i + 1,
      text: '한글 원문',
      illustrationUrl: 'scene.webp',
      translations: { en: { text: sourceText, ttsUrl: 'english.mp3' } },
    })),
  }) as unknown as Storybook;

describe('meaning-reviewed phonics scenes', () => {
  it('keeps the reviewed English scene and its narration through preload and reveal', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce(book());
    const random = vi.spyOn(Math, 'random').mockReturnValue(0.999999);
    try {
      await preloadWordScenes(['CAP']);
      expect(hasPhonicsWordScene('CAP')).toBe(true);
      expect(pickPhonicsWordScene('CAP', 'en')).toMatchObject({
        pageNumber,
        pageText: sourceText,
        pageTtsUrl: 'english.mp3',
        illustrationUrl: 'scene.webp',
      });
      expect(getMetBooks()).toEqual([{ id, title: '검토한 모자 장면', coverUrl: undefined }]);
    } finally {
      random.mockRestore();
    }
  });

  it('rejects withdrawn books, changed meanings and the wrong language', () => {
    const current = book();
    expect(isReviewedSceneCurrent('cap', 'en', current, pageNumber)).toBe(true);
    expect(isReviewedSceneCurrent('cap', 'ko', current, pageNumber)).toBe(false);
    current.isPublic = false;
    expect(isReviewedSceneCurrent('cap', 'en', current, pageNumber)).toBe(false);
    current.isPublic = true;
    current.pages[pageNumber - 1].translations!.en!.text = 'A mushroom cap grew here.';
    expect(isReviewedSceneCurrent('cap', 'en', current, pageNumber)).toBe(false);
  });

  it('rejects spelling-only legacy matches for ambiguous words', () => {
    const legacy = { ...book(), id: 'unreviewed-old-book' };
    expect(isReviewedSceneCurrent('cap', 'en', legacy, pageNumber)).toBe(false);
    expect(isReviewedSceneCurrent('rose', 'en', legacy, pageNumber)).toBe(false);
  });
});
