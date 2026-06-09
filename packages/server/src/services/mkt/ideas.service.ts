import { generateTextWithGemini } from '../../providers/gemini.provider.js';
import { searchKeywords } from './external/naver-searchad.js';
import { getKeywordVolumes } from './external/dataforseo.js';
import {
  type GoldenCandidate,
  toCandidate,
  dedupeByMaxVolume,
  filterGoldenCandidates,
  classifyGoldenTiers,
} from './external/golden-keyword.js';
import {
  searchVideos,
  getVideoStats,
  type YTVideoSnippet,
  type YTVideoStats,
} from './external/youtube-data.js';
import { config } from '../../config/index.js';
import { AppError } from '../../middleware/error.middleware.js';

const GOLDEN_MODEL = 'gemini-2.5-flash-lite'; // flash-class for batch-ish golden calls (D / Q-6)

export interface RecommendInput {
  project: { name: string; industry?: string; brand_name?: string; brand_description?: string };
  seedKeyword?: string;
}
export interface KeywordGroup {
  category: string;
  keywords: Array<{
    keyword: string;
    category: string;
    searchIntent: 'commercial' | 'informational';
    priority: 'high' | 'medium' | 'low';
    estimatedVolume: string;
    difficulty: string;
    naverMonthly: number;
    naverPc: number;
    naverMobile: number;
    naverComp: 'HIGH' | 'MEDIUM' | 'LOW';
    googleVolume?: number;
    googleComp?: string;
    googleCpc?: number;
  }>;
}

const FALLBACK_SEEDS = ['성장클리닉', '키성장', '성장호르몬', '성장판검사', '아이키'];

