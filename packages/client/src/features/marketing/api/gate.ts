import { apiPost } from '@/lib/axios';
import { supabase } from './supabase';

/**
 * 게이트 코드(8054)를 서버에 보내 소유자 세션을 받아 supabase 세션으로 설정한 뒤,
 * `/marketing` 으로 하드 내비게이션해 AuthContext 가 저장된 세션을 새로 읽게 한다.
 *
 * setSession 만으로 onAuthStateChange 가 발화되길 기대했으나, 일부 환경(특히 prod)에서
 * gotrue navigator-lock 때문에 전파가 지연/누락되어 게이트가 "확인 중"에 멈추는 문제가 있었다.
 * setSession 은 세션을 localStorage 에 저장하므로, 전체 리로드 시 useSession.getSession() 이
 * 확실히 세션을 복원한다. setSession 이 락에 걸려 6초 내 끝나지 않아도 리로드로 진행한다.
 * apiPost 는 {success,data} 를 벗겨 data(T)를 직접 반환한다.
 */
export async function gateLogin(code: string): Promise<void> {
  // apiClient baseURL 이 '/api' 이므로 경로는 '/mkt/...' (앞에 /api 붙이면 //api/api 중복)
  const session = await apiPost<{ access_token: string; refresh_token: string }>(
    '/mkt/gate-login',
    { code }
  );
  try {
    await Promise.race([
      supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      }),
      new Promise((resolve) => setTimeout(resolve, 6000)),
    ]);
  } catch {
    // setSession 실패해도 아래 리로드로 복원 시도 (저장돼 있으면 복원됨)
  }
  window.location.assign('/marketing');
}
