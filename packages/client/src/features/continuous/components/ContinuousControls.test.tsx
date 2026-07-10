import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ContinuousControls } from './ContinuousControls';
import { PlaylistEndScreen } from './PlaylistEndScreen';
import { usePlaylistStore } from '../store/playlist.store';

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => vi.fn() };
});

// 컨트롤은 기본 숨김(재생 화면을 가리지 않게) → 테스트는 하단 "컨트롤 열기" 탭 영역으로 먼저 연다.
function renderControls() {
  const utils = render(
    <MemoryRouter>
      <ContinuousControls />
    </MemoryRouter>
  );
  fireEvent.click(screen.getByLabelText('컨트롤 열기'));
  return utils;
}

describe('ContinuousControls', () => {
  afterEach(() => {
    usePlaylistStore.getState().reset();
  });

  it('starts hidden — only bottom "컨트롤 열기" tap zone until opened', () => {
    usePlaylistStore.getState().setQueue([{ bookId: 'a' }], 'ko');
    render(
      <MemoryRouter>
        <ContinuousControls />
      </MemoryRouter>
    );
    expect(screen.getByLabelText('컨트롤 열기')).toBeInTheDocument();
    expect(screen.queryByText('⏸ 일시정지')).not.toBeInTheDocument();
    // 하단 탭 → 컨트롤 노출
    fireEvent.click(screen.getByLabelText('컨트롤 열기'));
    expect(screen.getByText('⏸ 일시정지')).toBeInTheDocument();
  });

  it('renders progress "N권 중 M권" from store', () => {
    usePlaylistStore.getState().setQueue([{ bookId: 'a' }, { bookId: 'b' }, { bookId: 'c' }], 'ko');
    usePlaylistStore.getState().next(); // index 1 -> current 2
    renderControls();
    expect(screen.getByText('3권 중 2권')).toBeInTheDocument();
  });

  it('speed chip updates store speed', () => {
    usePlaylistStore.getState().setQueue([{ bookId: 'a' }], 'ko');
    renderControls();
    fireEvent.click(screen.getByText('1.25×'));
    expect(usePlaylistStore.getState().speed).toBe(1.25);
  });

  it('sleep chip updates store sleepMinutes', () => {
    usePlaylistStore.getState().setQueue([{ bookId: 'a' }], 'ko');
    renderControls();
    fireEvent.click(screen.getByText('20분'));
    expect(usePlaylistStore.getState().sleepMinutes).toBe(20);
    // cleanup timer
    usePlaylistStore.getState().clearSleep();
  });

  it('shows 다음 책 and 나가기 actions', () => {
    usePlaylistStore.getState().setQueue([{ bookId: 'a' }], 'ko');
    renderControls();
    expect(screen.getByText(/다음 책/)).toBeInTheDocument();
    expect(screen.getByText(/나가기/)).toBeInTheDocument();
  });

  it('shows 일시정지 button when playing and ▶ 재생 when paused', () => {
    usePlaylistStore.getState().setQueue([{ bookId: 'a' }], 'ko');
    renderControls();
    // Initially playing → shows pause button
    expect(screen.getByText('⏸ 일시정지')).toBeInTheDocument();
    expect(screen.queryByText('▶ 재생')).not.toBeInTheDocument();

    // Click to pause
    fireEvent.click(screen.getByText('⏸ 일시정지'));
    expect(usePlaylistStore.getState().paused).toBe(true);
    expect(screen.getByText('▶ 재생')).toBeInTheDocument();
    expect(screen.queryByText('⏸ 일시정지')).not.toBeInTheDocument();

    // Click to resume
    fireEvent.click(screen.getByText('▶ 재생'));
    expect(usePlaylistStore.getState().paused).toBe(false);
    expect(screen.getByText('⏸ 일시정지')).toBeInTheDocument();
  });

  it('pause button calls togglePause on the store', () => {
    usePlaylistStore.getState().setQueue([{ bookId: 'a' }], 'ko');
    const spy = vi.spyOn(usePlaylistStore.getState(), 'togglePause');
    renderControls();
    fireEvent.click(screen.getByText('⏸ 일시정지'));
    expect(spy).toHaveBeenCalledOnce();
    spy.mockRestore();
  });
});

describe('PlaylistEndScreen', () => {
  it('renders copy and wires restart/exit', () => {
    const onRestart = vi.fn();
    const onExit = vi.fn();
    render(<PlaylistEndScreen onRestart={onRestart} onExit={onExit} />);
    expect(screen.getByText('다 읽었어요')).toBeInTheDocument();
    fireEvent.click(screen.getByText(/다시 보기/));
    expect(onRestart).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByText(/나가기/));
    expect(onExit).toHaveBeenCalledOnce();
  });
});
