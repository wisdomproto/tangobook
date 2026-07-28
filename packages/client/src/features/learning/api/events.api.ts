import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { LearningEvent, LearningEventInsert } from '@tangobook/shared';

/** 한 번 읽어온 이벤트 묶음 + 잘림 여부. */
export interface LearningEventPage {
  events: LearningEvent[];
  /** 서버가 센 전체 건수(받아온 행 수가 아니다). */
  total: number;
  /** 상한에 닿아 **오래된 기록이 빠졌는가**. */
  capped: boolean;
}

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
   * 올려둔 것). 넘으면 **오래된 것부터 잘린다** — 예전엔 그걸 아무도 몰라서 몇 달 쓴 계정의
   * 「모두 N개」 가 실제보다 적은데도 정확한 총계처럼 보였다.
   * 이제 상한에 닿았는지(`capped`)와 **서버가 센 실제 건수**(`total`)를 같이 돌려준다 —
   * 화면은 잘렸다는 사실을 말할 수 있고, 총계는 받아온 행 수가 아니라 서버 숫자를 쓴다.
   */
  async fetchByProfile(profileId: string, limit = 5000): Promise<LearningEventPage> {
    if (!isSupabaseConfigured) return { events: [], total: 0, capped: false };
    const { data, error, count } = await supabase
      .from('learning_events')
      .select('*', { count: 'estimated' })
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) {
      console.warn('[learning-events] fetch failed', error);
      return { events: [], total: 0, capped: false };
    }
    const events = (data ?? []) as LearningEvent[];
    return { events, total: count ?? events.length, capped: events.length >= limit };
  },
};