function extractJsonArray(text: string): string[] {
  const m = text.match(/\[[\s\S]*?\]/);
  if (!m) return [];
  try {
    const v = JSON.parse(m[0]);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

export async function recommendGoldenKeywords(
  input: RecommendInput
): Promise<{ groups: KeywordGroup[]; strategy: string }> {
  const { project, seedKeyword } = input;
  const { apiKey, secretKey, customerId } = config.naverAd;
  if (!apiKey || !secretKey || !customerId) {
    throw new AppError(502, 'Naver 키워드 API 키가 설정되지 않았습니다.'); // golden is Naver-specific (hard-fail OK)
  }
  const geminiOn = Boolean(config.gemini.apiKey);

  // 1. Seeds: user CSV, else Gemini-generated, else fallback
  let seeds: string[] = [];
  if (seedKeyword?.trim()) {
    seeds = seedKeyword
      .split(/[,，、\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  } else if (geminiOn) {
    const seedPrompt = `Based on this business, generate 8 seed keywords for Naver search volume research.
Business: ${project.name}
Industry: ${project.industry || ''}
Brand: ${project.brand_name || project.name}
Description: ${project.brand_description || ''}

Return ONLY a JSON array of 8 Korean seed keywords (single words or short phrases, no spaces):
["키워드1","키워드2",...]`;
    try {
      seeds = extractJsonArray(await generateTextWithGemini(seedPrompt, 3, GOLDEN_MODEL));
    } catch {
      /* fall through */
    }
  }
  if (seeds.length === 0) seeds = FALLBACK_SEEDS;

  // 2. Naver volumes per seed (≤5 cap is handled inside searchKeywords; 400ms spacing — R-3/R-4)
  const all: GoldenCandidate[] = [];
  for (const seed of seeds) {
    try {
      const rows = await searchKeywords([seed]);
      for (const nk of rows) all.push(toCandidate(nk));
    } catch {
      /* skip a failing seed */
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  const deduped = [...dedupeByMaxVolume(all).values()];

  // 3. Filter (enum) + sort
  let candidates = filterGoldenCandidates(deduped);

  // 3.5 Gemini relevance filter (≤100 candidates) — intersect
  if (geminiOn && candidates.length > 0) {
    const kwList = candidates
      .slice(0, 100)
      .map((c) => c.keyword)
      .join(', ');
    const filterPrompt = `You are a keyword relevance filter. Given a business and a list of keywords, return ONLY the keywords that are directly relevant to the business. Remove any unrelated keywords.

Business: ${project.name}
Industry: ${project.industry || ''}
Description: ${project.brand_description || ''}
${seedKeyword ? `Focus: ${seedKeyword}` : ''}

Keywords to filter:
${kwList}

Return ONLY a JSON array of relevant keywords (exact spelling):
["키워드1","키워드2",...]`;
    try {
      const relevant = new Set(
        extractJsonArray(await generateTextWithGemini(filterPrompt, 3, GOLDEN_MODEL))
      );
      if (relevant.size > 0) candidates = candidates.filter((c) => relevant.has(c.keyword));
    } catch {
      /* keep unfiltered */
    }
  }

  // 4. Tier (enum) → KeywordGroup[]
  const { gold, silver, bronze } = classifyGoldenTiers(candidates);
  const toItem = (g: GoldenCandidate, cat: string): KeywordGroup['keywords'][number] => ({
    keyword: g.keyword,
    category: cat,
    searchIntent: g.vol > 5000 ? 'commercial' : 'informational',
    priority: g.comp === 'LOW' ? 'high' : g.vol > 3000 ? 'high' : g.vol > 1000 ? 'medium' : 'low',
    estimatedVolume: g.vol > 5000 ? '높음' : g.vol > 1000 ? '중간' : '낮음',
    difficulty: g.comp === 'LOW' ? '쉬움' : '보통',
    naverMonthly: g.vol,
    naverPc: g.pc,
    naverMobile: g.mob,
    naverComp: g.comp,
  });
  const groups: KeywordGroup[] = [];
  if (gold.length)
    groups.push({
      category: '🏆 황금 키워드',
      keywords: gold.map((g) => toItem(g, '🏆 황금 키워드')),
    });
  if (silver.length)
    groups.push({
      category: '🥇 유망 키워드',
      keywords: silver.map((g) => toItem(g, '🥇 유망 키워드')),
    });
  if (bronze.length)
    groups.push({
      category: '🥈 일반 키워드',
      keywords: bronze.map((g) => toItem(g, '🥈 일반 키워드')),
    });

  // 5. Google enrichment (best-effort)
  try {
    const allKws = groups.flatMap((g) => g.keywords.map((k) => k.keyword));
    if (allKws.length) {
      const gVols = await getKeywordVolumes(allKws);
      const gMap = new Map(gVols.map((gk) => [gk.keyword, gk]));
      for (const group of groups) {
        group.keywords = group.keywords.map((k) => {
          const gd = gMap.get(k.keyword) ?? gMap.get(k.keyword.replace(/\s+/g, ''));
          return gd
            ? {
                ...k,
                googleVolume: gd.searchVolume,
                googleComp: String(gd.competition),
                googleCpc: gd.cpc,
              }
            : k;
        });
      }
    }
  } catch {
    /* google optional */
  }

  // 6. Strategy (Gemini, enum lists)
  let strategy = '';
  if (geminiOn) {
    const goldenItems = [...(groups[0]?.keywords ?? []), ...(groups[1]?.keywords ?? [])];
    const low = goldenItems.filter((g) => g.naverComp === 'LOW').slice(0, 10);
    const mid = goldenItems.filter((g) => g.naverComp === 'MEDIUM').slice(0, 15);
    const lowList = low
      .map((g) => `- ${g.keyword} (${g.naverMonthly?.toLocaleString()}/월, 경쟁:낮음)`)
      .join('\n');
    const midList = mid
      .map((g) => `- ${g.keyword} (${g.naverMonthly?.toLocaleString()}/월, 경쟁:중간)`)
      .join('\n');
    const strategyPrompt = `You are a Korean SEO/content marketing strategist. Analyze these golden keywords and create a concrete, actionable strategy.

Business: ${project.name} (${project.industry || ''})
Brand: ${project.brand_name || project.name}
Description: ${project.brand_description || ''}

=== 🥇 경쟁 낮음 키워드 (최우선 공략 대상) ===
${lowList || '(없음)'}

=== 🥈 경쟁 중간 키워드 (검색량 높은 순) ===
${midList || '(없음)'}

IMPORTANT: 경쟁 "낮음" 키워드는 반드시 전략에 포함하세요. 이들이 가장 빠르게 상위 노출할 수 있는 핵심 기회입니다.

Respond in Korean. Return strategy:
1. **핵심 전략 요약** (2-3문장, 비즈니스에 맞춤)
2. **즉시 공략 키워드** — 경쟁 낮음 키워드 전부 분석. 각각 왜 공략해야 하는지, 어떤 콘텐츠를 만들지
3. **콘텐츠 퍼널 설계** — 정보형(유입) → 상업형(전환) 키워드 연결 구조. 구체적 키워드 매핑
4. **추천 콘텐츠 주제** (7개) — 블로그 제목 예시 (경쟁 낮음 키워드 우선 활용)
5. **3개월 실행 로드맵** — 월별 구체적 액션 플랜`;
    try {
      strategy = await generateTextWithGemini(strategyPrompt, 3, GOLDEN_MODEL);
    } catch {
      /* strategy optional */
    }
  }

  return { groups, strategy };
}

// ─── Idea Generation ──────────────────────────────────────────────────────────

export interface Idea {
  channel: string;
  title: string;
  structure: string;
  outline: string[];
}

export interface GenerateIdeasInput {
  topic: string;
  channelTypes?: string[];
  industry?: string;
  targetAudience?: string;
}

function extractJsonIdeas(text: string): Idea[] {
  const m = text.match(/\[[\s\S]*\]/);
  if (!m) return [];
  try {
    const arr = JSON.parse(m[0]);
    return Array.isArray(arr) ? (arr as Idea[]) : [];
  } catch {
    return [];
  }
}

/**
 * Generate AI content ideas per channel (flash-class model — Q-6).
 * Port of CF `app/api/ideas/generate/route.ts`.
 */
export async function generateIdeas(
  input: GenerateIdeasInput
): Promise<{ ideas: Idea[]; topic: string }> {
  if (!config.gemini.apiKey) {
    throw new AppError(502, 'Gemini API 키가 설정되지 않았습니다.');
  }
  const { topic, channelTypes, industry, targetAudience } = input;
  const channels = channelTypes?.length ? channelTypes : ['blog', 'cardnews', 'youtube'];

  const prompt = `You are a Korean content marketing expert. Generate content ideas for each channel.

Topic: ${topic}
Industry: ${industry || ''}
Target Audience: ${targetAudience || '한국 소비자'}
Channels: ${channels.join(', ')}

For each channel, generate ONE content idea with:
- channel: the channel name (from the list above)
- title: engaging Korean title
- structure: brief Korean structure description
- outline: array of 4-5 Korean content sections

Return ONLY a valid JSON array:
[{"channel":"blog","title":"...","structure":"...","outline":["1. ...","2. ...","3. ...","4. ..."]},...]`;

  const text = await generateTextWithGemini(prompt, 3, GOLDEN_MODEL);
  const ideas = extractJsonIdeas(text);
  return { ideas, topic };
}

// ─── Trending Assembly ────────────────────────────────────────────────────────

export interface YTVideo {
  id: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  url: string;
  views: string;
  viewCount: number;
  likes: number;
  comments: number;
  publishedAt: string;
  keyword: string;
}

export interface TrendItem {
  keyword: string;
  totalSearches?: number;
  compIdx?: string;
  trend?: string;
  change?: string;
}

export interface TrendingResult {
  youtube: YTVideo[];
  naverTrends: TrendItem[];
  googleTrends: TrendItem[];
}

export interface AssembleTrendingInput {
  keywords: string[];
  language?: string;
  period?: 'week' | 'month' | 'quarter';
}

/** Format view count: 억/만/raw (CF trending route :141) */
export function formatViews(views: number): string {
  if (views >= 100_000_000) return `${(views / 100_000_000).toFixed(1)}억`;
  if (views >= 10_000) return `${(views / 10_000).toFixed(1)}만`;
  return views.toLocaleString();
}

/** Join YouTube snippets + stats by videoId, sorted by viewCount desc. */
export function mergeYoutube(
  snippets: YTVideoSnippet[],
  stats: YTVideoStats[],
  keyword: string
): YTVideo[] {
  const statsMap = new Map(stats.map((s) => [s.videoId, s]));
  return snippets
    .map((s) => {
      const st = statsMap.get(s.videoId);
      const viewCount = st?.viewCount ?? 0;
      return {
        id: s.videoId,
        title: s.title,
        channelTitle: s.channelTitle,
        thumbnail: s.thumbnailUrl,
        url: `https://www.youtube.com/watch?v=${s.videoId}`,
        views: formatViews(viewCount),
        viewCount,
        likes: st?.likeCount ?? 0,
        comments: st?.commentCount ?? 0,
        publishedAt: s.publishedAt,
        keyword,
      };
    })
    .sort((a, b) => b.viewCount - a.viewCount);
}

function periodToDays(period?: 'week' | 'month' | 'quarter'): number {
  if (period === 'week') return 7;
  if (period === 'month') return 30;
  return 90;
}

/**
 * Assemble trending data from YouTube + Naver (SearchAd-based) + Google placeholder.
 * Each source is wrapped in try/catch — partial results, never 500.
 * Port of CF `app/api/ideas/trending/route.ts`.
 */
export async function assembleTrending(input: AssembleTrendingInput): Promise<TrendingResult> {
  const { keywords, language, period } = input;

  // 1. YouTube (config.youtubeApiKey set, cap 3 keywords — R-2 quota)
  let youtube: YTVideo[] = [];
  if (config.youtubeApiKey) {
    const days = periodToDays(period);
    const publishedAfter = new Date(Date.now() - days * 86400000).toISOString();
    const capKws = keywords.slice(0, 3);
    const allVideos: YTVideo[] = [];
    for (const kw of capKws) {
      try {
        const snippets = await searchVideos(kw, {
          publishedAfter,
          order: 'viewCount',
          relevanceLanguage: language ?? 'ko',
          maxResults: 5,
        });
        const ids = snippets.map((s) => s.videoId);
        const stats = ids.length ? await getVideoStats(ids) : [];
        allVideos.push(...mergeYoutube(snippets, stats, kw));
      } catch {
        /* skip failing keyword */
      }
    }
    youtube = allVideos.sort((a, b) => b.viewCount - a.viewCount);
  }

  // 2. Naver trends (SearchAd-based, ko or no lang, cap 5 keywords — Datalab SKIPPED D/§2.2)
  let naverTrends: TrendItem[] = [];
  if (!language || language === 'ko') {
    if (config.naverAd.apiKey && config.naverAd.secretKey && config.naverAd.customerId) {
      const capKws = keywords.slice(0, 5);
      for (const kw of capKws) {
        try {
          const rows = await searchKeywords([kw]);
          if (rows.length > 0) {
            // Take top 3 by search volume
            const top = [...rows]
              .sort(
                (a, b) =>
                  b.pcSearchVolume +
                  b.mobileSearchVolume -
                  (a.pcSearchVolume + a.mobileSearchVolume)
              )
              .slice(0, 3);
            for (const r of top) {
              naverTrends.push({
                keyword: r.keyword,
                totalSearches: r.pcSearchVolume + r.mobileSearchVolume,
                compIdx: r.competition, // enum
                trend: 'data',
                change: '',
              });
            }
          }
        } catch {
          /* skip */
        }
      }
    }
    // Fallback when no creds/results
    if (naverTrends.length === 0) {
      naverTrends = keywords.map((k) => ({
        keyword: k,
        totalSearches: 0,
        trend: 'estimated',
        change: '',
      }));
    }
  }

  // 3. Google trends — placeholder (no official API, CF parity)
  const googleTrends: TrendItem[] = keywords.map((k) => ({
    keyword: k,
    trend: 'rising',
    change: '',
  }));

  return { youtube, naverTrends, googleTrends };
}
