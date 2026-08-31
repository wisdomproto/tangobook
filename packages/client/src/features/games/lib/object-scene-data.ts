import type { Storybook, KoreanObjectSceneData, StoryImageRound } from '@tangobook/shared';
import { pageIllustrationUrl, pageNumberOf } from './page-illustration';

const ROUND_COUNT = 5;
const MIN_ROUNDS = 3;
/** 2×2 로 넷. */
const OPTIONS_PER_ROUND = 4;

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * 동화책 → 「이 물건 어느 장면?」 데이터 (한국어).
 * 낱말 카드 그림을 보여주고, 그 사물이 나온 쪽 삽화를 3장 중 고른다.
 *
 * 🔴 **`key_objects[].pages` 를 믿지 않는다.** 저작 중 쪽이 밀리면서 어긋난 책이 있어
 *    (`resolve-scene.ts` 의 findValidatedPageNumber 가 같은 이유로 생겼다) 그대로 쓰면
 *    엉뚱한 장면이 정답이 된다. **본문에 그 낱말이 실제로 있는 쪽**만 정답으로 삼는다.
 * 🔴 오답은 **그 낱말이 안 나오는 쪽**에서만 뽑는다 — 안 그러면 정답이 둘이 된다.
 */
export function buildObjectSceneData(
  book: Storybook | undefined,
  style?: string
): KoreanObjectSceneData | null {
  if (!book) return null;
  const pages = (book.pages ?? []).map((page, i) => {
    const pageNumber = pageNumberOf(page, i);
    return {
      text: page.text ?? '',
      illustrationUrl: pageIllustrationUrl(book, page, pageNumber, style),
    };
  });
  const illustrated = pages.filter((p) => p.illustrationUrl);
  if (illustrated.length < OPTIONS_PER_ROUND) return null;

  const images = book.keyObjectImages ?? [];
  const rounds: StoryImageRound[] = [];
  for (const ko of book.key_objects ?? []) {
    const word = ko.korean?.trim();
    if (!word) continue;
    const card = images.find((im) => im.objectName === ko.name && im.imageUrl);
    if (!card) continue;

    const hits = illustrated.filter((p) => p.text.includes(word));
    const misses = illustrated.filter((p) => !p.text.includes(word));
    if (hits.length === 0 || misses.length < OPTIONS_PER_ROUND - 1) continue;

    const correct = shuffle(hits)[0];
    rounds.push({
      text: word,
      // 저작 음원이 있으면 그것, 없으면 플레이어가 음절을 이어붙인다(전래동화는 200개 전부 없다).
      ttsUrl: ko.ttsUrl ?? '',
      promptImageUrl: card.imageUrl,
      correctImageUrl: correct.illustrationUrl!,
      distractorImageUrls: shuffle(misses)
        .slice(0, OPTIONS_PER_ROUND - 1)
        .map((p) => p.illustrationUrl!),
    });
  }

  if (rounds.length < MIN_ROUNDS) return null;
  return { type: 'korean-object-scene', rounds: shuffle(rounds).slice(0, ROUND_COUNT) };
}
