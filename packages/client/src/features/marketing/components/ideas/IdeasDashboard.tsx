import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import { useProject } from '../../api/use-projects';
import { useAiGeneration } from '../../hooks/use-ai-generation';
import { fetchNaverKeywords, fetchGoogleKeywords } from '../../api/use-keywords';
import { useDiscoverGoldenKeywords, type KeywordGroup } from '../../api/use-golden-keywords';
import { useUIStore } from '../../store/ui-store';
import { type KeywordItem, type SortCol, type SortState, toggleSort } from '../../lib/keyword-sort';
import { KeywordTable, type ColumnSpec } from './KeywordTable';
import { GoldenTierCards } from './GoldenTierCards';
import { MarketingLanguageTabs } from './MarketingLanguageTabs';
import { cn } from '../../lib/utils';
import { DEFAULT_TEXT_MODEL } from '../../lib/ai-models';

// Flash model for keyword AI (D / Q-6)
const FLASH_MODEL = 'gemini-2.5-flash-lite';

// ── Lang → DataForSEO location/language codes (CF :526–527) ─────────────────
const langToLocale: Record<string, { locationCode: number; languageCode: string }> = {
  ko: { locationCode: 2410, languageCode: 'ko' },
  ja: { locationCode: 2392, languageCode: 'ja' },
  zh: { locationCode: 2156, languageCode: 'zh' },
  th: { locationCode: 2764, languageCode: '_' },
  vi: { locationCode: 2704, languageCode: '_' },
};
const DEFAULT_LOCALE = { locationCode: 2840, languageCode: 'en' };
function getLocale(lang: string) {
  return langToLocale[lang] ?? DEFAULT_LOCALE;
}

// ── Tab definition ────────────────────────────────────────────────────────────
type TabId = 'naver-kw' | 'google-kw' | 'youtube' | 'ideas' | 'saved';
interface Tab {
  id: TabId;
  label: string;
}
const ALL_TABS: Tab[] = [
  { id: 'naver-kw', label: 'N 키워드 분석' },
  { id: 'google-kw', label: 'G 키워드 분석' },
  { id: 'youtube', label: '유튜브 유행' },
  { id: 'ideas', label: 'AI 아이디어' },
  { id: 'saved', label: '보관함' },
];

