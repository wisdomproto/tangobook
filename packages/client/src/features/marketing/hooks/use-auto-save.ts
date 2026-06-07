import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseAutoSaveOptions<T> {
  onSave: (payload: T) => void | Promise<void>;
  delay?: number;
}

export function useAutoSave<T>({ onSave, delay = 2000 }: UseAutoSaveOptions<T>) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<T | null>(null);
  const onSaveRef = useRef(onSave);
  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  const flush = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (pendingRef.current === null) return;
    const payload = pendingRef.current;
    pendingRef.current = null;
    await onSaveRef.current(payload);
    setLastSaved(new Date());
  }, []);

  const schedule = useCallback(
    (payload: T) => {
      pendingRef.current = payload;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        void flush();
      }, delay);
    },
    [delay, flush]
  );

  // flush on unmount
  useEffect(
    () => () => {
      void flush();
    },
    [flush]
  );

  return { schedule, flush, lastSaved };
}
