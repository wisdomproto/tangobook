import { beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { Storybook } from '@tangobook/shared';
import type { ReactNode } from 'react';
import { ConnectedWordLearningActivity } from './ConnectedWordLearningActivity';
import { loadWordLearningRun, wordLearningStorageKey } from '../lib/word-learning-run';
import { LearningWorkspaceContext } from '../components/learning-workspace-context';
const { logEvent, profile } = vi.hoisted(() => ({ logEvent: vi.fn(), profile: { id: '' } }));
vi.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: () => ({ activeProfile: profile.id ? profile : null }),
}));
vi.mock('@/features/learning/hooks/useLogEvent', () => ({ useLogEvent: () => logEvent }));
vi.mock('../components/PhonicsGameGate', () => ({
  PhonicsGameGate: ({ children }: { children: ReactNode }) => children,
}));
vi.mock('./WordMeetingActivity', () => ({
  WordMeetingActivity: ({ word, onComplete }: { word: string; onComplete: () => void }) => (
    <button onClick={onComplete}>meet {word}</button>
  ),
}));
vi.mock('@/features/games/hooks/useColoringSheets', () => ({
  useColoringItems: (book: Storybook) => ({
    loading: false,
    items: book.phonicsConfig!.targetWords.map((word) => ({ word })),
  }),
}));
vi.mock('@/features/games/components/players/ColoringPlayer', () => ({
  ColoringPlayer: ({ items, onDone }: { items: { word: string }[]; onDone: () => void }) => (
    <button onClick={onDone}>color {items[0].word}</button>
  ),
}));
vi.mock('@/features/games/components/players/KoreanBlockPlayer', () => ({
  KoreanBlockPlayer: (p: {
    gameData: { items: { word: string }[] };
    onComplete: (score: number, max: number) => void;
  }) => <button onClick={() => p.onComplete(1, 1)}>block {p.gameData.items[0].word}</button>,
}));
vi.mock('@/features/games/components/players/EnglishBlockPlayer', () => ({
  EnglishBlockPlayer: (p: {
    gameData: { items: { word: string }[] };
    onComplete: (score: number, max: number) => void;
  }) => <button onClick={() => p.onComplete(1, 1)}>block {p.gameData.items[0].word}</button>,
}));
vi.mock('@/features/games/components/players/KoreanWordWritingPlayer', () => ({
  KoreanWordWritingPlayer: (p: {
    gameData: { items: { word: string }[] };
    onComplete: (score: number, max: number) => void;
  }) => <button onClick={() => p.onComplete(1, 1)}>write {p.gameData.items[0].word}</button>,
}));
vi.mock('@/features/games/components/players/EnglishWordWritingPlayer', () => ({
  EnglishWordWritingPlayer: (p: {
    gameData: { items: { word: string }[] };
    onComplete: (score: number, max: number) => void;
  }) => <button onClick={() => p.onComplete(1, 1)}>write {p.gameData.items[0].word}</button>,
}));

beforeEach(() => {
  localStorage.clear();
  profile.id = '';
  logEvent.mockClear();
});
const book = (id: string, targets: string[]) =>
  ({ id, type: 'phonics', phonicsConfig: { targetWords: targets } }) as Storybook;

