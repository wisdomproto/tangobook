import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ─── Mock supabase ────────────────────────────────────────────────────────────
// vi.mock is hoisted — do NOT reference top-level variables inside the factory.

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }),
    },
  },
}));

import { supabase } from '@/lib/supabase';
import { useDebouncedSave } from '../use-debounced-save';
import { useSaveStatusStore } from '../../store/save-status-store';

const mockFrom = vi.mocked(supabase.from);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resetStore() {
  useSaveStatusStore.setState({
    pending: 0,
    flushing: false,
    lastError: null,
    lastSavedAt: null,
  });
}

function setupSuccessMock() {
  const eqMock = vi.fn().mockResolvedValue({ error: null });
  const updateMock = vi.fn().mockReturnValue({ eq: eqMock });
  mockFrom.mockReturnValue({ update: updateMock } as any);
  return { eqMock, updateMock };
}

function setupFailureMock() {
  const eqMock = vi.fn().mockResolvedValue({ error: { message: 'conn refused' } });
  const updateMock = vi.fn().mockReturnValue({ eq: eqMock });
  mockFrom.mockReturnValue({ update: updateMock } as any);
  return { eqMock, updateMock };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useDebouncedSave', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    resetStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('increments pending counter when save is called', () => {
    setupSuccessMock();

    const { result } = renderHook(() => useDebouncedSave('mkt_projects', 'proj-1'));

    act(() => {
      result.current({ name: 'hello' });
    });

    expect(useSaveStatusStore.getState().pending).toBe(1);
  });

  it('batches multiple calls into one supabase update', async () => {
    const { updateMock } = setupSuccessMock();

    const { result } = renderHook(() => useDebouncedSave('mkt_projects', 'proj-1'));

    act(() => {
      result.current({ name: 'first' });
      result.current({ name: 'second' });
      result.current({ description: 'desc' });
    });

    // Only one increment (first call within same debounce window)
    expect(useSaveStatusStore.getState().pending).toBe(1);

    // Advance fake timers to flush
    await act(async () => {
      vi.advanceTimersByTime(900);
      await Promise.resolve();
      await Promise.resolve(); // extra tick for async chain
    });

    // Only one supabase call with merged payload
    expect(mockFrom).toHaveBeenCalledWith('mkt_projects');
    expect(updateMock).toHaveBeenCalledTimes(1);
    const payload = updateMock.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.name).toBe('second');
    expect(payload.description).toBe('desc');
  });

  it('drives save-status-store: decrement + setSavedAt on success', async () => {
    setupSuccessMock();

    const { result } = renderHook(() => useDebouncedSave('mkt_projects', 'proj-1'));

    act(() => result.current({ name: 'test' }));

    await act(async () => {
      vi.advanceTimersByTime(900);
      await Promise.resolve();
      await Promise.resolve();
    });

    const state = useSaveStatusStore.getState();
    expect(state.pending).toBe(0);
    expect(state.flushing).toBe(false);
    expect(state.lastSavedAt).not.toBeNull();
    expect(state.lastError).toBeNull();
  });

  it('drives save-status-store: setError on persistent failure', async () => {
    setupFailureMock();

    const { result } = renderHook(() => useDebouncedSave('mkt_projects', 'proj-1'));

    act(() => result.current({ name: 'fail' }));

    // Flush debounce (800ms) + retry delay (500ms)
    await act(async () => {
      vi.advanceTimersByTime(900);
      await Promise.resolve();
      vi.advanceTimersByTime(600);
      await Promise.resolve();
      await Promise.resolve();
    });

    const state = useSaveStatusStore.getState();
    expect(state.lastError).toContain('conn refused');
    expect(state.flushing).toBe(false);
  });

  it('resets debounce timer when called again within window', async () => {
    const { updateMock } = setupSuccessMock();

    const { result } = renderHook(() => useDebouncedSave('mkt_projects', 'proj-1'));

    act(() => result.current({ name: 'a' }));

    // Call again within debounce window — resets timer
    act(() => {
      vi.advanceTimersByTime(400);
      result.current({ name: 'b' });
    });

    // At 400+800 = 1200ms total, should flush with latest value
    await act(async () => {
      vi.advanceTimersByTime(900);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(updateMock).toHaveBeenCalledTimes(1);
    expect(updateMock.mock.calls[0][0]).toMatchObject({ name: 'b' });
  });
});
