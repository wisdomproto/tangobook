import { afterEach, describe, it, expect, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ConsonantWriteActivity } from './ConsonantWriteActivity';
import { resolveTtsUrl } from '@/features/tts';

vi.mock('@/features/tts', () => ({ resolveTtsUrl: vi.fn(async () => 'blob:tts') }));
vi.mock('@/features/games/hooks/useGameAudio', () => ({
  useGameAudio: () => ({
    playAudio: (_u: string, e?: () => void) => e?.(),
    playCorrectSequence: (o?: { onDone?: () => void }) => o?.onDone?.(),
    praiseVisible: false,
    stopAll: vi.fn(),
  }),
}));
vi.mock('../hooks/usePhonicsTtsWarm', () => ({ usePhonicsTtsWarm: vi.fn() }));
vi.mock('../hooks/useLogSyllable', () => ({ useLogSyllable: () => vi.fn() }));
// 캔버스 자체는 이 테스트의 관심사가 아니다 — 두 칸이 어느 방향으로 놓이는지만 본다.
vi.mock('@/features/phonics/components/LetterFillCanvas', () => ({
  LetterFillCanvas: ({
    letter,
    onResult,
  }: {
    letter: string;
    onResult: (passed: boolean) => void;
  }) => (
    <button data-testid="canvas" onClick={() => onResult(true)}>
      {letter} 쓰기 완료
    </button>
  ),
}));

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

/** 두 칸을 감싼 배치 컨테이너. */
function layout(container: HTMLElement) {
  return container.querySelector('.phonics-write-blend-stage')!;
}

function renderWith(vowel: string) {
  const { container } = render(
    <ConsonantWriteActivity
      unitId="kr-h1-u02"
      consonant="ㄱ"
      blendVowels={[vowel]}
      onComplete={vi.fn()}
      onBack={vi.fn()}
    />
  );
  return layout(container).className;
}

describe('ConsonantWriteActivity 배치 방향', () => {
  it('쓰기 두 칸을 모두 마친 후 이동380ms·쉼220ms로 읽고, 이탈하면 예약을 지운다', async () => {
    vi.useFakeTimers();
    const props = {
      unitId: 'kr-h1-u02',
      consonant: 'ㄱ',
      blendVowels: ['ㅏ'],
      onComplete: vi.fn(),
      onBack: vi.fn(),
    };
    const view = render(<ConsonantWriteActivity {...props} />);
    await act(async () => fireEvent.click(screen.getByTestId('canvas')));
    await act(async () => fireEvent.click(screen.getByTestId('canvas')));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(379);
    });
    expect(layout(view.container).textContent).toBe('ㄱㅏ');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(layout(view.container).textContent).toBe('가');
    expect(resolveTtsUrl).not.toHaveBeenCalledWith(expect.objectContaining({ text: 'ㄱ ㅏ 가' }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(220);
    });
    expect(resolveTtsUrl).toHaveBeenCalledWith(expect.objectContaining({ text: 'ㄱ ㅏ 가' }));
    view.unmount();
    vi.clearAllMocks();
    const other = render(<ConsonantWriteActivity {...props} />);
    await act(async () => fireEvent.click(screen.getByTestId('canvas')));
    await act(async () => fireEvent.click(screen.getByTestId('canvas')));
    other.unmount();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });
    expect(resolveTtsUrl).not.toHaveBeenCalledWith(expect.objectContaining({ text: 'ㄱ ㅏ 가' }));
  });
  it('수직 모음은 위·아래로 쌓는다', () => {
    // 🔴 ㅗㅛㅜㅠㅡ 는 자음 **아래**에 붙는다. 옆으로 두면 합쳐지는 방향을 거꾸로 가르친다.
    for (const v of ['ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ']) {
      expect(renderWith(v), `${v} 는 세로여야 한다`).toContain('flex-col');
    }
  });

  it('가로 모음은 옆으로 둔다', () => {
    for (const v of ['ㅏ', 'ㅑ', 'ㅓ', 'ㅕ', 'ㅣ']) {
      expect(renderWith(v), `${v} 는 가로여야 한다`).not.toContain('flex-col');
    }
  });

  it('받침은 언제나 세로다', () => {
    const { container } = render(
      <ConsonantWriteActivity
        unitId="kr-h2-u01"
        consonant="ㅇ"
        coda="ㅇ"
        codaOnsets={['ㄱ']}
        onComplete={vi.fn()}
        onBack={vi.fn()}
      />
    );
    expect(layout(container).className).toContain('flex-col');
  });
});
