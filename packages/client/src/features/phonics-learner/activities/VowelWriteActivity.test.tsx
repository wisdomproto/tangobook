import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { VowelWriteActivity } from './VowelWriteActivity';

const tts = vi.hoisted(() => vi.fn(async () => 'blob:vowel-sound'));
const audio = vi.hoisted(() => vi.fn((_url: string, ended?: () => void) => ended?.()));
vi.mock('@/features/tts', () => ({ resolveTtsUrl: tts }));
vi.mock('../hooks/usePhonicsTtsWarm', () => ({ usePhonicsTtsWarm: vi.fn() }));
vi.mock('../hooks/useEntryGuide', () => ({
  ENTRY_GUIDE: { writeTrace: 'write' },
  useEntryGuide: vi.fn(),
  praiseLang: () => 'ko',
}));
vi.mock('@/features/games/hooks/useGameAudio', () => ({
  useGameAudio: () => ({
    playAudio: audio,
    playCorrectSequence: ({ onDone }: { onDone?: () => void }) => onDone?.(),
    praiseVisible: false,
    stopAll: vi.fn(),
  }),
}));
afterEach(() => vi.clearAllMocks());
vi.mock('@/features/phonics/components/LetterFillCanvas', () => ({
  LetterFillCanvas: ({
    letter,
    onResult,
    guidance,
  }: {
    letter: string;
    onResult: (passed: boolean) => void;
    guidance?: string;
  }) => (
    <button aria-label={`쓰기 ${letter}`} data-guidance={guidance} onClick={() => onResult(true)}>
      {letter}
    </button>
  ),
}));

describe('모음 모양 쓰기와 발음 분리', () => {
  it('세 번 모두 새 캔버스에 쓰고 마지막 발음이 끝나야 완료한다', async () => {
    const complete = vi.fn();
    let ended: (() => void) | undefined;
    audio.mockImplementation((_url, onEnded) => {
      ended = onEnded;
    });
    render(
      <VowelWriteActivity
        unitId="kr-v1-u01"
        repetitions={3}
        vowels={[{ vowel: 'ㅏ', syllable: '아', writeLetter: 'ㅏ' }]}
        onComplete={complete}
        onBack={vi.fn()}
      />
    );
    for (let round = 1; round <= 3; round++) {
      const canvas = screen.getByRole('button', { name: '쓰기 ㅏ' });
      expect(canvas).toHaveAttribute('data-guidance', ['demo', 'hint', 'independent'][round - 1]);
      fireEvent.click(canvas);
      // A duplicate pass while the sound plays must not consume another round.
      fireEvent.click(canvas);
      expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe(String(round));
      await waitFor(() => expect(audio).toHaveBeenCalledTimes(round));
      expect(complete).not.toHaveBeenCalled();
      // Do not switch hints/redraw the finished paper before pronunciation ends.
      expect(canvas).toHaveAttribute('data-guidance', ['demo', 'hint', 'independent'][round - 1]);
      await act(async () => ended?.());
      if (round < 3) {
        await waitFor(() =>
          expect(screen.getByRole('button', { name: '쓰기 ㅏ' })).not.toBe(canvas)
        );
        expect(complete).not.toHaveBeenCalled();
      }
    }
    await waitFor(() => expect(complete).toHaveBeenCalledTimes(1));
    audio.mockImplementation((_url, onEnded) => onEnded?.());
  });
  it('병음/음절 쓰기는 모음 획순이나 회차별 안내를 적용하지 않는다', () => {
    render(
      <VowelWriteActivity
        unitId="zh-test"
        language="zh"
        vowels={[{ vowel: 'a', syllable: 'a' }]}
        onComplete={vi.fn()}
        onBack={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: '쓰기 a' })).toHaveAttribute('data-guidance', 'none');
  });
  it('완료 표시는 음원 응답 전 갱신하고 다른 모음 선택 후 늦은 응답은 무시한다', async () => {
    let resolve!: (url: string) => void;
    tts.mockImplementationOnce(
      () =>
        new Promise<string>((r) => {
          resolve = r;
        })
    );
    render(
      <VowelWriteActivity
        unitId="kr-test"
        vowels={[
          { vowel: 'ㅏ', syllable: '아', writeLetter: 'ㅏ' },
          { vowel: 'ㅓ', syllable: '어', writeLetter: 'ㅓ' },
        ]}
        onComplete={vi.fn()}
        onBack={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: '쓰기 ㅏ' }));
    expect(screen.getAllByRole('button').find((b) => b.textContent?.includes('✓'))).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'ㅓ' }));
    await act(async () => resolve('blob:old'));
    expect(screen.getByRole('button', { name: '쓰기 ㅓ' })).toBeVisible();
    expect(audio).not.toHaveBeenCalled();
  });
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

it.each(['ㄱ', 'ㄲ', 'ㅞ'])(
  '%s 낱자 쓰기도 3회 시범→힌트→독립, 발음과 완료 연결',
  async (letter) => {
    const complete = vi.fn();
    render(
      <VowelWriteActivity
        unitId="kr-test"
        repetitions={3}
        vowels={[{ vowel: letter, syllable: letter, writeLetter: letter }]}
        onComplete={complete}
        onBack={vi.fn()}
      />
    );
    for (const mode of ['demo', 'hint', 'independent']) {
      const paper = screen.getByRole('button', { name: `쓰기 ${letter}` });
      expect(paper).toHaveAttribute('data-guidance', mode);
      fireEvent.click(paper);
      if (mode !== 'independent')
        await waitFor(() =>
          expect(screen.getByRole('button', { name: `쓰기 ${letter}` })).not.toBe(paper)
        );
    }
    await waitFor(() => expect(complete).toHaveBeenCalledTimes(1));
  }
);
