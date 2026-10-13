import { beforeEach, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PhonicsLearningModes } from './PhonicsLearningModes';
import { markActivityCompleted } from '../lib/progress-store';
import { journeyActivities, journeyUnits } from '../lib/learning-journey';
import { recordGameChoice } from '../lib/journey-assessment';

vi.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: () => ({ activeProfile: null }),
}));
beforeEach(() => {
  localStorage.clear();
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
  };
});
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
  expect(screen.queryByRole('group', { name: '여행할 장소' })).toBeNull();
  expect(screen.getByRole('heading', { name: '한글 · 학습 경로' })).toBeDefined();
  expect(within(screen.getByLabelText('지금 보고 있는 책')).getByText('1권')).toBeDefined();
  expect(screen.getByRole('list', { name: '순서대로 이어지는 학습 단계' }).children).toHaveLength(
    journeyUnits('korean').length
  );
  expect(
    screen.getByRole('button', { name: /^3번째 단계.*앞 단계를/ }).hasAttribute('disabled')
  ).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: '학습 정보' }));
  expect(
    screen.getByRole('button', { name: '여행 1 모음 정원' }).getAttribute('aria-pressed')
  ).toBe('true');
  fireEvent.click(screen.getByRole('button', { name: '여행 2 글자 숲' }));
  expect(screen.getByRole('region', { name: '글자 숲' })).toBeDefined();
  expect(screen.queryByRole('link', { name: /번째 단계/ })).toBeNull();
  expect(screen.getByRole('link', { name: /이어서 학습하기/ }).getAttribute('href')).toContain(
    '/write-1?mode=curriculum'
  );
  fireEvent.click(screen.getByRole('button', { name: '지금 배울 곳으로' }));
  expect(screen.getByRole('link', { name: /1번째 단계/ }).getAttribute('aria-current')).toBe(
    'step'
  );
  fireEvent.click(screen.getByRole('button', { name: '아이 화면으로' }));
  expect(screen.queryByRole('group', { name: '여행할 장소' })).toBeNull();
});

it('blooms a completed unit without losing the next activity or replay link', () => {
  for (const activity of journeyActivities('korean', 'kr-v1-u01'))
    markActivityCompleted('korean', 'kr-v1-u01', activity.key);
  render(
    <MemoryRouter initialEntries={['/library/phonics/korean?mode=curriculum&finished=kr-v1-u01']}>
      <PhonicsLearningModes lang="korean" />
    </MemoryRouter>
  );
  expect(screen.getByRole('status', { name: '다음 챕터가 열렸어!' })).toBeDefined();
  fireEvent.click(screen.getByRole('button', { name: '학습 정보' }));
  expect(screen.getByRole('link', { name: /1번째 단계.*완료/ }).getAttribute('href')).toContain(
    '/kr-v1-u01/listen-1?mode=curriculum'
  );
  expect(screen.getByRole('link', { name: /이어서 학습하기/ }).getAttribute('href')).toContain(
    '/kr-v1-u02/listen-1?mode=curriculum'
  );
});

it('shows the whole journey completion and keeps every stage replayable', () => {
  for (const unit of journeyUnits('english'))
    for (const activity of journeyActivities('english', unit.id))
      markActivityCompleted('english', unit.id, activity.key);
  render(
    <MemoryRouter initialEntries={['/library/phonics/english?mode=curriculum']}>
      <PhonicsLearningModes lang="english" />
    </MemoryRouter>
  );
  expect(screen.getByText('잘했어!')).toBeDefined();
  expect(screen.getByRole('link', { name: '다시 하기' }).getAttribute('href')).toContain(
    '/en-b1-u01/letters-learn'
  );
  expect(screen.queryByRole('link', { name: /학습 시작하기|이어서 학습하기/ })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: '학습 정보' }));
  expect(
    screen.getByRole('button', { name: '여행 5 이야기 언덕' }).getAttribute('aria-pressed')
  ).toBe('true');
  expect(screen.getAllByRole('link', { name: /번째 단계.*완료/ }).length).toBeGreaterThan(0);
});

it('centers a later current stage inside the map without changing progress', () => {
  for (const unit of journeyUnits('english').slice(0, 6)) {
    for (const activity of journeyActivities('english', unit.id)) {
      markActivityCompleted('english', unit.id, activity.key);
    }
  }
  render(
    <MemoryRouter initialEntries={['/library/phonics/english?mode=curriculum']}>
      <PhonicsLearningModes lang="english" />
    </MemoryRouter>
  );
  expect(screen.getByRole('region', { name: '전체 학습 경로 스크롤' }).scrollLeft).toBeGreaterThan(
    0
  );
  expect(screen.getAllByRole('link', { name: /지금 배울 단계/ })).toHaveLength(1);
});

