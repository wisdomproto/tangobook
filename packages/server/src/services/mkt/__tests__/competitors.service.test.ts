/**
 * TDD tests for the pure helpers in `competitors.service.ts`:
 *   - `parseCompetitorJson<T>(text, fallback)` — extract JSON from noisy Gemini output
 *   - `rankBadgeTier(rank)` — threshold helper used by both server + client
 *   - `selectRankingKeywords(strategy, industry)` — keyword seed selection
 *
 * These are PURE functions (no network, no Gemini, no DataForSEO) so they are
 * fully unit-testable without any mocking.
 */

import { describe, it, expect } from 'vitest';
import {
  parseCompetitorJson,
  rankBadgeTier,
  selectRankingKeywords,
} from '../competitors.service.js';

// ── parseCompetitorJson ────────────────────────────────────────────────────────

describe('parseCompetitorJson', () => {
  it('extracts a top-level JSON object from clean text', () => {
    const result = parseCompetitorJson<{ gaps: unknown[] }>(
      '{"gaps":[{"topic":"seo","monthlySearch":1200}],"strengths":[]}',
      { gaps: [] }
    );
    expect(result.gaps).toHaveLength(1);
    expect((result.gaps[0] as { topic: string }).topic).toBe('seo');
  });

  it('strips markdown ```json fences and extracts the JSON', () => {
    const noisy = 'Here is the analysis:\n```json\n{"gaps":[],"strengths":[]}\n```\nDone.';
    const result = parseCompetitorJson(noisy, { gaps: [], strengths: [] });
    expect(result).toEqual({ gaps: [], strengths: [] });
  });

  it('extracts JSON object that appears after leading prose', () => {
    const text =
      'Based on the analysis, here are the results: {"gaps":[{"topic":"x"}],"strengths":[]} end';
    const result = parseCompetitorJson(text, { gaps: [], strengths: [] });
    expect(result).toEqual({ gaps: [{ topic: 'x' }], strengths: [] });
  });

  it('returns fallback when text contains only a bare JSON array (no {…} wrapper)', () => {
    // The regex looks for {…}, so a text with only a bare `[…]` and no object
    // literal should return the fallback.
    const text = 'pre [1,2,3] post';
    const result = parseCompetitorJson(text, { rankings: [] });
    expect(result).toEqual({ rankings: [] });
  });

  it('returns fallback for completely garbage input', () => {
    expect(parseCompetitorJson('no json here', { rankings: [] })).toEqual({ rankings: [] });
    expect(parseCompetitorJson('', { competitors: [] })).toEqual({ competitors: [] });
    expect(parseCompetitorJson('{}!@#$bad', { gaps: [], strengths: [] })).toEqual(
      // {} is valid JSON — it should parse to {} and be returned
      {}
    );
  });

  it('returns fallback when JSON.parse throws on malformed input', () => {
    const malformed = '{ gaps: [missing quotes], strengths: [] }'; // invalid JSON
    const result = parseCompetitorJson(malformed, { gaps: [], strengths: [] });
    expect(result).toEqual({ gaps: [], strengths: [] });
  });

  it('handles the gap-analysis fallback shape', () => {
    const result = parseCompetitorJson<{ gaps: unknown[]; strengths: unknown[] }>(
      'pre {"gaps":[{"topic":"x"}],"strengths":[]} post',
      { gaps: [], strengths: [] }
    );
    expect(result.gaps).toEqual([{ topic: 'x' }]);
    expect(result.strengths).toEqual([]);
  });

  it('handles the keyword-rankings fallback shape', () => {
    const result = parseCompetitorJson<{ rankings: unknown[] }>(
      '{"rankings":[{"keyword":"test","myRank":15,"competitors":[]}]}',
      { rankings: [] }
    );
    expect(result.rankings).toHaveLength(1);
  });

  it('handles the suggest-competitors fallback shape', () => {
    const text =
      '{"competitors":[{"name":"CompA","url":"https://a.com","type":"direct","reason":"same niche","strength":"brand"}]}';
    const result = parseCompetitorJson(text, { competitors: [] });
    expect((result as { competitors: unknown[] }).competitors).toHaveLength(1);
  });
});

// ── rankBadgeTier ──────────────────────────────────────────────────────────────

describe('rankBadgeTier', () => {
  it('returns "top" for ranks 1-3', () => {
    expect(rankBadgeTier(1)).toBe('top');
    expect(rankBadgeTier(3)).toBe('top');
  });

  it('returns "good" for ranks 4-10', () => {
    expect(rankBadgeTier(4)).toBe('good');
    expect(rankBadgeTier(10)).toBe('good');
  });

  it('returns "ok" for ranks 11-30', () => {
    expect(rankBadgeTier(11)).toBe('ok');
    expect(rankBadgeTier(30)).toBe('ok');
  });

  it('returns "low" for ranks > 30', () => {
    expect(rankBadgeTier(31)).toBe('low');
    expect(rankBadgeTier(100)).toBe('low');
  });

  it('returns "low" for null or undefined', () => {
    expect(rankBadgeTier(null)).toBe('low');
    expect(rankBadgeTier(undefined)).toBe('low');
  });
});

// ── selectRankingKeywords ──────────────────────────────────────────────────────

describe('selectRankingKeywords', () => {
  it('returns up to 10 keywords from strategy.keywords', () => {
    const strategy = {
      keywords: Array.from({ length: 15 }, (_, i) => ({ keyword: `kw${i}`, volume: 100 })),
    };
    const result = selectRankingKeywords(strategy, 'education');
    expect(result).toHaveLength(10);
    expect(result[0]).toBe('kw0');
    expect(result[9]).toBe('kw9');
  });

  it('returns fewer than 10 when strategy has fewer keywords', () => {
    const strategy = { keywords: [{ keyword: 'only', volume: 50 }] };
    const result = selectRankingKeywords(strategy, 'any');
    expect(result).toEqual(['only']);
  });

  it('falls back to industry defaults when strategy is null', () => {
    const result = selectRankingKeywords(null, 'education');
    expect(result.length).toBeGreaterThan(0);
    expect(typeof result[0]).toBe('string');
  });

  it('falls back to industry defaults when strategy.keywords is empty/undefined', () => {
    expect(selectRankingKeywords({}, 'health').length).toBeGreaterThan(0);
    expect(selectRankingKeywords({ keywords: [] }, 'tech').length).toBeGreaterThan(0);
  });

  it('uses a generic default list when industry is not matched', () => {
    const result = selectRankingKeywords(null, 'unknownindustry');
    expect(result.length).toBeGreaterThan(0);
  });
});
