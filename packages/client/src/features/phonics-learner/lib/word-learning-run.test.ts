import { beforeEach, expect, it } from 'vitest';
import {
  advanceWordLearning,
  loadWordLearningRun,
  saveWordLearningRun,
  wordLearningStorageKey,
  readWordStageProgress,
  recordWordStageCompleted,
  loadWordPracticeRun,
  wordPracticeStorageKey,
} from './word-learning-run';
beforeEach(() => localStorage.clear());
it('resumes independent practice, migrates real earlier practice, and keeps stages and profiles separate', () => {
  const key = wordLearningStorageKey('korean', 'kr-h1-u02');
  const main = loadWordLearningRun(key, ['고기', '가구']);
  recordWordStageCompleted('korean', 'kr-h1-u02', main.words[0], 'meet');
  const practice = loadWordPracticeRun(key, main.words, 'meet');
  expect(practice.index).toBe(1);
  expect(practice.stage).toBe('meet');
  saveWordLearningRun(wordPracticeStorageKey(key, 'meet'), { ...practice, inputMode: 'camera' });
  expect(loadWordPracticeRun(key, [...main.words].reverse(), 'meet')).toEqual({
    ...practice,
    inputMode: 'camera',
  });
  expect(loadWordPracticeRun(key, main.words, 'block').index).toBe(0);
  expect(loadWordLearningRun(key, main.words)).toEqual(main);
  localStorage.setItem('tangobook:activeProfileId', 'sibling');
  expect(
    loadWordPracticeRun(wordLearningStorageKey('korean', 'kr-h1-u02'), main.words, 'meet').index
  ).toBe(0);
  expect(
    loadWordPracticeRun(wordLearningStorageKey('english', 'kr-h1-u02'), main.words, 'meet').index
  ).toBe(0);
});
it('starts a fresh standalone replay after the final word and rejects stale or corrupt practice', () => {
  const key = wordLearningStorageKey('english', 'en-b2-u01');
  const words = ['cat', 'hat'];
  const first = loadWordPracticeRun(key, words, 'write');
  for (const word of words) recordWordStageCompleted('english', 'en-b2-u01', word, 'write');
  saveWordLearningRun(wordPracticeStorageKey(key, 'write'), { ...first, index: 2 });
  const replay = loadWordPracticeRun(key, words, 'write');
  expect(replay.index).toBe(0);
  expect(replay.id).not.toBe(first.id);
  expect(loadWordPracticeRun(key, ['dog'], 'write').words).toEqual(['dog']);
  localStorage.setItem(wordPracticeStorageKey(key, 'write'), '{bad');
  expect(loadWordPracticeRun(key, words, 'write').stage).toBe('write');
});
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
it('shows earlier successful stages before the entire word lesson is complete', () => {
  const key = wordLearningStorageKey('korean', 'kr-h1-u02');
  const run = loadWordLearningRun(key, ['아기', '고기', '구이', '가구']);
  saveWordLearningRun(key, { ...run, stage: 'block' });
  expect(readWordStageProgress('korean', 'kr-h1-u02')).toEqual({
    total: 4,
    counts: { meet: 1, block: 0, write: 0, color: 0 },
  });
  saveWordLearningRun(key, { ...run, index: 2, stage: 'write' });
  expect(readWordStageProgress('korean', 'kr-h1-u02').counts).toEqual({
    meet: 3,
    block: 3,
    write: 2,
    color: 2,
  });
});
it('counts real isolated practice once and preserves it across replay without moving the run', () => {
  const unit = 'en-b2-u01';
  const key = wordLearningStorageKey('english', unit);
  const run = loadWordLearningRun(key, ['cat', 'hat']);
  recordWordStageCompleted('english', unit, 'cat', 'color');
  recordWordStageCompleted('english', unit, 'cat', 'color');
  recordWordStageCompleted('english', unit, 'unrelated', 'color');
  expect(readWordStageProgress('english', unit).counts.color).toBe(1);
  expect(JSON.parse(localStorage.getItem(key)!)).toEqual(run);
  expect(readWordStageProgress('korean', unit).total).toBe(0);
  localStorage.setItem('tangobook:activeProfileId', 'sibling');
  expect(readWordStageProgress('english', unit).total).toBe(0);
});
it('does not create progress when inspecting missing or corrupt runs; Book 1 has no block credit', () => {
  expect(readWordStageProgress('english', 'en-b1-u01').total).toBe(0);
  expect(localStorage.length).toBe(0);
  const key = wordLearningStorageKey('english', 'en-b1-u01');
  const run = loadWordLearningRun(key, ['cat', 'cup']);
  saveWordLearningRun(key, { ...run, index: 1, stage: 'color' });
  expect(readWordStageProgress('english', 'en-b1-u01').counts).toEqual({
    meet: 2,
    block: 0,
    write: 2,
    color: 1,
  });
  localStorage.setItem(key, JSON.stringify({ ...run, index: 100 }));
  expect(readWordStageProgress('english', 'en-b1-u01').total).toBe(0);
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
