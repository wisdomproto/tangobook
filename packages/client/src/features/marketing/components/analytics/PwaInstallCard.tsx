import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import type { GA4PwaInstalls } from '../../types/analytics';

interface PwaInstallCardProps {
  data?: GA4PwaInstalls;
  isLoading?: boolean;
}

/**
 * PWA "홈에 설치" 누적 카드 — 기간 토글과 무관(전체 기간).
 * - 설치 완료: pwa_install 이벤트(Android·데스크톱 Chrome 실설치 — iOS 미포함)
 * - 홈에서 실행: pwa_standalone 고유 기기(홈에서 앱으로 실행 — iOS 포함 추정)
 */
export function PwaInstallCard({ data, isLoading }: PwaInstallCardProps) {
  const installs = data?.installs ?? 0;
  const standalone = data?.standaloneUsers ?? 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold break-keep">🏠 홈 화면 설치 (누적)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-muted/40 p-3">
            <div className="text-2xl font-black tabular-nums text-foreground">
              {isLoading ? '—' : installs.toLocaleString()}
            </div>
            <div className="mt-0.5 text-xs font-semibold break-keep">설치 완료</div>
            <div className="text-[11px] text-muted-foreground break-keep">Android·데스크톱</div>
          </div>
          <div className="rounded-lg bg-muted/40 p-3">
            <div className="text-2xl font-black tabular-nums text-foreground">
              {isLoading ? '—' : standalone.toLocaleString()}
            </div>
            <div className="mt-0.5 text-xs font-semibold break-keep">홈에서 실행</div>
            <div className="text-[11px] text-muted-foreground break-keep">기기 · iOS 포함</div>
          </div>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground break-keep">
          iOS(아이폰)는 설치 이벤트를 잡을 수 없어 "홈에서 실행"으로 추정합니다. 배포 이후부터
          누적돼요.
        </p>
      </CardContent>
    </Card>
  );
}
