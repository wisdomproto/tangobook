import { useState } from 'react';
import { cn } from '../../lib/utils';
import { Button } from '../../ui';
import { useMonitoringComment } from '../../api/use-monitoring';
import type { MonitoringFeedItem } from '../../types/monitoring';

const PLATFORM_ICONS: Record<string, string> = {
  instagram: '📸',
  facebook: '👤',
  threads: '💬',
  naver_jisikin: '📗',
  naver_blog: '📰',
  wordpress: '🌐',
  youtube: '▶️',
};

interface MonitoringFeedCardProps {
  item: MonitoringFeedItem;
  /** Comment language — driven by the dashboard's selected language tab. */
  language: string;
  /** Optional brand/project context passed to the comment generator. */
  projectContext?: string;
}

/** Relative "n일 전" formatting for an ISO/parseable date string. */
function formatPublished(val?: string): string {
  if (!val) return '';
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days <= 0) return '오늘';
  if (days === 1) return '어제';
  if (days < 30) return `${days}일 전`;
  return d.toLocaleDateString('ko-KR');
}

/**
 * One monitoring feed item (CF `monitoring-dashboard` feed card, extracted).
 * The AI 댓글 block calls `useMonitoringComment` — the request body carries only
 * the snippet/title + platform/tone/language (never a secret). R-1.
 */
export function MonitoringFeedCard({ item, language, projectContext }: MonitoringFeedCardProps) {
  const commentMutation = useMonitoringComment();
  const [comment, setComment] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function generate() {
    setError(null);
    commentMutation.mutate(
      {
        contentText: item.snippet || item.title,
        platform: item.platform,
        tone: 'professional',
        language,
        ...(projectContext ? { projectContext } : {}),
      },
      {
        onSuccess: (text) => {
          if (text) setComment(text);
          else setError('댓글을 생성하지 못했습니다. 다시 시도해 주세요.');
        },
        onError: () => setError('댓글 생성 중 오류가 발생했습니다. 다시 시도해 주세요.'),
      }
    );
  }

  function copy() {
    if (!comment) return;
    void navigator.clipboard.writeText(comment);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  const loading = commentMutation.isPending;

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      {/* Header */}
      <div className="flex items-start gap-2 mb-2">
        <span className="text-base leading-none mt-0.5">
          {PLATFORM_ICONS[item.platform] || '🌐'}
        </span>
        <div className="flex-1 min-w-0">
          {item.url ? (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold hover:underline line-clamp-2 break-keep"
            >
              {item.title}
            </a>
          ) : (
            <p className="text-sm font-semibold line-clamp-2 break-keep">{item.title}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-0.5">
            {item.author && (
              <span className="text-xs text-muted-foreground break-keep">{item.author}</span>
            )}
            {item.publishedAt && (
              <span className="text-xs text-muted-foreground">
                {formatPublished(item.publishedAt)}
              </span>
            )}
            {item.views && <span className="text-xs text-muted-foreground">👁️ {item.views}</span>}
            {item.engagement && (
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span>❤️ {item.engagement.likes.toLocaleString()}</span>
                <span>💬 {item.engagement.comments.toLocaleString()}</span>
              </span>
            )}
          </div>
        </div>
        {item.thumbnail && (
          <img
            src={item.thumbnail}
            alt=""
            className={cn(
              'object-cover rounded flex-shrink-0',
              item.platform === 'youtube' ? 'w-28 h-16' : 'w-16 h-16'
            )}
          />
        )}
      </div>

      {/* Snippet */}
      {item.snippet && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3 break-keep">{item.snippet}</p>
      )}

      {/* AI comment block */}
      {comment ? (
        <div className="bg-muted rounded-md p-3 border-l-2 border-primary">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-primary font-semibold break-keep">✨ AI 댓글 제안</span>
            <Button
              size="sm"
              variant="ghost"
              className="h-5 text-[10px] ml-auto"
              onClick={generate}
              disabled={loading}
            >
              {loading ? '재생성 중...' : '재생성'}
            </Button>
          </div>
          <p className="text-sm mb-2 break-keep whitespace-pre-wrap">{comment}</p>
          <div className="flex gap-2">
            <Button size="sm" className="h-6 text-xs" onClick={copy}>
              {copied ? '✅ 복사됨' : '📋 복사'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            onClick={generate}
            disabled={loading}
          >
            {loading ? '생성 중...' : '✨ AI 댓글 생성'}
          </Button>
          {error && <p className="text-xs text-destructive break-keep">{error}</p>}
        </div>
      )}
    </div>
  );
}
