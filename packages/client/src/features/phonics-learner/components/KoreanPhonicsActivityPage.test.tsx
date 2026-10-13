import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import KoreanPhonicsActivityPage from './KoreanPhonicsActivityPage';
import { PhonicsLearningModes } from './PhonicsLearningModes';
import { getUnitProgress, markActivityCompleted } from '../lib/progress-store';

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

function open(path: string, chapter = false) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/library/phonics/korean/:unitId/:activityKey"
          element={<KoreanPhonicsActivityPage />}
        />
        <Route path="/library/phonics/korean/:unitId" element={<p>단원 화면</p>} />
        <Route
          path="/library/phonics/korean"
          element={chapter ? <PhonicsLearningModes lang="korean" /> : <p>학습 경로</p>}
        />
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

describe('커리큘럼 모드 라우트', () => {
  it('첫 챕터 실제 완료 콜백 뒤 다음 챕터 잠금 연출을 거쳐 ㅑ 듣기로 이어진다', async () => {
    open('/library/phonics/korean/kr-v1-u01/listen-1?mode=curriculum', true);
    fireEvent.click(await screen.findByRole('button', { name: '들은 모음 ㅏ' }));
    fireEvent.click(await screen.findByRole('button', { name: '쓴 모음 ㅏ' }));
    expect(await screen.findByRole('status', { name: '다음 챕터가 열렸어!' })).toBeDefined();
    await waitFor(() => expect(screen.queryByRole('status')).toBeNull(), { timeout: 2500 });
    expect(screen.getByRole('heading', { name: 'ㅑ 배우기' })).toBeDefined();
    fireEvent.click(screen.getByRole('link', { name: /이어서 학습하기/ }));
    expect(await screen.findByRole('button', { name: '들은 모음 ㅑ' })).toBeDefined();
    expect(getUnitProgress('korean', 'kr-v1-u02').completedActivities).toEqual([]);
  });
  it('미래 활동 직접 진입을 첫 미완료 활동으로 돌린다', async () => {
    open('/library/phonics/korean/kr-v1-g02/listen-1?mode=curriculum');
    expect(await screen.findByRole('button', { name: '들은 모음 ㅏ' })).toBeDefined();
    expect(getUnitProgress('korean', 'kr-v1-g02').completedActivities).toEqual([]);
  });
  it('개별 모음 챕터에서 듣기와 쓰기를 마치면 다음 챕터 안내 화면으로 돌아온다', async () => {
    open('/library/phonics/korean/kr-v1-g01/listen-1?mode=curriculum');
    fireEvent.click(await screen.findByRole('button', { name: '들은 모음 ㅏ' }));
    fireEvent.click(await screen.findByRole('button', { name: '쓴 모음 ㅏ' }));
    expect(await screen.findByText('학습 경로')).toBeDefined();
    expect(getUnitProgress('korean', 'kr-v1-u01').completedActivities).toEqual([
      'listen-1',
      'write-1',
    ]);
    expect(getUnitProgress('korean', 'kr-v1-g01').completedActivities).toEqual([
      'listen-1',
      'write-1',
    ]);
  });
  it('구형 링크도 안내 모드를 유지하며 건너뛰기를 막는다', async () => {
    open('/library/phonics/korean/kr-v1-u02/listen-1?mode=curriculum');
    expect(await screen.findByRole('button', { name: '들은 모음 ㅏ' })).toBeDefined();
  });
  it('완료한 활동을 다시 익힐 때 같은 단원의 다음 활동으로 이어진다', async () => {
    ['listen-1', 'write-1'].forEach((key) => markActivityCompleted('korean', 'kr-v1-g01', key));
    open('/library/phonics/korean/kr-v1-g01/listen-1?mode=curriculum');
    fireEvent.click(await screen.findByRole('button', { name: '들은 모음 ㅏ' }));
    expect(await screen.findByRole('button', { name: '쓴 모음 ㅏ' })).toBeDefined();
  });
});
