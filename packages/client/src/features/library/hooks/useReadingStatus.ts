import { useQuery } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/features/auth/context/AuthContext';
import type { LearningEventMetadata } from '@tangobook/shared';

export type ReadingStatus = 'unread' | 'reading' | 'finished';

/**
 * 자녀별 책 reading status 맵 — `learning_events` 의 page_read 이벤트 집계.
 * - lastPage=true 도달 → 'finished' (완독)
 * - page_read 1+ 있고 lastPage 안 도달 → 'reading' (읽는 중)
 * - 이벤트 없음 → 'unread' (안 읽음, 맵에 entry 없음)
 *
 * 게스트/미로그인/Supabase 미설정 → 빈 맵.
 */
export function useReadingStatus() {
  const { activeProfile } = useAuth();
  return useQuery({
    queryKey: ['reading-status', activeProfile?.id],
    queryFn: async (): Promise<Map<string, ReadingStatus>> => {
      if (!activeProfile?.id || !isSupabaseConfigured) return new Map();
      const { data, error } = await supabase
        .from('learning_events')
        .select('storybook_id, metadata')
        .eq('profile_id', activeProfile.id)
        .eq('event_type', 'page_read')
        .not('storybook_id', 'is', null);
      if (error) {
        console.warn('[reading-status] fetch failed', error);
        return new Map();
      }
      const map = new Map<string, ReadingStatus>();
      for (const e of data ?? []) {
        const sid = e.storybook_id as string | null;
        if (!sid) continue;
        const meta = e.metadata as LearningEventMetadata | null;
        const isLastPage = meta?.lastPage === true;
        const cur = map.get(sid);
        if (isLastPage) {
          map.set(sid, 'finished');
        } else if (cur !== 'finished') {
          map.set(sid, 'reading');
        }
      }
      return map;
    },
    enabled: !!activeProfile?.id,
    staleTime: 30_000,
  });
}
