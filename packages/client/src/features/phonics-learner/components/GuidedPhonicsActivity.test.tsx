import { beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { GuidedPhonicsActivity } from './GuidedPhonicsActivity';
import { journeySteps } from '../lib/learning-journey';
import { getUnitProgress, markActivityCompleted } from '../lib/progress-store';

vi.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: () => ({ activeProfile: null }),
}));
beforeEach(() => localStorage.clear());
function Location() {
  return <output data-testid="route">{useLocation().pathname + useLocation().search}</output>;
}
const cases = (['korean', 'english'] as const).flatMap((lang) => {
  const seen = new Set<string>();
  return journeySteps(lang).flatMap((step, index) => {
    if (seen.has(step.activity.kind)) return [];
    seen.add(step.activity.kind);
    return [{ lang, index, kind: step.activity.kind }];
  });
});
it.each(cases)(
  '$lang $kind advances straight to the next activity or path after completion',
  ({ lang, index }) => {
    const steps = journeySteps(lang),
      step = steps[index];
    steps.slice(0, index).forEach((s) => markActivityCompleted(lang, s.unit.id, s.activity.key));
    render(
      <MemoryRouter>
        <Location />
        <GuidedPhonicsActivity lang={lang} unitId={step.unit.id} activityKey={step.activity.key}>
          {(callbacks) => (
            <button
              onClick={() => {
                markActivityCompleted(lang, step.unit.id, step.activity.key);
                callbacks.onNext();
              }}
            >
              finish
            </button>
          )}
        </GuidedPhonicsActivity>
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: 'finish' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    const next = steps[index + 1],
      last = next?.unit.id !== step.unit.id;
    expect(screen.getByTestId('route').textContent).toBe(
      last
        ? `/library/phonics/${lang}?mode=curriculum&finished=${step.unit.id}`
        : `/library/phonics/${lang}/${next.unit.id}/${next.activity.key}?mode=curriculum`
    );
    if (next)
      expect(getUnitProgress(lang, next.unit.id).completedActivities).not.toContain(
        next.activity.key
      );
  }
);
it('ignores duplicate marked-then-back callbacks so they cannot overwrite the next route', () => {
  render(
    <MemoryRouter>
      <Location />
      <GuidedPhonicsActivity lang="korean" unitId="kr-v1-u01" activityKey="listen-1">
        {(c) => (
          <button
            onClick={() => {
              markActivityCompleted('korean', 'kr-v1-u01', 'listen-1');
              c.onMarked();
              c.onNext();
              c.onExit();
            }}
          >
            finish
          </button>
        )}
      </GuidedPhonicsActivity>
    </MemoryRouter>
  );
  fireEvent.click(screen.getByRole('button', { name: 'finish' }));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(screen.getByTestId('route').textContent).toBe(
    '/library/phonics/korean/kr-v1-u01/write-1?mode=curriculum'
  );
});
it('does not treat a navigation callback as learning evidence', () => {
  render(
    <MemoryRouter>
      <GuidedPhonicsActivity lang="korean" unitId="kr-v1-u01" activityKey="listen-1">
        {(c) => <button onClick={c.onNext}>next</button>}
      </GuidedPhonicsActivity>
    </MemoryRouter>
  );
  fireEvent.click(screen.getByRole('button', { name: 'next' }));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(getUnitProgress('korean', 'kr-v1-u01').completedActivities).toEqual([]);
});
it('automatically returns a newly finished chapter to the path with unlock context', () => {
  markActivityCompleted('korean', 'kr-v1-u01', 'listen-1');
  render(
    <MemoryRouter>
      <Location />
      <GuidedPhonicsActivity lang="korean" unitId="kr-v1-u01" activityKey="write-1">
        {(c) => (
          <button
            onClick={() => {
              markActivityCompleted('korean', 'kr-v1-u01', 'write-1');
              c.onMarked();
            }}
          >
            finish
          </button>
        )}
      </GuidedPhonicsActivity>
    </MemoryRouter>
  );
  fireEvent.click(screen.getByRole('button', { name: 'finish' }));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(screen.getByTestId('route').textContent).toBe(
    '/library/phonics/korean?mode=curriculum&finished=kr-v1-u01'
  );
});
it('replays a finished chapter without producing another unlock', () => {
  ['listen-1', 'write-1'].forEach((k) => markActivityCompleted('korean', 'kr-v1-u01', k));
  render(
    <MemoryRouter>
      <Location />
      <GuidedPhonicsActivity lang="korean" unitId="kr-v1-u01" activityKey="write-1">
        {(c) => <button onClick={c.onMarked}>finish</button>}
      </GuidedPhonicsActivity>
    </MemoryRouter>
  );
  fireEvent.click(screen.getByRole('button', { name: 'finish' }));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(screen.getByTestId('route').textContent).toBe(
    '/library/phonics/korean?mode=curriculum&chapter=kr-v1-u01&activity=write-1'
  );
});
it.each(['korean', 'english'] as const)(
  'returns after one replayed activity without playing the next or changing progress in %s',
  (lang) => {
    const steps = journeySteps(lang);
    const step = steps[0];
    markActivityCompleted(lang, step.unit.id, step.activity.key);
    const before = localStorage.getItem('phonics-progress');
    render(
      <MemoryRouter>
        <Location />
        <GuidedPhonicsActivity lang={lang} unitId={step.unit.id} activityKey={step.activity.key}>
          {(c) => (
            <button
              onClick={() => {
                c.onMarked();
                c.onNext();
                c.onExit();
              }}
            >
              finish
            </button>
          )}
        </GuidedPhonicsActivity>
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: 'finish' }));
    expect(screen.getByTestId('route').textContent).toBe(
      `/library/phonics/${lang}?mode=curriculum&chapter=${step.unit.id}&activity=${step.activity.key}`
    );
    expect(localStorage.getItem('phonics-progress')).toBe(before);
    expect(getUnitProgress(lang, steps[1].unit.id).completedActivities).not.toContain(
      steps[1].activity.key
    );
  }
);
it.each(['korean', 'english'] as const)(
  'does not permit skipping to an unfinished future activity in %s',
  (lang) => {
    const step = journeySteps(lang)[1];
    render(
      <MemoryRouter>
        <Location />
        <GuidedPhonicsActivity lang={lang} unitId={step.unit.id} activityKey={step.activity.key}>
          {() => <button>future activity</button>}
        </GuidedPhonicsActivity>
      </MemoryRouter>
    );
    expect(screen.queryByRole('button', { name: 'future activity' })).toBeNull();
    const current = journeySteps(lang)[0];
    expect(screen.getByTestId('route').textContent).toBe(
      `/library/phonics/${lang}/${current.unit.id}/${current.activity.key}?mode=curriculum`
    );
    expect(getUnitProgress(lang, step.unit.id).completedActivities).toEqual([]);
  }
);
it.each(['korean', 'english'] as const)(
  'keeps the selected chapter when backing out of a replay in %s',
  (lang) => {
    const step = journeySteps(lang)[0];
    markActivityCompleted(lang, step.unit.id, step.activity.key);
    render(
      <MemoryRouter>
        <Location />
        <GuidedPhonicsActivity lang={lang} unitId={step.unit.id} activityKey={step.activity.key}>
          {(c) => <button onClick={c.onExit}>back</button>}
        </GuidedPhonicsActivity>
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: 'back' }));
    expect(screen.getByTestId('route').textContent).toBe(
      `/library/phonics/${lang}?mode=curriculum&chapter=${step.unit.id}&activity=${step.activity.key}`
    );
  }
);
