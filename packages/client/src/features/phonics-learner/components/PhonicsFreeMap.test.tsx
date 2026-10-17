import { beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { PhonicsLearningModes } from './PhonicsLearningModes';
import KoreanPhonicsStudyPage from './KoreanPhonicsStudyPage';
import EnglishPhonicsStudyPage from './EnglishPhonicsStudyPage';
import { getUnitProgress, markActivityCompleted } from '../lib/progress-store';
import { freePlayCatalog } from '../lib/free-play-catalog';

vi.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: () => ({ activeProfile: null }),
}));
vi.mock('@/lib/useSeo', () => ({ useSeo: vi.fn() }));
beforeEach(() => {
  localStorage.clear();
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
  };
});
function show(lang: 'korean' | 'english', path = `/library/phonics/${lang}?mode=free`) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={`/library/phonics/${lang}`} element={<PhonicsLearningModes lang={lang} />} />
        <Route
          path={`/library/phonics/${lang}/:unitId`}
          element={lang === 'korean' ? <KoreanPhonicsStudyPage /> : <EnglishPhonicsStudyPage />}
        />
        <Route
          path={`/library/phonics/${lang}/:unitId/:activityKey`}
          element={<p>선택한 활동</p>}
        />
      </Routes>
    </MemoryRouter>
  );
}
it.each(['korean', 'english'] as const)(
  '%s free entry is a play shelf without a map, locks or fake completion',
  (lang) => {
    const { container } = show(lang);
    expect(
      screen.getByRole('heading', {
        name: `${lang === 'korean' ? '한글' : '영어'} 파닉스 자유모드`,
      })
    ).toBeVisible();
    expect(container.querySelector('.journey-map-panel')).toBeNull();
    expect(screen.getByRole('button', { name: '블록 놀이' })).toBeEnabled();
    for (const name of [
      '글자 놀이',
      '낱말 놀이',
      '꾹꾹 누르기',
      '글자 따라쓰기',
      '소리 합치기',
      '낱말 만나기',
    ])
      expect(screen.queryByRole('button', { name })).toBeNull();
    expect(container.querySelectorAll('.free-play-game')).toHaveLength(6);
    expect(screen.queryByRole('list', { name: '순서대로 이어지는 학습 단계' })).toBeNull();
    expect(screen.queryByRole('button', { name: /잠금|앞 단계를/ })).toBeNull();
    for (const { unit } of freePlayCatalog(lang))
      expect(getUnitProgress(lang, unit.id).completedActivities).toEqual([]);
  }
);
it.each(['korean', 'english'] as const)(
  '%s chooses a game first, then any supported book and real activity',
  (lang) => {
    show(lang);
    fireEvent.click(screen.getByRole('button', { name: '블록 놀이' }));
    const picker = screen.getByRole('dialog', { name: '블록 놀이' });
    const books = within(picker).getByRole('group', { name: '배울 내용' });
    const later = within(books).getAllByRole('button').at(-1)!;
    fireEvent.click(later);
    const links = within(picker).getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
    expect(links.every((link) => !link.getAttribute('href')!.includes('mode=curriculum'))).toBe(
      true
    );
    expect(links.every((link) => !link.hasAttribute('disabled'))).toBe(true);
    fireEvent.click(links[0]);
    expect(screen.getByText('선택한 활동')).toBeVisible();
  }
);
it.each(['korean', 'english'] as const)(
  '%s word blocks retain standalone practice links and exclude English Book 1',
  (lang) => {
    show(lang);
    fireEvent.click(screen.getByRole('button', { name: '블록 놀이' }));
    const picker = screen.getByRole('dialog', { name: '블록 놀이' });
    const links = within(picker).getAllByRole('link');
    expect(
      links.every((link) => link.getAttribute('href')!.endsWith('/word-learning?part=block'))
    ).toBe(true);
    if (lang === 'english')
      expect(links.every((link) => !link.getAttribute('href')!.includes('en-b1'))).toBe(true);
    fireEvent.click(within(picker).getByRole('button', { name: '닫기' }));
    expect(picker).not.toHaveAttribute('open');
    expect(screen.getByRole('button', { name: '블록 놀이' })).toHaveFocus();
  }
);
it('legacy chapter links open the same shelf, retain its book as picker context, and keep actual completion', () => {
  markActivityCompleted('korean', 'kr-h1-u02', 'letter-write');
  show('korean', '/library/phonics/korean/kr-h1-u02');
  fireEvent.click(screen.getByRole('button', { name: '블록 놀이' }));
  const picker = screen.getByRole('dialog', { name: '블록 놀이' });
  expect(within(picker).getByRole('link', { name: /ㄱ 배우기/ })).toHaveAttribute(
    'href',
    '/library/phonics/korean/kr-h1-u02/word-learning?part=block'
  );
  expect(getUnitProgress('korean', 'kr-h1-u02').completedActivities).toEqual(['letter-write']);
});
it('old vowel chapter aliases now open only word games, without changing learning records', () => {
  show('korean', '/library/phonics/korean/kr-v1-u02');
  expect(screen.getByRole('button', { name: '블록 놀이' })).toBeEnabled();
  expect(screen.queryByRole('button', { name: '꾹꾹 누르기' })).toBeNull();
  expect(getUnitProgress('korean', 'kr-v1-g01').completedActivities).toEqual([]);
});
it('Escape closes content selection and leaves the play shelf in place', () => {
  show('korean');
  fireEvent.click(screen.getByRole('button', { name: '블록 놀이' }));
  const picker = screen.getByRole('dialog', { name: '블록 놀이' });
  fireEvent(picker, new Event('cancel', { cancelable: true }));
  expect(picker).not.toHaveAttribute('open');
  expect(screen.getByRole('button', { name: '블록 놀이' })).toHaveFocus();
});
it('curriculum retains its locked map after leaving the free shelf', () => {
  show('korean');
  fireEvent.click(screen.getByRole('link', { name: '커리큘럼 모드' }));
  expect(screen.getByRole('heading', { name: '한글 파닉스 · 학습 경로' })).toBeVisible();
  expect(screen.getByRole('button', { name: /^2번째 단계.*앞 단계를/ })).toBeDisabled();
});
