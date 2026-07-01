import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/context/AuthContext';
import { isSupabaseConfigured } from '@/lib/supabase';
import {
  playlistsApi,
  type Playlist,
  type CreatePlaylistInput,
  type UpdatePlaylistInput,
} from '../api/playlists.api';

export const PLAYLISTS_QUERY_KEY = (accountId: string) => ['playlists', accountId] as const;

/** 로그인한 계정의 저장된 세트 목록. 계정/Supabase 없으면 비활성(빈 캐시). */
export function usePlaylists() {
  const { account } = useAuth();
  return useQuery<Playlist[]>({
    queryKey: account ? PLAYLISTS_QUERY_KEY(account.id) : ['playlists', null],
    enabled: Boolean(account?.id && isSupabaseConfigured),
    queryFn: () => playlistsApi.list(account!.id),
  });
}

/** 세트 저장 후 목록 무효화. */
export function useCreatePlaylist() {
  const { account } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePlaylistInput) => playlistsApi.create(input),
    onSuccess: () => {
      if (account?.id) qc.invalidateQueries({ queryKey: PLAYLISTS_QUERY_KEY(account.id) });
    },
  });
}

/** 세트 삭제 후 목록 무효화. */
export function useDeletePlaylist() {
  const { account } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => playlistsApi.remove(id),
    onSuccess: () => {
      if (account?.id) qc.invalidateQueries({ queryKey: PLAYLISTS_QUERY_KEY(account.id) });
    },
  });
}

/** 세트 수정 후 목록 무효화. */
export function useUpdatePlaylist() {
  const { account } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdatePlaylistInput }) =>
      playlistsApi.update(id, patch),
    onSuccess: () => {
      if (account?.id) qc.invalidateQueries({ queryKey: PLAYLISTS_QUERY_KEY(account.id) });
    },
  });
}
