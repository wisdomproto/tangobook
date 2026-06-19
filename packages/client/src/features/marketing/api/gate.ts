import { apiPost } from '@/lib/axios';
import { supabase } from './supabase';

/**
 * 게이트 코드(8054)를 서버에 보내 소유자 세션을 받아 supabase 세션으로 설정.
 * 성공 시 onAuthStateChange 가 발화되어 AuthContext 세션이 갱신된다(상위 가드 통과).
 * apiPost 는 {success,data} 를 벗겨 data(T)를 직접 반환한다.
 */
export async function gateLogin(code: string): Promise<void> {
  // apiClient baseURL 이 '/api' 이므로 경로는 '/mkt/...' (앞에 /api 붙이면 //api/api 중복)
  const session = await apiPost<{ access_token: string; refresh_token: string }>(
    '/mkt/gate-login',
    { code }
  );
  const { error } = await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });
  if (error) throw new Error(error.message);
}
