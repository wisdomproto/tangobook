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
