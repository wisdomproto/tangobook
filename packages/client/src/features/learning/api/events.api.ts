import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { LearningEvent, LearningEventInsert } from '@tangobook/shared';

export const eventsApi = {
  /**
   * 성공 여부를 돌려준다 — 게스트 기록 이관(`useAdoptGuestEvents`)이 **실패했을 때 되돌리려면**
   * 알아야 한다. 일반 emit 은 fire-and-forget 이라 이 값을 안 본다.
   */
  async insert(events: LearningEventInsert[]): Promise<boolean> {
    if (events.length === 0) return true;
    if (!isSupabaseConfigured) return false;
    const { error } = await supabase.from('learning_events').insert(events);
    if (error) {
      console.warn('[learning-events] insert failed', error);
      return false;
    }
    return true;
  },

  /**
   * 🔴 `limit` 은 계산된 값이 아니라 **첫 구현부터 들어온 상한**이다(PostgREST 기본 1000행을 넉넉히
   * 올려둔 것). 넘으면 **오래된 것부터 조용히 잘리므로**, 몇 달 쓴 계정은 「모두 N개」 같은 총계가
   * 실제보다 적게 나온다. 총계를 정확히 쓰려면 서버 집계로 옮겨야 한다.
   */
  async fetchByProfile(profileId: string, limit = 5000): Promise<LearningEvent[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('learning_events')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) {
      console.warn('[learning-events] fetch failed', error);
      return [];
    }
    return (data ?? []) as LearningEvent[];
  },
};
