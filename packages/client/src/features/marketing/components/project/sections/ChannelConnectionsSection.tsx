/**
 * ChannelConnectionsSection — Meta(글로벌) 연동 상태 + 연결/해제.
 *
 * dflo 방식 이식: /api/auth/meta 로 top-level redirect → FB 로그인 → 콜백이 토큰 묶음을
 * 서버에 암호화 저장(글로벌 단일 연동, 프로젝트별 아님). 토큰은 절대 클라로 오지 않는다.
 * YouTube / Naver Blog 는 수동 전용(OAuth 미지원).
 */
import { useEffect } from 'react';
import { Link2, ExternalLink, CheckCircle2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '../../../ui';
import type { Project } from '../../../types/database';
import {
  useMetaConnection,
  useDisconnectMeta,
  startMetaConnect,
} from '../../../api/use-meta-connection';

interface Props {
  project: Project;
  onUpdate: (updates: Partial<Project>) => void;
}

export function ChannelConnectionsSection(_props: Props) {
  const { data: conn, isLoading, refetch } = useMetaConnection();
  const disconnect = useDisconnectMeta();

  // OAuth 복귀 처리: ?meta_connected=1 / ?meta_error=... → 상태 갱신 + URL 정리.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has('meta_connected') || url.searchParams.has('meta_error')) {
      void refetch();
      url.searchParams.delete('meta_connected');
      url.searchParams.delete('meta_error');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  }, [refetch]);

  const connected = !!conn?.connected;
  const pages = conn?.pages ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Link2 size={16} /> 채널 연동
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground break-keep">
          페이스북으로 연결하면 Instagram·Facebook·Threads에 카드뉴스를 직접 발행/예약할 수
          있습니다. 토큰은 서버에 암호화 저장되며 브라우저로 전달되지 않습니다.
        </p>

        {/* Meta 연동 카드 */}
        <div className="p-3 rounded-lg border bg-card space-y-3">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 text-white">
              Meta
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Meta (Instagram / Facebook / Threads)</span>
                {isLoading ? (
                  <Loader2 size={12} className="animate-spin text-muted-foreground" />
                ) : connected ? (
                  <Badge
                    variant="outline"
                    className="text-xs text-green-600 border-green-500/40 gap-1"
                  >
                    <CheckCircle2 size={10} /> 연결됨
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-xs text-muted-foreground border-muted-foreground/30"
                  >
                    미연결
                  </Badge>
                )}
              </div>
              {connected && conn?.userName && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {conn.userName} 계정으로 연결됨
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {connected ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 px-2"
                  disabled={disconnect.isPending}
                  onClick={() => disconnect.mutate()}
                >
                  {disconnect.isPending ? '해제 중…' : '연결 해제'}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 px-2"
                  onClick={() => startMetaConnect(window.location.href)}
                >
                  <ExternalLink size={12} className="mr-1" /> 페이스북 연결
                </Button>
              )}
            </div>
          </div>

          {/* 연결된 페이지·계정 목록 */}
          {connected && pages.length > 0 && (
            <div className="border-t border-border pt-2 space-y-1">
              {pages.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between text-xs text-muted-foreground"
                >
                  <span className="truncate">{p.name}</span>
                  <span className="flex items-center gap-2 shrink-0">
                    {p.instagram && <span>@{p.instagram.username}</span>}
                    <span className="text-[10px] opacity-70">FB·Threads</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg bg-muted/50 border border-border p-2.5 text-xs text-muted-foreground break-keep">
          YouTube / 네이버 블로그는 자동 발행 미지원(수동 전용)입니다. 발행은 콘텐츠의 카드뉴스
          패널에서
          <strong> 소셜 발행</strong> 버튼으로 진행합니다.
        </div>
      </CardContent>
    </Card>
  );
}
