import { beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import EnglishPhonicsActivityPage from './EnglishPhonicsActivityPage';
import { ActivityShell } from './ActivityShell';
import { getUnitProgress } from '../lib/progress-store';

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

beforeEach(() => localStorage.clear());
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

  expect(await screen.findByText('학습 경로')).toBeDefined();
  expect(getUnitProgress('english', 'en-b1-u01').completedActivities).toEqual([
    'letters-learn',
    'word-listen-choose',
    'letters-write',
  ]);
});
