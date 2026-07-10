import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SUPPORTED_LANGUAGES } from '@tangobook/shared';
import {
  STYLE_GENRES,
  classifyGenre,
  useStyleGenreMap,
  type StyleGenreSlug,
} from '@/lib/art-style-genre';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useStorybooks } from '@/features/storybook';
import { beginPlaylist } from '../lib/begin-playlist';
import { useCreatePlaylist } from '../hooks/usePlaylists';
import { BookMultiSelectGrid } from '../components/BookMultiSelectGrid';

const GENRE_SLUG_LABEL: Record<string, string> = Object.fromEntries(
  STYLE_GENRES.map((g) => [g.slug, g.label])
);

/**
 * 세트 만들기 — 책 다중 선택 + 순서 조정 + 언어 선택.
 * [지금 재생] = store.setQueue → /continuous/play.
 * [세트 저장] = useCreatePlaylist → /continuous (게스트는 숨김).
 */
export default function ContinuousBuilder() {
  const navigate = useNavigate();
  const { account } = useAuth();
  const { data: books } = useStorybooks();
  const { map: styleGenreMap } = useStyleGenreMap();
  const createPlaylist = useCreatePlaylist();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [language, setLanguage] = useState('ko');
  const [name, setName] = useState('');
  const [search, setSearch] = useState('');
  // 표지 미리보기 그림풍 (메인 라이브러리와 동일 기본값). 재생은 각 책 대표 그림체 유지.
  const [styleGenre, setStyleGenre] = useState<StyleGenreSlug>('watercolor');

  // 연속재생은 한국어·영어만 (나레이션·자막 지원 언어).
  const playlistLangs = SUPPORTED_LANGUAGES.filter((l) => l.code === 'ko' || l.code === 'en');

  const isGuest = !account?.id;

  const titleOf = (id: string) => (books ?? []).find((b) => b.id === id)?.title ?? id;

  // 선택한 책의 표지(선택 그림풍 우선) + 그림체 장르명. (없으면 대표 표지/장르)
  const coverGenreOf = (id: string): { cover?: string; genre?: string } => {
    const b = (books ?? []).find((x) => x.id === id) as
      | { coverImage?: string; artStyle?: string; coversByStyle?: Record<string, string> }
      | undefined;
    if (!b) return {};
    const cbs = b.coversByStyle;
    // 1) 현재 선택 그림풍을 이 책이 가지고 있으면 그 표지·장르
    if (styleGenre && cbs) {
      for (const [styleId, url] of Object.entries(cbs)) {
        if (url && styleGenreMap[styleId] === styleGenre) {
          return { cover: url, genre: GENRE_SLUG_LABEL[styleGenre] };
        }
      }
    }
    // 2) 폴백 — 대표 표지 + 대표 장르(맵 우선, 없으면 프롬프트 분류)
    let genre: string | undefined;
    if (cbs) {
      for (const styleId of Object.keys(cbs)) {
        const slug = styleGenreMap[styleId];
        if (slug && GENRE_SLUG_LABEL[slug]) {
          genre = GENRE_SLUG_LABEL[slug];
          break;
        }
      }
    }
    if (!genre) genre = classifyGenre(b.artStyle, b.artStyle) ?? undefined;
    return { cover: b.coverImage, genre };
  };

  const toggle = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const move = (idx: number, dir: -1 | 1) =>
    setSelectedIds((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });

  const playNow = () => {
    beginPlaylist(selectedIds, language, navigate);
  };

  const save = async () => {
    if (isGuest || selectedIds.length === 0 || !account?.id) return;
    const finalName = name.trim() || `내 세트 (${selectedIds.length}권)`;
    await createPlaylist.mutateAsync({
      accountId: account.id,
      name: finalName,
      bookIds: selectedIds,
      language,
    });
    navigate('/continuous');
  };

  const canSubmit = selectedIds.length > 0;

  return (
    // AppShell 헤더(h-16 md:h-20) 아래 뷰포트를 꽉 채우는 flex 컬럼 → 상단(헤더·선택·언어·검색)은
    // 고정, 책 그리드만 내부 스크롤. (AppShell main 이 window 스크롤이라 position:sticky 가 안 먹음.)
    <div className="flex h-[calc(100dvh-4rem)] flex-col bg-gradient-to-b from-cream-50 to-peach-100 md:h-[calc(100dvh-5rem)]">
      <div className="mx-auto flex min-h-0 w-full max-w-[1200px] flex-1 flex-col px-6 pt-5 md:px-8">
        <header className="mb-4 flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/library')}
              aria-label="뒤로"
              className="w-10 h-10 rounded-full bg-white shadow-soft flex items-center justify-center font-black text-ink-600 hover:bg-ink-50 transition"
            >
              ←
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-ink-900 font-display">
                세트 만들기
              </h1>
              <p className="text-ink-500 font-bold text-sm">읽을 책을 순서대로 골라주세요</p>
            </div>
          </div>

          {/* 액션 — 세트 이름 + 지금 재생 + 세트 저장 (하단 바에서 헤더 우측으로 이동) */}
          <div className="flex flex-wrap items-center gap-2">
            {!isGuest && (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="세트 이름 (예: 잠자리 동화)"
                className="min-w-0 flex-1 rounded-xl border-2 border-ink-100 bg-white px-3 py-2 text-sm font-bold text-ink-900 outline-none focus:border-coral-400 sm:w-44 sm:flex-none"
              />
            )}
            <button
              type="button"
              onClick={playNow}
              disabled={!canSubmit}
              className="rounded-xl bg-coral-500 px-4 py-2 text-sm font-black text-white shadow-soft transition hover:bg-coral-600 active:scale-95 disabled:opacity-40"
            >
              ▶ 지금 재생
            </button>
            {!isGuest && (
              <button
                type="button"
                onClick={save}
                disabled={!canSubmit || createPlaylist.isPending}
                className="rounded-xl bg-mint-500 px-4 py-2 text-sm font-black text-white shadow-soft transition hover:bg-mint-600 active:scale-95 disabled:opacity-40"
              >
                {createPlaylist.isPending ? '저장 중…' : '💾 세트 저장'}
              </button>
            )}
          </div>
        </header>

        {/* 선택된 책 — 순서 조정 (많이 담아도 상단이 안 커지게 max-h + 내부 스크롤) */}
        {selectedIds.length > 0 && (
          <div className="mb-4 max-h-[28vh] shrink-0 overflow-y-auto rounded-2xl bg-white p-4 shadow-soft">
            <h2 className="font-black text-ink-900 mb-2">선택한 책 ({selectedIds.length})</h2>
            <ol className="space-y-1.5">
              {selectedIds.map((id, i) => {
                const { cover, genre } = coverGenreOf(id);
                return (
                  <li
                    key={id}
                    className="flex items-center gap-2 rounded-xl bg-peach-50 px-2.5 py-1.5"
                  >
                    <span className="w-6 h-6 rounded-full bg-coral-500 text-white text-sm font-black flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    {cover ? (
                      <img
                        src={cover}
                        alt=""
                        loading="lazy"
                        className="h-8 w-12 shrink-0 rounded-md object-cover shadow-soft"
                      />
                    ) : (
                      <span className="flex h-8 w-12 shrink-0 items-center justify-center rounded-md bg-peach-200 text-sm">
                        📖
                      </span>
                    )}
                    <span className="min-w-0 flex-1 truncate break-keep font-bold text-ink-800">
                      {titleOf(id)}
                    </span>
                    {genre && (
                      <span className="hidden shrink-0 rounded-full bg-peach-200 px-2 py-0.5 text-[11px] font-bold text-ink-600 sm:inline">
                        🎨 {genre}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      aria-label="위로"
                      className="w-8 h-8 rounded-lg bg-white shadow-soft font-black text-ink-600 disabled:opacity-30 hover:bg-ink-50 transition"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => move(i, 1)}
                      disabled={i === selectedIds.length - 1}
                      aria-label="아래로"
                      className="w-8 h-8 rounded-lg bg-white shadow-soft font-black text-ink-600 disabled:opacity-30 hover:bg-ink-50 transition"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => toggle(id)}
                      aria-label="빼기"
                      className="w-8 h-8 rounded-lg bg-white shadow-soft font-black text-ink-500 hover:text-red-500 transition"
                    >
                      ✕
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        {/* 상단 고정 영역 — 언어 + 검색 (책 그리드만 아래에서 스크롤) */}
        <div className="mb-3 shrink-0">
          {/* 언어 — 한국어·영어만 */}
          <div className="mb-2.5 flex flex-wrap items-center gap-2">
            <span className="mr-1 font-black text-ink-900">언어</span>
            {playlistLangs.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => setLanguage(l.code)}
                className={
                  'rounded-full px-4 py-1.5 font-bold text-sm transition ' +
                  (language === l.code
                    ? 'bg-coral-500 text-white shadow-soft'
                    : 'bg-white text-ink-600 shadow-soft hover:bg-ink-50')
                }
              >
                {l.flag} {l.nativeName}
              </button>
            ))}
          </div>

          {/* 그림체 고르기(그림풍) + 검색 */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-black text-ink-900">그림체 고르기</h2>
              {/* 그림풍 — 표지 미리보기만 (세계명작 표지가 이 그림풍으로 swap, 나머지는 대표 표지) */}
              <select
                value={styleGenre}
                onChange={(e) => setStyleGenre(e.target.value as StyleGenreSlug)}
                aria-label="그림풍"
                className="rounded-full border-2 border-ink-100 bg-white px-3 py-1.5 text-sm font-bold text-ink-700 outline-none focus:border-coral-400"
              >
                {STYLE_GENRES.map((g) => (
                  <option key={g.slug} value={g.slug}>
                    🎨 {g.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative w-full sm:max-w-xs">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">
                🔍
              </span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="책 제목·카테고리 검색"
                className="w-full rounded-full border-2 border-ink-100 bg-white py-2 pl-9 pr-4 text-sm font-bold text-ink-900 outline-none focus:border-coral-400"
              />
            </div>
          </div>
        </div>

        {/* 책 그리드 — 유일한 스크롤 영역 */}
        <div className="-mx-6 min-h-0 flex-1 overflow-y-auto px-6 pb-4 md:-mx-8 md:px-8">
          <BookMultiSelectGrid
            selectedIds={selectedIds}
            onToggle={toggle}
            search={search}
            styleGenre={styleGenre}
          />
        </div>
      </div>
    </div>
  );
}