it('publishes the exact word/stage and isolated subactivity completion never advances the main run', () => {
  const complete = vi.fn();
  const back = vi.fn();
  const publish = vi.fn();
  const unitId = 'kr-h1-u02';
  const key = wordLearningStorageKey('korean', unitId);
  const saved = loadWordLearningRun(key, ['고기']);
  const view = render(
    <LearningWorkspaceContext.Provider
      value={{
        active: true,
        unitId,
        activityKey: 'word-learning',
        practiceStage: 'color',
        navigationOpen: false,
        setNavigationOpen: vi.fn(),
        backToMap: vi.fn(),
        setWordActivity: publish,
      }}
    >
      <ConnectedWordLearningActivity
        lang="korean"
        unitId={unitId}
        book={book(unitId, ['고기'])}
        onBack={back}
        onComplete={complete}
      />
    </LearningWorkspaceContext.Provider>
  );
  expect(publish).toHaveBeenLastCalledWith({ unitId, word: '고기', stage: 'color' });
  fireEvent.click(screen.getByRole('button', { name: 'color 고기' }));
  expect(back).toHaveBeenCalledOnce();
  expect(complete).not.toHaveBeenCalled();
  expect(loadWordLearningRun(key, ['고기'])).toEqual(saved);
  expect(logEvent).toHaveBeenCalledOnce();
  expect(logEvent.mock.calls[0][0].metadata.activityRunId).not.toBe(saved.id);
  view.unmount();
  expect(publish).toHaveBeenLastCalledWith(null);
});
it.each([
  ['korean', 'kr-h1-u02', ['고기', '가구']],
  ['english', 'en-b2-u01', ['cat', 'hat']],
] as const)(
  'connects every %s target through the same meet/build/write/color sequence and resumes the exact stage',
  (lang, unitId, targets) => {
    const source = book(unitId, [...targets]);
    const onComplete = vi.fn();
    const props = { unitId, lang, book: source, onComplete, onBack: vi.fn() };
    const first = render(<ConnectedWordLearningActivity {...props} />);
    const run = loadWordLearningRun(wordLearningStorageKey(lang, unitId), targets);
    const word = run.words[0];
    fireEvent.click(screen.getByRole('button', { name: `meet ${word}` }));
    expect(screen.getByRole('button', { name: `block ${word}` })).toBeDefined();
    first.unmount();
    render(<ConnectedWordLearningActivity {...props} />);
    fireEvent.click(screen.getByRole('button', { name: `block ${word}` }));
    fireEvent.click(screen.getByRole('button', { name: `write ${word}` }));
    expect(onComplete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: `color ${word}` }));
    const second = run.words[1];
    for (const stage of ['meet', 'block', 'write', 'color'])
      fireEvent.click(screen.getByRole('button', { name: `${stage} ${second}` }));
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(logEvent).toHaveBeenCalledTimes(8);
    for (const [event] of logEvent.mock.calls)
      expect(event.metadata).toMatchObject({
        learningMode: 'practice',
        modelVisible: true,
        independent: false,
        practiceCompleted: true,
      });
    expect(logEvent.mock.calls.map(([event]) => event.word)).toEqual([
      word,
      word,
      word,
      word,
      second,
      second,
      second,
      second,
    ]);
  }
);
it('Book1 keeps first-letter writing and does not introduce blocks or fabricate whole-word writing', () => {
  render(
    <ConnectedWordLearningActivity
      unitId="en-b1-u01"
      lang="english"
      book={book('en-b1-u01', ['apple'])}
      onComplete={vi.fn()}
      onBack={vi.fn()}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: 'meet apple' }));
  expect(screen.queryByRole('button', { name: /block/ })).toBeNull();
  expect(screen.getByRole('button', { name: 'write apple' })).toBeDefined();
});

it('Korean cannot skip a block stage by exposing future jamo from an old source', () => {
  const onComplete = vi.fn();
  render(
    <ConnectedWordLearningActivity
      unitId="kr-h1-u04"
      lang="korean"
      book={book('kr-h1-u04', ['도마', '구두'])}
      onComplete={onComplete}
      onBack={vi.fn()}
    />
  );
  expect(screen.queryByRole('button', { name: 'meet 도마' })).toBeNull();
  for (const stage of ['meet', 'block', 'write', 'color'])
    fireEvent.click(screen.getByRole('button', { name: `${stage} 구두` }));
  expect(onComplete).toHaveBeenCalledOnce();
  expect(logEvent.mock.calls.map(([e]) => e.metadata.practiceStage)).toEqual([
    'meet',
    'block',
    'write',
    'color',
  ]);
});
it('English long exceptions still complete every stage using the same original target', () => {
  const complete = vi.fn();
  render(
    <ConnectedWordLearningActivity
      unitId="en-b4-u07"
      lang="english"
      book={book('en-b4-u07', ['elephant'])}
      onComplete={complete}
      onBack={vi.fn()}
    />
  );
  for (const stage of ['meet', 'block', 'write', 'color'])
    fireEvent.click(screen.getByRole('button', { name: `${stage} elephant` }));
  expect(complete).toHaveBeenCalledOnce();
});
