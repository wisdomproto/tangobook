import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useStorybooks } from '@/features/storybook';
import { usePlaylists, useDeletePlaylist } from '../hooks/usePlaylists';
import { beginPlaylist } from '../lib/begin-playlist';
import { PlaylistCard } from './PlaylistCard';

/**
 * "나의 재생 목록" 섹션 — LibraryPage 내 카테고리 섹션 바로 위에 삽입.
 *
 * Render policy (2026-07-07 — 연속재생의 1차 진입점을 사이드바에서 이 섹션으로 이전):
 *   - guest (account=null) → null (hidden)
 *   - loading → null (hidden)
 *   - 0 playlists → 섹션 헤더 + "이어재생 만들기" CTA 카드 (부모가 첫 세트를 만드는 경로)
 *   - ≥1 playlists → header + horizontal card row (+ "새 세트" 헤더 버튼)
 *
 * 헤더는 접기/펴기 토글 — 기본 접힘(2026-07-08). 부모용 보조 기능이라 기본은 접어 라이브러리
 * 첫 화면을 동화책 위주로 유지.
 */
export function PlaylistLibrarySection() {
  const navigate = useNavigate();
  const { account } = useAuth();
  const { data: playlists, isLoading } = usePlaylists();
  const { data: books } = useStorybooks();
  const deletePlaylist = useDeletePlaylist();
  const [open, setOpen] = useState(false); // default 접힘

  const coverOf = useMemo(() => {
    const m = new Map<string, string>();
    (books ?? []).forEach((b) => {
      if (b.coverImage) m.set(b.id, b.coverImage);
    });
    return m;
  }, [books]);

  // Hidden for guests + while loading
  if (!account) return null;
  if (isLoading) return null;

  const list = playlists ?? [];
  const isEmpty = list.length === 0;

  const handlePlay = (bookIds: string[], language: string) => {
    beginPlaylist(bookIds, language, navigate);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`"${name}" 세트를 삭제할까요?`)) {
      deletePlaylist.mutate(id);
    }
  };

  return (
    <section className="mb-8">
      {/* 섹션 헤더 — 클릭 시 접기/펴기 토글 */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex items-center gap-2 text-xl font-black text-ink-900 font-display hover:text-coral-600 transition"
        >
          <span>🎬 나의 재생 목록</span>
          {!isEmpty && <span className="text-sm text-ink-400 font-black">{list.length}</span>}
          <span aria-hidden className="text-base text-ink-400">
            {open ? '▾' : '▸'}
          </span>
        </button>
        {open && !isEmpty && (
          <button
            type="button"
            onClick={() => navigate('/continuous/new')}
            className="text-sm font-black text-coral-600 hover:text-coral-700 transition"
          >
            + 새 세트
          </button>
        )}
      </div>

      {/* 펼쳤을 때만 본문 — 빈 상태 CTA / 카드 행 */}
      {!open ? null : isEmpty ? (
        <button
          type="button"
          onClick={() => navigate('/continuous/new')}
          className="w-full flex items-center gap-4 rounded-2xl border-2 border-dashed border-coral-300 bg-coral-50/60 px-5 py-4 text-left hover:border-coral-400 hover:bg-coral-50 transition"
        >
          <span className="text-3xl shrink-0" aria-hidden>
            🎬
          </span>
          <span className="min-w-0">
            <span className="block text-base font-black text-ink-900 break-keep">
              이어재생 만들기
            </span>
            <span className="block text-sm text-ink-500 break-keep">
              여러 권을 골라 잠자리에 연달아 들려주세요
            </span>
          </span>
          <span className="ml-auto text-2xl text-coral-500 shrink-0" aria-hidden>
            +
          </span>
        </button>
      ) : (
        /* 카드 행 — 가로 스크롤 */
        <div className="flex gap-4 overflow-x-auto pb-2">
          {list.map((p) => (
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
      )}
    </section>
  );
}
