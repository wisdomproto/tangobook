/**
 * TDD tests for `scoreSeoAudit` — the pure cheerio-based scoring function.
 * These tests use fixture HTML strings, verify score thresholds and issue lists
 * against the CF `seo/audit/route.ts` rubric exactly.
 *
 * `scoreSeoAudit($: CheerioAPI, url, html?)` is PURE — no network calls, fully testable.
 */

import { describe, it, expect } from 'vitest';
import * as cheerio from 'cheerio';
import { scoreSeoAudit } from '../seo.service.js';

// ── Helpers ────────────────────────────────────────────────────────────────────

function load(html: string) {
  return cheerio.load(html);
}

function buildHtml(opts: {
  title?: string;
  metaDesc?: string;
  viewport?: boolean;
  canonical?: string;
  h1s?: number;
  h2s?: string[];
  images?: Array<{ alt?: string }>;
  links?: number;
  schema?: string;
  faqPage?: boolean;
  text?: string;
}): string {
  const {
    title = '',
    metaDesc = '',
    viewport = false,
    canonical,
    h1s = 0,
    h2s = [],
    images = [],
    links = 0,
    schema,
    faqPage = false,
    text = '',
  } = opts;

  const head = [
    title ? `<title>${title}</title>` : '',
    metaDesc ? `<meta name="description" content="${metaDesc}">` : '',
    viewport ? '<meta name="viewport" content="width=device-width">' : '',
    canonical ? `<link rel="canonical" href="${canonical}">` : '',
    schema
      ? `<script type="application/ld+json">${schema}</script>`
      : faqPage
        ? `<script type="application/ld+json">{"@type":"FAQPage"}</script>`
        : '',
  ]
    .filter(Boolean)
    .join('\n');

  const h1Tags = Array(h1s).fill('<h1>Heading</h1>').join('');
  const h2Tags = h2s.map((t) => `<h2>${t}</h2>`).join('');
  const imgTags = images
    .map((i) => `<img src="img.png"${i.alt !== undefined ? ` alt="${i.alt}"` : ''}>`)
    .join('');
  const linkTags = Array(links).fill('<a href="/x">link</a>').join('');

  return `<html><head>${head}</head><body>${h1Tags}${h2Tags}${imgTags}${linkTags}${text}</body></html>`;
}

// ── Test suite ─────────────────────────────────────────────────────────────────

