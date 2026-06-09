import { useState } from 'react';
import { cn } from '../../lib/utils';
import {
  useSuggestCompetitors,
  useGapAnalysis,
  useKeywordRankings,
  useCompetitorSerp,
} from '../../api/use-competitors';
import type {
  CompetitorGapItem,
  CompetitorStrengthItem,
  CompetitorRankingItem,
  SuggestedCompetitor,
} from '../../types/analytics';
import type { SerpResultItem } from '../../types/monitoring';

// ─── Tab configuration (SERP added — Phase 5, DataForSEO live SERP) ──────────

type TabId = 'gap' | 'keywords' | 'serp';
const TABS: { id: TabId; label: string }[] = [
  { id: 'gap', label: '갭 분석' },
  { id: 'keywords', label: '키워드 순위' },
  { id: 'serp', label: 'SERP 분석' },
];

// ─── Helper ───────────────────────────────────────────────────────────────────

function getRankBadge(rank: number | null) {
  if (rank === null) return <span className="text-xs text-muted-foreground">-</span>;
  const color =
    rank <= 3
      ? 'text-green-500'
      : rank <= 10
        ? 'text-blue-500'
        : rank <= 30
          ? 'text-yellow-500'
          : 'text-muted-foreground';
  return <span className={cn('text-xs font-medium', color)}>{rank}위</span>;
}

