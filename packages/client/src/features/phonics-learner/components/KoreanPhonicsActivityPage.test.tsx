import { beforeEach, describe, expect, it, vi } from 'vitest';
import { configure, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import KoreanPhonicsActivityPage from './KoreanPhonicsActivityPage';
import { PhonicsLearningModes } from './PhonicsLearningModes';
import KoreanPhonicsStudyPage from './KoreanPhonicsStudyPage';
import { getUnitProgress, markActivityCompleted } from '../lib/progress-store';
import { GUIDED_COMPLETION_MS } from './GuidedActivityTransition';

configure({ asyncUtilTimeout: GUIDED_COMPLETION_MS + 800 });

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
    repetitions,
    onComplete,
  }: {
    vowels: { writeLetter: string }[];
    repetitions: number;
    onComplete: () => void;
  }) => (
    <button data-repetitions={repetitions} onClick={onComplete}>
      쓴 모음 {vowels[0].writeLetter}
    </button>
  ),
}));
vi.mock('../activities/ConsonantTapActivity', () => ({
  ConsonantTapActivity: ({ onComplete }: { onComplete: () => void }) => (
    <button onClick={onComplete}>자음 누르기 완료</button>
  ),
}));
vi.mock('../activities/WordListenChooseActivity', () => ({
  WordListenChooseActivity: ({
    items,
    onMarkComplete,
  }: {
    items: { label: string }[];
    onMarkComplete: () => void;
  }) => (
    <button onClick={onMarkComplete}>모음 놀이 {items.map((item) => item.label).join('')}</button>
  ),
}));

function open(path: string, chapter = false) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/library/phonics/korean/:unitId/:activityKey"
          element={<KoreanPhonicsActivityPage />}
        />
        <Route path="/library/phonics/korean/:unitId" element={<KoreanPhonicsStudyPage />} />
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
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
  };
});
describe('모음 묶음의 실제 라우트와 진도 연결', () => {
  it('자음 배우기 완료 뒤 같은 자음 쓰기를 세 번 하고 챕터로 돌아온다', async () => {
    open('/library/phonics/korean/kr-h1-u02/consonant-tap');
    fireEvent.click(await screen.findByRole('button', { name: '자음 누르기 완료' }));
    const write = await screen.findByRole('button', { name: '쓴 모음 ㄱ' });
    expect(write).toHaveAttribute('data-repetitions', '3');
    expect(getUnitProgress('korean', 'kr-h1-u02').completedActivities).toEqual(['consonant-tap']);
    fireEvent.click(write);
    expect(await screen.findByRole('heading', { name: '한글 파닉스 자유모드' })).toBeDefined();
    expect(getUnitProgress('korean', 'kr-h1-u02').completedActivities).toEqual([
      'consonant-tap',
      'letter-write',
    ]);
    expect(document.querySelector('.journey-map-panel')).toBeNull();
    expect(screen.getByRole('button', { name: '블록 놀이' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: '소리 합치기' })).toBeNull();
  });
  it('구형 ㅑ 듣기를 정확한 쓰기로 이어주고 둘 다 마치면 같은 챕터로 돌아온다', async () => {
    open('/library/phonics/korean/kr-v1-u02/listen-1');
    fireEvent.click(await screen.findByRole('button', { name: '들은 모음 ㅑ' }));
    expect(screen.queryByRole('heading', { name: '한글 파닉스 자유모드' })).toBeNull();
    fireEvent.click(await screen.findByRole('button', { name: '쓴 모음 ㅑ' }));
    expect(await screen.findByRole('heading', { name: '한글 파닉스 자유모드' })).toBeDefined();
    expect(screen.queryByRole('button', { name: '들은 모음 ㅓ' })).toBeNull();
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
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: '한글 파닉스 자유모드' })).toBeDefined()
    );
    expect(getUnitProgress('korean', 'kr-v1-g01').completedActivities).toEqual(['write-4']);
  });
  it('자유모드 놀이를 미학습 상태에서 열되 방문을 완료로 기록하지 않는다', () => {
    open('/library/phonics/korean/kr-v1-g01/listen-game');
    expect(screen.getByRole('button', { name: /모음 놀이/ }).textContent).toContain('ㅏ');
    expect(screen.getByRole('button', { name: /모음 놀이/ }).textContent).toContain('ㅕ');
    expect(screen.queryByText('모음 두 개를 먼저 들어보면 놀이가 열려요.')).toBeNull();
    expect(getUnitProgress('korean', 'kr-v1-g01').completedActivities).toEqual([]);
    expect(logEvent).not.toHaveBeenCalled();
  });
  it('자유모드 게임 완료 뒤 해당 챕터 활동 선택으로 돌아오고 다른 활동은 완료로 만들지 않는다', async () => {
    open('/library/phonics/korean/kr-v1-g02/listen-game');
    fireEvent.click(screen.getByRole('button', { name: /모음 놀이/ }));
    expect(await screen.findByRole('heading', { name: '한글 파닉스 자유모드' })).toBeDefined();
    expect(getUnitProgress('korean', 'kr-v1-g02').completedActivities).toEqual(['listen-game']);
    expect(screen.getByRole('button', { name: '블록 놀이' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: '꾹꾹 누르기' })).toBeNull();
  });
});

