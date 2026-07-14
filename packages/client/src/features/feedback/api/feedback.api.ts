import { supabase, isSupabaseConfigured } from '@/lib/supabase';

/** 사용자 건의 (Supabase `app_feedback`, RLS own-row). */
export interface FeedbackInput {
  accountId: string;
  message: string;
  contact?: string | null;
}

/**
 * 건의 저장. Supabase 미설정 시 no-op(false).
 * RLS insert with-check(account_id = auth.uid()) 를 통과하려면 accountId 스탬프 필수.
 */
export async function submitFeedback(input: FeedbackInput): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const message = input.message.trim();
  if (!message) return false;
  const { error } = await supabase.from('app_feedback').insert({
    account_id: input.accountId,
    message,
    contact: input.contact ?? null,
  });
  if (error) throw error;
  return true;
}
