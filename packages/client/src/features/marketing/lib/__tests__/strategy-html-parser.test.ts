// jsdom env is default in this vitest config — DOMParser is available
import { describe, it, expect } from 'vitest';
import { parseStrategyHtml } from '../strategy-html-parser';

const INLINE_SCRIPT_HTML = `<!DOCTYPE html>
<html><head></head><body>
<script>
const kwData=[["맛집 추천",1200,3800,5000,"낮음","A-음식"],["강남 맛집",800,2200,3000,"높음","gold"]];
const topics=[["A-01","A","맛집 베스트 10","정보 제공 각도","맛집,추천",""],["A-02","A","강남 핫플 리뷰","리뷰 각도","강남,핫플",""]];
const ytRows=[["A-01","done"]];
</script>
<div class="cycle-item">
  <span class="cycle-letter">A</span>
  <span class="cycle-name">음식</span>
  <span class="cycle-desc">음식 관련 콘텐츠</span>
</div>
</body></html>`;

const TABLE_HTML = `<!DOCTYPE html>
<html><head></head><body>
<table class="kw-table">
  <thead><tr><th>키워드</th><th>검색량</th><th>PC</th><th>경쟁</th><th>분류</th></tr></thead>
  <tbody>
    <tr data-cat="food">
      <td>맛집 추천</td>
      <td>5,000</td>
      <td>1,200</td>
      <td><span class="comp-badge comp-low">낮음</span></td>
      <td><span class="sbadge">음식</span></td>
    </tr>
    <tr data-cat="gold">
      <td>강남 맛집</td>
      <td>3,000</td>
      <td>800</td>
      <td><span class="comp-badge comp-high">높음</span></td>
      <td><span class="sbadge s-gold">골드</span></td>
    </tr>
  </tbody>
</table>
<div class="cycle-item">
  <span class="cycle-letter">A</span>
  <span class="cycle-name">음식</span>
  <span class="cycle-desc">음식 카테고리</span>
</div>
</body></html>`;

describe('parseStrategyHtml — inline script path', () => {
  it('extracts keywords from inline kwData script', () => {
    const result = parseStrategyHtml(INLINE_SCRIPT_HTML);
    expect(result.keywords).toHaveLength(2);
    expect(result.keywords[0].keyword).toBe('맛집 추천');
    expect(result.keywords[0].totalSearch).toBe(5000);
    expect(result.keywords[0].competition).toBe('low');
    expect(result.keywords[1].keyword).toBe('강남 맛집');
    expect(result.keywords[1].competition).toBe('high');
    expect(result.keywords[1].isGolden).toBe(true);
  });

  it('extracts topics from inline topics script', () => {
    const result = parseStrategyHtml(INLINE_SCRIPT_HTML);
    const cat = result.categories.find((c) => c.code === 'A');
    expect(cat).toBeTruthy();
    expect(cat!.topics).toHaveLength(2);
    expect(cat!.topics[0].title).toBe('맛집 베스트 10');
    // ytRows marks A-01 as done
    expect(cat!.topics[0].status).toBe('done');
    expect(cat!.topics[1].status).toBe('new');
  });

  it('extracts category from .cycle-item', () => {
    const result = parseStrategyHtml(INLINE_SCRIPT_HTML);
    expect(result.categories[0].name).toBe('음식');
    expect(result.categories[0].description).toBe('음식 관련 콘텐츠');
  });
});

describe('parseStrategyHtml — table DOM path', () => {
  it('extracts keywords from kw-table', () => {
    const result = parseStrategyHtml(TABLE_HTML);
    expect(result.keywords.length).toBeGreaterThanOrEqual(2);
    const first = result.keywords.find((k) => k.keyword === '맛집 추천');
    expect(first).toBeTruthy();
    expect(first!.totalSearch).toBe(5000);
    expect(first!.competition).toBe('low');
  });

  it('extracts cycle categories from .cycle-item', () => {
    const result = parseStrategyHtml(TABLE_HTML);
    expect(result.categories[0].code).toBe('A');
    expect(result.categories[0].name).toBe('음식');
  });
});

describe('parseStrategyHtml — error cases', () => {
  it('throws on unrecognized HTML format', () => {
    expect(() => parseStrategyHtml('<html><body><p>hello</p></body></html>')).toThrow();
  });
});
