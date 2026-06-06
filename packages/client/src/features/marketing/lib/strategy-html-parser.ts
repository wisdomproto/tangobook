/**
 * 마케팅 전략 HTML에서 키워드, 카테고리, 주제를 추출합니다.
 *
 * 원본(contentflow)은 `cheerio`(서버 전용)를 사용했으나,
 * 클라이언트 번들에서는 `DOMParser` / `querySelectorAll`로 대체합니다.
 *
 * 데이터 소스 우선순위:
 * 1. <script> 내 JS 배열 (kwData, topics) — 동적 렌더링 HTML용
 * 2. <table> 내 정적 HTML 행 — 서버 렌더링 HTML용
 *
 * 출력 형태(ImportedKeyword[], ImportedCategory[])는 원본과 동일합니다.
 */
import type { ImportedKeyword, ImportedCategory, ImportedTopic } from '../types/analytics';
import { generateId } from './utils';

export interface ParseResult {
  keywords: ImportedKeyword[];
  categories: ImportedCategory[];
}

export function parseStrategyHtml(html: string): ParseResult {
  // 지원하는 HTML 형식인지 검증
  const hasKwTable = html.includes('class="kw-table"') || html.includes("class='kw-table'");
  const hasTopicTable =
    html.includes('class="topic-table"') || html.includes("class='topic-table'");
  const hasCycleItems = html.includes('class="cycle-item"') || html.includes("class='cycle-item'");
  const hasScriptData = html.includes('const kwData=') || html.includes('const topics=');

  if (!hasKwTable && !hasTopicTable && !hasCycleItems && !hasScriptData) {
    throw new Error('지원하지 않는 HTML 형식입니다. 마케팅 전략 HTML 파일이 필요합니다.');
  }

  const topicsByCategory: Record<string, ImportedTopic[]> = {};

  // === 1단계: <script> 내 JS 배열에서 추출 시도 ===
  let keywords = parseKeywordsFromScript(html);
  const scriptTopics = parseTopicsFromScript(html);
  for (const [catCode, topics] of Object.entries(scriptTopics)) {
    topicsByCategory[catCode] = topics;
  }

  // === 2단계: JS 배열이 없으면 정적 HTML 테이블에서 추출 ===
  // Parse the HTML into a document for DOM queries
  const doc = parseDom(html);

  if (keywords.length === 0) {
    keywords = parseKeywordsFromTable(doc);
  }
  if (Object.keys(topicsByCategory).length === 0) {
    const tableTopics = parseTopicsFromTable(doc);
    for (const [catCode, topics] of Object.entries(tableTopics)) {
      topicsByCategory[catCode] = topics;
    }
  }

  // === 3단계: 카테고리 순환 (.cycle-item) 파싱 ===
  const categories: ImportedCategory[] = [];

  const cycleItems = doc.querySelectorAll('.cycle-item');
  cycleItems.forEach((el) => {
    const code = el.querySelector('.cycle-letter')?.textContent?.trim() ?? '';
    const name = el.querySelector('.cycle-name')?.textContent?.trim() ?? '';
    const description = el.querySelector('.cycle-desc')?.textContent?.trim() ?? '';
    if (!code || !name) return;

    categories.push({
      code,
      name,
      description,
      topics: topicsByCategory[code] ?? [],
    });
  });

  // 카테고리 없이 주제만 있는 경우 fallback
  if (categories.length === 0 && Object.keys(topicsByCategory).length > 0) {
    for (const [code, topics] of Object.entries(topicsByCategory)) {
      categories.push({
        code,
        name: code,
        description: '',
        topics,
      });
    }
  }

  return { keywords, categories };
}

// ---- DOM helper ----

function parseDom(html: string): Document {
  if (typeof DOMParser !== 'undefined') {
    return new DOMParser().parseFromString(html, 'text/html');
  }
  // jsdom test environment — document.implementation is available
  return document.implementation.createHTMLDocument('');
}

// ---- JS 배열 파싱 (regex — browser-safe, no eval) ----

function parseKeywordsFromScript(html: string): ImportedKeyword[] {
  // const kwData=[[...],[...],...]; 패턴에서 배열 추출
  const match = html.match(/const\s+kwData\s*=\s*(\[[\s\S]*?\]);/);
  if (!match) return [];

  try {
    const data = JSON.parse(match[1]) as unknown[][];
    return data
      .map((row) => {
        // [키워드, PC검색, 모바일검색, 총검색, 경쟁도, 분류태그]
        const keyword = String(row[0] ?? '');
        const totalSearch = Number(row[3]) || 0;
        const compStr = String(row[4] ?? '');
        const tags = String(row[5] ?? '');

        let competition: 'high' | 'medium' | 'low' = 'medium';
        if (compStr === '높음') competition = 'high';
        else if (compStr === '낮음') competition = 'low';

        const isGolden = tags.includes('gold');
        const category = tags || undefined;

        return { keyword, totalSearch, competition, isGolden, category };
      })
      .filter((k) => k.keyword);
  } catch {
    return [];
  }
}

