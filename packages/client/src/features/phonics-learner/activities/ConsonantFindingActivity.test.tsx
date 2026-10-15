import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { expect, it, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { ConsonantFindingActivity } from './ConsonantFindingActivity';

const { timers, finishSound, say } = vi.hoisted(() => ({
  timers: [] as (() => void)[],
  finishSound: vi.fn(),
  say: vi.fn(),
}));
vi.mock('../components/ActivityShell', () => ({
  ActivityShell: ({ children, headerRight }: { children: ReactNode; headerRight: ReactNode }) => (
    <>
      {headerRight}
      {children}
    </>
  ),
}));
vi.mock('../hooks/useActivitySound', () => ({
  useActivitySound: () => ({
    say,
    sayThenChime: finishSound,
    scheduleTimer: (fn: () => void) => timers.push(fn),
  }),
}));
vi.mock('../hooks/usePhonicsTtsWarm', () => ({ usePhonicsTtsWarm: vi.fn() }));
vi.mock('@/features/games/effects/learning-effects', () => ({ emitLearningEffect: vi.fn() }));
vi.mock('@/lib/uiSound', () => ({ playUi: vi.fn() }));
beforeEach(() => {
  timers.length = 0;
  finishSound.mockClear();
});

it('counts each matching piece once, ignores distractors, and completes after the final sound', () => {
  const done = vi.fn();
  render(
    <ConsonantFindingActivity
      unitId="kr-h1-u03"
      consonant="ㄴ"
      onBack={vi.fn()}
      onComplete={done}
    />
  );
  const garden = screen.getByRole('group', { name: '자음 찾기' });
  const targets = within(garden).getAllByRole('button', { name: /^ㄴ 조각/ });
  const other = within(garden).getAllByRole('button', { name: /^[ㄱㅇ] 조각/ })[0];
  fireEvent.click(other);
  expect(screen.getByLabelText('4개 중 0개 찾음')).toBeInTheDocument();
  fireEvent.click(targets[0]);
  fireEvent.click(targets[0]);
  expect(screen.getByLabelText('4개 중 1개 찾음')).toBeInTheDocument();
  targets.slice(1).forEach((button) => fireEvent.click(button));
  expect(screen.getByLabelText('4개 중 4개 찾음')).toBeInTheDocument();
  expect(done).not.toHaveBeenCalled();
  act(() => {
    while (timers.length) timers.shift()!();
  });
  expect(finishSound).toHaveBeenCalledOnce();
  act(() => finishSound.mock.calls[0][1].onDone());
  expect(done).toHaveBeenCalledOnce();
});

it('cancels a pending final sound and completion when leaving', () => {
  const done = vi.fn();
  const view = render(
    <ConsonantFindingActivity
      unitId="kr-h1-u02"
      consonant="ㄱ"
      onBack={vi.fn()}
      onComplete={done}
    />
  );
  within(screen.getByRole('group'))
    .getAllByRole('button')
    .forEach((button) => fireEvent.click(button));
  view.unmount();
  act(() => {
    while (timers.length) timers.shift()!();
  });
  expect(finishSound).not.toHaveBeenCalled();
  expect(done).not.toHaveBeenCalled();
});
