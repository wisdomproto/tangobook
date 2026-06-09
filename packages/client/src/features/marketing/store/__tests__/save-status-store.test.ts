import { describe, it, expect, beforeEach } from 'vitest';
import { useSaveStatusStore } from '../save-status-store';

beforeEach(() => {
  useSaveStatusStore.setState({
    pending: 0,
    flushing: false,
    lastError: null,
    lastSavedAt: null,
  });
});

describe('save-status-store', () => {
  it('initial state is all zero/null/false', () => {
    const s = useSaveStatusStore.getState();
    expect(s.pending).toBe(0);
    expect(s.flushing).toBe(false);
    expect(s.lastError).toBeNull();
    expect(s.lastSavedAt).toBeNull();
  });

  it('increment increases pending', () => {
    useSaveStatusStore.getState().increment();
    expect(useSaveStatusStore.getState().pending).toBe(1);
    useSaveStatusStore.getState().increment();
    expect(useSaveStatusStore.getState().pending).toBe(2);
  });

  it('decrement decreases pending', () => {
    useSaveStatusStore.getState().increment();
    useSaveStatusStore.getState().increment();
    useSaveStatusStore.getState().decrement();
    expect(useSaveStatusStore.getState().pending).toBe(1);
  });

  it('decrement does not go below 0', () => {
    useSaveStatusStore.getState().decrement();
    expect(useSaveStatusStore.getState().pending).toBe(0);
  });

  it('setFlushing updates flushing flag', () => {
    useSaveStatusStore.getState().setFlushing(true);
    expect(useSaveStatusStore.getState().flushing).toBe(true);
    useSaveStatusStore.getState().setFlushing(false);
    expect(useSaveStatusStore.getState().flushing).toBe(false);
  });

  it('setError sets lastError and resets flushing', () => {
    useSaveStatusStore.getState().setFlushing(true);
    useSaveStatusStore.getState().setError('Network error');
    const s = useSaveStatusStore.getState();
    expect(s.lastError).toBe('Network error');
    expect(s.flushing).toBe(false);
  });

  it('setSavedAt sets lastSavedAt, clears error, resets flushing', () => {
    const before = Date.now();
    useSaveStatusStore.getState().setFlushing(true);
    useSaveStatusStore.getState().setError('some error');
    useSaveStatusStore.getState().setSavedAt();
    const s = useSaveStatusStore.getState();
    expect(s.lastSavedAt).toBeGreaterThanOrEqual(before);
    expect(s.lastError).toBeNull();
    expect(s.flushing).toBe(false);
  });

  it('transitions: idle → pending → flushing → saved', () => {
    // idle
    expect(useSaveStatusStore.getState().pending).toBe(0);

    // pending
    useSaveStatusStore.getState().increment();
    expect(useSaveStatusStore.getState().pending).toBe(1);

    // flushing
    useSaveStatusStore.getState().setFlushing(true);
    expect(useSaveStatusStore.getState().flushing).toBe(true);

    // saved
    useSaveStatusStore.getState().decrement();
    useSaveStatusStore.getState().setSavedAt();
    const s = useSaveStatusStore.getState();
    expect(s.pending).toBe(0);
    expect(s.flushing).toBe(false);
    expect(s.lastSavedAt).not.toBeNull();
  });

  it('transitions: flushing → error', () => {
    useSaveStatusStore.getState().setFlushing(true);
    useSaveStatusStore.getState().setError('timeout');
    const s = useSaveStatusStore.getState();
    expect(s.lastError).toBe('timeout');
    expect(s.flushing).toBe(false);
  });
});
