/**
 * Competitors service — gap-analysis / keyword-rankings / suggest-competitors
 * via Gemini (generateTextWithGemini, NOT raw GoogleGenAI) + optional DataForSEO
 * volume enrichment.
 *
 * `parseCompetitorJson` is PURE (no side-effects) and is the primary TDD unit.
 * `rankBadgeTier` and `selectRankingKeywords` are pure helpers exported for
 * use by both the controller and the client dashboard (Chunk 11).
 *
 * Prompts are ported verbatim from CF:
 *   - gap-analysis         → competitors/gap-analysis/route.ts
 *   - keyword-rankings     → competitors/keyword-rankings/route.ts
 *   - suggest-competitors  → ai/strategy/suggest-competitors/route.ts
 *
 * Graceful: AppError(502) when GEMINI_API_KEY absent; AppError(400) on
 * missing required inputs. DataForSEO volume enrichment degrades silently
 * (try/catch) so the rankings still return without volume data.
 */

import { generateTextWithGemini } from '../../providers/gemini.provider.js';
import { config } from '../../config/index.js';
import { AppError } from '../../middleware/error.middleware.js';
import { getKeywordVolumes, getSerpResults } from './external/dataforseo.js';
import type { SerpResultItem } from './external/dataforseo.js';

export type { SerpResultItem };

// ── Types (server-side mirrors of client types/analytics.ts) ─────────────────

export interface CompetitorGapItem {
  topic: string;
  monthlySearch: number;
  competitors: string[];
  difficulty: string;
  priority: string;
}

export interface CompetitorStrengthItem {
  topic: string;
  monthlySearch: number;
  note: string;
}

export interface CompetitorRankingItem {
  keyword: string;
  myRank: number | null;
  volume?: number;
  competitors: { name: string; rank: number | null }[];
}

export interface SuggestedCompetitor {
  name: string;
  url?: string;
  type: string;
  reason: string;
  strength: string;
}

// ── PURE helpers (exported, unit-tested) ─────────────────────────────────────

/**
 * Extract the first `{…}` block from noisy Gemini text and JSON.parse it.
 * Falls back to `fallback` if no match or parse error.
 *
 * Mirrors CF's `jsonMatch ? JSON.parse(jsonMatch[0]) : fallback` pattern
 * used in all three competitor routes.
 *
 * @param text     Raw text from Gemini (may have markdown fences / prose)
 * @param fallback Typed fallback value returned on parse failure
 */
export function parseCompetitorJson<T>(text: string, fallback: T): T {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return fallback;
  try {
    return JSON.parse(match[0]) as T;
  } catch {
    return fallback;
  }
}

/**
 * Map a rank number to a tier badge label for the keyword-rankings table.
 * Thresholds locked to the plan spec (Chunk 10 / spec §8 4c).
 */
export function rankBadgeTier(rank: number | null | undefined): 'top' | 'good' | 'ok' | 'low' {
  if (rank == null) return 'low';
  if (rank <= 3) return 'top';
  if (rank <= 10) return 'good';
  if (rank <= 30) return 'ok';
  return 'low';
}

/**
 * Select up to 10 keyword seeds for the rankings call.
 * Uses `strategy.keywords` when available; falls back to an industry-derived
 * default list (faithful to CF `competitors-dashboard.tsx:82-88`).
 */
export function selectRankingKeywords(
  strategy: { keywords?: { keyword: string; volume?: number }[] } | null | undefined,
  industry: string
): string[] {
  const fromStrategy = strategy?.keywords?.slice(0, 10).map((k) => k.keyword) ?? [];
  if (fromStrategy.length > 0) return fromStrategy;

  // Industry-derived defaults (faithful to CF fallback)
  const defaults: Record<string, string[]> = {
    education: ['온라인 교육', '아이 영어', '유아 학습', '초등 국어', '학습 앱'],
    health: ['건강 관리', '다이어트', '운동법', '건강식품', '헬스케어'],
    tech: ['소프트웨어', 'SaaS', '앱 개발', '디지털 전환', '클라우드'],
    finance: ['투자', '재테크', '절세', '펀드', '금융 서비스'],
    beauty: ['뷰티', '스킨케어', '화장품', '피부 관리', '메이크업'],
    food: ['음식 배달', '레시피', '식당', '카페', '맛집'],
    travel: ['여행지', '호텔 예약', '항공권', '국내 여행', '해외 여행'],
  };

  const key = industry?.toLowerCase() ?? '';
  for (const [k, v] of Object.entries(defaults)) {
    if (key.includes(k)) return v;
  }
  // Generic fallback
  return ['브랜드 인지도', '온라인 마케팅', '콘텐츠 마케팅', '디지털 광고', 'SEO 최적화'];
}

// ── Service functions ─────────────────────────────────────────────────────────

export interface GapAnalysisInput {
  projectUrl: string;
  competitorUrls: string[];
  keywords?: string[];
  industry?: string;
}

/**
 * Analyze content gaps between our site and competitors via Gemini.
 * Prompt ported verbatim from CF `competitors/gap-analysis/route.ts`.
 */
