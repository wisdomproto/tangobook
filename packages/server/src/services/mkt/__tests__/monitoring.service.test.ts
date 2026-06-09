/**
 * TDD tests for the monitoring service's PURE units — the 3 scrape mappers
 * (지식인 / N블로그 / 구글블로그) and `formatViews`. Faithful to the CF
 * `monitoring/search/{naver,naver-blog,google-blog,youtube}/route.ts` selectors
 * and the YouTube view-count format thresholds.
 *
 * Each mapper takes a `cheerio.load(html)` `$` + a `max` cap, so it is pure +
 * fully testable with fixture HTML (no network).
 */

import { describe, it, expect } from 'vitest';
import * as cheerio from 'cheerio';
import {
  mapJisikinResults,
  mapNaverBlogResults,
  mapGoogleBlogResults,
  formatViews,
} from '../monitoring.service.js';

const load = (html: string) => cheerio.load(html);

// ── mapJisikinResults ─────────────────────────────────────────────────────────

describe('mapJisikinResults', () => {
  it('keeps only kin.naver.com links and maps to FeedItem', () => {
    const html = `<ul class="basic1">
      <li class="question"><a class="title" href="https://kin.naver.com/qna/detail?d1id=1">제목1</a><dd class="txt">내용1</dd></li>
      <li class="question"><a class="title" href="https://ad.example.com/x">광고</a><dd class="txt">광고내용</dd></li>
    </ul>`;
    const out = mapJisikinResults(load(html), 10);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      platform: 'naver_jisikin',
      title: '제목1',
      snippet: '내용1',
      author: '지식인',
      language: 'ko',
      url: expect.stringContaining('kin.naver.com'),
    });
  });

  it('respects the max cap', () => {
    const rows = Array.from({ length: 5 })
      .map(
        (_, i) =>
          `<li class="question"><a class="title" href="https://kin.naver.com/qna/detail?d1id=${i}">제목${i}</a><dd class="txt">내용${i}</dd></li>`
      )
      .join('');
    const out = mapJisikinResults(load(`<ul class="basic1">${rows}</ul>`), 3);
    expect(out).toHaveLength(3);
  });

  it('passes through an absolute kin.naver.com http URL unchanged', () => {
    const html = `<ul class="basic1"><li class="question"><a class="title" href="https://kin.naver.com/qna/detail?d1id=9">절대경로</a><dd class="txt">내용</dd></li></ul>`;
    const out = mapJisikinResults(load(html), 10);
    expect(out).toHaveLength(1);
    expect(out[0].url).toBe('https://kin.naver.com/qna/detail?d1id=9');
  });

  it('falls back to scanning qna/detail anchors when no primary rows match', () => {
    const html = `<div>
      <a href="https://kin.naver.com/qna/detail?d1id=42">지식인 질문 제목입니다</a>
      <a href="https://other.com/x">무관링크</a>
    </div>`;
    const out = mapJisikinResults(load(html), 10);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      platform: 'naver_jisikin',
      url: expect.stringContaining('kin.naver.com/qna/detail'),
    });
  });
});

// ── mapNaverBlogResults ───────────────────────────────────────────────────────

describe('mapNaverBlogResults', () => {
  it('keeps only blog.naver.com links and maps to FeedItem', () => {
    const html = `<ul>
      <li class="bx"><a class="title_link" href="https://blog.naver.com/u/123">블로그제목</a><div class="dsc_area">요약설명</div><span class="sub_txt">작성자A</span></li>
      <li class="bx"><a class="title_link" href="https://tistory.com/x">타사블로그</a><div class="dsc_area">무관</div></li>
    </ul>`;
    const out = mapNaverBlogResults(load(html), 10);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      platform: 'naver_blog',
      title: '블로그제목',
      author: '작성자A',
      language: 'ko',
      url: expect.stringContaining('blog.naver.com'),
    });
  });

  it('respects the max cap', () => {
    const rows = Array.from({ length: 6 })
      .map(
        (_, i) =>
          `<li class="bx"><a class="title_link" href="https://blog.naver.com/u/${i}">제목${i}</a><div class="dsc_area">설명${i}</div></li>`
      )
      .join('');
    const out = mapNaverBlogResults(load(`<ul>${rows}</ul>`), 2);
    expect(out).toHaveLength(2);
  });

  it('falls back to scanning blog.naver.com anchors when no primary rows match', () => {
    const html = `<div>
      <a href="https://blog.naver.com/writer/9988">네이버 블로그 포스트 제목</a>
      <a href="https://google.com/x">무관</a>
    </div>`;
    const out = mapNaverBlogResults(load(html), 10);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ platform: 'naver_blog', author: '블로거' });
    expect(out[0].url).toContain('blog.naver.com');
  });
});

// ── mapGoogleBlogResults ──────────────────────────────────────────────────────

describe('mapGoogleBlogResults', () => {
  it('excludes google.com self-links and maps to FeedItem (wordpress)', () => {
    const html = `<div>
      <div class="g"><h3>외부글 제목</h3><a href="https://example.com/post">link</a><div class="VwiC3b">검색요약</div><cite>example.com</cite></div>
      <div class="g"><h3>구글 자체</h3><a href="https://google.com/search?q=x">self</a><div class="VwiC3b">무관</div></div>
    </div>`;
    const out = mapGoogleBlogResults(load(html), 10, 'ko');
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      platform: 'wordpress',
      title: '외부글 제목',
      snippet: '검색요약',
      author: 'example.com',
      language: 'ko',
      url: 'https://example.com/post',
    });
  });

  it('respects the max cap', () => {
    const rows = Array.from({ length: 5 })
      .map(
        (_, i) =>
          `<div class="g"><h3>제목${i}</h3><a href="https://site${i}.com/p">l</a><div class="VwiC3b">설명${i}</div></div>`
      )
      .join('');
    const out = mapGoogleBlogResults(load(`<div>${rows}</div>`), 3, 'en');
    expect(out).toHaveLength(3);
    expect(out[0].language).toBe('en');
  });

  it('falls back to the URL hostname when no cite is present', () => {
    const html = `<div class="g"><h3>제목없는출처</h3><a href="https://myblog.dev/article">l</a><div class="VwiC3b">설명</div></div>`;
    const out = mapGoogleBlogResults(load(html), 10, 'ko');
    expect(out).toHaveLength(1);
    expect(out[0].author).toBe('myblog.dev');
  });
});

// ── formatViews — CF youtube route thresholds, EXACT ───────────────────────────

describe('formatViews', () => {
  it('returns the raw string below 1,000', () => {
    expect(formatViews(0)).toBe('0');
    expect(formatViews(999)).toBe('999');
  });

  it('uses comma grouping (toLocaleString) for 1,000–9,999', () => {
    expect(formatViews(1000)).toBe((1000).toLocaleString());
    expect(formatViews(9999)).toBe((9999).toLocaleString());
  });

  it('uses 만 (with one decimal) for 10,000 to <100,000,000', () => {
    expect(formatViews(10000)).toBe('1.0만');
    expect(formatViews(15000)).toBe('1.5만');
    expect(formatViews(99990000)).toBe('9999.0만');
  });

  it('uses 억 (with one decimal) at and above 100,000,000', () => {
    expect(formatViews(100000000)).toBe('1.0억');
    expect(formatViews(250000000)).toBe('2.5억');
  });
});
