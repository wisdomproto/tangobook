import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useReviewCardSources } from './useReviewCardSources';
import type { ReviewCard } from '../lib/korean-phonics-units';

const query = vi.hoisted(() =>
  vi.fn(({ queries }: { queries: Array<{ queryKey: string[] }> }) =>
    queries.map(() => ({
      isLoading: false,
      data: {
        flashcards: [
          { word: 'cat', imageUrl: 'cat.webp' },
          { word: 'dog', imageUrl: 'dog.webp' },
        ],
      },
    }))
  )
);
vi.mock('@tanstack/react-query', () => ({ useQueries: query }));

describe('복습 단원 조회', () => {
  it('한 단원의 여러 복습 글자는 단원 조회 하나를 공유하면서 각 글자 카드·그림을 유지한다', () => {
    const cards = ['c', 'd'].map((letter) => ({
      unitId: 'en-b1-u01',
      letter,
      syllable: letter,
      sound: letter,
      matchPosition: 'cho',
    })) as ReviewCard[];
    const hook = renderHook(() => useReviewCardSources(cards));
    expect(query.mock.calls[0][0].queries).toHaveLength(1);
    expect(hook.result.current.sources.map((source) => [source.letter, source.word])).toEqual([
      ['c', 'cat'],
      ['d', 'dog'],
    ]);
  });
});
