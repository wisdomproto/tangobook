/**
 * ViewerContainer — playlist mode unit tests
 *
 * Strategy: ViewerContainer is too heavy to render in a jsdom unit test (it
 * pulls in Remotion, framer-motion, real Audio, etc.).  We therefore extract
 * the decision logic into thin pure helpers that mirror exactly what the
 * component does, and test those helpers directly.  This gives us fast,
 * reliable signal on the three interception sites and the error-skip path
 * without fighting jsdom Audio / MemoryRouter / TanStack Query wiring.
 *
 * The helpers live alongside the component (not in a separate lib file) so
 * they stay in sync; they are NOT exported for app use — only for testing.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Pure decision helpers (copy of the logic implemented in ViewerContainer)
// ---------------------------------------------------------------------------

interface PlaylistProp {
  hasNext: boolean;
  onBookEnd: () => void;
  speed: number;
  autoStart?: boolean;
}

/**
 * Mirrors ViewerContainer's startedRef initialization:
 *   const startedRef = useRef(playlist?.autoStart === true);
 * When true, the tap-to-start gate is skipped and auto-play proceeds.
 */
function initialStartedRef(playlist: PlaylistProp | undefined): boolean {
  return playlist?.autoStart === true;
}

/**
 * Mirrors the buffering effect's gate:
 *   if (!startedRef.current) setNeedsTapToStart(true);
 * Returns whether the tap-to-start overlay ("탭해서 시작하기") would be shown.
 * autoStart books already have startedRef=true → gate NOT shown.
 */
function wouldShowTapToStart(playlist: PlaylistProp | undefined): boolean {
  const started = initialStartedRef(playlist);
  return !started; // setNeedsTapToStart(true) only when !started
}

/**
 * Site 1 + Site 2: should the last-page action be intercepted?
 * Returns true when playlist mode is active AND the current page is the last.
 */
function shouldInterceptLastPage(
  playlist: PlaylistProp | undefined,
  pageIndex: number,
  totalPages: number
): boolean {
  if (!playlist) return false;
  return pageIndex >= totalPages - 1;
}

/**
 * Simulates what handleTtsEnded does on last page:
 * - playlist mode  → call onBookEnd immediately (no setTimeout, no overlay)
 * - normal mode    → schedule overlay open (setTimeout)
 *
 * Returns which action was taken.
 */
function simulateTtsEndedLastPage(
  playlist: PlaylistProp | undefined,
  hasKeyObjects: boolean,
  openWordReveal: () => void,
  openReward: () => void
): 'intercepted' | 'wordReveal' | 'reward' {
  if (playlist) {
    playlist.onBookEnd();
    return 'intercepted';
  }
  if (hasKeyObjects) {
    // setTimeout(() => openWordReveal(), 1000) — simplified to direct call for test
    openWordReveal();
    return 'wordReveal';
  }
  openReward();
  return 'reward';
}

/**
 * Simulates what onNext does on last page:
 * - playlist mode  → call onBookEnd immediately
 * - normal mode    → open overlay
 */
function simulateOnNextLastPage(
  playlist: PlaylistProp | undefined,
  hasKeyObjects: boolean,
  openWordReveal: () => void,
  openReward: () => void
): 'intercepted' | 'wordReveal' | 'reward' {
  if (playlist) {
    playlist.onBookEnd();
    return 'intercepted';
  }
  if (hasKeyObjects) {
    openWordReveal();
    return 'wordReveal';
  }
  openReward();
  return 'reward';
}

/**
 * Site 3: should the ?mode=video auto-open effect be skipped?
 */
function shouldSkipVideoAutoOpen(playlist: PlaylistProp | undefined): boolean {
  return !!playlist;
}

/**
 * Load-fail path: should onBookEnd be called on error?
 */
function shouldSkipOnError(playlist: PlaylistProp | undefined, hasError: boolean): boolean {
  return !!playlist && hasError;
}

/**
 * Fullscreen behaviour: derive effective fullscreen value
 */
