import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
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
    localStorage.removeItem('tb_ref');
    void apiPost('/payments/referral/redeem', { code }).catch(() => {
      // Best-effort: swallow errors (network failure, invalid code, etc.)
    });
  }, [account]);

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
