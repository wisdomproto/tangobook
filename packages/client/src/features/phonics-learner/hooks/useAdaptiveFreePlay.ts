import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import { queryClient } from '@/lib/query-client';
import { eventsApi } from '@/features/learning/api/events.api';
import { readLocalReportEvents } from '@/features/learning/lib/event-outbox';
import { readGuestEvents } from '@/features/learning/lib/guest-events';
import { chooseAdaptiveFreePlay } from '../lib/adaptive-free-play';
import { freePlayCatalog, type FreeGameId } from '../lib/free-play-catalog';
import { getUnitProgress } from '../lib/progress-store';
import type { JourneyLanguage } from '../lib/learning-journey';
import type { LearningEventInsert } from '@tangobook/shared';

export function useAdaptiveFreePlay(lang: JourneyLanguage) {
  const { activeProfile } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const generation = useRef(0);
  const pending = useRef(false);
  useEffect(() => {
    generation.current++;
    pending.current = false;
    setBusy(false);
    return () => {
      generation.current++;
    };
  }, [lang, activeProfile?.id]);
  const start = (game: FreeGameId) => {
    if (pending.current) return;
    pending.current = true;
    const token = ++generation.current;
    const launch = (events: LearningEventInsert[]) => {
      if (token !== generation.current) return;
      let localProfile: string | null = null;
      try {
        localProfile = localStorage.getItem('tangobook:activeProfileId') || '';
      } catch {
        /* No unscoped local progress when storage is unavailable. */
      }
      const trained =
        localProfile === (activeProfile?.id || '')
          ? [...new Set(freePlayCatalog(lang).map((entry) => entry.unit.id))].filter(
              (id) => getUnitProgress(lang, id).completedActivities.length > 0
            )
          : [];
      const choice = chooseAdaptiveFreePlay(lang, game, events, Math.random, trained);
      setBusy(false);
      if (choice) navigate(choice.href);
      else pending.current = false;
    };
    if (!activeProfile?.id) {
      launch(readGuestEvents().filter((event) => !event.profile_id));
      return;
    }
    const profile = activeProfile.id;
    pending.current = true;
    setBusy(true);
    void queryClient
      .fetchQuery({
        queryKey: ['learning-events', profile],
        queryFn: () => eventsApi.fetchByProfile(profile),
        staleTime: 30_000,
      })
      .then((page) =>
        launch(
          [...readLocalReportEvents(), ...page.events].filter(
            (event) => event.profile_id === profile
          )
        )
      )
      // Unavailable history is handled conservatively with only this child's local evidence.
      .catch(() => launch(readLocalReportEvents().filter((event) => event.profile_id === profile)));
  };
  return { start, busy };
}
