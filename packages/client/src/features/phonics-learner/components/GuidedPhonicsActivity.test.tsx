import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { GuidedPhonicsActivity } from './GuidedPhonicsActivity';
import { journeySteps, journeyProgress } from '../lib/learning-journey';
import { getUnitProgress, markActivityCompleted } from '../lib/progress-store';
import { GUIDED_COMPLETION_MS } from './GuidedActivityTransition';
import { ActivityShell } from './ActivityShell';

const auth = vi.hoisted(() => ({ profile: null as string | null }));
vi.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: () => ({ activeProfile: auth.profile ? { id: auth.profile } : null }),
}));
beforeEach(() => {
  localStorage.clear();
  auth.profile = null;
  vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());
function finishNotice() {
  expect(screen.getByRole('status', { name: /잘했어요!|챕터를 마쳤어요!/ })).toBeDefined();
  expect(screen.queryByRole('button', { name: /다음 활동/ })).toBeNull();
  act(() => vi.advanceTimersByTime(GUIDED_COMPLETION_MS));
}
function Location() {
  return <output data-testid="route">{useLocation().pathname + useLocation().search}</output>;
}
it('announces completion and the next activity before one automatic move', () => {
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
            }}
          >
            finish
          </button>
        )}
      </GuidedPhonicsActivity>
    </MemoryRouter>
  );
  fireEvent.click(screen.getByRole('button', { name: 'finish' }));
  expect(screen.getByRole('status', { name: '잘했어요!' }).textContent).toContain('ㅏ 써보기');
  expect(screen.getByTestId('route').textContent).toBe('/');
  expect(screen.queryByRole('button', { name: 'finish' })).toBeNull();
  act(() => vi.advanceTimersByTime(GUIDED_COMPLETION_MS - 1));
  expect(screen.getByTestId('route').textContent).toBe('/');
  act(() => vi.advanceTimersByTime(1));
  expect(screen.getByTestId('route').textContent).toContain('/write-1?mode=curriculum');
});
it('cancels a pending automatic move when the activity is unmounted', () => {
  const view = render(
    <MemoryRouter>
      <Location />
      <GuidedPhonicsActivity lang="korean" unitId="kr-v1-u01" activityKey="listen-1">
        {(c) => (
          <button
            onClick={() => {
              markActivityCompleted('korean', 'kr-v1-u01', 'listen-1');
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
  view.rerender(
    <MemoryRouter>
      <Location />
    </MemoryRouter>
  );
  act(() => vi.advanceTimersByTime(GUIDED_COMPLETION_MS + 500));
  expect(screen.getByTestId('route').textContent).toBe('/');
});
it('cancels the previous child’s pending transition when the active profile changes', () => {
  const lesson = (
    <MemoryRouter>
      <Location />
      <GuidedPhonicsActivity lang="korean" unitId="kr-v1-u01" activityKey="listen-1">
        {(c) => (
          <button
            onClick={() => {
              markActivityCompleted('korean', 'kr-v1-u01', 'listen-1');
              c.onMarked();
            }}
          >
            finish
          </button>
        )}
      </GuidedPhonicsActivity>
    </MemoryRouter>
  );
  const view = render(lesson);
  fireEvent.click(screen.getByRole('button', { name: 'finish' }));
  expect(screen.getByRole('status', { name: '잘했어요!' })).toBeDefined();
  auth.profile = 'child-b';
  localStorage.setItem('tangobook:activeProfileId', 'child-b');
  view.rerender(
    <MemoryRouter>
      <Location />
      <GuidedPhonicsActivity lang="korean" unitId="kr-v1-u01" activityKey="listen-1">
        {(c) => <button onClick={c.onMarked}>new child</button>}
      </GuidedPhonicsActivity>
    </MemoryRouter>
  );
  act(() => vi.advanceTimersByTime(GUIDED_COMPLETION_MS + 500));
  expect(screen.getByTestId('route').textContent).toBe('/');
  expect(screen.queryByRole('status', { name: '잘했어요!' })).toBeNull();
  expect(getUnitProgress('korean', 'kr-v1-u01').completedActivities).toEqual([]);
});
it.each([
  ['korean', 'kr-v1-u01', 'listen-1', '빛나는 글자를 눌러 소리를 들어요'],
  ['korean', 'kr-v1-u01', 'write-1', '글자를 따라 써봐요'],
  ['english', 'en-b1-u01', 'word-listen-choose', '소리를 듣고 알맞은 카드를 골라요'],
] as const)('guides the first %s chapter activity %s/%s', (lang, unitId, activityKey, text) => {
  const steps = journeySteps(lang);
  const index = steps.findIndex((s) => s.unit.id === unitId && s.activity.key === activityKey);
  for (const step of steps.slice(0, index))
    markActivityCompleted(lang, step.unit.id, step.activity.key);
  render(
    <MemoryRouter>
      <GuidedPhonicsActivity lang={lang} unitId={unitId} activityKey={activityKey}>
        {(c) => <ActivityShell onBack={c.onExit}>lesson</ActivityShell>}
      </GuidedPhonicsActivity>
    </MemoryRouter>
  );
  expect(screen.getByText(text)).toBeDefined();
});
it('does not repeat first lesson instructions during an individual replay', () => {
  markActivityCompleted('korean', 'kr-v1-u01', 'listen-1');
  render(
    <MemoryRouter>
      <GuidedPhonicsActivity lang="korean" unitId="kr-v1-u01" activityKey="listen-1">
        {(c) => <ActivityShell onBack={c.onExit}>lesson</ActivityShell>}
      </GuidedPhonicsActivity>
    </MemoryRouter>
  );
  expect(document.querySelector('.phonics-first-lesson-guide')).toBeNull();
});
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
    // Fresh learner starts before completing any steps; old completion migration is separate.
    journeyProgress(lang);
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
    finishNotice();
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
  finishNotice();
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
  finishNotice();
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
  finishNotice();
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
    finishNotice();
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

it.each(['korean', 'english'] as const)(
  'redirects a locked later-book activity to that book entry without marking earlier work',
  (lang) => {
    const steps = journeySteps(lang);
    const book = [...new Set(steps.map((s) => s.unit.levelKey))][3];
    const entry = steps.find((s) => s.unit.levelKey === book)!;
    const future = steps.filter((s) => s.unit.levelKey === book)[1];
    render(
      <MemoryRouter>
        <Location />
        <GuidedPhonicsActivity
          lang={lang}
          unitId={future.unit.id}
          activityKey={future.activity.key}
        >
          {() => <button>locked activity</button>}
        </GuidedPhonicsActivity>
      </MemoryRouter>
    );
    expect(screen.queryByRole('button', { name: 'locked activity' })).toBeNull();
    expect(screen.getByTestId('route').textContent).toBe(
      `/library/phonics/${lang}/${entry.unit.id}/${entry.activity.key}?mode=curriculum`
    );
    expect(journeyProgress(lang).completed).toBe(0);
    expect(localStorage.getItem(`phonics-journey-started:${lang}:book`)).toBeNull();
  }
);
