import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BetaOfferNote } from '../BetaOfferNote';

/**
 * 🔴 오퍼 마감이 지나면 스스로 사라져야 한다 — 안 그러면 2027년에도
 * "2026년 12월 31일까지 가입하면 1년 무료" 라는 거짓말이 로그인 화면에 남는다.
 */
describe('BetaOfferNote', () => {
  afterEach(() => vi.useRealTimers());

  it('마감 전에는 마감일을 안내한다', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-07-25T00:00:00+09:00'));
    render(<BetaOfferNote />);
    // ko 고정(test/setup) — "2026년 12월 31일까지 가입하면 1년 무료!"
    expect(screen.getByText(/2026.*12.*31.*1년 무료/)).toBeInTheDocument();
  });

  it('마감 뒤에는 아무것도 그리지 않는다', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2027-01-01T00:00:00+09:00'));
    const { container } = render(<BetaOfferNote />);
    expect(container).toBeEmptyDOMElement();
  });
});