// ── Column sets ───────────────────────────────────────────────────────────────
const NAVER_COLUMNS: ColumnSpec[] = [
  { key: 'keyword', label: '키워드' },
  { key: 'intent', label: '검색 의도' },
  { key: 'priority', label: '우선순위', sortable: true },
  { key: 'volume', label: '검색량', sortable: true },
  { key: 'naver', label: '네이버/월', sortable: true },
  { key: 'competition', label: '경쟁도', sortable: true },
  { key: 'google', label: 'Google', sortable: true },
];
const GOOGLE_COLUMNS: ColumnSpec[] = [
  { key: 'keyword', label: '키워드' },
  { key: 'intent', label: '검색 의도' },
  { key: 'priority', label: '우선순위', sortable: true },
  { key: 'google', label: 'Google/월', sortable: true },
  // googleComp and googleCpc are rendered via string key fallthrough in KeywordTable
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function extractGroups(text: string): KeywordGroup[] {
  // Try parsing a JSON array of groups from the SSE output
  const m = text.match(/\[[\s\S]*\]/);
  if (!m) return [];
  try {
    const arr = JSON.parse(m[0]);
    if (!Array.isArray(arr)) return [];
    return arr as KeywordGroup[];
  } catch {
    return [];
  }
}

interface IdeasDashboardProps {
  projectId: string;
}

export function IdeasDashboard({ projectId }: IdeasDashboardProps) {
  const projectQuery = useProject(projectId);
  const project = projectQuery.data;

  // ── UI state ─────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<TabId>('naver-kw');
  const [keywordGroups, setKeywordGroups] = useState<KeywordGroup[]>([]);
  const [seedKeyword, setSeedKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortCols, setSortCols] = useState<SortState[]>([]);
  const [goldenStrategy, setGoldenStrategy] = useState('');

  // selectedLanguage from ui-store (delta vs CF local state)
  const selectedLang = useUIStore((s) => s.selectedLanguage);
  const setSelectedLanguage = useUIStore((s) => s.setSelectedLanguage);

  // ── Hooks ─────────────────────────────────────────────────────────────────
  const goldenMutation = useDiscoverGoldenKeywords();

  const naverAiGen = useAiGeneration({
    onComplete: async (text) => {
      const groups = extractGroups(text);
      if (!groups.length) return;
      // Enrich with Naver volumes — batch 5 at a time, 300ms spacing
      const allKws = groups.flatMap((g) => g.keywords.map((k) => k.keyword));
      const batchSize = 5;
      const naverMap = new Map<string, import('../../api/use-keywords').NaverKeywordRow>();
      for (let i = 0; i < allKws.length; i += batchSize) {
        const batch = allKws.slice(i, i + batchSize);
        try {
          const rows = await fetchNaverKeywords(batch);
          rows.forEach((r) => naverMap.set(r.keyword, r));
        } catch {
          /* skip batch */
        }
        if (i + batchSize < allKws.length) {
          await new Promise((r) => setTimeout(r, 300));
        }
      }
      const enriched: KeywordGroup[] = groups.map((g) => ({
        ...g,
        keywords: g.keywords.map((k) => {
          const nk = naverMap.get(k.keyword) ?? naverMap.get(k.keyword.replace(/\s+/g, ''));
          if (!nk) return k;
          const vol = nk.pcSearchVolume + nk.mobileSearchVolume;
          return {
            ...k,
            naverMonthly: vol,
            naverPc: nk.pcSearchVolume,
            naverMobile: nk.mobileSearchVolume,
            naverComp: nk.competition, // enum (R-1)
            estimatedVolume: vol > 5000 ? '높음' : vol > 1000 ? '중간' : '낮음',
          };
        }),
      }));
      setKeywordGroups(enriched);
    },
    onError: (msg) => console.error('[naver-kw ai]', msg),
  });

  const googleAiGen = useAiGeneration({
    onComplete: async (text) => {
      const groups = extractGroups(text);
      if (!groups.length) return;
      const allKws = groups.flatMap((g) => g.keywords.map((k) => k.keyword));
      const { locationCode, languageCode } = getLocale(selectedLang);
      try {
        const gRows = await fetchGoogleKeywords(
          allKws,
          locationCode,
          languageCode === '_' ? undefined : languageCode
        );
        const gMap = new Map(gRows.map((r) => [r.keyword, r]));
        const enriched: KeywordGroup[] = groups.map((g) => ({
          ...g,
          keywords: g.keywords.map((k) => {
            const gk = gMap.get(k.keyword) ?? gMap.get(k.keyword.replace(/\s+/g, ''));
            return gk
              ? {
                  ...k,
                  googleVolume: gk.searchVolume,
                  googleComp: String(gk.competition),
                  googleCpc: gk.cpc,
                }
              : k;
          }),
        }));
        setKeywordGroups(enriched);
      } catch {
        setKeywordGroups(groups);
      }
    },
    onError: (msg) => console.error('[google-kw ai]', msg),
  });

  // ── Sort ──────────────────────────────────────────────────────────────────
  const onToggleSort = (col: SortCol, shift: boolean) => {
    setSortCols((prev) => toggleSort(prev, col, shift));
  };

  // ── Category chips ────────────────────────────────────────────────────────
  const categories = [...new Set(keywordGroups.map((g) => g.category))];
  const allKeywords: KeywordItem[] = keywordGroups.flatMap((g) => g.keywords);
  const filteredKeywords = selectedCategory
    ? allKeywords.filter((k) => k.category === selectedCategory)
    : allKeywords;

  // ── Pin stubs (Chunk 2 wires useSavedKeywords) ────────────────────────────
  const savedKeywords = project?.saved_keywords ?? [];
  const isPinned = (keyword: string) => savedKeywords.some((s) => s.keyword === keyword);
  const onTogglePin = (_kw: KeywordItem) => {
    // TODO Chunk 2: wire useSavedKeywords mutation here
  };

  // ── AI keyword-map generators ─────────────────────────────────────────────
  const handleNaverGenerate = () => {
    if (!project) return;
    const langMap: Record<string, string> = {
      ko: 'Korean',
      en: 'English',
      ja: 'Japanese',
      zh: 'Chinese',
      vi: 'Vietnamese',
      th: 'Thai',
    };
    const lang = langMap[selectedLang] ?? 'Korean';
    const prompt = `Generate a comprehensive ${lang} keyword strategy for the following business.
Business: ${project.name}
Industry: ${project.industry || ''}
Brand: ${project.brand_name || project.name}
Description: ${project.brand_description || ''}
${seedKeyword ? `Focus area: ${seedKeyword}` : ''}

Return a JSON array of keyword groups. Each group has "category" (string) and "keywords" (array):
Each keyword object must have: keyword, category, searchIntent (informational|commercial), priority (high|medium|low), estimatedVolume (높음|중간|낮음), difficulty (쉬움|보통|어려움).

Return ONLY valid JSON, no explanation:
[{"category":"카테고리명","keywords":[{"keyword":"...","category":"카테고리명","searchIntent":"informational","priority":"medium","estimatedVolume":"중간","difficulty":"보통"}]}]`;
    setKeywordGroups([]);
    setSortCols([]);
    naverAiGen.generate(prompt, FLASH_MODEL);
  };

  const handleGoogleGenerate = () => {
    if (!project) return;
    const { locationCode } = getLocale(selectedLang);
    const prompt = `Generate Google keyword strategy for location code ${locationCode} (${selectedLang}).
Business: ${project.name}
Industry: ${project.industry || ''}
Brand: ${project.brand_name || project.name}
Description: ${project.brand_description || ''}
${seedKeyword ? `Focus: ${seedKeyword}` : ''}

Return a JSON array same structure as above with keyword, category, searchIntent, priority, estimatedVolume, difficulty.
Return ONLY valid JSON:
[{"category":"Category","keywords":[{"keyword":"...","category":"Category","searchIntent":"commercial","priority":"high","estimatedVolume":"높음","difficulty":"보통"}]}]`;
    setKeywordGroups([]);
    setSortCols([]);
    googleAiGen.generate(prompt, FLASH_MODEL);
  };

  const handleGoldenGenerate = async () => {
    if (!project) return;
    setKeywordGroups([]);
    setGoldenStrategy('');
    try {
      const result = await goldenMutation.mutateAsync({
        project: {
          name: project.name,
          industry: project.industry ?? undefined,
          brand_name: project.brand_name ?? undefined,
          brand_description: project.brand_description ?? undefined,
        },
        seedKeyword: seedKeyword || undefined,
      });
      setKeywordGroups(result.groups);
      setGoldenStrategy(result.strategy);
    } catch (err) {
      console.error('[golden]', err);
    }
  };

  // ── Tab filtering — naver-kw hidden unless ko ─────────────────────────────
  const visibleTabs = ALL_TABS.filter((t) => t.id !== 'naver-kw' || selectedLang === 'ko');

  const isGenerating = naverAiGen.isGenerating || googleAiGen.isGenerating;
  const goldenLoading = goldenMutation.isPending;

  if (!project) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        프로젝트 로딩 중...
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Language tabs */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm font-medium text-muted-foreground">언어:</span>
        <MarketingLanguageTabs
          targetLanguages={project.target_languages}
          selectedLang={selectedLang}
          onLangChange={setSelectedLanguage}
        />
      </div>

      {/* Sub-tab bar */}
      <div className="flex gap-1 border-b">
        {visibleTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setTab(t.id);
              setKeywordGroups([]);
              setSortCols([]);
              setSelectedCategory(null);
              setGoldenStrategy('');
            }}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
              tab === t.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
            )}
          >
            {t.label}
            {t.id === 'saved' && (
              <Badge className="ml-1.5 h-4 px-1 text-xs">{savedKeywords.length}</Badge>
            )}
          </button>
        ))}
      </div>

      {/* ── N 키워드 분석 ─────────────────────────────────────────────────── */}
      {tab === 'naver-kw' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="시드 키워드 입력 (선택)"
              value={seedKeyword}
              onChange={(e) => setSeedKeyword(e.target.value)}
              className="max-w-xs"
            />
            <Button onClick={handleNaverGenerate} disabled={isGenerating}>
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              AI 키워드 분석
            </Button>
          </div>

          {/* Golden tier cards */}
          {(keywordGroups.length > 0 || goldenLoading) && tab === 'naver-kw' && (
            <GoldenTierCards
              groups={keywordGroups}
              strategy={goldenStrategy}
              loading={false}
              onClearStrategy={() => setGoldenStrategy('')}
            />
          )}

          {/* Category chips */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                  !selectedCategory
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border hover:bg-muted/50'
                )}
              >
                전체 ({allKeywords.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                    selectedCategory === cat
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border hover:bg-muted/50'
                  )}
                >
                  {cat} ({keywordGroups.find((g) => g.category === cat)?.keywords.length ?? 0})
                </button>
              ))}
            </div>
          )}

          <KeywordTable
            rows={filteredKeywords}
            columns={NAVER_COLUMNS}
            sortCols={sortCols}
            onToggleSort={onToggleSort}
            isPinned={isPinned}
            onTogglePin={onTogglePin}
            lang={selectedLang}
          />
        </div>
      )}

      {/* ── G 키워드 분석 ─────────────────────────────────────────────────── */}
      {tab === 'google-kw' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="시드 키워드 입력 (선택)"
              value={seedKeyword}
              onChange={(e) => setSeedKeyword(e.target.value)}
              className="max-w-xs"
            />
            <Button onClick={handleGoogleGenerate} disabled={isGenerating}>
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              AI 키워드 분석
            </Button>
          </div>

          {/* Category chips */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                  !selectedCategory
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border hover:bg-muted/50'
                )}
              >
                전체 ({allKeywords.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                    selectedCategory === cat
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border hover:bg-muted/50'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          <KeywordTable
            rows={filteredKeywords}
            columns={GOOGLE_COLUMNS}
            sortCols={sortCols}
            onToggleSort={onToggleSort}
            isPinned={isPinned}
            onTogglePin={onTogglePin}
            lang={selectedLang}
          />
        </div>
      )}

      {/* ── 황금 키워드 (golden) — appears as sub-section of naver-kw ─────── */}
      {/* Golden is triggered from naver-kw tab via the button below */}
      {tab === 'naver-kw' && (
        <div className="border-t pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-2">🏆 황금 키워드 발견</h3>
            <Button
              size="sm"
              variant="outline"
              onClick={handleGoldenGenerate}
              disabled={goldenLoading}
            >
              {goldenLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              황금 키워드 분석
            </Button>
          </div>
          {goldenLoading && (
            <GoldenTierCards
              groups={[]}
              strategy=""
              loading={true}
              onClearStrategy={() => setGoldenStrategy('')}
            />
          )}
        </div>
      )}

      {/* ── 유튜브 / AI 아이디어 / 보관함 — Chunk 2 stubs ─────────────────── */}
      {(tab === 'youtube' || tab === 'ideas' || tab === 'saved') && (
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
          준비 중 (Chunk 2)
        </div>
      )}
    </div>
  );
}

// Re-export for use by IdeasPage (Chunk 3)
export default IdeasDashboard;

// Suppress unused import warning — DEFAULT_TEXT_MODEL is available if needed by model selectors
void DEFAULT_TEXT_MODEL;
