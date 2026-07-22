import { useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStorybooks } from '@/features/storybook';
import {
  CategorySection,
  BookCard,
  useReadingStatus,
  useLibraryConfig,
  makeCategoryComparator,
} from '@/features/library';
import { PromoBanner } from '@/features/library/components/PromoBanner';
import { useCategoryLabel } from '@/features/library/lib/category-i18n';
import { PlaylistLibrarySection } from '@/features/continuous';
import { StateScreen, SkeletonBookCard, Chip } from '@/design-system';
import { SiteFooter } from '@/components/SiteFooter';
import { useSeo } from '@/lib/useSeo';
import {
  useStyleGenreMap,
  STYLE_GENRES,
  genreLabel,
  type StyleGenreSlug,
} from '@/lib/art-style-genre';
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
function summaryToEntry(s: StorybookSummary, uiLang: string): BookIndexEntry {
  return {
    id: s.id,
    title: s.title,
    titleTranslations: s.titleTranslations,
    // v1 storybook 은 type 미지정이면 'storybook' 으로 호환 (legacy 룰).
    type: s.type ?? 'storybook',
    category: s.category,
    folder: s.folder,
    isPublic: s.isPublic,
    isAccessibleForFree: s.isAccessibleForFree,
    // 대표 표지 = UI 언어별 표지 우선(ko/en 원본 · vi/th/zh 구운 것), 없으면 언어무관 원본.
    coverImageUrl: s.coversByLang?.[uiLang] ?? s.coverImage,
    coversByStyle: s.coversByStyle,
    coversByLang: s.coversByLang,
    coverLangByStyle: s.coverLangByStyle,
    cleanCoverImageUrl: s.cleanCoverImage,
    cleanCoversByStyle: s.cleanCoversByStyle,
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

// 스프라이트(3×3) 밖의 카테고리는 개별 아이콘 파일로 렌더 (스프라이트 재생성 없이 추가).
const CATEGORY_ICON_URL: Record<string, string> = {
  생활동화: '/icons/category/saenghwal.webp',
};

const CATEGORY_EMOJI_FALLBACK: Record<string, string> = {
  '우리 몸 이야기': '🫀',
};

const getCategoryIconNode = (cat: string, size = 22): ReactNode => {
  const iconUrl = CATEGORY_ICON_URL[cat];
  if (iconUrl) {
    return (
      <span
        role="img"
        aria-label={cat}
        className="inline-block shrink-0 align-middle"
        style={{
          width: size,
          height: size,
          backgroundImage: `url(${iconUrl})`,
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
    );
  }
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
export default function LibraryPage({ type = 'storybook' }: LibraryPageProps) {
  const { t, i18n } = useTranslation('library');
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
  const all = useMemo<BookIndexEntry[] | undefined>(
    () => list?.map((s) => summaryToEntry(s, i18n.language)),
    [list, i18n.language]
  );
  const { data: statusMap } = useReadingStatus();
  const { data: libConfig } = useLibraryConfig();
  const compareByPriority = useMemo(
    () => makeCategoryComparator(libConfig?.categoryOrder),
    [libConfig?.categoryOrder]
  );
  const [search, setSearch] = useState('');
  // 🔴 카테고리·읽는중 필터는 URL 에 둔다(로컬 state X). 사이드바 "동화책"은 /library 로
  // 가는데, 같은 라우트라 컴포넌트가 remount 되지 않아 로컬 state 면 필터가 그대로 남는다
  // ("전체 보기"에서 나갈 방법이 없어짐). URL 이면 링크 한 번으로 초기화되고, 덤으로
  // 뒤로가기·새로고침·공유에서도 필터가 유지된다.
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('category');
  const readingFilter = searchParams.get('reading') === '1';
  const setFilters = useCallback(
    (
      next: { category?: string | null; reading?: boolean },
      /** 칩 토글은 같은 화면의 필터라 replace(히스토리 오염 방지).
       *  "더 보기" 드릴인만 push — 안드로이드 뒤로가기로 전체 목록에 돌아와야 하므로. */
      opts: { push?: boolean } = {}
    ) => {
      setSearchParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          if ('category' in next) {
            if (next.category) p.set('category', next.category);
            else p.delete('category');
          }
          if ('reading' in next) {
            if (next.reading) p.set('reading', '1');
            else p.delete('reading');
          }
          return p;
        },
        { replace: !opts.push }
      );
    },
    [setSearchParams]
  );
  const [phonicsLang, setPhonicsLang] = useState<PhonicsLang>('all');
  // 4-5세 인지부하 ↓ — 카테고리 chip 기본 4개만 노출, "더 ▾" 토글로 펼치기
  const [showAllCategories, setShowAllCategories] = useState(false);
  const CATEGORY_DEFAULT_VISIBLE = 4;
  // 그림풍 일괄 전환 — 표지 기본값 = 페이퍼 3D 아트(2026-07-16, 사용자 요청. 이전 수채동화풍).
  // 드롭박스로 다른 그림풍 선택 가능. 여러 그림체 표지가 있는 책(주로 세계명작)만 실제로 바뀜.
  // styleId→장르 맵은 editor2 수동 지정(R2). 해당 장르 표지가 없는 책은 대표 표지로 폴백.
  const [styleGenre, setStyleGenre] = useState<StyleGenreSlug>('paper3d');
  const { map: styleGenreMap } = useStyleGenreMap();

  // 카테고리명은 R2 데이터라 내부 key(한국어)는 그대로 유지하고, 표시 시점에만
  // UI 언어 라벨로 치환 (categoryLabel 딕셔너리, 매핑 없으면 원본 폴백).
  const catLabel = useCategoryLabel();
  const displayCategory = (cat: string) => (cat === '기타' ? t('category.other') : catLabel(cat));

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
    // (카테고리 섹션 미리보기 8권과 동일 순서). 그 외에는 최신순 (updatedAt desc).
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

  // 현재 보이는 책들 중 실제로 존재하는 그림풍(장르)만 선택지로 노출.
  // (세계명작 섹션이 보이는 뷰에서만 뜸 — 자연관찰 등 단일 그림체 카테고리 필터 시 자동 숨김)
  const availableGenres = useMemo(() => {
    if (type !== 'storybook') return [];
    const present = new Set<string>();
    for (const b of filtered) {
      for (const styleId of Object.keys(b.coversByStyle ?? {})) {
        const g = styleGenreMap[styleId];
        if (g) present.add(g);
      }
    }
    return STYLE_GENRES.filter((g) => present.has(g.slug));
  }, [filtered, type, styleGenreMap]);

  // 책 표지를 선택 장르 표지로 교체 (해당 장르 표지 없으면 대표 그대로).
  const applyGenreCover = (b: BookIndexEntry): BookIndexEntry => {
    for (const [styleId, url] of Object.entries(b.coversByStyle ?? {})) {
      if (url && styleGenreMap[styleId] === styleGenre) {
        // 선택 그림풍 × UI 언어 표지 우선(ko/en 원본 · vi/th/zh 구운 것), 없으면 그 그림풍 원본.
        const cover = b.coverLangByStyle?.[styleId]?.[i18n.language] ?? url;
        const cleanCoverImageUrl = b.cleanCoversByStyle?.[styleId] ?? b.cleanCoverImageUrl;
        return b.coverImageUrl === cover ? b : { ...b, coverImageUrl: cover, cleanCoverImageUrl };
      }
    }
    return b;
  };

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
        title={t('error.title')}
        description={t('error.description')}
        action={{ label: t('error.retry'), onClick: () => location.reload() }}
      />
    );
  }

  // 그림풍 선택기 — "세계 명작" 섹션 타이틀 오른쪽 드롭박스. 여러 그림체 표지가 있는 책의 표지를
  // 한 장르로 일괄 swap. 기본=수채동화풍. 실명(지브리 등) 비노출 정책 → 장르 라벨만 표시.
  const genreSelector =
    availableGenres.length > 0 ? (
      <label className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-ink-600">
        <span aria-hidden>🎨</span>
        <span className="sr-only">{t('genre.label')}</span>
        <select
          value={styleGenre}
          onChange={(e) => setStyleGenre(e.target.value as StyleGenreSlug)}
          className="cursor-pointer rounded-full border-2 border-peach-200 bg-white px-3 py-1.5 pr-7 text-xs sm:text-sm font-black text-ink-800 shadow-soft focus:border-coral-400 focus:outline-none"
        >
          {availableGenres.map((g) => (
            <option key={g.slug} value={g.slug}>
              {genreLabel(g.label, i18n.language)}
            </option>
          ))}
        </select>
      </label>
    ) : undefined;

  return (
    <div className="bg-gradient-to-b from-cream-50 to-peach-100 min-h-full">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 pt-5 md:pt-6 pb-6">
        {/* 롤링 배너 — 동화책 모드 only. 3 슬라이드 (그림체/어휘게임/자연관찰) 5s auto-advance.
            /library 헤더는 absolute overlay (transparent) — 배너가 viewport top 까지 차지. */}
        {type === 'storybook' && <PromoBanner />}

        {/* 검색바 (좌) + 카테고리 chip (우). 모바일 stack, md+ 가로. 검색바 적정 폭으로 줄여 chip 영역 확보. */}
        <div className="mb-8 md:mb-10 flex flex-col md:flex-row md:items-center gap-3 md:gap-6 lg:gap-8">
          {/* 검색바 — 좌측 */}
          <div className="shrink-0 w-full md:w-72 lg:w-80 2xl:w-96 bg-white rounded-2xl px-4 py-3 shadow-soft flex items-center gap-2">
            <span className="text-xl">🔍</span>
            <input
              type="text"
              placeholder={t(
                type === 'storybook' ? 'search.placeholderStorybook' : 'search.placeholderPhonics'
              )}
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
                  {
                    id: 'all',
                    label: t('chips.all'),
                    count: phonicsCounts.korean + phonicsCounts.english,
                  },
                  { id: 'korean', label: t('chips.korean'), count: phonicsCounts.korean },
                  { id: 'english', label: t('chips.english'), count: phonicsCounts.english },
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
                onClick={() => setFilters({ category: null, reading: false })}
                className="!text-base !px-5 !py-2"
              >
                {t('chips.all')}
              </Chip>
              {readingCount > 0 && (
                <Chip
                  variant="warn"
                  active={readingFilter}
                  icon="📖"
                  trailing={readingCount}
                  onClick={() => setFilters({ category: null, reading: !readingFilter })}
                  className="!text-base !px-5 !py-2"
                >
                  {t('chips.reading')}
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
                    onClick={() => setFilters({ category: cat, reading: false })}
                    className="!text-base !px-5 !py-2"
                  >
                    {displayCategory(cat)}
                  </Chip>
                ));
              })()}
              {allCategories.length > CATEGORY_DEFAULT_VISIBLE && (
                <button
                  onClick={() => setShowAllCategories((v) => !v)}
                  className="shrink-0 px-4 py-2 rounded-full bg-white shadow-soft text-sm font-black text-ink-600 hover:bg-ink-50 transition"
                  aria-label={showAllCategories ? t('chips.collapseAria') : t('chips.moreAria')}
                >
                  {showAllCategories
                    ? t('chips.collapse')
                    : t('chips.more', { count: allCategories.length - CATEGORY_DEFAULT_VISIBLE })}
                </button>
              )}
            </div>
          )}
        </div>

        {/* 나의 재생 목록 — 로그인 시 노출(컴포넌트 내부 조건 판단), 헤더 접기/펴기(기본 접힘). */}
        {type === 'storybook' && <PlaylistLibrarySection />}

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
            title={search ? t('empty.noResultTitle') : t('empty.noBooksTitle')}
            description={search ? t('empty.noResultDescription') : t('empty.noBooksDescription')}
            action={search ? { label: t('search.retry'), onClick: () => setSearch('') } : undefined}
          />
        ) : showCategoryGroups && grouped ? (
          grouped.map(([cat, books]) => (
            <CategorySection
              key={cat}
              icon={getCategoryIconNode(cat, 32)}
              title={displayCategory(cat)}
              books={books.map(applyGenreCover)}
              headerExtra={cat === '세계 명작' ? genreSelector : undefined}
              onShowMore={() => {
                setFilters({ category: cat, reading: false }, { push: true });
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          ))
        ) : (
          <>
            {/* 카테고리 필터/검색 뷰 상단 툴바 — 제목(활성 카테고리) + 그림풍 드롭박스(명작 등 여러 그림체 책).
                섹션 헤더가 안 뜨는 평면 뷰에서도 그림체 전환 가능하게. */}
            {(genreSelector || activeCategory) && (
              <div className="mb-4 flex items-center justify-between gap-3">
                {activeCategory ? (
                  <h2 className="flex items-center gap-2 text-lg font-black text-ink-900 sm:text-xl">
                    {getCategoryIconNode(activeCategory, 28)}
                    <span className="break-keep">{displayCategory(activeCategory)}</span>
                  </h2>
                ) : (
                  <span />
                )}
                {genreSelector}
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5 sm:gap-6">
              {filtered.map((b) => (
                <BookCard key={b.id} book={applyGenreCover(b)} />
              ))}
            </div>
          </>
        )}
      </div>
      {/* 사업자 정보 + 법적 문서 링크 — 토스 가맹 심사 필수 표기 */}
      <SiteFooter />
    </div>
  );
}
