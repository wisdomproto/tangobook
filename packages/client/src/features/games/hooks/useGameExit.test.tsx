import { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { useGameExit } from './useGameExit';
import { MemoryRouter } from 'react-router-dom';
import { PageOrderPlayer } from '../components/players/PageOrderPlayer';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

function Host({
  keepsResult,
  completed,
  cancelled,
}: {
  keepsResult: boolean;
  completed: () => void;
  cancelled: () => void;
}) {
  const [open, setOpen] = useState(true);
  const [result, setResult] = useState(false);
  const exit = useGameExit({
    keepsResult,
    onComplete: () => {
      completed();
      setOpen(false);
    },
    onBack: () => {
      cancelled();
      setOpen(false);
    },
  });
  return open ? (
    <div>
      <button
        onClick={() => {
          setResult(true);
          exit.onComplete();
        }}
      >
        Finish round
      </button>
      {result && (
        <div>
          <p>Game result</p>
          <button onClick={() => setResult(false)}>Try again</button>
        </div>
      )}
      <button onClick={exit.onBack}>Back</button>
    </div>
  ) : (
    <p>Activity list</p>
  );
}

describe('game completion and host dismissal', () => {
  it('retains the real page-order result and supports another round before confirming', async () => {
    const user = userEvent.setup();
    function ActivityHost() {
      const [open, setOpen] = useState(true);
      const exit = useGameExit({
        keepsResult: true,
        onComplete: () => setOpen(false),
        onBack: () => setOpen(false),
      });
      return open ? (
        <PageOrderPlayer
          storybookId="test-book"
          difficulty="medium"
          gameData={{
            type: 'korean-page-order',
            items: [{ pageNumber: 1, illustrationUrl: '/page.webp' }],
          }}
          {...exit}
        />
      ) : (
        <p>Activity list</p>
      );
    }
    render(
      <MemoryRouter>
        <ActivityHost />
      </MemoryRouter>
    );
    await user.click(screen.getByLabelText('그림 고르기'));
    await waitFor(() => expect(screen.getByRole('button', { name: /다시 하기/ })).toBeVisible());
    await user.click(screen.getByRole('button', { name: /다시 하기/ }));
    await user.click(screen.getByLabelText('그림 고르기'));
    await user.click(screen.getByRole('button', { name: '확인' }));
    expect(screen.getByText('Activity list')).toBeVisible();
  });
  it('keeps the result mounted, permits retry, and dismisses only on explicit back', async () => {
    const user = userEvent.setup(),
      completed = vi.fn(),
      cancelled = vi.fn();
    render(<Host keepsResult completed={completed} cancelled={cancelled} />);
    await user.click(screen.getByText('Finish round'));
    expect(screen.getByText('Game result')).toBeVisible();
    expect(completed).not.toHaveBeenCalled();
    await user.click(screen.getByText('Try again'));
    expect(screen.queryByText('Game result')).toBeNull();
    await user.click(screen.getByText('Finish round'));
    await user.click(screen.getByText('Back'));
    expect(screen.getByText('Activity list')).toBeVisible();
    expect(completed).toHaveBeenCalledTimes(1);
    expect(cancelled).not.toHaveBeenCalled();
  });
  it('does not mark an unfinished activity complete when leaving', async () => {
    const completed = vi.fn(),
      cancelled = vi.fn();
    render(<Host keepsResult completed={completed} cancelled={cancelled} />);
    await userEvent.click(screen.getByText('Back'));
    expect(cancelled).toHaveBeenCalledOnce();
    expect(completed).not.toHaveBeenCalled();
  });
  it('preserves immediate exit for players whose complete callback is their exit action', async () => {
    const completed = vi.fn();
    render(<Host keepsResult={false} completed={completed} cancelled={vi.fn()} />);
    await userEvent.click(screen.getByText('Finish round'));
    expect(screen.getByText('Activity list')).toBeVisible();
    expect(completed).toHaveBeenCalledOnce();
  });
});
