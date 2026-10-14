import { beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { PhonicsLearningModes } from './PhonicsLearningModes';
import KoreanPhonicsStudyPage from './KoreanPhonicsStudyPage';
import EnglishPhonicsStudyPage from './EnglishPhonicsStudyPage';
import { getAllKoreanUnits, getActivityPlan } from '../lib/korean-phonics-units';
import { getAllEnglishUnits, getEnglishActivityPlan } from '../lib/english-phonics-units';
import { freeActivityGroups } from '../lib/free-activity-groups';
import { getUnitProgress, markActivityCompleted } from '../lib/progress-store';

vi.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: () => ({ activeProfile: null }),
}));
vi.mock('@/lib/useSeo', () => ({ useSeo: vi.fn() }));
beforeEach(() => localStorage.clear());
const units = (lang: 'korean' | 'english') =>
  lang === 'korean' ? getAllKoreanUnits() : getAllEnglishUnits();
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
  'opens every chapter in all five %s books without creating completion',
  (lang) => {
    show(lang);
    const books = screen.getByRole('group', { name: '여행할 장소' });
    for (const book of within(books).getAllByRole('button')) {
      fireEvent.click(book);
      const stages = screen.getByRole('list', { name: '순서대로 이어지는 학습 단계' });
      const targets = within(stages).getAllByRole('button');
      expect(targets.length).toBeGreaterThan(0);
      expect(targets.every((target) => !target.hasAttribute('disabled'))).toBe(true);
      expect(stages.querySelector('.journey-stage-label')).toBeNull();
      fireEvent.click(targets.at(-1)!);
      const list = screen.getByRole('list', { name: '이번 챕터의 활동' });
      expect(within(list).getAllByRole('link').length).toBeGreaterThan(0);
      expect(screen.queryByRole('link', { name: /학습 시작하기|이어서 학습하기/ })).toBeNull();
    }
    for (const unit of units(lang))
      expect(getUnitProgress(lang, unit.id).completedActivities).toEqual([]);
  }
);
it.each(['korean', 'english'] as const)(
  'lets a learner choose a later activity directly in %s',
  (lang) => {
    show(lang);
    const book = within(screen.getByRole('group', { name: '여행할 장소' })).getAllByRole(
      'button'
    )[4];
    fireEvent.click(book);
    const unit = units(lang).find((unit) => unit.levelIndex === 5)!;
    const plan = lang === 'korean' ? getActivityPlan(unit.id) : getEnglishActivityPlan(unit.id);
    const links = within(screen.getByRole('list', { name: '이번 챕터의 활동' })).getAllByRole(
      'link'
    );
    expect(links).toHaveLength(freeActivityGroups(plan.activities).length);
    const activity = plan.activities.at(-1)!;
    expect(links.at(-1)).toHaveAttribute(
      'href',
      `/library/phonics/${lang}/${unit.id}/${activity.key}`
    );
    fireEvent.click(links.at(-1)!);
    expect(screen.getByText('선택한 활동')).toBeDefined();
    expect(getUnitProgress(lang, unit.id).completedActivities).toEqual([]);
  }
);
it.each(['korean', 'english'] as const)(
  'opens existing chapter URLs on the same free board in %s',
  (lang) => {
    const unit = units(lang).find((unit) => unit.levelIndex === 4)!;
    show(lang, `/library/phonics/${lang}/${unit.id}`);
    expect(
      screen.getByRole('heading', { name: `${lang === 'korean' ? '한글' : '영어'} · 자유모드` })
    ).toBeDefined();
    const targets = within(
      screen.getByRole('list', { name: '순서대로 이어지는 학습 단계' })
    ).getAllByRole('button');
    expect(targets[0]).toHaveAttribute('aria-pressed', 'true');
    expect(targets.every((target) => !target.hasAttribute('disabled'))).toBe(true);
  }
);
it('preserves grouped vowels, all three prepared games, and exact legacy vowel links', () => {
  show('korean', '/library/phonics/korean/kr-v1-u02');
  expect(screen.getByRole('heading', { name: '한글 · 자유모드' })).toBeDefined();
  const targets = within(
    screen.getByRole('list', { name: '순서대로 이어지는 학습 단계' })
  ).getAllByRole('button');
  expect(targets).toHaveLength(3);
  const list = screen.getByRole('list', { name: '이번 챕터의 활동' });
  expect(within(list).getByRole('link', { name: 'ㅑ 배우기' })).toHaveAttribute(
    'href',
    '/library/phonics/korean/kr-v1-g01/listen-2'
  );
  for (const key of ['listen-game', 'hunt-game', 'match-game'])
    expect(
      within(list)
        .getAllByRole('link')
        .some((link) => link.getAttribute('href')?.endsWith(`/${key}`))
    ).toBe(true);
  expect(getUnitProgress('korean', 'kr-v1-g01').completedActivities).toEqual([]);
});
it('groups free activities into an expanded learn/game tree without duplicating or locking links', () => {
  show('korean');
  const tree = screen.getByRole('list', { name: '이번 챕터의 활동' });
  const learn = within(tree).getByRole('list', { name: '익히기' });
  const games = within(tree).getByRole('list', { name: '놀며 익히기' });
  expect(within(learn).getAllByRole('link')).toHaveLength(4);
  expect(within(games).getAllByRole('link')).toHaveLength(3);
  expect(within(games).queryByRole('link', { name: 'ㅏ 배우기' })).toBeNull();
  expect(within(learn).queryByRole('link', { name: '모음 찾기' })).toBeNull();
  const learnGroup = within(tree).getByRole('group', { name: '익히기' });
  const gameGroup = within(tree).getByRole('group', { name: '놀며 익히기' });
  expect(learnGroup).toHaveAttribute('open');
  expect(gameGroup).toHaveAttribute('open');
  fireEvent.click(within(learnGroup).getByText('익히기'));
  expect(learnGroup).not.toHaveAttribute('open');
  expect(within(gameGroup).getByRole('link', { name: '모음 찾기' })).toBeDefined();
  expect(getUnitProgress('korean', 'kr-v1-g01').completedActivities).toEqual([]);
});
it('shows shared completion but does not complete the rest of a chapter on selection', () => {
  markActivityCompleted('korean', 'kr-v1-g01', 'listen-1');
  const before = localStorage.getItem('phonics-progress');
  show('korean');
  expect(screen.getByRole('link', { name: 'ㅏ 배우기' }).parentElement).not.toHaveAttribute(
    'data-completed'
  );
  expect(screen.queryByRole('link', { name: 'ㅏ 써보기' })).toBeNull();
  fireEvent.click(
    within(screen.getByRole('list', { name: '순서대로 이어지는 학습 단계' })).getAllByRole(
      'button'
    )[2]
  );
  expect(localStorage.getItem('phonics-progress')).toBe(before);
});
it('keeps curriculum locking and its single start action after switching from free mode', () => {
  show('korean');
  fireEvent.click(screen.getByRole('link', { name: '커리큘럼 모드' }));
  expect(screen.getByRole('heading', { name: '한글 · 학습 경로' })).toBeDefined();
  expect(screen.getByRole('button', { name: /^2번째 단계.*앞 단계를/ })).toBeDisabled();
  expect(screen.getAllByRole('link', { name: '학습 시작하기' })).toHaveLength(1);
  expect(
    within(screen.getByRole('list', { name: '이번 챕터의 활동' })).queryByRole('link')
  ).toBeNull();
});

