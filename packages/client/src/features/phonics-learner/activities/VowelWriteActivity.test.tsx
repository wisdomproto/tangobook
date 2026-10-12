import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { VowelWriteActivity } from './VowelWriteActivity';

const tts = vi.hoisted(() => vi.fn(async () => 'blob:vowel-sound'));
vi.mock('@/features/tts', () => ({ resolveTtsUrl: tts }));
vi.mock('../hooks/usePhonicsTtsWarm', () => ({ usePhonicsTtsWarm: vi.fn() }));
vi.mock('../hooks/useEntryGuide', () => ({
  ENTRY_GUIDE: { writeTrace: 'write' },
  useEntryGuide: vi.fn(),
  praiseLang: () => 'ko',
}));
vi.mock('@/features/games/hooks/useGameAudio', () => ({
  useGameAudio: () => ({
    playAudio: (_url: string, ended?: () => void) => ended?.(),
    playCorrectSequence: ({ onDone }: { onDone?: () => void }) => onDone?.(),
    praiseVisible: false,
  }),
}));
vi.mock('@/features/phonics/components/LetterFillCanvas', () => ({
  LetterFillCanvas: ({
    letter,
    onResult,
  }: {
    letter: string;
    onResult: (passed: boolean) => void;
  }) => (
    <button aria-label={`쓰기 ${letter}`} onClick={() => onResult(true)}>
      {letter}
    </button>
  ),
}));

describe('모음 모양 쓰기와 발음 분리', () => {
  it('ㅏ 모양을 쓰고 아 소리를 읽으며 source 음원/현재 단원 완료를 연결한다', async () => {
    const complete = vi.fn();
    render(
      <VowelWriteActivity
        unitId="kr-v1-u01"
        ttsUnitId="kr-h1-u01"
        vowels={[{ vowel: 'ㅏ', syllable: '아', writeLetter: 'ㅏ' }]}
        onComplete={complete}
        onBack={vi.fn()}
      />
    );
    expect(screen.queryByText('아')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '쓰기 ㅏ' }));
    await waitFor(() =>
      expect(tts).toHaveBeenCalledWith(
        expect.objectContaining({
          text: '아',
          storybookId: 'kr-h1-u01',
          language: 'korean',
        })
      )
    );
    await waitFor(() => expect(complete).toHaveBeenCalledTimes(1));
  });
});
