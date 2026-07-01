import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useStorybooks } from '@/features/storybook';
import { usePlaylists, useDeletePlaylist } from '../hooks/usePlaylists';
import { usePlaylistStore } from '../store/playlist.store';
import { PlaylistCard } from './PlaylistCard';

/**
 * "나의 재생 목록" 섹션 — LibraryPage 상단(PromoBanner 아래)에 삽입.
 * 로그인 사용자에게만 노출. 게스트(account=null) → null 반환.
 */
export function PlaylistLibrarySection() {
  const navigate = useNavigate();
  const { account } = useAuth();
  const { data: playlists, isLoading } = usePlaylists();
  const { data: books } = useStorybooks();
  const deletePlaylist = useDeletePlaylist();

  // bookId → coverImage 맵 (카드 썸네일)
  const coverOf = useMemo(() => {
    const m = new Map<string, string>();
    (books ?? []).forEach((b) => {
      if (b.coverImage) m.set(b.id, b.coverImage);
    });
    return m;
  }, [books]);

  // 게스트는 섹션 전체 숨김
  if (!account) return null;

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
        {isLoading ? (
          // 스켈레톤 2장
          <>
            <div className="w-64 shrink-0 h-48 rounded-3xl bg-white/60 animate-pulse" />
            <div className="w-64 shrink-0 h-48 rounded-3xl bg-white/60 animate-pulse" />
          </>
        ) : (
          <>
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

            {/* ＋ 재생목록 추가 카드 */}
            <button
              type="button"
              onClick={() => navigate('/continuous/new')}
              className="w-64 shrink-0 rounded-3xl border-2 border-dashed border-coral-300 bg-white/60 hover:bg-coral-50 hover:border-coral-400 transition flex flex-col items-center justify-center gap-2 py-10 font-black text-coral-500 text-base"
              aria-label="재생목록 추가"
            >
              <span className="text-3xl">＋</span>
              <span>재생목록 추가</span>
            </button>
          </>
        )}
      </div>
    </section>
  );
}
