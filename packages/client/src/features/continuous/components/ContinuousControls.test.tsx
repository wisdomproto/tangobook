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

function renderControls() {
  return render(
    <MemoryRouter>
      <ContinuousControls />
    </MemoryRouter>
  );
}

describe('ContinuousControls', () => {
  afterEach(() => {
    usePlaylistStore.getState().reset();
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
