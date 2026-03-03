import { generateTextWithGemini } from '../providers/gemini.provider.js';
import { parseGeminiJSON } from '../utils/parse-gemini-json.js';
import { R2Repository } from '../repositories/r2.repository.js';
import { AppError } from '../middleware/error.middleware.js';
import type {
  BlogPost,
  BlogGenerateConfig,
  BlogAutoConfig,
  NaverKeywordResult,
  CardNewsProject,
  BlogSection,
} from '@tangobook/shared';
import { CARD_NEWS_THEMES } from '@tangobook/shared';
import { searchKeywordTool } from '../providers/naver.provider.js';
import {
  extractContext,
  buildImagePool,
  mapSectionsWithImages,
  assignImagesToSlides,
  extractBlogImages,
  mapNaverItemToResult,
  sortAndFilterKeywords,
  fillKeywordsFromFallback,
} from '../utils/marketing-helpers.js';

// ─── 프롬프트 빌더: 블로그 키워드 지시사항 ───

function buildKeywordInstruction(ctx: { title: string }, keywords: string[]): string {
  if (keywords.length > 0) {
    return `\n## 핵심 키워드 (반드시 사용)\n${keywords.join(', ')}\n- 대표 키워드 1개를 제목 앞쪽에 배치\n- 본문 전체에서 3~5회 자연스럽게 반복 (키워드 스터핑 금지)\n- 최소 2개 소제목에 키워드 또는 연관 키워드 포함`;
  }
  return `\n## 키워드\n"${ctx.title}"에서 핵심 키워드 1~2개를 추출하고:\n- 대표 키워드를 제목 앞쪽에 배치\n- 본문 전체에서 3~5회 자연스럽게 반복\n- 최소 2개 소제목에 포함`;
}

// ─── 공통 프롬프트 조각 ───

const HTML_FORMATTING_GUIDE = `## ★ 본문 서식 (HTML)
각 섹션의 text 필드에 HTML 태그를 사용하여 서식을 적용하세요:
- **강조**: <strong>중요한 부분</strong> 또는 <b>키워드</b>
- **기울임**: <em>부연 설명</em>
- **형광펜**: <span style="background-color:#fef08a">핵심 포인트</span>
- **글자 색상**: <span style="color:#dc2626">주의사항</span>
- **목록**: <ul><li>항목1</li><li>항목2</li></ul>
- **인용**: <blockquote>인용구</blockquote>
- 문단 구분: <p> 태그 사용
- 핵심 키워드는 <strong> 또는 형광펜으로 강조하면 체류시간 증가`;

const HTML_SECTION_RULES = `- HTML 서식 적용:
  - 핵심 키워드는 <strong> 태그로 강조
  - 중요 포인트는 <span style="background-color:#fef08a">형광펜</span>으로 표시
  - 문단 구분은 <p> 태그 사용
  - 필요시 <ul><li> 목록 사용 가능`;

// ─── 서비스 ───

