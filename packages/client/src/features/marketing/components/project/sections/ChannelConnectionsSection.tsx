/**
 * ChannelConnectionsSection — displays channel connection status.
 *
 * Meta OAuth (Instagram/Facebook/Threads) requires a server-side OAuth flow at
 * /api/mkt/auth/meta which is NOT built yet (Phase 2).
 * The connect button is rendered but disabled with a clear TODO comment and
 * an alert explaining it is a future feature.
 *
 * YouTube and Naver Blog are always "manual only" (no OAuth support).
 */

import { Link2, ExternalLink, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '../../../ui';
import type { Project, MetaCredentials } from '../../../types/database';

interface ChannelConfig {
  id: string;
  name: string;
  icon: string;
  iconBg: string;
  iconText: string;
  description: string;
  manualOnly?: boolean;
  metaChannel?: boolean;
}

const CHANNELS: ChannelConfig[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    icon: 'IG',
    iconBg: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400',
    iconText: 'text-white',
    description: '인스타그램 카드뉴스/릴스 발행',
    metaChannel: true,
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: 'FB',
    iconBg: 'bg-blue-500',
    iconText: 'text-white',
    description: '페이스북 페이지 포스트 발행',
    metaChannel: true,
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: 'YT',
    iconBg: 'bg-red-600',
    iconText: 'text-white',
    description: '유튜브 영상 업로드 및 관리',
  },
  {
    id: 'threads',
    name: 'Threads',
    icon: 'T',
    iconBg: 'bg-neutral-900',
    iconText: 'text-white',
    description: '스레드 포스트 발행',
    metaChannel: true,
  },
  {
    id: 'naver_blog',
    name: 'Naver Blog',
    icon: 'N',
    iconBg: 'bg-green-500',
    iconText: 'text-white',
    description: '네이버 블로그 포스트 발행',
    manualOnly: true,
  },
];

interface Props {
  project: Project;
  onUpdate: (updates: Partial<Project>) => void;
}

export function ChannelConnectionsSection({ project, onUpdate }: Props) {
  const metaCredentials: MetaCredentials | null = project.meta_credentials ?? null;

  const disconnectMeta = () => {
    onUpdate({ meta_credentials: null });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Link2 size={16} /> 채널 연동
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          채널을 연동하면 ContentFlow에서 직접 콘텐츠를 발행할 수 있습니다.
        </p>

        {/* TODO (Phase 2): Meta OAuth flow — /api/mkt/auth/meta endpoint not yet built.
            When implemented, clicking the Meta 연결 button should redirect to:
            `/api/mkt/auth/meta?projectId=${project.id}`
            The server handles the OAuth handshake and redirects back with
            `?meta_connected=<encoded MetaCredentials>`.
        */}
        <div className="rounded-lg bg-muted/50 border border-border p-2.5 text-xs text-muted-foreground">
          <strong>참고:</strong> Meta (Instagram/Facebook/Threads) OAuth 연동은 Phase 2에서
          구현됩니다. 현재는 API 키 탭에서 직접 액세스 토큰을 입력하세요.
        </div>

        <div className="grid gap-3">
          {CHANNELS.map((channel) => {
            const isMetaConnected = channel.metaChannel && !!metaCredentials;
            return (
              <div key={channel.id} className="p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${channel.iconBg} ${channel.iconText}`}
                  >
                    {channel.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{channel.name}</span>
                      {channel.manualOnly && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0">
                          수동 전용
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{channel.description}</p>
                    {isMetaConnected && metaCredentials && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        {channel.id === 'instagram' && metaCredentials.pages?.[0]?.instagram && (
                          <span>@{metaCredentials.pages[0].instagram.username}</span>
                        )}
                        {channel.id === 'facebook' && metaCredentials.pages?.[0] && (
                          <span>{metaCredentials.pages[0].name}</span>
                        )}
                        {channel.id === 'threads' && <span>{metaCredentials.userName}</span>}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {channel.metaChannel ? (
                      isMetaConnected ? (
                        <>
                          <Badge
                            variant="outline"
                            className="text-xs text-green-600 border-green-500/40 gap-1"
                          >
                            <CheckCircle2 size={10} /> 연결됨
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7 px-2"
                            onClick={disconnectMeta}
                          >
                            연결 해제
                          </Button>
                        </>
                      ) : (
                        <>
                          <Badge
                            variant="outline"
                            className="text-xs text-muted-foreground border-muted-foreground/30"
                          >
                            미연결
                          </Badge>
                          {/* TODO Phase 2: replace disabled with real OAuth redirect */}
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                            className="text-xs h-7 px-2 opacity-50"
                            title="Phase 2에서 구현 예정"
                          >
                            <ExternalLink size={12} className="mr-1" /> Meta 연결
                          </Button>
                        </>
                      )
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-xs text-muted-foreground border-muted-foreground/30"
                      >
                        {channel.manualOnly ? '수동' : '미연결'}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
