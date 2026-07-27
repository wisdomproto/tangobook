import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useStorybooks } from '@/features/storybook';
import { useCategoryLabel } from '@/features/library/lib/category-i18n';
import { usePlaylists, useDeletePlaylist } from '../hooks/usePlaylists';
import { buildCategoryBundles } from '../lib/category-bundles';
import { estimatePlaySeconds, playtimeParts } from '../lib/playtime';
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
 *   - 내 세트와 카테고리 묶음은 **한 행에 함께** 흐른다: +만들기 카드(맨 앞, 로그인만) → 내 세트 → 묶음.
 *   - 기본 펼침(2026-07-27) — 묶음이 카테고리 통째가 되면서 첫 화면에 보일 값이 생겼다.
 *     (접힘 ↔ 펼침이 두 번 뒤집힌 자리다. 되돌리기 전에 묶음 크기부터 볼 것.)
 */
export function PlaylistLibrarySection() {
  const { t, i18n } = useTranslation('library');
  const navigate = useNavigate();
  const { account } = useAuth();
  const { data: playlists, isLoading: playlistsLoading } = usePlaylists();
  const { data: books } = useStorybooks();
  const deletePlaylist = useDeletePlaylist();
  const catLabel = useCategoryLabel();
  // 🔴 기본 펼침(2026-07-27). 접어뒀던 건 묶음이 3권짜리라 자리값을 못 했기 때문인데,
  //    이제 카테고리 통째(최대 48권·2시간 35분)라 책 목록보다 먼저 보일 값이 있다.
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

  /** "약 2시간 35분" — 시간이 0이면 분만, 분이 0이면 시간만 말한다. */
  const durationOf = (bookCount: number) => {
    const { hours, minutes } = playtimeParts(estimatePlaySeconds(bookCount));
    if (!hours) return t('playlist.durationM', { minutes });
    if (!minutes) return t('playlist.durationH', { hours });
    return t('playlist.durationHm', { hours, minutes });
  };

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
    // 펼치면 헤더가 리스트까지 감싸는 하나의 박스가 된다 (테두리·배경을 컨테이너로 이동)
    <section className="mb-8 rounded-2xl border-2 border-coral-200 bg-gradient-to-r from-coral-100 via-peach-100 to-peach-200 shadow-pop transition hover:border-coral-400">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="group flex w-full items-center gap-3 rounded-2xl px-4 py-3 transition hover:brightness-[1.02] active:scale-[0.99]"
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
        // 한 행 통합 (2026-07-24): + 만들기 카드(맨 앞) → 내 세트 → 카테고리 묶음
        <div className="flex items-stretch gap-4 overflow-x-auto px-4 pb-4 pt-1">
          {account && (
            <button
              type="button"
              onClick={() => navigate('/continuous/new')}
              className="w-64 shrink-0 flex flex-col items-center justify-center gap-2 rounded-3xl bg-coral-500 px-5 py-6 text-center shadow-pop transition hover:bg-coral-600 active:scale-[0.98]"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/25 text-3xl font-black text-white">
                +
              </span>
              <span className="text-lg font-black text-white font-display break-keep">
                {t('playlist.createTitle')}
              </span>
              <span className="text-sm font-bold text-white/85 break-keep">
                {t('playlist.createSubtitle')}
              </span>
            </button>
          )}
          {mySets.map((p) => (
            <div key={p.id} className="w-64 shrink-0">
              <PlaylistCard
                name={p.name}
                bookCount={p.bookIds.length}
                durationLabel={durationOf(p.bookIds.length)}
                language={p.language}
                coverUrls={coversFor(p.bookIds)}
                onPlay={() => beginPlaylist(p.bookIds, p.language, navigate)}
                onEdit={() => navigate(`/continuous/edit/${p.id}`)}
                onDelete={() => handleDelete(p.id, p.name)}
              />
            </div>
          ))}
          {bundles.map((bundle) => {
            const name = catLabel(bundle.category);
            return (
              <div key={bundle.category} className="w-64 shrink-0">
                <PlaylistCard
                  name={name}
                  bookCount={bundle.bookIds.length}
                  durationLabel={durationOf(bundle.bookIds.length)}
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
    </section>
  );
}