it('reveals the next chapter after unlocking and does not repeat the transition on a plain visit or replay', () => {
  vi.useFakeTimers();
  try {
    for (const activity of journeyActivities('korean', 'kr-v1-u01'))
      markActivityCompleted('korean', 'kr-v1-u01', activity.key);
    render(
      <MemoryRouter initialEntries={['/library/phonics/korean?mode=curriculum&finished=kr-v1-u01']}>
        <PhonicsLearningModes lang="korean" />
      </MemoryRouter>
    );
    expect(screen.getByRole('status')).toBeDefined();
    act(() => vi.advanceTimersByTime(1900));
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.getByRole('link', { name: /2번째 단계.*지금 배울 단계/ })).toBeDefined();
    expect(screen.getByRole('link', { name: /이어서 학습하기/ }).getAttribute('href')).toContain(
      '/kr-v1-u02/listen-1'
    );
  } finally {
    vi.useRealTimers();
  }
});

it('does not unlock a future chapter just by visiting a completion URL', () => {
  render(
    <MemoryRouter initialEntries={['/library/phonics/korean?mode=curriculum&finished=kr-v1-u01']}>
      <PhonicsLearningModes lang="korean" />
    </MemoryRouter>
  );
  expect(screen.queryByRole('status')).toBeNull();
  expect(screen.getByRole('heading', { name: '한글 · 학습 경로' })).toBeDefined();
  expect(within(screen.getByLabelText('지금 보고 있는 책')).getByText('1권')).toBeDefined();
});

it('does not replay an unlock after reviewing an already completed chapter', () => {
  for (const activity of journeyActivities('korean', 'kr-v1-u01'))
    markActivityCompleted('korean', 'kr-v1-u01', activity.key);
  render(
    <MemoryRouter
      initialEntries={['/library/phonics/korean?mode=curriculum&finished=kr-v1-u01&replay=1']}
    >
      <PhonicsLearningModes lang="korean" />
    </MemoryRouter>
  );
  expect(screen.queryByRole('status')).toBeNull();
  expect(screen.getByRole('link', { name: /2번째 단계.*지금 배울 단계/ })).toBeDefined();
});

it('keeps the previous grouped game observation visible in parent information', () => {
  recordGameChoice('korean', 'kr-v1-g01', 'listen-game', 'older-run', false, 'ㅑ', {
    question: 0,
    firstAttempt: true,
  });
  render(
    <MemoryRouter initialEntries={['/library/phonics/korean?mode=curriculum']}>
      <PhonicsLearningModes lang="korean" />
    </MemoryRouter>
  );
  expect(screen.queryByText('놀이에서 확인한 기록')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: '학습 정보' }));
  expect(screen.getByText('놀이에서 확인한 기록')).toBeDefined();
  expect(screen.getByText('첫 선택 0 / 1 · 다시 고르기 0회')).toBeDefined();
});

