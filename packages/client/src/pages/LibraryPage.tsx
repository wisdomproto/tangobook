import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useStorybooks } from '@/features/storybook';
import { CategorySection, BookCard, useReadingStatus, useLibraryConfig } from '@/features/library';
import { StateScreen, SkeletonBookCard, Chip, AppIcon } from '@/design-system';
import { cn } from '@/lib/cn';
import type { BookIndexEntry, StorybookSummary } from '@tangobook/shared';

/**
 * v1 StorybookSummary 를 라이브러리 UI 가 기대하는 BookIndexEntry-shape 로 변환.
 *
 * 배경: 4-25~26 v2 시도 시 LibraryPage 가 v2 BookIndex 로 갈아탔지만 v2 폐기 후
 * 동기화가 깨져 137권이 라이브러리에서 누락. v1 storybook 이 진실의 출처이므로
 * 노출 레이어를 v1 으로 되돌림. BookCard/CategorySection 의 props 형태 유지를 위해
 * 어댑터로 변환.
 *
 * 매핑 규칙:
 * - coverImageUrl ← coverImage (StorybookSummary 에는 coverImage 만 있음)
 * - updatedAt ← createdAt (StorybookSummary 에 updatedAt 없음. 정렬 안정성 측면에서도 createdAt 이 적합)
 * - usedVariants ← dummy (라이브러리에서 미사용)
 */
function summaryToEntry(s: StorybookSummary): BookIndexEntry {
  return {
    id: s.id,
    title: s.title,
    // v1 storybook 은 type 미지정이면 'storybook' 으로 호환 (legacy 룰).
    type: s.type ?? 'storybook',
    category: s.category,
    folder: s.folder,
    isPublic: s.isPublic,
    coverImageUrl: s.coverImage,
    coversByStyle: s.coversByStyle,
    phonicsLanguage: s.phonicsLanguage,
    updatedAt: s.createdAt,
    usedVariants: { levels: [], languages: [], styles: [] },
    hasCover: !!s.coverImage,
  };
}

type LibraryType = 'storybook' | 'phonics';
type PhonicsLang = 'all' | 'korean' | 'english';

interface LibraryPageProps {
  /** 동화책 페이지 vs 파닉스 페이지 분기. AppShell 좌측 nav 의 3축 중 어느 쪽인지. */
  type?: LibraryType;
}

/**
 * 한글 카테고리명 → public/icons/{file} 매핑.
 *
 * 실제 사용 중인 카테고리 (`/api/storybooks` 기준):
 *   세계 명작 150권 · 자연 관찰 53권 · 전래 동화 5권 · 기타 4권
 *
 * 추가로 미래 확장용 9개 (동물/가족/자연/친구/음식/모험/직업/감정/일상) PNG 도
 * `public/icons/category/` 에 준비돼 있어 새 카테고리 만들면 즉시 사용 가능.
 */
const CATEGORY_ICON_MAP: Record<string, string> = {
  // 실제 사용 중 — 차별화된 아이콘 매핑
  '세계 명작': 'category/adventure.png', // 모험 (왕관/별빛 톤)
  '자연 관찰': 'category/nature.png',
  '생활 동화': 'category/family.png', // 가족 (생활 톤)
  '전래 동화': 'category/emotion.png', // 임시 (적합 자산 만들 때 교체)
  기타: 'tab/storybook.svg', // 일반 동화책
  // 미래용
  동물: 'category/animal.png',
  가족: 'category/family.png',
  자연: 'category/nature.png',
  친구: 'category/friend.png',
  음식: 'category/food.png',
  모험: 'category/adventure.png',
  직업: 'category/job.png',
  감정: 'category/emotion.png',
  일상: 'category/daily.png',
};

const getCategoryIconNode = (cat: string, size = 22): ReactNode => {
  const path = CATEGORY_ICON_MAP[cat];
  if (path) return <AppIcon src={path} size={size} alt={cat} />;
  return <span>📚</span>;
};

/** 마스터 페이지 config 비어있을 때 fallback 우선순위. */
const DEFAULT_PRIORITY_CATEGORIES = ['세계 명작', '자연 관찰', '생활 동화', '전래 동화', '기타'];

function makeCategoryComparator(configOrder: string[] | undefined) {
  // config 가 있으면 그 순서, 없으면 default. 둘 다에 없는 카테고리는 권수 desc.
  const order = configOrder?.length ? configOrder : DEFAULT_PRIORITY_CATEGORIES;
  return (a: string, b: string, fallbackA = 0, fallbackB = 0): number => {
    const ai = order.indexOf(a);
    const bi = order.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return fallbackB - fallbackA;
  };
}

