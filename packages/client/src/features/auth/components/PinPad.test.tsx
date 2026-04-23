import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PinPad } from './PinPad';

describe('PinPad', () => {
  it('숫자 4개 탭 → onComplete(문자열) 1회 호출', () => {
    const onComplete = vi.fn();
    render(<PinPad onComplete={onComplete} />);
    ['1', '2', '3', '4'].forEach((n) => {
      fireEvent.click(screen.getByRole('button', { name: n }));
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith('1234');
  });

  it('⌫ 버튼 → 마지막 입력 제거 (onComplete 호출 없음)', () => {
    const onComplete = vi.fn();
    render(<PinPad onComplete={onComplete} />);
    ['1', '2', '3'].forEach((n) => fireEvent.click(screen.getByRole('button', { name: n })));
    fireEvent.click(screen.getByLabelText('backspace'));
    fireEvent.click(screen.getByRole('button', { name: '4' }));
    expect(onComplete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '5' }));
    expect(onComplete).toHaveBeenCalledWith('1245');
  });

  it('error prop true → shake 클래스 적용 + 입력 클리어', () => {
    const { rerender, container } = render(<PinPad onComplete={() => {}} error={false} />);
    const indicators = container.querySelector('[data-testid="pin-indicators"]');
    expect(indicators?.className).not.toContain('animate-shake');
    rerender(<PinPad onComplete={() => {}} error={true} />);
    expect(container.querySelector('[data-testid="pin-indicators"]')?.className).toContain(
      'animate-shake'
    );
  });
});
