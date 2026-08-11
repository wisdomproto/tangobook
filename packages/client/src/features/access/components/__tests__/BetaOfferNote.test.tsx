import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TRIAL_DAYS } from '@tangobook/shared';
import { BetaOfferNote } from '../BetaOfferNote';

/**
 * 🔴 화면의 일수와 판정의 일수가 갈리면 안 된다(2026-08-11). 예전엔 문구에 「1년 무료」를 박아 두고
 *    판정은 별도 상수가 했다 — 한쪽만 바꾸면 화면이 거짓말을 한다. 이제 둘 다 `TRIAL_DAYS` 다.
 */
describe('BetaOfferNote', () => {
  it('무료 일수를 판정과 같은 상수에서 가져온다', () => {
    render(<BetaOfferNote />);
    expect(screen.getByText(new RegExp(`${TRIAL_DAYS}일`))).toBeInTheDocument();
  });

  it('마감 날짜는 말하지 않는다 — 약속하면 접을 때 발목을 잡는다', () => {
    render(<BetaOfferNote />);
    const note = screen.getByText(new RegExp(`${TRIAL_DAYS}일`));
    expect(note.textContent).not.toMatch(/20\d\d년|\d+월/);
  });
});
