import { useQuery } from '@tanstack/react-query';
import { eventsApi } from '../api/events.api';

/**
 * 학습 이벤트 — `data` 는 **이벤트 배열 그대로**(기존 호출부 무변경), 잘림 정보는 따로 준다.
 * 🔴 `capped` 가 true 면 오래된 기록이 빠진 목록이다. 총계를 그리는 화면은 `total` 을 쓸 것.
 */
export function useLearningEvents(profileId: string | null | undefined) {
  const query = useQuery({
    queryKey: ['learning-events', profileId],
    queryFn: () => eventsApi.fetchByProfile(profileId!),
    enabled: !!profileId,
    staleTime: 30_000,
  });
  return {
    ...query,
    data: query.data?.events,
    total: query.data?.total ?? 0,
    capped: query.data?.capped ?? false,
  };
}