function safeHostname(url: string): string {
  try {
    return new URL(url.startsWith('http') ? url : 'https://' + url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

// ─── Gap tab sub-panels ───────────────────────────────────────────────────────

function GapResultsList({ gaps }: { gaps: CompetitorGapItem[] }) {
  if (gaps.length === 0) return null;
  return (
    <div>
      <h3 className="text-sm font-semibold mb-3 break-keep">
        경쟁사가 다루지만 우리가 안 다루는 주제
      </h3>
      <div className="space-y-2">
        {gaps.map((gap, i) => (
          <div
            key={i}
            className="bg-card border border-border rounded-md px-3 py-2.5 flex items-center gap-3"
          >
            <div
              className={cn(
                'w-2 h-2 rounded-full shrink-0',
                gap.priority === 'high' ? 'bg-red-500' : 'bg-yellow-500'
              )}
            />
            <span className="text-sm flex-1 break-keep">{gap.topic}</span>
            <span className="text-xs text-muted-foreground">
              월검색 {gap.monthlySearch.toLocaleString()}
            </span>
            <div className="flex gap-1 flex-wrap">
              {gap.competitors.map((c) => (
                <span key={c} className="bg-muted px-2 py-0.5 rounded text-[10px]">
                  {c}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StrengthsList({ strengths }: { strengths: CompetitorStrengthItem[] }) {
  if (strengths.length === 0) return null;
  return (
    <div>
      <h3 className="text-sm font-semibold mb-3 break-keep">우리만 다루는 주제 (차별화)</h3>
      <div className="space-y-2">
        {strengths.map((s, i) => (
          <div
            key={i}
            className="bg-card border border-border rounded-md px-3 py-2.5 flex items-center gap-3"
          >
            <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
            <span className="text-sm flex-1 break-keep">{s.topic}</span>
            <span className="text-xs text-muted-foreground">
              월검색 {s.monthlySearch.toLocaleString()}
            </span>
            <span className="text-xs text-green-400">독점</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SuggestedList({
  suggestions,
  onAdd,
}: {
  suggestions: SuggestedCompetitor[];
  onAdd: (url: string) => void;
}) {
  if (suggestions.length === 0) return null;
  return (
    <div>
      <h3 className="text-sm font-semibold mb-3 break-keep">AI 추천 경쟁사</h3>
      <div className="space-y-2">
        {suggestions.map((s, i) => (
          <div
            key={i}
            className="bg-card border border-border rounded-md px-3 py-2.5 flex items-center gap-3"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium break-keep">{s.name}</span>
                <span className="text-[10px] bg-muted px-2 py-0.5 rounded break-keep">
                  {s.type}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 break-keep">{s.reason}</p>
            </div>
            {s.url && (
              <button
                onClick={() => onAdd(s.url!)}
                className="text-xs px-3 py-1 rounded bg-primary text-primary-foreground hover:opacity-90 shrink-0 break-keep"
              >
                추가
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

interface CompetitorsDashboardProps {
  projectId: string;
}

export function CompetitorsDashboard({ projectId }: CompetitorsDashboardProps) {
  const [tab, setTab] = useState<TabId>('gap');

  // ── Shared competitor URL state (used across both tabs) ──────────────────
  const [projectUrl, setProjectUrl] = useState('');
  const [competitorInput, setCompetitorInput] = useState('');
  const [competitors, setCompetitors] = useState<string[]>([]);

  // ── Gap tab state ─────────────────────────────────────────────────────────
  const [gaps, setGaps] = useState<CompetitorGapItem[]>([]);
  const [strengths, setStrengths] = useState<CompetitorStrengthItem[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestedCompetitor[]>([]);

  // ── Keywords tab state ────────────────────────────────────────────────────
  const [rankings, setRankings] = useState<CompetitorRankingItem[]>([]);
  const [keywordsInput, setKeywordsInput] = useState('');

  // ── SERP tab state ────────────────────────────────────────────────────────
  // CompetitorsDashboard has no MarketingLanguageTabs — SERP analyses Korean
  // results only, faithful to CF's hardcoded language: 'ko'.
  const selectedLang = 'ko';
  const [serpKeyword, setSerpKeyword] = useState('');
  const [serpResults, setSerpResults] = useState<SerpResultItem[]>([]);
  const [serpRequested, setSerpRequested] = useState(false);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const suggestMutation = useSuggestCompetitors();
  const gapMutation = useGapAnalysis();
  const rankingsMutation = useKeywordRankings();
  const serpMutation = useCompetitorSerp();

  // ── Competitor URL management ─────────────────────────────────────────────
  function addCompetitor(url?: string) {
    const val = (url ?? competitorInput).trim();
    if (val && !competitors.includes(val)) {
      setCompetitors((prev) => [...prev, val]);
      if (!url) setCompetitorInput('');
    }
  }

  function removeCompetitor(idx: number) {
    setCompetitors((prev) => prev.filter((_, i) => i !== idx));
  }

  // ── Gap analysis ──────────────────────────────────────────────────────────
  async function runGapAnalysis() {
    if (!projectUrl || !competitors.length) return;
    const result = await gapMutation.mutateAsync({
      projectUrl,
      competitorUrls: competitors,
    });
    setGaps(result.gaps);
    setStrengths(result.strengths);
  }

  async function runSuggest() {
    const result = await suggestMutation.mutateAsync({
      industry: projectUrl || '마케팅',
      services: competitors.join(', ') || '콘텐츠 마케팅',
    });
    setSuggestions(result);
  }

  // ── Keyword rankings ──────────────────────────────────────────────────────
  async function runKeywordRankings() {
    const kws = keywordsInput
      .split(/[,\n]/)
      .map((k) => k.trim())
      .filter(Boolean)
      .slice(0, 15);
    if (kws.length === 0) return;

    const result = await rankingsMutation.mutateAsync({
      projectUrl: projectUrl || undefined,
      competitorUrls: competitors.length ? competitors : undefined,
      keywords: kws,
    });
    setRankings(result);
  }

  // ── SERP analysis (DataForSEO live SERP via server; body carries no secret) ─
  async function runSerp() {
    const kw = serpKeyword.trim();
    if (!kw) return;
    setSerpRequested(true);
    // 502 (no DataForSEO creds) degrades to [] inside the graceful hook.
    const result = await serpMutation.mutateAsync({ keyword: kw, language: selectedLang });
    setSerpResults(result);
  }

  // ─────────────────────────────────────────────────────────────────────────

  const gapLoading = gapMutation.isPending;
  const suggestLoading = suggestMutation.isPending;
  const kwLoading = rankingsMutation.isPending;
  const serpLoading = serpMutation.isPending;

  const gapError = gapMutation.isError;
  const kwError = rankingsMutation.isError;

  return (
    <div className="p-6 max-w-5xl space-y-6">
      {/* ── Shared URL inputs (visible on both tabs) ── */}
      <div className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block break-keep">
            우리 사이트 URL
          </label>
          <input
            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
            placeholder="https://example.com"
            value={projectUrl}
            onChange={(e) => setProjectUrl(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block break-keep">
            경쟁사 URL 추가
          </label>
          <div className="flex gap-2">
            <input
              className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
              placeholder="https://competitor.com"
              value={competitorInput}
              onChange={(e) => setCompetitorInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCompetitor()}
            />
            <button
              onClick={() => addCompetitor()}
              className="px-4 py-2 rounded-md border border-border text-sm hover:bg-muted break-keep"
            >
              추가
            </button>
          </div>
        </div>
        {competitors.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {competitors.map((c, i) => (
              <span
                key={i}
                onClick={() => removeCompetitor(i)}
                className="bg-muted px-3 py-1 rounded-full text-xs cursor-pointer hover:bg-destructive/20 break-keep"
              >
                {safeHostname(c)} ×
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Tab bar ── */}
      <div className="flex gap-1 border-b border-border pb-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'px-4 py-1.5 rounded-md text-sm break-keep',
              tab === t.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: 갭 분석 ── */}
      {tab === 'gap' && (
        <div className="space-y-6">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={runGapAnalysis}
              disabled={gapLoading || !projectUrl || !competitors.length}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm disabled:opacity-50 break-keep"
            >
              {gapLoading ? '분석 중...' : '갭 분석 실행'}
            </button>
            <button
              onClick={runSuggest}
              disabled={suggestLoading}
              className="px-4 py-2 rounded-md border border-border text-sm disabled:opacity-50 break-keep"
            >
              {suggestLoading ? '추천 중...' : 'AI 경쟁사 추천'}
            </button>
          </div>

          {gapError && (
            <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive break-keep">
              분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.
            </div>
          )}

          {gapLoading && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin inline-block mb-2" />
              <p className="break-keep">AI가 콘텐츠 갭을 분석하는 중...</p>
            </div>
          )}

          {!gapLoading &&
            gaps.length === 0 &&
            strengths.length === 0 &&
            suggestions.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">
                <p className="text-3xl mb-3">🔍</p>
                <p className="break-keep">
                  우리 사이트와 경쟁사 URL을 입력한 후 갭 분석을 실행하세요
                </p>
                <p className="text-xs mt-1 opacity-70 break-keep">
                  경쟁사가 다루는 주제와 우리가 독점하는 주제를 분석합니다
                </p>
              </div>
            )}

          <GapResultsList gaps={gaps} />
          <StrengthsList strengths={strengths} />
          <SuggestedList suggestions={suggestions} onAdd={(url) => addCompetitor(url)} />
        </div>
      )}

      {/* ── Tab: 키워드 순위 ── */}
      {tab === 'keywords' && (
        <div className="space-y-4">
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block break-keep">
                분석할 키워드 (쉼표 또는 줄바꿈으로 구분, 최대 15개)
              </label>
              <textarea
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none"
                rows={3}
                placeholder="브랜드 마케팅, 콘텐츠 마케팅, SNS 운영"
                value={keywordsInput}
                onChange={(e) => setKeywordsInput(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <p className="text-xs text-muted-foreground flex-1 break-keep">
                AI가 우리 사이트와 경쟁사의 키워드 순위를 추정합니다. 갭 분석 탭에서 URL을 먼저
                입력하면 더 정확합니다.
              </p>
              <button
                onClick={runKeywordRankings}
                disabled={kwLoading || !keywordsInput.trim()}
                className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm disabled:opacity-50 shrink-0 break-keep"
              >
                {kwLoading ? '분석 중...' : '순위 분석'}
              </button>
            </div>
          </div>

          {kwError && (
            <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive break-keep">
              순위 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.
            </div>
          )}

          {kwLoading ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin inline-block mb-2" />
              <p className="break-keep">AI가 키워드 순위를 추정하는 중...</p>
            </div>
          ) : rankings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <p className="text-3xl mb-3">📊</p>
              <p className="break-keep">키워드를 입력하고 순위 분석을 실행하세요</p>
              <p className="text-xs mt-1 opacity-70 break-keep">
                AI 추정 순위이며 실제 순위와 다를 수 있습니다
              </p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground break-keep">
                      키워드
                    </th>
                    {rankings[0]?.volume !== undefined && (
                      <th className="text-center px-4 py-2 font-medium text-muted-foreground break-keep">
                        월 검색량
                      </th>
                    )}
                    <th className="text-center px-4 py-2 font-medium text-muted-foreground break-keep">
                      우리
                    </th>
                    {competitors.slice(0, 3).map((c) => (
                      <th
                        key={c}
                        className="text-center px-4 py-2 font-medium text-muted-foreground truncate max-w-[120px]"
                      >
                        {safeHostname(c)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rankings.map((row, i) => (
                    <tr key={i} className="border-b border-border hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium break-keep">{row.keyword}</td>
                      {row.volume !== undefined && (
                        <td className="text-center px-4 py-3 text-xs text-muted-foreground">
                          {row.volume.toLocaleString()}
                        </td>
                      )}
                      <td className="text-center px-4 py-3">{getRankBadge(row.myRank)}</td>
                      {competitors.slice(0, 3).map((_, ci) => (
                        <td key={ci} className="text-center px-4 py-3">
                          {getRankBadge(row.competitors[ci]?.rank ?? null)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-4 py-2 text-xs text-muted-foreground border-t border-border break-keep">
                * AI 추정 순위입니다. 실제 순위와 다를 수 있습니다.
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: SERP 분석 ── */}
      {tab === 'serp' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
              placeholder="분석할 키워드 입력 (예: 영어 동화책 추천)"
              value={serpKeyword}
              onChange={(e) => setSerpKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runSerp()}
            />
            <button
              onClick={runSerp}
              disabled={serpLoading || !serpKeyword.trim()}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm disabled:opacity-50 shrink-0 break-keep"
            >
              {serpLoading ? '검색 중...' : 'SERP 분석'}
            </button>
          </div>

          {serpLoading ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin inline-block mb-2" />
              <p className="break-keep">검색 결과를 분석하는 중...</p>
            </div>
          ) : serpResults.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <p className="text-3xl mb-3">📊</p>
              {serpRequested ? (
                <>
                  <p className="break-keep">검색 결과가 없습니다</p>
                  <p className="text-xs mt-1 opacity-70 break-keep">
                    DataForSEO 연결이 필요합니다 (SERP 분석)
                  </p>
                </>
              ) : (
                <>
                  <p className="break-keep">키워드를 입력하고 SERP 분석을 실행하세요</p>
                  <p className="text-xs mt-1 opacity-70 break-keep">
                    Google 상위 검색 결과를 분석합니다 (DataForSEO 연결 필요)
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground break-keep">
                "{serpKeyword}" 검색 결과 TOP {serpResults.length}
              </p>
              {serpResults.map((result, i) => (
                <div
                  key={result.id}
                  className="bg-card border border-border rounded-lg p-3 flex gap-3"
                >
                  <span className="text-sm font-bold text-muted-foreground w-6 shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-blue-500 hover:underline line-clamp-1 break-keep"
                    >
                      {result.title}
                    </a>
                    {result.author && (
                      <div className="text-xs text-green-600 mt-0.5 truncate">{result.author}</div>
                    )}
                    {result.snippet && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2 break-keep">
                        {result.snippet}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
