import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/context/AuthContext';
import { transferGuestEvents } from '../lib/guest-transfer';
import { readGuestEvents } from '../lib/guest-events';
import { useLearningSync } from './useLearningSync';

export function useAdoptGuestEvents() {
  const { activeProfile, profiles } = useAuth();
  const profileId = activeProfile?.id ?? null;
  const queryClient = useQueryClient();
  const busy = useRef(false);
  useLearningSync(
    profileId,
    profiles.map((profile) => profile.id)
  );
  useEffect(() => {
    if (!profileId || profiles.length > 1) return;
    const transfer = async () => {
      if (busy.current || !readGuestEvents().length) return;
      busy.current = true;
      try {
        if (await transferGuestEvents(profileId)) {
          void queryClient.invalidateQueries({ queryKey: ['learning-events', profileId] });
        }
      } catch {
        // Preserve the bound records; retry on reconnect or explicit parent action.
      } finally {
        busy.current = false;
      }
    };
    void transfer();
    window.addEventListener('online', transfer);
    return () => window.removeEventListener('online', transfer);
  }, [profileId, profiles.length, queryClient]);
}
