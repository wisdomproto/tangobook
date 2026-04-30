import { apiGet, apiPost } from '@/lib/axios';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { CollectionCatalog, CollectionItem, CollectionUserRecord } from '@tangobook/shared';

export const collectionApi = {
  /** 마스터 카탈로그 (R2, 모든 사용자 공통) */
  async getCatalog(): Promise<CollectionCatalog> {
    return apiGet<CollectionCatalog>('/collection/catalog');
  },

  /** storybookId → 매칭 카드 ID 배열 (page_read metadata 채우기용) */
  async getStorybookIndex(): Promise<Record<string, string[]>> {
    return apiGet<Record<string, string[]>>('/collection/storybook-index');
  },

  /** 카탈로그에 카드 upsert (admin) */
  async upsertItems(items: CollectionItem[]): Promise<{ added: number; updated: number }> {
    return apiPost<{ added: number; updated: number }>('/collection/items', { items });
  },

  /** 활성 자녀의 카드 획득 상태 */
  async getUserState(profileId: string): Promise<CollectionUserRecord[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('collection_user')
      .select('*')
      .eq('profile_id', profileId);
    if (error) {
      console.warn('[collection] user state fetch failed', error);
      return [];
    }
    return (data ?? []) as CollectionUserRecord[];
  },

  /** 도감 활성 (게임 80%+ 통과 시 호출). RPC 가 owned → active 전이 + 별 +10 */
  async activateForProfile(profileId: string, itemId: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.rpc('activate_collection_item', {
      p_profile_id: profileId,
      p_item_id: itemId,
    });
    if (error) console.warn('[collection] activate failed', error);
  },
};
