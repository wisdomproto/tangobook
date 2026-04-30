import { useMemo } from 'react';
import { useStorybook } from '@/features/storybook';
import { Spinner } from '@/components/Spinner';
import type { Storybook, ReadingLevel } from '@tangobook/shared';
import { ART_STYLES } from '@tangobook/shared';

const LEVEL_INFO: Record<ReadingLevel, { label: string; age: string; emoji: string }> = {
  L1: { label: '씨앗', age: '3~4세', emoji: '📗' },
  L2: { label: '새싹', age: '4~6세', emoji: '📘' },
  L3: { label: '나무', age: '6~7세', emoji: '📙' },
};
const LEVEL_ORDER: ReadingLevel[] = ['L1', 'L2', 'L3'];

export interface MetaVariantEntry {
  id: string;
  level: ReadingLevel;
  isBase: boolean;
}

interface MetaViewProps {
  baseId: string;
  variants: MetaVariantEntry[];
  onSelectVariant: (id: string) => void;
  onAddLevel: (lv: ReadingLevel) => void;
}

/**
 * 메타 뷰 — 책 전체 종합 정보. 레벨/그림체 variant 와 무관, 책 단위 공통.
 * - 책 정보 요약 (제목/카테고리/폴더/공개여부, base 책 기준)
 * - 부모님 가이드 (개요·교훈·읽어주는 팁)
 * - Variant overview: 각 레벨별 카드 (페이지수·그림체·표지)
 * - 통계: 총 페이지수, 캐릭터수, 핵심단어수 등
 *
 * 편집은 base 책의 데이터 기준. broadcast 동기화는 후속 작업.
 */
