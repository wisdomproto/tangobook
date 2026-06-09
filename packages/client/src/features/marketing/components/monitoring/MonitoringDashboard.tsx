import { useMemo, useState } from 'react';
import { SUPPORTED_LANGUAGES } from '@tangobook/shared';
import { cn } from '../../lib/utils';
import { Button, Input } from '../../ui';
import { MarketingLanguageTabs } from '../ideas/MarketingLanguageTabs';
import { fetchAiGenerate } from '../../lib/sse-stream-parser';
import { useProject } from '../../api/use-projects';
import {
  useMonitoringKeywords,
  useAddMonitoringKeyword,
  useRemoveMonitoringKeyword,
} from '../../api/use-monitoring-keywords';
import { useMonitoringSearch } from '../../api/use-monitoring';
import type { MonitoringFeedItem } from '../../types/monitoring';
import { MonitoringFeedCard } from './MonitoringFeedCard';

// ─── Platform filter tabs ───────────────────────────────────────────────────────
// `naver_*` hidden for non-ko (CF behavior). `facebook`/`threads` are present but
// never populated — no search source feeds them (O-3, faithful to CF). The 5 live
// sources are: naver_jisikin, naver_blog, wordpress (google blog), youtube, instagram.

interface PlatformTab {
  id: string;
  label: string;
  icon?: string;
}

const PLATFORMS: PlatformTab[] = [
  { id: 'all', label: '전체' },
  { id: 'naver_jisikin', label: '지식인', icon: '📗' },
  { id: 'naver_blog', label: 'N블로그', icon: '📰' },
  { id: 'wordpress', label: '구글블로그', icon: '🌐' },
  { id: 'youtube', label: '유튜브', icon: '▶️' },
  { id: 'instagram', label: '인스타', icon: '📸' },
  { id: 'facebook', label: '페이스북', icon: '👤' },
  { id: 'threads', label: '스레드', icon: '💬' },
];

// All 5 live sources (ko). Non-ko omits the 2 naver sources (sources gating).
const ALL_SOURCES = ['naver_jisikin', 'naver_blog', 'wordpress', 'youtube', 'instagram'];
const NON_NAVER_SOURCES = ['wordpress', 'youtube', 'instagram'];

interface MonitoringDashboardProps {
  projectId: string;
}

/**
 * 모니터링 / 댓글 dashboard (CF `monitoring-dashboard.tsx` port).
 *
 * Deltas vs CF:
 *  - Keywords collapse from per-lang to **per-project** persisted chips (O-4):
 *    `useMonitoringKeywords` + add/remove hooks (user_id-stamped, supabase-direct).
 *    `selectedLang` drives only which sources/comment-language run, not a separate
 *    keyword set. A non-ko tab can show an **in-memory** translated view of the ko
 *    keywords (번역 button) — that view is NOT persisted.
 *  - Search runs one `useMonitoringSearch` request per keyword; results accumulate
 *    into transient per-lang feed state. Request body carries only
 *    { projectId, keyword, language, sources } — never a secret (R-1).
 *  - Default keywords are empty (R-9 — no customer sample terms).
 */