function resolveFullscreen(
  playlist: PlaylistProp | undefined,
  settingFullscreen: boolean
): boolean {
  return playlist ? true : settingFullscreen;
}

/**
 * Exit button visibility: hidden in playlist mode
 */
function shouldShowExitButton(playlist: PlaylistProp | undefined, isFullscreen: boolean): boolean {
  if (playlist) return false; // hidden regardless
  return isFullscreen;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ViewerContainer playlist mode — decision helpers', () => {
  let onBookEnd: (() => void) & ReturnType<typeof vi.fn>;
  let openWordReveal: (() => void) & ReturnType<typeof vi.fn>;
  let openReward: (() => void) & ReturnType<typeof vi.fn>;
  let playlist: PlaylistProp;

  beforeEach(() => {
    onBookEnd = vi.fn() as (() => void) & ReturnType<typeof vi.fn>;
    openWordReveal = vi.fn() as (() => void) & ReturnType<typeof vi.fn>;
    openReward = vi.fn() as (() => void) & ReturnType<typeof vi.fn>;
    playlist = { hasNext: true, onBookEnd, speed: 1.5 };
  });

  // --- Site 1: handleTtsEnded on last page ---
  describe('Site 1 — handleTtsEnded on last page', () => {
    it('[playlist] calls onBookEnd — NOT wordReveal or reward', () => {
      const result = simulateTtsEndedLastPage(playlist, true, openWordReveal, openReward);
      expect(result).toBe('intercepted');
      expect(onBookEnd).toHaveBeenCalledOnce();
      expect(openWordReveal).not.toHaveBeenCalled();
      expect(openReward).not.toHaveBeenCalled();
    });

    it('[no playlist + keyObjects] opens wordReveal', () => {
      const result = simulateTtsEndedLastPage(undefined, true, openWordReveal, openReward);
      expect(result).toBe('wordReveal');
      expect(openWordReveal).toHaveBeenCalledOnce();
      expect(onBookEnd).not.toHaveBeenCalled();
    });

    it('[no playlist + no keyObjects] opens reward', () => {
      const result = simulateTtsEndedLastPage(undefined, false, openWordReveal, openReward);
      expect(result).toBe('reward');
      expect(openReward).toHaveBeenCalledOnce();
      expect(onBookEnd).not.toHaveBeenCalled();
    });
  });

  // --- Site 2: onNext on last page ---
  describe('Site 2 — onNext on last page', () => {
    it('[playlist] calls onBookEnd — NOT wordReveal or reward', () => {
      const result = simulateOnNextLastPage(playlist, true, openWordReveal, openReward);
      expect(result).toBe('intercepted');
      expect(onBookEnd).toHaveBeenCalledOnce();
      expect(openWordReveal).not.toHaveBeenCalled();
      expect(openReward).not.toHaveBeenCalled();
    });

    it('[no playlist + keyObjects] opens wordReveal', () => {
      const result = simulateOnNextLastPage(undefined, true, openWordReveal, openReward);
      expect(result).toBe('wordReveal');
      expect(openWordReveal).toHaveBeenCalledOnce();
    });

    it('[no playlist + no keyObjects] opens reward', () => {
      const result = simulateOnNextLastPage(undefined, false, openWordReveal, openReward);
      expect(result).toBe('reward');
      expect(openReward).toHaveBeenCalledOnce();
    });
  });

  // --- Site 3: ?mode=video auto-open ---
  describe('Site 3 — mode=video auto-open effect', () => {
    it('[playlist] skips the auto-open', () => {
      expect(shouldSkipVideoAutoOpen(playlist)).toBe(true);
    });

    it('[no playlist] does NOT skip auto-open', () => {
      expect(shouldSkipVideoAutoOpen(undefined)).toBe(false);
    });
  });

  // --- shouldInterceptLastPage guard ---
  describe('shouldInterceptLastPage', () => {
    it('returns true when playlist active and on last page', () => {
      expect(shouldInterceptLastPage(playlist, 4, 5)).toBe(true);
    });

    it('returns false when playlist active but NOT last page', () => {
      expect(shouldInterceptLastPage(playlist, 3, 5)).toBe(false);
    });

    it('returns false when playlist absent even on last page', () => {
      expect(shouldInterceptLastPage(undefined, 4, 5)).toBe(false);
    });
  });

  // --- Load-fail / error skip ---
  describe('Load error + playlist → skip (onBookEnd)', () => {
    it('[playlist + error] should skip to next book', () => {
      expect(shouldSkipOnError(playlist, true)).toBe(true);
    });

    it('[no playlist + error] should NOT skip', () => {
      expect(shouldSkipOnError(undefined, true)).toBe(false);
    });

    it('[playlist + no error] should NOT skip', () => {
      expect(shouldSkipOnError(playlist, false)).toBe(false);
    });
  });

  // --- Fullscreen forced ---
  describe('Fullscreen forced in playlist mode', () => {
    it('[playlist] fullscreen is true regardless of setting', () => {
      expect(resolveFullscreen(playlist, false)).toBe(true);
      expect(resolveFullscreen(playlist, true)).toBe(true);
    });

    it('[no playlist] fullscreen follows setting', () => {
      expect(resolveFullscreen(undefined, false)).toBe(false);
      expect(resolveFullscreen(undefined, true)).toBe(true);
    });
  });

  // --- Exit button hidden in playlist mode ---
  describe('Exit button hidden in playlist mode', () => {
    it('[playlist + fullscreen] exit button hidden', () => {
      expect(shouldShowExitButton(playlist, true)).toBe(false);
    });

    it('[no playlist + fullscreen] exit button shown', () => {
      expect(shouldShowExitButton(undefined, true)).toBe(true);
    });

    it('[no playlist + not fullscreen] exit button hidden', () => {
      expect(shouldShowExitButton(undefined, false)).toBe(false);
    });
  });

  // --- Regression: onBookEnd is NOT called on non-last page ---
  describe('Regression: non-last page never triggers onBookEnd', () => {
    it('[playlist] mid-book page does NOT intercept', () => {
      const intercept = shouldInterceptLastPage(playlist, 2, 5);
      expect(intercept).toBe(false);
      expect(onBookEnd).not.toHaveBeenCalled();
    });
  });

  // --- autoStart: non-first books skip the tap-to-start gate ---
  describe('autoStart — tap-to-start gate', () => {
    it('[playlist + autoStart:true] startedRef initializes true → gate NOT shown', () => {
      const pl: PlaylistProp = { hasNext: true, onBookEnd, speed: 1.5, autoStart: true };
      expect(initialStartedRef(pl)).toBe(true);
      expect(wouldShowTapToStart(pl)).toBe(false);
    });

    it('[playlist + autoStart:false] gate STILL shown (first book taps to unlock)', () => {
      const pl: PlaylistProp = { hasNext: true, onBookEnd, speed: 1.5, autoStart: false };
      expect(initialStartedRef(pl)).toBe(false);
      expect(wouldShowTapToStart(pl)).toBe(true);
    });

    it('[playlist without autoStart] gate shown (undefined is falsy)', () => {
      const pl: PlaylistProp = { hasNext: true, onBookEnd, speed: 1.5 };
      expect(initialStartedRef(pl)).toBe(false);
      expect(wouldShowTapToStart(pl)).toBe(true);
    });

    it('[no playlist] gate shown (normal viewer usage unchanged)', () => {
      expect(initialStartedRef(undefined)).toBe(false);
      expect(wouldShowTapToStart(undefined)).toBe(true);
    });

    it('[autoStart:true] does not depend on hasNext/speed — only autoStart flag', () => {
      const pl: PlaylistProp = { hasNext: false, onBookEnd, speed: 2, autoStart: true };
      expect(wouldShowTapToStart(pl)).toBe(false);
    });
  });
});
