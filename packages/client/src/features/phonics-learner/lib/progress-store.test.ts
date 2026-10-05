import { beforeEach, describe, expect, it } from 'vitest';
import {
  getUnitProgress,
  markActivityCompleted,
  markRecentUnit,
  getRecentUnit,
} from './progress-store';
beforeEach(() => localStorage.clear());
describe('child-scoped phonics progress', () => {
  it('keeps guest, first child and sibling completions separate', () => {
    markActivityCompleted('korean', 'u', 'guest');
    localStorage.setItem('tangobook:activeProfileId', 'first');
    expect(getUnitProgress('korean', 'u').completedActivities).toEqual([]);
    markActivityCompleted('korean', 'u', 'first');
    markRecentUnit('korean', 'u');
    localStorage.setItem('tangobook:activeProfileId', 'sibling');
    expect(getUnitProgress('korean', 'u').completedActivities).toEqual([]);
    expect(getRecentUnit('korean')).toBeNull();
    localStorage.setItem('tangobook:activeProfileId', 'first');
    expect(getUnitProgress('korean', 'u').completedActivities).toEqual(['first']);
    expect(getRecentUnit('korean')).toBe('u');
    localStorage.removeItem('tangobook:activeProfileId');
    expect(getUnitProgress('korean', 'u').completedActivities).toEqual(['guest']);
  });
});
