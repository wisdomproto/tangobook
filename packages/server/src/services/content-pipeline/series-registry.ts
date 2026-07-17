/**
 * 콘텐츠 파이프라인 시리즈 레지스트리 — 순수 상수 + 매칭.
 * 책 `category`(R2 데이터의 한국어 문자열)를 시리즈로 분류하고,
 * 시리즈별 자산 규칙(그림체 모드·릴스 파이프라인·마케팅 체인)을 선언한다.
 * 감사 서비스 등 후속 파이프라인이 이 규칙을 소비한다.
 */

export interface SeriesRule {
  key: 'classic' | 'nature' | 'life' | 'kindergarten' | 'folk' | 'comic' | 'original';
  label: string;
  /** 이 시리즈로 분류되는 책 category 문자열들 (R2 실데이터 기준) */
  categories: string[];
  /** styles3 = 그림체 3종(styleAssets) / base = 기본 pages[].illustrationUrl */
  artStyleMode: 'styles3' | 'base';
  /** storyboard = 책별 스토리보드 릴스 / nature = 자연 릴스 / derive = 블로그 파생 / none */
  reelPipeline: 'storyboard' | 'nature' | 'derive' | 'none';
  /** saenghwal = 기본글+블로그 집필 → derive-cardnews-storyboards 파생 체인 */
  marketingChain?: 'saenghwal';
}

// 실측 2026-07-16 (https://www.tangobook.co.kr/api/storybooks distinct category).
// 신규 카테고리는 관제탑에 "미분류"로 뜨면 여기 추가.
const NATURE_CATEGORIES = [
  '육지 동물 친구들',
  '바다 동물 친구들',
  '곤충 친구들',
  '하늘 동물 친구들',
  '공룡 친구들',
  '우리 몸 이야기',
  '우주와 자연',
  '식물 친구들',
  '자연 관찰', // 저작도구 상수(STORYBOOK_CATEGORIES) 표기 — 실데이터 혼용 대비
];

export const SERIES_RULES: SeriesRule[] = [
  {
    key: 'classic',
    label: '세계 명작',
    categories: ['세계 명작'],
    artStyleMode: 'styles3',
    reelPipeline: 'storyboard',
  },
  {
    key: 'nature',
    label: '자연관찰',
    categories: NATURE_CATEGORIES,
    artStyleMode: 'base',
    reelPipeline: 'nature',
  },
  {
    key: 'life',
    label: '생활동화',
    categories: ['생활동화'],
    artStyleMode: 'base',
    reelPipeline: 'derive',
    marketingChain: 'saenghwal',
  },
  {
    key: 'kindergarten',
    label: '유치원동화',
    categories: ['유치원동화'],
    artStyleMode: 'base',
    reelPipeline: 'derive',
    marketingChain: 'saenghwal',
  },
  {
    key: 'folk',
    label: '전래동화',
    // 저작도구 상수는 '전래 동화'(띄어쓰기) — 실데이터 혼용 대비 두 표기 다 매칭
    categories: ['전래동화', '전래 동화'],
    artStyleMode: 'styles3',
    reelPipeline: 'storyboard',
  },
  {
    key: 'comic',
    label: '학습만화',
    categories: ['학습만화'],
    artStyleMode: 'base',
    reelPipeline: 'none',
  },
  {
    key: 'original',
    label: '창작동화',
    categories: ['창작동화'],
    artStyleMode: 'base',
    reelPipeline: 'none',
  },
];

export function resolveSeries(category: string | undefined | null): SeriesRule | null {
  if (!category) return null;
  return SERIES_RULES.find((r) => r.categories.includes(category)) ?? null;
}
