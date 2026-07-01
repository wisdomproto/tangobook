import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { usePlaylistStore } from './playlist.store';

// Reset store + real timers between tests. The sleep timer lives in a
// module-level variable, so we clear it via reset() before each test.
function getState() {
  return usePlaylistStore.getState();
}

const BOOKS = [{ bookId: 'a' }, { bookId: 'b' }, { bookId: 'c' }];

describe('playlist.store', () => {
  beforeEach(() => {
    getState().reset();
  });

  afterEach(() => {
    // ensure no timer leaks between tests
    getState().reset();
    vi.useRealTimers();
  });

  describe('setQueue', () => {
    it('sets queue, resets index to 0, ended false, paused false', () => {
      getState().togglePause(); // paused = true
      getState().next(); // move index somewhere
      getState().setQueue(BOOKS, 'en');
      const s = getState();
      expect(s.queue).toEqual(BOOKS);
      expect(s.language).toBe('en');
      expect(s.index).toBe(0);
      expect(s.ended).toBe(false);
      expect(s.paused).toBe(false);
    });
  });

  describe('next / skip', () => {
    it('next advances index', () => {
      getState().setQueue(BOOKS, 'ko');
      getState().next();
      expect(getState().index).toBe(1);
      expect(getState().ended).toBe(false);
    });

    it('next through to the end marks ended at the last index', () => {
      getState().setQueue(BOOKS, 'ko');
      getState().next(); // 0 -> 1
      getState().next(); // 1 -> 2 (last)
      expect(getState().index).toBe(2);
      expect(getState().ended).toBe(false);
      getState().next(); // at last -> ended
      expect(getState().index).toBe(2); // stays at last index
      expect(getState().ended).toBe(true);
    });

    it('skip behaves like next', () => {
      getState().setQueue(BOOKS, 'ko');
      getState().skip();
      expect(getState().index).toBe(1);
    });
  });

  describe('restart', () => {
    it('resets index to 0 and ended to false', () => {
      getState().setQueue(BOOKS, 'ko');
      getState().next();
      getState().next();
      getState().next(); // ended = true
      expect(getState().ended).toBe(true);
      getState().restart();
      expect(getState().index).toBe(0);
      expect(getState().ended).toBe(false);
    });
  });

  describe('setSpeed / togglePause', () => {
    it('setSpeed updates speed', () => {
      getState().setSpeed(1.25);
      expect(getState().speed).toBe(1.25);
    });

    it('togglePause flips paused flag', () => {
      const before = getState().paused;
      getState().togglePause();
      expect(getState().paused).toBe(!before);
      getState().togglePause();
      expect(getState().paused).toBe(before);
    });
  });

  describe('setSleep (store-owned timer)', () => {
    it('fires ended = true after minutes elapse', () => {
      vi.useFakeTimers();
      getState().setQueue(BOOKS, 'ko');
      getState().setSleep(20);
      expect(getState().sleepMinutes).toBe(20);
      expect(getState().ended).toBe(false);
      vi.advanceTimersByTime(20 * 60_000);
      expect(getState().ended).toBe(true);
    });

    it('setSleep(null) before expiry cancels the timer', () => {
      vi.useFakeTimers();
      getState().setQueue(BOOKS, 'ko');
      getState().setSleep(20);
      vi.advanceTimersByTime(10 * 60_000);
      getState().setSleep(null);
      expect(getState().sleepMinutes).toBeNull();
      vi.advanceTimersByTime(60 * 60_000);
      expect(getState().ended).toBe(false);
    });

    it('clearSleep before expiry stops the timer', () => {
      vi.useFakeTimers();
      getState().setQueue(BOOKS, 'ko');
      getState().setSleep(30);
      vi.advanceTimersByTime(5 * 60_000);
      getState().clearSleep();
      vi.advanceTimersByTime(60 * 60_000);
      expect(getState().ended).toBe(false);
    });

    it('replacing a sleep timer does not double-fire', () => {
      vi.useFakeTimers();
      getState().setQueue(BOOKS, 'ko');
      getState().setSleep(20);
      vi.advanceTimersByTime(5 * 60_000);
      getState().setSleep(30); // replaces the 20-min timer
      vi.advanceTimersByTime(20 * 60_000); // 25 min total — original would have fired
      expect(getState().ended).toBe(false);
      vi.advanceTimersByTime(10 * 60_000); // 35 min total — new 30-min timer fires
      expect(getState().ended).toBe(true);
    });
  });

  describe('reset', () => {
    it('clears queue + index and any pending sleep timer', () => {
      vi.useFakeTimers();
      getState().setQueue(BOOKS, 'ko');
      getState().next();
      getState().setSleep(20);
      getState().reset();
      const s = getState();
      expect(s.queue).toEqual([]);
      expect(s.index).toBe(0);
      expect(s.ended).toBe(false);
      expect(s.sleepMinutes).toBeNull();
      // timer must not fire after reset
      vi.advanceTimersByTime(60 * 60_000);
      expect(getState().ended).toBe(false);
    });
  });
});