export async function gapAnalysis(
  input: GapAnalysisInput
): Promise<{ gaps: CompetitorGapItem[]; strengths: CompetitorStrengthItem[] }> {
  if (!config.gemini.apiKey) {
    throw new AppError(502, 'Gemini API 키가 설정되지 않았습니다.');
  }
  if (!input.projectUrl || !input.competitorUrls?.length) {
    throw new AppError(400, 'projectUrl and at least one competitorUrl are required');
  }

  const prompt = `Analyze content gaps between our site and competitors.

Our site: ${input.projectUrl}
Competitors: ${input.competitorUrls.join(', ')}
${input.keywords?.length ? `Keywords: ${input.keywords.join(', ')}` : ''}
${input.industry ? `Industry: ${input.industry}` : ''}

Return ONLY valid JSON with this structure:
{
  "gaps": [
    { "topic": "topic name", "monthlySearch": 1200, "competitors": ["A", "B"], "difficulty": "medium", "priority": "high" }
  ],
  "strengths": [
    { "topic": "our unique topic", "monthlySearch": 800, "note": "Only we cover this" }
  ]
}`;

  const text = await generateTextWithGemini(prompt, 3, config.gemini.textModel);
  return parseCompetitorJson(text, { gaps: [], strengths: [] });
}

export interface KeywordRankingsInput {
  projectUrl?: string;
  competitorUrls?: string[];
  keywords: string[];
}

/**
 * Estimate keyword search rankings for the given sites via Gemini.
 * Prompt ported verbatim from CF `competitors/keyword-rankings/route.ts`.
 * Optional faithful-plus: enriches with real DataForSEO volume when creds are set.
 */
export async function keywordRankings(
  input: KeywordRankingsInput
): Promise<{ rankings: CompetitorRankingItem[] }> {
  if (!config.gemini.apiKey) {
    throw new AppError(502, 'Gemini API 키가 설정되지 않았습니다.');
  }
  if (!input.keywords?.length) {
    throw new AppError(400, 'keywords are required');
  }

  const prompt = `Analyze approximate Google search keyword rankings for the following sites.

My site: ${input.projectUrl || '(not provided)'}
Competitors: ${(input.competitorUrls || []).join(', ') || '(not provided)'}
Keywords to analyze: ${input.keywords.join(', ')}

For each keyword, estimate the approximate Google search ranking position (integer 1-100) or null if not ranking in top 100.
Base your estimates on what you know about these domains and typical SEO for these terms.

Return ONLY valid JSON with exactly this structure:
{
  "rankings": [
    {
      "keyword": "keyword text",
      "myRank": 15,
      "competitors": [
        { "name": "competitor-domain.com", "rank": 3 },
        { "name": "other-domain.com", "rank": 7 }
      ]
    }
  ]
}`;

  const text = await generateTextWithGemini(prompt, 3, config.gemini.textModel);
  const result = parseCompetitorJson<{ rankings: CompetitorRankingItem[] }>(text, { rankings: [] });

  // Optional faithful-plus: attach DataForSEO volume when creds available
  if (config.dataforseo.login && result.rankings.length > 0) {
    try {
      const volumes = await getKeywordVolumes(input.keywords);
      const volumeMap = new Map(volumes.map((v) => [v.keyword, v.searchVolume]));
      result.rankings = result.rankings.map((r) => ({
        ...r,
        volume: volumeMap.get(r.keyword),
      }));
    } catch {
      // Degrade silently — rankings still returned without volume
    }
  }

  return result;
}

export interface SuggestCompetitorsInput {
  industry: string;
  services: string;
  targetCustomer?: string;
  usp?: string;
}

/**
 * Suggest 5–8 competitors for the given business via Gemini.
 * Prompt ported verbatim from CF `ai/strategy/suggest-competitors/route.ts`.
 * Model: config.gemini.textModel (maps to DEFAULT_STRATEGY_MODEL in CF).
 */
export async function suggestCompetitors(
  input: SuggestCompetitorsInput
): Promise<{ competitors: SuggestedCompetitor[] }> {
  if (!config.gemini.apiKey) {
    throw new AppError(502, 'Gemini API 키가 설정되지 않았습니다.');
  }
  if (!input.industry && !input.services) {
    throw new AppError(400, '업종 또는 서비스 정보를 입력해 주세요.');
  }

  const prompt = `당신은 시장 조사 및 경쟁 분석 전문가입니다.

아래 비즈니스 정보를 분석하여 주요 경쟁사 5~8개를 찾아주세요.

## 비즈니스 정보
- 업종: ${input.industry}
- 서비스: ${input.services}
${input.targetCustomer ? `- 타겟 고객: ${input.targetCustomer}` : ''}
${input.usp ? `- 차별화: ${input.usp}` : ''}

## 경쟁사 탐색 기준
1. 같은 업종에서 동일한 타겟 고객을 대상으로 하는 직접 경쟁사
2. 유사 서비스를 제공하는 간접 경쟁사
3. 온라인 마케팅(네이버, 유튜브, 인스타)에서 활발히 활동하는 경쟁사 우선
4. 대형/프랜차이즈 + 중소규모 경쟁사 혼합

반드시 아래 JSON 형식으로만 응답하세요:
{
  "competitors": [
    { "name": "경쟁사명", "url": "홈페이지 URL (알면)", "type": "direct|indirect", "reason": "경쟁사인 이유 (한 줄)", "strength": "주요 강점" }
  ]
}`;

  const text = await generateTextWithGemini(prompt, 3, config.gemini.textModel);
  return parseCompetitorJson(text, { competitors: [] });
}

/**
 * Fetch live SERP results for a keyword (3rd competitors tab) via DataForSEO.
 * Thin wrapper over `getSerpResults` (South Korea / ko by default); creds are
 * read server-side. Degrades to AppError(502) when DataForSEO creds absent.
 */
export async function serpAnalysis(keyword: string, language = 'ko'): Promise<SerpResultItem[]> {
  return getSerpResults(keyword, 2410, language);
}
