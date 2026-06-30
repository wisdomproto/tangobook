import { useState } from 'react';
import { Copy, Check, Monitor, Smartphone } from 'lucide-react';
import { Button } from '../../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../ui/dialog';
import { buildBlogCardsHtml } from '../../lib/channel-translator';
import { cn } from '../../lib/utils';
import type { BlogCard } from '../../types/database';

interface BlogPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cards: BlogCard[];
  title?: string;
}

// 발행 블로그 타이포 — 라이트 고정(실제 발행 화면 모습). 본문 HTML(dangerouslySetInnerHTML)에 적용.
const PUB_PROSE =
  'text-neutral-900 ' +
  '[&_h1]:text-[22px] [&_h1]:font-bold [&_h1]:leading-snug [&_h1]:mb-3 ' +
  '[&_h2]:text-[18px] [&_h2]:font-semibold [&_h2]:mt-7 [&_h2]:mb-2.5 ' +
  '[&_h3]:text-[16px] [&_h3]:font-semibold [&_h3]:mt-5 [&_h3]:mb-2 ' +
  '[&_p]:text-[15px] [&_p]:leading-[1.75] [&_p]:mb-3.5 [&_p]:text-neutral-800 ' +
  '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3.5 ' +
  '[&_li]:mb-1 [&_li]:text-[15px] [&_li]:leading-[1.7] ' +
  '[&_strong]:font-semibold ' +
  '[&_a]:text-[#1a73e8] [&_a]:no-underline ' +
  '[&_blockquote]:border-l-4 [&_blockquote]:border-neutral-200 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-neutral-500';

export function BlogPreviewDialog({ open, onOpenChange, cards, title }: BlogPreviewDialogProps) {
  const [copied, setCopied] = useState(false);

  const html = buildBlogCardsHtml(cards);
  const fullHtml = title ? `<h1>${title}</h1>\n\n${html}` : html;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullHtml);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = fullHtml;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const sorted = cards.slice().sort((a, b) => a.sort_order - b.sort_order);

  // 흰 발행 캔버스 본문 — PC/모바일 양쪽에서 각각 렌더한다.
  const renderBody = () => (
    <article className={cn('px-5 py-6', PUB_PROSE)}>
      {title && (
        <h1 className="text-[22px] font-bold leading-snug mb-4 text-neutral-900">{title}</h1>
      )}
      {sorted.map((card) => {
        const c = card.content as { text?: string; url?: string; alt?: string; caption?: string };
        return (
          <div key={card.id}>
            {c.url && (
              <figure className="my-4">
                <img
                  src={c.url}
                  alt={c.alt ?? ''}
                  className="w-full rounded-xl border border-neutral-100"
                />
                {c.caption && (
                  <figcaption className="text-[13px] text-neutral-500 text-center mt-2">
                    {c.caption}
                  </figcaption>
                )}
              </figure>
            )}
            {c.text && <div dangerouslySetInnerHTML={{ __html: c.text }} />}
          </div>
        );
      })}
    </article>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl h-[88vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="pr-8">
            {title ? `미리보기: ${title}` : '블로그 미리보기'}
          </DialogTitle>
          <DialogDescription>
            실제 발행 화면 모습입니다. PC·모바일을 한 화면에서 나란히 비교할 수 있어요.
          </DialogDescription>
        </DialogHeader>

        {/* Toolbar — HTML 복사 (PC/모바일은 동시 표시라 토글 없음) */}
        <div className="flex items-center shrink-0 border-b border-border pb-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
            className="ml-auto gap-1.5 text-xs"
          >
            {copied ? (
              <>
                <Check size={13} className="text-green-500" /> 복사됨
              </>
            ) : (
              <>
                <Copy size={13} /> HTML 복사
              </>
            )}
          </Button>
        </div>

        {cards.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
            섹션이 없습니다. 먼저 블로그를 생성하세요.
          </div>
        ) : (
          // PC + 모바일 나란히 (회색 캔버스 위 흰 발행 화면)
          <div className="flex-1 overflow-hidden bg-neutral-100 dark:bg-neutral-900 p-4">
            <div className="flex gap-6 h-full justify-center">
              {/* PC */}
              <div className="flex flex-col min-w-0 flex-1 max-w-[680px]">
                <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1 shrink-0">
                  <Monitor size={13} /> PC
                </div>
                <div className="flex-1 overflow-y-auto bg-white rounded-lg shadow-sm">
                  {renderBody()}
                </div>
              </div>

              {/* 모바일 — 폰 프레임 */}
              <div className="flex flex-col shrink-0">
                <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1 shrink-0">
                  <Smartphone size={13} /> 모바일
                </div>
                <div
                  className="bg-white shadow-2xl overflow-hidden"
                  style={{ width: 340, border: '10px solid #262626', borderRadius: '2.25rem' }}
                >
                  <div
                    className="bg-neutral-800 flex items-center justify-center"
                    style={{ height: 24 }}
                  >
                    <div
                      style={{ width: 80, height: 6, borderRadius: 999, background: '#525252' }}
                    />
                  </div>
                  <div className="overflow-y-auto" style={{ maxHeight: 'calc(88vh - 170px)' }}>
                    {renderBody()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
