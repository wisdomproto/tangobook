import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { StarBalance, StarLedgerEntry } from '@tangobook/shared';

export const rewardsApi = {
  async getBalance(profileId: string): Promise<StarBalance | null> {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase
      .from('child_profiles')
      .select('id, stars_total, streak_days, last_active_date')
      .eq('id', profileId)
      .single();
    if (error) {
      console.warn('[rewards] balance fetch failed', error);
      return null;
    }
    return {
      profile_id: data.id,
      stars_total: data.stars_total ?? 0,
      streak_days: data.streak_days ?? 0,
      last_active_date: data.last_active_date,
    };
  },

  async getLedger(profileId: string, limit = 50): Promise<StarLedgerEntry[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('star_ledger')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) {
      console.warn('[rewards] ledger fetch failed', error);
      return [];
    }
    return (data ?? []) as StarLedgerEntry[];
  },
};
