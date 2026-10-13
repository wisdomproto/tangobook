import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LearningHomePage from './LearningHomePage';
import { markActivityCompleted } from '@/features/phonics-learner/lib/progress-store';
import { markJourneyStarted } from '@/features/phonics-learner/lib/learning-journey';

vi.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: () => ({ activeProfile: null }),
}));
vi.mock('@/features/storybook/hooks/useStorybooks', () => ({
  useStorybooks: () => ({ data: [], isLoading: false }),
}));
vi.mock('@/features/library/hooks/useBookGroups', () => ({
  useBookGroups: () => ({ data: undefined }),
}));
vi.mock('@/features/library/hooks/useLibraryConfig', () => ({
  useLibraryConfig: () => ({ data: undefined }),
}));

const showHome = () =>
  render(
    <MemoryRouter>
      <LearningHomePage />
    </MemoryRouter>
  );

describe('language cards contain the correct learning entry', () => {
  beforeEach(() => localStorage.clear());
  it('lets a new learner choose a mode separately inside each language', () => {
    showHome();
    expect(
      within(screen.getByRole('region', { name: '한글' })).getByRole('link', { name: '시작하기' })
    ).toHaveAttribute('href', '/library/phonics/korean');
    expect(
      within(screen.getByRole('region', { name: '영어' })).getByRole('link', { name: '시작하기' })
    ).toHaveAttribute('href', '/library/phonics/english');
    expect(screen.queryByRole('link', { name: '이어서 학습하기' })).toBeNull();
  });
  it('resumes the actual unfinished activity and keeps mode selection available', () => {
    markJourneyStarted('korean');
    markActivityCompleted('korean', 'kr-v1-u01', 'listen-1');
    showHome();
    const korean = within(screen.getByRole('region', { name: '한글' }));
    expect(korean.getByRole('link', { name: '이어서 학습하기' })).toHaveAttribute(
      'href',
      '/library/phonics/korean/kr-v1-u01/write-1?mode=curriculum'
    );
    expect(korean.getByRole('link', { name: '모드 선택' })).toHaveAttribute(
      'href',
      '/library/phonics/korean'
    );
    expect(
      within(screen.getByRole('region', { name: '영어' })).getByRole('link', { name: '시작하기' })
    ).toHaveAttribute('href', '/library/phonics/english');
    expect(document.querySelector('a a')).toBeNull();
  });
  it('does not show another child’s resume link', () => {
    markJourneyStarted('korean');
    localStorage.setItem('tangobook:activeProfileId', 'another-child');
    showHome();
    expect(screen.queryByRole('link', { name: '이어서 학습하기' })).toBeNull();
  });
});
