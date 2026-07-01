import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useStorybooks } from '@/features/storybook';
import { StateScreen } from '@/design-system';
import { usePlaylistStore } from '../store/playlist.store';
import { usePlaylists, useDeletePlaylist } from '../hooks/usePlaylists';
import { PlaylistCard } from '../components/PlaylistCard';

/**
 * 연속재생 홈 — 저장된 세트 목록 + 새 세트 만들기 진입.
 * 세트 카드 원탭 → store.setQueue → /continuous/play.
 * 게스트(비로그인)는 즉석 재생만 가능 + 로그인 유도.
 */
export default function ContinuousHomePage() {
  const navigate = useNavigate();
  const { account } = useAuth();
  const { data: playlists, isLoading } = usePlaylists();
  const { data: books } = useStorybooks();
  const deletePlaylist = useDeletePlaylist();

  // bookId → coverImage 맵 (세트 썸네일 해석용).
  const coverOf = useMemo(() => {
    const m = new Map<string, string>();
    (books ?? []).forEach((b) => {
      if (b.coverImage) m.set(b.id, b.coverImage);
    });
    return m;
  }, [books]);

  const play = (bookIds: string[], language: string) => {
    if (bookIds.length === 0) return;
    usePlaylistStore.getState().setQueue(
      bookIds.map((bookId) => ({ bookId })),
      language
    );
    navigate('/continuous/play');
  };

  const isGuest = !account?.id;
  const hasSets = (playlists?.length ?? 0) > 0;

  return (
    <div className="bg-gradient-to-b from-cream-50 to-peach-100 min-h-full">
      <div className="max-w-[1200px] mx-auto px-6 md:px-8 pt-6 pb-10">
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-black text-ink-900 font-display">
            연속 재생 🎬
          </h1>
          <p className="mt-1 text-ink-500 font-bold">
            여러 권을 이어서 자동으로 읽어줘요. 잠자리 동화로 딱!
          </p>
        </header>

        {/* 새 세트 만들기 — 항상 최상단, 눈에 잘 띄게 */}
        <button
          type="button"
          onClick={() => navigate('/continuous/new')}
          className="w-full sm:w-auto inline-flex items-center gap-2 rounded-2xl bg-coral-500 hover:bg-coral-600 text-white font-black text-lg px-6 py-4 shadow-soft hover:shadow-pop active:scale-95 transition mb-8"
        >
          ＋ 새 세트 만들기
        </button>

        {isGuest && (
          <div className="mb-8 rounded-2xl bg-mint-50 border-2 border-mint-200 px-5 py-4">
            <p className="font-bold text-ink-700">
              🔒 로그인하면 세트를 저장할 수 있어요. 지금은 즉석 재생만 가능해요.
            </p>
          </div>
        )}

        {/* 저장된 세트 */}
        {!isGuest &&
          (isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-56 rounded-3xl bg-white/60 animate-pulse" />
              ))}
            </div>
          ) : hasSets ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {playlists!.map((p) => (
                <PlaylistCard
                  key={p.id}
                  name={p.name}
                  bookCount={p.bookIds.length}
                  language={p.language}
                  coverUrls={p.bookIds
                    .map((id) => coverOf.get(id))
                    .filter((u): u is string => Boolean(u))}
                  onPlay={() => play(p.bookIds, p.language)}
                  onDelete={() => {
                    if (window.confirm(`"${p.name}" 세트를 삭제할까요?`)) {
                      deletePlaylist.mutate(p.id);
                    }
                  }}
                />
              ))}
            </div>
          ) : (
            <StateScreen
              mascotState="thinking"
              title="저장된 세트가 없어요"
              description="새 세트를 만들어 여러 권을 이어서 들어보세요!"
              action={{ label: '＋ 새 세트 만들기', onClick: () => navigate('/continuous/new') }}
            />
          ))}
      </div>
    </div>
  );
}
