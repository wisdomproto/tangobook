import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { TitleIntro } from './TitleIntro';

/**
 * 🔴 이 화면의 위험은 「자동 시작이 브라우저에 막히는 것」이다. 막힌 걸 성공으로 치고 진행하면
 *    페이지 TTS 도 막힌 채 무음으로 흐르고, 연속재생 stall-guard 가 무음 책을 순식간에 넘겨
 *    「다 읽었어요」로 직행한다. 그래서 카운트다운·차단 폴백·손 탭 세 갈래를 잠근다.
 */
/**
 * 카운트다운은 「타이머 → setState → effect 가 다음 타이머 예약」 구조라, act 한 번에 한 틱만 돈다.
 * 2000ms 를 한 번에 흘리면 1초치만 진행하므로 초 단위로 나눠 흘린다.
 */
async function tickSeconds(n: number) {
  for (let i = 0; i < n; i++) {
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
  }
}

function renderIntro(onComplete = vi.fn()) {
  render(
    <TitleIntro
      title="헨젤과 그레텔"
      titleTtsUrl="https://example.test/title.mp3"
      autoPlay={false}
      onComplete={onComplete}
    />
  );
  return onComplete;
}

describe('TitleIntro 시작 게이트', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    HTMLMediaElement.prototype.play = vi.fn(() => Promise.resolve());
  });
  afterEach(() => vi.useRealTimers());

  it('탭 게이트에 남은 초를 보여준다 — 예전엔 안내가 컨트롤 바에 가려 아무 것도 안 보였다', async () => {
    renderIntro();
    expect(screen.getByText(/5초 뒤에 시작해요/)).toBeInTheDocument();
    await tickSeconds(2);
    expect(screen.getByText(/3초 뒤에 시작해요/)).toBeInTheDocument();
  });

  it('5초가 지나면 손 안 대도 시작한다', async () => {
    renderIntro();
    await tickSeconds(5);
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();
    expect(screen.queryByText(/뒤에 시작해요/)).toBeNull();
  });

  it('🔴 자동 시작이 브라우저에 막히면 진행하지 않고 탭 게이트로 되돌아온다', async () => {
    HTMLMediaElement.prototype.play = vi.fn(() => Promise.reject(new Error('NotAllowedError')));
    const onComplete = renderIntro();
    await tickSeconds(5);
    // 🔴 여기서 바로 단언하면 안 된다 — 잘못된 구현이 거는 600ms 폴백 타이머가 아직 안 흘러서
    //    깨진 코드도 통과한다(실제로 그렇게 통과하는 걸 확인하고 이 줄을 넣었다).
    await act(async () => {
      vi.advanceTimersByTime(1500);
    });
    expect(onComplete).not.toHaveBeenCalled();
    expect(screen.getByText(/화면을 한 번 누르면/)).toBeInTheDocument();
  });

  it('손으로 눌러서 실패하면 그건 음원 문제라 그냥 진행한다', async () => {
    HTMLMediaElement.prototype.play = vi.fn(() => Promise.reject(new Error('no source')));
    const onComplete = renderIntro();
    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });
    act(() => void vi.advanceTimersByTime(700));
    expect(onComplete).toHaveBeenCalled();
  });

  it('자동재생 모드(연속재생 2번째 책+)엔 카운트다운을 띄우지 않는다', () => {
    render(<TitleIntro title="두 번째 책" autoPlay onComplete={vi.fn()} />);
    expect(screen.queryByText(/뒤에 시작해요/)).toBeNull();
  });
});