it('uses a short static transition when reduced motion is requested', () => {
  const original = window.matchMedia;
  window.matchMedia = vi.fn((query) => ({
    matches: query === '(prefers-reduced-motion: reduce)',
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
  vi.useFakeTimers();
  try {
    for (const activity of journeyActivities('korean', 'kr-v1-u01'))
      markActivityCompleted('korean', 'kr-v1-u01', activity.key);
    render(
      <MemoryRouter initialEntries={['/library/phonics/korean?mode=curriculum&finished=kr-v1-u01']}>
        <PhonicsLearningModes lang="korean" />
      </MemoryRouter>
    );
    expect(screen.getByRole('status')).toBeDefined();
    act(() => vi.advanceTimersByTime(500));
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.getByRole('link', { name: /2번째 단계.*지금 배울 단계/ })).toBeDefined();
  } finally {
    vi.useRealTimers();
    window.matchMedia = original;
  }
});

it('keeps Book context when crossing from a finished book into the next book', () => {
  const units = journeyUnits('english');
  for (const unit of units.filter((u) => u.levelIndex === 1))
    for (const a of journeyActivities('english', unit.id))
      markActivityCompleted('english', unit.id, a.key);
  render(
    <MemoryRouter initialEntries={['/library/phonics/english?mode=curriculum']}>
      <PhonicsLearningModes lang="english" />
    </MemoryRouter>
  );
  expect(within(screen.getByLabelText('지금 보고 있는 Book')).getByText('Book 2')).toBeDefined();
  expect(screen.getByRole('region', { name: '전체 학습 경로 스크롤' }).scrollLeft).toBeGreaterThan(
    0
  );
  expect(screen.getByRole('link', { name: /지금 배울 단계/ }).getAttribute('href')).toContain(
    units.find((u) => u.levelIndex === 2)!.id
  );
  expect(screen.getAllByRole('link', { name: /완료 · 다시 하기/ })).toHaveLength(
    units.filter((u) => u.levelIndex === 1).length
  );
});

it('lets a child browse distant Books without unlocking them, and returns to the current chapter', async () => {
  render(
    <MemoryRouter initialEntries={['/library/phonics/korean?mode=curriculum']}>
      <PhonicsLearningModes lang="korean" />
    </MemoryRouter>
  );
  const map = screen.getByRole('region', { name: '전체 학습 경로 스크롤' });
  // Browsers round fractional scroll offsets; the viewed Book must still match the jump.
  let cameraLeft = 0;
  Object.defineProperty(map, 'scrollLeft', {
    configurable: true,
    get: () => cameraLeft,
    set: (value: number) => {
      cameraLeft = Math.floor(value);
    },
  });
  expect(screen.queryByRole('button', { name: '5권 · 모음 무지개' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: '책 고르기 · 1권' }));
  expect(screen.getByRole('dialog', { name: '책 고르기' })).toBeDefined();
  fireEvent.click(screen.getByRole('button', { name: '5권 · 모음 무지개' }));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(map.scrollLeft).toBeGreaterThan(5000);
  fireEvent.scroll(map);
  await waitFor(() =>
    expect(within(screen.getByLabelText('지금 보고 있는 책')).getByText('5권')).toBeDefined()
  );
  expect(screen.getByRole('button', { name: /48번째 단계/ }).hasAttribute('disabled')).toBe(true);
  expect(screen.getAllByRole('link', { name: /번째 단계/ })).toHaveLength(1);
  fireEvent.click(screen.getByRole('button', { name: '지금 배울 곳으로' }));
  expect(map.scrollLeft).toBeLessThan(300);
  fireEvent.scroll(map);
  await waitFor(() =>
    expect(within(screen.getByLabelText('지금 보고 있는 책')).getByText('1권')).toBeDefined()
  );
  expect(screen.getByRole('link', { name: /지금 배울 단계/ }).getAttribute('href')).toContain(
    '/kr-v1-u01/listen-1'
  );
});

it('requires landscape on a touch phone and releases the same path after rotation', () => {
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
    render(
      <MemoryRouter initialEntries={['/library/phonics/korean?mode=curriculum']}>
        <PhonicsLearningModes lang="korean" />
      </MemoryRouter>
    );
    expect(screen.getByRole('dialog', { name: '가로로 돌려주세요!' })).toBeDefined();
    expect(screen.queryByRole('region', { name: '전체 학습 경로 스크롤' })).toBeNull();
    act(() => {
      portrait.matches = false;
      portrait.dispatchEvent(new Event('change'));
    });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('region', { name: '전체 학습 경로 스크롤' })).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: '책 고르기 · 1권' }));
    expect(screen.getByRole('dialog', { name: '책 고르기' })).toBeDefined();
    act(() => {
      portrait.matches = true;
      portrait.dispatchEvent(new Event('change'));
    });
    expect(screen.queryByRole('dialog', { name: '책 고르기' })).toBeNull();
    expect(screen.getByRole('dialog', { name: '가로로 돌려주세요!' })).toBeDefined();
    act(() => {
      portrait.matches = false;
      portrait.dispatchEvent(new Event('change'));
    });
    expect(screen.getByRole('link', { name: /1번째 단계.*지금 배울 단계/ })).toBeDefined();
  } finally {
    window.matchMedia = original;
  }
});

it('keeps the resume action on the current chapter when browsing another Book', () => {
  render(
    <MemoryRouter initialEntries={['/library/phonics/korean?mode=curriculum']}>
      <PhonicsLearningModes lang="korean" />
    </MemoryRouter>
  );
  const current = screen.getByRole('link', { name: /1번째 단계.*지금 배울 단계/ });
  expect(
    within(current.parentElement!).getByRole('link', { name: '학습 시작하기' }).getAttribute('href')
  ).toContain('/kr-v1-u01/listen-1?mode=curriculum');
  fireEvent.click(screen.getByRole('button', { name: '책 고르기 · 1권' }));
  fireEvent.click(screen.getByRole('button', { name: '5권 · 모음 무지개' }));
  expect(within(current.parentElement!).getByRole('link', { name: '학습 시작하기' })).toBeDefined();
  expect(screen.queryByRole('link', { name: /48번째 단계/ })).toBeNull();
});