function parseTopicsFromScript(html: string): Record<string, ImportedTopic[]> {
  // const topics=[[...],[...],...]; 패턴에서 배열 추출
  const match = html.match(/const\s+topics\s*=\s*(\[[\s\S]*?\]);/);
  if (!match) return {};

  const result: Record<string, ImportedTopic[]> = {};

  try {
    const data = JSON.parse(match[1]) as string[][];
    for (const row of data) {
      // [ID, 카테고리코드, 제목, 앵글, 키워드문자열, 출처]
      const id = String(row[0] ?? '');
      const catCode = String(row[1] ?? '');
      const title = String(row[2] ?? '');
      const angle = String(row[3] ?? '');
      const kwString = String(row[4] ?? '');
      if (!title || !catCode) continue;

      const keywords = kwString
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      if (!result[catCode]) result[catCode] = [];
      result[catCode].push({
        id: id || generateId('topic'),
        title,
        angle,
        keywords,
        channels: [],
        status: 'new',
      });
    }

    // ytRows에서 상태 업데이트
    const ytMatch = html.match(/const\s+ytRows\s*=\s*(\[[\s\S]*?\]);/);
    if (ytMatch) {
      try {
        const ytData = JSON.parse(ytMatch[1]) as string[][];
        for (const row of ytData) {
          const topicId = String(row[0] ?? '');
          const status = String(row[1] ?? 'new');
          const catCode = topicId.charAt(0);

          if (result[catCode]) {
            const topic = result[catCode].find((t) => t.id === topicId);
            if (topic) {
              topic.status = status as 'new' | 'done' | 'similar';
            }
          }
        }
      } catch {
        /* ignore */
      }
    }
  } catch {
    return {};
  }

  return result;
}

// ---- 정적 HTML 테이블 파싱 (fallback, DOMParser) ----

function parseKeywordsFromTable(doc: Document): ImportedKeyword[] {
  const keywords: ImportedKeyword[] = [];

  const rows = doc.querySelectorAll('table.kw-table tbody tr');
  rows.forEach((row) => {
    const cells = row.querySelectorAll('td');
    if (cells.length < 4) return;

    const keyword = cells[0]?.textContent?.trim() ?? '';
    if (!keyword) return;

    const searchText = (cells[1]?.textContent ?? '').replace(/,/g, '').trim();
    const totalSearch = parseInt(searchText, 10) || 0;

    const compEl = cells[3]?.querySelector('.comp-badge');
    let competition: 'high' | 'medium' | 'low' = 'medium';
    if (compEl?.classList.contains('comp-high')) competition = 'high';
    else if (compEl?.classList.contains('comp-low')) competition = 'low';

    const isGolden =
      row.querySelector('.s-gold') !== null || row.getAttribute('data-cat') === 'gold';

    const categoryBadge = row.querySelector('.sbadge')?.textContent?.trim() ?? '';

    keywords.push({
      keyword,
      totalSearch,
      competition,
      isGolden,
      category: categoryBadge || undefined,
    });
  });

  return keywords;
}

function parseTopicsFromTable(doc: Document): Record<string, ImportedTopic[]> {
  const result: Record<string, ImportedTopic[]> = {};

  const rows = doc.querySelectorAll('table.topic-table tbody tr');
  rows.forEach((row) => {
    const cells = row.querySelectorAll('td');
    if (cells.length < 3) return;

    const catPill = cells[1]?.querySelector('.cat-pill');
    const catCode = (catPill?.textContent?.trim() ?? '').charAt(0);
    const title = cells[2]?.textContent?.trim() ?? '';
    if (!title) return;

    const kwTags: string[] = [];
    cells[3]?.querySelectorAll('.kw-tag').forEach((el) => {
      const t = el.textContent?.trim();
      if (t) kwTags.push(t);
    });

    let status: 'new' | 'done' | 'similar' = 'new';
    if (row.querySelector('.s-done')) status = 'done';
    else if (row.querySelector('.s-similar')) status = 'similar';

    if (!result[catCode]) result[catCode] = [];
    result[catCode].push({
      id: generateId('topic'),
      title,
      keywords: kwTags,
      channels: [],
      status,
    });
  });

  return result;
}
