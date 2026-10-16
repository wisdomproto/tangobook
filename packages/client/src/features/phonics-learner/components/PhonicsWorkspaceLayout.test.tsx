import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import {
  MemoryRouter,
  Route,
  Routes,
  useParams,
  useSearchParams,
  useNavigate,
} from 'react-router-dom';
import { useEffect, useState } from 'react';
import { PhonicsWorkspaceLayout } from './PhonicsWorkspaceLayout';
import { PhonicsLearningModes } from './PhonicsLearningModes';
import { PhonicsFreeMap } from './PhonicsFreeMap';
import { GuidedPhonicsActivity } from './GuidedPhonicsActivity';
import { ActivityShell } from './ActivityShell';
import { markActivityCompleted } from '../lib/progress-store';
import {
  journeyActivities,
  journeyProgress,
  journeyUnits,
  journeySteps,
  type JourneyLanguage,
} from '../lib/learning-journey';
import { useLearningWorkspace } from './learning-workspace-context';
import { GUIDED_COMPLETION_MS } from './GuidedActivityTransition';
import {
  loadWordLearningRun,
  saveWordLearningRun,
  wordLearningStorageKey,
} from '../lib/word-learning-run';

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
  const { language, unitId } = useParams();
  if (unitId) return <PhonicsFreeMap lang={language as JourneyLanguage} unitId={unitId} />;
  return <PhonicsLearningModes lang={language as JourneyLanguage} />;
}
function Activity() {
  const { language, unitId = '', activityKey = '' } = useParams();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  if (search.get('mode') !== 'curriculum')
    return (
      <Input
        lang={language as JourneyLanguage}
        unitId={unitId}
        activityKey={activityKey}
        onExit={() => navigate(`/library/phonics/${language}/${unitId}`)}
        onMarked={() => {}}
      />
    );
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
  const workspace = useLearningWorkspace();
  const publish = workspace?.setWordActivity;
  const stage = workspace?.practiceStage ?? 'block';
  useEffect(() => {
    if (activityKey !== 'word-learning') return;
    publish?.({ unitId, word: '아기', stage });
    return () => publish?.(null);
  }, [activityKey, unitId, stage, publish]);
  useEffect(() => {
    mounted();
  }, []);
  return (
    <ActivityShell unitId={unitId} onBack={onExit}>
      <output data-testid="practice-part">{workspace?.practiceStage ?? 'sequence'}</output>
      <output data-testid="route-activity">
        {unitId}:{activityKey}
      </output>
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
          <Route path="/library/phonics/:language/:unitId" element={<Mode />} />
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

it.each([
  ['korean', 'kr-h1-u02', 'letter-write', 'ㄱ 써보기'],
  ['english', 'en-b1-u01', 'letters-write', 'ABC 써보기'],
] as const)(
  'shows only the current %s chapter, with the whole course available separately',
  (lang, unit, key, title) => {
    markActivityCompleted(lang, unit, key);
    const { container } = show(`/library/phonics/${lang}/${unit}/${key}`);
    fireEvent.click(screen.getByRole('button', { name: 'tap 0' }));
    fireEvent.click(screen.getByRole('button', { name: '활동 목록' }));
    const drawer = screen.getByRole('dialog', { name: '활동 목록' });
    expect(drawer.querySelectorAll('[data-kind="book"]')).toHaveLength(0);
    expect(within(drawer).getByRole('button', { name: '전체 커리큘럼' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    fireEvent.click(within(drawer).getByRole('button', { name: '전체 커리큘럼' }));
    expect(drawer.querySelectorAll('[data-kind="book"]')).toHaveLength(5);
    expect(drawer.querySelectorAll('.workspace-chapter-choice').length).toBeGreaterThan(5);
    expect(
      within(drawer).queryByRole('link', { name: `${title} 학습 중` })
    ).not.toBeInTheDocument();
    fireEvent.click(drawer.querySelector('.workspace-chapter-choice[aria-pressed="true"]')!);
    expect(drawer.querySelectorAll('[data-kind="book"]')).toHaveLength(0);
    expect(screen.getByRole('button', { name: 'tap 1' })).toBeInTheDocument();
    const current = within(drawer).getByRole('link', { name: `${title} 학습 중` });
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current.querySelector('.workspace-complete-check')).toBeInTheDocument();
    expect(current.querySelector('.lucide-play')).not.toBeInTheDocument();
    fireEvent.click(current);
    expect(screen.getByRole('button', { name: 'tap 1' })).toBeInTheDocument();
    expect(mounted).toHaveBeenCalledOnce();
    expect(container.querySelector('[data-navigation-open]')).toHaveAttribute(
      'data-navigation-open',
      'false'
    );
  }
);

it('opens word subactivities as separate free practice but cannot request a future curriculum subactivity', () => {
  const key = wordLearningStorageKey('korean', 'kr-h1-u02');
  const saved = loadWordLearningRun(key, ['아기', '고기', '구이', '가구']);
  saveWordLearningRun(key, { ...saved, stage: 'block' });
  const first = show('/library/phonics/korean/kr-h1-u02/word-learning');
  fireEvent.click(screen.getByRole('button', { name: '활동 목록' }));
  const drawer = screen.getByRole('dialog', { name: '활동 목록' });
  expect(
    within(drawer).queryByRole('button', { name: '낱말 배우기 세부 활동' })
  ).not.toBeInTheDocument();
  expect(drawer).not.toHaveTextContent('아기');
  const current = within(drawer).getByRole('button', { name: '낱말 블록 놀이 학습 중' });
  expect(current).toHaveAttribute('aria-current', 'step');
  const met = within(drawer).getByRole('button', { name: '낱말 만나기' });
  expect(met).toHaveTextContent('1/4');
  expect(met.closest('li')).toHaveAttribute('data-started', 'true');
  expect(met.closest('li')).not.toHaveAttribute('data-completed');
  expect(current).toHaveTextContent('0/4');
  const learn = within(drawer).getByRole('button', { name: '익히기' });
  const play = within(drawer).getByRole('button', { name: '놀며 익히기' });
  expect(learn).toHaveAttribute('aria-expanded', 'true');
  expect(play).toHaveAttribute('aria-expanded', 'false');
  expect(learn.querySelector('.workspace-progress-seal')).not.toHaveAttribute('data-empty');
  expect(play.querySelector('.workspace-progress-seal')).toHaveAttribute('data-empty', 'true');
  fireEvent.click(learn);
  expect(learn.querySelector('.workspace-progress-seal')).toBeInTheDocument();
  expect(within(drawer).queryByRole('button', { name: '낱말 만나기' })).not.toBeInTheDocument();
  fireEvent.click(learn);
  const rows = learn.parentElement!.querySelectorAll(':scope > ol > li');
  const numbers = [...rows].map(
    (row) => row.querySelector('.journey-activity-number')?.textContent
  );
  expect(numbers).toHaveLength(8);
  expect(numbers).toEqual(numbers.map((_, i) => String(i + 1)));
  expect(
    [...rows].slice(-4).map((row) => row.querySelector('.journey-free-label')?.textContent)
  ).toEqual(['낱말 만나기', '낱말 블록 놀이학습 중', '낱말 쓰기', '낱말 색칠하기']);
  fireEvent.click(current);
  expect(screen.getByTestId('practice-part')).toHaveTextContent('sequence');
  expect(mounted).toHaveBeenCalledOnce();
  fireEvent.click(screen.getByRole('button', { name: '활동 목록' }));
  fireEvent.click(within(drawer).getByRole('button', { name: '낱말 쓰기' }));
  expect(screen.getByTestId('practice-part')).toHaveTextContent('write');
  first.unmount();
  const steps = journeySteps('korean');
  const target = steps.findIndex(
    (step) => step.unit.id === 'kr-h1-u02' && step.activity.key === 'word-learning'
  );
  steps
    .slice(0, target)
    .forEach((step) => markActivityCompleted('korean', step.unit.id, step.activity.key));
  const second = show('/library/phonics/korean/kr-h1-u02/word-learning?mode=curriculum&part=color');
  expect(screen.getByTestId('practice-part')).toHaveTextContent('sequence');
  second.unmount();
  saveWordLearningRun(key, { ...saved, index: saved.words.length - 1, stage: 'block' });
  const completedMeet = show(
    '/library/phonics/korean/kr-h1-u02/word-learning?mode=curriculum&part=meet'
  );
  expect(screen.getByTestId('practice-part')).toHaveTextContent('meet');
  expect(journeyProgress('korean').current?.activity.key).toBe('word-learning');
  completedMeet.unmount();
  markActivityCompleted('korean', 'kr-h1-u02', 'word-learning');
  show('/library/phonics/korean/kr-h1-u02/word-learning?mode=curriculum&part=color');
  expect(screen.getByTestId('practice-part')).toHaveTextContent('color');
  fireEvent.click(screen.getByRole('button', { name: '활동 목록' }));
  const completedColor = screen.getByRole('button', { name: '낱말 색칠하기 학습 중' });
  expect(completedColor.querySelector('.workspace-complete-check')).toBeInTheDocument();
  expect(completedColor.querySelector('.lucide-play')).not.toBeInTheDocument();
});

it('does not invent a block subactivity in English Book 1', () => {
  show('/library/phonics/english/en-b1-u01/word-learning?part=block');
  expect(screen.getByTestId('practice-part')).toHaveTextContent('sequence');
  fireEvent.click(screen.getByRole('button', { name: '활동 목록' }));
  const drawer = screen.getByRole('dialog', { name: '활동 목록' });
  expect(within(drawer).getByRole('button', { name: /글자 쓰기/ })).toBeEnabled();
  expect(within(drawer).queryByRole('button', { name: /블록/ })).not.toBeInTheDocument();
});

it('can inspect folded future chapters without unlocking their activities', () => {
  show('/library/phonics/korean/kr-v1-u01/listen-1?mode=curriculum');
  fireEvent.click(screen.getByRole('button', { name: '활동 목록' }));
  const drawer = screen.getByRole('dialog', { name: '활동 목록' });
  fireEvent.click(within(drawer).getByRole('button', { name: '전체 커리큘럼' }));
  const next = within(drawer).getByRole('button', { name: /ㅑ 배우기/ });
  fireEvent.click(next);
  expect(within(drawer).getByRole('button', { name: /ㅑ 배우기.*앞 단계를/ })).toBeDisabled();
  expect(screen.getByTestId('route-activity')).toHaveTextContent('kr-v1-u01:listen-1');
});

it('replays an earlier chapter even when its activity key matches the running chapter', () => {
  journeyProgress('korean');
  journeyActivities('korean', 'kr-v1-u01').forEach((activity) =>
    markActivityCompleted('korean', 'kr-v1-u01', activity.key)
  );
  markActivityCompleted('korean', 'kr-v1-u02', 'listen-1');
  show('/library/phonics/korean/kr-v1-u02/listen-1?mode=curriculum');
  fireEvent.click(screen.getByRole('button', { name: '활동 목록' }));
  const drawer = screen.getByRole('dialog', { name: '활동 목록' });
  fireEvent.click(within(drawer).getByRole('button', { name: '전체 커리큘럼' }));
  const finished = within(drawer).getByRole('button', { name: /ㅏ 배우기/ });
  const started = within(drawer).getByRole('button', { name: /ㅑ 배우기/ });
  expect(finished).toHaveAttribute('data-progress', 'complete');
  expect(finished).toHaveTextContent('완료');
  expect(finished.querySelector('.workspace-complete-check')).toBeInTheDocument();
  expect(started).toHaveAttribute('data-progress', 'started');
  expect(started).not.toHaveTextContent('100%');
  expect(finished.style.backgroundColor).not.toBe(started.style.backgroundColor);
  fireEvent.click(within(drawer).getByRole('button', { name: 'ㅏ 배우기' }));
  fireEvent.click(within(drawer).getByRole('button', { name: /ㅏ 배우기.*다 했어요/ }));
  expect(screen.getByTestId('route-activity')).toHaveTextContent('kr-v1-u01:listen-1');
  fireEvent.click(screen.getByRole('button', { name: '활동 목록' }));
  const completedChapter = screen.getByRole('dialog', { name: '활동 목록' });
  expect(
    completedChapter.querySelector('.workspace-chapter-plaque [data-complete]')
  ).toHaveTextContent('완료');
  expect(
    within(completedChapter)
      .getByRole('button', { name: '익히기' })
      .querySelector('[data-complete]')
  ).toHaveTextContent('완료');
  expect(journeyProgress('korean').current?.unit.id).toBe('kr-v1-u02');
});

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

it.each(['korean', 'english'] as const)(
  'starts at any %s book, keeps its activities sequential, and unlocks its next chapter on the map',
  (lang) => {
    const { container } = show(`/library/phonics/${lang}?mode=curriculum`);
    const units = journeyUnits(lang);
    const levels = [...new Set(units.map((u) => u.levelKey))];
    const books = within(screen.getByRole('group', { name: '여행할 장소' })).getAllByRole('button');
    for (const [index, book] of books.entries()) {
      fireEvent.click(book);
      const entry = units.find((u) => u.levelKey === levels[index])!;
      const stages = within(
        screen.getByRole('list', { name: '순서대로 이어지는 학습 단계' })
      ).getAllByRole('button');
      expect(stages[0]).not.toBeDisabled();
      expect(stages.slice(1).every((b) => b.hasAttribute('disabled'))).toBe(true);
      expect(container.querySelector('.journey-play-button')).toHaveAttribute(
        'href',
        `/library/phonics/${lang}/${entry.id}/${journeyActivities(lang, entry.id)[0].key}?mode=curriculum`
      );
    }
    fireEvent.click(books[1]);
    const entry = units.find((u) => u.levelKey === levels[1])!;
    fireEvent.click(container.querySelector('.journey-play-button')!);
    expect(screen.getByTestId('route-activity').textContent).toBe(
      `${entry.id}:${journeyActivities(lang, entry.id)[0].key}`
    );
    vi.useFakeTimers();
    for (const activity of journeyActivities(lang, entry.id)) {
      expect(screen.getByTestId('route-activity').textContent).toBe(`${entry.id}:${activity.key}`);
      fireEvent.click(screen.getByRole('button', { name: 'finish fixture' }));
      act(() => vi.advanceTimersByTime(GUIDED_COMPLETION_MS));
    }
    expect(container.querySelector('[data-phonics-workspace]')).not.toHaveAttribute(
      'data-activity-open'
    );
    expect(container.querySelector('.journey-stage.is-unlocking')).toBeInTheDocument();
    const stages = within(
      screen.getByRole('list', { name: '순서대로 이어지는 학습 단계' })
    ).getAllByRole('button');
    expect(stages[0]).not.toBeDisabled();
    expect(stages[1]).not.toBeDisabled();
    expect(stages[2]).toBeDisabled();
    expect(
      journeyProgress(lang)
        .done.slice(
          0,
          journeyProgress(lang).steps.findIndex((s) => s.unit.id === entry.id)
        )
        .some(Boolean)
    ).toBe(false);
  }
);

it.each(['korean', 'english'] as const)(
  'keeps the finished final %s book on the map rather than jumping to unstudied earlier books',
  (lang) => {
    const final = journeyUnits(lang).at(-1)!;
    journeyProgress(lang);
    journeyActivities(lang, final.id).forEach((a) => markActivityCompleted(lang, final.id, a.key));
    const { container } = show(`/library/phonics/${lang}?mode=curriculum&finished=${final.id}`);
    const books = within(screen.getByRole('group', { name: '여행할 장소' })).getAllByRole('button');
    expect(books.at(-1)).toHaveAttribute('aria-pressed', 'true');
    expect(container.querySelector('.journey-stage.is-unlocking')).toBeNull();
    expect(journeyProgress(lang).current?.unit.id).toBe(journeyUnits(lang)[0].id);
  }
);
