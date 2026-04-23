import { useCallback, useEffect, useRef, useState } from 'react';

const SESSION_KEY = 'tangobook:parentGateUntil';
const VALID_MS = 15 * 60 * 1000;
const LOCKOUT_MS = 60 * 1000;
const MAX_FAILURES = 3;

function readUntil(): number {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? Number(raw) : 0;
  } catch {
    return 0;
  }
}

export function useParentGate() {
  const [untilTs, setUntilTs] = useState<number>(() => readUntil());
  const [failureCount, setFailureCount] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number>(0);
  const [, forceTick] = useState(0);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // untilTs 또는 lockedUntil 만료 감지용 1초 interval
  useEffect(() => {
    if (untilTs > 0 || lockedUntil > 0) {
      tickerRef.current = setInterval(() => {
        forceTick((t) => t + 1);
      }, 1000);
      return () => {
        if (tickerRef.current) clearInterval(tickerRef.current);
      };
    }
  }, [untilTs, lockedUntil]);

  const now = Date.now();
  const isUnlocked = untilTs > now;
  const isLockedOut = lockedUntil > now;

  const unlock = useCallback(() => {
    const until = Date.now() + VALID_MS;
    setUntilTs(until);
    try {
      sessionStorage.setItem(SESSION_KEY, String(until));
    } catch {
      // no-op
    }
    setFailureCount(0);
  }, []);

  const lock = useCallback(() => {
    setUntilTs(0);
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // no-op
    }
  }, []);

  const registerFailure = useCallback(() => {
    setFailureCount((c) => {
      const next = c + 1;
      if (next >= MAX_FAILURES) {
        setLockedUntil(Date.now() + LOCKOUT_MS);
        return 0;
      }
      return next;
    });
  }, []);

  return {
    isUnlocked,
    isLockedOut,
    failureCount,
    unlock,
    lock,
    registerFailure,
  };
}
