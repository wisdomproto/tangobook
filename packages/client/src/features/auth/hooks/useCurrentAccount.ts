import { useEffect, useState, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Account, ChildProfile } from '@tangobook/shared';
import { profilesApi } from '../api/profiles.api';

interface AccountRow {
  id: string;
  email: string | null;
  pin_hash: string | null;
  pin_set_at: string | null;
  created_at: string;
}

function rowToAccount(r: AccountRow): Account {
  return {
    id: r.id,
    email: r.email,
    hasPin: r.pin_hash !== null,
    pinSetAt: r.pin_set_at,
    createdAt: r.created_at,
  };
}

async function fetchAccount(uid: string, email: string | null): Promise<Account> {
  let { data, error } = await supabase
    .from('accounts')
    .select('id, email, pin_hash, pin_set_at, created_at')
    .eq('id', uid)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    const { error: upErr } = await supabase
      .from('accounts')
      .upsert({ id: uid, email }, { onConflict: 'id' });
    if (upErr) throw upErr;
    const retry = await supabase
      .from('accounts')
      .select('id, email, pin_hash, pin_set_at, created_at')
      .eq('id', uid)
      .single();
    if (retry.error) throw retry.error;
    data = retry.data;
  }
  return rowToAccount(data as AccountRow);
}

export function useCurrentAccount(session: Session | null) {
  const [account, setAccount] = useState<Account | null>(null);
  const [profiles, setProfiles] = useState<ChildProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!session) {
      setAccount(null);
      setProfiles([]);
      return;
    }
    setLoading(true);
    try {
      const acc = await fetchAccount(session.user.id, session.user.email ?? null);
      setAccount(acc);
      const list = await profilesApi.list(acc.id);
      setProfiles(list);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { account, profiles, loading, error, refresh, setProfiles };
}
