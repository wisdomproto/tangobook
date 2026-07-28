import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ConsonantWriteActivity } from './ConsonantWriteActivity';

vi.mock('@/features/tts', () => ({ resolveTtsUrl: vi.fn(async () => 'blob:tts') }));
vi.mock('@/features/games/hooks/useGameAudio', () => ({
  useGameAudio: () => ({
    playAudio: (_u: string, e?: () => void) => e?.(),
    playCorrectSequence: (o?: { onDone?: () => void }) => o?.onDone?.(),
    praiseVisible: false,
  }),
}));
vi.mock('../hooks/usePhonicsTtsWarm', () => ({ usePhonicsTtsWarm: vi.fn() }));
vi.mock('../hooks/useLogSyllable', () => ({ useLogSyllable: () => vi.fn() }));
// 캔버스 자체는 이 테스트의 관심사가 아니다 — 두 칸이 어느 방향으로 놓이는지만 본다.
vi.mock('@/features/phonics/components/LetterFillCanvas', () => ({
  LetterFillCanvas: () => <div data-testid="canvas" />,
}));

/** 두 칸을 감싼 배치 컨테이너 (`transition-all` 을 가진 유일한 요소). */
function layout(container: HTMLElement) {
  return container.querySelector('.transition-all')!;
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
