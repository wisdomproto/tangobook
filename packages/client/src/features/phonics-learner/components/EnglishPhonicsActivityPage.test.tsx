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
it('keeps result audio mounted until Next, then connects the game, writing and unit finish', async () => {
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
  expect(screen.getByRole('button', { name: '글자 듣기 완료', hidden: true })).toBeDefined();
  fireEvent.click(screen.getByRole('button', { name: /다음 활동으로/ }));
  fireEvent.click(await screen.findByRole('button', { name: '소리 놀이 완료' }));
  fireEvent.click(screen.getByRole('button', { name: /다음 활동으로/ }));
  fireEvent.click(await screen.findByRole('button', { name: '쓰기 완료' }));
  fireEvent.click(screen.getByRole('button', { name: '학습 경로 보기' }));
  expect(await screen.findByText('학습 경로')).toBeDefined();
  expect(getUnitProgress('english', 'en-b1-u01').completedActivities).toEqual([
    'letters-learn',
    'word-listen-choose',
    'letters-write',
  ]);
});
