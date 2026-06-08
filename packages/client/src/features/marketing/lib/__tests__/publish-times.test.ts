import { describe, it, expect } from 'vitest';
import { makeTime, BEST_POST_TIMES, pickBestTimes } from '../publish-times';

describe('makeTime', () => {
  it('makeTime(0, 19) returns a string for today at hour 19', () => {
    const result = makeTime(0, 19);
    // Must be a non-empty string (ISO or datetime-local shaped)
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    // The hour portion should reflect 19:00
    const d = new Date(result);
    expect(d.getHours()).toBe(19);
    expect(d.getMinutes()).toBe(0);
    expect(d.getSeconds()).toBe(0);
  });

  it('makeTime(1, 8) returns tomorrow at 08:00', () => {
    const today = new Date();
    const result = makeTime(1, 8);
    const d = new Date(result);
    const expected = new Date();
    expected.setDate(today.getDate() + 1);
    expect(d.getDate()).toBe(expected.getDate());
    expect(d.getHours()).toBe(8);
  });

  it('makeTime(2, 9) shifts date by 2 days', () => {
    const today = new Date();
    const result = makeTime(2, 9);
    const d = new Date(result);
    const expected = new Date();
    expected.setDate(today.getDate() + 2);
    expect(d.getDate()).toBe(expected.getDate());
    expect(d.getHours()).toBe(9);
  });
});

describe('BEST_POST_TIMES', () => {
  it('BEST_POST_TIMES.ko exists and has channel entries', () => {
    expect(BEST_POST_TIMES['ko']).toBeDefined();
    expect(typeof BEST_POST_TIMES['ko']).toBe('object');
    expect(Object.keys(BEST_POST_TIMES['ko']).length).toBeGreaterThan(0);
  });

  it('BEST_POST_TIMES has at least ko and en entries', () => {
    expect(BEST_POST_TIMES['ko']).toBeDefined();
    expect(BEST_POST_TIMES['en']).toBeDefined();
  });
});

describe('pickBestTimes', () => {
  it('returns BEST_POST_TIMES.ko for known lang "ko"', () => {
    expect(pickBestTimes('ko')).toBe(BEST_POST_TIMES['ko']);
  });

  it('falls back to BEST_POST_TIMES.ko for unknown lang', () => {
    expect(pickBestTimes('unknownLang')).toBe(BEST_POST_TIMES['ko']);
    expect(pickBestTimes('')).toBe(BEST_POST_TIMES['ko']);
  });

  it('returns correct times for "en"', () => {
    expect(pickBestTimes('en')).toBe(BEST_POST_TIMES['en']);
  });
});
