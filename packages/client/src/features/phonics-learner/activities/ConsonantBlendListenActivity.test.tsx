import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ConsonantBlendListenActivity } from './ConsonantBlendListenActivity';

const spies = vi.hoisted(() => ({ tts: vi.fn(async () => 'blob:tts'), log: vi.fn() }));
vi.mock('@/features/tts', () => ({ resolveTtsUrl: spies.tts }));
vi.mock('@/features/games/hooks/useGameAudio', () => ({
  useGameAudio: () => ({
    playAudio: (_url: string, ended?: () => void) => ended?.(),
    playCorrectSequence: (options?: { onDone?: () => void }) => options?.onDone?.(),
    praiseVisible: false,
  }),
}));
vi.mock('../hooks/usePhonicsTtsWarm', () => ({ usePhonicsTtsWarm: vi.fn() }));
vi.mock('../hooks/useEntryGuide', () => ({
  useEntryGuide: vi.fn(),
  ENTRY_GUIDE: { tap: '' },
  praiseLang: () => 'ko',
}));
vi.mock('../hooks/useLogSyllable', () => ({ useLogSyllable: () => spies.log }));
vi.mock('@/features/games/effects/learning-effects', () => ({ emitLearningEffect: vi.fn() }));

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

async function tap(name: string) {
  await act(async () => fireEvent.click(screen.getByRole('button', { name })));
}

describe('합성 무대 조작', () => {
  it('차례인 글자만 누르며 합성 중 선택을 잠그고 소리 체인 뒤 다음 짝을 연다', async () => {
    vi.useFakeTimers();
    const complete = vi.fn();
    render(
      <ConsonantBlendListenActivity
        unitId="kr-h1-u02"
        consonant="ㄱ"
        blendVowels={['ㅏ', 'ㅗ']}
        onComplete={complete}
        onBack={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: 'ㅏ' })).toBeDisabled();
    await tap('ㄱ');
    expect(screen.getByRole('button', { name: 'ㄱ' })).toBeDisabled();
    await tap('ㅏ');
    await tap('ㄱ');
    await tap('ㅏ');
    expect(screen.getByRole('button', { name: '고 만들기' })).toBeDisabled();
    expect(complete).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1050);
    });
    expect(spies.log).toHaveBeenCalledWith('가');
    expect(screen.getByRole('button', { name: 'ㅗ' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'ㄱ' })).toBeEnabled();
    expect(screen.getByRole('button', { name: '고 만들기' })).toBeEnabled();
    expect(complete).not.toHaveBeenCalled();
  });
  it('받침은 위아래로 만나며 실제 음절을 기록하고 마지막 소리 뒤 완료한다', async () => {
    vi.useFakeTimers();
    const complete = vi.fn();
    const { container } = render(
      <ConsonantBlendListenActivity
        unitId="kr-h2-u01"
        coda="ㅇ"
        codaOnsets={['ㄱ']}
        onComplete={complete}
        onBack={vi.fn()}
      />
    );
    expect(container.querySelector('.phonics-blend-stage')).toHaveClass('flex-col');
    await tap('가');
    await tap('ㅇ');
    await tap('가');
    await tap('ㅇ');
    expect(complete).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1050);
    });
    expect(spies.log).toHaveBeenCalledWith('강');
    expect(complete).toHaveBeenCalledTimes(1);
  });
});
