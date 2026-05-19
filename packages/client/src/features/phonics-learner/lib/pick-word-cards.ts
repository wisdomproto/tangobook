/**
 * 파닉스 storybook 의 flashcards 에서 단어 + 이미지 풀을 추출 + 셔플.
 * consonant-tap / consonant-write 활동의 3장 카드용.
 */
import type { Storybook } from '@tangobook/shared';

export interface PhonicsWordCard {
  word: string; // 한글 단어 (e.g. '고기')
  imageUrl?: string;
  ttsUrl?: string;
}

function asAny(x: unknown): Record<string, unknown> {
  return x as Record<string, unknown>;
}

export function pickPhonicsWordCards(sb: Storybook, count: number): PhonicsWordCard[] {
  const cards: PhonicsWordCard[] = [];

  // 1) flashcards 우선 (phonics 책 저작도구가 여기에 저장)
  for (const fcRaw of sb.flashcards ?? []) {
    const fc = asAny(fcRaw);
    const word = (fc['localWord'] as string | undefined) ?? (fc['word'] as string | undefined);
    if (!word) continue;
    const imageUrl = (fc['imageUrl'] as string | undefined) ?? (fc['url'] as string | undefined);
    const ttsUrl = fc['ttsUrl'] as string | undefined;
    cards.push({
      word,
      ...(imageUrl ? { imageUrl } : {}),
      ...(ttsUrl ? { ttsUrl } : {}),
    });
  }

  // 2) flashcards 부족 시 targetWords 로 보강 (이미지 없이라도)
  if (cards.length < count) {
    const existing = new Set(cards.map((c) => c.word));
    for (const w of sb.phonicsConfig?.targetWords ?? []) {
      if (existing.has(w)) continue;
      cards.push({ word: w });
    }
  }

  // 셔플 후 N개 자르기
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards.slice(0, count);
}
