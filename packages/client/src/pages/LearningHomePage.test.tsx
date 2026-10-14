import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, Link, useNavigate } from 'react-router-dom';
import type { StorybookSummary } from '@tangobook/shared';
import LearningHomePage from './LearningHomePage';
import KoreanPhonicsStudyPage from '@/features/phonics-learner/components/KoreanPhonicsStudyPage';
import EnglishPhonicsStudyPage from '@/features/phonics-learner/components/EnglishPhonicsStudyPage';
import {
  getUnitProgress,
  markActivityCompleted,
} from '@/features/phonics-learner/lib/progress-store';
import {
  markJourneyStarted,
  journeyUnits,
  journeyActivities,
} from '@/features/phonics-learner/lib/learning-journey';

const auth = vi.hoisted(() => ({ profile: null as string | null }));
const catalogue = vi.hoisted(() => ({
  books: [] as StorybookSummary[],
  loading: false,
  error: false,
  refetch: vi.fn(),
}));
vi.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: () => ({ activeProfile: auth.profile ? { id: auth.profile } : null }),
}));
vi.mock('@/features/storybook/hooks/useStorybooks', () => ({
  useStorybooks: () => ({
    data: catalogue.books,
    isLoading: catalogue.loading,
    isError: catalogue.error,
    refetch: catalogue.refetch,
  }),
}));
vi.mock('@/features/library/hooks/useBookGroups', () => ({
  useBookGroups: () => ({ data: undefined }),
}));
vi.mock('@/features/library/hooks/useLibraryConfig', () => ({
  useLibraryConfig: () => ({ data: undefined }),
}));
vi.mock('@/design-system/primitives/BookCover', () => ({ BookCover: () => <span>표지</span> }));

const showHome = () =>
  render(
    <MemoryRouter initialEntries={['/library']}>
      <Routes>
        <Route path="/library" element={<LearningHomePage />} />
        <Route path="/library/phonics/:lang" element={<p>언어 안에서 모드를 골라요</p>} />
      </Routes>
    </MemoryRouter>
  );
beforeEach(() => {
  localStorage.clear();
  auth.profile = null;
  catalogue.books = [];
  catalogue.loading = false;
  catalogue.error = false;
  catalogue.refetch.mockClear();
});
describe('whole language cards lead to the language entry', () => {
  it.each(['한글 파닉스', '영어 파닉스'])(
    'makes the complete %s card one link without nested actions',
    (name) => {
      showHome();
      const link = screen.getByRole('link', { name });
      expect(link).toHaveAttribute(
        'href',
        '/library/phonics/' + (name === '한글 파닉스' ? 'korean' : 'english')
      );
      expect(within(link).getByRole('heading', { name })).toBeDefined();
      expect(link.querySelector('a,button')).toBeNull();
      expect(screen.queryByRole('link', { name: /이어서 학습하기|모드 선택|시작하기/ })).toBeNull();
      fireEvent.click(link);
      expect(screen.getByText('언어 안에서 모드를 골라요')).toBeDefined();
    }
  );
  it('keeps the same language entry for a returning learner and preserves progress', () => {
    markJourneyStarted('korean');
    markActivityCompleted('korean', 'kr-v1-u01', 'listen-1');
    showHome();
    expect(screen.getByRole('link', { name: '한글 파닉스' })).toHaveAttribute(
      'href',
      '/library/phonics/korean'
    );
    expect(screen.queryByText('ㅏ 배우기')).toBeNull();
    expect(screen.getByRole('link', { name: '한글 파닉스 · 이어서 학습하기' })).toHaveAttribute(
      'href',
      '/library/phonics/korean/kr-v1-u01/write-1?mode=curriculum'
    );
    expect(screen.queryByRole('link', { name: '영어 파닉스 · 이어서 학습하기' })).toBeNull();
    expect(getUnitProgress('korean', 'kr-v1-u01').completedActivities).toEqual(['listen-1']);
  });
});
describe('recommendation shuffle', () => {
  it('shows a different set of public books after every click without fetching or changing course progress', () => {
    catalogue.books = Array.from(
      { length: 12 },
      (_, i) =>
        ({
          id: String(i),
          title: '책 ' + i,
          isPublic: true,
          category: '세계 명작',
        }) as StorybookSummary
    );
    showHome();
    const recommendations = screen.getByRole('region', { name: '오늘의 추천 도서' });
    const ids = () =>
      within(recommendations)
        .getAllByRole('link')
        .filter((link) => link.getAttribute('href') !== '/library/books')
        .map((link) => link.getAttribute('href'));
    let previous = ids();
    expect(previous).toHaveLength(3);
    for (let i = 0; i < 3; i++) {
      fireEvent.click(screen.getByRole('button', { name: '추천 도서 다시 뽑기' }));
      const next = ids();
      expect(next).toHaveLength(3);
      expect(next.every((id) => !previous.includes(id))).toBe(true);
      previous = next;
    }
    expect(catalogue.refetch).not.toHaveBeenCalled();
    expect(getUnitProgress('korean', 'kr-v1-u01').completedActivities).toEqual([]);
  });
  it('disables shuffle while loading or on an empty catalogue', () => {
    const view = showHome();
    expect(screen.getByRole('button', { name: '추천 도서 다시 뽑기' })).toBeDisabled();
    catalogue.loading = true;
    view.rerender(
      <MemoryRouter>
        <LearningHomePage />
      </MemoryRouter>
    );
    expect(screen.getByRole('button', { name: '추천 도서 다시 뽑기' })).toBeDisabled();
  });
});

