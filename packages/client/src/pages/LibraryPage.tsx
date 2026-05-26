import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useStorybooks } from '@/features/storybook';
import {
  CategorySection,
  BookCard,
  LibraryBanner,
  useReadingStatus,
  useLibraryConfig,
} from '@/features/library';
import { StateScreen, SkeletonBookCard, Chip } from '@/design-system';
import { useSeo } from '@/lib/useSeo';
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
 * 한글 카테고리명 → sprite cell `[col, row]` 매핑.
 *
 * 스프라이트: `/icons/category/sprite.webp` (1536×1536, 3×3 grid, 512×512/cell).
 *   R0: 세계 명작 / 전래 동화 / 공룡 친구들
 *   R1: 곤충 친구들 / 육지 동물 친구들 / 바다 동물 친구들
 *   R2: 하늘 동물 친구들 / 식물 친구들 / 우주와 자연
 *
 * 매핑에 없는 카테고리 (`우리 몸 이야기`·legacy 등) 는 이모지 fallback.
 */
const CATEGORY_SPRITE_URL = '/icons/category/sprite.webp';
const CATEGORY_SPRITE_MAP: Record<string, [number, number]> = {
  '세계 명작': [0, 0],
  '전래 동화': [1, 0],
  '공룡 친구들': [2, 0],
  '곤충 친구들': [0, 1],
  '육지 동물 친구들': [1, 1],
  '바다 동물 친구들': [2, 1],
  '하늘 동물 친구들': [0, 2],
  '식물 친구들': [1, 2],
  '우주와 자연': [2, 2],
};

const CATEGORY_EMOJI_FALLBACK: Record<string, string> = {
  '우리 몸 이야기': '🫀',
};