export function MonitoringDashboard({ projectId }: MonitoringDashboardProps) {
  const { data: project } = useProject(projectId);
  const { data: persistedKeywords = [] } = useMonitoringKeywords(projectId);
  const addKeyword = useAddMonitoringKeyword();
  const removeKeyword = useRemoveMonitoringKeyword();
  const search = useMonitoringSearch();

  const targetLanguages = project?.target_languages ?? [];
  const hasInstagram = Boolean(project?.meta_credentials); // presence-boolean only (R-1)

  const [selectedLang, setSelectedLang] = useState('ko');
  const [platform, setPlatform] = useState('all');
  const [newKeyword, setNewKeyword] = useState('');
  const [translating, setTranslating] = useState(false);
  const [searching, setSearching] = useState(false);

  // In-memory translated keyword views per non-ko language (NOT persisted — O-4).
  const [translatedPerLang, setTranslatedPerLang] = useState<Record<string, string[]>>({});
  // Transient feed results per language (cleared by a fresh search).
  const [feedPerLang, setFeedPerLang] = useState<Record<string, MonitoringFeedItem[]>>({});

  const isKorean = selectedLang === 'ko';

  // The ko keywords are the single persisted source. On a non-ko tab, show the
  // translated in-memory view if one exists, else fall back to the ko keywords.
  const koKeywords = useMemo(() => persistedKeywords.map((k) => k.keyword), [persistedKeywords]);
  const currentKeywords = isKorean ? koKeywords : (translatedPerLang[selectedLang] ?? koKeywords);

  const currentFeed = feedPerLang[selectedLang] ?? [];
  const visiblePlatforms = isKorean
    ? PLATFORMS
    : PLATFORMS.filter((p) => !p.id.startsWith('naver'));
  const filteredFeed =
    platform === 'all' ? currentFeed : currentFeed.filter((f) => f.platform === platform);

  function onLangChange(lang: string) {
    setSelectedLang(lang);
    setPlatform('all');
  }

  function handleAddKeyword() {
    const kw = newKeyword.trim();
    if (!kw) return;
    // Keywords persist per-project (always added to the ko/persisted set — O-4).
    addKeyword.mutate({ projectId, keyword: kw });
    setNewKeyword('');
  }

  function handleRemoveKeyword(kw: string) {
    const row = persistedKeywords.find((k) => k.keyword === kw);
    if (row) removeKeyword.mutate({ id: row.id, projectId });
    // Drop it from any in-memory translated views too.
    setTranslatedPerLang((prev) => {
      const next: Record<string, string[]> = {};
      for (const [lang, list] of Object.entries(prev)) next[lang] = list.filter((k) => k !== kw);
      return next;
    });
  }

  async function handleTranslate() {
    if (isKorean || koKeywords.length === 0) return;
    const meta = SUPPORTED_LANGUAGES.find((s) => s.code === selectedLang);
    const target = meta?.label ?? selectedLang;
    setTranslating(true);
    try {
      const prompt = `Translate these Korean keywords to ${target}. Return ONLY a JSON array of translated strings, no explanation.\n\nKeywords: ${JSON.stringify(
        koKeywords
      )}`;
      const fullText = await fetchAiGenerate(prompt, 'gemini-2.5-flash');
      const match = fullText.match(/\[[\s\S]*\]/);
      if (match) {
        const translated = JSON.parse(match[0]);
        if (Array.isArray(translated)) {
          setTranslatedPerLang((prev) => ({
            ...prev,
            [selectedLang]: translated.map(String),
          }));
        }
      }
    } catch {
      // translation is best-effort; leave the ko fallback view in place
    } finally {
      setTranslating(false);
    }
  }

  async function handleSearch() {
    if (currentKeywords.length === 0) return;
    const sources = isKorean ? ALL_SOURCES : NON_NAVER_SOURCES;
    setSearching(true);
    const accumulated: MonitoringFeedItem[] = [];
    try {
      // One request per keyword (CF behavior). Body carries no secret (R-1).
      for (const keyword of currentKeywords) {
        const items = await search.mutateAsync({
          projectId,
          keyword,
          language: selectedLang,
          sources,
        });
        accumulated.push(...items);
      }
      setFeedPerLang((prev) => ({ ...prev, [selectedLang]: accumulated }));
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="p-6 max-w-5xl space-y-4">
      {/* Language tabs (ko-pinned; editing deferred to settings) */}
      <MarketingLanguageTabs
        targetLanguages={targetLanguages}
        selectedLang={selectedLang}
        onLangChange={onLangChange}
      />

      {/* Keywords + Translate + Search */}
      <div className="flex gap-2 flex-wrap items-center">
        {currentKeywords.map((kw) => (
          <span
            key={kw}
            className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-xs cursor-pointer hover:bg-primary/20 break-keep"
            onClick={() => handleRemoveKeyword(kw)}
          >
            {kw} ×
          </span>
        ))}
        <div className="flex gap-1">
          <Input
            placeholder="키워드 추가"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
            className="h-7 w-32 text-xs"
          />
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleAddKeyword}>
            +
          </Button>
        </div>
        {/* Translate: only on non-ko tabs (in-memory view of ko keywords) */}
        {!isKorean && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={handleTranslate}
            disabled={translating || koKeywords.length === 0}
          >
            {translating ? '번역 중...' : '번역'}
          </Button>
        )}
        <Button
          size="sm"
          className="h-7 text-xs ml-1"
          onClick={handleSearch}
          disabled={searching || currentKeywords.length === 0}
        >
          {searching ? '검색 중...' : '🔍 검색'}
        </Button>
      </div>

      {/* IG empty-state hint (presence boolean only — R-1) */}
      {!hasInstagram && (
        <p className="text-xs text-muted-foreground/70 break-keep">
          인스타그램 계정을 연결하면 인스타 게시물도 함께 검색됩니다. (설정 → 채널 연동)
        </p>
      )}

      {/* Platform tabs with counts */}
      <div className="flex flex-wrap items-center gap-1 border-b border-border">
        {visiblePlatforms.map((p) => {
          const count =
            p.id === 'all'
              ? currentFeed.length
              : currentFeed.filter((f) => f.platform === p.id).length;
          return (
            <button
              key={p.id}
              onClick={() => setPlatform(p.id)}
              className={cn(
                'px-4 py-2.5 text-xs font-medium border-b-2 transition-colors break-keep',
                platform === p.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {p.icon && <span className="mr-1">{p.icon}</span>}
              {p.label}
              {count > 0 && (
                <span className="ml-1.5 bg-muted px-1.5 py-0.5 rounded-full text-[10px]">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Feed */}
      {filteredFeed.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-4xl mb-4">💬</p>
          <p className="text-sm break-keep">
            {currentFeed.length === 0
              ? '키워드를 추가하고 검색하세요'
              : '이 플랫폼에 검색 결과가 없습니다'}
          </p>
          <p className="text-xs mt-2 text-muted-foreground/60 break-keep">
            {isKorean
              ? 'YouTube · 네이버 지식인 · 네이버 블로그 · 구글 블로그에서 실시간 검색합니다'
              : 'YouTube · 구글 블로그에서 실시간 검색합니다'}
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
          {filteredFeed.map((item, idx) => (
            <MonitoringFeedCard
              key={`${item.platform}-${item.id}-${idx}`}
              item={item}
              language={selectedLang}
              projectContext={project?.brand_description ?? undefined}
            />
          ))}
        </div>
      )}

      {/* Alert settings — static display (no backend; faithful to CF) */}
      <div className="bg-card border border-border rounded-lg p-3 border-l-4 border-l-yellow-500 flex items-center gap-2">
        <span className="text-lg">🔔</span>
        <span className="text-sm font-semibold break-keep">알림 설정</span>
        <span className="text-xs text-muted-foreground ml-auto break-keep">
          새 콘텐츠 발견 시 알림 · 일 3회 요약 리포트
        </span>
      </div>
    </div>
  );
}
