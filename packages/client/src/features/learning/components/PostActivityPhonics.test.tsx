import { expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { PostActivityPhonics } from './PostActivityPhonics';
vi.mock('@/features/access/components/PhonicsUnitGate', () => ({
  PhonicsUnitGate: ({ unitId, children }: { unitId: string; children: ReactNode }) => (
    <div data-testid="gate" data-unit={unitId}>
      {children}
    </div>
  ),
}));
vi.mock('@/features/phonics-learner/components/KoreanPhonicsActivityPage', () => ({
  KoreanPhonicsActivity: ({ onExit }: { onExit: () => void }) => (
    <button onClick={onExit}>활동 완료</button>
  ),
}));
it('keeps context and allows declining a suggestion without navigating', () => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
  };
  const close = vi.fn();
  render(
    <MemoryRouter>
      <PostActivityPhonics
        word="오리"
        target={{ id: 'kr-h1-u05', title: 'ㄹ', lang: 'ko' }}
        onClose={close}
      />
    </MemoryRouter>
  );
  fireEvent.click(screen.getByRole('button', { name: '독후활동 계속하기' }));
  expect(close).toHaveBeenCalledTimes(1);
  expect(screen.queryByTestId('gate')).toBeNull();
});
it('opens a gated related unit and calls the same return handler on activity completion', async () => {
  const close = vi.fn();
  render(
    <MemoryRouter>
      <PostActivityPhonics
        word="오리"
        target={{ id: 'kr-h1-u05', title: 'ㄹ', lang: 'ko' }}
        onClose={close}
      />
    </MemoryRouter>
  );
  fireEvent.click(screen.getByRole('button', { name: '글자 놀이 해보기' }));
  expect(screen.getByTestId('gate')).toHaveAttribute('data-unit', 'kr-h1-u05');
  fireEvent.click(await screen.findByRole('button', { name: '활동 완료' }));
  expect(close).toHaveBeenCalledTimes(1);
});
