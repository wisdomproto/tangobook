import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BetaOfferNote } from '../BetaOfferNote';

/**
 * 🔴 오퍼 마감이 지나면 스스로 사라져야 한다 — 안 그러면 2027년에도
 * "가입하면 1년 무료" 라는 거짓말이 로그인 화면에 남는다.
 */
describe('BetaOfferNote', () => {
  afterEach(() => vi.useRealTimers());

  it('마감 전에는 베타라는 사실만 알리고 날짜는 말하지 않는다', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-07-25T00:00:00+09:00'));
    render(<BetaOfferNote />);
    // ko 고정(test/setup) — "베타 기간에 가입하면 1년 무료!"
    const note = screen.getByText(/베타 기간.*1년 무료/);
    expect(note).toBeInTheDocument();
    // 날짜를 약속하면 오퍼를 접을 때 그 약속이 발목을 잡는다.
    expect(note.textContent).not.toMatch(/20\d\d|\d+월|\d+일/);
  });

  it('마감 뒤에는 아무것도 그리지 않는다', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2027-01-01T00:00:00+09:00'));
    const { container } = render(<BetaOfferNote />);
    expect(container).toBeEmptyDOMElement();
  });
});
