import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useStorybooks } from '@/features/storybook';
import { useCategoryLabel } from '@/features/library/lib/category-i18n';
import { usePlaylists, useDeletePlaylist } from '../hooks/usePlaylists';
import { buildCategoryBundles } from '../lib/category-bundles';
import { beginPlaylist } from '../lib/begin-playlist';
import { PlaylistCard } from './PlaylistCard';

/**
 * "묶어 보기" 섹션 — LibraryPage 내 카테고리 섹션 바로 위.
 *
 * Render policy (2026-07-24 개편):
 *   - 카테고리 묶음(카테고리별 첫 3권)은 **게스트·로그인 구분 없이 동일하게** 보인다.
 *     이전엔 게스트에게 섹션 자체가 안 보였고, 로그인해도 세트를 직접 만들어야 해서
 *     "여러 권 이어 듣기"를 쓰려면 백지에서 시작해야 했다.
 *   - 묶음은 저장하지 않고 현재 라이브러리 목록에서 파생한다(책이 빠져도 썩지 않음).
 *   - 로그인 사용자는 묶음 아래에 자기가 만든 세트를 함께 본다.
 *   - 기본 펼침 — 이제 항상 내용이 있으므로 접어둘 이유가 없다.
 */
export function PlaylistLibrarySection() {
  const { t, i18n } = useTranslation('library');
  const navigate = useNavigate();
  const { account } = useAuth();
  const { data: playlists, isLoading: playlistsLoading } = usePlaylists();
  const { data: books } = useStorybooks();
  const deletePlaylist = useDeletePlaylist();
  const catLabel = useCategoryLabel();
  const [open, setOpen] = useState(true);

  const bundles = useMemo(() => buildCategoryBundles(books ?? []), [books]);

  // 표지 썸네일 — 묶음·내 세트 공용.
  const coverOf = useMemo(() => {
    const m = new Map<string, string>();
    (books ?? []).forEach((b) => {
      if (b.coverImage) m.set(b.id, b.coverImage);
    });
    return m;
  }, [books]);

  const mySets = account && !playlistsLoading ? (playlists ?? []) : [];
  const hasAnything = bundles.length > 0 || mySets.length > 0;
  // 묶음도 없고 내 세트도 없고 로그인도 아니면 섹션을 통째로 숨긴다(빈 헤더만 남지 않게).
  if (!hasAnything && !account) return null;

  const coversFor = (ids: string[]) =>
    ids.map((id) => coverOf.get(id)).filter((u): u is string => Boolean(u));

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(t('playlist.deleteConfirm', { name }))) {
      deletePlaylist.mutate(id);
    }
  };

  /** 묶음 수정 — 저장된 세트가 아니므로 빌더에 책 목록을 실어 보낸다. */
  const editBundle = (bookIds: string[], name: string) => {
    const q = new URLSearchParams({ books: bookIds.join(','), name, lang: i18n.language });
    navigate(`/continuous/new?${q.toString()}`);
  };

  return (
    <section className="mb-8">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="group flex w-full items-center gap-3 rounded-2xl border-2 border-coral-200 bg-gradient-to-r from-coral-100 via-peach-100 to-peach-200 px-4 py-3 shadow-pop transition hover:border-coral-400 hover:brightness-[1.02] active:scale-[0.99]"
      >
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-coral-500 text-2xl shadow-pop"
          aria-hidden
        >
          🎬
        </span>
        <span className="min-w-0 text-left">
          <span className="flex items-center gap-2">
            <span className="text-lg font-black text-ink-900 font-display break-keep">
              {t('playlist.title')}
            </span>
          </span>
          <span className="block text-xs font-bold text-ink-500 break-keep">
            {t('playlist.subtitle')}
          </span>
        </span>
        <span
          aria-hidden
          className="ml-auto shrink-0 text-lg font-black text-coral-500 transition group-hover:translate-x-0.5"
        >
          {open ? '▾' : '▸'}
        </span>
      </button>

      {open && (
        <>
          {/* 카테고리 묶음 — 게스트·로그인 동일 */}
          {bundles.length > 0 && (
            <div className="mt-3 flex gap-4 overflow-x-auto pb-2">
              {bundles.map((bundle) => {
                const name = catLabel(bundle.category);
                return (
                  <div key={bundle.category} className="w-64 shrink-0">
                    <PlaylistCard
                      name={name}
                      bookCount={bundle.bookIds.length}
                      language={i18n.language}
                      coverUrls={coversFor(bundle.bookIds)}
                      onPlay={() => beginPlaylist(bundle.bookIds, i18n.language, navigate)}
                      onEdit={() => editBundle(bundle.bookIds, name)}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* 내가 만든 세트 — 로그인 사용자만 */}
          {account && (
            <>
              <div className="mb-2 mt-5 flex items-center justify-between">
                <h3 className="text-sm font-black text-ink-700 break-keep">
                  {t('playlist.mySets')}
                </h3>
                <button
                  type="button"
                  onClick={() => navigate('/continuous/new')}
                  className="text-sm font-black text-coral-600 hover:text-coral-700 transition"
                >
                  {t('playlist.newSet')}
                </button>
              </div>

              {mySets.length === 0 ? (
                <button
                  type="button"
                  onClick={() => navigate('/continuous/new')}
                  className="w-full flex items-center gap-4 rounded-2xl border-2 border-dashed border-coral-200 bg-coral-100/50 px-5 py-4 text-left hover:border-coral-400 hover:bg-coral-100 transition"
                >
                  <span className="text-3xl shrink-0" aria-hidden>
                    🎬
                  </span>
                  <span className="min-w-0">
                    <span className="block text-base font-black text-ink-900 break-keep">
                      {t('playlist.createTitle')}
                    </span>
                    <span className="block text-sm text-ink-500 break-keep">
                      {t('playlist.createSubtitle')}
                    </span>
                  </span>
                  <span className="ml-auto text-2xl text-coral-500 shrink-0" aria-hidden>
                    +
                  </span>
                </button>
              ) : (
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {mySets.map((p) => (
                    <div key={p.id} className="w-64 shrink-0">
                      <PlaylistCard
                        name={p.name}
                        bookCount={p.bookIds.length}
                        language={p.language}
                        coverUrls={coversFor(p.bookIds)}
                        onPlay={() => beginPlaylist(p.bookIds, p.language, navigate)}
                        onEdit={() => navigate(`/continuous/edit/${p.id}`)}
                        onDelete={() => handleDelete(p.id, p.name)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}
