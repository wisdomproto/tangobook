import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { eventsApi } from '../api/events.api';
import { flushPendingEvents, LEARNING_SYNCED } from '../lib/event-outbox';

export function useLearningSync(profileId: string | null, ownedProfiles: string[] = []) {
  const client = useQueryClient();
  const profileKey = ownedProfiles.join(',');
  useEffect(() => {
    if (!profileId) return;
    const ids = [...new Set([profileId, ...profileKey.split(',').filter(Boolean)])];
    const timers = new Map<string, ReturnType<typeof setTimeout>>();
    const synced = (event: Event) => {
      const id = (event as CustomEvent<{ profileId: string }>).detail.profileId;
      if (!ids.includes(id)) return;
      clearTimeout(timers.get(id));
      timers.set(
        id,
        setTimeout(() => {
          void client.invalidateQueries({ queryKey: ['learning-events', id] });
        }, 500)
      );
    };
    const sync = async () => {
      for (const id of ids) await flushPendingEvents(id, eventsApi.insert);
    };
    window.addEventListener(LEARNING_SYNCED, synced);
    window.addEventListener('online', sync);
    void sync();
    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener(LEARNING_SYNCED, synced);
      for (const timer of timers.values()) clearTimeout(timer);
    };
  }, [profileId, profileKey, client]);
}
