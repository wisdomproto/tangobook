import { guestStorageIsTemporary } from '../lib/guest-events';
import { useMemo, useSyncExternalStore } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { LearningEvent } from '@tangobook/shared';
import { eventsApi } from '../api/events.api';
import {
  LEARNING_CHANGE,
  learningStorageIsTemporary,
  readPendingEvents,
  readLocalReportEvents,
} from '../lib/event-outbox';

function subscribe(callback: () => void) {
  window.addEventListener(LEARNING_CHANGE, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(LEARNING_CHANGE, callback);
    window.removeEventListener('storage', callback);
  };
}

export function useLearningEvents(profileId: string | null | undefined, enabled = true) {
  const pendingJson = useSyncExternalStore(
    subscribe,
    () => JSON.stringify(readLocalReportEvents()),
    () => '[]'
  );
  const query = useQuery({
    queryKey: ['learning-events', profileId],
    queryFn: () => eventsApi.fetchByProfile(profileId!),
    enabled: !!profileId && enabled,
    staleTime: 30_000,
  });
  const pending = useMemo(
    () =>
      (JSON.parse(pendingJson) as LearningEvent[]).filter(
        (event) => event.profile_id === profileId
      ),
    [pendingJson, profileId]
  );
  const data = useMemo(() => {
    if (!query.data && !pending.length) return undefined;
    const byId = new Map<string, LearningEvent>();
    for (const event of [...pending, ...(query.data?.events ?? [])]) byId.set(event.id, event);
    return [...byId.values()].sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [pending, query.data]);
  return {
    ...query,
    data,
    total: query.data?.total ?? 0,
    capped: query.data?.capped ?? false,
    pendingCount: readPendingEvents().filter((event) => event.profile_id === profileId).length,
    temporaryStorage: learningStorageIsTemporary() || guestStorageIsTemporary(),
  };
}
