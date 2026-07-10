import { useMemo } from 'react';
import type { Lang, LearningEvent, StorybookSummary } from '@tangobook/shared';
import { STYLE_GENRES, useStyleGenreLabel } from '@/lib/art-style-genre';
import { groupByGenre } from '../lib/aggregate';
import { ReportEmptyState } from './ReportEmptyState';

interface Props {
  events: LearningEvent[];
  storybooks: StorybookSummary[];
  lang: Lang;
  /** true 면 카드 chrome 없이 리스트만 (<details> 안처럼 제목이 밖에 있을 때) */
  bare?: boolean;
}

const GENRE_LABELS = new Set<string>(STYLE_GENRES.map((g) => g.label));
const GENRE_EMOJI: Record<string, string> = {
  수채동화풍: '🎨',
  '페이퍼 3D 아트': '🧩',
  콜라주: '✂️',
};

/**
 * 선호 그림체 — **메인 3종 장르**(수채동화풍/페이퍼 3D 아트/콜라주)로만 집계, 장르명 노출.
 * styleId → 장르 변환은 useStyleGenreLabel(수동 맵 + 프롬프트 분류). 3종에 안 맞는 스타일은 제외.
 */
export function ArtStyleGenreCard({ events, storybooks, lang, bare = false }: Props) {
  const labelOf = useStyleGenreLabel();

  const rows = useMemo(() => {
    const byId = new Map<string, { artStyle?: string }>();
    for (const s of storybooks) byId.set(s.id, { artStyle: s.artStyle });
    const resolveGenre = (rawStyle: string): string | null => {
      const g = labelOf(rawStyle, 0);
      return GENRE_LABELS.has(g) ? g : null;
    };
    const stats = groupByGenre(events, byId, resolveGenre, lang);
    const total = stats.reduce((acc, r) => acc + r.pageReads, 0);
    return stats.map((r) => ({
      ...r,
      pct: total === 0 ? 0 : Math.round((r.pageReads / total) * 100),
      emoji: GENRE_EMOJI[r.genre] ?? '🎨',
    }));
  }, [events, storybooks, lang, labelOf]);

  const body =
    rows.length === 0 ? (
      <ReportEmptyState emoji="🎨" message="아직 읽은 책이 없어요" />
    ) : (
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.genre} className="flex items-center gap-3 text-sm">
            <span className="w-6 shrink-0 text-center text-base">{r.emoji}</span>
            <span className="w-24 shrink-0 truncate font-semibold text-ink-700">{r.genre}</span>
            <div className="flex-1">
              <div className="relative h-2.5 overflow-hidden rounded-full bg-ink-100">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-coral-500"
                  style={{ width: `${Math.max(r.pct, 4)}%` }}
                />
              </div>
            </div>
            <span className="w-16 shrink-0 text-right text-xs text-ink-500">
              {r.distinctBooks}권 · {r.pct}%
            </span>
          </li>
        ))}
      </ul>
    );

  if (bare) return body;

  return (
    <div className="rounded-2xl bg-white/80 p-4 shadow-sm">
      <h3 className="mb-3 text-base font-bold">이런 그림체를 좋아해요</h3>
      {body}
    </div>
  );
}