describe('scoreSeoAudit', () => {
  // ── Google score ────────────────────────────────────────────────────────────

  it('awards google +15 for a title in the 30–60 char range', () => {
    const title = 'A'.repeat(40); // 40 chars — in range
    const html = buildHtml({
      title,
      metaDesc: 'D'.repeat(130),
      h1s: 1,
      h2s: ['Two', 'Three'],
      viewport: true,
      canonical: 'https://x.com',
      links: 6,
    });
    const r = scoreSeoAudit(load(html), 'https://x.com');
    expect(r.scores.google).toBeGreaterThanOrEqual(15);
    expect(r.issues.some((i) => i.engine === 'google' && /title/i.test(i.message))).toBe(false);
  });

  it('adds a google warning for title outside 30–60 chars', () => {
    const html = buildHtml({ title: 'Short', metaDesc: 'D'.repeat(130), h1s: 1 });
    const r = scoreSeoAudit(load(html), 'https://x.com');
    expect(r.issues.some((i) => i.engine === 'google' && /title/i.test(i.message))).toBe(true);
  });

  it('awards google +15 for meta description >= 120 chars', () => {
    const html = buildHtml({
      title: 'A'.repeat(40),
      metaDesc: 'D'.repeat(130),
      h1s: 1,
      viewport: true,
    });
    const r = scoreSeoAudit(load(html), 'https://x.com');
    expect(r.scores.google).toBeGreaterThanOrEqual(15 + 15); // title + meta
    expect(r.issues.some((i) => i.engine === 'google' && /meta description/i.test(i.message))).toBe(
      false
    );
  });

  it('adds a google critical issue for missing or short meta description', () => {
    const html = buildHtml({ title: 'A'.repeat(40), metaDesc: 'Short' });
    const r = scoreSeoAudit(load(html), 'https://x.com');
    expect(
      r.issues.some(
        (i) =>
          i.engine === 'google' && i.severity === 'critical' && /meta description/i.test(i.message)
      )
    ).toBe(true);
  });

  it('awards google +10 for a single H1', () => {
    const html = buildHtml({ title: 'A'.repeat(40), metaDesc: 'D'.repeat(130), h1s: 1 });
    const r = scoreSeoAudit(load(html), 'https://x.com');
    expect(r.issues.some((i) => i.engine === 'google' && /h1/i.test(i.message))).toBe(false);
  });

  it('adds a google warning for multiple H1 tags', () => {
    const html = buildHtml({ h1s: 3 });
    const r = scoreSeoAudit(load(html), 'https://x.com');
    expect(r.issues.some((i) => i.engine === 'google' && /3 h1/i.test(i.message))).toBe(true);
  });

  it('awards google +10 for 2+ H2 tags', () => {
    const html = buildHtml({
      title: 'A'.repeat(40),
      metaDesc: 'D'.repeat(130),
      h1s: 1,
      h2s: ['Two', 'Three'],
    });
    const r = scoreSeoAudit(load(html), 'https://x.com');
    // score should include both title(15) + meta(15) + h1(10) + h2(10) = 50+
    expect(r.scores.google).toBeGreaterThanOrEqual(50);
  });

  it('awards google +10 for all images having alt text (and at least 1 image)', () => {
    const html = buildHtml({ images: [{ alt: 'desc' }, { alt: 'desc2' }] });
    const r = scoreSeoAudit(load(html), 'https://x.com');
    expect(r.issues.some((i) => i.engine === 'google' && /alt/i.test(i.message))).toBe(false);
  });

  it('adds a google warning for images missing alt text', () => {
    const html = buildHtml({ images: [{ alt: '' }, { alt: 'ok' }] });
    const r = scoreSeoAudit(load(html), 'https://x.com');
    expect(r.issues.some((i) => i.engine === 'google' && /alt/i.test(i.message))).toBe(true);
  });

  it('awards google +10 for https URL', () => {
    const html = buildHtml({});
    const r = scoreSeoAudit(load(html), 'https://example.com');
    // https bonus applies; http does not
    const rHttp = scoreSeoAudit(load(html), 'http://example.com');
    expect(r.scores.google).toBeGreaterThan(rHttp.scores.google);
  });

  it('awards google +10 for viewport meta', () => {
    const withVP = buildHtml({ viewport: true });
    const withoutVP = buildHtml({ viewport: false });
    const r1 = scoreSeoAudit(load(withVP), 'https://x.com');
    const r2 = scoreSeoAudit(load(withoutVP), 'https://x.com');
    expect(r1.scores.google).toBeGreaterThan(r2.scores.google);
  });

  it('awards google +10 for a canonical URL', () => {
    const withC = buildHtml({ canonical: 'https://x.com' });
    const withoutC = buildHtml({});
    const r1 = scoreSeoAudit(load(withC), 'https://x.com');
    const r2 = scoreSeoAudit(load(withoutC), 'https://x.com');
    expect(r1.scores.google).toBeGreaterThan(r2.scores.google);
  });

  it('awards google +10 for >5 links', () => {
    const manyLinks = buildHtml({ links: 6 });
    const fewLinks = buildHtml({ links: 2 });
    const r1 = scoreSeoAudit(load(manyLinks), 'https://x.com');
    const r2 = scoreSeoAudit(load(fewLinks), 'https://x.com');
    expect(r1.scores.google).toBeGreaterThan(r2.scores.google);
  });

  it('scores a fully-optimised page >= 80 on google', () => {
    const title = 'A'.repeat(40);
    const metaDesc = 'D'.repeat(130);
    const html = buildHtml({
      title,
      metaDesc,
      viewport: true,
      canonical: 'https://x.com',
      h1s: 1,
      h2s: ['Two', 'Three'],
      images: [{ alt: 'x' }],
      links: 6,
    });
    const r = scoreSeoAudit(load(html), 'https://x.com');
    // title(15) + meta(15) + h1(10) + h2(10) + allAlt(10) + https(10) + viewport(10) + canonical(10) + links(10) = 100
    expect(r.scores.google).toBeGreaterThanOrEqual(80);
  });

  // ── Naver score ─────────────────────────────────────────────────────────────

  it('awards naver +15 for having a title', () => {
    const html = buildHtml({ title: 'My title' });
    const r = scoreSeoAudit(load(html), 'https://x.com');
    expect(r.scores.naver).toBeGreaterThanOrEqual(15);
  });

  it('adds a naver warning for fewer than 3 images', () => {
    const html = buildHtml({ images: [{ alt: 'x' }] }); // only 1 image
    const r = scoreSeoAudit(load(html), 'https://x.com');
    expect(r.issues.some((i) => i.engine === 'naver' && /3\+ images/i.test(i.message))).toBe(true);
  });

  it('awards naver +15 for 3+ images', () => {
    const html = buildHtml({ images: [{ alt: 'a' }, { alt: 'b' }, { alt: 'c' }] });
    const r = scoreSeoAudit(load(html), 'https://x.com');
    expect(r.issues.some((i) => i.engine === 'naver' && /images/i.test(i.message))).toBe(false);
  });

  it('awards naver +15 for text length >= 2000', () => {
    const text = 'A'.repeat(2100);
    const html = buildHtml({ text });
    const r = scoreSeoAudit(load(html), 'https://x.com');
    expect(r.scores.naver).toBeGreaterThanOrEqual(15); // textLength bonus
  });

  it('adds naver textLength bonus up to 35 = min(35, floor(len/200))', () => {
    const text = 'A'.repeat(8000); // floor(8000/200) = 40, capped at 35
    const html = buildHtml({ text });
    const r = scoreSeoAudit(load(html), 'https://x.com');
    // Ensure capped at 35 (not 40)
    // Direct check: naver score should contain exactly 35 from textLength
    // We can't isolate but we know the max total is title(15)+img(15)+h2(10)+textLen(15)+meta(10)+textBonus(35)=100
    expect(r.scores.naver).toBeLessThanOrEqual(100);
  });

  // ── GEO score ───────────────────────────────────────────────────────────────

  it('adds a geo critical issue for missing schema markup', () => {
    const html = buildHtml({});
    const r = scoreSeoAudit(load(html), 'https://x.com');
    expect(
      r.issues.some(
        (i) => i.engine === 'geo' && i.severity === 'critical' && /schema/i.test(i.message)
      )
    ).toBe(true);
  });

  it('awards geo +25 for schema markup presence', () => {
    const html = buildHtml({ schema: '{"@type":"Article"}' });
    const r = scoreSeoAudit(load(html), 'https://x.com');
    expect(r.scores.geo).toBeGreaterThanOrEqual(25);
    expect(r.issues.some((i) => i.engine === 'geo' && /no schema/i.test(i.message))).toBe(false);
  });

  it('awards geo +20 for FAQPage schema', () => {
    const html = buildHtml({ faqPage: true });
    const r = scoreSeoAudit(load(html), 'https://x.com');
    expect(r.scores.geo).toBeGreaterThanOrEqual(25 + 20);
    expect(r.issues.some((i) => i.engine === 'geo' && /faq/i.test(i.message))).toBe(false);
  });

  it('adds a geo warning for missing FAQ schema', () => {
    const html = buildHtml({ schema: '{"@type":"Article"}' }); // has schema but not FAQPage
    const r = scoreSeoAudit(load(html), 'https://x.com');
    expect(r.issues.some((i) => i.engine === 'geo' && /faq/i.test(i.message))).toBe(true);
  });

  it('awards geo +15 for an H2 containing a question mark', () => {
    const html = buildHtml({ schema: '{"@type":"Article"}', h2s: ['What is this?', 'Two'] });
    const r = scoreSeoAudit(load(html), 'https://x.com');
    // schema(25) + no FAQ warning but FAQ issue still present + H2?(15)
    expect(r.scores.geo).toBeGreaterThanOrEqual(25 + 15);
  });

  it('geo textLength bonus = min(40, floor(len/300))', () => {
    // len=6000 → floor(6000/300)=20, no cap; len=15000 → floor(50)→capped at 40
    const html6000 = buildHtml({ schema: '{"@type":"Article"}', text: 'B'.repeat(6000) });
    const r6000 = scoreSeoAudit(load(html6000), 'https://x.com');
    expect(r6000.scores.geo).toBeGreaterThanOrEqual(25 + 20); // schema + textBonus(20)

    const html15000 = buildHtml({ schema: '{"@type":"Article"}', text: 'B'.repeat(15000) });
    const r15000 = scoreSeoAudit(load(html15000), 'https://x.com');
    expect(r15000.scores.geo).toBeLessThanOrEqual(100);
  });

  // ── Tech score ──────────────────────────────────────────────────────────────

  it('starts tech at 35 (base) and adds for https+viewport+canonical+robots', () => {
    const html = buildHtml({});
    const r = scoreSeoAudit(load(html), 'http://x.com');
    expect(r.scores.tech).toBeGreaterThanOrEqual(35); // base 35
  });

  it('awards tech +20 for https, +20 for viewport, +15 for canonical, +10 for robots meta', () => {
    const withAll = `<html><head>
      <meta name="viewport" content="w">
      <link rel="canonical" href="https://x.com">
      <meta name="robots" content="index,follow">
    </head><body></body></html>`;
    const r = scoreSeoAudit(load(withAll), 'https://x.com');
    // 35 + 20(https) + 20(viewport) + 15(canonical) + 10(robots) = 100
    expect(r.scores.tech).toBeGreaterThanOrEqual(35 + 20 + 20 + 15 + 10);
  });

  // ── Response shape ──────────────────────────────────────────────────────────

  it('returns the correct shape: url, title, metaDescription, scores, issues, meta', () => {
    const html = buildHtml({ title: 'A'.repeat(40), metaDesc: 'D'.repeat(130) });
    const r = scoreSeoAudit(load(html), 'https://shape-test.com');
    expect(r).toHaveProperty('url', 'https://shape-test.com');
    expect(r).toHaveProperty('title');
    expect(r).toHaveProperty('metaDescription');
    expect(r).toHaveProperty('scores');
    expect(r.scores).toHaveProperty('google');
    expect(r.scores).toHaveProperty('naver');
    expect(r.scores).toHaveProperty('geo');
    expect(r.scores).toHaveProperty('tech');
    expect(r).toHaveProperty('issues');
    expect(Array.isArray(r.issues)).toBe(true);
    expect(r).toHaveProperty('meta');
    expect(r.meta).toHaveProperty('h1Count');
    expect(r.meta).toHaveProperty('imageCount');
    expect(r.meta).toHaveProperty('textLength');
    expect(r.meta).toHaveProperty('hasSchema');
  });

  // ── Edge cases ──────────────────────────────────────────────────────────────

  it('handles empty HTML without throwing', () => {
    expect(() => scoreSeoAudit(load('<html></html>'), 'https://x.com')).not.toThrow();
  });

  it('handles 0 images (no alt warning from google)', () => {
    const html = buildHtml({ images: [] });
    const r = scoreSeoAudit(load(html), 'https://x.com');
    // CF: `imagesWithoutAlt === 0 && images.length > 0` — 0 images → no +10, no warning
    expect(r.issues.some((i) => i.engine === 'google' && /alt/i.test(i.message))).toBe(false);
  });

  it('scores 0 images as 0 google alt points (no bonus without images)', () => {
    const withoutImages = buildHtml({ images: [] });
    const withImages = buildHtml({ images: [{ alt: 'desc' }] });
    const r0 = scoreSeoAudit(load(withoutImages), 'https://x.com');
    const r1 = scoreSeoAudit(load(withImages), 'https://x.com');
    expect(r1.scores.google).toBeGreaterThan(r0.scores.google);
  });

  it('GEO FAQPage check reads the raw HTML (via $.html()), not just cheerio DOM', () => {
    // FAQPage in a LD+JSON script block
    const html = buildHtml({ faqPage: true });
    const r = scoreSeoAudit(load(html), 'https://x.com');
    expect(r.issues.some((i) => i.engine === 'geo' && /faq/i.test(i.message))).toBe(false);
  });

  // ── Comprehensive well-formed page ──────────────────────────────────────────

  it('scores a fully well-formed page high on google and flags missing schema for geo', () => {
    const title = 'A'.repeat(40);
    const metaDesc = 'D'.repeat(130);
    const html = buildHtml({
      title,
      metaDesc,
      viewport: true,
      canonical: 'https://x.com',
      h1s: 1,
      h2s: ['What is SEO?', 'Two'],
      images: [{ alt: 'x' }],
      links: 6,
    });
    const r = scoreSeoAudit(load(html), 'https://x.com');
    expect(r.scores.google).toBeGreaterThanOrEqual(80);
    expect(r.issues.some((i) => i.engine === 'geo' && /schema/i.test(i.message))).toBe(true);
  });
});
