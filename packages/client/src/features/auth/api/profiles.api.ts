import { supabase } from '@/lib/supabase';
import type { ChildProfile, AvatarId } from '@tangobook/shared';

interface ProfileRow {
  id: string;
  account_id: string;
  name: string;
  avatar_id: string;
  birth_date: string | null;
  last_active_at: string | null;
  created_at: string;
}

function rowToProfile(r: ProfileRow): ChildProfile {
  return {
    id: r.id,
    accountId: r.account_id,
    name: r.name,
    avatarId: r.avatar_id as AvatarId,
    birthDate: r.birth_date,
    lastActiveAt: r.last_active_at,
    createdAt: r.created_at,
  };
}

export const profilesApi = {
  async list(accountId: string): Promise<ChildProfile[]> {
    const { data, error } = await supabase
      .from('child_profiles')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(rowToProfile);
  },

  async create(input: {
    accountId: string;
    name: string;
    avatarId: AvatarId;
    birthDate: string | null;
  }): Promise<ChildProfile> {
    const { data, error } = await supabase
      .from('child_profiles')
      .insert({
        account_id: input.accountId,
        name: input.name.trim(),
        avatar_id: input.avatarId,
        birth_date: input.birthDate,
      })
      .select('*')
      .single();
    if (error) throw error;
    return rowToProfile(data);
  },

  async update(id: string, patch: Partial<Pick<ChildProfile, 'name' | 'avatarId' | 'birthDate'>>) {
    const row: Record<string, unknown> = {};
    if (patch.name !== undefined) row.name = patch.name.trim();
    if (patch.avatarId !== undefined) row.avatar_id = patch.avatarId;
    if (patch.birthDate !== undefined) row.birth_date = patch.birthDate;
    const { data, error } = await supabase
      .from('child_profiles')
      .update(row)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return rowToProfile(data);
  },

  async delete(id: string) {
    const { error } = await supabase.from('child_profiles').delete().eq('id', id);
    if (error) throw error;
  },

  async touchActive(id: string) {
    await supabase
      .from('child_profiles')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', id);
  },
};