export default function LibraryPage({ type = 'storybook' }: LibraryPageProps) {
  const { data: list, isLoading, isError } = useStorybooks();
  const all = useMemo<BookIndexEntry[] | undefined>(() => list?.map(summaryToEntry), [list]);
  const { data: statusMap } = useReadingStatus();
  const { data: libConfig } = useLibraryConfig();
  const compareByPriority = useMemo(
    () => makeCategoryComparator(libConfig?.categoryOrder),
    [libConfig?.categoryOrder]
  );
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'title'>('recent');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [readingFilter, setReadingFilter] = useState(false);
  const [phonicsLang, setPhonicsLang] = useState<PhonicsLang>('all');

  const matchesType = (b: BookIndexEntry): boolean => {
    if (type === 'storybook') return !b.type || b.type === 'storybook';
    if (type === 'phonics') {
      if (b.type !== 'phonics') return false;
      if (phonicsLang === 'all') return true;
      return b.phonicsLanguage === phonicsLang;
    }
    return false;
  };

  const filtered = useMemo<BookIndexEntry[]>(() => {
    if (!all) return [];
    const publicOnly = all.filter((b) => b.isPublic);
    const result = publicOnly.filter(matchesType);
    const q = search.trim().toLowerCase();
    const searched = q
      ? result.filter(
          (b) => b.title.toLowerCase().includes(q) || (b.category ?? '').toLowerCase().includes(q)
        )
      : result;
    const byCat = activeCategory
      ? searched.filter((b) => (b.category || '기타') === activeCategory)
      : searched;
    const byReading = readingFilter
      ? byCat.filter((b) => statusMap?.get(b.id) === 'reading')
      : byCat;
    return [...byReading].sort((a, b) =>
      sortBy === 'recent'
        ? (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '')
        : a.title.localeCompare(b.title, 'ko')
    );
  }, [all, type, phonicsLang, search, sortBy, activeCategory, readingFilter, statusMap]);

  // 카테고리 chip — 동화책일 때만
  const allCategories = useMemo(() => {
    if (type !== 'storybook' || !all) return [];
    const q = search.trim().toLowerCase();
    const base = all
      .filter((b) => b.isPublic)
      .filter(matchesType)
      .filter(
        (b) =>
          !q || b.title.toLowerCase().includes(q) || (b.category ?? '').toLowerCase().includes(q)
      );
    const counts = new Map<string, number>();
    base.forEach((b) => {
      const k = b.category || '기타';
      counts.set(k, (counts.get(k) ?? 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => compareByPriority(a[0], b[0], a[1], b[1]));
  }, [all, type, search, compareByPriority]);

  // 카테고리 chip 미선택 + 동화책 + 읽는 중 필터 X → 카테고리별 섹션, 그 외 → 플랫 그리드
  const showCategoryGroups = type === 'storybook' && !activeCategory && !readingFilter;
  // 읽는 중 책 카운트 (chip 옆 표시 + chip 자체 노출 여부)
  const readingCount = useMemo(() => {
    if (!statusMap || statusMap.size === 0 || type !== 'storybook') return 0;
    let n = 0;
    for (const v of statusMap.values()) if (v === 'reading') n++;
    return n;
  }, [statusMap, type]);
  const grouped = useMemo(() => {
    if (!showCategoryGroups) return null;
    const map = new Map<string, BookIndexEntry[]>();
    filtered.forEach((b) => {
      const key = b.category || '기타';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(b);
    });
    // 카테고리 안 책 — 마스터 페이지에서 정한 priority 가 있으면 그 순서 우선, 그 외는 filtered 순 유지
    const bookPriority = libConfig?.bookPriority;
    if (bookPriority) {
      for (const [cat, books] of map.entries()) {
        const ids = bookPriority[cat];
        if (!ids || ids.length === 0) continue;
        const idIdx = new Map(ids.map((id, i) => [id, i]));
        books.sort((a, b) => {
          const ai = idIdx.has(a.id) ? (idIdx.get(a.id) ?? 0) : Infinity;
          const bi = idIdx.has(b.id) ? (idIdx.get(b.id) ?? 0) : Infinity;
          if (ai === Infinity && bi === Infinity) return 0;
          return ai - bi;
        });
      }
    }
    // 카테고리 순서 — config order 또는 default priority
    return [...map.entries()].sort((a, b) =>
      compareByPriority(a[0], b[0], a[1].length, b[1].length)
    );
  }, [filtered, showCategoryGroups, libConfig?.bookPriority, compareByPriority]);

  // 파닉스 한/영 카운트
  const phonicsCounts = useMemo(() => {
    if (type !== 'phonics' || !all) return { korean: 0, english: 0 };
    const pub = all.filter((b) => b.isPublic && b.type === 'phonics');
    return {
      korean: pub.filter((b) => b.phonicsLanguage === 'korean').length,
      english: pub.filter((b) => b.phonicsLanguage === 'english').length,
    };
  }, [all, type]);

  if (isError) {
    return (
      <StateScreen
        mascotState="sad"
        title="연결이 안 돼"
        description="와이파이를 확인해줘"
        action={{ label: '↻ 다시 시도', onClick: () => location.reload() }}
      />
    );
  }

  return (
    <div className="bg-gradient-to-b from-cream-50 to-peach-100 min-h-full">
      {/* Hero 배너 — main 이 (AppShell header absolute) 0부터 시작 → hero 가 헤더 영역까지 자연 차지.
          aspect 비율 유지 (일러스트 잘림 X). 검색바 hero 하단 floating. 큰 제목/권수 텍스트 제거 (일러스트와 충돌). */}
      <section
        className={cn(
          'relative overflow-hidden aspect-[5/2] md:aspect-[4/1]',
          'bg-[url("/images/library-hero.png")] bg-cover bg-center',
          'bg-gradient-to-br from-sky-100 via-cream-50 to-amber-100'
        )}
      >
        {/* 텍스트 가독성 워시 (배경 일러스트 색 진해도 유지) */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-white/0 to-white/40 pointer-events-none" />

        {/* 검색바 — hero 하단 가운데 floating. 헤더 영역 (위 80px) 은 일러스트 + 사용자 chip 자유. */}
        <div className="absolute inset-x-0 bottom-6 px-6 flex justify-center">
          <div className="w-full max-w-2xl bg-white rounded-2xl px-6 py-5 shadow-pop flex items-center gap-3">
            <span className="text-3xl">🔍</span>
            <input
              type="text"
              placeholder={type === 'storybook' ? '무슨 책 찾을까?' : '어떤 파닉스 찾을까?'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 outline-none text-xl bg-transparent text-ink-900 placeholder:text-ink-500 font-bold"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'recent' | 'title')}
              className="bg-transparent text-base font-black text-ink-700 outline-none cursor-pointer"
            >
              <option value="recent">최신순</option>
              <option value="title">제목순</option>
            </select>
          </div>
        </div>
      </section>

      <div className="max-w-[1280px] mx-auto px-6 md:px-8 py-6">
        {/* 파닉스 한/영 chip — 학습자 가독성 위해 default Chip 보다 크게 (4-5세) */}
        {type === 'phonics' && (
          <div className="flex gap-2 mb-5">
            {(
              [
                { id: 'all', label: '전체', count: phonicsCounts.korean + phonicsCounts.english },
                { id: 'korean', label: '한글', count: phonicsCounts.korean },
                { id: 'english', label: '영어', count: phonicsCounts.english },
              ] as const
            ).map((c) => (
              <Chip
                key={c.id}
                variant="success"
                active={phonicsLang === c.id}
                trailing={phonicsLang === c.id ? c.count : undefined}
                onClick={() => setPhonicsLang(c.id)}
                className="!text-base !px-5 !py-2"
              >
                {c.label}
              </Chip>
            ))}
          </div>
        )}

        {/* 카테고리 chip + 읽는 중 chip — 동화책 (단일 선택). 학습자 가독성 위해 키운 사이즈. */}
        {type === 'storybook' && (allCategories.length > 1 || readingCount > 0) && (
          <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
            <Chip
              variant="ink"
              active={activeCategory === null && !readingFilter}
              onClick={() => {
                setActiveCategory(null);
                setReadingFilter(false);
              }}
              className="!text-base !px-5 !py-2"
            >
              전체
            </Chip>
            {readingCount > 0 && (
              <Chip
                variant="warn"
                active={readingFilter}
                icon="📖"
                trailing={readingCount}
                onClick={() => {
                  setActiveCategory(null);
                  setReadingFilter((v) => !v);
                }}
                className="!text-base !px-5 !py-2"
              >
                읽는 중
              </Chip>
            )}
            {allCategories.map(([cat, count]) => (
              <Chip
                key={cat}
                variant="coral"
                active={activeCategory === cat}
                icon={getCategoryIconNode(cat, 24)}
                trailing={activeCategory === cat ? count : undefined}
                onClick={() => {
                  setActiveCategory(cat);
                  setReadingFilter(false);
                }}
                className="!text-base !px-5 !py-2"
              >
                {cat}
              </Chip>
            ))}
          </div>
        )}

        {/* 콘텐츠 */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-5 sm:gap-6">
            {Array.from({ length: 9 }).map((_, i) => (
              <SkeletonBookCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <StateScreen
            mascotState="thinking"
            title={search ? '찾는 책이 없네' : '책이 아직 없어'}
            description={search ? '다른 말로 찾아볼까?' : '선생님이 곧 준비해 줄 거야!'}
            action={search ? { label: '🔎 다시 검색', onClick: () => setSearch('') } : undefined}
          />
        ) : showCategoryGroups && grouped ? (
          grouped.map(([cat, books]) => (
            <CategorySection
              key={cat}
              icon={getCategoryIconNode(cat, 32)}
              title={cat}
              books={books}
              onShowMore={() => {
                setActiveCategory(cat);
                setReadingFilter(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          ))
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-5 sm:gap-6">
            {filtered.map((b) => (
              <BookCard key={b.id} book={b} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
