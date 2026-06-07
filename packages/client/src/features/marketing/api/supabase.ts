// Re-export the shared Tangobook Supabase client.
// Do NOT create a new client here — there is exactly one client per app.
import { supabase } from '@/lib/supabase';
export { supabase };

// ─── Shared current-user-id helper (Phase 1d — used by channel-translator) ────
// The 5 channel panels each declare a module-local copy; new code imports THIS.
export async function getCurrentUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('인증이 필요합니다');
  return user.id;
}