it('resumes the first interrupted activity without manufacturing completion', () => {
  markJourneyStarted('english');
  showHome();
  expect(
    screen.getByRole('link', { name: '영어 파닉스 · 이어서 학습하기' }).getAttribute('href')
  ).toContain('en-b1-u01/');
  expect(getUnitProgress('english', 'en-b1-u01').completedActivities).toEqual([]);
});

it('hides a completed course resume and isolates the active child', () => {
  auth.profile = 'child-a';
  localStorage.setItem('tangobook:activeProfileId', 'child-a');
  markJourneyStarted('korean');
  for (const unit of journeyUnits('korean'))
    for (const activity of journeyActivities('korean', unit.id))
      markActivityCompleted('korean', unit.id, activity.key);
  markJourneyStarted('english');
  const view = showHome();
  expect(screen.queryByRole('link', { name: '한글 파닉스 · 이어서 학습하기' })).toBeNull();
  expect(screen.getByRole('link', { name: '영어 파닉스 · 이어서 학습하기' })).toBeDefined();
  auth.profile = 'child-b';
  localStorage.setItem('tangobook:activeProfileId', 'child-b');
  view.rerender(
    <MemoryRouter>
      <LearningHomePage />
    </MemoryRouter>
  );
  expect(screen.queryByRole('link', { name: /이어서 학습하기/ })).toBeNull();
});

it('updates real page metadata across Korean, English, Home and browser Back without a reload', () => {
  function Navigation() {
    const navigate = useNavigate();
    return (
      <nav>
        <Link to="/library/phonics/english">영어로 이동</Link>
        <Link to="/library">홈으로 이동</Link>
        <button onClick={() => navigate(-1)}>브라우저 뒤로</button>
      </nav>
    );
  }
  render(
    <MemoryRouter initialEntries={['/library/phonics/korean']}>
      <Navigation />
      <Routes>
        <Route path="/library" element={<LearningHomePage />} />
        <Route path="/library/phonics/korean" element={<KoreanPhonicsStudyPage />} />
        <Route path="/library/phonics/english" element={<EnglishPhonicsStudyPage />} />
      </Routes>
    </MemoryRouter>
  );
  const check = (title: string, path: string) => {
    expect(document.title).toBe(title);
    expect(document.querySelector('meta[property="og:title"]')).toHaveAttribute('content', title);
    expect(document.querySelector('meta[name="twitter:title"]')).toHaveAttribute('content', title);
    expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://www.tangobook.co.kr' + path
    );
  };
  check('한글 파닉스 학습 — 탱고북', '/library/phonics/korean');
  fireEvent.click(screen.getByRole('link', { name: '영어로 이동' }));
  check('영어 파닉스 학습 — 탱고북', '/library/phonics/english');
  expect(document.querySelector('script[data-seo-jsonld]')?.textContent).toContain(
    '"inLanguage":["en"]'
  );
  fireEvent.click(screen.getByRole('link', { name: '홈으로 이동' }));
  check('학습 홈 — 탱고북', '/library');
  expect(document.querySelector('script[data-seo-jsonld]')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: '브라우저 뒤로' }));
  check('영어 파닉스 학습 — 탱고북', '/library/phonics/english');
});
