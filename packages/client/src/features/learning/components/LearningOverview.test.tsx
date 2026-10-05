import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { LearningEvent } from '@tangobook/shared';
import { LearningOverview } from './LearningOverview';
const events: LearningEvent[] = [
  {
    id: 'ex',
    profile_id: 'p',
    event_type: 'word_exposed',
    word: '오리',
    storybook_id: 'book',
    game_type: null,
    metadata: { lang: 'ko', source: 'storybook' },
    created_at: new Date().toISOString(),
  },
  {
    id: 'game',
    profile_id: 'p',
    event_type: 'word_correct',
    word: '오리',
    storybook_id: 'book',
    game_type: 'korean-block',
    metadata: { lang: 'ko', skill: 'building', source: 'storybook' },
    created_at: new Date().toISOString(),
  },
];
const show = (records = events) =>
  render(
    <MemoryRouter>
      <LearningOverview events={records} storybooks={[]} />
    </MemoryRouter>
  );
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
  };
});
describe('mobile learning overview', () => {
  it('opens word evidence, separates encounters and practice, then restores focus when closed', () => {
    show();
    const row = screen.getByRole('button', { name: /오리.*노출 1회.*직접 연습 1회/ });
    row.focus();
    fireEvent.click(row);
    expect(screen.getByRole('dialog', { name: '오리' })).toBeInTheDocument();
    expect(screen.getByText('블록 조합')).toBeInTheDocument();
    expect(document.body.style.overflow).toBe('hidden');
    fireEvent.click(screen.getByRole('button', { name: '닫기' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(row);
    expect(document.body.style.overflow).not.toBe('hidden');
  });
  it('searches words and distinguishes filter emptiness from no history', () => {
    show();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '없는낱말' } });
    expect(screen.getByText('조건에 맞는 낱말이 없어요.')).toBeInTheDocument();
    expect(screen.queryByText('아직 이 언어의 낱말 기록이 없어요.')).toBeNull();
  });
  it('changes learning language without mixing records or leaving another language’s details open', () => {
    show();
    fireEvent.click(screen.getByRole('button', { name: /오리.*노출/ }));
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'en' } });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByText('아직 이 언어의 낱말 기록이 없어요.')).toBeInTheDocument();
  });
  it('shows the empty state and library entry for first-time use', () => {
    show([]);
    expect(screen.getByText('첫 이야기를 함께 만나볼까요?')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /이야기 보러 가기/ })[0]).toHaveAttribute(
      'href',
      '/library'
    );
  });
});
