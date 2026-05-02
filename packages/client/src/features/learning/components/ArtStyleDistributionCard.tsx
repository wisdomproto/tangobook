import { useMemo } from 'react';
import { ART_STYLES } from '@tangobook/shared';
import type { Lang, LearningEvent, StorybookSummary } from '@tangobook/shared';
import { AppIcon } from '@/design-system';
import { groupByArtStyle } from '../lib/aggregate';
import { ReportEmptyState } from './ReportEmptyState';

interface Props {
  events: LearningEvent[];
  storybooks: StorybookSummary[];
  lang: Lang;
}

/** ART_STYLES.id → 한글 라벨 + 이모지 (UI 표시용) */
const STYLE_META: Record<string, { label: string; emoji: string }> = {
  photographic: { label: '실사', emoji: '📷' },
  watercolor: { label: '수채화', emoji: '🎨' },
  cartoon: { label: '카툰', emoji: '🎭' },
  traditional: { label: '전통 동화책', emoji: '📜' },
  animation: { label: '애니메이션', emoji: '✨' },
  'modern-illustration': { label: '현대 일러스트', emoji: '🖼️' },
  'oil-painting': { label: '유화', emoji: '🖌️' },
  'pencil-sketch': { label: '연필 스케치', emoji: '✏️' },
  'paper-craft': { label: '종이공예', emoji: '🧻' },
  'pixar-3d': { label: '3D 픽사', emoji: '🎬' },
};

export function getArtStyleLabel(rawStyle: string | undefined): string {
  if (!rawStyle) return '기타';
  // ART_STYLES.id 우선
  const byId = ART_STYLES.find((s) => s.id === rawStyle);
  if (byId) return byId.label;
  // 베이스 storybook.artStyle 은 prompt 형태로 들어올 수 있어 prompt 매칭
  const byPrompt = ART_STYLES.find((s) => s.prompt.toLowerCase() === rawStyle.toLowerCase());
  if (byPrompt) return byPrompt.label;
  return rawStyle.slice(0, 24);
}

export function getArtStyleEmoji(rawStyle: string | undefined): string {
  if (!rawStyle) return '🎨';
  const byId = ART_STYLES.find((s) => s.id === rawStyle);
  if (byId && STYLE_META[byId.id]) return STYLE_META[byId.id].emoji;
  const byPrompt = ART_STYLES.find((s) => s.prompt.toLowerCase() === rawStyle.toLowerCase());
  if (byPrompt && STYLE_META[byPrompt.id]) return STYLE_META[byPrompt.id].emoji;
  return '🎨';
}

export function ArtStyleDistributionCard({ events, storybooks, lang }: Props) {
  const stats = useMemo(() => {
    const byId = new Map<string, { artStyle?: string }>();
    for (const s of storybooks) byId.set(s.id, { artStyle: s.artStyle });
    // 부모 컴포넌트에서 nonPhonics 만 넘겨도, 기존 phonics-style 폴백을 위해 storybooks 전체도 시도해볼 수 있음 (현재는 storybooks prop 자체가 nonPhonics 일 수 있어 큰 영향 없음)
    return groupByArtStyle(events, byId, lang);
  }, [events, storybooks, lang]);

  const rows = useMemo(() => {
    const arr = [...stats.values()].sort((a, b) => b.pageReads - a.pageReads);
    const total = arr.reduce((acc, r) => acc + r.pageReads, 0);
    return arr.map((r) => ({
      ...r,
      pct: total === 0 ? 0 : Math.round((r.pageReads / total) * 100),
      label: getArtStyleLabel(r.style),
      emoji: getArtStyleEmoji(r.style),
    }));
  }, [stats]);

  return (
    <div className="rounded-2xl bg-white/80 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-base font-bold">
          <AppIcon src="section/art-style.png" size={22} alt="그림체" />
          <span>그림체 분포</span>
        </h3>
        {rows.length > 0 && <span className="text-xs text-ink-500">{rows.length}가지 그림체</span>}
      </div>
      {rows.length === 0 ? (
        <ReportEmptyState emoji="🎨" message="아직 읽은 책이 없어요" />
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.style} className="flex items-center gap-3 text-sm">
              <span className="w-6 shrink-0 text-center text-base">{r.emoji}</span>
              <span className="w-20 shrink-0 truncate font-semibold text-ink-700">{r.label}</span>
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
      )}
    </div>
  );
}
