import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useStorybooks } from '@/features/storybook';
import { StateScreen } from '@/design-system';
import { beginPlaylist } from '../lib/begin-playlist';
import { usePlaylists, useDeletePlaylist } from '../hooks/usePlaylists';
import { PlaylistCard } from '../components/PlaylistCard';

/**
 * 연속재생 홈 — 저장된 세트 목록 + 새 세트 만들기 진입.
 * 세트 카드 원탭 → store.setQueue → /continuous/play.
 * 게스트(비로그인)는 즉석 재생만 가능 + 로그인 유도.
 */
export default function ContinuousHomePage() {
  const { t } = useTranslation('continuous');
  const navigate = useNavigate();
  const { account } = useAuth();
  const { data: playlists, isLoading } = usePlaylists();
  const { data: books } = useStorybooks();
  const deletePlaylist = useDeletePlaylist();

  // bookId → 표지 맵 (세트 썸네일 해석용). 클린 표지(제목 없음) 우선 — 없으면 레거시 폴백.
  const coverOf = useMemo(() => {
    const m = new Map<string, string>();
    (books ?? []).forEach((b) => {
      const cover = b.cleanCoverImage ?? b.coverImage;
      if (cover) m.set(b.id, cover);
    });
    return m;
  }, [books]);

  const play = (bookIds: string[], language: string) => {
    beginPlaylist(bookIds, language, navigate);
  };

  const isGuest = !account?.id;
  const hasSets = (playlists?.length ?? 0) > 0;

  return (
    <div className="bg-gradient-to-b from-cream-50 to-peach-100 min-h-full">
      <div className="max-w-[1200px] mx-auto px-6 md:px-8 pt-6 pb-10">
        <header className="mb-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/library')}
            aria-label={t('home.back')}
            className="w-10 h-10 shrink-0 rounded-full bg-white shadow-soft flex items-center justify-center font-black text-ink-600 hover:bg-ink-50 transition"
          >
            ←
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-ink-900 font-display">
              {t('home.title')}
            </h1>
            <p className="mt-1 text-ink-500 font-bold">{t('home.subtitle')}</p>
          </div>
        </header>

        {/* 새 세트 만들기 — 항상 최상단, 눈에 잘 띄게 */}
        <button
          type="button"
          onClick={() => navigate('/continuous/new')}
          className="w-full sm:w-auto inline-flex items-center gap-2 rounded-2xl bg-coral-500 hover:bg-coral-600 text-white font-black text-lg px-6 py-4 shadow-soft hover:shadow-pop active:scale-95 transition mb-8"
        >
          {t('home.newSet')}
        </button>

        {isGuest && (
          <div className="mb-8 rounded-2xl bg-mint-50 border-2 border-mint-200 px-5 py-4">
            <p className="font-bold text-ink-700">{t('home.guestNotice')}</p>
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
                  onEdit={() => navigate(`/continuous/edit/${p.id}`)}
                  onDelete={() => {
                    if (window.confirm(t('home.deleteConfirm', { name: p.name }))) {
                      deletePlaylist.mutate(p.id);
                    }
                  }}
                />
              ))}
            </div>
          ) : (
            <StateScreen
              mascotState="thinking"
              title={t('home.emptyTitle')}
              description={t('home.emptyDescription')}
              action={{ label: t('home.newSet'), onClick: () => navigate('/continuous/new') }}
            />
          ))}
      </div>
    </div>
  );
}
