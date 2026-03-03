import type {
  Storybook,
  BlogPost,
  BlogSection,
  NaverKeywordResult,
  CardNewsSlide,
} from '@tangobook/shared';

// ─── ID 생성 ───

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

// ─── 네이버 경쟁도 한국어 매핑 ───

const COMP_MAP: Record<string, string> = {
  LOW: '낮음',
  low: '낮음',
  MEDIUM: '중간',
  medium: '중간',
  HIGH: '높음',
  high: '높음',
};

export function mapCompetition(compIdx: string | undefined): string {
  if (!compIdx) return '낮음';
  return COMP_MAP[compIdx] ?? compIdx;
}

// ─── 네이버 API 아이템 → NaverKeywordResult 변환 ───

export function mapNaverItemToResult(item: {
  relKeyword: string;
  monthlyPcQcCnt: number;
  monthlyMobileQcCnt: number;
  compIdx?: string;
}): NaverKeywordResult {
  return {
    keyword: item.relKeyword,
    monthlyPcSearch: item.monthlyPcQcCnt,
    monthlyMobileSearch: item.monthlyMobileQcCnt,
    totalSearch: item.monthlyPcQcCnt + item.monthlyMobileQcCnt,
    competition: mapCompetition(item.compIdx),
  };
}

// ─── 키워드 결과 정렬 + 필터 ───

export function sortAndFilterKeywords(
  mapped: NaverKeywordResult[],
  maxCount: number = 7
): NaverKeywordResult[] {
  const preferred = mapped
    .filter((k) => k.competition !== '높음' && k.totalSearch > 0)
    .sort((a, b) => b.totalSearch - a.totalSearch);

  const highComp = mapped
    .filter((k) => k.competition === '높음' && k.totalSearch > 0)
    .sort((a, b) => b.totalSearch - a.totalSearch);

  return [...preferred, ...highComp].slice(0, maxCount);
}

// ─── 키워드 부족 시 fallback 보충 ───

export function fillKeywordsFromFallback(
  existing: NaverKeywordResult[],
  fallbackKeywords: string[],
  maxCount: number = 7
): NaverKeywordResult[] {
  const result = [...existing];
  const seen = new Set(result.map((k) => k.keyword));
  for (const kw of fallbackKeywords) {
    if (!seen.has(kw) && result.length < maxCount) {
      result.push({
        keyword: kw,
        monthlyPcSearch: 0,
        monthlyMobileSearch: 0,
        totalSearch: 0,
        competition: '-',
      });
      seen.add(kw);
    }
  }
  return result;
}

// ─── 동화책 컨텍스트 추출 ───

export interface StorybookContext {
  title: string;
  targetAge: string;
  characters: string;
  storyText: string;
  keyWords: string;
  educationalContent: string;
  coverImage?: string;
  illustrationUrls: string[];
  characterImageUrls: string[];
  keyObjectImageUrls: Array<{ word: string; imageUrl: string }>;
  phonicsInfo?: string;
}

