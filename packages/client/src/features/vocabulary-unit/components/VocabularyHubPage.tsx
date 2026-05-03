import { useNavigate, Link } from 'react-router-dom';
import { useMemo } from 'react';
import type { VocabularyUnitSummary } from '@tangobook/shared';
import { Mascot, Skeleton, AppIcon } from '@/design-system';
import { StarCounter } from '@/features/rewards';
import { useVocabularyUnits } from '../hooks/useVocabularyUnits';
import { getCambridgeTopicIcon } from '../lib/cambridge-icon-map';

/** Cambridge 토픽 매칭되면 AppIcon, 아니면 emoji 폴백 */
function UnitIcon({ topicId, emoji, label }: { topicId?: string; emoji?: string; label: string }) {
  const src = getCambridgeTopicIcon(topicId);
  if (src) return <AppIcon src={src} size={88} alt={label} />;
  return <div className="text-6xl">{emoji ?? '✨'}</div>;
}

interface UnitCardProps {
  unit: VocabularyUnitSummary;
  onClick: () => void;
}

function UnitCard({ unit, onClick }: UnitCardProps) {
  const isStorybook = unit.source === 'storybook';
  return (
    <button
      onClick={onClick}
      className="aspect-[3/4] rounded-2xl bg-white shadow-soft border-2 border-amber-200 overflow-hidden hover:shadow-pop hover:-translate-y-1 transition-all flex flex-col items-center"
    >
      {/* 아이콘 영역 */}
      <div className="flex-1 w-full flex items-center justify-center p-3 bg-gradient-to-b from-amber-50 to-white">
        {isStorybook && unit.coverImage ? (
          <img
            src={unit.coverImage}
            alt={unit.nameKo}
            className="w-full h-full object-cover rounded-lg"
            loading="lazy"
          />
        ) : (
          <UnitIcon topicId={unit.topicId} emoji={unit.emoji} label={unit.nameKo} />
        )}
      </div>
      {/* 라벨 영역 */}
      <div className="w-full p-2 sm:p-3 flex flex-col items-center gap-1 bg-white">
        <div className="text-sm sm:text-base font-black text-ink-900 font-display text-center line-clamp-2 leading-tight">
          {unit.nameKo}
        </div>
        {unit.nameEn && <div className="text-xs text-ink-500 font-bold">{unit.nameEn}</div>}
        <div className="flex items-center gap-1">
          {isStorybook ? (
            <span className="px-2 py-0.5 rounded-full bg-coral-100 text-coral-700 text-xs font-black">
              📖 동화
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-black">
              {unit.wordCount}단어
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

interface SectionProps {
  title: string;
  emoji: string;
  units: VocabularyUnitSummary[];
  onClickUnit: (id: string) => void;
}

function Section({ title, emoji, units, onClickUnit }: SectionProps) {
  if (units.length === 0) return null;
  return (
    <section className="mb-8">
      <h2 className="text-xl md:text-2xl font-black font-display text-ink-900 mb-3 flex items-center gap-2">
        <span>{emoji}</span>
        <span>{title}</span>
        <span className="text-sm font-bold text-ink-400">({units.length})</span>
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {units.map((u) => (
          <UnitCard key={u.id} unit={u} onClick={() => onClickUnit(u.id)} />
        ))}
      </div>
    </section>
  );
}

/** 학습자 어휘 학습 허브 — Cambridge 토픽 + 동화 단원 (책별, 카테고리 그룹화) + Custom */
export function VocabularyHubPage() {
  const navigate = useNavigate();
  const { data: units, isLoading } = useVocabularyUnits();

  const grouped = useMemo(() => {
    const publicUnits = (units ?? []).filter((u) => u.isPublic);
    const cambridge = publicUnits.filter((u) => u.source === 'cambridge-starters');
    const custom = publicUnits.filter((u) => u.source === 'custom');
    const storybook = publicUnits.filter((u) => u.source === 'storybook');

    // 동화 단원: folder(category)별 그룹
    const storybookByCategory = new Map<string, VocabularyUnitSummary[]>();
    for (const u of storybook) {
      const cat = u.folder ?? '기타';
      const arr = storybookByCategory.get(cat) ?? [];
      arr.push(u);
      storybookByCategory.set(cat, arr);
    }
    // 카테고리 정렬: 명작/생활동화/자연관찰/한국전래... 우선, 나머지 알파
    const PRIORITY = ['세계 명작', '명작동화', '생활동화', '자연관찰', '한국 전래', '전래동화'];
    const orderedCats = Array.from(storybookByCategory.keys()).sort((a, b) => {
      const ai = PRIORITY.findIndex((p) => a.includes(p));
      const bi = PRIORITY.findIndex((p) => b.includes(p));
      const aIdx = ai === -1 ? 999 : ai;
      const bIdx = bi === -1 ? 999 : bi;
      if (aIdx !== bIdx) return aIdx - bIdx;
      return a.localeCompare(b, 'ko');
    });

    return {
      cambridge,
      custom,
      storybookGroups: orderedCats.map((cat) => ({ cat, units: storybookByCategory.get(cat)! })),
    };
  }, [units]);

  const totalCount =
    grouped.cambridge.length +
    grouped.custom.length +
    grouped.storybookGroups.reduce((s, g) => s + g.units.length, 0);

  const handleClickUnit = (id: string) => navigate(`/vocabulary/${id}`);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-yellow-50 to-cream-50">
      {/* 헤더 */}
      <header className="px-6 pt-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/library')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-soft text-ink-700 font-bold hover:shadow-pop transition"
          >
            ← 돌아가기
          </button>
          <div className="flex items-center gap-2">
            <StarCounter />
            <Link
              to="/library"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-soft text-ink-700 font-bold hover:shadow-pop transition"
            >
              🏠 홈
            </Link>
          </div>
        </div>
        <div className="text-center">
          <div className="inline-flex items-center gap-3 mb-2">
            <Mascot state="reading" size="md" />
            <h1 className="text-3xl md:text-4xl font-black font-display text-ink-900">
              어휘 마스터
            </h1>
          </div>
          <p className="text-ink-700 font-bold">토픽별로 + 책별로 단어를 익혀요!</p>
        </div>
      </header>

      <main className="px-6 pb-12 mt-6 max-w-5xl mx-auto">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
            ))}
          </div>
        ) : totalCount === 0 ? (
          <div className="text-center py-16 text-ink-500">
            <p className="text-lg font-bold">아직 공개된 어휘 단원이 없어요</p>
            <p className="text-sm mt-1">곧 만나요!</p>
          </div>
        ) : (
          <>
            <Section
              title="Cambridge 토픽"
              emoji="📚"
              units={grouped.cambridge}
              onClickUnit={handleClickUnit}
            />
            {grouped.storybookGroups.map((g) => (
              <Section
                key={g.cat}
                title={g.cat}
                emoji="📖"
                units={g.units}
                onClickUnit={handleClickUnit}
              />
            ))}
            <Section
              title="내 단원"
              emoji="🎨"
              units={grouped.custom}
              onClickUnit={handleClickUnit}
            />
          </>
        )}
      </main>
    </div>
  );
}
