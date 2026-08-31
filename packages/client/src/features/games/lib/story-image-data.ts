import type {
  Lang,
  Storybook,
  KoreanStoryImageData,
  EnglishStoryImageData,
} from '@tangobook/shared';
import { pageIllustrationUrl, pageNumberOf } from './page-illustration';

const ROUND_COUNT = 5;
/** 2×2 로 넷. 세로로 셋을 쌓으면 한 장이 납작해져 그림을 못 알아본다. */
const OPTIONS_PER_ROUND = 4;
/** 오답 3개를 뽑아야 하므로 최소 4쪽. */
const MIN_PAGES = 4;

interface PagePick {
  text: string;
  ttsUrl: string;
  illustrationUrl: string;
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * 한 쪽에서 (그 언어의) 본문·나레이션 + (그 그림체의) 삽화를 고른다.
 * ko 는 translations.ko 우선 후 base 폴백 — 비-ko 는 번역이 없으면 그 쪽을 버린다
 * (base 한국어를 다른 언어 라운드에 섞으면 아이가 못 알아듣는 소리가 난다).
 */
function pickPage(
  page: Storybook['pages'][number],
  index: number,
  lang: Lang,
  book: Storybook,
  style?: string
): PagePick | null {
  const illustrationUrl = pageIllustrationUrl(book, page, pageNumberOf(page, index), style);
  if (!illustrationUrl) return null;

  const tr = page.translations?.[lang];
  // 본문에 강조 마크업(`**...**`)이 섞인 책이 있다 — 자막에 별표로 그대로 나온다(FlashcardPractice 와 같은 처리).
  const text = (tr?.text || (lang === 'ko' ? page.text : '') || '').replace(/\*\*/g, '');
  const ttsUrl = tr?.ttsUrl || (lang === 'ko' ? page.ttsUrl : '');
  if (!text || !ttsUrl) return null;

  return { text, ttsUrl, illustrationUrl };
}

/**
 * 동화책 → 「이야기 듣고 그림 찾기」 데이터. 낱말이 아니라 **쪽**에서 나오므로
 * `key_objects` 가 없는 책(호리 세상 탐험 등)에서도 뜬다.
 *
 * 🔴 `type` 은 ko 만 korean-*, 나머지는 english-* 를 쓴다 — 데이터 모양이 같고
 *    플레이어는 `rounds` 만 본다. 그림짝(`english-line-matching`)이 이미 쓰는 규칙.
 */
export function buildStoryImageData(
  book: Storybook | undefined,
  lang: Lang,
  style?: string
): KoreanStoryImageData | EnglishStoryImageData | null {
  if (!book) return null;
  const usable = (book.pages ?? [])
    .map((p, i) => pickPage(p, i, lang, book, style))
    .filter((p): p is PagePick => p !== null);
  if (usable.length < MIN_PAGES) return null;

  const shuffled = shuffle(usable);
  const rounds = shuffled.slice(0, Math.min(ROUND_COUNT, usable.length)).map((correct) => ({
    text: correct.text,
    ttsUrl: correct.ttsUrl,
    correctImageUrl: correct.illustrationUrl,
    distractorImageUrls: shuffle(
      usable.filter((p) => p.illustrationUrl !== correct.illustrationUrl)
    )
      .slice(0, OPTIONS_PER_ROUND - 1)
      .map((d) => d.illustrationUrl),
  }));

  return lang === 'ko'
    ? { type: 'korean-story-image', rounds }
    : { type: 'english-story-image', rounds };
}