describe('커리큘럼 모드 라우트', () => {
  it('첫 챕터 실제 완료 콜백 뒤 다음 챕터 잠금 연출을 거쳐 ㅑ 듣기로 이어진다', async () => {
    open('/library/phonics/korean/kr-v1-u01/listen-1?mode=curriculum', true);
    fireEvent.click(await screen.findByRole('button', { name: '들은 모음 ㅏ' }));
    expect(
      (await screen.findByRole('button', { name: '쓴 모음 ㅏ' })).getAttribute('data-repetitions')
    ).toBe('3');
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '쓴 모음 ㅏ' }));
    expect(await screen.findByRole('status', { name: '다음 챕터가 열렸어!' })).toBeDefined();
    await waitFor(() => expect(screen.queryByRole('status')).toBeNull(), { timeout: 2500 });
    expect(screen.getByRole('button', { name: /^2번째 단계.*지금 배울 단계/ })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('list', { name: '이번 챕터의 활동' }).children).toHaveLength(3);
    const nextActivity = screen.getByRole('button', { name: 'ㅑ 배우기 지금 배울 단계' });
    expect(nextActivity).toBeEnabled();
    fireEvent.click(nextActivity);
    expect(await screen.findByRole('button', { name: '들은 모음 ㅑ' })).toBeDefined();
    expect(getUnitProgress('korean', 'kr-v1-u02').completedActivities).toEqual([]);
    // Two real 1.4s activity transitions plus the 1.8s map unlock exceed the
    // default 5s budget once the full suite shares the machine.
  }, 9000);
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
  it('완료한 활동만 다시 익힌 뒤 선택한 챕터 보드로 돌아온다', async () => {
    ['listen-1', 'write-1'].forEach((key) => markActivityCompleted('korean', 'kr-v1-g01', key));
    open('/library/phonics/korean/kr-v1-g01/listen-1?mode=curriculum', true);
    fireEvent.click(await screen.findByRole('button', { name: '들은 모음 ㅏ' }));
    expect(await screen.findByRole('heading', { name: 'ㅏ 배우기' })).toBeDefined();
    expect(screen.queryByRole('button', { name: '쓴 모음 ㅏ' })).toBeNull();
    const replay = screen.getByRole('button', { name: 'ㅏ 배우기 다 했어요' });
    expect(replay).toBeEnabled();
    fireEvent.click(replay);
    expect(await screen.findByRole('button', { name: '들은 모음 ㅏ' })).toBeDefined();
    expect(screen.queryByRole('status', { name: '다음 챕터가 열렸어!' })).toBeNull();
    expect(getUnitProgress('korean', 'kr-v1-u02').completedActivities).toEqual([]);
  });
});

it('sets its own metadata on direct korean activity entry', async () => {
  document.title = 'previous unrelated page';
  render(
    <MemoryRouter initialEntries={['/library/phonics/korean/kr-v1-u01/listen-1?mode=curriculum']}>
      <Routes>
        <Route
          path="/library/phonics/korean/:unitId/:activityKey"
          element={<KoreanPhonicsActivityPage />}
        />
      </Routes>
    </MemoryRouter>
  );
  expect(await screen.findByRole('button', { name: '들은 모음 ㅏ' })).toBeDefined();
  expect(document.title).toBe('한글 파닉스 학습 — 탱고북');
  expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://www.tangobook.co.kr/library/phonics/korean'
  );
});
