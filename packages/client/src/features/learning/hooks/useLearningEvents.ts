import { useQuery } from '@tanstack/react-query';
import { eventsApi } from '../api/events.api';

export function useLearningEvents(profileId: string | null | undefined) {
  return useQuery({
    queryKey: ['learning-events', profileId],
    queryFn: () => eventsApi.fetchByProfile(profileId!),
    enabled: !!profileId,
    staleTime: 30_000,
  });
}
