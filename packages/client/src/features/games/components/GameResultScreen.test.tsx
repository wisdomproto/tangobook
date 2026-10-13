import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GameResultScreen } from './GameResultScreen';

const audio = vi.hoisted(() => ({
  src: '',
  onended: null as (() => void) | null,
  onerror: null as (() => void) | null,
  play: vi.fn().mockResolvedValue(undefined),
  pause: vi.fn(),
}));
vi.mock('@/lib/audio-unlock', () => ({ getSharedAudio: () => audio }));
vi.mock('@/features/settings/api/settings.api', () => ({
  settingsApi: {
    getSystemSounds: vi.fn().mockResolvedValue({
      korean: { correct: [{ url: '/ko-praise.mp3' }] },
      english: { correct: [{ url: '/en-praise.mp3' }] },
    }),
  },
}));

describe('GameResultScreen', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    audio.src = '';
    audio.onended = null;
    audio.onerror = null;
  });
  it('keeps the final count readable and separates retry from exit', () => {
    const restart = vi.fn();
    const back = vi.fn();
    render(
      <MemoryRouter>
        <GameResultScreen score={2} total={4} onRestart={restart} onBack={back} />
      </MemoryRouter>
    );
    expect(screen.getByRole('region', { name: '활동 결과' })).toBeVisible();
    expect(screen.getByText('4개 중 2개 완성')).toBeInTheDocument();
    expect(back).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /다시 하기/ }));
    expect(restart).toHaveBeenCalledOnce();
    expect(back).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /확인/ }));
    expect(back).toHaveBeenCalledOnce();
  });
  it('waits for the real completion sound ended before Korean praise and stops everything on exit', async () => {
    const view = render(
      <MemoryRouter>
        <GameResultScreen score={4} total={4} lang="ko" onRestart={vi.fn()} onBack={vi.fn()} />
      </MemoryRouter>
    );
    await act(async () => {
      await Promise.resolve();
    });
    expect(audio.src).toBe('/sounds/learning/complete.mp3');
    expect(audio.play).toHaveBeenCalledOnce();
    const ended = audio.onended!;
    act(() => ended());
    await waitFor(() => expect(audio.src).toBe('/ko-praise.mp3'));
    expect(audio.play).toHaveBeenCalledTimes(2);
    expect(view.container.querySelector('.learning-completion-seal')).not.toBeNull();
    expect(view.container.querySelector('.game-result-hero img')).toBeNull();
    view.unmount();
    expect(audio.src).toBe('');
    expect(audio.onended).toBeNull();
    act(() => ended());
    expect(audio.play).toHaveBeenCalledTimes(2);
  });
  it('continues to English praise if the completion asset fails', async () => {
    render(
      <MemoryRouter>
        <GameResultScreen score={4} total={4} lang="en" onRestart={vi.fn()} onBack={vi.fn()} />
      </MemoryRouter>
    );
    await act(async () => {
      await Promise.resolve();
    });
    act(() => audio.onerror!());
    await waitFor(() => expect(audio.src).toBe('/en-praise.mp3'));
  });
  it('respects game mute without suppressing the visible result', () => {
    localStorage.setItem('tangobook-game-muted', 'true');
    render(
      <MemoryRouter>
        <GameResultScreen score={4} total={4} onRestart={vi.fn()} onBack={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.getByRole('region', { name: '활동 결과' })).toBeVisible();
    expect(audio.play).not.toHaveBeenCalled();
  });
});
