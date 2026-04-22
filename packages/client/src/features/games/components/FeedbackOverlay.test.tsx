import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { FeedbackOverlay } from './FeedbackOverlay';

// canvas-confetti는 jsdom에서 canvas 컨텍스트가 없어 실패하므로 no-op 모킹
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

describe('FeedbackOverlay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing when visible=false', () => {
    const { container } = render(<FeedbackOverlay kind="correct" visible={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders correct kind when visible', () => {
    render(<FeedbackOverlay kind="correct" visible={true} />);
    const text = screen.getByTestId('feedback-text').textContent ?? '';
    expect(['잘했어!', '정답!', '최고야!', '멋져!']).toContain(text);
  });

  it('renders incorrect kind message', () => {
    render(<FeedbackOverlay kind="incorrect" visible={true} />);
    const text = screen.getByTestId('feedback-text').textContent ?? '';
    expect(['다시 해볼까?', '괜찮아', '한 번 더!']).toContain(text);
  });

  it('calls onDismiss after durationMs', () => {
    const onDismiss = vi.fn();
    render(
      <FeedbackOverlay kind="correct" visible={true} durationMs={500} onDismiss={onDismiss} />
    );
    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(onDismiss).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(2);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('works without onDismiss (optional)', () => {
    expect(() =>
      render(<FeedbackOverlay kind="correct" visible={true} durationMs={500} />)
    ).not.toThrow();
    act(() => {
      vi.advanceTimersByTime(600);
    });
  });
});
