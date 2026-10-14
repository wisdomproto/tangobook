import { beforeEach, expect, it } from 'vitest';
import { readGameObservations, recordGameChoice } from './journey-assessment';

beforeEach(() => localStorage.clear());
it('does not turn a corrected retry into a correct first choice, and replaces restarted runs', () => {
  const record = (correct: boolean, question: number, firstAttempt: boolean) =>
    recordGameChoice('korean', 'u', 'game', 'run', correct, '아', { question, firstAttempt });
  record(false, 0, true);
  record(true, 0, false);
  record(true, 1, true);
  expect(readGameObservations('korean')['u/game']).toMatchObject({
    retries: 1,
    firstChoices: { 0: { correct: false }, 1: { correct: true } },
  });
  record(true, 0, true);
  expect(readGameObservations('korean')['u/game']).toMatchObject({
    retries: 0,
    firstChoices: { 0: { correct: true } },
  });
  expect(Object.keys(readGameObservations('korean')['u/game'].firstChoices)).toHaveLength(1);
});
it('isolates child and language observations from guest records', () => {
  recordGameChoice('korean', 'u', 'game', 'run', true, '아', { question: 0, firstAttempt: true });
  expect(readGameObservations('english')).toEqual({});
  localStorage.setItem('tangobook:activeProfileId', 'sibling');
  expect(readGameObservations('korean')).toEqual({});
});

it('separates hinted answers from unaided first choices and retains hints across retries', () => {
  recordGameChoice('english', 'u', 'blocks-listen', 'run', true, 'cat', {
    question: 0,
    firstAttempt: true,
    hintUsed: true,
  });
  recordGameChoice('english', 'u', 'blocks-listen', 'run', false, 'dog', {
    question: 1,
    firstAttempt: true,
    hintUsed: false,
  });
  recordGameChoice('english', 'u', 'blocks-listen', 'run', true, 'dog', {
    question: 1,
    firstAttempt: false,
    hintUsed: true,
  });
  const run = readGameObservations('english')['u/blocks-listen'];
  expect(run.hintQuestions).toEqual([0, 1]);
  expect(run.firstChoices[0]).toMatchObject({ correct: true, hintUsed: true });
  expect(run.firstChoices[1]).toEqual({ target: 'dog', correct: false });
  expect(run.retries).toBe(1);
  expect(Object.values(run.firstChoices).filter((c) => c.correct && !c.hintUsed)).toHaveLength(0);
});
