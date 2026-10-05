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
    const { error } = await supabase
      .from('learning_events')
      .upsert(events, { onConflict: 'id', ignoreDuplicates: true });
    if (error) {
      console.warn('[learning-events] insert failed', error);
      return false;
    }
    return true;
  },

  /** Read in stable timestamp/ID order. Failures remain errors, not an empty report. */
  async fetchByProfile(profileId: string, limit = 50000): Promise<LearningEventPage> {
    if (!isSupabaseConfigured) throw new Error('Learning storage unavailable');
    const events: LearningEvent[] = [];
    const snapshot = new Date().toISOString();
    const pageSize = 500;
    let total = 0;
    let cursor: LearningEvent | undefined;
    while (events.length < limit) {
      const size = Math.min(pageSize, limit - events.length);
      let request = supabase
        .from('learning_events')
        .select('*', cursor ? undefined : { count: 'exact' })
        .eq('profile_id', profileId)
        .lte('created_at', snapshot)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false });
      if (cursor)
        request = request.or(
          `created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`
        );
      const { data, error, count } = await request.range(0, size - 1);
      if (error) throw error;
      if (!cursor) {
        if (count === null) throw new Error('Learning record count unavailable');
        total = count;
      }
      const page = (data ?? []) as LearningEvent[];
      events.push(...page);
      cursor = page.at(-1);
      if (page.length < size) break;
    }
    return {
      events,
      total: Math.max(total, events.length),
      capped: events.length >= limit || total > events.length,
    };
  },
};
