import { create } from 'zustand';

interface SaveStatusState {
  pending: number;
  flushing: boolean;
  lastError: string | null;
  lastSavedAt: number | null;

  increment: () => void;
  decrement: () => void;
  setFlushing: (flushing: boolean) => void;
  setError: (msg: string) => void;
  setSavedAt: () => void;
}

export const useSaveStatusStore = create<SaveStatusState>((set) => ({
  pending: 0,
  flushing: false,
  lastError: null,
  lastSavedAt: null,

  increment: () => set((s) => ({ pending: s.pending + 1 })),
  decrement: () => set((s) => ({ pending: Math.max(0, s.pending - 1) })),
  setFlushing: (flushing) => set({ flushing }),
  setError: (msg) => set({ lastError: msg, flushing: false }),
  setSavedAt: () => set({ lastSavedAt: Date.now(), lastError: null, flushing: false }),
}));