export function extractContext(sb: Storybook): StorybookContext {
  const pages = sb.pages ?? [];
  const storyText = pages.map((p, i) => `페이지 ${i + 1}: ${p.text ?? ''}`).join('\n');

  const characters = (sb.characters ?? [])
    .map((c) => `${c.name}(${c.role ?? '등장인물'}): ${c.description ?? ''}`)
    .join(', ');

  const edu = sb.educational_content;
  const keyWords = (edu?.vocabulary ?? []).map((v) => `${v.word}(${v.definition})`).join(', ');
  const educationalContent = [
    edu?.moral_lesson ? `교훈: ${edu.moral_lesson}` : '',
    edu?.learning_objectives?.length ? `주제: ${edu.learning_objectives.join(', ')}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const illustrationUrls = pages.map((p) => p.illustrationUrl).filter(Boolean) as string[];

  const characterImageUrls = (sb.characters ?? [])
    .map((c) => c.referenceImage)
    .filter(Boolean) as string[];

  const keyObjectImageUrls: Array<{ word: string; imageUrl: string }> = [];
  if (sb.type === 'phonics') {
    for (const fc of sb.flashcards ?? []) {
      if (fc.imageUrl) keyObjectImageUrls.push({ word: fc.word, imageUrl: fc.imageUrl });
    }
  } else {
    const koImages = sb.keyObjectImages ?? [];
    for (const ko of sb.key_objects ?? []) {
      const img = koImages.find((ki) => ki.objectName === ko.name);
      if (img?.imageUrl) keyObjectImageUrls.push({ word: ko.name, imageUrl: img.imageUrl });
    }
  }

  let phonicsInfo: string | undefined;
  if (sb.type === 'phonics' && sb.phonicsConfig) {
    const pc = sb.phonicsConfig;
    phonicsInfo = `파닉스 언어: ${pc.language}, 레벨: ${pc.bookType}, 유닛: ${pc.targetUnit ?? ''}`;
    if (sb.flashcards?.length) {
      phonicsInfo += `\n핵심 단어: ${sb.flashcards.map((f) => `${f.word}(${f.localWord})`).join(', ')}`;
    }
  }

  return {
    title: sb.title,
    targetAge: sb.targetAge ?? '5-7',
    characters,
    storyText,
    keyWords,
    educationalContent,
    coverImage: sb.coverImage,
    illustrationUrls,
    characterImageUrls,
    keyObjectImageUrls,
    phonicsInfo,
  };
}

// ─── 이미지 풀 구성 ───

export function buildImagePool(ctx: StorybookContext): Array<{ url: string; caption: string }> {
  const pool: Array<{ url: string; caption: string }> = [];
  if (ctx.coverImage) pool.push({ url: ctx.coverImage, caption: '표지' });
  for (const url of ctx.illustrationUrls) pool.push({ url, caption: '삽화' });
  for (const url of ctx.characterImageUrls) pool.push({ url, caption: '캐릭터' });
  for (const obj of ctx.keyObjectImageUrls) pool.push({ url: obj.imageUrl, caption: obj.word });
  return pool;
}

// ─── 블로그 섹션에 이미지 자동 매핑 ───

export function mapSectionsWithImages(
  parsedSections: Array<{ header: string; text: string }>,
  imagePool: Array<{ url: string; caption: string }>
): BlogSection[] {
  return parsedSections.map((s, i) => {
    const img = i < imagePool.length ? imagePool[i] : undefined;
    return {
      id: uid(),
      header: s.header,
      text: s.text,
      imageUrl: img?.url,
      imageCaption: img?.caption,
    };
  });
}

// ─── 카드뉴스 슬라이드에 이미지 배분 ───

export function assignImagesToSlides(
  parsedSlides: Array<{ slideType: string; headline: string; subtext: string }>,
  ctx: StorybookContext,
  blogImages: string[],
  theme: { bg: string; text: string; id: string }
): CardNewsSlide[] {
  return parsedSlides.map((s, i) => {
    let imageUrl: string | undefined;
    const slideType = (s.slideType as CardNewsSlide['slideType']) || 'body';

    if (slideType === 'cover' && ctx.coverImage) {
      imageUrl = ctx.coverImage;
    } else if (slideType === 'body') {
      const bodyIdx = parsedSlides.slice(0, i).filter((x) => x.slideType === 'body').length;
      const allImages = [
        ...blogImages,
        ...ctx.illustrationUrls,
        ...ctx.keyObjectImageUrls.map((k) => k.imageUrl),
      ];
      if (allImages.length > 0) {
        imageUrl = allImages[bodyIdx % allImages.length];
      }
    }

    return {
      id: uid(),
      slideType,
      headline: s.headline,
      subtext: s.subtext,
      imageUrl,
      backgroundColor: theme.bg,
      textColor: theme.text,
    };
  });
}

// ─── 블로그 소스에서 이미지 추출 ───

export function extractBlogImages(blogPost: BlogPost): string[] {
  return blogPost.sections.map((s) => s.imageUrl).filter(Boolean) as string[];
}
