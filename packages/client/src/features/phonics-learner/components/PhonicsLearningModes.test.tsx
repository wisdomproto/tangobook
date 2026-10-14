import { beforeEach, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { PhonicsLearningModes } from './PhonicsLearningModes';
import { markActivityCompleted } from '../lib/progress-store';
import { journeyActivities, journeyUnits } from '../lib/learning-journey';
import { activityTitle } from '../lib/activity-title';
import i18n from '@/i18n';

const auth = vi.hoisted(() => ({ profile: null as string | null }));
vi.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: () => ({ activeProfile: auth.profile ? { id: auth.profile } : null }),
}));
beforeEach(() => {
  localStorage.clear();
  auth.profile = null;
});
function Location() {
  return <output data-testid="location">{useLocation().search}</output>;
}
function show(lang: 'korean' | 'english' = 'korean', query = '?mode=curriculum') {
  return render(
    <MemoryRouter initialEntries={[`/library/phonics/${lang}${query}`]}>
      <PhonicsLearningModes lang={lang} />
      <Location />
    </MemoryRouter>
  );
}
function finish(lang: 'korean' | 'english', id: string) {
  for (const activity of journeyActivities(lang, id)) markActivityCompleted(lang, id, activity.key);
}
it.each(['korean', 'english'] as const)('keeps the mode fork inside %s', (lang) => {
  show(lang, '');
  expect(screen.getByRole('link', { name: '커리큘럼 모드' })).toHaveAttribute(
    'href',
    `/library/phonics/${lang}?mode=curriculum`
  );
  expect(screen.getByRole('link', { name: '자유모드' })).toHaveAttribute(
    'href',
    `/library/phonics/${lang}?mode=free`
  );
  expect(localStorage.length).toBe(0);
});
it.each(['korean', 'english'] as const)(
  'opens the overview immediately with real chapter activities and one start action in %s',
  (lang) => {
    show(lang);
    const chapter = journeyUnits(lang)[0];
    const list = screen.getByRole('list', { name: '이번 챕터의 활동' });
    expect(list.children).toHaveLength(journeyActivities(lang, chapter.id).length);
    for (const activity of journeyActivities(lang, chapter.id)) {
      expect(
        within(list).getByText(activityTitle(i18n.getFixedT('ko', 'phonics'), activity))
      ).toBeDefined();
    }
    expect(screen.getAllByRole('link', { name: '학습 시작하기' })).toHaveLength(1);
    expect(document.querySelector('.curriculum-board .journey-map-viewport')).not.toBeNull();
    expect(screen.queryByText('이야기 마을로 떠나요!')).toBeNull();
    expect(screen.queryByRole('button', { name: '학습 정보' })).toBeNull();
    expect(screen.getByRole('button', { name: /^2번째 단계.*앞 단계를/ })).toBeDisabled();
    expect(localStorage.length).toBe(0);
  }
);
it('resumes the unfinished activity and marks the current step in the chapter preview', () => {
  markActivityCompleted('korean', 'kr-v1-g01', 'listen-1');
  show();
  expect(screen.getByRole('link', { name: '이어서 학습하기' })).toHaveAttribute(
    'href',
    '/library/phonics/korean/kr-v1-u01/write-1?mode=curriculum'
  );
  const list = screen.getByRole('list', { name: '이번 챕터의 활동' });
  expect(list.children[0]).toHaveAttribute('data-completed');
  expect(list.children[1]).toHaveAttribute('aria-current', 'step');
  expect(within(list).queryByRole('link')).toBeNull();
});
it('shows the second vowel sound game in the actual order', () => {
  finish('korean', 'kr-v1-u01');
  show();
  const list = screen.getByRole('list', { name: '이번 챕터의 활동' });
  expect(list.children).toHaveLength(3);
  expect(list.children[2].textContent).toContain('듣고 고르기');
});
it('previews a completed chapter before replaying it through the single action', () => {
  finish('korean', 'kr-v1-u01');
  show();
  const before = localStorage.getItem('phonics-progress');
  fireEvent.click(screen.getByRole('button', { name: /^1번째 단계.*완료/ }));
  expect(screen.getByRole('list', { name: '이번 챕터의 활동' }).children).toHaveLength(2);
  expect(screen.getByRole('link', { name: '다시 하기' })).toHaveAttribute(
    'href',
    '/library/phonics/korean/kr-v1-u01/listen-1?mode=curriculum'
  );
  expect(screen.queryByRole('link', { name: '이어서 학습하기' })).toBeNull();
  expect(localStorage.getItem('phonics-progress')).toBe(before);
  fireEvent.click(screen.getByRole('button', { name: /2번째 단계.*지금 배울/ }));
  expect(screen.getByRole('link', { name: '이어서 학습하기' })).toHaveAttribute(
    'href',
    '/library/phonics/korean/kr-v1-u02/listen-1?mode=curriculum'
  );
});
it('browses future books without making future learning links or changing the current chapter', () => {
  show();
  fireEvent.click(screen.getByRole('button', { name: '5권 모음 무지개' }));
  expect(screen.getByRole('region', { name: '모음 무지개' })).toBeDefined();
  expect(screen.getByRole('link', { name: '학습 시작하기' })).toHaveAttribute(
    'href',
    '/library/phonics/korean/kr-v1-u01/listen-1?mode=curriculum'
  );
  expect(
    screen
      .getAllByRole('button', { name: /번째 단계.*앞 단계를/ })
      .every((button) => button.hasAttribute('disabled'))
  ).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: '지금 배울 곳으로' }));
  expect(screen.getByRole('button', { name: /1번째 단계.*지금 배울/ })).toHaveAttribute(
    'aria-current',
    'step'
  );
  expect(localStorage.length).toBe(0);
});
it('scrolls the map to a later current chapter without moving the page or writing progress', () => {
  const units = journeyUnits('english');
  for (const unit of units.slice(0, 6)) finish('english', unit.id);
  show('english');
  expect(screen.getByLabelText('학습 지도 스크롤').scrollTop).toBeGreaterThan(0);
  expect(screen.getByRole('link', { name: '이어서 학습하기' }).getAttribute('href')).toContain(
    units[6].id
  );
});
it('keeps English Book context when the current chapter moves into Book 2', () => {
  const units = journeyUnits('english');
  for (const unit of units.filter((unit) => unit.levelIndex === 1)) finish('english', unit.id);
  show('english');
  expect(screen.getByRole('button', { name: 'Book 2 소리 숲' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  expect(screen.getByRole('link', { name: '이어서 학습하기' }).getAttribute('href')).toContain(
    units.find((unit) => unit.levelIndex === 2)!.id
  );
});
it('keeps every completed chapter previewable after the entire course is finished', () => {
  for (const unit of journeyUnits('english')) finish('english', unit.id);
  show('english');
  expect(screen.getAllByRole('link', { name: '다시 하기' })).toHaveLength(1);
  fireEvent.click(screen.getByRole('button', { name: 'Book 1 알파벳 정원' }));
  fireEvent.click(screen.getByRole('button', { name: /^1번째 단계.*완료/ }));
  expect(screen.getByRole('link', { name: '다시 하기' }).getAttribute('href')).toContain(
    '/en-b1-u01/letters-learn'
  );
});
it.each([false, true])(
  'unlocks the next chapter and consumes the finish marker (reduced motion: %s)',
  (reduced) => {
    const original = window.matchMedia;
    window.matchMedia = vi.fn((query) => ({
      matches: reduced && query === '(prefers-reduced-motion: reduce)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })) as unknown as typeof window.matchMedia;
    vi.useFakeTimers();
    try {
      finish('korean', 'kr-v1-u01');
      show('korean', '?mode=curriculum&finished=kr-v1-u01');
      expect(screen.getByRole('status', { name: '다음 챕터가 열렸어!' })).toBeDefined();
      expect(document.querySelector('.is-unlocking .journey-unlocking-lock')).not.toBeNull();
      act(() => vi.advanceTimersByTime(reduced ? 500 : 1900));
      expect(screen.queryByRole('status', { name: '다음 챕터가 열렸어!' })).toBeNull();
      expect(screen.getByTestId('location').textContent).toBe('?mode=curriculum');
      expect(screen.getByRole('link', { name: '이어서 학습하기' }).getAttribute('href')).toContain(
        '/kr-v1-u02/listen-1'
      );
    } finally {
      vi.useRealTimers();
      window.matchMedia = original;
    }
  }
);
it('does not unlock from a fabricated finish URL or from a completed chapter replay', () => {
  const result = show('korean', '?mode=curriculum&finished=kr-v1-u01');
  expect(screen.queryByRole('status', { name: '다음 챕터가 열렸어!' })).toBeNull();
  result.unmount();
  finish('korean', 'kr-v1-u01');
  show('korean', '?mode=curriculum&finished=kr-v1-u01&replay=1');
  expect(screen.queryByRole('status', { name: '다음 챕터가 열렸어!' })).toBeNull();
});
it('keeps the same overview under the phone landscape gate', () => {
  const original = window.matchMedia;
  const portrait = Object.assign(new EventTarget(), { matches: true });
  const coarse = Object.assign(new EventTarget(), { matches: true });
  window.matchMedia = vi.fn((query) =>
    query === '(orientation: portrait)'
      ? portrait
      : query.includes('pointer: coarse')
        ? coarse
        : { matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }
  ) as unknown as typeof window.matchMedia;
  try {
    show();
    expect(screen.getByRole('dialog', { name: '가로로 돌려주세요!' })).toBeDefined();
    expect(screen.queryByRole('list', { name: '이번 챕터의 활동' })).toBeNull();
    act(() => {
      portrait.matches = false;
      portrait.dispatchEvent(new Event('change'));
    });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getAllByRole('link', { name: '학습 시작하기' })).toHaveLength(1);
  } finally {
    window.matchMedia = original;
  }
});
it('resets a selected replay chapter to the new child’s actual starting chapter', () => {
  auth.profile = 'child-a';
  localStorage.setItem('tangobook:activeProfileId', 'child-a');
  finish('korean', 'kr-v1-u01');
  const result = show();
  expect(screen.getByRole('link', { name: '이어서 학습하기' }).getAttribute('href')).toContain(
    '/kr-v1-u02/'
  );
  fireEvent.click(screen.getByRole('button', { name: /^1번째 단계.*완료/ }));
  expect(screen.getByRole('link', { name: '다시 하기' })).toBeDefined();
  auth.profile = 'child-b';
  localStorage.setItem('tangobook:activeProfileId', 'child-b');
  result.rerender(
    <MemoryRouter initialEntries={['/library/phonics/korean?mode=curriculum']}>
      <PhonicsLearningModes lang="korean" />
      <Location />
    </MemoryRouter>
  );
  expect(screen.queryByRole('link', { name: '다시 하기' })).toBeNull();
  expect(screen.getByRole('link', { name: '학습 시작하기' }).getAttribute('href')).toContain(
    '/kr-v1-u01/listen-1'
  );
  expect(localStorage.getItem('phonics-progress:profile:child-b')).toBeNull();
});
