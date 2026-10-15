import { beforeEach, expect, it } from 'vitest';
import {
  advanceWordLearning,
  loadWordLearningRun,
  saveWordLearningRun,
  wordLearningStorageKey,
} from './word-learning-run';
beforeEach(() => localStorage.clear());
it('resumes the same shuffled targets and exact stage without replacing a word mid-lesson', () => {
  const key = wordLearningStorageKey('english', 'unit');
  const run = loadWordLearningRun(key, ['cat', 'hat', 'cat']);
  expect(new Set(run.words)).toEqual(new Set(['cat', 'hat']));
  const block = advanceWordLearning(run, ['meet', 'block', 'write', 'color']);
  saveWordLearningRun(key, block);
  expect(loadWordLearningRun(key, ['hat', 'cat'])).toEqual(block);
  let next = advanceWordLearning(block, ['meet', 'block', 'write', 'color']);
  expect(next.words[next.index]).toBe(run.words[0]);
  next = advanceWordLearning(next, ['meet', 'block', 'write', 'color']);
  expect(next.stage).toBe('color');
  next = advanceWordLearning(next, ['meet', 'block', 'write', 'color']);
  expect(next.index).toBe(1);
  expect(next.stage).toBe('meet');
});
it('isolates siblings and languages, rejects changed or corrupt decks, and starts a new replay', () => {
  const key = wordLearningStorageKey('korean', 'unit');
  const first = loadWordLearningRun(key, ['고기']);
  localStorage.setItem('tangobook:activeProfileId', 'child-b');
  expect(wordLearningStorageKey('korean', 'unit')).not.toBe(key);
  expect(wordLearningStorageKey('english', 'unit')).not.toBe(
    wordLearningStorageKey('korean', 'unit')
  );
  expect(loadWordLearningRun(key, ['가구']).words).toEqual(['가구']);
  saveWordLearningRun(key, { ...first, index: 1 });
  expect(loadWordLearningRun(key, ['고기']).id).not.toBe(first.id);
  localStorage.setItem(key, '{bad');
  expect(loadWordLearningRun(key, ['고기']).stage).toBe('meet');
});
