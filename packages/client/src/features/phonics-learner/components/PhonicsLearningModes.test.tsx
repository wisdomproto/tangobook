import { beforeEach, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PhonicsLearningModes } from './PhonicsLearningModes';
import { markActivityCompleted } from '../lib/progress-store';

vi.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: () => ({ activeProfile: null }),
}));
beforeEach(() => localStorage.clear());
it.each(['korean', 'english'] as const)(
  'splits modes inside %s and starts directly at the current activity',
  (lang) => {
    render(
      <MemoryRouter initialEntries={[`/library/phonics/${lang}`]}>
        <PhonicsLearningModes lang={lang} />
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { name: '커리큘럼' })).toBeDefined();
    expect(screen.getByRole('heading', { name: '자유모드' })).toBeDefined();
    expect(screen.getByRole('link', { name: /학습 시작하기/ }).getAttribute('href')).toContain(
      `/${lang}/`
    );
    expect(screen.getByRole('link', { name: /학습 시작하기/ }).getAttribute('href')).toContain(
      '?mode=curriculum'
    );
    expect(screen.getByRole('link', { name: /활동 골라보기/ }).getAttribute('href')).not.toContain(
      'mode=curriculum'
    );
  }
);
it('resumes from actual completion and keeps future stages out of the link list', () => {
  markActivityCompleted('korean', 'kr-v1-g01', 'listen-1');
  render(
    <MemoryRouter initialEntries={['/library/phonics/korean?mode=curriculum']}>
      <PhonicsLearningModes lang="korean" />
    </MemoryRouter>
  );
  expect(screen.getByRole('link', { name: /이어서 학습하기/ }).getAttribute('href')).toContain(
    '/write-1?mode=curriculum'
  );
  expect(screen.queryByRole('link', { name: /ㅗ · ㅛ · ㅜ · ㅠ/ })).toBeNull();
  const expanded = document.querySelectorAll('details[open]');
  expect(expanded).toHaveLength(1);
});
