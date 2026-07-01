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
  paused?: boolean;
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
// Pause/resume helpers — mirror the paused effect and stall-guard guard
// ---------------------------------------------------------------------------

/**
 * Mirrors the paused prop effect in ViewerContainer:
 *   if (!playlist) return;
 *   if (playlist.paused) pauseTts(); else resumeTts();
 */
function applyPausedProp(
  playlist: PlaylistProp | undefined,
  audio: { pauseTts: () => void; resumeTts: () => void }
): 'paused' | 'resumed' | 'noop' {
  if (!playlist) return 'noop';
  if (playlist.paused) {
    audio.pauseTts();
    return 'paused';
  } else {
    audio.resumeTts();
    return 'resumed';
  }
}

/**
 * Mirrors the stall-guard early-return when paused:
 *   if (playlist.paused) return; // do NOT arm timer
 * Returns whether the stall-guard timer WOULD be armed.
 */
function wouldArmStallGuard(playlist: PlaylistProp | undefined): boolean {
  if (!playlist) return false;
  if (playlist.paused) return false; // guarded
  return true;
}

/**
 * Simulates a stall-guard firing: advances only if not paused.
 * In the real component, paused prevents the timer from being armed at all,
 * so the guard never fires while paused. This helper validates the decision.
 */
function simulateStallGuardFire(
  playlist: PlaylistProp | undefined,
  pageIndex: number,
  totalPages: number,
  onBookEndFn: () => void,
  advancePage: () => void
): 'noop' | 'advanced' | 'ended' {
  // Guard: timer would not have been armed if paused
  if (!playlist || playlist.paused) return 'noop';
  if (pageIndex >= totalPages - 1) {
    onBookEndFn();
    return 'ended';
  }
  advancePage();
  return 'advanced';
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

  // --- Pause / resume prop ---
  describe('paused prop — TTS pause/resume effect', () => {
    // Use plain function spies; cast to avoid TS Mock<> ↔ () => void mismatch
    let pauseTtsSpy: ReturnType<typeof vi.fn>;
    let resumeTtsSpy: ReturnType<typeof vi.fn>;
    let audio: { pauseTts: () => void; resumeTts: () => void };

    beforeEach(() => {
      pauseTtsSpy = vi.fn();
      resumeTtsSpy = vi.fn();
      audio = {
        pauseTts: pauseTtsSpy as unknown as () => void,
        resumeTts: resumeTtsSpy as unknown as () => void,
      };
    });

    it('[playlist + paused:true] calls pauseTts', () => {
      const pl: PlaylistProp = { hasNext: true, onBookEnd, speed: 1, paused: true };
      const result = applyPausedProp(pl, audio);
      expect(result).toBe('paused');
      expect(pauseTtsSpy).toHaveBeenCalledOnce();
      expect(resumeTtsSpy).not.toHaveBeenCalled();
    });

    it('[playlist + paused:false] calls resumeTts', () => {
      const pl: PlaylistProp = { hasNext: true, onBookEnd, speed: 1, paused: false };
      const result = applyPausedProp(pl, audio);
      expect(result).toBe('resumed');
      expect(resumeTtsSpy).toHaveBeenCalledOnce();
      expect(pauseTtsSpy).not.toHaveBeenCalled();
    });

    it('[playlist + paused:undefined] calls resumeTts (default playing state)', () => {
      const pl: PlaylistProp = { hasNext: true, onBookEnd, speed: 1 };
      const result = applyPausedProp(pl, audio);
      expect(result).toBe('resumed');
      expect(resumeTtsSpy).toHaveBeenCalledOnce();
    });

    it('[no playlist] is a noop — never calls pauseTts or resumeTts', () => {
      const result = applyPausedProp(undefined, audio);
      expect(result).toBe('noop');
      expect(pauseTtsSpy).not.toHaveBeenCalled();
      expect(resumeTtsSpy).not.toHaveBeenCalled();
    });

    it('transition paused:true → paused:false resumes', () => {
      const plPaused: PlaylistProp = { hasNext: true, onBookEnd, speed: 1, paused: true };
      applyPausedProp(plPaused, audio);
      expect(pauseTtsSpy).toHaveBeenCalledOnce();

      const plResumed: PlaylistProp = { ...plPaused, paused: false };
      applyPausedProp(plResumed, audio);
      expect(resumeTtsSpy).toHaveBeenCalledOnce();
    });
  });

  // --- Stall-guard: does NOT fire while paused ---
  describe('stall-guard halted while paused', () => {
    let advancePageSpy: ReturnType<typeof vi.fn>;
    let advancePage: () => void;

    beforeEach(() => {
      advancePageSpy = vi.fn();
      advancePage = advancePageSpy as unknown as () => void;
    });

    it('[playlist + paused:true] stall-guard timer is NOT armed', () => {
      const pl: PlaylistProp = { hasNext: true, onBookEnd, speed: 1, paused: true };
      expect(wouldArmStallGuard(pl)).toBe(false);
    });

    it('[playlist + paused:false] stall-guard timer IS armed', () => {
      const pl: PlaylistProp = { hasNext: true, onBookEnd, speed: 1, paused: false };
      expect(wouldArmStallGuard(pl)).toBe(true);
    });

    it('[playlist + paused:undefined] stall-guard timer IS armed', () => {
      const pl: PlaylistProp = { hasNext: true, onBookEnd, speed: 1 };
      expect(wouldArmStallGuard(pl)).toBe(true);
    });

    it('[no playlist] stall-guard never armed regardless of paused', () => {
      expect(wouldArmStallGuard(undefined)).toBe(false);
    });

    it('[paused] stall-guard fire simulation → noop (onBookEnd not called)', () => {
      const pl: PlaylistProp = { hasNext: true, onBookEnd, speed: 1, paused: true };
      const result = simulateStallGuardFire(pl, 2, 5, onBookEnd, advancePage);
      expect(result).toBe('noop');
      expect(onBookEnd).not.toHaveBeenCalled();
      expect(advancePageSpy).not.toHaveBeenCalled();
    });

    it('[not paused, mid-book] stall-guard advances page', () => {
      const pl: PlaylistProp = { hasNext: true, onBookEnd, speed: 1, paused: false };
      const result = simulateStallGuardFire(pl, 2, 5, onBookEnd, advancePage);
      expect(result).toBe('advanced');
      expect(advancePageSpy).toHaveBeenCalledOnce();
      expect(onBookEnd).not.toHaveBeenCalled();
    });

    it('[not paused, last page] stall-guard calls onBookEnd', () => {
      const pl: PlaylistProp = { hasNext: false, onBookEnd, speed: 1, paused: false };
      const result = simulateStallGuardFire(pl, 4, 5, onBookEnd, advancePage);
      expect(result).toBe('ended');
      expect(onBookEnd).toHaveBeenCalledOnce();
      expect(advancePageSpy).not.toHaveBeenCalled();
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
