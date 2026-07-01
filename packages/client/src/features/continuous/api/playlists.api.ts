import { supabase, isSupabaseConfigured } from '@/lib/supabase';

/** 저장된 연속재생 세트 (Supabase `playlists` 테이블, RLS own-row). */
export interface Playlist {
  id: string;
  accountId: string;
  name: string;
  bookIds: string[];
  language: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlaylistInput {
  accountId: string;
  name: string;
  bookIds: string[];
  language: string;
}

export type UpdatePlaylistInput = Partial<Pick<Playlist, 'name' | 'bookIds' | 'language'>>;

/** Supabase row (snake_case) → 클라 Playlist (camelCase). */
function fromRow(row: {
  id: string;
  account_id: string;
  name: string;
  book_ids: string[] | null;
  language: string | null;
  created_at: string;
  updated_at: string;
}): Playlist {
  return {
    id: row.id,
    accountId: row.account_id,
    name: row.name,
    bookIds: row.book_ids ?? [],
    language: row.language ?? 'ko',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * 계정의 저장된 세트 목록 (최신순). Supabase 미설정 시 빈 배열.
 * RLS 가 own-row 를 보장하지만 방어적으로 account_id 필터도 건다.
 */
async function list(accountId: string): Promise<Playlist[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('playlists')
    .select('id, account_id, name, book_ids, language, created_at, updated_at')
    .eq('account_id', accountId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

/** 새 세트 저장. Supabase 미설정 시 no-op (null). */
async function create(input: CreatePlaylistInput): Promise<Playlist | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('playlists')
    .insert({
      account_id: input.accountId,
      name: input.name,
      book_ids: input.bookIds,
      language: input.language,
    })
    .select('id, account_id, name, book_ids, language, created_at, updated_at')
    .single();
  if (error) throw error;
  return fromRow(data);
}

/** 세트 삭제. Supabase 미설정 시 no-op. */
async function remove(id: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from('playlists').delete().eq('id', id);
  if (error) throw error;
}

/** 세트 수정. Supabase 미설정 시 no-op (null). */
async function update(id: string, patch: UpdatePlaylistInput): Promise<Playlist | null> {
  if (!isSupabaseConfigured) return null;
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.bookIds !== undefined) row.book_ids = patch.bookIds;
  if (patch.language !== undefined) row.language = patch.language;
  const { data, error } = await supabase
    .from('playlists')
    .update(row)
    .eq('id', id)
    .select('id, account_id, name, book_ids, language, created_at, updated_at')
    .single();
  if (error) throw error;
  return fromRow(data);
}

export const playlistsApi = { list, create, remove, update };
