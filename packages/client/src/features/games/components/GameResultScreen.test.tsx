import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { GameResultScreen } from './GameResultScreen';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
vi.mock('@/features/settings/api/settings.api', () => ({
  settingsApi: { getSystemSounds: vi.fn().mockResolvedValue({}) },
}));

describe('GameResultScreen', () => {
  it('keeps the final count readable and separates retry from exit', () => {
    const restart = vi.fn();
    const back = vi.fn();
    render(
      <MemoryRouter>
        <GameResultScreen score={2} total={4} onRestart={restart} onBack={back} />
      </MemoryRouter>
    );
    expect(screen.getByRole('region', { name: '활동 결과' })).toBeVisible();
    expect(screen.getByText('4개 중 2개 완성')).toBeInTheDocument();
    expect(back).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /다시 하기/ }));
    expect(restart).toHaveBeenCalledOnce();
    expect(back).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /확인/ }));
    expect(back).toHaveBeenCalledOnce();
  });
});
