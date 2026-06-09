import { useState } from 'react';
import { cn } from '../../lib/utils';
import { useProject } from '../../api/use-projects';
import { useMetaInsights } from '../../api/use-analytics';
import { YoutubeChannelPanel } from './YoutubeChannelPanel';
import { WebsiteSeoPanel } from './WebsiteSeoPanel';
import type { MetaContentMetric, MetaOverviewMetrics } from '../../types/analytics';

// ─── Country / Platform data ──────────────────────────────────────────────────

const COUNTRIES = [
  { code: 'ko', flag: '🇰🇷', name: '한국' },
  { code: 'en', flag: '🇺🇸', name: '미국' },
  { code: 'th', flag: '🇹🇭', name: '태국' },
  { code: 'vi', flag: '🇻🇳', name: '베트남' },
];

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', icon: '📸', color: 'from-[#f09433] to-[#dc2743]' },
  { id: 'facebook', label: 'Facebook', icon: '👤', color: 'from-[#1877f2] to-[#1877f2]' },
  { id: 'threads', label: 'Threads', icon: '💬', color: 'from-[#000] to-[#333]' },
  { id: 'youtube', label: 'YouTube', icon: '🎬', color: 'from-[#ff0000] to-[#cc0000]' },
  { id: 'website', label: '웹사이트', icon: '🌐', color: 'from-[#4285f4] to-[#34a853]' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatNumber(n: number): string {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000) return `${(n / 10_000).toFixed(1)}만`;
  if (n >= 1_000) return n.toLocaleString();
  return String(n);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetaOverviewCards({ overview }: { overview: MetaOverviewMetrics }) {
  const items = [
    { label: '팔로워', value: overview.followers, growth: overview.followersGrowth },
    { label: '도달', value: overview.totalReach, growth: overview.reachGrowth },
    { label: '참여', value: overview.totalEngagement, growth: overview.engagementGrowth },
    { label: '참여율', value: overview.avgEngagementRate, growth: 0, suffix: '%' as const },
  ];
  return (
    <div className="grid grid-cols-4 gap-3">
      {items.map((m) => (
        <div key={m.label} className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground mb-1 break-keep">{m.label}</div>
          <div className="text-2xl font-bold">
            {m.suffix === '%' ? m.value.toFixed(1) : m.value.toLocaleString()}
            {m.suffix ?? ''}
          </div>
          <div className={cn('text-xs', m.growth >= 0 ? 'text-green-500' : 'text-red-500')}>
            {m.growth >= 0 ? '▲' : '▼'} {Math.abs(m.growth)}%
          </div>
        </div>
      ))}
    </div>
  );
}

function ContentTable({ contents }: { contents: MetaContentMetric[] }) {
  if (contents.length === 0) return null;
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold break-keep">콘텐츠별 성과</h3>
        <span className="text-xs text-muted-foreground">{contents.length}개 게시물</span>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="text-left px-4 py-2 font-medium text-muted-foreground break-keep">
              콘텐츠
            </th>
            <th className="text-right px-4 py-2 font-medium text-muted-foreground">도달</th>
            <th className="text-right px-4 py-2 font-medium text-muted-foreground">노출</th>
            <th className="text-right px-4 py-2 font-medium text-muted-foreground">참여</th>
            <th className="text-right px-4 py-2 font-medium text-muted-foreground">참여율</th>
            <th className="text-right px-4 py-2 font-medium text-muted-foreground">❤️</th>
            <th className="text-right px-4 py-2 font-medium text-muted-foreground">💬</th>
            <th className="text-right px-4 py-2 font-medium text-muted-foreground">🔄</th>
            <th className="text-right px-4 py-2 font-medium text-muted-foreground">🔖</th>
          </tr>
        </thead>
        <tbody>
          {contents.map((c) => (
            <tr key={c.id} className="border-b border-border hover:bg-muted/30">
              <td className="px-4 py-3">
                <div className="font-medium line-clamp-1 break-keep">
                  {c.title || '(캡션 없음)'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {c.type} · {c.date}
                </div>
              </td>
              <td className="text-right px-4 py-3">{c.reach.toLocaleString()}</td>
              <td className="text-right px-4 py-3">{c.impressions.toLocaleString()}</td>
              <td className="text-right px-4 py-3">{c.engagement.toLocaleString()}</td>
              <td className="text-right px-4 py-3">{c.engagementRate.toFixed(1)}%</td>
              <td className="text-right px-4 py-3">{c.likes.toLocaleString()}</td>
              <td className="text-right px-4 py-3">{c.comments.toLocaleString()}</td>
              <td className="text-right px-4 py-3">{c.shares.toLocaleString()}</td>
              <td className="text-right px-4 py-3">{c.saves.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BestContent({ contents }: { contents: MetaContentMetric[] }) {
  const best = [...contents].sort((a, b) => b.engagement - a.engagement).slice(0, 3);
  const totalEng = contents.reduce((s, c) => s + c.engagement, 0);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3">🏆 최고 성과 콘텐츠</h3>
        {best.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-xs break-keep">
            데이터 연동 후 표시됩니다
          </div>
        ) : (
          <div className="space-y-2">
            {best.map((c, i) => (
              <div key={c.id} className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground w-4 shrink-0">{i + 1}.</span>
                <span className="flex-1 line-clamp-1 text-xs break-keep">
                  {c.title || '(캡션 없음)'}
                </span>
                <span className="text-xs text-muted-foreground shrink-0">
                  ❤️ {c.likes} 💬 {c.comments}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3">📈 성장 트렌드</h3>
        {contents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-xs break-keep">
            데이터 연동 후 표시됩니다
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground break-keep">총 게시물</span>
              <span className="font-medium">{contents.length.toLocaleString()}개</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground break-keep">총 참여수</span>
              <span className="font-medium">{totalEng.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground break-keep">게시물당 평균 참여</span>
              <span className="font-medium">
                {contents.length > 0 ? Math.round(totalEng / contents.length).toLocaleString() : 0}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Meta platform panel (IG / FB / Threads) ─────────────────────────────────

interface MetaPanelProps {
  projectId: string;
  platform: string;
  country: string;
  accountLabel: string;
}

function MetaPlatformPanel({ projectId, platform, country, accountLabel }: MetaPanelProps) {
  const { data, isLoading } = useMetaInsights(projectId, platform, country);

  const connected = data?.connected ?? false;

  if (isLoading) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin inline-block mb-2" />
        <p>인사이트 데이터를 불러오는 중...</p>
      </div>
    );
  }

  const platformLabel = PLATFORMS.find((p) => p.id === platform)?.label ?? platform;
  const countryLabel = COUNTRIES.find((c) => c.code === country)?.name ?? country;

  return (
    <div className="space-y-4">
      {/* Account header */}
      <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
        <div
          className={cn(
            'w-12 h-12 bg-gradient-to-br rounded-full flex items-center justify-center text-white text-lg',
            platform === 'instagram'
              ? 'from-[#f09433] to-[#dc2743]'
              : platform === 'facebook'
                ? 'from-[#1877f2] to-[#1877f2]'
                : 'from-[#000] to-[#333]'
          )}
        >
          {platform === 'instagram' ? '📸' : platform === 'facebook' ? '👤' : '💬'}
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold break-keep">
            {platform === 'instagram' ? '@' : ''}
            {accountLabel}
          </div>
          <div className="text-xs text-muted-foreground break-keep">
            {platformLabel} · {countryLabel}
          </div>
        </div>
        <div className="text-xs">
          {!connected ? (
            <span className="text-orange-500 break-keep">Meta 연결 필요 — 설정 → 채널 연동</span>
          ) : (
            <span className="text-green-500">연결됨</span>
          )}
        </div>
      </div>

      {/* Not connected empty state (R-9 / spec §6.2 — graceful) */}
      {!connected ? (
        <div className="bg-card border border-border rounded-lg text-center py-16 text-muted-foreground space-y-2">
          <p className="text-4xl">🔗</p>
          <p className="text-sm font-medium break-keep">Meta 계정을 연결해 주세요</p>
          <p className="text-xs break-keep">
            설정 → 채널 연동에서 Meta(Instagram/Facebook) 계정을 연결하면
            <br />
            실제 인사이트 데이터를 확인할 수 있습니다.
          </p>
        </div>
      ) : (
        <>
          <MetaOverviewCards overview={data!.overview} />
          {data!.contents.length === 0 ? (
            <div className="bg-card border border-border rounded-lg text-center py-16 text-muted-foreground">
              <p className="text-4xl mb-4">📱</p>
              <p className="text-sm break-keep">
                {platform === 'threads'
                  ? 'Threads API는 아직 공개되지 않았습니다'
                  : '게시물이 없거나 데이터를 불러올 수 없습니다'}
              </p>
            </div>
          ) : (
            <>
              <ContentTable contents={data!.contents} />
              <BestContent contents={data!.contents} />
            </>
          )}
        </>
      )}
    </div>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

interface Props {
  projectId: string;
}

export function MetaAnalyticsDashboard({ projectId }: Props) {
  const { data: project } = useProject(projectId);
  const targetLanguages: string[] = project?.target_languages ?? ['ko'];
  const brandName = project?.brand_name || project?.name || '';
  const websiteUrl = project?.funnel_config?.websiteUrl ?? '';

  const [selectedCountry, setSelectedCountry] = useState('ko');
  const [selectedPlatform, setSelectedPlatform] = useState('instagram');
  const [period, setPeriod] = useState('30');

  // Filter countries to project's target languages (faithful to CF :89)
  const availableCountries = COUNTRIES.filter((c) => targetLanguages.includes(c.code));

  const isMetaPlatform =
    selectedPlatform === 'instagram' ||
    selectedPlatform === 'facebook' ||
    selectedPlatform === 'threads';

  // Build account label for the active platform+country combo (R-9: no hardcoded customer name)
  function buildAccountLabel(): string {
    const countryCode = selectedCountry;
    if (countryCode === 'ko') return brandName;
    return `${brandName}_${countryCode}`;
  }

  return (
    <div className="p-6 max-w-6xl space-y-6">
      {/* Country tabs — only for Meta platforms (faithful to CF :295-326) */}
      {isMetaPlatform && (
        <div className="flex items-center gap-4">
          <div className="flex gap-1">
            {availableCountries.map((country) => (
              <button
                key={country.code}
                onClick={() => setSelectedCountry(country.code)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm flex items-center gap-1.5 transition-colors break-keep',
                  selectedCountry === country.code
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent'
                )}
              >
                {country.flag} {country.name}
              </button>
            ))}
          </div>
          <div className="ml-auto flex gap-2">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-muted text-sm rounded-md px-3 py-1.5 border border-border"
            >
              <option value="7">최근 7일</option>
              <option value="30">최근 30일</option>
              <option value="90">최근 90일</option>
            </select>
          </div>
        </div>
      )}

      {/* Platform tabs (faithful to CF :329-345) */}
      <div className="flex gap-2 flex-wrap">
        {PLATFORMS.map((platform) => (
          <button
            key={platform.id}
            onClick={() => setSelectedPlatform(platform.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border',
              selectedPlatform === platform.id
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border text-muted-foreground hover:text-foreground'
            )}
          >
            <span className="text-lg">{platform.icon}</span>
            {platform.label}
          </button>
        ))}
      </div>

      {/* YouTube tab */}
      {selectedPlatform === 'youtube' && <YoutubeChannelPanel projectId={projectId} />}

      {/* Website SEO tab */}
      {selectedPlatform === 'website' && <WebsiteSeoPanel defaultUrl={websiteUrl} />}

      {/* Meta platforms: Instagram / Facebook / Threads */}
      {isMetaPlatform && (
        <MetaPlatformPanel
          key={`${selectedPlatform}-${selectedCountry}`}
          projectId={projectId}
          platform={selectedPlatform}
          country={selectedCountry}
          accountLabel={buildAccountLabel()}
        />
      )}
    </div>
  );
}

// Re-export for convenient use
export { formatNumber };
