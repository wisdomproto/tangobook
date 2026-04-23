import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useParentGate } from './useParentGate';

describe('useParentGate', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.useFakeTimers({
      toFake: ['Date', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval'],
    });
    vi.setSystemTime(new Date('2026-04-23T00:00:00Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('초기 상태: isUnlocked false, isLockedOut false', () => {
    const { result } = renderHook(() => useParentGate());
    expect(result.current.isUnlocked).toBe(false);
    expect(result.current.isLockedOut).toBe(false);
  });

  it('unlock 호출 시 sessionStorage 타임스탬프 저장 + isUnlocked true', () => {
    const { result } = renderHook(() => useParentGate());
    act(() => result.current.unlock());
    expect(result.current.isUnlocked).toBe(true);
    const raw = sessionStorage.getItem('tangobook:parentGateUntil');
    expect(Number(raw)).toBeGreaterThan(Date.now());
  });

  it('15분 + 1초 경과 후 isUnlocked false', () => {
    const { result } = renderHook(() => useParentGate());
    act(() => result.current.unlock());
    act(() => {
      vi.advanceTimersByTime(15 * 60 * 1000 + 1000);
    });
    expect(result.current.isUnlocked).toBe(false);
  });

  it('registerFailure 3회 호출 시 isLockedOut true, 60초 후 해제', () => {
    const { result } = renderHook(() => useParentGate());
    act(() => {
      result.current.registerFailure();
      result.current.registerFailure();
      result.current.registerFailure();
    });
    expect(result.current.isLockedOut).toBe(true);
    act(() => {
      vi.advanceTimersByTime(60 * 1000 + 100);
    });
    expect(result.current.isLockedOut).toBe(false);
  });

  it('lock() 호출 시 sessionStorage 삭제 + isUnlocked false', () => {
    const { result } = renderHook(() => useParentGate());
    act(() => result.current.unlock());
    expect(result.current.isUnlocked).toBe(true);
    act(() => result.current.lock());
    expect(result.current.isUnlocked).toBe(false);
    expect(sessionStorage.getItem('tangobook:parentGateUntil')).toBeNull();
  });
});
