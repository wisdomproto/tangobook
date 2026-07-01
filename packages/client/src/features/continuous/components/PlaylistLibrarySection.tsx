import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useStorybooks } from '@/features/storybook';
import { usePlaylists, useDeletePlaylist } from '../hooks/usePlaylists';
import { usePlaylistStore } from '../store/playlist.store';
import { PlaylistCard } from './PlaylistCard';

/**
 * "나의 재생 목록" 섹션 — LibraryPage 내 카테고리 섹션 바로 위에 삽입.
 *
 * Render policy (decoupled from sidebar entry):
 *   - guest (account=null) → null (hidden)
 *   - loading or 0 playlists → null (hidden — sidebar 연속재생 button is the creation path)
 *   - ≥1 playlists → header + horizontal card row (no trailing add-card)
 */
export function PlaylistLibrarySection() {
  const navigate = useNavigate();
  const { account } = useAuth();
  const { data: playlists, isLoading } = usePlaylists();
  const { data: books } = useStorybooks();
  const deletePlaylist = useDeletePlaylist();

  const coverOf = useMemo(() => {
    const m = new Map<string, string>();
    (books ?? []).forEach((b) => {
      if (b.coverImage) m.set(b.id, b.coverImage);
    });
    return m;
  }, [books]);

  // Hidden for guests
  if (!account) return null;

  // Hidden while loading or when there are no saved playlists —
  // the sidebar 연속재생 button is the entry/create path.
  if (isLoading || (playlists ?? []).length === 0) return null;

  const handlePlay = (bookIds: string[], language: string) => {
    if (bookIds.length === 0) return;
    usePlaylistStore.getState().setQueue(
      bookIds.map((bookId) => ({ bookId })),
      language
    );
    navigate('/continuous/play');
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`"${name}" 세트를 삭제할까요?`)) {
      deletePlaylist.mutate(id);
    }
  };

  return (
    <section className="mb-8">
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-black text-ink-900 font-display flex items-center gap-2">
          🎬 나의 재생 목록
        </h2>
        <button
          type="button"
          onClick={() => navigate('/continuous/new')}
          className="text-sm font-black text-coral-600 hover:text-coral-700 transition"
        >
          + 새 세트
        </button>
      </div>

      {/* 카드 행 — 가로 스크롤 */}
      <div className="flex gap-4 overflow-x-auto pb-2">
        {(playlists ?? []).map((p) => (
          <div key={p.id} className="w-64 shrink-0">
            <PlaylistCard
              name={p.name}
              bookCount={p.bookIds.length}
              language={p.language}
              coverUrls={p.bookIds
                .map((id) => coverOf.get(id))
                .filter((u): u is string => Boolean(u))}
              onPlay={() => handlePlay(p.bookIds, p.language)}
              onDelete={() => handleDelete(p.id, p.name)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
