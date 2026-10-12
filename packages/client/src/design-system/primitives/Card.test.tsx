import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Card } from './Card';

describe('Card keyboard contract', () => {
  it('display cards stay outside the tab order', () => {
    render(<Card>책 정보</Card>);
    expect(screen.getByText('책 정보')).not.toHaveAttribute('role');
    expect(screen.getByText('책 정보')).not.toHaveAttribute('tabindex');
  });
  it('interactive cards activate with Enter and Space', () => {
    const click = vi.fn();
    render(
      <Card interactive onClick={click}>
        책 선택
      </Card>
    );
    const card = screen.getByRole('button', { name: '책 선택' });
    expect(card).toHaveAttribute('tabindex', '0');
    fireEvent.keyDown(card, { key: 'Enter' });
    fireEvent.keyDown(card, { key: ' ' });
    expect(click).toHaveBeenCalledTimes(2);
  });
  it('does not activate the card from a nested control or cancelled key', () => {
    const click = vi.fn();
    render(
      <Card interactive onClick={click} onKeyDown={(event) => event.preventDefault()}>
        책 <button type="button">도움</button>
      </Card>
    );
    fireEvent.keyDown(screen.getByRole('button', { name: '도움' }), { key: 'Enter' });
    fireEvent.keyDown(screen.getByRole('button', { name: '책 도움' }), { key: ' ' });
    expect(click).not.toHaveBeenCalled();
  });
});
