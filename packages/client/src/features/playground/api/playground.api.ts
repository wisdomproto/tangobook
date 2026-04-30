import { apiPost, apiGet } from '@/lib/axios';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Lang, SrPoolItem, SrPoolItemWithCategory, WordCategoryId } from '@tangobook/shared';

interface MasteryRpcRow {
  profile_id: string;
  word: string;
  language: Lang;
  exposed: number;
  correct: number;
  wrong: number;
  mastery: number;
  status: SrPoolItem['status'];
  next_review_at: string | null;
  interval_days: number;
  last_reviewed_at: string | null;
  ease_factor: number;
  created_at: string;
  updated_at: string;
}

export const playgroundApi = {
  /** Supabase RPC 로 SR 큐 조회 → server enrich 로 imageList/sentences 첨부 */
  async getWordPool(params: {
    profileId: string;
    language: Lang;
    count?: number;
    recentStorybookId?: string;
  }): Promise<SrPoolItem[]> {
    // 게스트 / supabase 미설정 → 서버 sample fallback (RPC 가 uuid 요구해 invalid 시 즉시 실패)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      params.profileId
    );
    if (!isSupabaseConfigured || !isUuid) {
      return this.sampleFromVocabulary(params.language, params.count ?? 10);
    }
    const { data, error } = await supabase.rpc('get_sr_word_pool', {
      p_profile_id: params.profileId,
      p_language: params.language,
      p_count: params.count ?? 10,
      p_recent_storybook_id: params.recentStorybookId ?? null,
    });
    if (error) {
      console.warn('[playground] get_sr_word_pool failed', error);
      return [];
    }
    const records = (data ?? []) as MasteryRpcRow[];
    if (records.length === 0) {
      // 신규 사용자 — vocabulary-db 에서 무작위 sample
      return this.sampleFromVocabulary(params.language, params.count ?? 10);
    }

    const enriched = await apiPost<SrPoolItem[]>('/playground/word-pool/enrich', {
      records: records.map((r) => ({
        word: r.word,
        language: r.language,
        mastery: r.mastery,
        status: r.status,
        exposed: r.exposed,
        correct: r.correct,
        wrong: r.wrong,
      })),
    });
    return enriched;
  },

  /** vocabulary-db 에서 무작위 sample (신규 사용자/게스트 fallback) */
  async sampleFromVocabulary(language: Lang, count: number): Promise<SrPoolItem[]> {
    const params = new URLSearchParams({ language, count: String(count) });
    return apiGet<SrPoolItem[]>(`/playground/word-pool/sample?${params}`);
  },

  /** word-sort-cart 용 — 두 카테고리 단어 풀 */
  async getCategoryPool(params: {
    language: Lang;
    cat1: WordCategoryId;
    cat2: WordCategoryId;
    countPerCat: number;
  }): Promise<{ cat1Items: SrPoolItemWithCategory[]; cat2Items: SrPoolItemWithCategory[] }> {
    const qs = new URLSearchParams({
      language: params.language,
      cat1: params.cat1,
      cat2: params.cat2,
      countPerCat: String(params.countPerCat),
    });
    return apiGet<{
      cat1Items: SrPoolItemWithCategory[];
      cat2Items: SrPoolItemWithCategory[];
    }>(`/playground/word-pool/by-categories?${qs}`);
  },
};
