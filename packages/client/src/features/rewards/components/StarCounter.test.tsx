import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StarCounter } from './StarCounter';

vi.mock('../hooks/useStarBalance', () => ({
  useStarBalance: vi.fn(),
}));
import { useStarBalance } from '../hooks/useStarBalance';

describe('StarCounter', () => {
  it('balance 0 일 때 0 표시', () => {
    (useStarBalance as any).mockReturnValue({
      data: { profile_id: 'p1', stars_total: 0, streak_days: 0, last_active_date: null },
    });
    render(<StarCounter />);
    expect(screen.getByTestId('star-count')).toHaveTextContent('0');
  });

  it('balance 42 + streak 3일 표시', () => {
    (useStarBalance as any).mockReturnValue({
      data: { profile_id: 'p1', stars_total: 42, streak_days: 3, last_active_date: '2026-04-30' },
    });
    render(<StarCounter />);
    expect(screen.getByTestId('star-count')).toHaveTextContent('42');
    expect(screen.getByLabelText(/연속 3일/)).toHaveTextContent('3');
  });

  it('streak 0이면 streak 표시 X', () => {
    (useStarBalance as any).mockReturnValue({
      data: { profile_id: 'p1', stars_total: 5, streak_days: 0, last_active_date: null },
    });
    render(<StarCounter />);
    expect(screen.queryByLabelText(/연속/)).not.toBeInTheDocument();
  });

  it('data 없을 때 (게스트 모드) null 렌더', () => {
    (useStarBalance as any).mockReturnValue({ data: undefined });
    const { container } = render(<StarCounter />);
    expect(container.firstChild).toBeNull();
  });
});
