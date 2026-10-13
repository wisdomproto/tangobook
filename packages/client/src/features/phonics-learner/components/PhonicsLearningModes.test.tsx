import { beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PhonicsLearningModes } from './PhonicsLearningModes';
import { markActivityCompleted } from '../lib/progress-store';
import { journeyActivities, journeyUnits } from '../lib/learning-journey';

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
});

it('blooms a completed unit without losing the next activity or replay link', () => {
  for (const activity of journeyActivities('korean', 'kr-v1-g01'))
    markActivityCompleted('korean', 'kr-v1-g01', activity.key);
  render(
    <MemoryRouter initialEntries={['/library/phonics/korean?mode=curriculum&finished=kr-v1-g01']}>
      <PhonicsLearningModes lang="korean" />
    </MemoryRouter>
  );
  expect(screen.getByText('새로운 길이 열렸어요!')).toBeDefined();
  expect(screen.getByRole('link', { name: /1번째 단계.*완료/ }).getAttribute('href')).toContain(
    '/kr-v1-g01/listen-1?mode=curriculum'
  );
  expect(screen.getByRole('link', { name: /이어서 학습하기/ }).getAttribute('href')).toContain(
    '/kr-v1-g02/listen-1?mode=curriculum'
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
  expect(screen.getByRole('heading', { name: '마을을 모두 채웠어요!' })).toBeDefined();
  expect(screen.queryByRole('link', { name: /학습 시작하기|이어서 학습하기/ })).toBeNull();
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
  expect(screen.getByLabelText('학습 지도 스크롤').scrollTop).toBeGreaterThan(0);
  expect(screen.getAllByRole('link', { name: /지금 배울 단계/ })).toHaveLength(1);
});
