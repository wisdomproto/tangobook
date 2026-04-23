import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { Account, ChildProfile } from '@tangobook/shared';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { useSession } from '../hooks/useSession';
import { useCurrentAccount } from '../hooks/useCurrentAccount';
import { useActiveProfile } from '../hooks/useActiveProfile';
import { runMigrations } from '../lib/migrations';

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

  useEffect(() => {
    if (!activeProfile) return;
    if (migratedForProfile.current === activeProfile.id) return;
    migratedForProfile.current = activeProfile.id;
    void runMigrations(activeProfile.id);
  }, [activeProfile]);

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
