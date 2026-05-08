import { useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { VocabularyUnitSummary } from '@tangobook/shared';
import { Mascot, Skeleton, AppIcon, Chip } from '@/design-system';
import { useVocabularyUnits } from '../hooks/useVocabularyUnits';
import { getCambridgeTopicIcon } from '../lib/cambridge-icon-map';

/** Cambridge 토픽 매칭되면 AppIcon, 아니면 emoji 폴백 */
function UnitIcon({ topicId, emoji, label }: { topicId?: string; emoji?: string; label: string }) {
  const src = getCambridgeTopicIcon(topicId);
  if (src) return <AppIcon src={src} size={88} alt={label} />;
  return <div className="text-6xl">{emoji ?? '✨'}</div>;
}

/**
 * 동화 카테고리(folder) → 아이콘 매핑. LibraryPage 와 동일 자산 재사용으로
 * 책 ↔ 어휘 단원 시각 일관성 유지. 어휘 단원의 folder 는 storybook.category 에서
 * derive 됨 (deriveStorybookUnit) → 두 곳 매핑이 일치해야 함.
 *
 * 실제 사용 중인 카테고리: '세계 명작', '명작동화', '생활동화', '자연관찰', '한국 전래', '전래동화'
 * (LibraryPage 의 카테고리와 표기가 일부 다른 건 storybook 데이터 raw value 그대로라 유지)
 */
const CATEGORY_ICON_MAP: Record<string, string> = {
  '세계 명작': 'category/adventure.png',
  명작동화: 'category/adventure.png',
  생활동화: 'category/family.png',
  '생활 동화': 'category/family.png',
  자연관찰: 'category/nature.png',
  '자연 관찰': 'category/nature.png',
  '한국 전래': 'category/emotion.png',
  전래동화: 'category/emotion.png',
  '전래 동화': 'category/emotion.png',
  기타: 'tab/storybook.svg',
};

const getCategoryIconNode = (cat: string, size = 20): ReactNode => {
  const path = CATEGORY_ICON_MAP[cat];
  if (path) return <AppIcon src={path} size={size} alt={cat} />;
  return <span>📖</span>;
};

/** 카테고리 표시 우선순위. PRIORITY 에 없으면 권수 많은 순. LibraryPage 와 동일 패턴. */
const PRIORITY_CATEGORIES = [
  '세계 명작',
  '명작동화',
  '자연관찰',
  '자연 관찰',
  '생활동화',
  '생활 동화',
  '한국 전래',
  '전래동화',
  '전래 동화',
  '기타',
];

function compareByPriority(a: string, b: string, fallbackA = 0, fallbackB = 0): number {
  const ai = PRIORITY_CATEGORIES.indexOf(a);
  const bi = PRIORITY_CATEGORIES.indexOf(b);
  if (ai !== -1 && bi !== -1) return ai - bi;
  if (ai !== -1) return -1;
  if (bi !== -1) return 1;
  return fallbackB - fallbackA;
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
  icon: ReactNode;
  units: VocabularyUnitSummary[];
  onClickUnit: (id: string) => void;
}

function Section({ title, icon, units, onClickUnit }: SectionProps) {
  if (units.length === 0) return null;
  return (
    <section className="mb-8">
      <h2 className="text-xl md:text-2xl font-black font-display text-ink-900 mb-3 flex items-center gap-2">
        <span className="leading-none">{icon}</span>
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

/** 학습자 어휘 학습 허브 — 동화 derived 단원만 (mvp-simplification §5). 검색/카테고리/정렬 패턴은 LibraryPage 와 동일. */
export function VocabularyHubPage() {
  const navigate = useNavigate();
  const { data: units, isLoading } = useVocabularyUnits();

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'title'>('recent');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  /** public + storybook source 만 (Cambridge / Custom 은 mvp-simplification 에서 hide) */
  const allUnits = useMemo<VocabularyUnitSummary[]>(() => {
    return (units ?? []).filter((u) => u.isPublic && u.source === 'storybook');
  }, [units]);

  const matchesSearch = (u: VocabularyUnitSummary, q: string): boolean => {
    if (!q) return true;
    return (
      u.nameKo.toLowerCase().includes(q) ||
      (u.nameEn ?? '').toLowerCase().includes(q) ||
      (u.folder ?? '').toLowerCase().includes(q)
    );
  };

  const filtered = useMemo<VocabularyUnitSummary[]>(() => {
    const q = search.trim().toLowerCase();
    const searched = allUnits.filter((u) => matchesSearch(u, q));
    const byCat = activeCategory
      ? searched.filter((u) => (u.folder ?? '기타') === activeCategory)
      : searched;
    return [...byCat].sort((a, b) =>
      sortBy === 'recent'
        ? (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '')
        : a.nameKo.localeCompare(b.nameKo, 'ko')
    );
  }, [allUnits, search, sortBy, activeCategory]);

  /** chip 옆 카운트는 검색 필터 반영, activeCategory 제외 (chip 자체에서 chip 활성/비활성 시 카운트 변하지 않게) */
  const allCategories = useMemo<Array<[string, number]>>(() => {
    const q = search.trim().toLowerCase();
    const base = allUnits.filter((u) => matchesSearch(u, q));
    const counts = new Map<string, number>();
    base.forEach((u) => {
      const k = u.folder || '기타';
      counts.set(k, (counts.get(k) ?? 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => compareByPriority(a[0], b[0], a[1], b[1]));
  }, [allUnits, search]);

  const showGroups = !activeCategory;
  const grouped = useMemo(() => {
    if (!showGroups) return null;
    const map = new Map<string, VocabularyUnitSummary[]>();
    filtered.forEach((u) => {
      const key = u.folder || '기타';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(u);
    });
    return [...map.entries()].sort((a, b) =>
      compareByPriority(a[0], b[0], a[1].length, b[1].length)
    );
  }, [filtered, showGroups]);

  const handleClickUnit = (id: string) => navigate(`/vocabulary/${id}`);

  const totalCount = allUnits.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-yellow-50 to-cream-50">
      {/* 헤더 — 한 줄 압축 */}
      <header className="px-4 sm:px-6 pt-3 pb-2 max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Mascot state="reading" size="sm" />
            <h1 className="text-lg sm:text-xl font-black font-display text-ink-900 whitespace-nowrap">
              어휘 마스터
            </h1>
            {totalCount > 0 && (
              <span className="text-xs text-ink-500 font-bold whitespace-nowrap hidden sm:inline">
                {totalCount} 단원
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="px-6 pb-12 mt-4 max-w-5xl mx-auto">
        {/* 검색창 + 정렬 — LibraryPage 와 동일 디자인 */}
        <div className="mb-5 bg-white rounded-2xl px-6 py-4 shadow-soft flex items-center gap-3 max-w-3xl mx-auto">
          <span className="text-2xl">🔍</span>
          <input
            type="text"
            placeholder="어떤 단원 찾을까?"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 outline-none text-lg bg-transparent text-ink-900 placeholder:text-ink-500 font-bold"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'recent' | 'title')}
            className="bg-transparent text-sm font-black text-ink-700 outline-none cursor-pointer"
          >
            <option value="recent">최신순</option>
            <option value="title">제목순</option>
          </select>
        </div>

        {/* 카테고리 chip — folder 종류 2개 이상일 때만 노출 */}
        {allCategories.length > 1 && (
          <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
            <Chip
              variant="ink"
              active={activeCategory === null}
              onClick={() => setActiveCategory(null)}
            >
              전체
            </Chip>
            {allCategories.map(([cat, count]) => (
              <Chip
                key={cat}
                variant="coral"
                active={activeCategory === cat}
                icon={getCategoryIconNode(cat, 20)}
                trailing={activeCategory === cat ? count : undefined}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </Chip>
            ))}
          </div>
        )}

        {/* 콘텐츠 */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-ink-500">
            <p className="text-lg font-bold">
              {search ? '찾는 단원이 없네' : '아직 공개된 어휘 단원이 없어요'}
            </p>
            <p className="text-sm mt-1">{search ? '다른 말로 찾아볼까?' : '곧 만나요!'}</p>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="mt-4 px-4 py-2 rounded-full bg-amber-200 text-amber-900 font-black"
              >
                🔎 다시 검색
              </button>
            )}
          </div>
        ) : showGroups && grouped ? (
          <>
            {grouped.map(([cat, list]) => (
              <Section
                key={cat}
                title={cat}
                icon={getCategoryIconNode(cat, 28)}
                units={list}
                onClickUnit={handleClickUnit}
              />
            ))}
          </>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {filtered.map((u) => (
              <UnitCard key={u.id} unit={u} onClick={() => handleClickUnit(u.id)} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
