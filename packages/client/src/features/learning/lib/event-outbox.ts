import { withLearningStorageLock } from './storage-lock';
import type { LearningEventInsert } from '@tangobook/shared';

const KEY = 'tangobook-learning-outbox-v1';
export const LEARNING_CHANGE = 'learning-events:change';
export const LEARNING_SYNCED = 'learning-events:synced';
type PendingEvent = LearningEventInsert & { id: string };
let sending: Promise<void> | null = null;
let memoryFallback: PendingEvent[] | null = null;
const confirmed = new Map<string, PendingEvent>();

/** Bridge the interval between server ACK and the report query catching up. */
export function readLocalReportEvents(): PendingEvent[] {
  return [...confirmed.values(), ...readPendingEvents()];
}
export function learningStorageIsTemporary() {
  return memoryFallback !== null;
}

export function readPendingEvents(): PendingEvent[] {
  if (memoryFallback) return memoryFallback;
  try {
    const value: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(value) ? value.filter((e) => e?.id && e.profile_id) : [];
  } catch {
    return [];
  }
}

function write(events: PendingEvent[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(events));
    memoryFallback = null;
  } catch {
    // Storage restrictions must not interrupt a child’s game. Report the limitation.
    memoryFallback = events;
  }
  window.dispatchEvent(new Event(LEARNING_CHANGE));
}

export function prepareEvent(event: LearningEventInsert): PendingEvent {
  return {
    ...event,
    storybook_id: event.storybook_id ?? null,
    game_type: event.game_type ?? null,
    word: event.word ?? null,
    metadata: event.metadata ?? null,
    id: event.id ?? crypto.randomUUID(),
    created_at: event.created_at ?? new Date().toISOString(),
  };
}

export function enqueueEvents(events: LearningEventInsert[]): Promise<void> {
  const prepared = events.map(prepareEvent);
  return withLearningStorageLock(() => {
    const byId = new Map(readPendingEvents().map((event) => [event.id, event]));
    for (const event of prepared)
      if (!byId.has(event.id) && !confirmed.has(event.id)) byId.set(event.id, event);
    write([...byId.values()]);
  });
}

/** Only the active child's pending records may be sent; retain ACK failures and new records. */
export function flushPendingEvents(
  profileId: string,
  insert: (events: LearningEventInsert[]) => Promise<boolean>
): Promise<void> {
  if (sending) return sending.then(() => flushPendingEvents(profileId, insert));
  sending = (async () => {
    const snapshot = await withLearningStorageLock(() =>
      readPendingEvents().filter((e) => e.profile_id === profileId)
    );
    for (let offset = 0; offset < snapshot.length; offset += 100) {
      const chunk = snapshot.slice(offset, offset + 100);
      try {
        if (!(await insert(chunk))) break;
        for (const event of chunk) confirmed.set(event.id, event);
        while (confirmed.size > 2000) confirmed.delete(confirmed.keys().next().value!);
        const ack = new Set(chunk.map((e) => e.id));
        await withLearningStorageLock(() =>
          write(readPendingEvents().filter((e) => !ack.has(e.id)))
        );
        window.dispatchEvent(new CustomEvent(LEARNING_SYNCED, { detail: { profileId } }));
      } catch {
        break;
      }
    }
  })()
    .catch(() => {
      /* Keep the queued records if storage coordination fails. */
    })
    .finally(() => {
      sending = null;
    });
  return sending;
}