export const MarketingService = {
  async generateBlog(
    storybookId: string,
    options?: { title?: string; topic?: string; keywords?: string[]; model?: string }
  ): Promise<BlogPost> {
    const sb = await R2Repository.getStorybook(storybookId);
    if (!sb) throw new AppError(404, '동화책을 찾을 수 없습니다.');

    const ctx = extractContext(sb);
    const kwInstruction = buildKeywordInstruction(ctx, options?.keywords ?? []);

    const prompt = `당신은 육아/교육 분야 전문 블로거이자 네이버 SEO 전문가입니다.
다음 동화책 정보를 바탕으로 네이버 블로그에 올릴 글을 작성해주세요.

## 동화책 정보
- 제목: ${ctx.title}
- 대상 연령: ${ctx.targetAge}세
- 등장인물: ${ctx.characters}
${ctx.phonicsInfo ? `- 파닉스: ${ctx.phonicsInfo}` : ''}
- 학습 어휘: ${ctx.keyWords}
${ctx.educationalContent}
${options?.title ? `\n## 블로그 제목 후보\n${options.title}` : ''}
${options?.topic ? `\n## 블로그 주제/방향\n${options.topic}` : ''}
${kwInstruction}

## 스토리
${ctx.storyText}

## ★ C-Rank 최적화 (블로그 신뢰도·전문성)
- **주제 집중**: "육아/교육/독서" 주제에 집중. 잡담 금지.
- **제목에 핵심 키워드를 앞쪽에 배치** (예: "유아독서 OO동화로 배우는 ...")
- **태그-본문 일치**: 태그로 쓰는 단어가 반드시 본문에도 자연스럽게 등장해야 함
- **태그 7개**: 본문에서 실제로 다루는 키워드 위주 (관련 없는 태그 금지)

## ★ D.I.A.+ 최적화 (문서 품질·체류시간)
- **제목**: 25자 이내. 핵심 키워드 앞쪽 배치. 부모님이 검색할 만한 문구.
- **요약(summary)**: 30~100자. 핵심 내용 간결 요약.
- **섹션 수**: 정확히 7개 (소제목 포함). 모바일에서 스크롤하며 읽기 좋은 구조.
- **섹션 순서**: 도입(책 소개) → 줄거리 → 캐릭터 → 핵심 단어/어휘 → 학습 포인트 → 활용 팁(독서 활동) → 마무리(추천/CTA)
- **각 섹션 본문**: 100~170자 (전체 합계 800~1,200자 최적). 문단을 짧게 끊어 모바일 가독성 확보.
- **본문 키워드**: 핵심 키워드 3~5회 자연스럽게 반복. 과다 사용(7회+)은 스팸 처리됨.
- **연관 키워드**: 메인 키워드 외에 서브 키워드(유사 검색어)를 소제목과 본문에 분산 배치.
- **말투**: 직접 경험한 듯한 생생한 후기체. 부모님이 읽기 편한 친근한 존댓말.
- **체류시간**: 이미지 삽입 위치를 고려해 텍스트와 이미지가 번갈아 나오도록 작성.

## 중요 주의사항
- 제목이 25자를 넘기지 마세요 (25자 이내 필수!)
- 전체 본문 합계가 800~1,200자가 되도록 각 섹션 길이를 조절하세요
- 태그로 쓰는 단어는 반드시 본문 어딘가에 포함되어야 합니다

${HTML_FORMATTING_GUIDE}

JSON 형식으로 응답:
{
  "title": "블로그 제목 (25자 이내, 키워드 앞쪽 배치)",
  "summary": "핵심 요약 (30~100자)",
  "tags": ["태그1", "태그2", "태그3", "태그4", "태그5", "태그6", "태그7"],
  "sections": [
    { "header": "소제목 (키워드/연관키워드 포함 권장)", "text": "<p>HTML 서식이 적용된 본문 100~170자</p>" }
  ]
}

JSON만 응답하세요.`;

    const raw = await generateTextWithGemini(prompt, 3, options?.model);
    const parsed = parseGeminiJSON<{
      title: string;
      summary: string;
      tags: string[];
      sections: Array<{ header: string; text: string }>;
    }>(raw, '블로그 생성 결과를 파싱하는데 실패했습니다.');

    const imagePool = buildImagePool(ctx);
    const sections = mapSectionsWithImages(parsed.sections, imagePool);

    const blogConfig: BlogGenerateConfig = {
      storybookId,
      title: options?.title,
      topic: options?.topic,
      keywords: options?.keywords,
      model: options?.model,
    };

    return {
      id: `blog-${Date.now()}`,
      title: parsed.title,
      summary: parsed.summary,
      tags: parsed.tags,
      sections,
      createdAt: new Date().toISOString(),
      config: blogConfig,
    };
  },

  async regenerateBlogSection(
    storybookId: string,
    blogPostId: string,
    sectionId: string,
    instruction?: string,
    model?: string
  ): Promise<BlogSection> {
    const sb = await R2Repository.getStorybook(storybookId);
    if (!sb) throw new AppError(404, '동화책을 찾을 수 없습니다.');

    const post = sb.blogPosts?.find((b) => b.id === blogPostId);
    if (!post) throw new AppError(404, '블로그 글을 찾을 수 없습니다.');

    const section = post.sections.find((s) => s.id === sectionId);
    if (!section) throw new AppError(404, '블로그 섹션을 찾을 수 없습니다.');

    const ctx = extractContext(sb);

    const prompt = `다음 동화책 블로그 글의 한 섹션을 다시 작성해주세요.

## 동화책 정보
- 제목: ${ctx.title}
- 대상 연령: ${ctx.targetAge}세

## 스토리 요약
${ctx.storyText.slice(0, 500)}

## 블로그 글 전체 흐름
${post.sections.map((s) => `- ${s.header}`).join('\n')}

## 현재 섹션
- 제목: ${section.header}
- 현재 본문: ${section.text.replace(/<[^>]*>/g, '').slice(0, 300)}

${instruction ? `## 추가 지시\n${instruction}` : ''}

## 규칙
- 부모님이 읽기 편한 친근한 말투 (존댓말)
- 100~170자 분량 (3~5문장)
${HTML_SECTION_RULES}

JSON 형식으로 응답:
{ "header": "섹션 제목", "text": "<p>HTML 서식이 적용된 새로운 섹션 본문</p>" }

JSON만 응답하세요.`;

    const raw = await generateTextWithGemini(prompt, 3, model);
    const parsed = parseGeminiJSON<{ header: string; text: string }>(
      raw,
      '블로그 섹션 재생성 결과를 파싱하는데 실패했습니다.'
    );

    return {
      id: section.id,
      header: parsed.header,
      text: parsed.text,
      imageUrl: section.imageUrl,
      imageCaption: section.imageCaption,
    };
  },

  // ─── 블로그 설정 자동 생성 ───

  async generateBlogConfig(storybookId: string): Promise<BlogAutoConfig> {
    const sb = await R2Repository.getStorybook(storybookId);
    if (!sb) throw new AppError(404, '동화책을 찾을 수 없습니다.');

    const ctx = extractContext(sb);
    const isPhonics = sb.type === 'phonics';
    const lang = sb.phonicsConfig?.language === 'english' ? '영어' : '한글';

    const prompt = `당신은 육아/교육 분야 네이버 블로그 SEO 전문가입니다.
다음 동화책 정보를 분석하여 블로그 글의 제목, 주제, SEO 키워드를 추천해주세요.

## 동화책 정보
- 제목: ${ctx.title}
- 대상 연령: ${ctx.targetAge}세
- 등장인물: ${ctx.characters}
${ctx.phonicsInfo ? `- 파닉스: ${ctx.phonicsInfo}` : ''}
- 학습 어휘: ${ctx.keyWords}
${ctx.educationalContent}

## 규칙
1. 블로그 제목: 15~40자, 부모님이 검색할 만한 제목 (예: "5세 아이와 함께 읽는 OO 동화책 추천")
2. 주제/방향: 부모님 타겟, 2~3문장
3. 키워드 후보: 반드시 아래 카테고리별로 총 15개 이상 생성

   **A. 육아/교육 인기 키워드 (5개)** — 검색량이 많은 대중적 키워드
   예시: 유아독서, 아이와놀기, 엄마표영어, 유아교육, 홈스쿨링, 어린이책추천, 그림책추천, 독서습관, 유아영어, 파닉스교재
   ${isPhonics ? `파닉스/영어교육 관련: ${lang}파닉스, 파닉스학습, 영어동화책, 알파벳학습, 파닉스추천` : ''}

   **B. 동화책/독서 관련 키워드 (5개)** — 이 책의 특성과 연결
   예시: [대상연령]세 동화책, [장르] 동화, [교훈] 배우는 책, 그림책 읽어주기, 잠자리동화

   **C. 롱테일 키워드 (5개)** — 구체적이고 경쟁이 낮은 키워드
   예시: [대상연령]세 독서활동, [주제] 동화책 추천, 아이 [주제] 가르치기, [캐릭터명] 동화

   - 모든 키워드는 실제 네이버에서 부모님들이 검색할 법한 자연스러운 한국어
   - 1~4단어 (너무 길지 않게)

JSON 형식으로 응답:
{
  "title": "블로그 제목",
  "topic": "블로그 주제 및 방향 설명",
  "keywordCandidates": ["인기키워드1", "인기키워드2", ..., "롱테일키워드1", ...]
}

JSON만 응답하세요.`;

    const raw = await generateTextWithGemini(prompt);
    const parsed = parseGeminiJSON<{
      title: string;
      topic: string;
      keywordCandidates: string[];
    }>(raw, '블로그 설정 자동 생성에 실패했습니다.');

    // 네이버 키워드 도구로 검색량/경쟁도 조회
    const candidates = parsed.keywordCandidates.slice(0, 15);
    let keywordResults: NaverKeywordResult[];

    try {
      const items = await searchKeywordTool(candidates);
      const mapped = items.map(mapNaverItemToResult);
      keywordResults = sortAndFilterKeywords(mapped);
    } catch {
      keywordResults = [];
    }

    // 키워드 부족 시 Gemini fallback → 후보 fallback
    if (keywordResults.length < 5) {
      const fallbackPrompt = `네이버 블로그 SEO 키워드 전문가로서, "${ctx.title}" (${ctx.targetAge}세 대상 ${isPhonics ? '파닉스' : '동화'}책) 관련 블로그 글에 사용할 최적의 키워드 7개를 추천하세요.

조건:
- 육아/교육/독서 카테고리에서 네이버 검색량이 높은 키워드
- 실제 부모님들이 네이버에 검색하는 키워드
- 예시: 유아독서, 그림책추천, ${isPhonics ? '파닉스교재, 엄마표영어' : '잠자리동화, 어린이책추천'}, 독서습관 등

JSON 배열만 응답: ["키워드1", "키워드2", ...]`;

      try {
        const fallbackRaw = await generateTextWithGemini(fallbackPrompt);
        const fallbackKws = parseGeminiJSON<string[]>(fallbackRaw, '');
        keywordResults = fillKeywordsFromFallback(keywordResults, fallbackKws);
      } catch {
        keywordResults = fillKeywordsFromFallback(keywordResults, candidates);
      }
    }

    return {
      title: parsed.title,
      topic: parsed.topic,
      keywords: keywordResults,
    };
  },

  // ─── 네이버 키워드 검색 (검색광고 API) ───

  async searchKeywords(query: string): Promise<NaverKeywordResult[]> {
    if (!query?.trim()) return [];
    const keywords = query
      .trim()
      .split(/[,\s]+/)
      .filter(Boolean);
    const items = await searchKeywordTool(keywords);
    return items.map(mapNaverItemToResult).sort((a, b) => b.totalSearch - a.totalSearch);
  },

  // ─── 카드뉴스 생성 ───

  async generateCardNews(
    storybookId: string,
    options?: {
      colorTheme?: string;
      slideCount?: number;
      source?: { type: 'storybook' } | { type: 'blog'; blogPostId: string };
    }
  ): Promise<CardNewsProject> {
    const sb = await R2Repository.getStorybook(storybookId);
    if (!sb) throw new AppError(404, '동화책을 찾을 수 없습니다.');

    const ctx = extractContext(sb);
    const theme = CARD_NEWS_THEMES.find((t) => t.id === options?.colorTheme) ?? CARD_NEWS_THEMES[0];
    const slideCount = options?.slideCount ?? 8;
    const bodyCount = Math.max(slideCount - 2, 3);

    // 소스에 따른 콘텐츠 섹션 생성
    let contentSection: string;
    let blogImages: string[] = [];

    if (options?.source?.type === 'blog') {
      const blogPostId = (options.source as { type: 'blog'; blogPostId: string }).blogPostId;
      const blogPost = sb.blogPosts?.find((b) => b.id === blogPostId);
      if (!blogPost) throw new AppError(404, '블로그 글을 찾을 수 없습니다.');

      blogImages = extractBlogImages(blogPost);
      const plainSections = blogPost.sections
        .map((s) => `[${s.header}]\n${s.text.replace(/<[^>]*>/g, '')}`)
        .join('\n\n');
      contentSection = `## 블로그 글 (이 내용을 카드뉴스로 변환)
- 제목: ${blogPost.title}
- 요약: ${blogPost.summary}
- 태그: ${blogPost.tags.join(', ')}

${plainSections}`;
    } else {
      contentSection = `## 동화책 정보
- 제목: ${ctx.title}
- 대상 연령: ${ctx.targetAge}세
- 등장인물: ${ctx.characters}
${ctx.phonicsInfo ? `- 파닉스: ${ctx.phonicsInfo}` : ''}
- 학습 어휘: ${ctx.keyWords}
${ctx.educationalContent}

## 스토리
${ctx.storyText}`;
    }

    const prompt = `당신은 유아 교육 콘텐츠 마케터입니다.
다음 내용을 바탕으로 인스타그램 카드뉴스 슬라이드를 만들어주세요.

${contentSection}

## 작성 규칙
1. 총 ${slideCount}장 슬라이드 (정확히)
2. 구성: cover(1장) → body(${bodyCount}장) → outro(1장)
3. cover: 책 제목 + 흥미를 끄는 부제
4. body: 핵심 내용을 한 장에 1개 메시지로 전달
5. outro: 마무리 CTA (좋아요/팔로우 유도)
6. headline은 짧고 임팩트 있게 (15자 이내)
7. subtext는 1~2문장

JSON 형식으로 응답:
{
  "title": "카드뉴스 프로젝트 제목",
  "slides": [
    { "slideType": "cover|body|outro", "headline": "제목", "subtext": "부제/본문" }
  ]
}

JSON만 응답하세요.`;

    const raw = await generateTextWithGemini(prompt);
    const parsed = parseGeminiJSON<{
      title: string;
      slides: Array<{ slideType: string; headline: string; subtext: string }>;
    }>(raw, '카드뉴스 생성 결과를 파싱하는데 실패했습니다.');

    const slides = assignImagesToSlides(parsed.slides, ctx, blogImages, theme);

    return {
      id: `cn-${Date.now()}`,
      title: parsed.title,
      colorTheme: theme.id,
      slides,
      createdAt: new Date().toISOString(),
    };
  },
};
