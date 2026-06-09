import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import type { GA4TopPage } from '../../types/analytics';

interface TopPagesTableProps {
  /** top-15 pages from GA4 (server returns up to 15). */
  pages: GA4TopPage[];
  /** Optional website base URL to compose full links (e.g. "https://tangobook.co.kr"). */
  websiteUrl?: string;
}

/**
 * Top-pages table: path / title / views / users.
 * Port of CF top-pages-table.tsx — renamed prop `data` → `pages` per plan §6 spec.
 * Shows top 15 (server already limits to 15; we take up to 15 here for safety).
 */
export function TopPagesTable({ pages, websiteUrl }: TopPagesTableProps) {
  if (!pages.length) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold break-keep">인기 페이지 TOP 15</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">데이터 없음</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold break-keep">인기 페이지 TOP 15</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th className="text-left py-2 font-semibold break-keep">페이지</th>
                <th className="text-right py-2 font-semibold break-keep">뷰</th>
                <th className="text-right py-2 font-semibold break-keep">사용자</th>
              </tr>
            </thead>
            <tbody>
              {pages.slice(0, 15).map((page, i) => (
                <tr key={i} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="py-2">
                    <div className="font-medium text-xs truncate max-w-[300px]">
                      {page.title || page.path}
                    </div>
                    <div className="text-xs text-muted-foreground truncate max-w-[300px]">
                      {websiteUrl ? `${websiteUrl}${page.path}` : page.path}
                    </div>
                  </td>
                  <td className="text-right font-bold tabular-nums">
                    {page.views.toLocaleString()}
                  </td>
                  <td className="text-right tabular-nums text-muted-foreground">
                    {page.users.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
