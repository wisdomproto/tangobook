import type { GA4CountryRow } from '../../types/analytics';

const COUNTRY_FLAGS: Record<string, string> = {
  'South Korea': '🇰🇷',
  Korea: '🇰🇷',
  Thailand: '🇹🇭',
  'United States': '🇺🇸',
  Vietnam: '🇻🇳',
  Japan: '🇯🇵',
  China: '🇨🇳',
  Taiwan: '🇹🇼',
  India: '🇮🇳',
  Malaysia: '🇲🇾',
  Indonesia: '🇮🇩',
  Singapore: '🇸🇬',
  Philippines: '🇵🇭',
  Germany: '🇩🇪',
  France: '🇫🇷',
  'United Kingdom': '🇬🇧',
};

interface CountryTrafficProps {
  data: GA4CountryRow[];
}

/**
 * Country-by-country traffic list with flag emojis + session % bar.
 * Port of CF country-traffic.tsx — typed with GA4CountryRow, top-8 entries.
 * Renders null when data is empty (empty-state handled by parent dashboard).
 */
export function CountryTraffic({ data }: CountryTrafficProps) {
  if (!data.length) {
    return (
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-3 break-keep">국가별 트래픽</h3>
        <p className="text-sm text-muted-foreground">데이터 없음</p>
      </div>
    );
  }

  const total = data.reduce((sum, r) => sum + r.sessions, 0);

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <h3 className="text-sm font-semibold mb-3 break-keep">국가별 트래픽</h3>
      <div className="space-y-2">
        {data.slice(0, 8).map((row) => {
          const pct = total > 0 ? Math.round((row.sessions / total) * 100) : 0;
          return (
            <div key={row.country} className="flex items-center gap-3 text-sm">
              <span className="text-base">{COUNTRY_FLAGS[row.country] || '🌐'}</span>
              <span className="flex-1 break-keep">{row.country}</span>
              <span className="tabular-nums text-xs text-muted-foreground">
                {row.sessions.toLocaleString()} ({pct}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
