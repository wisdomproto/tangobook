import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutoSave } from '../use-auto-save';

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('useAutoSave', () => {
  it('debounces schedule() and fires onSave after the delay', () => {
    vi.useFakeTimers();
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useAutoSave({ onSave, delay: 2000 }));
    act(() => {
      result.current.schedule('v1');
      result.current.schedule('v2');
    });
    expect(onSave).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith('v2');
  });

  it('flush() fires immediately with the pending value', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useAutoSave({ onSave, delay: 5000 }));
    act(() => {
      result.current.schedule('immediate');
    });
    await act(async () => {
      await result.current.flush();
    });
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith('immediate');
  });

  it('flush() on unmount calls onSave if there is a pending value', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { result, unmount } = renderHook(() => useAutoSave({ onSave, delay: 5000 }));
    act(() => {
      result.current.schedule('on-unmount');
    });
    await act(async () => {
      unmount();
    });
    expect(onSave).toHaveBeenCalledWith('on-unmount');
  });
});
