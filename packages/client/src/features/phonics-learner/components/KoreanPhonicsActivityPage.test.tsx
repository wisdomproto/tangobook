import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import KoreanPhonicsActivityPage from './KoreanPhonicsActivityPage';
import { getUnitProgress } from '../lib/progress-store';

const { logEvent } = vi.hoisted(() => ({ logEvent: vi.fn() }));
vi.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: () => ({ activeProfile: null }),
}));
vi.mock('@/features/learning/hooks/useLogEvent', () => ({ useLogEvent: () => logEvent }));
vi.mock('@/features/storybook/hooks/useStorybooks', () => ({ useStorybook: () => ({}) }));
vi.mock('../hooks/useReviewCardSources', () => ({
  useReviewCardSources: () => ({ sources: [], isLoading: false }),
}));
vi.mock('../activities/VowelListenActivity', () => ({
  VowelListenActivity: ({
    vowels,
    onMarkComplete,
    onNext,
  }: {
    vowels: { vowel: string }[];
    onMarkComplete: () => void;
    onNext: () => void;
  }) => (
    <button
      onClick={() => {
        onMarkComplete();
        onNext();
      }}
    >
      들은 모음 {vowels[0].vowel}
    </button>
  ),
}));
vi.mock('../activities/VowelWriteActivity', () => ({
  VowelWriteActivity: ({
    vowels,
    onComplete,
  }: {
    vowels: { writeLetter: string }[];
    onComplete: () => void;
  }) => <button onClick={onComplete}>쓴 모음 {vowels[0].writeLetter}</button>,
}));

function open(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/library/phonics/korean/:unitId/:activityKey"
          element={<KoreanPhonicsActivityPage />}
        />
        <Route path="/library/phonics/korean/:unitId" element={<p>단원 화면</p>} />
      </Routes>
    </MemoryRouter>
  );
}
beforeEach(() => {
  localStorage.clear();
  logEvent.mockClear();
});
describe('모음 묶음의 실제 라우트와 진도 연결', () => {
  it('구형 ㅑ 듣기를 정확한 새 활동으로 연결하고 ㅑ 쓰기 뒤 ㅓ 익히기로 이동한다', async () => {
    open('/library/phonics/korean/kr-v1-u02/listen-1');
    fireEvent.click(await screen.findByRole('button', { name: '들은 모음 ㅑ' }));
    fireEvent.click(await screen.findByRole('button', { name: '쓴 모음 ㅑ' }));
    expect(await screen.findByRole('button', { name: '들은 모음 ㅓ' })).toBeDefined();
    expect(getUnitProgress('korean', 'kr-v1-g01').completedActivities).toEqual([
      'listen-2',
      'write-2',
    ]);
    expect(getUnitProgress('korean', 'kr-v1-g02').completedActivities).toEqual([]);
    expect(logEvent.mock.calls.map(([event]) => event.metadata.activityId)).toEqual([
      'listen-2',
      'write-2',
    ]);
    expect(logEvent.mock.calls.every(([event]) => event.metadata.unitId === 'kr-v1-g01')).toBe(
      true
    );
  });
  it('묶음의 마지막 쓰기 뒤 단원으로 돌아가고 놀이 완료는 자동으로 만들지 않는다', async () => {
    open('/library/phonics/korean/kr-v1-g01/write-4');
    fireEvent.click(screen.getByRole('button', { name: '쓴 모음 ㅕ' }));
    await waitFor(() => expect(screen.getByText('단원 화면')).toBeDefined());
    expect(getUnitProgress('korean', 'kr-v1-g01').completedActivities).toEqual(['write-4']);
  });
  it('학습 전 놀이 딥링크는 아직 배우지 않은 모음 게임을 실행하지 않는다', () => {
    open('/library/phonics/korean/kr-v1-g01/listen-game');
    expect(screen.getByText('모음 두 개를 먼저 들어보면 놀이가 열려요.')).toBeDefined();
    expect(getUnitProgress('korean', 'kr-v1-g01').completedActivities).toEqual([]);
    expect(logEvent).not.toHaveBeenCalled();
  });
});
