import { beforeEach, expect, it, vi } from 'vitest';
import { configure, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import EnglishPhonicsActivityPage from './EnglishPhonicsActivityPage';
import { ActivityShell } from './ActivityShell';
import EnglishPhonicsStudyPage from './EnglishPhonicsStudyPage';
import { PhonicsLearningModes } from './PhonicsLearningModes';
import { getUnitProgress, markActivityCompleted } from '../lib/progress-store';
import { GUIDED_COMPLETION_MS } from './GuidedActivityTransition';

configure({ asyncUtilTimeout: GUIDED_COMPLETION_MS + 800 });
vi.mock('../activities/ConnectedWordLearningActivity', () => ({
  ConnectedWordLearningActivity: ({ onComplete }: { onComplete: () => void }) => (
    <button onClick={onComplete}>낱말 연결 연습 완료</button>
  ),
}));

vi.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: () => ({ activeProfile: null }),
}));
vi.mock('@/features/learning/hooks/useLogEvent', () => ({ useLogEvent: () => vi.fn() }));
vi.mock('@/features/storybook/hooks/useStorybooks', () => ({
  useStorybook: () => ({ data: { phonicsLesson: {} } }),
}));
vi.mock('../hooks/useReviewCardSources', () => ({
  useReviewCardSources: () => ({ sources: [], isLoading: false }),
}));
vi.mock('../activities/AlphabetLetterLearnActivity', () => ({
  AlphabetLetterLearnActivity: ({
    unitId,
    onMarkComplete,
    onBack,
  }: {
    unitId: string;
    onMarkComplete: () => void;
    onBack: () => void;
  }) => (
    <ActivityShell unitId={unitId} onBack={onBack}>
      <button onClick={onMarkComplete}>글자 듣기 완료</button>
    </ActivityShell>
  ),
}));
vi.mock('../activities/WordListenChooseActivity', () => ({
  WordListenChooseActivity: ({
    unitId,
    onMarkComplete,
    onBack,
  }: {
    unitId: string;
    onMarkComplete: () => void;
    onBack: () => void;
  }) => (
    <ActivityShell unitId={unitId} onBack={onBack}>
      <button onClick={onMarkComplete}>소리 놀이 완료</button>
    </ActivityShell>
  ),
}));
vi.mock('../activities/AlphabetLetterWriteActivity', () => ({
  AlphabetLetterWriteActivity: ({
    onMarkComplete,
    onFinish,
    onBack,
  }: {
    onMarkComplete: () => void;
    onFinish?: () => void;
    onBack: () => void;
  }) => (
    <button
      onClick={() => {
        onMarkComplete();
        (onFinish ?? onBack)();
      }}
    >
      쓰기 완료
    </button>
  ),
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
it('returns from a completed English activity to the selected chapter without continuing the lesson', async () => {
  markActivityCompleted('english', 'en-b1-u01', 'letters-learn');
  render(
    <MemoryRouter
      initialEntries={['/library/phonics/english/en-b1-u01/letters-learn?mode=curriculum']}
    >
      <Routes>
        <Route
          path="/library/phonics/english/:unitId/:activityKey"
          element={<EnglishPhonicsActivityPage />}
        />
        <Route path="/library/phonics/english" element={<PhonicsLearningModes lang="english" />} />
      </Routes>
    </MemoryRouter>
  );
  fireEvent.click(await screen.findByRole('button', { name: '글자 듣기 완료' }));
  expect(await screen.findByRole('heading', { name: 'Unit 01: Aa Bb Cc' })).toBeDefined();
  expect(screen.queryByRole('button', { name: '소리 놀이 완료' })).toBeNull();
  const replay = screen.getByRole('button', { name: 'ABC 배우기 1 다 했어요' });
  expect(replay).toBeEnabled();
  fireEvent.click(replay);
  expect(await screen.findByRole('button', { name: '글자 듣기 완료' })).toBeDefined();
  expect(getUnitProgress('english', 'en-b1-u01').completedActivities).toEqual(['letters-learn']);
  expect(getUnitProgress('english', 'en-b1-u02').completedActivities).toEqual([]);
  expect(screen.queryByRole('status', { name: '다음 챕터가 열렸어!' })).toBeNull();
});
it('opens free writing out of order and returns to the same chapter activity selection after completion', async () => {
  render(
    <MemoryRouter initialEntries={['/library/phonics/english/en-b1-u01/letters-write']}>
      <Routes>
        <Route
          path="/library/phonics/english/:unitId/:activityKey"
          element={<EnglishPhonicsActivityPage />}
        />
        <Route path="/library/phonics/english/:unitId" element={<EnglishPhonicsStudyPage />} />
      </Routes>
    </MemoryRouter>
  );
  fireEvent.click(await screen.findByRole('button', { name: '쓰기 완료' }));
  expect(await screen.findByRole('heading', { name: '영어 파닉스 자유모드' })).toBeDefined();
  expect(getUnitProgress('english', 'en-b1-u01').completedActivities).toEqual(['letters-write']);
  fireEvent.click(screen.getByRole('button', { name: '꾹꾹 누르기' }));
  expect(
    within(screen.getByRole('dialog', { name: '꾹꾹 누르기' })).getByRole('link', {
      name: /ABC 배우기 1/,
    })
  ).toHaveAttribute('href', '/library/phonics/english/en-b1-u01/letters-learn');
  expect(screen.queryByRole('button', { name: '글자 듣기 완료' })).toBeNull();
});
it('automatically connects learning, game and writing after completion, then returns to the path', async () => {
  render(
    <MemoryRouter
      initialEntries={['/library/phonics/english/en-b1-u01/letters-learn?mode=curriculum']}
    >
      <Routes>
        <Route
          path="/library/phonics/english/:unitId/:activityKey"
          element={<EnglishPhonicsActivityPage />}
        />
        <Route path="/library/phonics/english" element={<p>학습 경로</p>} />
      </Routes>
    </MemoryRouter>
  );
  expect(screen.queryByRole('button', { name: /다음 활동으로/ })).toBeNull();
  fireEvent.click(await screen.findByRole('button', { name: '글자 듣기 완료' }));
  expect(screen.queryByRole('button', { name: '글자 듣기 완료' })).toBeNull();
  expect(screen.queryByRole('dialog')).toBeNull();

  fireEvent.click(await screen.findByRole('button', { name: '소리 놀이 완료' }));

  fireEvent.click(await screen.findByRole('button', { name: '쓰기 완료' }));

  fireEvent.click(await screen.findByRole('button', { name: '낱말 연결 연습 완료' }));
  expect(await screen.findByText('학습 경로')).toBeDefined();
  expect(getUnitProgress('english', 'en-b1-u01').completedActivities).toEqual([
    'letters-learn',
    'word-listen-choose',
    'letters-write',
    'word-learning',
  ]);
}, 9000);

it('continues free letter learning directly into writing, recording each phase only when finished', async () => {
  render(
    <MemoryRouter initialEntries={['/library/phonics/english/en-b1-u01/letters-learn']}>
      <Routes>
        <Route
          path="/library/phonics/english/:unitId/:activityKey"
          element={<EnglishPhonicsActivityPage />}
        />
        <Route path="/library/phonics/english/:unitId" element={<EnglishPhonicsStudyPage />} />
      </Routes>
    </MemoryRouter>
  );
  fireEvent.click(await screen.findByRole('button', { name: '글자 듣기 완료' }));
  expect(await screen.findByRole('button', { name: '쓰기 완료' })).toBeDefined();
  expect(getUnitProgress('english', 'en-b1-u01').completedActivities).toEqual(['letters-learn']);
  fireEvent.click(screen.getByRole('button', { name: '쓰기 완료' }));
  expect(await screen.findByRole('heading', { name: '영어 파닉스 자유모드' })).toBeDefined();
  expect(getUnitProgress('english', 'en-b1-u01').completedActivities).toEqual([
    'letters-learn',
    'letters-write',
  ]);
});

it('sets its own metadata on direct english activity entry', async () => {
  document.title = 'previous unrelated page';
  render(
    <MemoryRouter
      initialEntries={['/library/phonics/english/en-b1-u01/letters-learn?mode=curriculum']}
    >
      <Routes>
        <Route
          path="/library/phonics/english/:unitId/:activityKey"
          element={<EnglishPhonicsActivityPage />}
        />
      </Routes>
    </MemoryRouter>
  );
  expect(await screen.findByRole('button', { name: '글자 듣기 완료' })).toBeDefined();
  expect(document.title).toBe('영어 파닉스 학습 — 탱고북');
  expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://www.tangobook.co.kr/library/phonics/english'
  );
});
