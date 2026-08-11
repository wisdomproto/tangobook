import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PinyinToneRowsActivity } from './PinyinToneRowsActivity';
import { getCombineGroups } from '../lib/chinese-phonics-units';

const playAudio = vi.fn((_url?: string, onEnded?: () => void) => onEnded?.());
const playCorrectSequence = vi.fn((opts?: { onDone?: () => void }) => opts?.onDone?.());
// 🔴 mock 이 렌더마다 **새 함수**를 주면 진입 안내 effect(`[playAudio]`)가 매 렌더 다시 울린다 —
//    실제 `useGameAudio` 는 useCallback 이라 안정적이므로, 여기서도 같은 참조를 돌려준다.
const scheduleTimer = (fn: () => void) => {
  fn();
  return 0;
};
const playFeedbackSound = vi.fn();
vi.mock('@/features/games/hooks/useGameAudio', () => ({
  useGameAudio: () => ({
    playAudio,
    playFeedbackSound,
    playCorrectSequence,
    praiseVisible: false,
    // 소리 사이 쉼 — 테스트에선 기다리지 않고 잇는다(재는 건 길이가 아니라 순서다).
    scheduleTimer,
  }),
}));
// 라이브러리 mp3 프리워밍은 네트워크 — 막는다(재생 자체는 directUrl 이라 영향 없음).
vi.mock('@/features/games/hooks/useGamePrefetch', () => ({ warmAudioUrl: vi.fn(async () => {}) }));
// concat 폴백이 안 불려야 정상이지만, 불리면 네트워크 대신 여기서 잡힌다.
const resolveTtsUrl = vi.fn(async () => 'concat:fallback');
vi.mock('@/features/tts', () => ({ resolveTtsUrl: () => resolveTtsUrl() }));

const groups = getCombineGroups('zh-l3-u01');
const ttsBySound = Object.fromEntries(
  groups.flatMap((g) => g.syllables).map((s) => [s, `https://r2.test/${s}.mp3`])
);

function setup(onMarkComplete = vi.fn()) {
  render(
    <PinyinToneRowsActivity
      unitId="zh-l3-u01"
      groups={groups}
      ttsBySound={ttsBySound}
      onMarkComplete={onMarkComplete}
      onBack={vi.fn()}
    />
  );
  return onMarkComplete;
}

describe('병음조합 배우기 (성모 탭 + 4성 줄)', () => {
  beforeEach(() => {
    playAudio.mockClear();
    playCorrectSequence.mockClear();
    resolveTtsUrl.mockClear();
  });

  // 🔴 이 화면의 존재 이유 — 예전엔 성모 글자만 보이고 4성 음절은 소리로만 났다("블렌딩 어디갔어?").
  it('첫 성모의 음절이 진입하자마자 화면에 보인다 (b 는 a·o·i·u 네 줄 16칸)', () => {
    setup();
    for (const syl of ['bā', 'bá', 'bǎ', 'bà', 'bō', 'bī', 'bù']) {
      expect(screen.getByLabelText(syl)).toBeTruthy();
    }
    // 다른 성모 음절은 그 탭에서만 — 72줄을 한 화면에 깔지 않는다.
    expect(screen.queryByLabelText('pā')).toBeNull();
  });

  it('성모 탭을 누르면 그 성모의 줄로 바뀐다 (p 는 pǎ 가 없어 3칸 줄)', () => {
    setup();
    fireEvent.click(screen.getByText('p'));
    expect(screen.getByLabelText('pā')).toBeTruthy();
    expect(screen.getByLabelText('pà')).toBeTruthy();
    expect(screen.queryByLabelText('pǎ')).toBeNull(); // 실존 음절만
    expect(screen.queryByLabelText('bā')).toBeNull();
  });

  // 🔴 음절 탭 = 라이브러리 mp3 **직행**(concat 왕복 0).
  it('음절을 누르면 그 음절의 원어민 녹음이 난다', async () => {
    setup();
    // 진입 안내("눌러서 들어봐!")가 먼저 한 번 — 그 다음이 탭한 음절이다.
    expect(playAudio.mock.calls[0][0]).toBe('/sounds/voice/listen-explore-ko.mp3');
    playAudio.mockClear();
    fireEvent.click(screen.getByLabelText('bǎ'));
    await waitFor(() => expect(playAudio).toHaveBeenCalled());
    expect(playAudio.mock.calls[0][0]).toBe('https://r2.test/bǎ.mp3');
    expect(resolveTtsUrl).not.toHaveBeenCalled();
  });

  it('한 성모를 다 들으면 띵동 → 다음 성모로, 전부 들으면 칭찬 + 완료', async () => {
    const onMarkComplete = setup();
    for (const g of groups) {
      // 그 성모 탭이 화면에 떠 있어야 그 음절을 누를 수 있다(마지막 음절에서 자동으로 다음 성모로 넘어간다).
      expect(screen.getByLabelText(g.syllables[0])).toBeTruthy();
      for (let i = 0; i < g.syllables.length; i++) {
        const syl = g.syllables[i];
        fireEvent.click(screen.getByLabelText(syl));
        // 들은 음절은 ✓ 로 남는다 — 단, 그 성모의 **마지막** 음절은 탭이 넘어가며 화면에서 사라진다.
        if (i < g.syllables.length - 1) {
          await waitFor(() => expect(screen.getByLabelText(syl).textContent).toContain('✓'));
        }
      }
    }
    expect(playAudio.mock.calls.some(([u]) => u === '/sounds/game/correct.mp3')).toBe(true);
    expect(playCorrectSequence).toHaveBeenCalled();
    expect(onMarkComplete).toHaveBeenCalledTimes(1);
  });

  // 다 들은 뒤엔 자유놀이 — 다시 눌러도 소리만 나고 완료가 재발동하지 않는다.
  it('이미 들은 음절 재탭 = 소리만 (완료 재발동 X)', async () => {
    const onMarkComplete = setup();
    fireEvent.click(screen.getByLabelText('bā'));
    await waitFor(() => expect(playAudio).toHaveBeenCalled());
    playAudio.mockClear();
    fireEvent.click(screen.getByLabelText('bā'));
    await waitFor(() => expect(playAudio).toHaveBeenCalledTimes(1));
    expect(onMarkComplete).not.toHaveBeenCalled();
  });
});
