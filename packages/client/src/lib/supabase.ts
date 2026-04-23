import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : // Dummy client — env 미설정 시 호출하면 명확한 에러를 내도록. 실제 호출은 isSupabaseConfigured 체크로 차단.
    createClient('https://invalid.local', 'invalid', {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
