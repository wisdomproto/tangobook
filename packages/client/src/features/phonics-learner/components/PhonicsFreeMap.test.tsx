import { beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { PhonicsLearningModes } from './PhonicsLearningModes';
import KoreanPhonicsStudyPage from './KoreanPhonicsStudyPage';
import EnglishPhonicsStudyPage from './EnglishPhonicsStudyPage';
import { getUnitProgress, markActivityCompleted } from '../lib/progress-store';
import { freePlayCatalog } from '../lib/free-play-catalog';
vi.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: () => ({ activeProfile: null }),
}));
vi.mock('@/lib/useSeo', () => ({ useSeo: vi.fn() }));
beforeEach(() => localStorage.clear());
function Destination() {
  const location = useLocation();
  return (
    <output data-testid="destination">
      {location.pathname}
      {location.search}
    </output>
  );
}
function show(lang: 'korean' | 'english', path = `/library/phonics/${lang}?mode=free`) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={`/library/phonics/${lang}`} element={<PhonicsLearningModes lang={lang} />} />
        <Route
          path={`/library/phonics/${lang}/:unitId`}
          element={lang === 'korean' ? <KoreanPhonicsStudyPage /> : <EnglishPhonicsStudyPage />}
        />
        <Route path={`/library/phonics/${lang}/:unitId/:activityKey`} element={<Destination />} />
      </Routes>
    </MemoryRouter>
  );
}
it.each(['korean', 'english'] as const)(
  '%s offers only four direct games without content selection, maps or learning progress',
  (lang) => {
    const { container } = show(lang);
    expect(
      screen.getByRole('heading', {
        name: `${lang === 'korean' ? '한글' : '영어'} 파닉스 자유모드`,
      })
    ).toBeVisible();
    expect(container.querySelectorAll('.free-play-game')).toHaveLength(4);
    for (const name of ['그림 짝 찾기', '블록 놀이', '낱말 쓰기', '낱말 색칠하기'])
      expect(screen.getByRole('button', { name })).toBeEnabled();
    for (const name of [
      '글자 놀이',
      '낱말 놀이',
      '낱말 만나기',
      '따라 그리기',
      '듣고 블록 놀이',
      '꾹꾹 누르기',
    ])
      expect(screen.queryByRole('button', { name })).toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(container.querySelector('.journey-map-panel')).toBeNull();
    for (const { unit } of freePlayCatalog(lang))
      expect(getUnitProgress(lang, unit.id).completedActivities).toEqual([]);
  }
);
for (const lang of ['korean', 'english'] as const) {
  it.each(['그림 짝 찾기', '블록 놀이', '낱말 쓰기', '낱말 색칠하기'])(
    `${lang} %s starts random real content on one click`,
    (name) => {
      show(lang);
      fireEvent.click(screen.getByRole('button', { name }));
      const route = screen.getByTestId('destination').textContent!;
      const url = new URL(route, 'http://local');
      expect(url.searchParams.get('freePlay')).toBe('1');
      expect(url.searchParams.has('mode')).toBe(false);
      expect(freePlayCatalog(lang).some((entry) => url.pathname === entry.href.split('?')[0])).toBe(
        true
      );
      if (name === '블록 놀이') expect(url.pathname).toMatch(/game-(korean|english)-block-listen$/);
      if (name === '낱말 쓰기') expect(url.searchParams.get('part')).toBe('write');
      if (name === '낱말 색칠하기') expect(url.searchParams.get('part')).toBe('color');
      expect(screen.queryByRole('dialog')).toBeNull();
    }
  );
}
it('old chapter entry opens direct games and retains actual learning records', () => {
  markActivityCompleted('korean', 'kr-h1-u02', 'letter-write');
  show('korean', '/library/phonics/korean/kr-h1-u02');
  expect(screen.getByRole('button', { name: '블록 놀이' })).toBeEnabled();
  expect(getUnitProgress('korean', 'kr-h1-u02').completedActivities).toEqual(['letter-write']);
});
it('curriculum retains its locked map after leaving free play', () => {
  show('korean');
  fireEvent.click(screen.getByRole('link', { name: '커리큘럼 모드' }));
  expect(screen.getByRole('heading', { name: '한글 파닉스 · 학습 경로' })).toBeVisible();
  expect(screen.getByRole('button', { name: /^2번째 단계.*앞 단계를/ })).toBeDisabled();
});
