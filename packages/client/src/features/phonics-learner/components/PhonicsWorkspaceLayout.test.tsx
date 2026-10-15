import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { PhonicsWorkspaceLayout } from './PhonicsWorkspaceLayout';
import { PhonicsLearningModes } from './PhonicsLearningModes';
import { GuidedPhonicsActivity } from './GuidedPhonicsActivity';
import { ActivityShell } from './ActivityShell';
import { markActivityCompleted } from '../lib/progress-store';
import {
  journeyActivities,
  journeyProgress,
  journeyUnits,
  type JourneyLanguage,
} from '../lib/learning-journey';
import { GUIDED_COMPLETION_MS } from './GuidedActivityTransition';

const { mounted } = vi.hoisted(() => ({ mounted: vi.fn() }));
vi.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: () => ({ activeProfile: null }),
}));
beforeEach(() => {
  localStorage.clear();
  mounted.mockClear();
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
  };
});
afterEach(() => vi.useRealTimers());
function Mode() {
  const { language } = useParams();
  return <PhonicsLearningModes lang={language as JourneyLanguage} />;
}
function Activity() {
  const { language, unitId = '', activityKey = '' } = useParams();
  return (
    <GuidedPhonicsActivity
      lang={language as JourneyLanguage}
      unitId={unitId}
      activityKey={activityKey}
    >
      {(callbacks) => (
        <Input
          lang={language as JourneyLanguage}
          unitId={unitId}
          activityKey={activityKey}
          {...callbacks}
        />
      )}
    </GuidedPhonicsActivity>
  );
}
function Input({
  lang,
  unitId,
  activityKey,
  onExit,
  onMarked,
}: {
  lang: JourneyLanguage;
  unitId: string;
  activityKey: string;
  onExit: () => void;
  onMarked: () => void;
}) {
  const [taps, setTaps] = useState(0);
  useEffect(() => {
    mounted();
  }, []);
  return (
    <ActivityShell unitId={unitId} onBack={onExit}>
      <button onClick={() => setTaps((n) => n + 1)}>tap {taps}</button>
      <button
        onClick={() => {
          markActivityCompleted(lang, unitId, activityKey);
          onMarked();
        }}
      >
        finish fixture
      </button>
    </ActivityShell>
  );
}
function show(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route element={<PhonicsWorkspaceLayout />}>
          <Route path="/library/phonics/:language" element={<Mode />} />
          <Route path="/library/phonics/:language/:unitId/:activityKey" element={<Activity />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

it.each(['korean', 'english'] as const)(
  'keeps the %s map mounted and closes navigation on entry without resetting activity input',
  (lang) => {
    const { container } = show(`/library/phonics/${lang}?mode=curriculum`);
    const map = container.querySelector('.journey-map-viewport');
    const start = container.querySelector('.journey-play-button')!;
    fireEvent.click(start);
    expect(container.querySelector('[data-phonics-workspace]')).toHaveAttribute(
      'data-navigation-open',
      'false'
    );
    fireEvent.click(screen.getByRole('button', { name: 'tap 0' }));
    fireEvent.click(screen.getByRole('button', { name: '활동 목록' }));
    const drawer = screen.getByRole('dialog', { name: '활동 목록' });
    expect(drawer).toHaveAttribute('open');
    expect(
      within(drawer)
        .getAllByRole('button')
        .some((button) => button.hasAttribute('disabled'))
    ).toBe(true);
    fireEvent.click(within(drawer).getByRole('button', { name: '목록 접기' }));
    expect(screen.getByRole('button', { name: 'tap 1' })).toBeInTheDocument();
    expect(mounted).toHaveBeenCalledTimes(1);
    expect(container.querySelector('.journey-map-viewport')).toBe(map);
    fireEvent.click(screen.getByRole('button', { name: '학습 지도' }));
    expect(container.querySelector('[data-phonics-workspace]')).not.toHaveAttribute(
      'data-activity-open'
    );
    expect(container.querySelector('[data-phonics-workspace]')).toHaveAttribute(
      'data-navigation-open',
      'true'
    );
    expect(container.querySelector('.journey-map-viewport')).toBe(map);
  }
);

it.each(['korean', 'english'] as const)(
  'returns from the final %s activity to the same map and unlocks only the real next chapter',
  (lang) => {
    vi.useFakeTimers();
    journeyProgress(lang); // Snapshot pre-existing completion before this new fixture run.
    const first = journeyUnits(lang)[0];
    const activities = journeyActivities(lang, first.id);
    activities.slice(0, -1).forEach((a) => markActivityCompleted(lang, first.id, a.key));
    const last = activities.at(-1)!;
    const { container } = show(`/library/phonics/${lang}/${first.id}/${last.key}?mode=curriculum`);
    const map = container.querySelector('.journey-map-viewport');
    fireEvent.click(screen.getByRole('button', { name: 'finish fixture' }));
    expect(screen.getByRole('status', { name: '챕터를 마쳤어요!' })).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(GUIDED_COMPLETION_MS));
    expect(container.querySelector('.journey-map-viewport')).toBe(map);
    expect(container.querySelector('[data-phonics-workspace]')).toHaveAttribute(
      'data-navigation-open',
      'true'
    );
    expect(screen.getByRole('status', { name: '다음 챕터가 열렸어!' })).toBeInTheDocument();
    expect(container.querySelectorAll('.journey-stage.is-unlocking')).toHaveLength(1);
    expect(container.querySelectorAll('.journey-stage.is-complete')).toHaveLength(1);
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.queryByRole('status', { name: '다음 챕터가 열렸어!' })).not.toBeInTheDocument();
  }
);
