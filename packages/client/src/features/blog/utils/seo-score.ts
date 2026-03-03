import type { BlogPost } from '@tangobook/shared';

export interface SeoScoreItem {
  label: string;
  category: 'C-Rank' | 'D.I.A.+';
  score: number;
  maxScore: number;
  tip?: string;
}

export interface SeoScoreDetail {
  total: number;
  items: SeoScoreItem[];
}

/**
 * 네이버 블로그 SEO 최적화 점수 (100점 만점)
 *
 * C-Rank (블로그 신뢰도/전문성) — 글 자체에서 측정 가능한 대리 지표
 * - 주제 집중도: 키워드가 제목·본문에 일관되게 등장
 * - 태그 연관성: 본문 내용과 태그의 일치
 *
 * D.I.A.+ (개별 문서 품질) — 글 품질 지표
 * - 제목: 25자 이내, 키워드 앞쪽 배치
 * - 본문 길이: 적절한 분량 (체류시간 확보)
 * - 이미지: 6~13개 (가독성/체류시간)
 * - 키워드: 본문 내 3~5회 자연스럽게
 * - 소제목: 문단 구조화 (모바일 가독성)
 * - 연관 키워드: 서브 키워드 활용
 */
export function computeSeoScore(post: BlogPost, keywords?: string[]): SeoScoreDetail {
  const kws = (keywords ?? post.config?.keywords ?? post.tags ?? []).map((k) => k.toLowerCase());
  const items: SeoScoreItem[] = [];
  const body = post.sections
    .map((s) => s.text)
    .join(' ')
    .toLowerCase();
  const totalContent = post.sections.map((s) => s.text).join('').length;

  // ═══ C-Rank 영역 (30점) ═══

  // 1. 제목 키워드 배치 (앞쪽 배치 우대) — 15점
  let titleKwScore = 0;
  if (kws.length > 0) {
    const lowerTitle = post.title.toLowerCase();
    const hasKw = kws.some((kw) => lowerTitle.includes(kw));
    if (hasKw) {
      const earlyKw = kws.some((kw) => {
        const idx = lowerTitle.indexOf(kw);
        return idx >= 0 && idx < lowerTitle.length / 2;
      });
      titleKwScore = earlyKw ? 15 : 10;
    }
  }
  items.push({
    label: '제목 키워드 배치',
    category: 'C-Rank',
    score: titleKwScore,
    maxScore: 15,
    tip:
      titleKwScore === 0 && kws.length > 0
        ? '제목 앞쪽에 핵심 키워드를 배치하세요'
        : titleKwScore === 10
          ? '키워드를 제목 앞쪽으로 이동하면 더 효과적입니다'
          : undefined,
  });

  // 2. 태그-본문 연관성 — 15점
  let tagRelevanceScore = 0;
  if (post.tags.length > 0) {
    const matchedTags = post.tags.filter((tag) => body.includes(tag.toLowerCase()));
    const ratio = matchedTags.length / post.tags.length;
    if (ratio >= 0.7 && post.tags.length >= 5) tagRelevanceScore = 15;
    else if (ratio >= 0.5 && post.tags.length >= 3) tagRelevanceScore = 10;
    else if (ratio >= 0.3) tagRelevanceScore = 5;
  }
  items.push({
    label: '태그-본문 연관성',
    category: 'C-Rank',
    score: tagRelevanceScore,
    maxScore: 15,
    tip:
      post.tags.length < 5
        ? `태그 ${post.tags.length}개 — 5개 이상 + 본문 내용과 일치하는 태그 권장`
        : tagRelevanceScore < 10
          ? '본문에서 실제 다루는 내용을 태그로 설정하세요'
          : undefined,
  });

  // ═══ D.I.A.+ 영역 (70점) ═══

  // 3. 제목 길이 (25자 이내) — 10점
  const titleLen = post.title.length;
  let titleLenScore = 3;
  if (titleLen > 0 && titleLen <= 25) titleLenScore = 10;
  else if (titleLen <= 35) titleLenScore = 7;
  else if (titleLen <= 45) titleLenScore = 4;
  items.push({
    label: '제목 길이',
    category: 'D.I.A.+',
    score: titleLenScore,
    maxScore: 10,
    tip: titleLen > 25 ? `현재 ${titleLen}자 — 25자 이내 권장` : undefined,
  });

  // 4. 본문 길이 (800~1,200자 최적) — 15점
  let contentScore = 0;
  if (totalContent >= 800 && totalContent <= 1200) contentScore = 15;
  else if (totalContent >= 600 && totalContent <= 1900) contentScore = 10;
  else if (totalContent >= 400 && totalContent <= 2500) contentScore = 5;
  items.push({
    label: '본문 길이',
    category: 'D.I.A.+',
    score: contentScore,
    maxScore: 15,
    tip:
      totalContent < 600
        ? `현재 ${totalContent}자 — 600자 이상 작성하여 체류시간을 확보하세요`
        : totalContent > 1900
          ? `현재 ${totalContent}자 — 너무 길면 이탈률이 높아집니다`
          : undefined,
  });

  // 5. 이미지 수 (6~13개) — 15점
  const imageCount = post.sections.filter((s) => s.imageUrl).length;
  let imageScore = 0;
  if (imageCount >= 6 && imageCount <= 13) imageScore = 15;
  else if (imageCount >= 4) imageScore = 10;
  else if (imageCount >= 2) imageScore = 5;
  items.push({
    label: '이미지 수',
    category: 'D.I.A.+',
    score: imageScore,
    maxScore: 15,
    tip:
      imageCount < 6 ? `현재 ${imageCount}개 — 6~13개로 가독성과 체류시간을 높이세요` : undefined,
  });

  // 6. 키워드 빈도 (3~5회) — 10점
  let kwCountScore = 0;
  let kwTotalOccur = 0;
  if (kws.length > 0) {
    kwTotalOccur = kws.reduce((sum, kw) => sum + countOccurrences(body, kw), 0);
    if (kwTotalOccur >= 3 && kwTotalOccur <= 5) kwCountScore = 10;
    else if (kwTotalOccur >= 2 && kwTotalOccur <= 7) kwCountScore = 7;
    else if (kwTotalOccur >= 1) kwCountScore = 3;
  }
  items.push({
    label: '키워드 빈도',
    category: 'D.I.A.+',
    score: kwCountScore,
    maxScore: 10,
    tip:
      kws.length === 0
        ? undefined
        : kwTotalOccur < 3
          ? `현재 ${kwTotalOccur}회 — 3~5회 자연스럽게 반복`
          : kwTotalOccur > 7
            ? `현재 ${kwTotalOccur}회 — 키워드 스터핑은 페널티 대상`
            : undefined,
  });

  // 7. 소제목 구조 (모바일 가독성) — 10점
  const sectionCount = post.sections.length;
  let sectionScore = 0;
  if (sectionCount >= 3 && sectionCount <= 7) sectionScore = 10;
  else if (sectionCount >= 2) sectionScore = 5;
  items.push({
    label: '소제목 구조',
    category: 'D.I.A.+',
    score: sectionScore,
    maxScore: 10,
    tip:
      sectionCount < 3
        ? '소제목 3개 이상으로 문단을 구조화하세요 (모바일 가독성)'
        : sectionCount > 7
          ? '소제목이 너무 많으면 산만할 수 있습니다'
          : undefined,
  });

  // 8. 연관 키워드 활용 — 10점
  let subKwScore = 0;
  if (kws.length > 0) {
    const headersWithKw = post.sections.filter((s) =>
      kws.some((kw) => s.header.toLowerCase().includes(kw))
    ).length;
    const tagsInBody = post.tags.filter((t) => body.includes(t.toLowerCase())).length;
    if (headersWithKw >= 2 && tagsInBody >= 3) subKwScore = 10;
    else if (headersWithKw >= 1 || tagsInBody >= 2) subKwScore = 5;
  }
  items.push({
    label: '연관 키워드 분포',
    category: 'D.I.A.+',
    score: subKwScore,
    maxScore: 10,
    tip:
      subKwScore < 10 && kws.length > 0
        ? '소제목과 본문에 연관 키워드(서브 키워드)를 자연스럽게 분포시키세요'
        : undefined,
  });

  const total = items.reduce((sum, item) => sum + item.score, 0);
  return { total: Math.min(100, total), items };
}

function countOccurrences(text: string, keyword: string): number {
  if (!keyword) return 0;
  let count = 0;
  let pos = 0;
  while ((pos = text.indexOf(keyword, pos)) !== -1) {
    count++;
    pos += keyword.length;
  }
  return count;
}
