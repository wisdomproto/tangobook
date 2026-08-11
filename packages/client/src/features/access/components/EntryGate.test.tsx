import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { EntryGate } from './EntryGate';

const navigate = vi.hoisted(() => vi.fn());
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

function renderGate() {
  navigate.mockClear();
  render(
    <MemoryRouter>
      <EntryGate />
    </MemoryRouter>
  );
}

/**
 * 🔴 이 화면은 이제 **로그인 벽**이다(2026-08-11). 게스트 30일 창을 폐지하면서 성격이 바뀌었다 —
 *    라이브러리는 미로그인도 무료 책 11권을 그냥 보고, 이 벽은 부분 공개가 불가능한 화면
 *    (파닉스 학습)에만 붙는다. 그래서 여기 게스트 경로가 다시 생기면 안 된다.
 */
describe('EntryGate (로그인 벽)', () => {
  it('길은 가입과 로그인 둘뿐 — 게스트로 들어가는 문이 없다', () => {
    renderGate();
    expect(screen.queryByText(/게스트/)).toBeNull();
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('가입은 가입 폼으로 직행한다 (로그인 폼이 아니라)', () => {
    renderGate();
    fireEvent.click(screen.getByText(/회원가입|가입/));
    expect(navigate).toHaveBeenCalledWith('/login?mode=signup');
  });

  it('로그인은 로그인 폼으로 간다', () => {
    renderGate();
    fireEvent.click(screen.getByText('이미 계정이 있어요'));
    expect(navigate).toHaveBeenCalledWith('/login');
  });
});
