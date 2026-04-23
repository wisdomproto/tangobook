import { describe, it, expect } from 'vitest';
import { computeMastery, masteryState } from './mastery';

const NOW = new Date('2026-04-23T00:00:00Z').getTime();
const daysAgo = (d: number) => new Date(NOW - d * 86_400_000).toISOString();

describe('computeMastery', () => {
  it('returns 0 when never exposed', () => {
    expect(computeMastery({ exposed: 0, correct: 0, wrong: 0, lastAt: null }, NOW)).toBe(0);
  });

  it('returns small seen-only value when exposed without attempts', () => {
    const m = computeMastery({ exposed: 1, correct: 0, wrong: 0, lastAt: daysAgo(0) }, NOW);
    expect(m).toBeGreaterThan(0);
    expect(m).toBeLessThan(0.2);
  });

  it('caps seen-only value at 0.15 with enough exposures', () => {
    const m = computeMastery({ exposed: 10, correct: 0, wrong: 0, lastAt: daysAgo(0) }, NOW);
    expect(m).toBeCloseTo(0.15, 5);
  });

  it('rewards recent attempts with high accuracy', () => {
    const m = computeMastery({ exposed: 5, correct: 5, wrong: 0, lastAt: daysAgo(0) }, NOW);
    expect(m).toBeGreaterThanOrEqual(0.6);
  });

  it('penalizes low accuracy below mastered threshold', () => {
    const m = computeMastery({ exposed: 5, correct: 1, wrong: 4, lastAt: daysAgo(0) }, NOW);
    expect(m).toBeLessThan(0.6);
    expect(m).toBeGreaterThan(0.15);
  });

  it('decays substantially with age (30d halflife)', () => {
    const recent = computeMastery({ exposed: 5, correct: 5, wrong: 0, lastAt: daysAgo(0) }, NOW);
    const old = computeMastery({ exposed: 5, correct: 5, wrong: 0, lastAt: daysAgo(60) }, NOW);
    // base 0.15 floor + accuracy×exp(-60/30) decay → old < recent/3
    expect(old).toBeLessThan(recent / 3);
    expect(old).toBeGreaterThan(0.15); // still above floor
  });

  it('needs ~5 attempts to reach full weight (at accuracy=1)', () => {
    const few = computeMastery({ exposed: 1, correct: 1, wrong: 0, lastAt: daysAgo(0) }, NOW);
    const enough = computeMastery({ exposed: 5, correct: 5, wrong: 0, lastAt: daysAgo(0) }, NOW);
    expect(enough).toBeGreaterThan(few);
  });
});

describe('masteryState', () => {
  it('classifies 0 as unknown', () => expect(masteryState(0)).toBe('unknown'));
  it('classifies <0.2 as seen', () => expect(masteryState(0.1)).toBe('seen'));
  it('classifies 0.2-0.6 as practiced', () => {
    expect(masteryState(0.2)).toBe('practiced');
    expect(masteryState(0.4)).toBe('practiced');
    expect(masteryState(0.59)).toBe('practiced');
  });
  it('classifies >=0.6 as mastered', () => {
    expect(masteryState(0.6)).toBe('mastered');
    expect(masteryState(0.95)).toBe('mastered');
  });
});
