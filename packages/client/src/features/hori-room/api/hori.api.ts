import { apiGet } from '@/lib/axios';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { HoriCatalog, HoriInventoryRecord } from '@tangobook/shared';

export const horiApi = {
  /** 카탈로그 (R2) */
  async getCatalog(): Promise<HoriCatalog> {
    return apiGet<HoriCatalog>('/hori/catalog');
  },

  /** 활성 자녀의 인벤토리 (Supabase 직접) */
  async getInventory(profileId: string): Promise<HoriInventoryRecord[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('hori_inventory')
      .select('*')
      .eq('profile_id', profileId);
    if (error) {
      console.warn('[hori] inventory fetch failed', error);
      return [];
    }
    return (data ?? []) as HoriInventoryRecord[];
  },

  /** 아이템 구매 — RPC 가 별 차감 + 인벤토리 추가 + validate trigger */
  async purchase(profileId: string, itemId: string, cost: number): Promise<void> {
    if (!isSupabaseConfigured) throw new Error('Supabase not configured');
    const { error } = await supabase.rpc('purchase_hori_item', {
      p_profile_id: profileId,
      p_item_id: itemId,
      p_cost: cost,
    });
    if (error) throw new Error(error.message);
  },

  /** 장착/해제 — Supabase 직접 update (RLS 통과) */
  async setEquipped(profileId: string, itemId: string, equipped: boolean): Promise<void> {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase
      .from('hori_inventory')
      .update({ equipped })
      .eq('profile_id', profileId)
      .eq('item_id', itemId);
    if (error) throw new Error(error.message);
  },
};
