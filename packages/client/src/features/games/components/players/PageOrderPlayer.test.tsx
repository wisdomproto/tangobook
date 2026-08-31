import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { KoreanPageOrderData } from '@tangobook/shared';
import { PageOrderPlayer } from './PageOrderPlayer';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
// 셔플을 끄면 트레이 순서 = 정답 순서라 「몇 번째 그림을 눌렀나」로 검증할 수 있다.
vi.mock('../../utils/shuffle', () => ({ shuffle: (a: unknown[]) => [...a] }));

const data: KoreanPageOrderData = {
  type: 'korean-page-order',
  items: [1, 5, 9, 13].map((n) => ({ pageNumber: n, illustrationUrl: `https://cdn/p${n}.webp` })),
};

function setup() {
  const onComplete = vi.fn();
  render(
    <MemoryRouter>
      <PageOrderPlayer
        storybookId="b1"
        gameData={data}
        difficulty="medium"
        onComplete={onComplete}
        onBack={vi.fn()}
      />
    </MemoryRouter>
  );
  const tray = () => screen.getAllByLabelText('그림 고르기');
  return { onComplete, tray };
}

describe('PageOrderPlayer', () => {
  it('순서대로 다 누르면 만점으로 끝난다', () => {
    const { onComplete, tray } = setup();
    [0, 1, 2, 3].forEach((i) => fireEvent.click(tray()[i]));
    expect(onComplete).toHaveBeenCalledWith(4, 4);
  });

  it('한 번 틀린 자리는 점수를 안 준다 — 그 뒤 자리는 그대로 받는다', () => {
    const { onComplete, tray } = setup();
    fireEvent.click(tray()[2]); // 첫 자리에서 오답
    [0, 1, 2, 3].forEach((i) => fireEvent.click(tray()[i]));
    expect(onComplete).toHaveBeenCalledWith(3, 4);
  });

  it('틀린 그림은 자리를 차지하지 않는다', () => {
    const { onComplete, tray } = setup();
    fireEvent.click(tray()[3]);
    fireEvent.click(tray()[3]);
    expect(onComplete).not.toHaveBeenCalled();
    [0, 1, 2, 3].forEach((i) => fireEvent.click(tray()[i]));
    expect(onComplete).toHaveBeenCalledWith(3, 4);
  });

  it('이미 놓은 그림은 다시 못 누른다', () => {
    const { onComplete, tray } = setup();
    fireEvent.click(tray()[0]);
    expect(tray()[0]).toBeDisabled();
    [1, 2, 3].forEach((i) => fireEvent.click(tray()[i]));
    expect(onComplete).toHaveBeenCalledWith(4, 4);
  });
});