const getCategoryIconNode = (cat: string, size = 22): ReactNode => {
  const cell = CATEGORY_SPRITE_MAP[cat];
  if (cell) {
    const [col, row] = cell;
    return (
      <span
        role="img"
        aria-label={cat}
        className="inline-block shrink-0 align-middle"
        style={{
          width: size,
          height: size,
          backgroundImage: `url(${CATEGORY_SPRITE_URL})`,
          backgroundSize: `${size * 3}px ${size * 3}px`,
          backgroundPosition: `-${col * size}px -${row * size}px`,
          backgroundRepeat: 'no-repeat',
        }}
      />
    );
  }
  const emoji = CATEGORY_EMOJI_FALLBACK[cat];
  return <span aria-label={cat}>{emoji ?? '📚'}</span>;
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
  useSeo(
    type === 'phonics'
      ? {
          title: '한글·영어 파닉스 — 탱고북',
          description:
            '한글 자모·받침·블렌딩과 영어 알파벳·CVC·Sight Words 를 동화 단어와 자동 연결. 4-7세 아이를 위한 파닉스 학습.',
          path: '/library/phonics/korean',
          keywords:
            '한글 파닉스, 영어 파닉스, 자모 학습, CVC, Sight Words, 4세 파닉스, 5세 파닉스, 탱고북',
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: '한글·영어 파닉스',
            description: '한글과 영어 파닉스 학습 unit 컬렉션',
            url: 'https://www.tangobook.co.kr/library/phonics/korean',
          },
        }
      : {
          title: '동화책 라이브러리 — 탱고북',
          description:
            '세계 명작·전래 동화·자연 동화 (공룡·곤충·동물·식물·우주). 그림체와 글밥을 아이에게 맞추고, 한국어·영어 동시 학습. 4-7세 아이를 위한 동화 라이브러리.',
          path: '/library',
          keywords:
            '유아 동화책, 명작 동화, 자연 동화, 공룡 동화, 곤충 동화, 4세 동화, 5세 동화, 6세 동화, 한글 영어 동화, 탱고북',
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: '탱고북 동화책 라이브러리',
            description: '명작·전래·자연 동화 라이브러리. 그림체·글밥 맞춤, 한·영 동시.',
            url: 'https://www.tangobook.co.kr/library',
            breadcrumb: {
              '@type': 'BreadcrumbList',
              itemListElement: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: '홈',
                  item: 'https://www.tangobook.co.kr/',
                },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: '라이브러리',
                  item: 'https://www.tangobook.co.kr/library',
                },
              ],
            },
          },
        }
  );
  const { data: list, isLoading, isError } = useStorybooks();
  const all = useMemo<BookIndexEntry[] | undefined>(() => list?.map(summaryToEntry), [list]);
  const { data: statusMap } = useReadingStatus();
  const { data: libConfig } = useLibraryConfig();
  const compareByPriority = useMemo(
    () => makeCategoryComparator(libConfig?.categoryOrder),
    [libConfig?.categoryOrder]
  );
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [readingFilter, setReadingFilter] = useState(false);
  const [phonicsLang, setPhonicsLang] = useState<PhonicsLang>('all');
  // 4-5세 인지부하 ↓ — 카테고리 chip 기본 4개만 노출, "더 ▾" 토글로 펼치기
  const [showAllCategories, setShowAllCategories] = useState(false);
  const CATEGORY_DEFAULT_VISIBLE = 4;

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
    // 단일 카테고리 보기에선 라이브러리 마스터에서 정한 bookPriority 순서를 따름
    // (카테고리 섹션 미리보기 9권과 동일 순서). 그 외에는 최신순 (updatedAt desc).
    const priorityIds = activeCategory ? libConfig?.bookPriority?.[activeCategory] : undefined;
    const priorityIdx = priorityIds?.length
      ? new Map(priorityIds.map((id, i) => [id, i]))
      : undefined;
    return [...byReading].sort((a, b) => {
      if (priorityIdx) {
        const ai = priorityIdx.has(a.id) ? priorityIdx.get(a.id)! : Infinity;
        const bi = priorityIdx.has(b.id) ? priorityIdx.get(b.id)! : Infinity;
        if (ai !== Infinity && bi !== Infinity) return ai - bi;
        if (ai !== Infinity) return -1;
        if (bi !== Infinity) return 1;
      }
      return (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '');
    });
  }, [
    all,
    type,
    phonicsLang,
    search,
    activeCategory,
    readingFilter,
    statusMap,
    libConfig?.bookPriority,
  ]);

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
      <div className="max-w-[1600px] mx-auto px-6 md:px-8 pt-5 md:pt-6 pb-6">
        {/* 롤링 배너 — 동화책 모드 only. 3 슬라이드 (그림체/어휘게임/자연관찰) 5s auto-advance.
            /library 헤더는 absolute overlay (transparent) — 배너가 viewport top 까지 차지. */}
        {type === 'storybook' && <LibraryBanner />}

        {/* 검색바 (좌) + 카테고리 chip (우). 모바일 stack, md+ 가로. 검색바 적정 폭으로 줄여 chip 영역 확보. */}
        <div className="mb-8 md:mb-10 flex flex-col md:flex-row md:items-center gap-3 md:gap-6 lg:gap-8">
          {/* 검색바 — 좌측 */}
          <div className="shrink-0 w-full md:w-72 lg:w-80 2xl:w-96 bg-white rounded-2xl px-4 py-3 shadow-soft flex items-center gap-2">
            <span className="text-xl">🔍</span>
            <input
              type="text"
              placeholder={type === 'storybook' ? '무슨 책 찾을까?' : '어떤 파닉스 찾을까?'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-0 outline-none text-base bg-transparent text-ink-900 placeholder:text-ink-500 font-bold"
            />
          </div>

          {/* 파닉스 한/영 chip — 동화책 모드에선 카테고리 chip 으로 대체 */}
          {type === 'phonics' && (
            <div className="flex-1 flex gap-2 overflow-x-auto pb-1">
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

          {/* 카테고리 chip + 읽는 중 chip — 동화책. 우측 영역 flex-1 + 가로 스크롤.
              4-5세 인지부하 ↓ — 기본 4개만 + 활성 카테고리 + 읽는중 노출. 나머지는 "더 ▾" 클릭. */}
          {type === 'storybook' && (allCategories.length > 1 || readingCount > 0) && (
            <div className="flex-1 flex gap-2 overflow-x-auto pb-1">
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
              {(() => {
                // 활성 카테고리는 default 가시 범위에 없어도 무조건 보이게.
                const visibleSet = new Set<string>(
                  allCategories.slice(0, CATEGORY_DEFAULT_VISIBLE).map(([c]) => c)
                );
                if (activeCategory) visibleSet.add(activeCategory);
                const chips = showAllCategories
                  ? allCategories
                  : allCategories.filter(([c]) => visibleSet.has(c));
                return chips.map(([cat, count]) => (
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
                ));
              })()}
              {allCategories.length > CATEGORY_DEFAULT_VISIBLE && (
                <button
                  onClick={() => setShowAllCategories((v) => !v)}
                  className="shrink-0 px-4 py-2 rounded-full bg-white shadow-soft text-sm font-black text-ink-600 hover:bg-ink-50 transition"
                  aria-label={showAllCategories ? '카테고리 접기' : '카테고리 더 보기'}
                >
                  {showAllCategories
                    ? '▴ 접기'
                    : `더 ▾ +${allCategories.length - CATEGORY_DEFAULT_VISIBLE}`}
                </button>
              )}
            </div>
          )}
        </div>

        {/* 콘텐츠 */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5 sm:gap-6">
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5 sm:gap-6">
            {filtered.map((b) => (
              <BookCard key={b.id} book={b} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
