import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anonKey);

// gotrue 의 기본 navigator-lock(Web Locks)이 일부 환경에서 해제되지 않아
// setSession/getSession 이 멈추는 문제가 있다(콘솔 "Lock not released within 5000ms").
// 단일 사용자 탭 기준이라 잠금이 굳이 필요 없으므로 no-op lock 으로 대체해 hang 을 제거한다.
const noopLock = async <R>(
  _name: string,
  _acquireTimeout: number,
  fn: () => Promise<R>
): Promise<R> => fn();

export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        lock: noopLock,
      },
    })
  : // Dummy client — env 미설정 시 호출하면 명확한 에러를 내도록. 실제 호출은 isSupabaseConfigured 체크로 차단.
    createClient('https://invalid.local', 'invalid', {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