it('shows the consonant learning pairs and block play separately from playful practice', () => {
  show('korean', '/library/phonics/korean/kr-h1-u02');
  const learn = screen.getByRole('list', { name: '익히기' });
  const play = screen.getByRole('list', { name: '놀며 익히기' });
  expect(
    within(learn)
      .getAllByRole('link')
      .map((link) => link.textContent)
  ).toEqual(['ㄱ 배우기', 'ㄱ+모음 배우기', '블록 놀이']);
  expect(within(play).getByRole('link', { name: '글자 사냥' })).toBeDefined();
  expect(within(play).queryByRole('link', { name: '블록 놀이' })).toBeNull();
  expect(within(learn).queryByRole('link', { name: 'ㄱ 써보기' })).toBeNull();
});
it('marks a merged learning entry completed only after both actual phases', () => {
  markActivityCompleted('korean', 'kr-v1-g01', 'listen-1');
  markActivityCompleted('korean', 'kr-v1-g01', 'write-1');
  show('korean');
  expect(screen.getByRole('link', { name: 'ㅏ 배우기' }).parentElement).toHaveAttribute(
    'data-completed'
  );
  expect(screen.getByRole('link', { name: 'ㅑ 배우기' }).parentElement).not.toHaveAttribute(
    'data-completed'
  );
});
it('keeps the learning letter visible on completed map nodes when captions are omitted', () => {
  for (const activity of getActivityPlan('kr-v1-g01').activities.filter(
    (activity) => activity.required
  ))
    markActivityCompleted('korean', 'kr-v1-g01', activity.key);
  show('korean');
  const stages = screen.getByRole('list', { name: '순서대로 이어지는 학습 단계' });
  const completed = stages.querySelector('.is-complete, .is-current');
  expect(completed?.querySelector('.journey-letter-toy')).not.toBeNull();
  expect(stages.querySelector('.journey-stage-label')).toBeNull();
});
