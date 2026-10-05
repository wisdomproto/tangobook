import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useGameLogger } from './useGameLogger';
import { VocabSourceProvider } from '../context/VocabSourceContext';
import type { ReactNode } from 'react';
const batch = vi.hoisted(() => vi.fn());
vi.mock('./useLogEvent', () => ({ useLogEventsBatch: () => batch }));
describe('game evidence metadata', () => {
  it('uses phonics source and unit context, preserving the final consonant', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <VocabSourceProvider source="phonics" unitId="unit">
        {children}
      </VocabSourceProvider>
    );
    const { result } = renderHook(() => useGameLogger(), { wrapper });
    act(() =>
      result.current({
        gameType: 'korean-block',
        lang: 'ko',
        storybookId: 'unit',
        results: [
          { word: '강', correct: false },
          { correct: false, consonant: 'ㄱ', vowel: 'ㅏ', coda: 'ㅇ' },
        ],
      })
    );
    const items = batch.mock.calls.at(-1)![0];
    expect(items[0].metadata).toMatchObject({
      source: 'phonics',
      unitId: 'unit',
      skill: 'building',
      evidence: 'first-attempt',
      firstAttempt: false,
    });
    expect(items[1].metadata.coda).toBe('ㅇ');
    expect(items[0].metadata.activityRunId).toBe(items[1].metadata.activityRunId);
  });
  it('does not present writing completion as first-attempt reading success', () => {
    const { result } = renderHook(() => useGameLogger());
    act(() =>
      result.current({
        gameType: 'english-word-writing',
        lang: 'en',
        results: [{ word: 'cat', correct: true }],
      })
    );
    expect(batch.mock.calls.at(-1)![0][0].metadata).toMatchObject({
      skill: 'tracing',
      evidence: 'completion',
    });
    expect(batch.mock.calls.at(-1)![0][0].metadata.firstAttempt).toBeUndefined();
  });
});
