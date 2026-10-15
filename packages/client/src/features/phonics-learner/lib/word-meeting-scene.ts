import type { Storybook } from '@tangobook/shared';
import { resolveSceneFromWord } from '@/features/games/lib/resolve-scene';

/** The scene must teach the same meaning, not a substring or a different baby animal. */
export function wordMeetingSceneMatches(text: string | undefined, word: string, lang: string) {
  if (!text) return false;
  if (lang === 'korean' && word === '아기' && /아기\s*(?:까치|새|고양이|강아지|토끼|곰)/.test(text))
    return false;
  if (lang === 'english') {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^a-z-])${escaped}(?![a-z-])`, 'i').test(text);
  }
  return text.replace(/[~〜·]/g, '').includes(word);
}

export function wordMeetingScene(book: Storybook, word: string, lang: 'korean' | 'english') {
  const code = lang === 'korean' ? 'ko' : 'en';
  let found = resolveSceneFromWord(word, code, book);
  const valid = (scene: typeof found) =>
    wordMeetingSceneMatches(scene?.pageText, word, lang) && !!scene?.pageTtsUrl;
  if ((lang === 'korean' && word === '아기') || !valid(found)) {
    const ownIndex = (book.pages ?? []).findIndex((page) => {
      const text = code === 'ko' ? page.text : page.translations?.[code]?.text;
      const tts = code === 'ko' ? page.ttsUrl : page.translations?.[code]?.ttsUrl;
      return page.illustrationUrl && tts && wordMeetingSceneMatches(text, word, lang);
    });
    const page = book.pages?.[ownIndex];
    found = page
      ? {
          illustrationUrl: page.illustrationUrl!,
          pageNumber: ownIndex + 1,
          pageText: code === 'ko' ? page.text : page.translations?.[code]?.text,
          pageTtsUrl: code === 'ko' ? page.ttsUrl : page.translations?.[code]?.ttsUrl,
        }
      : found;
  }
  return valid(found) ? found : null;
}
