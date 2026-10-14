import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { KoreanBlockInputGate } from './KoreanBlockInputGate';

vi.mock('./GameHeader', () => ({
  GameHeader: ({ onBack }: { onBack: () => void }) => <button onClick={onBack}>뒤로 가기</button>,
}));
vi.mock('@/features/phonics-learner/components/PhonicsBackdrop', () => ({
  PhonicsBackdrop: () => null,
}));

describe('KoreanBlockInputGate', () => {
  it.each(['screen', 'camera'] as const)(
    'mounts the %s player only after choosing outside the game',
    (mode) => {
      const player = vi.fn((selected: string) => <div>player:{selected}</div>);
      render(
        <KoreanBlockInputGate total={4} onBack={vi.fn()}>
          {player}
        </KoreanBlockInputGate>
      );
      expect(player).not.toHaveBeenCalled();
      fireEvent.click(
        screen.getByRole('button', { name: mode === 'screen' ? '화면 블록' : '실물 블록' })
      );
      expect(player).toHaveBeenCalledWith(mode);
      expect(screen.getByText(`player:${mode}`)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: '실물 블록' })).not.toBeInTheDocument();
    }
  );

  it.each(['screen', 'camera'] as const)(
    'preserves the public launcher’s explicit %s choice',
    (mode) => {
      const player = vi.fn((selected: string) => <div>player:{selected}</div>);
      render(
        <KoreanBlockInputGate total={4} initialInputMode={mode} onBack={vi.fn()}>
          {player}
        </KoreanBlockInputGate>
      );
      expect(player).toHaveBeenCalledWith(mode);
      expect(screen.queryByText('어떤 블록으로 만들까요?')).not.toBeInTheDocument();
    }
  );

  it('can exit without mounting a game or camera', () => {
    const onBack = vi.fn();
    const player = vi.fn(() => null);
    render(
      <KoreanBlockInputGate total={4} onBack={onBack}>
        {player}
      </KoreanBlockInputGate>
    );
    fireEvent.click(screen.getByRole('button', { name: '뒤로 가기' }));
    expect(onBack).toHaveBeenCalledOnce();
    expect(player).not.toHaveBeenCalled();
  });
});
