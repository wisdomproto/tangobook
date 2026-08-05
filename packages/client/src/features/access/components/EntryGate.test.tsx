import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { EntryGate } from './EntryGate';
import * as guestMode from '../lib/guest-mode';

function renderGate(expired = false) {
  const onChoose = vi.fn();
  render(
    <MemoryRouter>
      <EntryGate expired={expired} onChoose={onChoose} />
    </MemoryRouter>
  );
  return onChoose;
}

describe('EntryGate', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(guestMode, 'startGuestMode').mockImplementation(() => {});
    vi.spyOn(guestMode, 'markAuthChoice').mockImplementation(() => {});
  });

  /**
   * 🔴 예전엔 게스트 버튼이 ⚠️ 확인 화면을 한 번 더 띄웠다. 그 화면의 근거("학습 기록이 저장되지
   *    않아요")가 이제 사실이 아니다 — 게스트 기록은 로컬에 쌓이고 가입 시 프로필로 옮겨진다.
   *    없는 손해를 알리려고 첫 진입을 막고 있었으므로, 한 번에 들어가야 한다.
   */
  it('게스트 버튼 한 번이면 바로 들어간다 — 확인 단계 없음', () => {
    const onChoose = renderGate();
    fireEvent.click(screen.getByText(/게스트로/));
    expect(guestMode.startGuestMode).toHaveBeenCalledTimes(1);
    expect(onChoose).toHaveBeenCalledTimes(1);
    // ⚠️ 확인 화면이 끼어들지 않는다. (게이트 자체가 role="dialog" 라 role 로는 못 가른다.)
    expect(screen.queryByText('⚠️')).toBeNull();
  });

  it('버튼 밑 문구가 기록을 부정하지 않는다 — 로컬에 저장되고 가입 시 옮겨지므로', () => {
    renderGate();
    expect(screen.queryByText(/저장되지 않아요/)).toBeNull();
  });

  it('30일이 끝난 재방문(expired)에는 게스트 버튼이 없다', () => {
    renderGate(true);
    expect(screen.queryByText(/게스트로/)).toBeNull();
  });
});