export function MetaView({ baseId, variants, onSelectVariant, onAddLevel }: MetaViewProps) {
  // base 책 우선 — 없으면 첫 variant
  const targetId = variants.find((v) => v.isBase)?.id ?? variants[0]?.id ?? baseId;
  const { data: base, isLoading } = useStorybook(targetId);

  if (isLoading) return <Spinner size="lg" className="mt-20" />;
  if (!base) {
    return <div className="p-8 text-center text-slate-500">책 데이터를 불러올 수 없습니다.</div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <BookHeader storybook={base} variants={variants} />
      <VariantOverview
        variants={variants}
        onSelectVariant={onSelectVariant}
        onAddLevel={onAddLevel}
      />
      <ParentGuideSection storybook={base} />
      <BookSummarySection variants={variants} />
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// 책 헤더 — 표지·제목·카테고리·폴더
// ────────────────────────────────────────────────────────────────────────────

function BookHeader({
  storybook,
  variants,
}: {
  storybook: Storybook;
  variants: MetaVariantEntry[];
}) {
  return (
    <section className="flex gap-6 bg-white dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
      {storybook.coverImage ? (
        <img
          src={storybook.coverImage}
          alt={storybook.title}
          className="w-40 h-40 object-cover rounded-md shrink-0 bg-slate-100"
        />
      ) : (
        <div className="w-40 h-40 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-5xl shrink-0">
          📚
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1 font-bold">
          <span>📋 메타</span>
          <span className="opacity-60">·</span>
          <span>책 종합 정보</span>
        </div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 mb-2">
          {storybook.title.replace(/\s*\(L[1-4]\)\s*$/, '')}
        </h2>
        <div className="flex flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-400">
          {storybook.category && (
            <span className="px-2 py-1 bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded font-bold">
              📂 {storybook.category}
            </span>
          )}
          {storybook.folder && (
            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">
              📁 {storybook.folder}
            </span>
          )}
          <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">
            {storybook.isPublic ? '🌐 공개' : '🔒 비공개'}
          </span>
          <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">
            🎨 변형 {variants.length}개 ({variants.map((v) => v.level).join(' · ')})
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-3 leading-relaxed">
          ※ 메타 정보는 책 전체 공통입니다. 레벨별 변경은 각 레벨 탭에서 진행하세요.
        </p>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Variant overview — 각 레벨 카드
// ────────────────────────────────────────────────────────────────────────────

function VariantOverview({
  variants,
  onSelectVariant,
  onAddLevel,
}: {
  variants: MetaVariantEntry[];
  onSelectVariant: (id: string) => void;
  onAddLevel: (lv: ReadingLevel) => void;
}) {
  const existing = new Set(variants.map((v) => v.level));
  const missing = LEVEL_ORDER.filter((lv) => !existing.has(lv));

  return (
    <section className="space-y-3">
      <h3 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
        📚 레벨별 variant
        <span className="text-xs font-normal text-slate-500">
          ({variants.length}개 · {LEVEL_ORDER.length - missing.length}/{LEVEL_ORDER.length})
        </span>
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {LEVEL_ORDER.map((lv) => {
          const variant = variants.find((v) => v.level === lv);
          const info = LEVEL_INFO[lv];
          if (variant) {
            return (
              <VariantCard
                key={lv}
                variantId={variant.id}
                level={lv}
                isBase={variant.isBase}
                onClick={() => onSelectVariant(variant.id)}
              />
            );
          }
          return (
            <button
              key={lv}
              onClick={() => onAddLevel(lv)}
              className="rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 p-4 text-left transition-colors group"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl opacity-30 group-hover:opacity-100">{info.emoji}</span>
                <span className="text-xs font-black text-slate-400 group-hover:text-emerald-600">
                  {lv} {info.label}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 group-hover:text-emerald-700 mb-2">
                {info.age}
              </div>
              <div className="text-xs text-emerald-600 font-bold opacity-0 group-hover:opacity-100">
                + 만들기
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function VariantCard({
  variantId,
  level,
  isBase,
  onClick,
}: {
  variantId: string;
  level: ReadingLevel;
  isBase: boolean;
  onClick: () => void;
}) {
  const { data } = useStorybook(variantId);
  const info = LEVEL_INFO[level];
  const stylePreset = data
    ? ART_STYLES.find((s) => s.prompt.toLowerCase() === data.artStyle.toLowerCase())
    : null;

  return (
    <button
      onClick={onClick}
      className="rounded-lg border border-slate-200 dark:border-slate-700 hover:border-violet-400 dark:hover:border-violet-500 bg-white dark:bg-slate-900 hover:shadow-md p-3 text-left transition-all group"
    >
      {data?.coverImage ? (
        <img
          src={data.coverImage}
          alt=""
          className="w-full aspect-square object-cover rounded mb-2 bg-slate-100"
          loading="lazy"
        />
      ) : (
        <div className="w-full aspect-square rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-4xl mb-2">
          {info.emoji}
        </div>
      )}
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-black text-slate-900 dark:text-slate-100">
          {info.emoji} {level} {info.label}
        </span>
        {isBase && (
          <span className="text-[9px] px-1 bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 rounded">
            base
          </span>
        )}
      </div>
      <div className="text-[10px] text-slate-500 mb-1">{info.age}</div>
      {data && (
        <div className="text-[10px] text-slate-400 truncate">
          📄 {data.pages?.length ?? 0}쪽 · 🎨 {stylePreset?.label ?? data.artStyle}
        </div>
      )}
    </button>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// 부모님 가이드
// ────────────────────────────────────────────────────────────────────────────

function ParentGuideSection({ storybook }: { storybook: Storybook }) {
  const guide = storybook.parentGuide;
  return (
    <section className="space-y-3">
      <h3 className="text-base font-black text-slate-800 dark:text-slate-100">🧭 부모님 가이드</h3>
      {!guide ? (
        <div className="rounded-lg border border-dashed border-slate-200 dark:border-slate-700 p-6 text-center">
          <p className="text-sm text-slate-400 mb-2">아직 부모님 가이드가 없습니다.</p>
          <p className="text-xs text-slate-500">
            (편집 UI 는 후속 — 현재는 base 책의 가이드만 읽기 전용으로 표시)
          </p>
        </div>
      ) : (
        <div className="space-y-3 bg-white dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          {guide.overview && (
            <div>
              <div className="text-xs font-bold text-slate-500 mb-1">📖 개요</div>
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                {guide.overview}
              </p>
            </div>
          )}
          {guide.lessons && guide.lessons.length > 0 && (
            <div>
              <div className="text-xs font-bold text-slate-500 mb-1">💡 교훈</div>
              <ul className="text-sm text-slate-700 dark:text-slate-200 space-y-1">
                {guide.lessons.map((l, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-violet-500 shrink-0">•</span>
                    <span>{l}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {guide.readingTips && guide.readingTips.length > 0 && (
            <div>
              <div className="text-xs font-bold text-slate-500 mb-1">🗣️ 읽어주는 팁</div>
              <ul className="text-sm text-slate-700 dark:text-slate-200 space-y-1">
                {guide.readingTips.map((t, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-emerald-500 shrink-0">•</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// 책 요약 — 모든 variant 의 합산 통계
// ────────────────────────────────────────────────────────────────────────────

function BookSummarySection({ variants }: { variants: MetaVariantEntry[] }) {
  return (
    <section className="space-y-3">
      <h3 className="text-base font-black text-slate-800 dark:text-slate-100">📊 컨텐츠 요약</h3>
      <SummaryGrid variants={variants} />
    </section>
  );
}

function SummaryGrid({ variants }: { variants: MetaVariantEntry[] }) {
  // 전체 variant 의 storybook 데이터를 모아서 통계
  // useStorybook 훅을 variant 마다 따로 호출하면 react-query 캐시에서 재사용됨
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {variants.map((v) => (
        <VariantSummaryCard key={v.id} variantId={v.id} level={v.level} />
      ))}
    </div>
  );
}

function VariantSummaryCard({ variantId, level }: { variantId: string; level: ReadingLevel }) {
  const { data } = useStorybook(variantId);
  const info = LEVEL_INFO[level];
  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
      <div className="text-xs font-black text-slate-700 dark:text-slate-200 mb-2">
        {info.emoji} {level}
      </div>
      <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
        <Stat label="페이지" value={data?.pages?.length ?? '—'} />
        <Stat label="캐릭터" value={data?.characters?.length ?? '—'} />
        <Stat
          label="핵심단어"
          value={
            useMemoCount(
              data,
              (d) =>
                (d as { key_objects?: unknown[] }).key_objects?.length ?? d.flashcards?.length ?? 0
            ) ?? '—'
          }
        />
        <Stat label="학습어휘" value={data?.educational_content?.vocabulary?.length ?? '—'} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex justify-between">
      <span className="opacity-60">{label}</span>
      <span className="font-bold tabular-nums">{value}</span>
    </div>
  );
}

function useMemoCount<T>(data: T | undefined, getter: (d: T) => number): number | null {
  return useMemo(() => (data ? getter(data) : null), [data, getter]);
}
