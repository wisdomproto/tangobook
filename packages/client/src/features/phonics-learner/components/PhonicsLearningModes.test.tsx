import { beforeEach, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { PhonicsLearningModes } from './PhonicsLearningModes';
import { markActivityCompleted } from '../lib/progress-store';
import { journeyActivities, journeyUnits } from '../lib/learning-journey';
import { markJourneyStarted } from '../lib/learning-journey';
import { activityTitle } from '../lib/activity-title';
import i18n from '@/i18n';

const auth = vi.hoisted(() => ({ profile: null as string | null }));
vi.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: () => ({ activeProfile: auth.profile ? { id: auth.profile } : null }),
}));
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
  };
  localStorage.clear();
  auth.profile = null;
});
function Location() {
  const location = useLocation();
  return (
    <>
      <output data-testid="location">{location.search}</output>
      <output data-testid="path">{decodeURIComponent(location.pathname)}</output>
    </>
  );
}
function activityButtons() {
  return within(screen.getByRole('list', { name: '이번 챕터의 활동' })).getAllByRole('button');
}
function expectLaunchPath(index: number, path: string) {
  fireEvent.click(activityButtons()[index]);
  expect(screen.getByTestId('path').textContent).toContain(path);
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
it.each(['korean', 'english'] as const)('keeps resume out of the %s mode chooser', (lang) => {
  markJourneyStarted(lang);
  show(lang, '');
  expect(screen.queryByRole('link', { name: '이어서 학습하기' })).toBeNull();
});
it('puts a play action on the first activity without a separate footer start button', () => {
  const view = show();
  expect(activityButtons()[0].querySelector('.journey-activity-launch')).not.toBeNull();
  expect(document.querySelectorAll('.journey-play-button')).toHaveLength(0);
  view.unmount();
  markJourneyStarted('korean');
  show();
  expect(screen.queryByText('아래 버튼으로 시작해요')).toBeNull();
});
it.each(['korean', 'english'] as const)('keeps the mode fork inside %s', (lang) => {
  show(lang, '');
  expect(screen.getByRole('link', { name: '커리큘럼 모드' })).toHaveAttribute(
    'href',
    `/library/phonics/${lang}?mode=curriculum&resume=1`
  );
  expect(screen.getByRole('link', { name: '자유모드' })).toHaveAttribute(
    'href',
    `/library/phonics/${lang}?mode=free`
  );
  expect(
    Object.keys(localStorage).every(
      (key) =>
        key.startsWith('phonics-word-learning-legacy:v1:') ||
        key.startsWith('phonics-consonant-find-legacy:v1:')
    )
  ).toBe(true);
  expect(Object.values(localStorage).every((value) => value === '[]')).toBe(true);
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
    expect(activityButtons().filter((button) => !button.hasAttribute('disabled'))).toHaveLength(1);
    expect(screen.queryByRole('link', { name: '학습 시작하기' })).toBeNull();
    expect(document.querySelector('.curriculum-board .journey-map-viewport')).not.toBeNull();
    expect(screen.queryByText('이야기 마을로 떠나요!')).toBeNull();
    expect(screen.queryByRole('button', { name: '학습 정보' })).toBeNull();
    expect(screen.getByRole('button', { name: /^2번째 단계.*앞 단계를/ })).toBeDisabled();
    expect(
      Object.keys(localStorage).every(
        (key) =>
          key.startsWith('phonics-word-learning-legacy:v1:') ||
          key.startsWith('phonics-consonant-find-legacy:v1:')
      )
    ).toBe(true);
    expect(Object.values(localStorage).every((value) => value === '[]')).toBe(true);
  }
);
it('resumes the unfinished activity and marks the current step in the chapter preview', () => {
  markActivityCompleted('korean', 'kr-v1-g01', 'listen-1');
  show();
  const list = screen.getByRole('list', { name: '이번 챕터의 활동' });
  expect(list.children[0]).toHaveAttribute('data-completed');
  expect(list.children[1]).toHaveAttribute('aria-current', 'step');
  expect(within(list).queryByRole('link')).toBeNull();
  expectLaunchPath(1, '/library/phonics/korean/kr-v1-u01/write-1');
});
it('shows the second vowel sound game in the actual order', () => {
  finish('korean', 'kr-v1-u01');
  show();
  const list = screen.getByRole('list', { name: '이번 챕터의 활동' });
  expect(list.children).toHaveLength(3);
  expect(list.children[2].textContent).toContain('듣고 고르기');
});
it('previews a completed chapter and launches its activity directly', () => {
  finish('korean', 'kr-v1-u01');
  show();
  const before = localStorage.getItem('phonics-progress');
  fireEvent.click(screen.getByRole('button', { name: /^1번째 단계.*다 했어요/ }));
  expect(screen.getByRole('list', { name: '이번 챕터의 활동' }).children).toHaveLength(2);
  expectLaunchPath(0, '/library/phonics/korean/kr-v1-u01/listen-1');
  expect(screen.queryByRole('link', { name: '이어서 학습하기' })).toBeNull();
  expect(localStorage.getItem('phonics-progress')).toBe(before);
  fireEvent.click(screen.getByRole('button', { name: /2번째 단계.*지금 배울/ }));
  expectLaunchPath(0, '/library/phonics/korean/kr-v1-u02/listen-1');
});
it('opens the selected book entry while keeping its later activities locked', () => {
  show();
  fireEvent.click(screen.getByRole('button', { name: '5권 복잡한 모음' }));
  expect(screen.getByRole('region', { name: '복잡한 모음' })).toBeDefined();
  const list = screen.getByRole('list', { name: '이번 챕터의 활동' });
  const chapter = journeyUnits('korean').find((unit) => unit.levelIndex === 5)!;
  expect(list.textContent).toContain(
    activityTitle(i18n.getFixedT('ko', 'phonics'), journeyActivities('korean', chapter.id)[0])
  );
  const activities = within(list).getAllByRole('button');
  expect(activities[0]).not.toBeDisabled();
  expect(activities.slice(1).every((button) => button.hasAttribute('disabled'))).toBe(true);
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
  expect(
    Object.keys(localStorage).every(
      (key) =>
        key.startsWith('phonics-word-learning-legacy:v1:') ||
        key.startsWith('phonics-consonant-find-legacy:v1:')
    )
  ).toBe(true);
  expect(Object.values(localStorage).every((value) => value === '[]')).toBe(true);
  expectLaunchPath(0, '/library/phonics/korean/kr-v1-u01/listen-1');
});
it.each(['korean', 'english'] as const)(
  'launches completed/current activities directly and keeps future activities locked in %s',
  (lang) => {
    const unit = journeyUnits(lang)[0];
    const activities = journeyActivities(lang, unit.id);
    markActivityCompleted(lang, unit.id, activities[0].key);
    show(lang);
    const list = screen.getByRole('list', { name: '이번 챕터의 활동' });
    const buttons = within(list).getAllByRole('button');
    expect(buttons[0]).toBeEnabled();
    expect(buttons[1]).toBeEnabled();
    expect(buttons[1].closest('li')).toHaveAttribute('aria-current', 'step');
    for (const future of buttons.slice(2)) expect(future).toBeDisabled();
    const before = localStorage.getItem('phonics-progress');
    fireEvent.click(buttons[0]);
    expect(screen.getByTestId('path').textContent).toBe(
      `/library/phonics/${lang}/${unit.id}/${activities[0].key}`
    );
    expect(buttons[0].querySelector('.journey-activity-launch')).not.toBeNull();
    expect(buttons[0].querySelector('.workspace-complete-check')).not.toBeNull();
    expect(buttons[1].querySelector('.journey-activity-launch')).not.toBeNull();
    for (const future of buttons.slice(2))
      expect(future.querySelector('.journey-activity-launch')).toBeNull();
    expect(document.querySelectorAll('.journey-play-button')).toHaveLength(0);
    expect(localStorage.getItem('phonics-progress')).toBe(before);
    fireEvent.click(buttons[1]);
    expect(screen.getByTestId('path').textContent).toBe(
      `/library/phonics/${lang}/${unit.id}/${activities[1].key}`
    );
  }
);
it.each(['korean', 'english'] as const)(
  'restores the selected completed chapter after replay and ignores a future chapter query in %s',
  (lang) => {
    const units = journeyUnits(lang);
    finish(lang, units[0].id);
    const activity = journeyActivities(lang, units[0].id)[1];
    const view = show(lang, `?mode=curriculum&chapter=${units[0].id}&activity=${activity.key}`);
    expect(screen.queryByRole('status', { name: '다음 챕터가 열렸어!' })).toBeNull();
    const list = screen.getByRole('list', { name: '이번 챕터의 활동' });
    const buttons = within(list).getAllByRole('button');
    expect(buttons[1].closest('li')).toHaveAttribute('data-selected');
    fireEvent.click(buttons[1]);
    expect(screen.getByTestId('path').textContent).toContain(
      journeyActivities(lang, units[0].id)[1].key
    );
    view.unmount();
    show(lang, `?mode=curriculum&chapter=${units[2].id}&activity=${activity.key}`);
    expectLaunchPath(0, units[1].id);
  }
);
it('scrolls the map to a later current chapter without moving the page or writing progress', () => {
  const units = journeyUnits('english');
  for (const unit of units.slice(0, 6)) finish('english', unit.id);
  show('english');
  expect(screen.getByLabelText('학습 지도 스크롤').scrollTop).toBeGreaterThan(0);
  expectLaunchPath(0, units[6].id);
});
it('keeps English Book context when the current chapter moves into Book 2', () => {
  const units = journeyUnits('english');
  for (const unit of units.filter((unit) => unit.levelIndex === 1)) finish('english', unit.id);
  show('english');
  expect(screen.getByRole('button', { name: 'Book 2 소리 숲' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  expectLaunchPath(0, units.find((unit) => unit.levelIndex === 2)!.id);
});
it('keeps every completed chapter previewable after the entire course is finished', () => {
  for (const unit of journeyUnits('english')) finish('english', unit.id);
  show('english');
  expect(activityButtons().every((button) => !button.hasAttribute('disabled'))).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Book 1 알파벳 정원' }));
  fireEvent.click(screen.getByRole('button', { name: /^1번째 단계.*다 했어요/ }));
  expectLaunchPath(0, '/en-b1-u01/letters-learn');
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
      expectLaunchPath(0, '/kr-v1-u02/listen-1');
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
    expect(activityButtons()[0]).not.toBeDisabled();
  } finally {
    window.matchMedia = original;
  }
});
it('resets a selected replay chapter to the new child’s actual starting chapter', () => {
  auth.profile = 'child-a';
  localStorage.setItem('tangobook:activeProfileId', 'child-a');
  finish('korean', 'kr-v1-u01');
  const result = show();
  expect(activityButtons()[0].closest('li')).not.toHaveAttribute('data-completed');
  fireEvent.click(screen.getByRole('button', { name: /^1번째 단계.*다 했어요/ }));
  expect(activityButtons()[0].closest('li')).toHaveAttribute('data-completed');
  auth.profile = 'child-b';
  localStorage.setItem('tangobook:activeProfileId', 'child-b');
  result.rerender(
    <MemoryRouter initialEntries={['/library/phonics/korean?mode=curriculum']}>
      <PhonicsLearningModes lang="korean" />
      <Location />
    </MemoryRouter>
  );
  expect(screen.queryByRole('link', { name: '다시 하기' })).toBeNull();
  expectLaunchPath(0, '/kr-v1-u01/listen-1');
  expect(localStorage.getItem('phonics-progress:profile:child-b')).toBeNull();
});

it.each(['korean', 'english'] as const)(
  'prompts the actual next %s activity only on explicit entry',
  (lang) => {
    const showModal = vi
      .spyOn(HTMLDialogElement.prototype, 'showModal')
      .mockImplementation(function (this: HTMLDialogElement) {
        this.setAttribute('open', '');
      });
    const close = vi.spyOn(HTMLDialogElement.prototype, 'close').mockImplementation(function (
      this: HTMLDialogElement
    ) {
      this.removeAttribute('open');
    });
    const first = journeyUnits(lang)[0];
    markJourneyStarted(lang);
    markActivityCompleted(lang, first.id, journeyActivities(lang, first.id)[0].key);
    show(lang, '?mode=curriculum&resume=1');
    const popup = screen.getByRole('dialog');
    expect(within(popup).getByRole('link', { name: '이어서 학습하기' })).toHaveAttribute(
      'href',
      `/library/phonics/${lang}/${first.id}/${journeyActivities(lang, first.id)[1].key}?mode=curriculum`
    );
    const before = localStorage.getItem('phonics-progress');
    fireEvent.click(within(popup).getByRole('button', { name: '지도 보기' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByTestId('location').textContent).toBe('?mode=curriculum');
    expect(localStorage.getItem('phonics-progress')).toBe(before);
    showModal.mockRestore();
    close.mockRestore();
  }
);
it('does not obstruct a finished chapter return or provide a false resume after the course', () => {
  finish('korean', 'kr-v1-u01');
  const view = show('korean', '?mode=curriculum&finished=kr-v1-u01');
  expect(screen.queryByRole('dialog')).toBeNull();
  view.unmount();
  for (const unit of journeyUnits('korean')) finish('korean', unit.id);
  show('korean', '?mode=curriculum&resume=1');
  expect(screen.queryByRole('dialog')).toBeNull();
});
it('removes the competing free-mode action from the curriculum HUD', () => {
  show();
  expect(screen.queryByRole('link', { name: '자유모드' })).toBeNull();
  expect(screen.getByRole('link', { name: '모드 선택' })).toBeDefined();
});

it('starts the first lesson from the entry prompt and dismisses with Escape without creating progress', () => {
  show('korean', '?mode=curriculum&resume=1');
  const popup = screen.getByRole('dialog');
  expect(within(popup).getByRole('link', { name: '첫 학습 시작하기' })).toHaveAttribute(
    'href',
    '/library/phonics/korean/kr-v1-u01/listen-1?mode=curriculum'
  );
  fireEvent(popup, new Event('cancel', { cancelable: true }));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(
    Object.keys(localStorage).every(
      (key) =>
        key.startsWith('phonics-word-learning-legacy:v1:') ||
        key.startsWith('phonics-consonant-find-legacy:v1:')
    )
  ).toBe(true);
  expect(Object.values(localStorage).every((value) => value === '[]')).toBe(true);
});

it('shows a repeated chapter/activity title only once, without a dangling description reference', () => {
  const view = show('korean', '?mode=curriculum&resume=1');
  const popup = screen.getByRole('dialog');
  expect(within(popup).getAllByText('ㅏ 배우기')).toHaveLength(1);
  expect(popup).not.toHaveAttribute('aria-describedby');
  view.unmount();
  markActivityCompleted('korean', 'kr-v1-u01', 'listen-1');
  show('korean', '?mode=curriculum&resume=1');
  const next = screen.getByRole('dialog');
  expect(within(next).getByRole('heading', { name: 'ㅏ 배우기' })).toBeDefined();
  expect(within(next).getByText('ㅏ 써보기')).toHaveAttribute('id', 'curriculum-entry-activity');
  expect(next).toHaveAttribute('aria-describedby', 'curriculum-entry-activity');
});

it.each(['korean', 'english'] as const)(
  'resumes the selected %s book while browsing other books never changes resume or invents completion',
  (lang) => {
    const units = journeyUnits(lang);
    const selected = units.find((u) => u.levelIndex === 4)!;
    markJourneyStarted(lang, selected.levelKey);
    show(lang, '?mode=curriculum&resume=1');
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('link', { name: /이어서/ })).toHaveAttribute(
      'href',
      `/library/phonics/${lang}/${selected.id}/${journeyActivities(lang, selected.id)[0].key}?mode=curriculum`
    );
  }
);
