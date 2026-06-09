import { useCallback, useRef } from 'react';
import { supabase } from './supabase';
import { useSaveStatusStore } from '../store/save-status-store';

/**
 * useDebouncedSave — high-frequency field edits (e.g. project settings text).
 *
 * Returns a `save(updates)` function that:
 *   1. Coalesces writes over ~800 ms (last write wins per key).
 *   2. Reports to save-status-store:
 *        - increment on enqueue
 *        - setFlushing + decrement + setSavedAt on success
 *        - setError on failure (1 retry after 500 ms)
 *
 * Multiple calls with the same `table`/`id` share one pending-write slot
 * (merging updates). This mirrors contentflow's `debouncedWrite` semantics
 * but is scoped to a single hook instance (no global Map) — use one hook
 * per table/id pair in each component.
 *
 * @param table  Supabase table name (e.g. 'mkt_projects')
 * @param id     Row primary key
 */
export function useDebouncedSave(table: string, id: string) {
  // Accumulated updates not yet flushed
  const pendingRef = useRef<Record<string, unknown>>({});
  // Whether we've already incremented the save-status counter for the current batch
  const hasEnqueuedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(
    (updates: Record<string, unknown>) => {
      const status = useSaveStatusStore.getState();

      // Merge into pending batch
      pendingRef.current = { ...pendingRef.current, ...updates };

      // Increment counter only once per debounce window
      if (!hasEnqueuedRef.current) {
        status.increment();
        hasEnqueuedRef.current = true;
      }

      // Reset the debounce timer
      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(async () => {
        timerRef.current = null;

        const payload = pendingRef.current;
        pendingRef.current = {};
        hasEnqueuedRef.current = false;

        status.setFlushing(true);

        // Attempt with 1 retry
        let ok = false;
        let lastMsg = '';
        for (let attempt = 0; attempt < 2; attempt++) {
          const { error } = await supabase.from(table).update(payload).eq('id', id);
          if (!error) {
            ok = true;
            break;
          }
          lastMsg = error.message;
          if (attempt === 0) {
            await new Promise<void>((r) => setTimeout(r, 500));
          }
        }

        status.decrement();

        if (ok) {
          status.setSavedAt();
        } else {
          status.setError(`저장 실패: ${lastMsg}`);
        }
      }, 800);
    },
    [table, id]
  );

  return save;
}
