import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';

let _admin: SupabaseClient | null | undefined;

/** Service-role Supabase client (bypasses RLS). null when env is unset. */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (_admin !== undefined) return _admin;
  const url = config.supabase.url; // SUPABASE_URL ?? VITE_SUPABASE_URL
  const key = config.supabase.serviceRoleKey; // SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.warn('[mkt] Supabase admin client not configured — publish scheduler disabled.');
    _admin = null;
    return null;
  }
  _admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return _admin;
}
