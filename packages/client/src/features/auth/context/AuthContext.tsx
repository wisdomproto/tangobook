import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Session } from '@supabase/supabase-js';
import type { Account, ChildProfile } from '@tangobook/shared';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { apiPost } from '@/lib/axios';
import { useSession } from '../hooks/useSession';
import { useCurrentAccount } from '../hooks/useCurrentAccount';
import { useActiveProfile } from '../hooks/useActiveProfile';
import { runMigrations } from '../lib/migrations';
import { useReferralCapture } from '@/features/payment/hooks/useReferralCapture';

export interface AuthContextValue {
  isConfigured: boolean;
  loading: boolean;
  session: Session | null;
  account: Account | null;
  profiles: ChildProfile[];
  activeProfile: ChildProfile | null;
  setActiveProfile: (p: ChildProfile | null) => void;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { session, loading: sessionLoading } = useSession();
  const { account, profiles, loading: accLoading, refresh } = useCurrentAccount(session);
  const { activeProfile, setActiveProfile } = useActiveProfile(profiles);
  const migratedForProfile = useRef<string | null>(null);
  const referralRedeemed = useRef(false);
  const queryClient = useQueryClient();

  // Capture ?ref=CODE from URL into localStorage (best-effort, runs once on mount)
  useReferralCapture();

  useEffect(() => {
    if (!activeProfile) return;
    if (migratedForProfile.current === activeProfile.id) return;
    migratedForProfile.current = activeProfile.id;
    void runMigrations(activeProfile.id);
  }, [activeProfile]);

  // Redeem referral code once per session load when the account is ready.
  // The server RPC guards against self-referral, already-referred, and cap — so
  // calling this for non-new accounts is harmless (returns ok:false, no side effects).
  useEffect(() => {
    if (!account) return;
    if (referralRedeemed.current) return;
    const code = localStorage.getItem('tb_ref');
    if (!code) return;
    referralRedeemed.current = true;
    void apiPost<{ ok: boolean; refereeBonus?: number }>('/payments/referral/redeem', { code })
      .then((res) => {
        // 응답을 받은 뒤에만 코드 제거 — 서버가 판정했으니 재시도 무의미(성공/무효/중복 모두).
        localStorage.removeItem('tb_ref');
        if (!res.ok) return;
        // 내(피초대자) 보상은 가입 축하 플로우로 이미 전달 — ReferralRewardToast 가
        // 초대자용 문구("친구 초대 성공!")로 중복 축하하지 않게 기준값 갱신.
        if (typeof res.refereeBonus === 'number') {
          try {
            localStorage.setItem(`tb_ref_bonus_seen:${account.id}`, String(res.refereeBonus));
          } catch {
            // best-effort
          }
        }
        // 늘어난 무료기간 즉시 반영 (배너/멤버십). key 는 useEntitlement 의
        // ENTITLEMENT_QUERY_KEY 와 동일 — 직접 import 하면 순환(useEntitlement→useAuth)이라 인라인.
        void queryClient.invalidateQueries({ queryKey: ['entitlement', account.id] });
      })
      .catch(() => {
        // 네트워크 실패 — 코드를 보존해 다음 로드에서 재시도.
        referralRedeemed.current = false;
      });
  }, [account, queryClient]);

  const signOut = async () => {
    if (isSupabaseConfigured) await supabase.auth.signOut();
    setActiveProfile(null);
  };

  const value: AuthContextValue = {
    isConfigured: isSupabaseConfigured,
    loading: sessionLoading || accLoading,
    session,
    account,
    profiles,
    activeProfile,
    setActiveProfile,
    refresh,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
