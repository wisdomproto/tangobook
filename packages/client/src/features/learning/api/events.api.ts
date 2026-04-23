import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { LearningEvent, LearningEventInsert } from '@tangobook/shared';

export const eventsApi = {
  async insert(events: LearningEventInsert[]): Promise<void> {
    if (!isSupabaseConfigured || events.length === 0) return;
    const { error } = await supabase.from('learning_events').insert(events);
    if (error) {
      console.warn('[learning-events] insert failed', error);
    }
  },

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
